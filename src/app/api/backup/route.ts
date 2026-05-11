import { NextResponse } from 'next/server'
import { exportAllData } from '@/lib/backup'

/**
 * POST /api/backup — Export all data as JSON
 * (replaces the old file-copy backup mechanism)
 */
export async function POST() {
  try {
    const data = await exportAllData()
    return NextResponse.json({
      success: true,
      exportedAt: data.exportedAt,
      stats: {
        categories: data.categories.length,
        tags: data.tags.length,
        documents: data.documents.length,
        terms: data.terms.length,
        notes: data.notes.length,
        instructions: data.instructions.length,
      },
    })
  } catch (error) {
    console.error('Backup/export failed:', error)
    return NextResponse.json({ error: 'Backup failed' }, { status: 500 })
  }
}

/**
 * GET /api/backup — Get backup status/info
 */
export async function GET() {
  try {
    const data = await exportAllData()
    return NextResponse.json({
      provider: 'postgresql',
      exportAvailable: true,
      stats: {
        categories: data.categories.length,
        tags: data.tags.length,
        documents: data.documents.length,
        terms: data.terms.length,
        notes: data.notes.length,
        instructions: data.instructions.length,
      },
    })
  } catch (error) {
    console.error('Backup status failed:', error)
    return NextResponse.json({ error: 'Failed to get backup status' }, { status: 500 })
  }
}
