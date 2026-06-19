import { db } from '@/lib/db'

/**
 * Fetch all terms for export, sorted alphabetically by `term`.
 *
 * Export intentionally ignores search/filter state — the user expects a
 * complete dictionary snapshot, not the current filtered view. Sort is
 * case-insensitive so "API" and "api" group together.
 */
export async function fetchTermsForExport() {
  const terms = await db.term.findMany({
    include: {
      document: {
        select: { id: true, title: true },
      },
    },
    orderBy: { term: 'asc' },
  })

  // Secondary case-insensitive sort (Prisma orderBy is case-sensitive on
  // SQLite/PG collation — "API" would come before "api" but "Zebra" before
  // "apple" which is wrong for a dictionary index).
  return [...terms].sort((a, b) =>
    a.term.localeCompare(b.term, 'ru', { sensitivity: 'base' }),
  )
}
