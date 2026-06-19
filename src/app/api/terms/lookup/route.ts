import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import { sanitizeField } from '@/lib/sanitize'
import { contains, equals } from '@/lib/db-filter'

/**
 * STD-DOC — Manual term lookup.
 *
 * Two modes (auto-detected by language of the input):
 *
 *  1) English input  → returns { term (EN), translation (RU), explanation (RU), usage }
 *     "Получить описание на русском" — like the rest of the system.
 *
 *  2) Russian input  → returns { term (EN — the English name), translation (RU — original input),
 *                              explanation (RU), usage }
 *     "Получить описание и англоязычное название" — bilingual lookup.
 *
 * Flow:
 *  - First, check the DB for an existing match (fast path, no LLM call).
 *    English input: match by `term` (case-insensitive).
 *    Russian input: match by `translation` (case-insensitive).
 *  - If not found, ask the LLM. The LLM also returns detected input language
 *    so the frontend can show the correct framing.
 *  - `save` body flag (default true) persists the looked-up term so the
 *    dictionary grows with usage. Set `save: false` to do a pure lookup.
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
    const isRussian = /[а-яёА-ЯЁ]/.test(query)
    const inputLanguage: 'en' | 'ru' = isRussian ? 'ru' : 'en'

    // ── Fast path: existing DB match ──────────────────────────────────────
    let existing: Awaited<ReturnType<typeof db.term.findFirst>> = null

    if (inputLanguage === 'en') {
      // Match by English term name (case-insensitive exact)
      existing = await db.term.findFirst({
        where: { term: equals(query) },
        include: { document: { select: { id: true, title: true } } },
      })
      if (!existing) {
        // Fallback: contains (case-insensitive substring)
        existing = await db.term.findFirst({
          where: { term: contains(query) },
          include: { document: { select: { id: true, title: true } } },
        })
      }
    } else {
      // Match by Russian translation
      existing = await db.term.findFirst({
        where: { translation: equals(query) },
        include: { document: { select: { id: true, title: true } } },
      })
      if (!existing) {
        existing = await db.term.findFirst({
          where: { translation: contains(query) },
          include: { document: { select: { id: true, title: true } } },
        })
      }
    }

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
    const zai = await ZAI.create()

    const systemPrompt = `Ты -- эксперт-лексикограф технического словаря для разработчиков.
Пользователь вводит термин на английском ИЛИ на русском языке. Определи язык ввода и верни карточку термина.

Правила:
- Если ввод на АНГЛИЙСКОМ: "term" = каноническое английское написание (как в документации), "translation" = русский перевод.
- Если ввод на РУССКОМ: "term" = каноническое АНГЛИЙСКОЕ название этого понятия (найди его), "translation" = исходный русский ввод (нормализованный).
- "explanation" всегда на русском, 1-3 предложения, что это и зачем нужно.
- "usage" -- короткий пример использования (код или фраза), опционально.
- "inputLanguage" = "en" или "ru" согласно определённому языку ввода.

Ответь ТОЛЬКО валидным JSON без markdown:
{"term":"...","translation":"...","explanation":"...","usage":"...","inputLanguage":"en|ru"}`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      temperature: 0.2,
    })

    const messageContent = completion.choices[0]?.message?.content || ''

    let parsed: {
      term: string
      translation: string
      explanation: string
      usage?: string
      inputLanguage?: 'en' | 'ru'
    } | null = null

    try {
      const jsonMatch = messageContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      }
    } catch {
      // fall through to error
    }

    if (!parsed || !parsed.term || !parsed.translation || !parsed.explanation) {
      return NextResponse.json(
        {
          error: 'Не удалось определить термин. Попробуйте уточнить формулировку.',
          raw: messageContent.slice(0, 200),
        },
        { status: 422 }
      )
    }

    // Re-detect language from LLM (it may correct the input language)
    const detectedLang: 'en' | 'ru' =
      parsed.inputLanguage === 'ru' || parsed.inputLanguage === 'en'
        ? parsed.inputLanguage
        : inputLanguage

    const cleanTerm = sanitizeField(parsed.term, 'term.name')
    const cleanTranslation = sanitizeField(parsed.translation, 'term.translation')
    const cleanExplanation = sanitizeField(parsed.explanation, 'term.explanation')
    const cleanUsage = parsed.usage
      ? sanitizeField(parsed.usage, 'term.usage')
      : null

    // ── Save (dedup against existing English term) ───────────────────────
    let saved: Awaited<ReturnType<typeof db.term.create>> | null = null
    let isDuplicate = false

    if (save) {
      const dup = await db.term.findFirst({
        where: { term: equals(cleanTerm) },
        include: { document: { select: { id: true, title: true } } },
      })
      if (dup) {
        // Existing term has same English name — return it (don't overwrite)
        isDuplicate = true
        saved = dup
      } else {
        saved = await db.term.create({
          data: {
            term: cleanTerm,
            translation: cleanTranslation,
            explanation: cleanExplanation,
            usage: cleanUsage,
            documentId: null,
          },
          include: { document: { select: { id: true, title: true } } },
        })
      }
    }

    const fallbackTerm = {
      id: '',
      term: cleanTerm,
      translation: cleanTranslation,
      explanation: cleanExplanation,
      usage: cleanUsage,
      documentId: null,
      document: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      term: saved || fallbackTerm,
      inputLanguage: detectedLang,
      source: 'ai',
      isExisting: isDuplicate,
      saved: save && !isDuplicate,
    })
  } catch (error) {
    console.error('Error in /api/terms/lookup:', error)
    return NextResponse.json(
      { error: 'Failed to lookup term' },
      { status: 500 }
    )
  }
}
