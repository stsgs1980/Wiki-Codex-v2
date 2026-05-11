import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { autoBackup } from '@/lib/backup'
import { createTagSchema, deleteByIdSchema } from '@/lib/validations'

export async function GET() {
  try {
    const tags = await db.tag.findMany({
      include: {
        _count: { select: { documents: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(tags)
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = deleteByIdSchema.safeParse({ id: searchParams.get('id') })
    if (!parsed.success) {
      return NextResponse.json({ error: 'id query parameter is required' }, { status: 400 })
    }
    await db.tag.delete({ where: { id: parsed.data.id } })
    autoBackup()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tag:', error)
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createTagSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { name, color } = parsed.data

    const existing = await db.tag.findFirst({
      where: { name: { equals: name } },
    })
    if (!existing) {
      const existingLower = await db.tag.findFirst({
        where: { name: { equals: name.toLowerCase() } },
      })
      if (existingLower) {
        return NextResponse.json(existingLower, { status: 200 })
      }
    }
    if (existing) {
      return NextResponse.json(existing, { status: 200 })
    }

    const tag = await db.tag.create({
      data: { name, color },
    })

    autoBackup()
    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    )
  }
}
