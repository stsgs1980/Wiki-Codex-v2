---
Task ID: 1-c
Agent: subagent
Task: Remove autoBackup() calls from all API route files

Work Log:
- Read worklog at /home/z/my-project/worklog.md (Task 1: Clone & run Wiki-Codex-v2)
- Read all 11 API route files to identify exact import and call syntax
- Removed `import { autoBackup } from '@/lib/backup'` (single quotes) from 9 files
- Removed `import { autoBackup } from "@/lib/backup";` (double quotes + semicolon) from 2 files (notes routes)
- Removed all 19 `autoBackup()` / `autoBackup();` calls across all 11 files
- Verified with grep: only remaining `autoBackup` reference is in `/home/z/my-project/src/lib/backup.ts` (the definition itself)
- A `.bak` file at `api/instructions/route.ts.bak` still has references but is not active source code

Files edited:
1. src/app/api/documents/route.ts (1 call removed)
2. src/app/api/documents/[id]/route.ts (2 calls removed)
3. src/app/api/categories/route.ts (2 calls removed)
4. src/app/api/tags/route.ts (2 calls removed)
5. src/app/api/terms/route.ts (4 calls removed)
6. src/app/api/terms/parse/route.ts (1 call removed)
7. src/app/api/notes/route.ts (1 call removed, double-quote style)
8. src/app/api/notes/[id]/route.ts (2 calls removed, double-quote style)
9. src/app/api/instructions/[id]/route.ts (1 call removed)
10. src/app/api/seed/route.ts (1 call removed)
11. src/app/api/route.ts (2 calls removed)

Total: 11 imports + 19 calls removed

Stage Summary:
- All autoBackup() calls and imports cleanly removed from API routes
- autoBackup function definition preserved in src/lib/backup.ts for backward compatibility
- No remaining active references to autoBackup in API route files
