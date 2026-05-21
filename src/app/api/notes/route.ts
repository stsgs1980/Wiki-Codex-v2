import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createNoteSchema } from '@/lib/validations'
import { sanitizeField } from '@/lib/sanitize'
import { contains } from '@/lib/db-filter'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() || ''

    const notes = await db.note.findMany({
      where: search
        ? {
            OR: [
              { title: contains(search) },
              { content: contains(search) },
            ],
          }
        : undefined,
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('[notes] Error fetching notes:', error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // ── 1. Parse body ────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createNoteSchema.safeParse(body)
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors
    const msg = Object.entries(fe).map(([f, e]) => `${f}: ${(e as string[]).join(', ')}`).join('; ')
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const { title, content } = parsed.data

  // ── 2. Sanitize with safety net ──────────────────────────────────
  let cleanTitle = sanitizeField(title, 'note.title')
  // If sanitize strips the title entirely (e.g. all non-ASCII chars), keep original
  if (!cleanTitle.trim()) {
    cleanTitle = title.trim()
  }

  // Content can be empty, but preserve it if sanitize strips everything
  let cleanContent = sanitizeField(content, 'note.content')
  if (content.trim() && !cleanContent.trim()) {
    cleanContent = content
  }

  // ── 3. Create note ───────────────────────────────────────────────
  try {
    const note = await db.note.create({
      data: {
        title: cleanTitle,
        content: cleanContent,
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('[notes] Error creating note:', error)
    const errMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `Ошибка создания заметки: ${errMsg.substring(0, 200)}` },
      { status: 500 }
    )
  }
}
