# Bug Fix Workflow

reproduce -> diagnose -> fix -> verify

Use this workflow when fixing a bug, error, or unexpected behavior.

---

## Phase 1: REPRODUCE

Goal: confirm the bug exists and understand exact conditions.

### Steps

1. Ask user for details:
   - What was expected?
   - What actually happened?
   - Steps to reproduce?
   - Error message or screenshot?

2. Try to reproduce:
   - Follow user's steps exactly
   - Check dev server logs: `tail -20 /tmp/zdev.log`
   - Check browser console for errors
   - Note the exact conditions (page, state, input)

3. Record reproduction:

```
Bug: [short description]
Reproduction steps:
  1. Go to /page
  2. Click X
  3. See error Y
Expected: Z
Actual: Y
```

### Skip Condition

NEVER skip reproduction. If you cannot reproduce:
- Ask user for more details
- Check if it's environment-specific (mobile, browser, state)
- Do NOT assume the bug and start fixing blindly

---

## Phase 2: DIAGNOSE

Goal: find the root cause, not just the symptom.

### Steps

1. Read relevant source files (do NOT modify yet)
2. Trace the code path from UI to data:
   - Component -> handler -> API -> database
3. Check common causes:

| Symptom | Common Cause | Check |
|---------|-------------|-------|
| White screen | Runtime error | Browser console, build log |
| 500 error | Server crash | Dev server log, API route |
| Stale data | Missing revalidation | Cache, fetch options |
| Style broken | Missing CSS class | Tailwind classes, globals.css |
| Form not working | Missing handler | Action/button handler |

4. Identify root cause (one sentence):

```
Root cause: [file:line] does X instead of Y because Z
```

5. Determine fix scope:
   - One-liner: single line change
   - Local: changes in 1 file
   - Cross-module: changes in 2+ files
   - Architectural: needs design change (escalate to user)

### Rules

- Read BEFORE write. Do not change code while diagnosing.
- If diagnosis takes > 5 minutes, report progress to user.
- If root cause is unclear, present 2-3 hypotheses and ask user.

---

## Phase 3: FIX

Goal: apply minimal fix that addresses root cause.

### Steps

1. Write the fix (minimal change principle):
   - Change as few lines as possible
   - Do NOT refactor while fixing (separate task)
   - Do NOT add "bonus improvements"

2. Verify fix locally:
   - Lint: `bun run lint`
   - Build: `bun run build`
   - Reproduce original bug -> should be fixed

3. Commit with descriptive message:

```
fix: resolve [bug description]

Root cause: [explanation]
Fix: [what was changed]
```

### Rules

- If fix is large (3+ files) -- break into smaller commits
- If fix introduces new dependency -- justify to user first
- If fix changes API behavior -- warn user about breaking changes

---

## Phase 4: VERIFY

Goal: confirm the fix works and nothing else broke.

### Steps

1. Verify original bug is fixed (reproduce steps from Phase 1)
2. Check for regressions:
   - Does the page still load?
   - Do other features on the same page still work?
   - Is there a new console error?
3. Run full QA:

```
Verify Results:
- Original bug: FIXED
- Lint: PASS
- Build: PASS
- Dev server: 200 OK
- Regression check: PASS
- New errors: NONE
```

4. Push to GitHub: `git push --force origin main`
5. Update worklog.md with bug details and fix

---

## Example Flow

```
User: "The guestbook form shows error on submit"

Agent Phase 1 (Reproduce):
  - Go to / (guestbook section)
  - Fill name and message
  - Click submit
  - See: "500 Internal Server Error" in console
  - Log: "TypeError: Cannot read property 'push' of undefined"

Agent Phase 2 (Diagnose):
  - Read: src/app/page.tsx (guestbook handler)
  - Read: src/app/api/guestbook/route.ts
  - Root cause: Prisma client not initialized in API route
  - Fix scope: Local (1 file)

Agent Phase 3 (Fix):
  - Add: import { db } from '@/lib/db'
  - Add: await db.guestbook.create(...)
  - Commit: "fix: initialize Prisma client in guestbook API"

Agent Phase 4 (Verify):
  - Submit form -> works
  - Other page features -> OK
  - Push to GitHub
```

---
Built with: Next.js 16 + TypeScript + Tailwind CSS
