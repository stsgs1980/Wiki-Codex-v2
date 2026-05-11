import { chmodSync, mkdirSync, existsSync } from 'fs'
import { dirname, resolve } from 'path'
import { PrismaClient } from '@prisma/client'

// Runtime-валидация окружения
const requiredEnvVars = ['DATABASE_URL'] as const
const missing = requiredEnvVars.filter(key => !process.env[key])
if (missing.length > 0) {
  console.warn(`[WARN] Missing env vars: ${missing.join(', ')}. Using defaults.`)
}

// Resolve DATABASE_URL same way Prisma does: relative to prisma/schema.prisma directory
const rawUrl = process.env.DATABASE_URL || 'file:./db/custom.db'
const relativePath = rawUrl.replace(/^file:/, '')
const prismaDir = resolve(process.cwd(), 'prisma')
const dbPath = resolve(prismaDir, relativePath)

// Ensure directory exists
const dir = dirname(dbPath)
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true })
}

// Safe permissions: 755 for dirs, 644 for files
try { chmodSync(dir, 0o755) } catch { /* container environments */ }
if (existsSync(dbPath)) {
  try { chmodSync(dbPath, 0o644) } catch { /* read-only filesystems */ }
}

const GLOBAL_KEY = '__prisma_client_v8__'

const globalForPrisma = globalThis as unknown as {
  [key: string]: PrismaClient | undefined
}

export const db =
  globalForPrisma[GLOBAL_KEY] ??
  new PrismaClient({
    datasourceUrl: `file:${dbPath}?connection_limit=1&pool_timeout=0`,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma[GLOBAL_KEY] = db
}
