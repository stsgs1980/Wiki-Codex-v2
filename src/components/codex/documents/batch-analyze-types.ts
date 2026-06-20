/**
 * Types for batch AI analysis of multiple documents.
 *
 * Mirrors the structure of submit-batch-types.ts (folder upload) for
 * consistency. Each document is analyzed via /api/ai/analyze and the
 * result is auto-applied via PATCH /api/documents/{id}.
 */
import type { Document } from '@/lib/types'

export type BatchAnalyzeStatus =
  | 'pending'
  | 'analyzing'
  | 'applied'
  | 'failed'
  | 'skipped'

export interface BatchAnalyzeItem {
  id: string
  title: string
  status: BatchAnalyzeStatus
  error?: string
}

export interface BatchAnalyzeProgress {
  total: number
  done: number
  succeeded: number
  failed: number
  skipped: number
  results: BatchAnalyzeItem[]
}

export interface BatchAnalyzeOptions {
  /** Skip documents that already have a summary AND at least one tag. */
  skipAnalyzed?: boolean
  /** Called after each document is processed, with the current snapshot. */
  onProgress?: (progress: BatchAnalyzeProgress) => void
}

export type BatchAnalyzeInput = Pick<Document, 'id' | 'title' | 'content' | 'summary' | 'tags'>
