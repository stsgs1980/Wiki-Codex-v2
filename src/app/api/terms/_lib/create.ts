import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeField } from '@/lib/sanitize'
import { equals } from '@/lib/db-filter'

interface CreateTermBody {
  term?: string
  translation?: string
  explanation?: string
  usage?: string
  documentId?: string | null
}

/**
 * Create a new term (POST) with dedup logic.
 *
 * Preserved verbatim from the original POST handler:
 *  - validate term/translation/explanation presence → 400
 *  - sanitize each text field
 *  - dedup: case-insensitive match on `term` via equals() → 200 with isDuplicate:true
 *  - otherwise create → 201 with isDuplicate:false
 *
 * Errors (DB / sanitize crashes) propagate up to the caller's try/catch.
 */
export async function createTerm(body: CreateTermBody): Promise<NextResponse> {
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
}
