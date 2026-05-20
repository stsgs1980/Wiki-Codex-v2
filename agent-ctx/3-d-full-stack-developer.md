# Task 3-d: Decompose document-viewer.tsx (674 lines → modules)

## Summary
Decomposed the 674-line `document-viewer.tsx` monolith into 8 focused modules under `src/components/codex/doc-viewer/`.

## Files Created
| File | Lines | Purpose |
|------|-------|---------|
| `doc-viewer/types.ts` | 14 | RelatedDocument, DocumentViewerProps interfaces |
| `doc-viewer/use-document-viewer.ts` | 218 | Custom hook with all 12 useState + handlers |
| `doc-viewer/markdown-renderer.tsx` | 133 | MarkdownContent with ReactMarkdown + copy-to-clipboard |
| `doc-viewer/document-edit-mode.tsx` | 87 | Edit mode form component |
| `doc-viewer/document-view-mode.tsx` | 224 | View mode component (breadcrumbs, metadata, tags, analysis, etc.) |
| `doc-viewer/related-docs-section.tsx` | 73 | Related documents section (extracted from view mode) |
| `doc-viewer/document-viewer.tsx` | 65 | Main composer component |
| `doc-viewer/index.ts` | 2 | Barrel exports |

## Original File
`src/components/codex/document-viewer.tsx` reduced from 674 → 1 line (re-export only)

## Key Decisions
- **copiedBlockId state** moved into `MarkdownContent` component (self-contained copy logic) instead of the main hook, since it's only used in markdown rendering
- **RelatedDocsSection** extracted from view mode to keep `document-view-mode.tsx` under 250 lines
- **useDocumentViewer** hook returns all state + handlers + store actions; sub-components receive only what they need via props
- External import path unchanged: `import { DocumentViewer } from '@/components/codex/document-viewer'`

## Verification
- `bun run lint` — passed with zero errors
- Dev server compiles successfully
- All files under 250-line limit (largest: 224 lines)
