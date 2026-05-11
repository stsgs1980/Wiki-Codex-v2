import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

/**
 * Semantic search: uses AI to match documents by meaning, not just keywords.
 */
export async function POST(request: NextRequest) {
  try {
    const { query, limit = 10 } = await request.json()

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400 }
      )
    }

    // Fetch all documents with metadata
    const documents = await db.document.findMany({
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    })

    if (documents.length === 0) {
      return NextResponse.json({ results: [], query: query.trim(), total: 0 })
    }

    const zai = await ZAI.create()

    // Build document representations with enough context for AI evaluation
    const docList = documents.map((doc, i) => ({
      idx: i,
      title: doc.title,
      summary: doc.summary || '',
      // Use first 800 chars for better semantic matching
      snippet: doc.content.substring(0, 800),
    }))

    const maxResults = Math.min(limit, 20)

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Ты -- система семантического поиска для базы знаний разработчиков.
На вход: запрос пользователя и список документов (idx, title, summary, snippet).
Оцени релевантность КАЖДОГО документа по смысловому совпадению с запросом, а не по точному совпадению слов.
Синонимы, связанные понятия и частичные совпадения учитывай.
Верни ТОЛЬКО JSON массив без markdown-форматирования: [{"idx":0,"score":0.95},{"idx":3,"score":0.7},...]
Score от 0.0 до 1.0. Включай документы с score >= 0.15. Максимум ${maxResults} результатов.
Обязательно оцени КАЖДЫЙ документ -- не оставляй массив пустым если есть хоть какое-то совпадение.
Если ни один документ не имеет никакого отношения к запросу -- верни [].`,
        },
        {
          role: 'user',
          content: `Запрос: "${query.trim()}"\n\nДокументы:\n${docList
            .map((d) => `[${d.idx}] Title: "${d.title}"${d.summary ? ` | Summary: ${d.summary}` : ''}\n${d.snippet}`)
            .join('\n---\n')}`,
        },
      ],
      temperature: 0.1,
    })

    const messageContent = completion.choices[0]?.message?.content || ''

    let rankings: Array<{ idx: number; score: number }> = []
    try {
      // Strip markdown code fences if present
      const cleaned = messageContent.replace(/```json?\s*/g, '').replace(/```/g, '')
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        rankings = JSON.parse(jsonMatch[0])
      }
    } catch {
      return NextResponse.json({ results: [], query: query.trim(), total: 0 })
    }

    const results = rankings
      .filter((r) => r.idx >= 0 && r.idx < documents.length && r.score >= 0.15)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => ({
        ...documents[r.idx],
        relevanceScore: r.score,
      }))

    return NextResponse.json({
      results,
      query: query.trim(),
      total: results.length,
    })
  } catch (error) {
    console.error('Error in semantic search:', error)
    return NextResponse.json(
      { error: 'Semantic search failed' },
      { status: 500 }
    )
  }
}
