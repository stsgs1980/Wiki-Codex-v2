import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { AiAnalysis, ExistingCategory } from './categorize'

const CATEGORY_COLORS = [
  '#059669', '#d97706', '#dc2626', '#7c3aed',
  '#0891b2', '#be185d', '#4f46e5', '#ca8a04',
  '#16a34a', '#9333ea', '#e11d48', '#0d9488',
]

/**
 * Apply the AI analysis to the document: match/create category, update
 * document with category + summary, create+connect tags, return the
 * updated document with the auto-assigned category.
 *
 * Preserved verbatim from the original POST handler:
 *  - fuzzy category match (case-insensitive equals OR bidirectional includes)
 *  - new category uses CATEGORY_COLORS[existingCategories.length % 12]
 *    and sortOrder = existingCategories.length
 *  - document.update sets categoryId + summary (summary coerced to null if falsy)
 *  - tag handling: dedup by lowercased name, create new tags with
 *    CATEGORY_COLORS[existingTags.length % 12], connect via documentTag.create
 *    (race-condition aware — both create + connect swallow errors)
 *  - final response: { category, summary, tags, autoAssigned: true, document }
 */
export async function applyCategory(
  documentId: string,
  analysis: AiAnalysis,
  existingCategories: ExistingCategory[]
): Promise<NextResponse> {
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
        name: analysis.category!,
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
}
