import { NextRequest, NextResponse } from 'next/server'
import { fetchInstructions } from './_lib/queries'
import { createInstruction } from './_lib/create'
import { extractInstructionsFromDoc } from './_lib/extract'

// GET /api/instructions -- list all instructions
export async function GET() {
  try {
    const data = await fetchInstructions()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching instructions:', error)
    return NextResponse.json({ error: 'Failed to fetch instructions' }, { status: 500 })
  }
}

// POST /api/instructions -- create manual instruction OR AI extract from document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { extractFromDocId } = body

    // --- AI extraction mode ---
    if (extractFromDocId) {
      return await extractInstructionsFromDoc(extractFromDocId)
    }

    // --- Manual creation mode ---
    return await createInstruction(body)
  } catch (error) {
    console.error('Error creating instruction:', error)
    return NextResponse.json({ error: 'Failed to create instruction' }, { status: 500 })
  }
}
