import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeField } from '@/lib/sanitize'

interface CreateInstructionBody {
  title?: string
  description?: string
  steps?: string | unknown[]
  sourceDocId?: string | null
  extractFromDocId?: string
}

/**
 * Manual creation mode: create a single instruction from user-provided
 * title/description/steps.
 *
 * Steps may arrive as a JSON string (sanitized) or as a pre-parsed array
 * (JSON.stringify'd). Title and description are required.
 */
export async function createInstruction(body: CreateInstructionBody): Promise<NextResponse> {
  const { title, description, steps, sourceDocId } = body

  // --- Manual creation mode ---
  if (!title || !steps) {
    return NextResponse.json({ error: 'Title and steps are required' }, { status: 400 })
  }

  const cleanTitle = sanitizeField(title, 'instruction.title')
  const cleanDescription = sanitizeField(description || '', 'instruction.description')
  const cleanSteps =
    typeof steps === 'string' ? sanitizeField(steps, 'instruction.steps') : JSON.stringify(steps)

  const instruction = await db.instruction.create({
    data: {
      title: cleanTitle,
      description: cleanDescription,
      steps: cleanSteps,
      sourceDocId: sourceDocId || null,
    },
    include: { sourceDoc: { select: { id: true, title: true } } },
  })

  return NextResponse.json(instruction, { status: 201 })
}
