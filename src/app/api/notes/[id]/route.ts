import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeField } from '@/lib/sanitize'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const note = await db.note.findUnique({
      where: { id },
    })

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error('[notes] Error fetching note:', error)
    return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { title, content } = body as { title?: string; content?: string }

    const updateData: { title?: string; content?: string } = {}

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Title must be a non-empty string' },
          { status: 400 }
        )
      }
      let cleanTitle = sanitizeField(title.trim(), 'note.title')
      // Safety: if sanitize strips everything, keep original
      if (!cleanTitle.trim()) {
        cleanTitle = title.trim()
      }
      updateData.title = cleanTitle
    }

    if (content !== undefined) {
      let cleanContent = sanitizeField(typeof content === 'string' ? content : '', 'note.content')
      // Safety: if sanitize strips all content that existed, keep original
      if (content && typeof content === 'string' && content.trim() && !cleanContent.trim()) {
        cleanContent = content
      }
      updateData.content = cleanContent
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const note = await db.note.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('[notes] Error updating note:', error)
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }
    const errMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `Ошибка обновления заметки: ${errMsg.substring(0, 200)}` },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.note.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[notes] Error deleting note:', error)
    if (error instanceof Error && error.message.includes('Record to delete not found')) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}
