import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { createDocumentSchema } from '@/lib/validations'
import { sanitizeField, ensureStackSignature } from '@/lib/sanitize'
import { contentFingerprint, type DuplicateCheckResult } from '@/lib/content-hash'
import { checkDuplicates } from './duplicates'
import { handleDbError } from './db-errors'

/**
 * Create or update a document with duplicate detection.
 *
 * Pipeline (preserved verbatim from the original POST handler):
 *  1. Zod-validate body → 400 on validation error
 *  2. Sanitize title + content (ensure stack signature; fall back to raw
 *     content if sanitize produces empty string)
 *  3. Non-blocking duplicate check (failures are logged but do not abort)
 *  4. If exact duplicate: 409 unless forceCreate → update existing (200)
 *  5. If similar duplicate: 409 unless forceCreate → fall through to create
 *  6. Create new document → 201 (or DB error response)
 */
export async function createDocument(
  body: Record<string, unknown>
): Promise<NextResponse> {
  // ── 1. Validate body ────────────────────────────────────────────────
  const parsed = createDocumentSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    const message = Object.entries(fieldErrors)
      .map(([field, errs]) => `${field}: ${(errs as string[]).join(', ')}`)
      .join('; ')
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { title, content, fileName, fileType, fileSize, categoryId, tagIds } = parsed.data
  const normalizedCategoryId =
    categoryId && categoryId !== 'none' && categoryId !== 'all' ? categoryId : null

  // ── 2. Sanitize ─────────────────────────────────────────────────────
  const cleanTitle = sanitizeField(title, 'document.title')
  let cleanContent = ensureStackSignature(sanitizeField(content, 'document.content'))

  // Safety: ensure content is never empty after sanitize (signature alone is ~60 chars)
  if (!cleanContent.trim()) {
    cleanContent = ensureStackSignature(content)
  }

  // ── 3. Duplicate detection (non-blocking: skip on failure) ──────────
  let dupResult: DuplicateCheckResult = {
    severity: 'none',
    existingId: null,
    existingTitle: null,
    message: null,
  }
  try {
    const fp = contentFingerprint(cleanContent)
    dupResult = await checkDuplicates(cleanTitle, cleanContent, fp)
  } catch (dupError) {
    // Dedup check failing should NOT block document creation
    console.warn(
      '[documents] Duplicate check failed, proceeding anyway:',
      dupError instanceof Error ? dupError.message : dupError
    )
  }

  // ── 4. Exact duplicate ──────────────────────────────────────────────
  if (dupResult.severity === 'exact') {
    if (!body.forceCreate) {
      return NextResponse.json(
        {
          error: dupResult.message,
          existingId: dupResult.existingId,
          severity: 'exact',
        },
        { status: 409 }
      )
    }
    // forceCreate=true → update existing document instead of creating duplicate
    try {
      const updated = await db.document.update({
        where: { id: dupResult.existingId! },
        data: {
          title: cleanTitle,
          content: cleanContent,
          fileName: fileName || title,
          fileType,
          fileSize,
          categoryId: normalizedCategoryId,
        },
        include: {
          category: true,
          tags: { include: { tag: true } },
        },
      })
      return NextResponse.json({ ...updated, _updated: true }, { status: 200 })
    } catch (updateError) {
      console.error(
        '[documents] Update existing failed:',
        updateError instanceof Error ? updateError.message : updateError
      )
      return handleDbError(updateError)
    }
  }

  // ── 5. Similar duplicate ────────────────────────────────────────────
  if (dupResult.severity === 'similar') {
    if (!body.forceCreate) {
      return NextResponse.json(
        {
          error: dupResult.message,
          existingId: dupResult.existingId,
          severity: 'similar',
        },
        { status: 409 }
      )
    }
    // forceCreate=true → user confirmed they want to create anyway
  }

  // ── 6. Create document ──────────────────────────────────────────────
  const data: Prisma.DocumentCreateInput = {
    title: cleanTitle,
    content: cleanContent,
    fileName: fileName || title,
    fileType,
    fileSize,
    category: normalizedCategoryId ? { connect: { id: normalizedCategoryId } } : undefined,
    tags: tagIds?.length
      ? {
          create: tagIds.map((tagId: string) => ({
            tag: { connect: { id: tagId } },
          })),
        }
      : undefined,
  }

  try {
    const document = await db.document.create({
      data,
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    })
    return NextResponse.json(document, { status: 201 })
  } catch (createError) {
    return handleDbError(createError)
  }
}
