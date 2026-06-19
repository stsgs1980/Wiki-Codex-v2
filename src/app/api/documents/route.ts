import { NextRequest, NextResponse } from 'next/server'
import { paginationSchema } from '@/lib/validations'
import { fetchDocuments } from './_lib/queries'
import { createDocument } from './_lib/create'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = paginationSchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors
      const msg = Object.entries(fe)
        .map(([f, e]) => `${f}: ${(e as string[]).join(', ')}`)
        .join('; ')
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const data = await fetchDocuments(parsed.data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  return createDocument(body)
}
