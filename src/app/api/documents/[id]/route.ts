import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeField, ensureStackSignature } from '@/lib/sanitize'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const document = await db.document.findUnique({
      where: { id },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Increment view count
    await db.document.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, categoryId, isStarred, content, tagIds } = body

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) {
      const cleanTitle = sanitizeField(title, 'document.title')
      // Дедупликация: не дать переименовать в уже существующий title
      const existing = await db.document.findFirst({
        where: { title: cleanTitle, id: { not: id } },
      })
      if (existing) {
        return NextResponse.json(
          { error: 'Документ с таким заголовком уже существует', existingId: existing.id },
          { status: 409 }
        )
      }
      updateData.title = cleanTitle
    }
    if (categoryId !== undefined) {
      // Normalize categoryId: treat "none", "all", "" as null
      updateData.categoryId = categoryId && categoryId !== 'none' && categoryId !== 'all' ? categoryId : null
    }
    if (isStarred !== undefined) updateData.isStarred = isStarred
    if (content !== undefined) updateData.content = ensureStackSignature(sanitizeField(content, 'document.content'))

    const document = await db.$transaction(async (tx) => {
      // Handle tag updates
      if (tagIds !== undefined) {
        // Delete existing tag relations
        await tx.documentTag.deleteMany({ where: { documentId: id } })
        // Create new ones
        if (tagIds.length > 0) {
          await tx.documentTag.createMany({
            data: tagIds.map((tagId: string) => ({
              documentId: id,
              tagId,
            })),
          })
        }
      }

      return tx.document.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          tags: { include: { tag: true } },
        },
      })
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error updating document:', error)
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.$transaction(async (tx) => {
      await tx.documentTag.deleteMany({ where: { documentId: id } })
      await tx.document.delete({ where: { id } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    if (error instanceof Error && error.message.includes('Record to delete not found')) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
