/**
 * Batch analyze runner — sequential AI analysis + auto-apply for N documents.
 *
 * Sequential (not parallel) for the same reasons as submit-batch.ts:
 *   1. z-ai-web-dev-sdk is server-heavy; fanning out saturates the sandbox.
 *   2. New category/tag creation races could create duplicates.
 *
 * Per-document logic lives in run-one-analyze.ts. This hook owns only
 * state + loop + progress aggregation. Split for R-02 anti-monolith.
 */
'use client'

import { useState, useCallback, useRef } from 'react'
import { runOneAnalyze } from './run-one-analyze'
import type {
  BatchAnalyzeInput,
  BatchAnalyzeProgress,
  BatchAnalyzeOptions,
} from './batch-analyze-types'

function makeInitialProgress(docs: BatchAnalyzeInput[]): BatchAnalyzeProgress {
  return {
    total: docs.length,
    done: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    results: docs.map((d) => ({ id: d.id, title: d.title, status: 'pending' as const })),
  }
}

function snapshot(p: BatchAnalyzeProgress): BatchAnalyzeProgress {
  return { ...p, results: [...p.results] }
}

export function useBatchAnalyze() {
  const [isOpen, setIsOpen] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [progress, setProgress] = useState<BatchAnalyzeProgress | null>(null)
  const cancelRef = useRef(false)

  const open = useCallback(() => {
    setProgress(null)
    setIsDone(false)
    setIsRunning(false)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    if (isRunning) return // cannot close mid-run
    setIsOpen(false)
  }, [isRunning])

  const cancel = useCallback(() => {
    cancelRef.current = true
  }, [])

  const start = useCallback(async (docs: BatchAnalyzeInput[], options: BatchAnalyzeOptions = {}) => {
    if (!docs.length) return
    cancelRef.current = false
    setIsRunning(true)
    setIsDone(false)
    const p = makeInitialProgress(docs)
    setProgress(snapshot(p))
    options.onProgress?.(snapshot(p))

    for (let i = 0; i < docs.length; i++) {
      if (cancelRef.current) {
        // Mark remaining as skipped
        for (let j = i; j < docs.length; j++) {
          p.results[j] = { ...p.results[j], status: 'skipped', error: 'cancelled' }
          p.skipped += 1
          p.done += 1
        }
        setProgress(snapshot(p))
        break
      }

      p.results[i] = { ...p.results[i], status: 'analyzing' }
      setProgress(snapshot(p))

      const result = await runOneAnalyze(docs[i], options.skipAnalyzed ?? false)

      p.results[i] = {
        ...p.results[i],
        status: result.status,
        error: result.error,
      }
      p.done += 1
      if (result.status === 'applied') p.succeeded += 1
      else if (result.status === 'failed') p.failed += 1
      else if (result.status === 'skipped') p.skipped += 1

      setProgress(snapshot(p))
      options.onProgress?.(snapshot(p))
    }

    setIsRunning(false)
    setIsDone(true)
  }, [])

  const reset = useCallback(() => {
    setProgress(null)
    setIsDone(false)
    setIsRunning(false)
  }, [])

  return {
    isOpen, isRunning, isDone, progress,
    open, close, cancel, start, reset,
  }
}
