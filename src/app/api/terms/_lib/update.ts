import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface MergeTranslations {
  translation?: string
  explanation?: string
  usage?: string
}

interface MergeTermsBody {
  keepId?: string
  mergeIds?: string[]
  mergeTranslations?: MergeTranslations
}

/**
 * Merge duplicate terms: keep one, delete the rest (PATCH).
 *
 * Preserved verbatim from the original PATCH handler:
 *  - validate keepId + mergeIds (non-empty array) → 400
 *  - filter keepId out of mergeIds (prevent accidental self-delete)
 *  - find term-to-keep → 404 if missing
 *  - optionally update translation/explanation/usage on the kept term
 *  - deleteMany the mergeIds
 *  - re-fetch and return the updated kept term with `merged` count
 */
export async function mergeTerms(body: MergeTermsBody): Promise<NextResponse> {
  const { keepId, mergeIds, mergeTranslations } = body

  if (!keepId || !mergeIds || !Array.isArray(mergeIds) || mergeIds.length === 0) {
    return NextResponse.json(
      { error: 'keepId and mergeIds (non-empty array) are required' },
      { status: 400 }
    )
  }

  // Filter out keepId from mergeIds to prevent accidental deletion of the kept term
  const filteredMergeIds = mergeIds.filter((id: string) => id !== keepId)

  // Get the term to keep
  const termToKeep = await db.term.findUnique({
    where: { id: keepId },
    include: { document: { select: { id: true, title: true } } },
  })

  if (!termToKeep) {
    return NextResponse.json(
      { error: 'Term to keep not found' },
      { status: 404 }
    )
  }

  // Optionally update translations/merge data
  if (mergeTranslations) {
    const updateData: Record<string, unknown> = {}
    if (mergeTranslations.translation) updateData.translation = mergeTranslations.translation
    if (mergeTranslations.explanation) updateData.explanation = mergeTranslations.explanation
    if (mergeTranslations.usage !== undefined) updateData.usage = mergeTranslations.usage || null

    if (Object.keys(updateData).length > 0) {
      await db.term.update({
        where: { id: keepId },
        data: updateData,
      })
    }
  }

  // Delete merged terms
  const result = await db.term.deleteMany({
    where: { id: { in: filteredMergeIds } },
  })

  // Fetch updated term
  const updated = await db.term.findUnique({
    where: { id: keepId },
    include: { document: { select: { id: true, title: true } } },
  })

  return NextResponse.json({
    success: true,
    merged: result.count,
    term: updated,
  })
}
