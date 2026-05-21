/**
 * Upload status bar component — shows progress, success, and error messages.
 */
'use client'

import { Loader2, CheckCircle2, AlertCircle, Sparkles, Shield } from 'lucide-react'
import type { UploadStatus } from './use-upload-state'

interface UploadStatusBarProps {
  status: UploadStatus
  autoCategoryName: string | null
  errorMsg: string
}

export function UploadStatusBar({ status, autoCategoryName, errorMsg }: UploadStatusBarProps) {
  // Dedup info badge
  if (status === 'idle') {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Shield className="size-3.5" />
        <span>Защита от дубликатов: по заголовку, хешу контента и семантическому сходству</span>
      </div>
    )
  }

  const config = (() => {
    switch (status) {
      case 'auto-categorizing':
        return { icon: <Sparkles className="size-4 animate-pulse" />, text: 'AI определяет категорию...', color: 'text-violet-600', bg: 'bg-violet-500/10' }
      case 'extracting-terms':
        return { icon: <Loader2 className="size-4 animate-spin" />, text: 'Извлечение терминов...', color: 'text-terminal-accent', bg: 'bg-violet-500/10' }
      case 'success':
        return {
          icon: <CheckCircle2 className="size-4" />,
          text: autoCategoryName
            ? `Загружено! AI категория: ${autoCategoryName}`
            : 'Документ загружен успешно!',
          color: 'text-emerald-600',
          bg: 'bg-emerald-500/10',
        }
      case 'error':
        return { icon: <AlertCircle className="size-4" />, text: errorMsg, color: 'text-destructive', bg: 'bg-destructive/10' }
      default:
        return null
    }
  })()

  if (!config) return null

  return (
    <div className={`flex items-center gap-2 p-3 rounded-md ${config.bg} ${config.color}`}>
      {config.icon}
      <span className="text-sm">{config.text}</span>
    </div>
  )
}
