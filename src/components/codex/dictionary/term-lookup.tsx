'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Search, Loader2, Languages, BookOpen, Sparkles, X, Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { Term } from '@/lib/types'

interface TermLookupResult {
  term: Term
  inputLanguage: 'en' | 'ru'
  source: 'database' | 'ai'
  isExisting: boolean
  saved: boolean
}

interface TermLookupProps {
  /** Called when a new term was added to the dictionary (saved=true) */
  onTermAdded?: () => void
}

/**
 * STD-DOC — Manual term lookup card.
 *
 * Lets the user type any term (English OR Russian) and get back a full term card.
 *  - English input  → description in Russian (like the rest of the system)
 *  - Russian input  → description (RU) + English name of the concept
 *
 * Results come from the DB first (fast path), then fall back to AI generation.
 * By default the looked-up term is saved into the dictionary so it's
 * immediately searchable / grouped with the others.
 */
export function TermLookup({ onTermAdded }: TermLookupProps) {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TermLookupResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Auto-detect input language for the inline hint badge
  const isRussian = /[а-яёА-ЯЁ]/.test(query)
  const detectedLang: 'en' | 'ru' | null = query.trim() ? (isRussian ? 'ru' : 'en') : null

  const handleLookup = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/terms/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: trimmed, save: true }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Не удалось найти термин')
        return
      }

      setResult(data as TermLookupResult)

      if (data.saved) {
        toast({
          title: 'Термин добавлен в словарь',
          description: `"${data.term.term}" — ${data.term.translation}`,
        })
        onTermAdded?.()
      } else if (data.isExisting) {
        toast({
          title: 'Термин уже в словаре',
          description: `Найдено существующее определение для "${data.term.term}"`,
        })
      }
    } catch {
      setError('Сетевая ошибка. Попробуйте ещё раз.')
    } finally {
      setIsLoading(false)
    }
  }, [query, toast, onTermAdded])

  const handleClear = useCallback(() => {
    setQuery('')
    setResult(null)
    setError(null)
    inputRef.current?.focus()
  }, [])

  // Keyboard: Escape clears the result
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (result || query)) {
        handleClear()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [result, query, handleClear])

  return (
    <Card className="mb-4 sm:mb-6 border-dashed bg-card/50 backdrop-blur-sm">
      <CardContent className="p-3 sm:p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Languages className="size-3.5 text-terminal-accent" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-terminal-accent">
            Ручной ввод термина
          </span>
          <span className="text-[10px] font-mono text-muted-foreground/70 ml-1">
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
            />
            {/* Language indicator badge */}
            {detectedLang && !isLoading && (
              <Badge
                variant="outline"
                className={cn(
                  'absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0 select-none',
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
              title="Очистить (Esc)"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </form>

        {/* Inline help text */}
        {!result && !error && !isLoading && (
          <p className="mt-2 text-[11px] text-muted-foreground/80 leading-relaxed">
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
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive flex items-start gap-2">
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
              className="mt-3"
            >
              <ResultCard result={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

function ResultCard({ result }: { result: TermLookupResult }) {
  const { term, inputLanguage, source, isExisting, saved } = result
  const isRussianInput = inputLanguage === 'ru'

  return (
    <div className="rounded-lg border border-border bg-background/60 overflow-hidden">
      {/* Result header bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-muted/40 border-b border-border">
        <div className="flex items-center gap-1.5 min-w-0">
          <BookOpen className="size-3 text-terminal-accent shrink-0" />
          <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-muted-foreground truncate">
            {isRussianInput ? 'русский ввод -&gt; английский термин' : 'английский ввод -&gt; русский перевод'}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Badge
            variant="outline"
            className={cn(
              'text-[9px] font-mono px-1.5 py-0',
              source === 'database'
                ? 'border-terminal-accent/40 text-terminal-accent'
                : 'border-neuro-brand/40 text-neuro-brand'
            )}
          >
            {source === 'database' ? 'из базы' : 'AI'}
          </Badge>
          {saved && (
            <Badge
              variant="outline"
              className="text-[9px] font-mono px-1.5 py-0 border-terminal-accent/40 text-terminal-accent bg-terminal-accent/10"
            >
              <Check className="size-2.5 mr-0.5" />
              добавлен
            </Badge>
          )}
          {isExisting && !saved && (
            <Badge
              variant="outline"
              className="text-[9px] font-mono px-1.5 py-0 border-muted-foreground/40 text-muted-foreground"
            >
              существует
            </Badge>
          )}
        </div>
      </div>

      {/* Result body */}
      <div className="p-3 sm:p-4">
        {/* Term + translation row */}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-2">
          <span className="font-mono font-bold text-base sm:text-lg text-foreground break-words">
            {term.term}
          </span>
          {isRussianInput && (
            <>
              <ArrowRight className="size-3 text-muted-foreground inline-block" />
              <span className="font-sans text-sm sm:text-base text-neuro-brand break-words">
                {term.translation}
              </span>
            </>
          )}
          {!isRussianInput && term.translation && (
            <span className="font-sans text-sm sm:text-base text-muted-foreground break-words">
              - {term.translation}
            </span>
          )}
        </div>

        {/* Explanation */}
        <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed mb-2">
          {term.explanation}
        </p>

        {/* Usage example */}
        {term.usage && (
          <div className="mt-2 rounded-md bg-muted/50 border border-border px-2.5 py-1.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-terminal-accent">
                example
              </span>
            </div>
            <code className="text-[11px] sm:text-xs font-mono text-foreground/90 whitespace-pre-wrap break-words">
              {term.usage}
            </code>
          </div>
        )}

        {/* Direction hint footer */}
        <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/70">
          <Languages className="size-2.5" />
          <span>
            {isRussianInput
              ? `Введено на русском -> найдено английское название: "${term.term}"`
              : `Введено на английском -> перевод: "${term.translation}"`}
          </span>
        </div>
      </div>
    </div>
  )
}
