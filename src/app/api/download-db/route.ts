import { NextResponse } from 'next/server'
import { exportAllData } from '@/lib/backup'

/**
 * GET /api/download-db — Export all data as a JSON file
 * Exports all data as a downloadable JSON file
 */
export async function GET() {
  try {
    const data = await exportAllData()
    const jsonString = JSON.stringify(data, null, 2)
    const filename = `wiki-codex-backup-${new Date().toISOString().slice(0, 10)}.json`

    return new NextResponse(jsonString, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Data export failed:', error)
    return NextResponse.json({ error: 'Data export failed' }, { status: 500 })
  }
}
