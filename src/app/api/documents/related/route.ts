import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

/**
 * Find documents related to a given document by content similarity.
 * Uses AI to compare semantic similarity between documents.
 */
export async function POST(request: NextRequest) {
  try {
    const { documentId, limit = 5 } = await request.json()

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      )
    }

    // Fetch the source document
    const sourceDoc = await db.document.findUnique({
      where: { id: documentId },
    })

    if (!sourceDoc) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Fetch all other documents (except the source)
    const otherDocs = await db.document.findMany({
      where: { id: { not: documentId } },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    })

    if (otherDocs.length === 0) {
      return NextResponse.json({ related: [], sourceId: documentId, total: 0 })
    }

    const zai = await ZAI.create()

    // Build compact comparison data
    const docList = otherDocs.map((doc, i) => ({
      idx: i,
      title: doc.title,
      summary: doc.summary || '',
      snippet: doc.content.substring(0, 300),
    }))

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Ты -- система поиска связанных документов для базы знаний.
На вход: исходный документ и список других документов.
Определи, какие документы ПОХОЖИ по смыслу, теме, или дополняют исходный.
Критерии: совпадение темы, пересечение концепций, смежные технологии, логическая связь.
Верни ТОЛЬКО JSON массив: [{"idx":0,"score":0.9,"reason":"оба о React хуках"},...]
Score от 0 до 1. Включай только score >= 0.3. Максимум ${Math.min(limit, 10)} результатов.
Если нет похожих -- верни [].`,
        },
        {
          role: 'user',
          content: `Исходный документ: "${sourceDoc.title}"\n${sourceDoc.summary || ''}\n${sourceDoc.content.substring(0, 500)}\n\nДругие документы:\n${docList
            .map((d) => `[${d.idx}] "${d.title}" | ${d.summary} | ${d.snippet}`)
            .join('\n\n')}`,
        },
      ],
      temperature: 0.1,
    })

    const messageContent = completion.choices[0]?.message?.content || ''

    let rankings: Array<{ idx: number; score: number; reason?: string }> = []
    try {
      const jsonMatch = messageContent.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        rankings = JSON.parse(jsonMatch[0])
      }
    } catch {
      return NextResponse.json({ related: [], sourceId: documentId, total: 0 })
    }

    const related = rankings
      .filter((r) => r.idx >= 0 && r.idx < otherDocs.length && r.score >= 0.3)
      .slice(0, limit)
      .map((r) => ({
        ...otherDocs[r.idx],
        similarityScore: r.score,
        reason: r.reason || '',
      }))

    return NextResponse.json({
      related,
      sourceId: documentId,
      total: related.length,
    })
  } catch (error) {
    console.error('Error finding related documents:', error)
    return NextResponse.json(
      { error: 'Failed to find related documents' },
      { status: 500 }
    )
  }
}
