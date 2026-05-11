import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = resolve(__dirname, '../../../../db/custom.db')

export async function GET() {
  if (!existsSync(dbPath)) {
    return NextResponse.json({ error: 'Database file not found' }, { status: 404 })
  }
  const data = readFileSync(dbPath)
  return new NextResponse(data, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="wiki-codex-backup.db"',
    },
  })
}
