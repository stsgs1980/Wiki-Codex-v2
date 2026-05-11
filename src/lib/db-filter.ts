/**
 * Database filter utilities for cross-database compatibility.
 *
 * PostgreSQL requires `mode: 'insensitive'` for case-insensitive filtering,
 * while SQLite is case-insensitive by default and doesn't support the `mode` option.
 *
 * This module detects the database provider and provides compatible filter helpers.
 */

const isPostgres = (process.env.DATABASE_URL ?? '').startsWith('postgresql://')

/**
 * Case-insensitive `contains` filter.
 * Works with both SQLite (no mode) and PostgreSQL (mode: 'insensitive').
 */
export function contains(value: string): { contains: string; mode?: 'insensitive' } {
  if (isPostgres) {
    return { contains: value, mode: 'insensitive' }
  }
  return { contains: value }
}

/**
 * Case-insensitive `equals` filter.
 * Works with both SQLite (no mode) and PostgreSQL (mode: 'insensitive').
 */
export function equals(value: string): { equals: string; mode?: 'insensitive' } {
  if (isPostgres) {
    return { equals: value, mode: 'insensitive' }
  }
  return { equals: value }
}
