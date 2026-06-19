import { NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export interface AiAnalysis {
  category: string | null
  isNewCategory: boolean
  summary: string
  tags: string[]
}

export interface ExistingCategory {
  id: string
  name: string
  color: string
}

export type CategorizeResult =
  | { ok: true; analysis: AiAnalysis }
  | { ok: false; response: NextResponse }

/**
 * Call ZAI LLM to analyze and categorize a document.
 *
 * Preserved verbatim from the original POST handler:
 *  - system prompt includes the comma-separated existing category names
 *    (or "Пока нет" when the list is empty)
 *  - user message: `Заголовок: <title>\n\nСодержание:\n<content first 4000 chars>`
 *  - temperature 0.3, max_tokens 1024
 *  - JSON extracted via /\{[\s\S]*\}/ regex (first match), JSON.parse
 *  - 422 with `AI не смог определить категорию` on parse failure
 *  - 422 with `AI не предложил категорию` when analysis.category is falsy
 */
export async function categorizeDocument(
  document: { title: string; content: string },
  existingCategories: ExistingCategory[]
): Promise<CategorizeResult> {
  const categoryList = existingCategories.map((c) => c.name).join(', ')

  const zai = await ZAI.create()

  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `Ты — ассистент категоризации документов для базы знаний разработчиков Wiki Codex.
Проанализируй документ и определи:
1. Наиболее подходящую категорию из существующего списка или предложи новую
2. Краткое содержание (2-3 предложения)
3. До 5 тегов

Существующие категории: ${categoryList || 'Пока нет'}

Ответь ТОЛЬКО валидным JSON:
{
  "category": "название категории",
  "isNewCategory": true/false,
  "summary": "Краткое содержание",
  "tags": ["тег1", "тег2"]
}`,
      },
      {
        role: 'user',
        content: `Заголовок: ${document.title}\n\nСодержание:\n${document.content.substring(0, 4000)}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 1024,
  })

  const messageContent = completion.choices[0]?.message?.content || ''

  // Parse AI response
  let analysis: AiAnalysis

  try {
    const jsonMatch = messageContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      analysis = JSON.parse(jsonMatch[0])
    } else {
      throw new Error('JSON not found')
    }
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'AI не смог определить категорию', raw: messageContent },
        { status: 422 }
      ),
    }
  }

  if (!analysis.category) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'AI не предложил категорию', raw: messageContent },
        { status: 422 }
      ),
    }
  }

  return { ok: true, analysis }
}
