import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export interface DuplicateEntry {
  id: string
  title: string
  updatedAt: Date
}

export interface DuplicateGroup {
  reason: 'title'
  keep: DuplicateEntry
  duplicates: DuplicateEntry[]
}

/**
 * Scan mode: Find all duplicate documents by title (case-insensitive).
 * Keeps the newest document in each group.
 */
export async function handleScan(): Promise<NextResponse> {
  try {
    const documents = await db.document.findMany({
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    const groups: DuplicateGroup[] = []

    // Group by title (case-insensitive)
    const titleMap = new Map<string, typeof documents>()

    for (const doc of documents) {
      const key = doc.title.toLowerCase()
      const existing = titleMap.get(key)
      if (existing) {
        existing.push(doc)
      } else {
        titleMap.set(key, [doc])
      }
    }

    for (const [, docs] of titleMap) {
      if (docs.length < 2) continue

      // Sort by updatedAt descending — most recent first
      docs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

      const keep = docs[0]
      const duplicates = docs.slice(1)

      groups.push({
        reason: 'title',
        keep: { id: keep.id, title: keep.title, updatedAt: keep.updatedAt },
        duplicates: duplicates.map((d) => ({
          id: d.id,
          title: d.title,
          updatedAt: d.updatedAt,
        })),
      })
    }

    const totalDuplicates = groups.reduce((sum, g) => sum + g.duplicates.length, 0)
    const totalGroups = groups.length

    return NextResponse.json({
      groups,
      totalDuplicates,
      totalGroups,
    })
  } catch (error) {
    console.error('[cleanup] Scan failed:', error)
    return NextResponse.json(
      { error: 'Failed to scan for duplicate documents' },
      { status: 500 }
    )
  }
}
