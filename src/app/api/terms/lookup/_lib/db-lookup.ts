import { db } from '@/lib/db'
import { contains, equals } from '@/lib/db-filter'

type TermWithDocument = Awaited<ReturnType<typeof db.term.findFirst>>

/**
 * Fast path: search the DB for an existing term.
 *
 * Preserved verbatim from the original POST handler:
 *  - English input → match by `term` (case-insensitive exact via equals())
 *  - Russian input → match by `translation`
 *  - Each path falls back to a substring (contains()) match if no exact hit.
 *
 * Returns null when no DB match exists (caller falls through to the AI path).
 */
export async function findExistingTerm(
  query: string,
  inputLanguage: 'en' | 'ru'
): Promise<TermWithDocument> {
  if (inputLanguage === 'en') {
    // Match by English term name (case-insensitive exact)
    let existing = await db.term.findFirst({
      where: { term: equals(query) },
      include: { document: { select: { id: true, title: true } } },
    })
    if (!existing) {
      // Fallback: contains (case-insensitive substring)
      existing = await db.term.findFirst({
        where: { term: contains(query) },
        include: { document: { select: { id: true, title: true } } },
      })
    }
    return existing
  }

  // Match by Russian translation
  let existing = await db.term.findFirst({
    where: { translation: equals(query) },
    include: { document: { select: { id: true, title: true } } },
  })
  if (!existing) {
    existing = await db.term.findFirst({
      where: { translation: contains(query) },
      include: { document: { select: { id: true, title: true } } },
    })
  }
  return existing
}
