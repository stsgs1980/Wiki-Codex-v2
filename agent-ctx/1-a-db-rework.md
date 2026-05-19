---
Task ID: 1-a
Agent: db-rework
Task: Rewrite Prisma schema and db.ts for PostgreSQL/Vercel compatibility

Work Log:
- Read worklog.md — previous agent had changed provider from "postgresql" to "sqlite" for sandbox compatibility
- Changed prisma/schema.prisma: `provider = "sqlite"` → `provider = "postgresql"`
- Rewrote src/lib/db.ts: removed all fs/path imports, chmodSync, mkdirSync, existsSync, path resolution; replaced with clean Prisma client singleton using standard pattern (no datasourceUrl override, relies on DATABASE_URL env var)
- Updated .env: `DATABASE_URL=file:./dev.db` → `DATABASE_URL=postgresql://user:password@localhost:5432/wiki_codex?schema=public`

Stage Summary:
- All three files updated successfully
- Schema now targets PostgreSQL (Vercel-compatible)
- db.ts has no filesystem operations (Vercel read-only filesystem compatible)
- .env has placeholder PostgreSQL URL (real value set in Vercel env vars)
