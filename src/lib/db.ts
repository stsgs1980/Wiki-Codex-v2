import { PrismaClient } from '@prisma/client'

/**
 * Prisma Client singleton for both development and serverless (Vercel).
 *
 * In development: reuse the client across HMR refreshes to avoid
 * exhausting database connections.
 *
 * In serverless (Vercel): each function invocation gets its own isolated
 * PrismaClient, but we still cache within the same cold-start lifecycle.
 */
const GLOBAL_KEY = '__prisma_client_v9__'

const globalForPrisma = globalThis as unknown as {
  [key: string]: PrismaClient | undefined
}

export const db =
  globalForPrisma[GLOBAL_KEY] ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma[GLOBAL_KEY] = db
}
