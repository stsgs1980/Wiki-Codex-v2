import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categorizeDocument } from './_lib/categorize'
import { applyCategory } from './_lib/apply-category'

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

    // Call AI to analyze and categorize
    const result = await categorizeDocument(
      { title: document.title, content: document.content },
      existingCategories
    )

    if (!result.ok) {
      return result.response
    }

    // Apply the suggestion (match/create category, update doc, handle tags)
    return await applyCategory(documentId, result.analysis, existingCategories)
  } catch (error) {
    console.error('Error auto-categorizing document:', error)
    return NextResponse.json(
      { error: 'Не удалось автоматически категоризировать документ' },
      { status: 500 }
    )
  }
}
