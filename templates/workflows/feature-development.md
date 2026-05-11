# Feature Development Workflow

brainstorm -> plan -> implement -> QA

Use this workflow when building a new feature, page, component, or integration.

---

## Phase 1: BRAINSTORM

Goal: understand what the user wants and propose approaches.

### Steps

1. Ask the user to describe the feature in their own words
2. Clarify ambiguous requirements (ask questions, not assumptions)
3. Propose 2-3 approaches with pros/cons:

| Approach | Pros | Cons |
|----------|------|------|
| A | ... | ... |
| B | ... | ... |

4. User picks an approach (or combines elements)

### Skip Condition

Skip brainstorm ONLY if:
- Task is trivial (change a color, add a text, fix a typo)
- User already provided exact specification

---

## Phase 2: PLAN

Goal: create a detailed implementation plan before writing code.

### Steps

1. List all files to create or modify:

```
CREATE: src/app/new-page/page.tsx
CREATE: src/components/new-feature.tsx
MODIFY: src/app/layout.tsx (add import)
MODIFY: src/lib/utils.ts (add helper)
```

2. Define implementation order (dependencies first):
   - Step 1: create utility/helper
   - Step 2: create component
   - Step 3: integrate into page
   - Step 4: add styles

3. Identify risks:
   - Breaking existing functionality?
   - New dependencies needed?
   - Database schema changes?
   - API changes?

4. Estimate scope:
   - Small: 1-2 files, < 100 lines
   - Medium: 3-5 files, 100-500 lines
   - Large: 5+ files, 500+ lines (consider splitting into sub-tasks)

5. Write plan to worklog.md
6. Show plan to user and get confirmation

### Skip Condition

NEVER skip planning for medium or large tasks.
Small tasks: mental plan is OK, just list files before coding.

---

## Phase 3: IMPLEMENT

Goal: write code according to the plan, commit often.

### Steps

1. Create/modify files in the planned order
2. Run lint after each logical unit: `bun run lint`
3. Commit after each logical unit with descriptive message:

```
feat: add user avatar component
feat: integrate avatar into header
style: add avatar hover animation
```

4. If deviating from plan -- update worklog.md with reason
5. If blocked -- report to user immediately, do not guess

### Rules

- Follow AGENT_RULES.md at all times
- Follow No-Unicode Policy for all new code
- Use shadcn/ui components when possible
- TypeScript strict typing for all new code

---

## Phase 4: QA

Goal: verify the feature works correctly.

### Steps

1. Lint: `bun run lint`
2. Build: `bun run build`
3. Dev server health check: `curl http://127.0.0.1:3000`
4. Manual verification:
   - Does the feature render correctly?
   - Does it work on mobile viewport?
   - Are there console errors?
   - Does it break existing features?

5. Report results to user:

```
QA Results:
- Lint: PASS
- Build: PASS
- Dev server: 200 OK
- Visual check: PASS
- Mobile check: PASS
- Console errors: NONE
```

6. If any check fails -- fix and re-run QA

### After QA Pass

- Push to GitHub: `git push --force origin main`
- Update worklog.md with final summary

---

## Example Flow

```
User: "Add a dark mode toggle"

Agent Phase 1 (Brainstorm):
  - Propose: A) CSS toggle, B) next-themes, C) system preference only
  - User picks B

Agent Phase 2 (Plan):
  - Files: layout.tsx, theme-provider.tsx, header.tsx
  - Order: provider -> header -> layout
  - Risks: existing styles may need adjustment
  - Written to worklog.md

Agent Phase 3 (Implement):
  - bun add next-themes
  - Create theme-provider.tsx
  - Add toggle to header
  - Commit each step

Agent Phase 4 (QA):
  - Lint: PASS, Build: PASS, Server: 200
  - Visual: toggle works, persists on reload
  - Push to GitHub
```

---
Built with: Next.js 16 + TypeScript + Tailwind CSS
