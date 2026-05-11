/**
 * Lightweight auto-backup utility.
 * Copies db/custom.db to db/backups/custom_YYYY-MM-DD_HH-MM.db
 * Keeps last 10 backups, deletes older ones.
 * Designed to be called after any write mutation (POST/PATCH/DELETE).
 */
import { execSync } from 'child_process'
import { existsSync, mkdirSync, readdirSync, unlinkSync, statSync } from 'fs'
import { join } from 'path'

const DB_DIR = join(process.cwd(), 'db')
const BACKUP_DIR = join(DB_DIR, 'backups')
const DB_FILE = join(DB_DIR, 'custom.db')
const MAX_BACKUPS = 10

function ensureDir() {
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true })
}

function ts(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`
}

function cleanup() {
  if (!existsSync(BACKUP_DIR)) return
  const files = readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.db'))
    .map((f) => ({ path: join(BACKUP_DIR, f), mtime: statSync(join(BACKUP_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)
  for (let i = MAX_BACKUPS; i < files.length; i++) {
    try { unlinkSync(files[i].path) } catch { /* ignore */ }
  }
}

export function autoBackup() {
  if (!existsSync(DB_FILE)) return
  try {
    ensureDir()
    const dest = join(BACKUP_DIR, `custom_${ts()}.db`)
    execSync(`cp "${DB_FILE}" "${dest}"`)
    cleanup()
  } catch {
    // Backup failure must never break the main operation
  }
}
