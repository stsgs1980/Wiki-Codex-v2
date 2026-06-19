import { NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import { sanitizeField } from '@/lib/sanitize'
import { equals } from '@/lib/db-filter'

const SYSTEM_PROMPT = `Ты -- эксперт-лексикограф технического словаря для разработчиков.
Пользователь вводит термин на английском ИЛИ на русском языке. Определи язык ввода и верни карточку термина.

Правила:
- Если ввод на АНГЛИЙСКОМ: "term" = каноническое английское написание (как в документации), "translation" = русский перевод.
- Если ввод на РУССКОМ: "term" = каноническое АНГЛИЙСКОЕ название этого понятия (найди его), "translation" = исходный русский ввод (нормализованный).
- "explanation" всегда на русском, 1-3 предложения, что это и зачем нужно.
- "usage" -- короткий пример использования (код или фраза), опционально.
- "inputLanguage" = "en" или "ru" согласно определённому языку ввода.

Ответь ТОЛЬКО валидным JSON без markdown:
{"term":"...","translation":"...","explanation":"...","usage":"...","inputLanguage":"en|ru"}`

/**
 * Slow path: AI (ZAI LLM) lookup with optional save.
 *
 * Preserved verbatim from the original POST handler:
 *  - ZAI chat.completions.create with temperature 0.2 and the system prompt above
 *  - user message = the trimmed query verbatim
 *  - JSON extracted via /\{[\s\S]*\}/ regex (first match), JSON.parse, fall-through on failure
 *  - 422 with Russian error message when term/translation/explanation missing
 *  - re-detect language from LLM (parsed.inputLanguage) with fallback to caller's inputLanguage
 *  - sanitize each text field (sanitizeField)
 *  - dedup: if save && existing term with same English name → return existing, isDuplicate=true
 *  - else save: create new term
 *  - fallbackTerm (no save / unsaved) built from sanitized LLM output with empty id + null document
 *  - response: { term, inputLanguage, source: 'ai', isExisting, saved }
 */
export async function aiLookup(
  query: string,
  inputLanguage: 'en' | 'ru',
  save: boolean
): Promise<NextResponse> {
  const zai = await ZAI.create()

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
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
}
