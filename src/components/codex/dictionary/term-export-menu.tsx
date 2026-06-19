'use client'

import { useState, useRef, useEffect } from 'react'
import { Download, FileText, FileCode } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * TermExportMenu — dropdown for downloading the glossary as a file.
 *
 * Two formats:
 *  - Markdown (.md)   — GFM-compatible, renders on GitHub/GitLab
 *  - AsciiDoc (.adoc) — used by Antora / AsciiDoctor pipelines
 *
 * Triggers a browser "Save As..." dialog via the backend's
 * Content-Disposition: attachment header on /api/terms/export.
 *
 * Keyboard-accessible:
 *  - Trigger button: Enter/Space toggles the menu (native <button>)
 *  - Menu items: native <button> elements, focusable, Enter activates
 *  - Escape closes the menu and returns focus to the trigger
 *  - Click-outside closes (via document mousedown listener)
 *
 * Disabled when termsCount === 0 — export is meaningless for an empty
 * dictionary (the API would 404 anyway).
 */
interface TermExportMenuProps {
  termsCount: number
}

export function TermExportMenu({ termsCount }: TermExportMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Click-outside + Escape-to-close
  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const disabled = termsCount === 0

  function exportAs(format: 'markdown' | 'adoc') {
    window.location.href = `/api/terms/export?format=${format}`
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        ref={triggerRef}
        variant="ghost"
        size="sm"
        className="h-6 gap-1 text-xs"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-label="Экспорт словаря"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Download className="size-3" />
        <span className="hidden sm:inline">экспорт</span>
      </Button>

      {open && (
        <div
          role="menu"
          aria-label="Формат экспорта"
          className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-md border border-border bg-popover p-1 shadow-md"
        >
          <button
            role="menuitem"
            type="button"
            onClick={() => exportAs('markdown')}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent transition-colors"
          >
            <FileText className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="flex flex-col">
              <span className="font-medium">Markdown (.md)</span>
              <span className="text-3xs text-muted-foreground">GitHub / GitLab</span>
            </span>
          </button>
          <button
            role="menuitem"
            type="button"
            onClick={() => exportAs('adoc')}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent transition-colors"
          >
            <FileCode className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="flex flex-col">
              <span className="font-medium">AsciiDoc (.adoc)</span>
              <span className="text-3xs text-muted-foreground">Antora / AsciiDoctor</span>
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
