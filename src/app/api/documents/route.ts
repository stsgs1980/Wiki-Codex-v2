import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { createDocumentSchema, paginationSchema } from '@/lib/validations'
import { sanitizeField, ensureStackSignature } from '@/lib/sanitize'
import { contains, equals } from '@/lib/db-filter'
import { computeContentHash, contentFingerprint, type DuplicateCheckResult } from '@/lib/content-hash'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = paginationSchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
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
  try {
    const body = await request.json()
    const parsed = createDocumentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { title, content, fileName, fileType, fileSize, categoryId, tagIds } = parsed.data

    const cleanTitle = sanitizeField(title, 'document.title')
    const cleanContent = ensureStackSignature(sanitizeField(content, 'document.content'))

    // ── 1. Compute content hash for dedup ──────────────────────────
    const contentHash = await computeContentHash(cleanContent)
    const fp = contentFingerprint(cleanContent)

    // ── 2. Duplicate detection: three levels ───────────────────────
    const dupResult = await checkDuplicates(cleanTitle, contentHash, cleanContent, fp)

    if (dupResult.severity === 'exact') {
      // Exact duplicate — block
      return NextResponse.json(
        {
          error: dupResult.message,
          existingId: dupResult.existingId,
          severity: 'exact',
        },
        { status: 409 }
      )
    }

    if (dupResult.severity === 'similar') {
      // Similar content — return warning but allow with flag
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

    // ── 3. Create document ─────────────────────────────────────────
    const normalizedCategoryId = categoryId && categoryId !== 'none' && categoryId !== 'all' ? categoryId : null

    const document = await db.document.create({
      data: {
        title: cleanTitle,
        content: cleanContent,
        contentHash,
        fileName: fileName || title,
        fileType,
        fileSize,
        categoryId: normalizedCategoryId,
        tags: tagIds?.length
          ? {
              create: tagIds.map((tagId: string) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    )
  }
}

/**
 * Three-level duplicate check:
 * 1. Exact title match (case-insensitive)
 * 2. Exact content hash match (identical content)
 * 3. Content similarity (near-duplicates with minor edits)
 */
async function checkDuplicates(
  title: string,
  contentHash: string,
  content: string,
  fp: { head: string; tail: string; length: number }
): Promise<DuplicateCheckResult> {
  // Level 1: Title match (case-insensitive at application level)
  // SQLite COLLATE NOCASE handles ASCII, but we also check manually
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

  // Level 2: Exact content hash match
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

  // Level 3: Similar content (near-duplicate check)
  // Find documents with similar length (±20%) and check head/tail overlap
  const lengthMin = Math.floor(fp.length * 0.8)
  const lengthMax = Math.ceil(fp.length * 1.2)

  // Get recent documents to check for similarity
  const candidates = await db.document.findMany({
    select: { id: true, title: true, content: true },
    orderBy: { createdAt: 'desc' },
    take: 100, // check last 100 documents
  })

  for (const candidate of candidates) {
    const candidateFp = contentFingerprint(candidate.content)

    // Length filter
    if (candidateFp.length < lengthMin || candidateFp.length > lengthMax) continue

    // Head word overlap (Jaccard similarity)
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
