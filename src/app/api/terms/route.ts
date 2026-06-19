import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { fetchTerms } from './_lib/queries'
import { createTerm } from './_lib/create'
import { mergeTerms } from './_lib/update'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const documentId = searchParams.get('documentId') || ''
    const includeDuplicates = searchParams.get('duplicates') === 'true'

    const data = await fetchTerms({ search, documentId, includeDuplicates })
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching terms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch terms' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    return await createTerm(body)
  } catch (error) {
    console.error('Error creating term:', error)
    return NextResponse.json(
      { error: 'Failed to create term' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const ids = searchParams.get('ids')

    if (ids) {
      // Batch delete: comma-separated IDs
      const idList = ids.split(',').filter(Boolean)
      if (idList.length === 0) {
        return NextResponse.json(
          { error: 'No valid IDs provided' },
          { status: 400 }
        )
      }

      const result = await db.term.deleteMany({
        where: { id: { in: idList } },
      })

      return NextResponse.json({ success: true, deleted: result.count })
    }

    if (!id) {
      return NextResponse.json(
        { error: 'id or ids query parameter is required' },
        { status: 400 }
      )
    }

    await db.term.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting term:', error)
    return NextResponse.json(
      { error: 'Failed to delete term' },
      { status: 500 }
    )
  }
}

// Merge duplicate terms: keep one, delete the rest
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    return await mergeTerms(body)
  } catch (error) {
    console.error('Error merging terms:', error)
    return NextResponse.json(
      { error: 'Failed to merge terms' },
      { status: 500 }
    )
  }
}
