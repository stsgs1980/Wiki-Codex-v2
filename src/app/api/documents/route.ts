import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { autoBackup } from '@/lib/backup'
import { createDocumentSchema, paginationSchema } from '@/lib/validations'
import { sanitizeField, ensureStackSignature } from '@/lib/sanitize'

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
        { title: { contains: search } },
        { content: { contains: search } },
        { summary: { contains: search } },
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

    const normalizedCategoryId = categoryId && categoryId !== 'none' && categoryId !== 'all' ? categoryId : null

    const existing = await db.document.findFirst({
      where: { title: cleanTitle },
      include: { category: true, tags: { include: { tag: true } } },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Документ с таким заголовком уже существует', existingId: existing.id },
        { status: 409 }
      )
    }

    const document = await db.document.create({
      data: {
        title: cleanTitle,
        content: cleanContent,
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

    autoBackup()
    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    )
  }
}
