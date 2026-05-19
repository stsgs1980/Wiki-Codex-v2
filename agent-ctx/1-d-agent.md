# Task 1-d: Fix next.config.ts, package.json, and update instructions-view.tsx

## Work Log

### 1. Fixed `/home/z/my-project/next.config.ts`
- Removed `output: "standalone"` from Next.js config (incompatible with Vercel deployments)
- Left `reactStrictMode: true` intact

### 2. Updated `/home/z/my-project/package.json`
- Changed `start` script from `NODE_ENV=production bun .next/standalone/server.js 2>&1 | tee server.log` to `next start`
- Added `vercel-build` script: `prisma migrate deploy && next build`

### 3. Updated `/home/z/my-project/src/components/codex/instructions-view.tsx`
- Replaced the entire `survival-guide` template in `BUILTIN_TEMPLATES` array
- Old content referenced SQLite .db file downloads, local file restoration, and Z.ai sandbox recovery
- New content reflects Vercel/PostgreSQL deployment model:
  - Step 1: Export data as JSON (via /api/download-db)
  - Step 2: Create backup via API (POST /api/backup, GET /api/download-db)
  - Step 3: Vercel Postgres recovery (managed by Neon/Supabase, import via API)
  - Step 4: Verification checklist (unchanged)
  - Step 5: Local development with PostgreSQL (DATABASE_URL, prisma migrate, bun run dev)

## Verification
- Ran `bun run lint` — 0 errors, 2 pre-existing warnings in sidebar.tsx (unrelated to changes)
- All changes are non-breaking and consistent with the Vercel deployment model
