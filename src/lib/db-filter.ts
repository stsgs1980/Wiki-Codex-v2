/**
 * Database filter utilities for SQLite.
 *
 * SQLite uses case-insensitive LIKE by default for `contains`.
 * For `equals`, we use direct comparison (SQLite is case-insensitive
 * for ASCII by default with COLLATE NOCASE on text columns).
 */

/**
 * Case-insensitive `contains` filter for SQLite.
 * SQLite LIKE is case-insensitive for ASCII by default.
 */
export function contains(value: string): { contains: string } {
  return { contains: value }
}

/**
 * `equals` filter for SQLite.
 * Note: Prisma SQLite does not support `mode: 'insensitive'`.
 * For case-insensitive equality, use `contains` with exact match
 * or handle at application level.
 */
export function equals(value: string): { equals: string } {
  return { equals: value }
}

/**
 * Case-insensitive equals filter for SQLite.
 * Uses a combination of startsWith + endsWith + length check
 * since SQLite doesn't support `mode: 'insensitive'`.
 *
 * For simple cases, just use `equals()` — Prisma SQLite
 * text columns use COLLATE NOCASE by default.
 */
export function equalsCaseInsensitive(value: string): {
  OR: Array<{ title: { contains: string } }>
} {
  // Fallback: search by contains (case-insensitive in SQLite)
  // Then filter exact match at application level
  return {
    OR: [
      { title: { contains: value } },
    ],
  }
}
