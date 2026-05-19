---
Task ID: 1-b
Agent: backup-rewrite
Task: Rewrite backup system for Vercel compatibility

Work Log:
- Read worklog.md — understood project context (Wiki-Codex-v2, Prisma with SQLite in sandbox)
- Read all three original files:
  - src/lib/backup.ts — file-based backup using cp, mkdirSync, readdirSync
  - src/app/api/backup/route.ts — file-copy backup with filesystem ops
  - src/app/api/download-db/route.ts — served raw .db file via readFileSync
- Rewrote src/lib/backup.ts:
  - Removed all filesystem imports (child_process, fs, path)
  - Added `exportAllData()` that queries all 7 tables via Prisma and returns BackupData JSON
  - Kept `autoBackup()` as a no-op for backward compatibility (deprecated)
  - 11 other files import `autoBackup` — they continue to work without changes
- Rewrote src/app/api/backup/route.ts:
  - POST now calls exportAllData() and returns stats JSON
  - GET now calls exportAllData() and returns provider + stats info
  - No filesystem operations
- Rewrote src/app/api/download-db/route.ts:
  - GET now exports all data as a downloadable JSON file
  - Filename: wiki-codex-backup-YYYY-MM-DD.json
  - No filesystem operations
- Verified: lint passes (0 errors), dev server running cleanly

Stage Summary:
- All 3 backup-related files rewritten to be Vercel/serverless compatible
- Zero filesystem operations remain in any backup code
- autoBackup() kept as no-op so 9+ existing imports don't break
- All data export now goes through Prisma → JSON pathway
