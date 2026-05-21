import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

interface ScanBody {
  action: 'scan'
  ids?: string[]
}

interface DeleteBody {
  action: 'delete'
  ids: string[]
}

type CleanupBody = ScanBody | DeleteBody

interface DuplicateEntry {
  id: string
  title: string
  updatedAt: Date
}

interface DuplicateGroup {
  reason: 'title' | 'contentHash'
  keep: DuplicateEntry
  duplicates: DuplicateEntry[]
}

export async function POST(request: NextRequest) {
  // ── 1. Parse & validate body ────────────────────────────────────────
  let body: CleanupBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.action || (body.action !== 'scan' && body.action !== 'delete')) {
    return NextResponse.json(
      { error: 'Invalid action. Must be "scan" or "delete"' },
      { status: 400 }
    )
  }

  // ── 2. Route to handler ─────────────────────────────────────────────
  if (body.action === 'scan') {
    return handleScan()
  }

  return handleDelete(body.ids)
}

/**
 * Scan mode: Find all duplicate documents grouped by reason.
 *
 * Group 1: Identical titles (case-insensitive) — keep the newest (most recent updatedAt)
 * Group 2: Identical contentHash values — same logic
 *
 * A document flagged as a title duplicate is excluded from the contentHash check
 * to avoid double-counting.
 */
async function handleScan(): Promise<NextResponse> {
  try {
    // Fetch all documents with the fields we need
    // contentHash column may not exist in production DB — try with, fallback without
    let documents: Array<{ id: string; title: string; contentHash: string | null; updatedAt: Date }>
    try {
      documents = await db.document.findMany({
        select: {
          id: true,
          title: true,
          contentHash: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
      })
    } catch (selectError) {
      const errMsg = selectError instanceof Error ? selectError.message : String(selectError)
      if (errMsg.includes('contentHash') || errMsg.includes('does not exist') || errMsg.includes('column')) {
        console.warn('[cleanup] contentHash column not found, fetching without it')
        documents = (await db.document.findMany({
          select: {
            id: true,
            title: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: 'desc' },
        })).map((d) => ({ ...d, contentHash: null }))
      } else {
        throw selectError
      }
    }

    const groups: DuplicateGroup[] = []
    const titleDuplicateIds = new Set<string>()

    // ── Group 1: Title duplicates (case-insensitive) ──────────────────
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

      // Track all IDs flagged as title duplicates
      for (const dup of duplicates) {
        titleDuplicateIds.add(dup.id)
      }

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

    // ── Group 2: contentHash duplicates ───────────────────────────────
    try {
      const hashMap = new Map<string, typeof documents>()

      for (const doc of documents) {
        // Skip documents already flagged as title duplicates (avoid double-counting)
        if (titleDuplicateIds.has(doc.id)) continue
        // Only consider documents with a non-null contentHash
        if (!doc.contentHash) continue

        const key = doc.contentHash
        const existing = hashMap.get(key)
        if (existing) {
          existing.push(doc)
        } else {
          hashMap.set(key, [doc])
        }
      }

      for (const [, docs] of hashMap) {
        if (docs.length < 2) continue

        // Sort by updatedAt descending — most recent first
        docs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

        const keep = docs[0]
        const duplicates = docs.slice(1)

        groups.push({
          reason: 'contentHash',
          keep: { id: keep.id, title: keep.title, updatedAt: keep.updatedAt },
          duplicates: duplicates.map((d) => ({
            id: d.id,
            title: d.title,
            updatedAt: d.updatedAt,
          })),
        })
      }
    } catch (hashError) {
      // contentHash column might not exist — skip this group gracefully
      console.warn(
        '[cleanup] contentHash scan failed (column may not exist):',
        hashError instanceof Error ? hashError.message : hashError
      )
    }

    // ── Compute totals ────────────────────────────────────────────────
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

/**
 * Delete mode: Delete specific duplicate documents by IDs.
 * Cascade deletes tags via DocumentTag.
 */
async function handleDelete(ids: string[] | undefined): Promise<NextResponse> {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: 'ids must be a non-empty array of document IDs' },
      { status: 400 }
    )
  }

  try {
    let deleted = 0

    await db.$transaction(async (tx) => {
      for (const id of ids) {
        try {
          // Delete DocumentTag relations first (explicit, even though cascade exists)
          await tx.documentTag.deleteMany({ where: { documentId: id } })
          await tx.document.delete({ where: { id } })
          deleted++
        } catch (docError) {
          // Individual document may not exist — skip and continue
          const errMsg =
            docError instanceof Error ? docError.message : String(docError)
          if (errMsg.includes('Record to delete not found')) {
            console.warn(`[cleanup] Document ${id} not found, skipping`)
          } else {
            throw docError // re-throw unexpected errors to rollback transaction
          }
        }
      }
    })

    return NextResponse.json({
      deleted,
      ids,
    })
  } catch (error) {
    console.error('[cleanup] Delete failed:', error)

    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'One or more documents not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete duplicate documents' },
      { status: 500 }
    )
  }
}
