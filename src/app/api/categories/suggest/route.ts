import { NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

// Предустановленные цвета для новых категорий
const CATEGORY_COLORS = [
  '#dc2626', '#ea580c', '#d97706', '#65a30d',
  '#0d9488', '#0891b2', '#2563eb', '#7c3aed',
  '#c026d3', '#e11d48', '#78716c',
]

export async function POST() {
  try {
    // Получаем все документы и существующие категории
    const [documents, existingCategories] = await Promise.all([
      db.document.findMany({
        select: { id: true, title: true, content: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      db.category.findMany({ select: { id: true, name: true } }),
    ])

    if (documents.length === 0) {
      return NextResponse.json({ categories: [], message: 'Нет документов для анализа' })
    }

    // Формируем сниппеты документов для AI
    const docSnippets = documents
      .slice(0, 30)
      .map((d, i) => `[${i + 1}] "${d.title}": ${(d.content || '').substring(0, 300)}`)
      .join('\n')

    const existingList = existingCategories.map((c) => c.name).join(', ')

    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Ты -- ассистент базы знаний Wiki Codex. Твоя задача -- проанализировать набор документов и предложить подходящие категории для их организации.

Правила:
1. Предложи от 3 до 8 категорий, которые лучше всего описывают тематику документов
2. НЕ дублируй существующие категории (учти синонимы)
3. Каждая категория должна иметь краткое описание (1 предложение) о том, что она включает
4. Названия категорий -- на русском, краткие (1-3 слова)
5. Если документов мало и они однородные -- предложи меньше категорий

Существующие категории: ${existingList || 'Пока нет'}

Ответь ТОЛЬКО валидным JSON, без дополнительного текста:
{
  "categories": [
    { "name": "Название", "description": "Описание категории" }
  ]
}`,
        },
        {
          role: 'user',
          content: `Проанализируй документы и предложи категории:\n\n${docSnippets}`,
        },
      ],
      temperature: 0.3,
    })

    const messageContent = completion.choices[0]?.message?.content || ''

    let result
    try {
      const jsonMatch = messageContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('JSON не найден')
      }
    } catch {
      return NextResponse.json({ categories: [], message: 'Не удалось разобрать ответ AI' })
    }

    const suggested = (result.categories || []).map(
      (cat: { name: string; description: string }, i: number) => ({
        name: cat.name,
        description: cat.description || '',
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
        // Проверяем, не существует ли уже такая категория
        isExisting: existingCategories.some(
          (ec) =>
            ec.name.toLowerCase() === cat.name.toLowerCase() ||
            ec.name.toLowerCase().includes(cat.name.toLowerCase()) ||
            cat.name.toLowerCase().includes(ec.name.toLowerCase())
        ),
      })
    )

    // Фильтруем -- оставляем только новые категории
    const newCategories = suggested.filter((c: { isExisting: boolean }) => !c.isExisting)

    return NextResponse.json({
      categories: newCategories,
      total: newCategories.length,
      skipped: suggested.length - newCategories.length,
    })
  } catch (error) {
    console.error('Ошибка генерации категорий:', error)
    return NextResponse.json(
      { categories: [], message: 'Не удалось сгенерировать предложения' },
      { status: 500 }
    )
  }
}
