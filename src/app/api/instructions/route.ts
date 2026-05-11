import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeField } from '@/lib/sanitize'

// GET /api/instructions -- list all instructions
export async function GET() {
  try {
    const instructions = await db.instruction.findMany({
      include: {
        sourceDoc: { select: { id: true, title: true } },
      },
      orderBy: [{ isBuiltIn: 'desc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json({ instructions, total: instructions.length })
  } catch (error) {
    console.error('Error fetching instructions:', error)
    return NextResponse.json({ error: 'Failed to fetch instructions' }, { status: 500 })
  }
}

// POST /api/instructions -- create manual instruction OR AI extract from document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, steps, sourceDocId, extractFromDocId } = body

    // --- AI extraction mode ---
    if (extractFromDocId) {
      const document = await db.document.findUnique({ where: { id: extractFromDocId } })
      if (!document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }

      // Strip emoji/unicode from content before analysis (No-Unicode Policy v1.0)
      const cleanContent = document.content
        .replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]|[\u{1F900}-\u{1F9FF}]|[\u{2702}-\u{27B0}]/gu, '')
        .replace(/[→←↑↓↔⇒⇐]/g, '->')

      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You extract step-by-step instructions from documents for a developer knowledge base.

IMPORTANT: No-Unicode Policy v1.0 -- output must contain ONLY ASCII characters. No emoji, no unicode arrows, no special unicode punctuation. Use -> instead of arrows.

Analyze the document and extract all instruction sets found. Each instruction set has:
- title: short name of the instruction
- description: what this instruction is about  
- steps: array of step objects, each with:
  - title: step title
  - description: explanation text (ASCII only)
  - codeBlocks: array of {label, code} pairs

If no instructions are found, return an empty array.

Response format -- ONLY valid JSON, no markdown fences, no extra text:
{"instructions":[{"title":"...","description":"...","steps":[{"title":"...","description":"...","codeBlocks":[{"label":"...","code":"..."}]}]}]}`,
          },
          {
            role: 'user',
            content: `Extract all instructions from this document:\n\n${cleanContent.substring(0, 6000)}`,
          },
        ],
        temperature: 0.2,
      })

      const messageContent = completion.choices[0]?.message?.content || ''

      let extracted: Array<{
        title: string
        description: string
        steps: Array<{
          title: string
          description: string
          codeBlocks: Array<{ label: string; code: string }>
        }>
      }>

      try {
        const cleaned = messageContent.replace(/```json?/g, '').replace(/```/g, '')
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          extracted = parsed.instructions || []
        } else {
          extracted = []
        }
      } catch {
        extracted = []
      }

      if (extracted.length === 0) {
        return NextResponse.json({ instructions: [], total: 0, message: 'No instructions found in document' })
      }

      // Save each extracted instruction to DB
      const created = []
      for (const instr of extracted) {
        if (!instr.title || !instr.steps?.length) continue
        // Apply No-Unicode Policy: strip any remaining non-ASCII
        const sanitize = (s: string) => s.replace(/[^\x20-\x7E\u0400-\u04FF]/g, '').trim()
        const sanitizedSteps = instr.steps.map((s) => ({
          title: sanitize(s.title),
          description: sanitize(s.description || ''),
          codeBlocks: (s.codeBlocks || []).map((c) => ({
            label: sanitize(c.label),
            code: c.code,
          })),
        }))

        const instruction = await db.instruction.create({
          data: {
            title: sanitize(instr.title),
            description: sanitize(instr.description || ''),
            steps: JSON.stringify(sanitizedSteps),
            sourceDocId: extractFromDocId,
          },
          include: { sourceDoc: { select: { id: true, title: true } } },
        })
        created.push(instruction)
      }

      return NextResponse.json({ instructions: created, total: created.length })
    }

    // --- Manual creation mode ---
    if (!title || !steps) {
      return NextResponse.json({ error: 'Title and steps are required' }, { status: 400 })
    }

    const cleanTitle = sanitizeField(title, 'instruction.title')
    const cleanDescription = sanitizeField(description || '', 'instruction.description')
    const cleanSteps = typeof steps === 'string' ? sanitizeField(steps, 'instruction.steps') : JSON.stringify(steps)

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
  } catch (error) {
    console.error('Error creating instruction:', error)
    return NextResponse.json({ error: 'Failed to create instruction' }, { status: 500 })
  }
}
