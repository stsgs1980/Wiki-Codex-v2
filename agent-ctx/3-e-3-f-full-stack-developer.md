# Task 3-e, 3-f: Decompose page.tsx + upload-view.tsx

## Agent: full-stack-developer

## Summary
Successfully decomposed two monolithic files into focused modules under the 250-line limit.

## Files Created
| File | Lines | Purpose |
|------|-------|---------|
| `src/app/use-wiki-codex.ts` | 238 | Custom hook: all state, data hooks, effects, handlers for WikiCodex |
| `src/components/codex/upload/use-upload.ts` | 206 | Custom hook: 7 useState + file handling, validation, drag-drop, upload, extract |
| `src/components/codex/upload/upload-view.tsx` | 212 | Pure render UploadView component using useUpload hook |
| `src/components/codex/upload/index.ts` | 2 | Barrel exports |

## Files Modified
| File | Before | After | Change |
|------|--------|-------|--------|
| `src/app/page.tsx` | 423 lines | 234 lines | Now uses useWikiCodex hook |
| `src/components/codex/upload-view.tsx` | 380 lines | 1 line | Re-exports from upload/ |

## Key Decisions
- useWikiCodex returns a flat object with all store state, UI state, data, and handlers — page.tsx only handles rendering
- useUpload accepts categories, onUploadSuccess, onTermsExtracted as params (same as original props) to avoid coupling to parent
- Original upload-view.tsx replaced with re-export to preserve backward-compatible import path
- Section dividers in use-wiki-codex.ts compacted from 3-line banners to 1-line comments to stay under 250 lines

## Verification
- `bun run lint` passed with zero errors
- Dev server compiles and renders correctly
