import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!content || content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Содержимое заметки должно быть не менее 10 символов' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Ты -- ассистент анализа заметок для базы знаний Wiki Codex.
Проанализируй текст заметки и предоставь:
1. suggestedTitle -- краткий и точный заголовок (до 60 символов), отражающий суть заметки
2. summary -- краткое содержание в 1-2 предложениях
3. topics -- список ключевых тем/тематик (2-5 штук)
4. mood -- общее настроение/тон заметки (одно слово: "идея", "план", "наблюдение", "задача", "рефлексия", "заметка")

Ответь ТОЛЬКО валидным JSON, без дополнительного текста:
{
  "suggestedTitle": "заголовок",
  "summary": "краткое содержание",
  "topics": ["тема1", "тема2"],
  "mood": "настроение"
}`,
        },
        {
          role: 'user',
          content: `Проанализируй эту заметку:\n\n${content.substring(0, 3000)}`,
        },
      ],
      temperature: 0.3,
    })

    const messageContent = completion.choices[0]?.message?.content || ''

    let analysis
    try {
      const jsonMatch = messageContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('JSON не найден')
      }
    } catch {
      analysis = {
        suggestedTitle: null,
        summary: null,
        topics: [],
        mood: 'заметка',
      }
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error analyzing note:', error)
    return NextResponse.json(
      { error: 'Failed to analyze note' },
      { status: 500 }
    )
  }
}
