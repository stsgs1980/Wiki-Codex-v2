#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs')
const path = require('path')

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma')
const dbUrl = process.env.DATABASE_URL || ''

let schema = fs.readFileSync(schemaPath, 'utf-8')

if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
  schema = schema.replace(
    /provider\s*=\s*"sqlite"/,
    'provider = "postgresql"'
  )
  console.log('[prisma-switch] Detected PostgreSQL URL -> provider = "postgresql"')
} else {
  console.log('[prisma-switch] Using SQLite (local dev) -> provider = "sqlite"')
}

fs.writeFileSync(schemaPath, schema)
