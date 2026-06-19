import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface ExtractedStep {
  title: string
  description: string
  codeBlocks: Array<{ label: string; code: string }>
}

interface ExtractedInstruction {
  title: string
  description: string
  steps: ExtractedStep[]
}

/**
 * AI extraction mode: extract step-by-step instructions from a document
 * using ZAI LLM, then persist each extracted instruction to the DB.
 *
 * No-Unicode Policy v1.0 is enforced both before sending content to the
 * LLM (strip emoji + unicode arrows) and after receiving the response
 * (strip any remaining non-ASCII / non-Cyrillic characters).
 */
export async function extractInstructionsFromDoc(
  extractFromDocId: string,
): Promise<NextResponse> {
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

  let extracted: ExtractedInstruction[]

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
  const created: Array<{
    id: string
    title: string
    description: string
    steps: string
    sourceDocId: string | null
    isBuiltIn: boolean
    createdAt: Date
    updatedAt: Date
    sourceDoc: { id: string; title: string } | null
  }> = []
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
