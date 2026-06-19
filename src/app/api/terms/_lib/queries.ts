import { db } from '@/lib/db'
import { contains } from '@/lib/db-filter'

type TermWithDocument = Awaited<ReturnType<typeof db.term.findMany>>[number]

/**
 * Fetch terms with optional filters and duplicate detection.
 *
 * Preserved verbatim from the original GET handler:
 *  - search → OR over term / translation / explanation (case-insensitive contains)
 *  - documentId → exact equality filter
 *  - duplicates=true → group terms by lowercased+trimmed name; emit
 *    {duplicates, totalDuplicates} alongside the term list
 */
export async function fetchTerms(params: {
  search: string
  documentId: string
  includeDuplicates: boolean
}): Promise<Record<string, unknown>> {
  const { search, documentId, includeDuplicates } = params

  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { term: contains(search) },
      { translation: contains(search) },
      { explanation: contains(search) },
    ]
  }

  if (documentId) {
    where.documentId = documentId
  }

  const terms = await db.term.findMany({
    where,
    include: {
      document: {
        select: { id: true, title: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Duplicate detection: find terms with similar names (case-insensitive)
  let duplicates: Array<{ original: TermWithDocument; duplicates: TermWithDocument[] }> = []
  if (includeDuplicates) {
    const seen = new Map<string, TermWithDocument>()
    for (const t of terms) {
      const key = t.term.toLowerCase().trim()
      if (seen.has(key)) {
        // Found duplicate
        const orig = seen.get(key)!
        const existingGroup = duplicates.find((g) => g.original.id === orig.id)
        if (existingGroup) {
          existingGroup.duplicates.push(t)
        } else {
          duplicates.push({ original: orig, duplicates: [t] })
        }
      } else {
        seen.set(key, t)
      }
    }
  }

  return {
    terms,
    ...(includeDuplicates
      ? {
          duplicates,
          totalDuplicates: duplicates.reduce(
            (acc, d) => acc + d.duplicates.length,
            0
          ),
        }
      : {}),
    total: terms.length,
  }
}
