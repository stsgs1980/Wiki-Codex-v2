'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import { motion } from 'framer-motion'
import type { TermCardProps } from './types'

export function TermCardList({
  term: t,
  onDelete,
  selectionMode,
  selected,
  onToggleSelection,
}: TermCardProps) {
  const [expanded, setExpanded] = useState(false)

  const handleToggle = () => {
    if (selectionMode) {
      onToggleSelection()
    } else {
      setExpanded(!expanded)
    }
  }

  // Keyboard handler: Enter / Space activate the row (a11y for div-as-button)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Don't intercept keys typed inside the inner delete button or checkbox
    const target = e.target as HTMLElement
    if (target.closest('button, [role="button"], input')) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle()
    }
  }

  return (
    <div className="group">
      {/* Outer row is a div[role=button] because it contains a real <Button>
          (delete). HTML forbids <button>-inside-<button>, which caused a
          React hydration error. Keeping the delete as a real <button> is
          better for a11y than nesting two real buttons. */}
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'text-left w-full flex items-center gap-2 sm:gap-3 rounded-md border border-dashed px-3 py-2 sm:px-4 sm:py-2.5 hover:bg-accent/50 transition-colors cursor-pointer font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          selected && 'ring-2 ring-primary bg-primary/5 border-solid'
        )}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={expanded}
        aria-controls={`term-content-${t.id}`}
      >
        {/* Checkbox in selection mode */}
        {selectionMode && (
          <Checkbox
            checked={selected}
            onCheckedChange={onToggleSelection}
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {/* Expand icon */}
        {!selectionMode && (
          expanded
            ? <ChevronDown className="size-3 text-muted-foreground shrink-0" />
            : <ChevronRight className="size-3 text-terminal-accent shrink-0" />
        )}

        {/* Term name */}
        <span className="font-semibold text-sm sm:text-base min-w-0 shrink-0 text-foreground font-sans">{t.term}</span>

        <span className="text-muted-foreground/70 text-xs hidden sm:inline">=</span>

        {/* Translation */}
        <span className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:inline">
          {t.translation}
        </span>

        {/* Source doc - desktop only */}
        {t.document && (
          <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground shrink-0 ml-auto">
            <FileText className="size-3" />
            <span className="truncate max-w-32">{t.document.title}</span>
          </div>
        )}

        {/* Date - desktop only */}
        <span className="text-3xs sm:text-xs text-muted-foreground shrink-0 hidden sm:inline">
          {formatDate(t.createdAt)}
        </span>

        {/* Delete - desktop only (hover) */}
        {!selectionMode && (
          <Button
            variant="ghost"
            size="icon"
            className="size-6 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 hidden sm:flex"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            title="Удалить термин"
            aria-label="Удалить термин"
          >
            <Trash2 className="size-3" />
          </Button>
        )}
      </div>

      {/* Expanded details */}
      {!selectionMode && expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 sm:px-10 py-2.5 sm:py-3"
          id={`term-content-${t.id}`}
        >
          <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2 break-words leading-relaxed">{t.explanation}</p>
          {t.usage && (
            <div className="bg-muted font-mono text-3xs sm:text-xs p-2.5 sm:p-3 rounded-md whitespace-pre-wrap break-words">
              {t.usage}
            </div>
          )}
          {/* Delete button for mobile (shown in expanded state) */}
          <Button
            variant="outline"
            size="sm"
            className="mt-2 gap-1.5 text-xs text-destructive hover:text-destructive sm:hidden"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
          >
            <Trash2 className="size-3" />
            Удалить
          </Button>
        </motion.div>
      )}
    </div>
  )
}
