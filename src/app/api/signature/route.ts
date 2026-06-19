import { NextRequest, NextResponse } from 'next/server'
import { generateSignature } from './_lib/generate-signature'
import type { SignatureParams } from './_lib/signature-types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params: SignatureParams = {
      project: searchParams.get('project') || 'wiki-codex',
      name: searchParams.get('name') || '',
      role: searchParams.get('role') || '',
      email: searchParams.get('email') || '',
      phone: searchParams.get('phone') || '',
      mode: searchParams.get('mode') || 'auto',
    }

    const result = generateSignature(params)

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return new NextResponse(result.html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Error generating signature:', error)
    return NextResponse.json(
      { error: 'Failed to generate signature' },
      { status: 500 },
    )
  }
}
