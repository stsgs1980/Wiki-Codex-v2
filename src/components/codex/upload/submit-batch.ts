/**
 * Batch submit — sequential upload of N files.
 *
 * Sequential (not parallel) for two reasons:
 *   1. z-ai-web-dev-sdk calls (auto-categorize + extract-terms) are server-
 *      heavy and would saturate the sandbox if fanned out.
 *   2. Duplicate detection compares against existing docs; racing uploads
 *      could miss each other and both create near-duplicates.
 *
 * Per-file logic lives in submit-one.ts. This file owns only the loop +
 * progress aggregation. Split for R-02 anti-monolith.
 */
import { submitOne } from './submit-one'
import type {
  BatchFile,
  BatchFileResult,
  BatchProgress,
  BatchOptions,
} from './submit-batch-types'

export type {
  BatchFile,
  BatchFileResult,
  BatchFileStatus,
  BatchProgress,
  BatchOptions,
} from './submit-batch-types'

function makeInitialProgress(files: BatchFile[]): BatchProgress {
  return {
    total: files.length,
    done: 0,
    succeeded: 0,
    updated: 0,
    duplicates: 0,
    failed: 0,
    results: files.map((f) => ({
      id: f.relativePath || f.file.name,
      status: 'pending' as const,
    })),
  }
}

function bump(progress: BatchProgress, result: BatchFileResult): void {
  if (result.status === 'success') progress.succeeded += 1
  else if (result.status === 'updated') progress.updated += 1
  else if (result.status === 'duplicate') progress.duplicates += 1
  else if (result.status === 'error') progress.failed += 1
}

export async function submitBatch(
  files: BatchFile[],
  options: BatchOptions = {},
): Promise<BatchProgress> {
  const { onProgress, categoryId = 'auto', forceCreate = false } = options
  const progress = makeInitialProgress(files)

  onProgress?.(snapshot(progress))

  for (let i = 0; i < files.length; i++) {
    progress.results[i] = { ...progress.results[i], status: 'uploading' }
    onProgress?.(snapshot(progress))

    const result = await submitOne(files[i], categoryId, forceCreate)

    progress.results[i] = result
    progress.done += 1
    bump(progress, result)

    onProgress?.(snapshot(progress))
  }

  return progress
}

function snapshot(p: BatchProgress): BatchProgress {
  return { ...p, results: [...p.results] }
}
