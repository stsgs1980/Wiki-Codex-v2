/**
 * Folder upload summary + progress bar — extracted from folder-upload-view.tsx
 * for R-02 anti-monolith compliance. Pure presentational sub-component.
 */
'use client'

import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { BatchProgress } from './submit-batch-types'

interface FolderUploadSummaryProps {
  progress: BatchProgress
  done: boolean
  running: boolean
}

export function FolderUploadSummary({ progress, done, running }: FolderUploadSummaryProps) {
  const pct = progress.total > 0
    ? Math.round((progress.done / progress.total) * 100)
    : 0

  const summary = `✓ ${progress.succeeded} создано · ↻ ${progress.updated} обновлено · ⚠ ${progress.duplicates} дублей · ✕ ${progress.failed} ошибок`

  return (
    <>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Прогресс: {progress.done} / {progress.total}</span>
          <span>{pct}%</span>
        </div>
        <div
          className="h-2 rounded-full bg-muted overflow-hidden"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-terminal-accent transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {done && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
          {progress.failed ? (
            <AlertTriangle className="size-4 mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 className="size-4 mt-0.5 shrink-0" />
          )}
          <div className="text-xs leading-relaxed">
            <p className="font-medium">
              {running ? 'Загрузка завершена' : 'Готово'}
            </p>
            <p className="text-muted-foreground mt-0.5">{summary}</p>
          </div>
        </div>
      )}
    </>
  )
}
