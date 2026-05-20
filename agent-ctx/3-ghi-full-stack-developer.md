# Task 3-g, 3-h, 3-i: Decompose documents-view + note-editor + use-codex-data

## Summary
Decomposed 3 files (876 total lines) into 14 focused modules, all under 250 lines.

## Files Created

### documents-view decomposition (3-g)
- `src/components/codex/documents/document-card.tsx` (88 lines) — DocumentCard with self-contained getFileIcon
- `src/components/codex/documents/document-list-item.tsx` (63 lines) — DocumentListItem with self-contained getFileIcon
- `src/components/codex/documents/documents-view.tsx` (187 lines) — Main view component
- `src/components/codex/documents/index.ts` (3 lines) — Barrel exports

### note-editor decomposition (3-h)
- `src/components/codex/note-editor/note-analysis-card.tsx` (82 lines) — NoteAnalysisCard + NoteAnalysis interface
- `src/components/codex/note-editor/note-editor.tsx` (221 lines) — Main NoteEditor component
- `src/components/codex/note-editor/index.ts` (3 lines) — Barrel exports

### use-codex-data decomposition (3-i)
- `src/hooks/use-global-counters.ts` (65 lines) — useGlobalCounters
- `src/hooks/use-categories-and-tags.ts` (24 lines) — useCategoriesAndTags
- `src/hooks/use-documents.ts` (105 lines) — useDocuments
- `src/hooks/use-notes.ts` (37 lines) — useNotes
- `src/hooks/use-terms.ts` (31 lines) — useTerms

## Files Updated
- `src/components/codex/documents-view.tsx` — 334 → 1 line (re-export)
- `src/components/codex/note-editor.tsx` — 281 → 1 line (re-export)
- `src/hooks/use-codex-data.ts` — 261 → 5 lines (barrel re-export)

## Key Decisions
- `getFileIcon` helper duplicated in document-card and document-list-item (small utility, avoids unnecessary shared module)
- `BUILTIN_COUNT` import updated to `@/components/codex/instructions` (existing barrel) instead of old `instructions-view`
- All existing import paths preserved via re-export barrels — no downstream changes needed
- NoteAnalysisCard extracted with `onDismiss` and `onApplyTitle` callback props instead of accessing parent state directly
