import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeField } from '@/lib/sanitize'
import { contains, equals } from '@/lib/db-filter'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const documentId = searchParams.get('documentId') || ''
    const includeDuplicates = searchParams.get('duplicates') === 'true'

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
    let duplicates: Array<{ original: typeof terms[0]; duplicates: typeof terms }> = []
    if (includeDuplicates) {
      const seen = new Map<string, typeof terms[0]>()
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

    return NextResponse.json({
      terms,
      ...(includeDuplicates ? { duplicates, totalDuplicates: duplicates.reduce((acc, d) => acc + d.duplicates.length, 0) } : {}),
      total: terms.length,
    })
  } catch (error) {
    console.error('Error fetching terms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch terms' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { term, translation, explanation, usage, documentId } = body

    if (!term || !translation || !explanation) {
      return NextResponse.json(
        { error: 'term, translation, and explanation are required' },
        { status: 400 }
      )
    }

    const cleanTerm = sanitizeField(term, 'term.name')
    const cleanTranslation = sanitizeField(translation, 'term.translation')
    const cleanExplanation = sanitizeField(explanation, 'term.explanation')
    const cleanUsage = usage ? sanitizeField(usage, 'term.usage') : null

    // Dedup: check if a term with the same name already exists (case-insensitive)
    const existing = await db.term.findFirst({
      where: { term: equals(cleanTerm) },
      include: { document: { select: { id: true, title: true } } },
    })
    if (existing) {
      return NextResponse.json(
        { term: existing, isDuplicate: true },
        { status: 200 }
      )
    }

    const created = await db.term.create({
      data: {
        term: cleanTerm,
        translation: cleanTranslation,
        explanation: cleanExplanation,
        usage: cleanUsage,
        documentId: documentId || null,
      },
      include: {
        document: {
          select: { id: true, title: true },
        },
      },
    })

    return NextResponse.json({ term: created, isDuplicate: false }, { status: 201 })
  } catch (error) {
    console.error('Error creating term:', error)
    return NextResponse.json(
      { error: 'Failed to create term' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const ids = searchParams.get('ids')

    if (ids) {
      // Batch delete: comma-separated IDs
      const idList = ids.split(',').filter(Boolean)
      if (idList.length === 0) {
        return NextResponse.json(
          { error: 'No valid IDs provided' },
          { status: 400 }
        )
      }

      const result = await db.term.deleteMany({
        where: { id: { in: idList } },
      })

        return NextResponse.json({ success: true, deleted: result.count })
    }

    if (!id) {
      return NextResponse.json(
        { error: 'id or ids query parameter is required' },
        { status: 400 }
      )
    }

    await db.term.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting term:', error)
    return NextResponse.json(
      { error: 'Failed to delete term' },
      { status: 500 }
    )
  }
}

// Merge duplicate terms: keep one, delete the rest
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
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
  } catch (error) {
    console.error('Error merging terms:', error)
    return NextResponse.json(
      { error: 'Failed to merge terms' },
      { status: 500 }
    )
  }
}
