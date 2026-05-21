# Task 5-a: Create POST /api/documents/cleanup endpoint

## Agent: subagent

## Summary

Created the duplicate document cleanup API endpoint at `/src/app/api/documents/cleanup/route.ts`.

## What was done

1. **Created** `/src/app/api/documents/cleanup/route.ts` with two modes:
   - **Scan mode** (`action: 'scan'`): Finds all duplicate documents grouped by:
     - Title (case-insensitive via `title.toLowerCase()`) — keeps newest by `updatedAt`
     - ContentHash — same logic, only non-null hashes considered
     - Excludes title-flagged docs from contentHash check (no double-counting)
     - Returns: `{ groups, totalDuplicates, totalGroups }`
   - **Delete mode** (`action: 'delete'`): Deletes documents by ID array
     - Uses transaction with explicit DocumentTag deletion + document deletion
     - Skips not-found documents gracefully, rolls back on unexpected errors
     - Returns: `{ deleted, ids }`

2. **Error handling**:
   - JSON parse errors → 400
   - Invalid action → 400
   - Missing/empty ids for delete → 400
   - contentHash scan wrapped in try-catch (column may not exist)
   - Prisma P2025 → 404
   - General errors → 500

3. **Lint**: Passes cleanly with zero errors

## File created

- `src/app/api/documents/cleanup/route.ts`

## Worklog updated

- Appended entry to `/home/z/my-project/worklog.md` under Task ID 5-a
