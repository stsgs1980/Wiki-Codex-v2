import { Prisma } from '@prisma/client'
import type { z } from 'zod'
import { db } from '@/lib/db'
import { contains } from '@/lib/db-filter'
import type { paginationSchema } from '@/lib/validations'

type PaginationData = z.infer<typeof paginationSchema>

/**
 * Build Prisma where clause from validated pagination/filter params.
 * Filters: search (title/content/summary), categoryId, tagId, starred.
 * 'none' and 'all' are treated as no-filter (kept inline to preserve
 * the original behavior exactly).
 */
export function buildDocumentsWhere(params: PaginationData): Prisma.DocumentWhereInput {
  const where: Prisma.DocumentWhereInput = {}
  const { search, categoryId, tagId, starred } = params

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

  return where
}

/**
 * Fetch documents page with filters and aggregate counts.
 * Returns documents + total (filtered) + allTotal + allStarred + pagination meta.
 */
export async function fetchDocuments(params: PaginationData) {
  const where = buildDocumentsWhere(params)
  const { page, limit } = params

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

  return {
    documents,
    total,
    allTotal,
    allStarred,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}
