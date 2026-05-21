# Task 4 — Refactor use-document-viewer.ts (12 useState → 3 sub-hooks)

## Summary
Refactored the monolithic `use-document-viewer.ts` (218 lines, 12 useState) into 3 focused sub-hooks + 1 orchestrator.

## Files Created
- `src/components/codex/doc-viewer/use-document-edit.ts` (74 lines) — Edit form state + save logic
- `src/components/codex/doc-viewer/use-document-analysis.ts` (98 lines) — AI analyze + apply with dedicated `isApplying` flag
- `src/components/codex/doc-viewer/use-related-documents.ts` (41 lines) — Self-contained related docs fetch

## Files Modified
- `src/components/codex/doc-viewer/use-document-viewer.ts` — Rewritten as orchestrator (121 lines)
- `src/components/codex/doc-viewer/document-viewer.tsx` — Destructures `isApplying` alongside `isSaving`; passes each to correct child
- `src/components/codex/doc-viewer/document-view-mode.tsx` — `isSaving` → `isApplying` in interface + button logic
- `src/components/codex/doc-viewer/index.ts` — Added exports for 3 new sub-hooks

## Key Design Decisions
1. **Separate `isApplying` flag** — Analysis apply no longer shares `isSaving` with edit save, preventing UI confusion
2. **Orchestrator wraps doc param** — Sub-hook handlers take `doc` as parameter; orchestrator wraps them so consumer doesn't need to pass it
3. **Auto-reset on doc change** — Edit hook resets form fields; analysis hook resets analysis; related docs hook auto-fetches
4. **Consumer interface preserved** — Only addition is `isApplying`; no breaking changes to `DocumentEditMode`

## Lint
`bun run lint` passes with zero errors.
