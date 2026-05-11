import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!content) {
      return NextResponse.json(
        { error: 'Содержимое обязательно' },
        { status: 400 }
      )
    }

    // Получаем существующие категории и теги для сопоставления
    const [existingCategories, existingTags] = await Promise.all([
      db.category.findMany({ select: { id: true, name: true } }),
      db.tag.findMany({ select: { id: true, name: true, color: true } }),
    ])

    const categoryList = existingCategories.map((c) => c.name).join(', ')
    const tagList = existingTags.map((t) => t.name).join(', ')

    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Ты -- ассистент анализа документов для базы знаний разработчиков Wiki Codex.
Проанализируй содержимое документа и предоставь:
1. Краткое содержание (2-3 предложения)
2. Предложенную категорию из существующего списка или предложи новую
3. До 5 предложенных тегов из существующего списка или предложи новые

Существующие категории: ${categoryList || 'Пока нет'}
Существующие теги: ${tagList || 'Пока нет'}

Ответь ТОЛЬКО валидным JSON в следующем формате, без дополнительного текста:
{
  "summary": "Краткое содержание из 2-3 предложений",
  "suggestedCategory": "название категории",
  "suggestedTags": ["тег1", "тег2", "тег3"]
}`,
        },
        {
          role: 'user',
          content: `Проанализируй этот документ:\n\n${content.substring(0, 4000)}`,
        },
      ],
      temperature: 0.3,
    })

    const messageContent = completion.choices[0]?.message?.content || ''

    // Извлекаем JSON из ответа
    let analysis
    try {
      const jsonMatch = messageContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('JSON не найден в ответе')
      }
    } catch {
      analysis = {
        summary: 'Не удалось автоматически сгенерировать краткое содержание.',
        suggestedCategory: null,
        suggestedTags: [],
      }
    }

    // Сопоставляем предложенную категорию с существующими
    let matchedCategoryId: string | null = null
    let matchedCategoryName = analysis.suggestedCategory
    if (analysis.suggestedCategory) {
      const match = existingCategories.find(
        (c) =>
          c.name.toLowerCase() === analysis.suggestedCategory.toLowerCase() ||
          c.name.toLowerCase().includes(analysis.suggestedCategory.toLowerCase()) ||
          analysis.suggestedCategory.toLowerCase().includes(c.name.toLowerCase())
      )
      if (match) {
        matchedCategoryId = match.id
        matchedCategoryName = match.name
      }
    }

    // Сопоставляем предложенные теги с существующими
    const matchedTags: { id: string; name: string; color: string }[] = []
    const newTagNames: string[] = []

    if (analysis.suggestedTags && Array.isArray(analysis.suggestedTags)) {
      for (const tagName of analysis.suggestedTags) {
        const match = existingTags.find(
          (t) =>
            t.name.toLowerCase() === tagName.toLowerCase() ||
            t.name.toLowerCase().includes(tagName.toLowerCase()) ||
            tagName.toLowerCase().includes(t.name.toLowerCase())
        )
        if (match) {
          matchedTags.push({ id: match.id, name: match.name, color: match.color })
        } else {
          newTagNames.push(tagName)
        }
      }
    }

    return NextResponse.json({
      summary: analysis.summary,
      suggestedCategory: matchedCategoryName
        ? { id: matchedCategoryId, name: matchedCategoryName }
        : null,
      suggestedNewCategory: matchedCategoryId ? null : analysis.suggestedCategory,
      matchedTags,
      newTagNames,
    })
  } catch (error) {
    console.error('Ошибка анализа документа:', error)
    return NextResponse.json(
      { error: 'Не удалось проанализировать документ' },
      { status: 500 }
    )
  }
}
