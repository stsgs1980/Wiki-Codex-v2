import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

const CATEGORY_COLORS = [
  '#059669', '#d97706', '#dc2626', '#7c3aed',
  '#0891b2', '#be185d', '#4f46e5', '#ca8a04',
  '#16a34a', '#9333ea', '#e11d48', '#0d9488',
]

/**
 * POST /api/documents/auto-categorize
 *
 * AI automatically determines category for a document.
 * If a matching category exists → assigns it.
 * If AI suggests a new category → creates it and assigns.
 * Also generates summary and suggests tags.
 */
export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json()

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId обязателен' },
        { status: 400 }
      )
    }

    // Fetch document
    const document = await db.document.findUnique({
      where: { id: documentId },
      select: { id: true, title: true, content: true, categoryId: true },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Документ не найден' },
        { status: 404 }
      )
    }

    // If already categorized, skip
    if (document.categoryId) {
      const existingCat = await db.category.findUnique({
        where: { id: document.categoryId },
      })
      return NextResponse.json({
        message: 'Документ уже имеет категорию',
        category: existingCat,
        autoAssigned: false,
      })
    }

    // Fetch existing categories for matching
    const existingCategories = await db.category.findMany({
      select: { id: true, name: true, color: true },
      orderBy: { sortOrder: 'asc' },
    })

    const categoryList = existingCategories.map((c) => c.name).join(', ')

    // Call AI to analyze and categorize
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
    let analysis: {
      category: string | null
      isNewCategory: boolean
      summary: string
      tags: string[]
    }

    try {
      const jsonMatch = messageContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('JSON not found')
      }
    } catch {
      return NextResponse.json(
        { error: 'AI не смог определить категорию', raw: messageContent },
        { status: 422 }
      )
    }

    if (!analysis.category) {
      return NextResponse.json(
        { error: 'AI не предложил категорию', raw: messageContent },
        { status: 422 }
      )
    }

    // Match or create category
    let category: { id: string; name: string; color: string } | null = null

    // Try to match existing category (fuzzy match)
    const match = existingCategories.find(
      (c) =>
        c.name.toLowerCase() === analysis.category!.toLowerCase() ||
        c.name.toLowerCase().includes(analysis.category!.toLowerCase()) ||
        analysis.category!.toLowerCase().includes(c.name.toLowerCase())
    )

    if (match) {
      category = match
    } else {
      // Create new category
      const colorIndex = existingCategories.length % CATEGORY_COLORS.length
      const newCategory = await db.category.create({
        data: {
          name: analysis.category,
          color: CATEGORY_COLORS[colorIndex],
          sortOrder: existingCategories.length,
        },
      })
      category = newCategory
    }

    // Update document with category
    await db.document.update({
      where: { id: documentId },
      data: {
        categoryId: category.id,
        summary: analysis.summary || null,
      },
    })

    // Handle tags — create missing tags and connect
    if (analysis.tags && Array.isArray(analysis.tags) && analysis.tags.length > 0) {
      const existingTags = await db.tag.findMany({
        select: { id: true, name: true },
      })

      for (const tagName of analysis.tags) {
        // Try to find existing tag
        let tagId: string | null = null
        const tagMatch = existingTags.find(
          (t) => t.name.toLowerCase() === tagName.toLowerCase()
        )

        if (tagMatch) {
          tagId = tagMatch.id
        } else {
          // Create new tag
          const tagColorIndex = existingTags.length % CATEGORY_COLORS.length
          try {
            const newTag = await db.tag.create({
              data: {
                name: tagName,
                color: CATEGORY_COLORS[tagColorIndex],
              },
            })
            tagId = newTag.id
            existingTags.push({ id: newTag.id, name: tagName })
          } catch {
            // Tag might already exist (race condition), skip
            continue
          }
        }

        if (tagId) {
          // Connect tag to document (ignore if already connected)
          try {
            await db.documentTag.create({
              data: {
                documentId,
                tagId,
              },
            })
          } catch {
            // Already connected, skip
          }
        }
      }
    }

    // Fetch updated document with relations
    const updatedDoc = await db.document.findUnique({
      where: { id: documentId },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    })

    return NextResponse.json({
      category,
      summary: analysis.summary,
      tags: analysis.tags,
      autoAssigned: true,
      document: updatedDoc,
    })
  } catch (error) {
    console.error('Error auto-categorizing document:', error)
    return NextResponse.json(
      { error: 'Не удалось автоматически категоризировать документ' },
      { status: 500 }
    )
  }
}
