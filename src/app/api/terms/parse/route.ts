import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import { autoBackup } from '@/lib/backup'
import { sanitizeField } from '@/lib/sanitize'

export async function POST(request: NextRequest) {
  try {
    const { content, documentId } = await request.json()

    if (!content) {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'Ты -- эксперт-лексикограф. Извлеки все английские технические термины из текста. Для каждого термина укажи: 1) term (на английском), 2) translation (перевод на русский), 3) explanation (пояснение для чего он нужен и что даёт), 4) usage (пример использования). Ответь ТОЛЬКО валидным JSON массивом без markdown: [{"term":"...","translation":"...","explanation":"...","usage":"..."}]. Максимум 30 терминов.',
        },
        {
          role: 'user',
          content: `Извлеки термины из следующего текста:\n\n${content.substring(0, 6000)}`,
        },
      ],
      temperature: 0.2,
    })

    const messageContent = completion.choices[0]?.message?.content || ''

    // Parse JSON array from AI response
    let parsedTerms: Array<{
      term: string
      translation: string
      explanation: string
      usage?: string
    }> = []

    try {
      const jsonMatch = messageContent.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        parsedTerms = JSON.parse(jsonMatch[0])
      }
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response as JSON', raw: messageContent },
        { status: 500 }
      )
    }

    // Create terms with dedup logic
    const createdTerms: typeof parsedTerms = []
    let created = 0
    let skipped = 0

    for (const item of parsedTerms) {
      if (!item.term || !item.translation || !item.explanation) {
        skipped++
        continue
      }

      // Check for existing term (case-insensitive, SQLite compatible)
      const existing = await db.term.findFirst({
        where: {
          term: { equals: item.term },
        },
      })
      // Also check case-insensitive fallback
      const existingLower = !existing
        ? await db.term.findFirst({
            where: {
              term: { equals: item.term.toLowerCase() },
            },
          })
        : null

      if (existing || existingLower) {
        skipped++
        continue
      }

      const createdTerm = await db.term.create({
        data: {
          term: sanitizeField(item.term, 'term.name'),
          translation: sanitizeField(item.translation, 'term.translation'),
          explanation: sanitizeField(item.explanation, 'term.explanation'),
          usage: item.usage ? sanitizeField(item.usage, 'term.usage') : null,
          documentId: documentId || null,
        },
        include: {
          document: {
            select: { id: true, title: true },
          },
        },
      })

      createdTerms.push(createdTerm as unknown as (typeof parsedTerms)[number])
      created++
    }

    autoBackup()
    return NextResponse.json({
      terms: createdTerms,
      created,
      skipped,
    })
  } catch (error) {
    console.error('Error parsing terms:', error)
    return NextResponse.json(
      { error: 'Failed to parse terms' },
      { status: 500 }
    )
  }
}
