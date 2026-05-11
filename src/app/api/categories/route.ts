import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { autoBackup } from '@/lib/backup'
import { createCategorySchema, deleteByIdSchema } from '@/lib/validations'

export async function GET() {
  try {
    const categories = await db.category.findMany({
      include: {
        _count: { select: { documents: true } },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
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
    await db.category.delete({ where: { id: parsed.data.id } })
    autoBackup()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createCategorySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { name, description, color, sortOrder } = parsed.data

    const existing = await db.category.findFirst({
      where: { name: { equals: name } },
    })
    if (!existing) {
      const existingLower = await db.category.findFirst({
        where: { name: { equals: name.toLowerCase() } },
      })
      if (existingLower) {
        return NextResponse.json(existingLower, { status: 200 })
      }
    }
    if (existing) {
      return NextResponse.json(existing, { status: 200 })
    }

    const category = await db.category.create({
      data: {
        name,
        description: description || null,
        color,
        sortOrder: sortOrder || 0,
      },
    })

    autoBackup()
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
