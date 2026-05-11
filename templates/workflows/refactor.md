# Refactor Workflow

analyze -> plan -> refactor -> verify

Use this workflow when restructuring, optimizing, or cleaning up existing code
without changing its external behavior.

---

## Phase 1: ANALYZE

Goal: understand current code and identify what to improve.

### Steps

1. Read the code you plan to refactor (all related files)
2. Identify problems:

| Problem | Example |
|---------|---------|
| Duplicated logic | Same function in 3 files |
| Large file | page.tsx with 1500+ lines |
| Tight coupling | Component depends on specific data shape |
| Dead code | Unused imports, unreachable branches |
| Performance | Unnecessary re-renders, missing memo |
| Type safety | `any` types, missing interfaces |

3. Prioritize by impact:

| Priority | Criteria |
|----------|----------|
| P0 | Bug risk (tight coupling, missing types) |
| P1 | Performance (re-renders, heavy computations) |
| P2 | Maintainability (duplication, file size) |
| P3 | Style/cosmetic (naming, formatting) |

4. Define refactoring scope:
   - Small: 1 file, rename/extract
   - Medium: 2-3 files, restructure
   - Large: 4+ files, architectural change

5. Report analysis to user before proceeding

### Rules

- Do NOT change code during analysis phase
- Identify ALL affected files before starting
- If scope is Large -- split into sub-tasks and get user approval

---

## Phase 2: PLAN

Goal: create a safe refactoring plan with rollback strategy.

### Steps

1. Create backup:

```
git stash push -m "pre-refactor-backup"
cp -r src/ /tmp/src-pre-refactor/
git log --oneline -10 > /tmp/git-log-pre-refactor.txt
```

2. Define exact changes:

```
EXTRACT: src/components/Header.tsx (from page.tsx lines 1-80)
EXTRACT: src/components/Footer.tsx (from page.tsx lines 500-530)
MOVE: helper function X from utils.ts to helpers.ts
DELETE: unused import Y from page.tsx
RENAME: variable 'data' to 'userData' in profile.tsx
```

3. Define order (safest first):
   - Extract standalone utilities
   - Extract components (leaf components first)
   - Update imports
   - Delete dead code
   - Rename/simplify

4. Define rollback criteria:
   - Build fails -> rollback
   - Page returns 500 -> rollback
   - Feature breaks -> rollback

5. Write plan to worklog.md
6. Get user confirmation

### Rules

- ALWAYS create backup before refactoring (see git-workflow-rules)
- If uncertain about safety -- ask user, do not guess

---

## Phase 3: REFACTOR

Goal: apply changes one step at a time, verify after each.

### Steps

1. Apply changes in planned order (one logical step per commit):

```
Step 1: Extract Header component
  - Create src/components/Header.tsx
  - Remove header code from page.tsx
  - Add import in page.tsx
  - Commit: "refactor: extract Header component"

Step 2: Extract Footer component
  - ...
  - Commit: "refactor: extract Footer component"
```

2. After EACH step:
   - Lint: `bun run lint`
   - Build: `bun run build`
   - Health check: `curl http://127.0.0.1:3000`

3. If any check fails:
   - Stop immediately
   - Diagnose the failure
   - Fix or rollback
   - Do NOT proceed to next step until current step passes

4. Follow all project standards during refactoring:
   - No-Unicode Policy for any new strings
   - TypeScript strict typing
   - shadcn/ui components

### Rules

- One logical change per commit (not one file per commit)
- Verify after EACH commit, not at the end
- Never mix refactoring with feature additions

---

## Phase 4: VERIFY

Goal: confirm behavior is identical, only structure changed.

### Steps

1. Full QA check:

```
Refactor Verify Results:
- Lint: PASS
- Build: PASS
- Dev server: 200 OK
- All pages load: PASS
- No new console errors: PASS
- No missing imports: PASS
- No TypeScript errors: PASS
```

2. Compare before/after:
   - File count: should be same or more (extracted)
   - Total lines: should be similar (reorganized, not rewritten)
   - External behavior: must be identical

3. Clean up:
   - Remove backup files if all checks pass
   - Squash commits if user prefers clean history (ask first)

4. Push to GitHub: `git push --force origin main`
5. Update worklog.md with refactor summary

---

## Rollback Procedure

If something goes wrong at any point:

```
# Restore from backup
cp -r /tmp/src-pre-refactor/ src/
bun run lint
bun run build
```

Or if git backup exists:

```
git stash pop
```

---

## Example Flow

```
User: "page.tsx is 1500 lines, can you clean it up?"

Agent Phase 1 (Analyze):
  - page.tsx: 1547 lines, 6 styles in one file
  - Problems: large file, no component separation
  - Priority: P2 (maintainability)
  - Scope: Medium (extract 6 components)

Agent Phase 2 (Plan):
  - Backup: git stash + cp src/ /tmp/
  - Extract: Header, Hero, Features, Footer, StyleSwitcher, Guestbook
  - Order: leaf components first -> page.tsx last
  - Rollback: build fail or 500 error

Agent Phase 3 (Refactor):
  - Extract Guestbook component (commit 1)
  - Extract Header component (commit 2)
  - Extract Hero component (commit 3)
  - Extract StyleSwitcher (commit 4)
  - Extract Features component (commit 5)
  - Extract Footer component (commit 6)
  - Simplify page.tsx (commit 7)
  - Each step: lint + build + health check

Agent Phase 4 (Verify):
  - All checks: PASS
  - page.tsx: 1547 -> 85 lines
  - External behavior: identical
  - Push to GitHub
```

---
Built with: Next.js 16 + TypeScript + Tailwind CSS
