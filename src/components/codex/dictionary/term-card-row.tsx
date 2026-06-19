'use client'

import {
  ChevronDown,
  ChevronRight,
  FileText,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import type { Term } from '@/lib/types'
import { TermDeleteButton } from './term-delete-button'

interface TermCardRowProps {
  term: Term
  expanded: boolean
  selectionMode: boolean
  selected: boolean
  onToggle: () => void
  onToggleSelection: () => void
  onDelete: () => void
}

/**
 * Clickable row of a list-mode term card.
 *
 * Rendered as div[role=button] (not a real <button>) because it contains a
 * real <Button> for delete. HTML forbids <button>-inside-<button>; using a
 * div with role+tabIndex+keydown preserves a11y while staying valid HTML.
 *
 * Keyboard: Enter / Space toggles, unless focus is inside an inner control
 * (delete button, checkbox) — those handle their own keys.
 */
export function TermCardRow({
  term,
  expanded,
  selectionMode,
  selected,
  onToggle,
  onToggleSelection,
  onDelete,
}: TermCardRowProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Only fire when the row itself has focus. Inner controls (delete button,
    // checkbox) handle their own keyboard activation — using e.target !==
    // currentTarget avoids the trap where closest('[role=button]') matches
    // the row itself (this element has role=button).
    if (e.target !== e.currentTarget) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'text-left w-full flex items-center gap-2 sm:gap-3 rounded-md border border-dashed px-3 py-2 sm:px-4 sm:py-2.5 hover:bg-accent/50 transition-colors cursor-pointer font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected && 'ring-2 ring-primary bg-primary/5 border-solid',
      )}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      aria-expanded={expanded}
      aria-controls={`term-content-${term.id}`}
    >
      {selectionMode && (
        <Checkbox
          checked={selected}
          onCheckedChange={onToggleSelection}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {!selectionMode && (
        expanded
          ? <ChevronDown className="size-3 text-muted-foreground shrink-0" />
          : <ChevronRight className="size-3 text-terminal-accent shrink-0" />
      )}

      <span className="font-semibold text-sm sm:text-base min-w-0 shrink-0 text-foreground font-sans">
        {term.term}
      </span>

      <span className="text-muted-foreground/70 text-xs hidden sm:inline">=</span>

      <span className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:inline">
        {term.translation}
      </span>

      {term.document && (
        <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground shrink-0 ml-auto">
          <FileText className="size-3" />
          <span className="truncate max-w-32">{term.document.title}</span>
        </div>
      )}

      <span className="text-3xs sm:text-xs text-muted-foreground shrink-0 hidden sm:inline">
        {formatDate(term.createdAt)}
      </span>

      {!selectionMode && (
        <TermDeleteButton
          onDelete={onDelete}
          className="hidden sm:flex"
        />
      )}
    </div>
  )
}
