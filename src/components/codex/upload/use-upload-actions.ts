/**
 * Upload actions barrel — re-exports from split modules for backward compatibility.
 * Consumers (upload.tsx, index.ts) continue to import from './use-upload-actions'.
 *
 * Implementation split (R-02 anti-monolith rule):
 *   - submit-document.ts         — submitDocument (POST /api/documents with retry)
 *   - auto-categorize-action.ts  — autoCategorizeDocument (POST /api/documents/auto-categorize)
 *   - extract-terms-action.ts    — extractTerms (POST /api/terms/extract)
 */
export { submitDocument } from './submit-document'
export type { SubmitResult } from './submit-document'
export { autoCategorizeDocument } from './auto-categorize-action'
export { extractTerms } from './extract-terms-action'
