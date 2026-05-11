import { NextResponse } from 'next/server'

/**
 * GET /api — Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Wiki Codex',
    version: '2.0',
  })
}
