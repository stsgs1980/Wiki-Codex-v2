import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { createDocumentSchema, paginationSchema } from '@/lib/validations'
import { sanitizeField, ensureStackSignature } from '@/lib/sanitize'
import { contains } from '@/lib/db-filter'
import { computeContentHash, contentFingerprint, type DuplicateCheckResult } from '@/lib/content-hash'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = paginationSchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors
      const msg = Object.entries(fe).map(([f, e]) => `${f}: ${(e as string[]).join(', ')}`).join('; ')
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    const { search, categoryId, tagId, starred, page, limit } = parsed.data

    const where: Prisma.DocumentWhereInput = {}

    if (search) {
      where.OR = [
        { title: contains(search) },
        { content: contains(search) },
        { summary: contains(search) },
      ]
    }

    if (categoryId && categoryId !== 'none' && categoryId !== 'all') {
      where.categoryId = categoryId
    }

    if (tagId && tagId !== 'none' && tagId !== 'all') {
      where.tags = { some: { tagId } }
    }

    if (starred === 'true') {
      where.isStarred = true
    }

    const [documents, total, allTotal, allStarred] = await Promise.all([
      db.document.findMany({
        where,
        include: {
          category: true,
          tags: { include: { tag: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.document.count({ where }),
      db.document.count(),
      db.document.count({ where: { isStarred: true } }),
    ])

    return NextResponse.json({
      documents,
      total,
      allTotal,
      allStarred,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // ── 1. Parse & validate body ────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createDocumentSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    const message = Object.entries(fieldErrors)
      .map(([field, errs]) => `${field}: ${(errs as string[]).join(', ')}`)
      .join('; ')
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { title, content, fileName, fileType, fileSize, categoryId, tagIds } = parsed.data
  const normalizedCategoryId = categoryId && categoryId !== 'none' && categoryId !== 'all' ? categoryId : null

  // ── 2. Sanitize ─────────────────────────────────────────────────────
  const cleanTitle = sanitizeField(title, 'document.title')
  let cleanContent = ensureStackSignature(sanitizeField(content, 'document.content'))

  // Safety: ensure content is never empty after sanitize (signature alone is ~60 chars)
  if (!cleanContent.trim()) {
    cleanContent = ensureStackSignature(content)
  }

  // ── 3. Compute content hash (non-blocking: fallback on failure) ────
  let contentHash: string | null = null
  try {
    contentHash = await computeContentHash(cleanContent)
  } catch (hashError) {
    // crypto.subtle may be unavailable in some edge runtimes
    console.warn('[documents] computeContentHash failed, using fallback:', hashError instanceof Error ? hashError.message : hashError)
    // Fallback: simple hash from content length + first 100 chars
    const stub = cleanContent.substring(0, 100) + cleanContent.length
    const encoder = new TextEncoder()
    let h = 0
    for (const byte of encoder.encode(stub)) {
      h = ((h << 5) - h + byte) | 0
    }
    contentHash = 'fb-' + Math.abs(h).toString(16).padStart(16, '0')
  }

  // ── 4. Duplicate detection (non-blocking: skip on failure) ──────────
  let dupResult: DuplicateCheckResult = { severity: 'none', existingId: null, existingTitle: null, message: null }
  try {
    const fp = contentFingerprint(cleanContent)
    dupResult = await checkDuplicates(cleanTitle, contentHash, cleanContent, fp)
  } catch (dupError) {
    // Dedup check failing should NOT block document creation
    console.warn('[documents] Duplicate check failed, proceeding anyway:', dupError instanceof Error ? dupError.message : dupError)
  }

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
    // Try with contentHash first, then without (column may not exist on prod)
    const updateData = {
      title: cleanTitle,
      content: cleanContent,
      fileName: fileName || title,
      fileType,
      fileSize,
      categoryId: normalizedCategoryId,
    }
    const updateInclude = {
      category: true,
      tags: { include: { tag: true } },
    }
    try {
      const updated = await db.document.update({
        where: { id: dupResult.existingId! },
        data: { ...updateData, contentHash },
        include: updateInclude,
      })
      return NextResponse.json({ ...updated, _updated: true }, { status: 200 })
    } catch (updateError) {
      const errMsg = updateError instanceof Error ? updateError.message : String(updateError)
      if (errMsg.includes('contentHash') || errMsg.includes('does not exist') || errMsg.includes('column')) {
        console.warn('[documents] Retrying update without contentHash (column may not exist)')
        try {
          const updated = await db.document.update({
            where: { id: dupResult.existingId! },
            data: updateData,
            include: updateInclude,
          })
          return NextResponse.json({ ...updated, _updated: true }, { status: 200 })
        } catch (retryError) {
          console.error('[documents] Update without contentHash also failed:', retryError instanceof Error ? retryError.message : retryError)
          return handleDbError(retryError)
        }
      }
      console.error('[documents] Update existing failed:', errMsg)
      return handleDbError(updateError)
    }
  }

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

  // ── 5. Create document ──────────────────────────────────────────────

  const baseData = {
    title: cleanTitle,
    content: cleanContent,
    fileName: fileName || title,
    fileType,
    fileSize,
    categoryId: normalizedCategoryId,
  }

  const tagsData = tagIds?.length
    ? {
        create: tagIds.map((tagId: string) => ({
          tag: { connect: { id: tagId } },
        })),
      }
    : undefined

  const includeData = {
    category: true,
    tags: { include: { tag: true } },
  }

  // Try with contentHash first, then without (column may not exist on prod)
  let document
  try {
    document = await db.document.create({
      data: { ...baseData, contentHash, tags: tagsData },
      include: includeData,
    })
  } catch (firstError) {
    console.error('[documents] DB create with contentHash failed:', firstError instanceof Error ? firstError.message : firstError)

    // If contentHash column doesn't exist in DB (migration not run), retry without it
    const errMsg = firstError instanceof Error ? firstError.message : String(firstError)
    if (errMsg.includes('contentHash') || errMsg.includes('column') || errMsg.includes('does not exist')) {
      console.warn('[documents] Retrying without contentHash (column may not exist)')
      try {
        document = await db.document.create({
          data: { ...baseData, tags: tagsData },
          include: includeData,
        })
      } catch (secondError) {
        console.error('[documents] DB create without contentHash also failed:', secondError instanceof Error ? secondError.message : secondError)
        return handleDbError(secondError)
      }
    } else {
      return handleDbError(firstError)
    }
  }

  return NextResponse.json(document, { status: 201 })
}

/** Handle DB errors with specific Prisma error detection */
function handleDbError(error: unknown): NextResponse {
  console.error('[documents] DB error:', error)
  const errMsg = error instanceof Error ? error.message : String(error)

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2003: Foreign key constraint failed
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: `Указанная категория или тег не существует (${error.meta?.field_name ?? 'unknown'})` },
        { status: 400 }
      )
    }
    // P2002: Unique constraint failed
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Документ с такими данными уже существует' },
        { status: 409 }
      )
    }
    // P2021: Table doesn't exist
    if (error.code === 'P2021') {
      return NextResponse.json(
        { error: 'Таблица документов не найдена. Необходима миграция БД.' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json(
    { error: `Ошибка создания документа: ${errMsg.substring(0, 200)}` },
    { status: 500 }
  )
}

/**
 * Three-level duplicate check:
 * 1. Exact title match (case-insensitive)
 * 2. Exact content hash match (identical content)
 * 3. Content similarity (near-duplicates with minor edits)
 */
async function checkDuplicates(
  title: string,
  contentHash: string | null,
  content: string,
  fp: { head: string; tail: string; length: number }
): Promise<DuplicateCheckResult> {
  // Level 1: Title match (case-insensitive at application level)
  const byTitleCandidates = await db.document.findMany({
    where: { title: contains(title) },
    select: { id: true, title: true, content: true },
  })
  const byTitle = byTitleCandidates.find(
    (d) => d.title.toLowerCase() === title.toLowerCase()
  )
  if (byTitle) {
    return {
      severity: 'exact',
      existingId: byTitle.id,
      existingTitle: byTitle.title,
      message: `Документ с заголовком "${byTitle.title}" уже существует`,
    }
  }

  // Level 2: Exact content hash match (only if hash is available & column exists)
  if (contentHash && !contentHash.startsWith('fb-')) {
    try {
      const byHash = await db.document.findFirst({
        where: { contentHash },
        select: { id: true, title: true },
      })
      if (byHash) {
        return {
          severity: 'exact',
          existingId: byHash.id,
          existingTitle: byHash.title,
          message: `Документ с идентичным содержанием уже существует: "${byHash.title}"`,
        }
      }
    } catch {
      // contentHash column may not exist — skip this level
    }
  }

  // Level 3: Similar content (near-duplicate check)
  const lengthMin = Math.floor(fp.length * 0.8)
  const lengthMax = Math.ceil(fp.length * 1.2)

  const candidates = await db.document.findMany({
    select: { id: true, title: true, content: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  for (const candidate of candidates) {
    const candidateFp = contentFingerprint(candidate.content)

    if (candidateFp.length < lengthMin || candidateFp.length > lengthMax) continue

    const wordsA = new Set(fp.head.split(/\s+/).filter(Boolean))
    const wordsB = new Set(candidateFp.head.split(/\s+/).filter(Boolean))
    const intersection = [...wordsA].filter((w) => wordsB.has(w))
    const union = new Set([...wordsA, ...wordsB])
    const jaccard = union.size > 0 ? intersection.length / union.size : 0

    if (jaccard >= 0.7) {
      return {
        severity: 'similar',
        existingId: candidate.id,
        existingTitle: candidate.title,
        message: `Обнаружен похожий документ: "${candidate.title}". Схожесть: ${Math.round(jaccard * 100)}%. Загрузить всё равно?`,
      }
    }
  }

  return { severity: 'none', existingId: null, existingTitle: null, message: null }
}
