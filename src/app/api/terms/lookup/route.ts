import { NextRequest, NextResponse } from 'next/server'
import { detectLanguage } from './_lib/language-detect'
import { findExistingTerm } from './_lib/db-lookup'
import { aiLookup } from './_lib/ai-lookup'

/**
 * STD-DOC — Manual term lookup.
 *
 * Two modes (auto-detected by language of the input):
 *  1) English input  → term (EN), translation (RU), explanation (RU), usage.
 *  2) Russian input  → term (EN), translation (RU original), explanation (RU), usage.
 *
 * Flow: DB fast path (existing match by term/translation) → AI slow path
 * (ZAI LLM with the system prompt in ./_lib/ai-lookup). `save` (default true)
 * persists the looked-up term; set `save: false` for a pure lookup.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { input, save = true } = body as { input?: string; save?: boolean }

    if (!input || typeof input !== 'string' || !input.trim()) {
      return NextResponse.json(
        { error: 'input is required' },
        { status: 400 }
      )
    }

    const query = input.trim()
    const inputLanguage = detectLanguage(query)

    // ── Fast path: existing DB match ──────────────────────────────────────
    const existing = await findExistingTerm(query, inputLanguage)

    if (existing) {
      return NextResponse.json({
        term: existing,
        inputLanguage,
        source: 'database',
        isExisting: true,
        saved: false,
      })
    }

    // ── Slow path: LLM lookup ─────────────────────────────────────────────
    return await aiLookup(query, inputLanguage, save)
  } catch (error) {
    console.error('Error in /api/terms/lookup:', error)
    return NextResponse.json(
      { error: 'Failed to lookup term' },
      { status: 500 }
    )
  }
}
