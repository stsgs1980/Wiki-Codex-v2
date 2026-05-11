import { PrismaClient } from '@prisma/client'

// Runtime-валидация окружения
const requiredEnvVars = ['DATABASE_URL'] as const
const missing = requiredEnvVars.filter(key => !process.env[key])
if (missing.length > 0) {
  console.warn(`[WARN] Missing env vars: ${missing.join(', ')}.`)
}

const GLOBAL_KEY = '__prisma_client_v8__'

const globalForPrisma = globalThis as unknown as {
  [key: string]: PrismaClient | undefined
}

export const db =
  globalForPrisma[GLOBAL_KEY] ??
  new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma[GLOBAL_KEY] = db
}
