/**
 * Shared types for batch folder upload (R-02: extracted so submit-batch.ts
 * and submit-one.ts can both import without circular dependency).
 */
import type { DuplicateInfo } from './use-upload-state'

export interface BatchFile {
  file: File
  /** Display title — defaults to file name without extension. */
  title: string
  /** Relative path inside the folder, e.g. "rules/R-05-colors.md". */
  relativePath: string
}

export type BatchFileStatus =
  | 'pending'
  | 'uploading'
  | 'success'
  | 'updated'
  | 'duplicate'
  | 'error'

export interface BatchFileResult {
  id: string
  status: BatchFileStatus
  /** Set on success/updated — the created/updated doc id. */
  docId?: string
  /** Set on duplicate — info to show the user what was skipped. */
  duplicate?: DuplicateInfo
  /** Set on error — human-readable error message. */
  error?: string
}

export interface BatchProgress {
  total: number
  done: number
  succeeded: number
  updated: number
  duplicates: number
  failed: number
  results: BatchFileResult[]
}

export interface BatchOptions {
  /** Called after every file with the updated progress snapshot. */
  onProgress?: (progress: BatchProgress) => void
  /** Category id; 'auto' triggers AI categorization per file. */
  categoryId?: string
  /** When true, duplicates are force-created (not skipped). */
  forceCreate?: boolean
}
