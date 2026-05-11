/**
 * Database filter utilities for PostgreSQL.
 *
 * PostgreSQL requires `mode: 'insensitive'` for case-insensitive filtering.
 * These helpers provide consistent case-insensitive filters for Prisma queries.
 */

/**
 * Case-insensitive `contains` filter.
 */
export function contains(value: string): { contains: string; mode: 'insensitive' } {
  return { contains: value, mode: 'insensitive' }
}

/**
 * Case-insensitive `equals` filter.
 */
export function equals(value: string): { equals: string; mode: 'insensitive' } {
  return { equals: value, mode: 'insensitive' }
}
