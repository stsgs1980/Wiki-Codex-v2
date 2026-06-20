/**
 * Batch analyze dialog — confirmation + live progress.
 *
 * Two phases:
 *   1. Confirm: shows count + "skip analyzed" toggle, Start button.
 *   2. Progress: per-doc status list + summary, auto-switches to "done"
 *      banner when isDone.
 *
 * R-02 split: state lives in use-batch-analyze.ts; this is presentational.
 */
'use client'

import { useState } from 'react'
import { Sparkles, Loader2, CheckCircle2, AlertCircle, X, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { BatchAnalyzeInput, BatchAnalyzeProgress } from './batch-analyze-types'

interface BatchAnalyzeDialogProps {
  isOpen: boolean
  isRunning: boolean
  isDone: boolean
  progress: BatchAnalyzeProgress | null
  docs: BatchAnalyzeInput[]
  onStart: (skipAnalyzed: boolean) => void
  onClose: () => void
  onCancel: () => void
}

const STATUS_META: Record<
  'pending' | 'analyzing' | 'applied' | 'failed' | 'skipped',
  { icon: typeof Loader2; className: string; label: string }
> = {
  pending: { icon: Loader2, className: 'text-muted-foreground', label: 'ожидание' },
  analyzing: { icon: Loader2, className: 'text-primary animate-spin', label: 'анализ...' },
  applied: { icon: CheckCircle2, className: 'text-green-600 dark:text-green-400', label: 'готово' },
  failed: { icon: AlertCircle, className: 'text-destructive', label: 'ошибка' },
  skipped: { icon: SkipForward, className: 'text-muted-foreground', label: 'пропуск' },
}

export function BatchAnalyzeDialog({
  isOpen, isRunning, isDone, progress, docs, onStart, onClose, onCancel,
}: BatchAnalyzeDialogProps) {
  const [skipAnalyzed, setSkipAnalyzed] = useState(true)
  // Reset skip checkbox to default each time the dialog opens (lazy + render-time
  // check, avoids setState-in-effect). When isOpen flips true after being false,
  // we restore the default. Default is `true` so first render already matches.
  // No effect needed: useState(true) initializes correctly, and on close/reopen
  // the component stays mounted (Dialog handles visibility via `open` prop).

  const pct = progress && progress.total > 0
    ? Math.round((progress.done / progress.total) * 100)
    : 0

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o && !isRunning) onClose() }}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono">
            <Sparkles className="size-4" />
            Групповой AI-анализ
          </DialogTitle>
          <DialogDescription>
            {isRunning || isDone
              ? `Обработано ${progress?.done ?? 0} из ${progress?.total ?? docs.length} документов`
              : `Запустить AI-анализ для ${docs.length} документ(ов)? Категории, теги и саммари будут применены автоматически.`}
          </DialogDescription>
        </DialogHeader>

        {/* Confirm phase */}
        {!isRunning && !isDone && (
          <div className="flex flex-col gap-4 py-2">
            <div className="rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 p-3 text-xs font-mono text-muted-foreground">
              <p>• Каждый документ будет проанализирован через /api/ai/analyze</p>
              <p>• Категории и теги создаются автоматически при необходимости</p>
              <p>• Обработка идёт последовательно, чтобы не перегрузить sandbox</p>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="skip-analyzed"
                checked={skipAnalyzed}
                onCheckedChange={(v) => setSkipAnalyzed(v === true)}
              />
              <Label htmlFor="skip-analyzed" className="text-sm cursor-pointer">
                Пропускать уже проанализированные (есть саммари + теги)
              </Label>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>Отмена</Button>
              <Button size="sm" onClick={() => onStart(skipAnalyzed)} className="gap-1.5">
                <Sparkles className="size-3.5" />
                Запустить анализ
              </Button>
            </div>
          </div>
        )}

        {/* Progress phase */}
        {(isRunning || isDone) && progress && (
          <div className="flex flex-col gap-3 min-h-0">
            {/* Progress bar */}
            <div className="flex flex-col gap-1.5">
              <Progress value={pct} className="h-2" />
              <div className="flex justify-between text-xs font-mono text-muted-foreground">
                <span>{pct}%</span>
                <span>
                  ✓ {progress.succeeded} · ✗ {progress.failed} · ⊘ {progress.skipped}
                </span>
              </div>
            </div>

            {/* Per-doc list (scrollable) */}
            <div className="max-h-64 overflow-y-auto rounded-md border border-border bg-muted/20 p-2">
              <ul className="flex flex-col gap-1 list-none p-0 m-0">
                {progress.results.map((r) => {
                  const meta = STATUS_META[r.status]
                  const Icon = meta.icon
                  return (
                    <li
                      key={r.id}
                      className="flex items-center gap-2 text-xs font-mono px-2 py-1 rounded hover:bg-muted/50"
                    >
                      <Icon className={cn('size-3.5 shrink-0', meta.className)} />
                      <span className="truncate flex-1 text-foreground" title={r.title}>
                        {r.title}
                      </span>
                      {r.error && (
                        <span className="text-destructive text-3xs truncate max-w-[120px]" title={r.error}>
                          {r.error}
                        </span>
                      )}
                      <span className={cn('text-3xs shrink-0', meta.className)}>{meta.label}</span>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Done banner */}
            {isDone && (
              <div className="rounded-md border border-green-500/30 bg-green-500/10 p-3 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-600 dark:text-green-400 shrink-0" />
                <span className="text-sm text-foreground">
                  Анализ завершён: {progress.succeeded} применено, {progress.failed} ошибок, {progress.skipped} пропущено
                </span>
              </div>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              {isRunning ? (
                <Button variant="outline" size="sm" onClick={onCancel} className="gap-1.5">
                  <X className="size-3.5" />
                  Остановить
                </Button>
              ) : (
                <Button size="sm" onClick={onClose} className="gap-1.5">
                  <CheckCircle2 className="size-3.5" />
                  Закрыть
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
