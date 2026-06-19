/**
 * Folder upload progress list — presentational component.
 * Renders the per-file status list during/after a batch run.
 */
'use client'

import {
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Copy,
  Loader2,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BatchFileResult } from './submit-batch'

interface FolderUploadProgressProps {
  results: BatchFileResult[]
  running: boolean
}

const STATUS_META: Record<
  BatchFileResult['status'],
  { icon: React.ReactNode; textClass: string; label: string }
> = {
  pending: {
    icon: <FileText className="size-3.5 text-muted-foreground" />,
    textClass: 'text-muted-foreground',
    label: 'В очереди',
  },
  uploading: {
    icon: <Loader2 className="size-3.5 animate-spin text-terminal-accent" />,
    textClass: 'text-terminal-accent',
    label: 'Загрузка...',
  },
  success: {
    icon: <CheckCircle2 className="size-3.5 text-emerald-500" />,
    textClass: 'text-emerald-600',
    label: 'Создан',
  },
  updated: {
    icon: <RefreshCw className="size-3.5 text-emerald-500" />,
    textClass: 'text-emerald-600',
    label: 'Обновлён',
  },
  duplicate: {
    icon: <Copy className="size-3.5 text-amber-500" />,
    textClass: 'text-amber-600',
    label: 'Дубликат',
  },
  error: {
    icon: <AlertCircle className="size-3.5 text-destructive" />,
    textClass: 'text-destructive',
    label: 'Ошибка',
  },
}

export function FolderUploadProgress({ results, running }: FolderUploadProgressProps) {
  return (
    <div className="rounded-md border border-border bg-card/50">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border text-xs text-muted-foreground">
        <span>Файлы ({results.length})</span>
        <span>{running ? 'Идёт загрузка...' : 'Завершено'}</span>
      </div>
      <ul
        className="max-h-80 overflow-y-auto divide-y divide-border"
        role="log"
        aria-live="polite"
      >
        {results.map((r) => {
          const meta = STATUS_META[r.status]
          return (
            <li key={r.id} className="flex items-start gap-2 px-3 py-2">
              <span className="mt-0.5 shrink-0">{meta.icon}</span>
              <div className="min-w-0 flex-1">
                <p className={cn('text-xs font-mono truncate', meta.textClass)}>
                  {r.id}
                </p>
                <p className="text-3xs text-muted-foreground/80 mt-0.5">
                  {meta.label}
                  {r.error ? ` — ${r.error}` : ''}
                  {r.duplicate ? ` — существующий: ${r.duplicate.existingTitle}` : ''}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
