'use client'

import { Search, Loader2, Languages, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useTermLookup } from './use-term-lookup'
import { TermLookupResult } from './term-lookup-result'
import type { TermLookupProps } from './term-lookup-types'

/**
 * STD-DOC — Manual term lookup card.
 * English input → description in Russian; Russian input → RU description + EN name.
 * DB-first lookup with AI fallback; saves the term by default.
 * State/fetch/keyboard handling live in `useTermLookup`; the result rendering
 * lives in `TermLookupResult`. This file is the thin orchestrator.
 */
export function TermLookup({ onTermAdded }: TermLookupProps) {
  const {
    query,
    setQuery,
    isLoading,
    result,
    error,
    inputRef,
    detectedLang,
    handleLookup,
    handleClear,
  } = useTermLookup(onTermAdded)

  return (
    <Card className="mb-4 sm:mb-6 border-dashed bg-card/50 backdrop-blur-sm">
      <CardContent className="p-3 sm:p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Languages className="size-3.5 text-terminal-accent" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-terminal-accent">
            Ручной ввод термина
          </span>
          <span className="text-3xs font-mono text-muted-foreground/70 ml-1">
            EN -&gt; RU · RU -&gt; EN + описание
          </span>
        </div>

        {/* Input form */}
        <form onSubmit={handleLookup} className="flex gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 sm:size-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              placeholder="Введите термин на английском или русском..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-20 text-sm font-mono"
              disabled={isLoading}
              autoComplete="off"
              spellCheck={false}
              aria-label="Введите термин" aria-describedby="term-lookup-hint"
            />
            {/* Language indicator badge */}
            {detectedLang && !isLoading && (
              <Badge
                variant="outline"
                className={cn(
                  'absolute right-2 top-1/2 -translate-y-1/2 text-3xs font-mono px-1.5 py-0 select-none',
                  detectedLang === 'ru'
                    ? 'border-neuro-brand/40 text-neuro-brand bg-neuro-brand/5'
                    : 'border-terminal-accent/40 text-terminal-accent bg-terminal-accent/5'
                )}
              >
                {detectedLang === 'ru' ? 'RU>EN' : 'EN>RU'}
              </Badge>
            )}
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={isLoading || !query.trim()}
            className="gap-1.5 shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span className="hidden sm:inline">Поиск...</span>
              </>
            ) : (
              <>
                <Sparkles className="size-3.5" />
                <span className="hidden sm:inline">Найти</span>
              </>
            )}
          </Button>
          {(query || result) && !isLoading && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              title="Очистить (Esc)" aria-label="Очистить"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </form>

        {/* Inline help text */}
        {!result && !error && !isLoading && (
          <p id="term-lookup-hint" className="mt-2 text-2xs text-muted-foreground/80 leading-relaxed">
            Английский термин -&gt; описание на русском. Русский термин -&gt; английское название + описание.
          </p>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && !isLoading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive flex items-start gap-2">
                <X className="size-3.5 mt-px shrink-0" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {result && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-3" aria-live="polite"
            >
              <TermLookupResult result={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
