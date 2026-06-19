'use client'

import { Sparkles, Loader2, CheckSquare, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface DictionaryViewHeaderActionsProps {
  isLoading: boolean
  termsCount: number
  documentsCount: number
  selectionMode: boolean
  onToggleSelectionMode: () => void
  onExtractAll: () => void
  isExtracting: boolean
}

export function DictionaryViewHeaderActions({
  isLoading,
  termsCount,
  documentsCount,
  selectionMode,
  onToggleSelectionMode,
  onExtractAll,
  isExtracting,
}: DictionaryViewHeaderActionsProps) {
  return (
    <div className="flex items-center gap-1">
      {!isLoading && termsCount > 0 && (
        <Button variant="ghost" size="icon" className="size-6" onClick={onToggleSelectionMode} aria-label="Режим выбора" aria-pressed={selectionMode}>
          {selectionMode ? <CheckSquare className="size-3" /> : <Square className="size-3" />}
        </Button>
      )}
      <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs hidden sm:flex"
        onClick={onExtractAll} disabled={isExtracting || documentsCount === 0}>
        {isExtracting ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
        extract
      </Button>
      <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs sm:hidden"
        onClick={onExtractAll} disabled={isExtracting || documentsCount === 0}>
        {isExtracting ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
        extract
      </Button>
      {!isLoading && termsCount > 0 && (
        <Badge variant="secondary" className="text-3xs font-mono px-1.5 py-0">{termsCount}</Badge>
      )}
    </div>
  )
}
