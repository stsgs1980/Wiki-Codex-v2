import { NextResponse } from 'next/server'
import { existsSync, mkdirSync, readdirSync, unlinkSync, statSync, copyFileSync } from 'fs'
import { join } from 'path'

const DB_DIR = join(process.cwd(), 'db')
const BACKUP_DIR = join(DB_DIR, 'backups')
const DB_FILE = join(DB_DIR, 'custom.db')
const MAX_BACKUPS = 10

function ensureBackupDir() {
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true })
}

function timestamp(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`
}

function cleanupOldBackups() {
  if (!existsSync(BACKUP_DIR)) return
  const files = readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.db'))
    .map((f) => ({
      path: join(BACKUP_DIR, f),
      mtime: statSync(join(BACKUP_DIR, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime)
  for (let i = MAX_BACKUPS; i < files.length; i++) {
    try { unlinkSync(files[i].path) } catch { /* ignore */ }
  }
}

export async function POST() {
  try {
    if (!existsSync(DB_FILE)) {
      return NextResponse.json({ error: 'Database file not found' }, { status: 404 })
    }

    ensureBackupDir()

    const dest = join(BACKUP_DIR, `custom_${timestamp()}.db`)
    copyFileSync(DB_FILE, dest)
    cleanupOldBackups()

    const backups = readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith('.db'))
      .map((f) => ({
        name: f,
        size: statSync(join(BACKUP_DIR, f)).size,
        date: statSync(join(BACKUP_DIR, f)).mtime.toISOString(),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({ success: true, backup: dest, backups })
  } catch (error) {
    console.error('Backup failed:', error)
    return NextResponse.json({ error: 'Backup failed' }, { status: 500 })
  }
}

export async function GET() {
  try {
    ensureBackupDir()

    const backups = existsSync(BACKUP_DIR)
      ? readdirSync(BACKUP_DIR)
          .filter((f) => f.endsWith('.db'))
          .map((f) => {
            const stat = statSync(join(BACKUP_DIR, f))
            return {
              name: f,
              size: stat.size,
              date: stat.mtime.toISOString(),
            }
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      : []

    return NextResponse.json({ backups, total: backups.length })
  } catch (error) {
    console.error('List backups failed:', error)
    return NextResponse.json({ error: 'Failed to list backups' }, { status: 500 })
  }
}
