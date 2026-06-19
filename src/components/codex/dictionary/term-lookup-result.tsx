import { BookOpen, Languages, Check, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TermLookupResult } from './term-lookup-types'

/**
 * STD-DOC — Result card rendered after a successful `/api/terms/lookup` call.
 *
 * Shows the direction (ru→en / en→ru), source badge (database / ai),
 * optional saved / existing badges, the term + translation, the explanation,
 * an optional usage example, and a direction-hint footer.
 *
 * Pure presentational — no state, no fetches. Driven entirely by the
 * `TermLookupResult` returned from the API.
 */
export function TermLookupResult({ result }: { result: TermLookupResult }) {
  const { term, inputLanguage, source, isExisting, saved } = result
  const isRussianInput = inputLanguage === 'ru'

  return (
    <div className="rounded-lg border border-border bg-background/60 overflow-hidden">
      {/* Result header bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-muted/40 border-b border-border">
        <div className="flex items-center gap-1.5 min-w-0">
          <BookOpen className="size-3 text-terminal-accent shrink-0" />
          <span className="text-3xs font-mono font-medium uppercase tracking-wider text-muted-foreground truncate">
            {isRussianInput ? 'русский ввод -&gt; английский термин' : 'английский ввод -&gt; русский перевод'}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Badge
            variant="outline"
            className={cn(
              'text-3xs font-mono px-1.5 py-0',
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
              className="text-3xs font-mono px-1.5 py-0 border-terminal-accent/40 text-terminal-accent bg-terminal-accent/10"
            >
              <Check className="size-2.5 mr-0.5" />
              добавлен
            </Badge>
          )}
          {isExisting && !saved && (
            <Badge
              variant="outline"
              className="text-3xs font-mono px-1.5 py-0 border-muted-foreground/40 text-muted-foreground"
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
              <span className="text-3xs font-mono font-semibold uppercase tracking-wider text-terminal-accent">
                example
              </span>
            </div>
            <code className="text-2xs sm:text-xs font-mono text-foreground/90 whitespace-pre-wrap break-words">
              {term.usage}
            </code>
          </div>
        )}

        {/* Direction hint footer */}
        <div className="mt-3 flex items-center gap-1.5 text-3xs font-mono text-muted-foreground/70">
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
