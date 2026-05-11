/**
 * Backup utility for Vercel/serverless environments.
 * Exports all data as JSON from the PostgreSQL database.
 * The old file-based backup system is incompatible with Vercel's read-only filesystem.
 */
import { db } from '@/lib/db'

export interface BackupData {
  exportedAt: string
  version: string
  categories: unknown[]
  tags: unknown[]
  documents: unknown[]
  documentTags: unknown[]
  terms: unknown[]
  notes: unknown[]
  instructions: unknown[]
}

/**
 * Export all database data as a JSON object.
 * Use this for downloading or migrating data.
 */
export async function exportAllData(): Promise<BackupData> {
  const [categories, tags, documents, documentTags, terms, notes, instructions] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: 'asc' } }),
    db.tag.findMany({ orderBy: { name: 'asc' } }),
    db.document.findMany({
      include: { category: true, tags: { include: { tag: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
    db.documentTag.findMany(),
    db.term.findMany({ orderBy: { term: 'asc' } }),
    db.note.findMany({ orderBy: { updatedAt: 'desc' } }),
    db.instruction.findMany({ orderBy: { updatedAt: 'desc' } }),
  ])

  return {
    exportedAt: new Date().toISOString(),
    version: '2.0',
    categories,
    tags,
    documents,
    documentTags,
    terms,
    notes,
    instructions,
  }
}

/**
 * @deprecated File-based backup is not supported on Vercel.
 * This function is kept as a no-op for backward compatibility.
 * Use exportAllData() instead for data export.
 */
export function autoBackup() {
  // No-op: file-based backups are incompatible with serverless environments.
  // Data durability is handled by the managed PostgreSQL database.
}
