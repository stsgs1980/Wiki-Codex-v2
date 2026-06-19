'use client'

import { useReducer, useEffect, useMemo } from 'react'
import { FileWarning, Loader2 } from 'lucide-react'
import { convertAdoc } from './asciidoc-processor'
import { extractStackSignature, type MarkdownContentProps } from './markdown-preprocessors'

/**
 * AsciiDocContent — renders .adoc source using asciidoctor.js.
 *
 * Pipeline:
 *   1. extractStackSignature splits off the trailing `\n---\nBuilt with:`
 *      footer (same convention as MarkdownContent — keeps §8 stack-signature
 *      rendering consistent across formats).
 *   2. Lazy-load asciidoctor.js (only on first .adoc view — ~2MB, cached).
 *   3. Convert source → HTML with `safe: 'secure'` (no includes, no data-uri).
 *   4. Render via dangerouslySetInnerHTML inside a scoped .asciidoc-body
 *      class. The wrapper scopes Tailwind-prose-like styles via globals.css
 *      so adoc and md documents share the same visual language (terminal
 *      theme, headings, code blocks, tables).
 *
 * The HTML from asciidoctor.js is trusted because:
 *  - Input source comes from authenticated document content (not arbitrary
 *    user-pasted HTML).
 *  - `safe: 'secure'` blocks all include/macro attack vectors.
 *  - The conversion is deterministic (no eval, no script injection).
 *
 * State machine (avoids setState-in-effect lint rule via useReducer):
 *  - {status: 'loading'}            — first render or content changed
 *  - {status: 'success', html}      — conversion succeeded
 *  - {status: 'error', message}     — parse / load failure
 */
type State =
  | { status: 'loading' }
  | { status: 'success'; html: string }
  | { status: 'error'; message: string }

type Action =
  | { type: 'start' }
  | { type: 'success'; html: string }
  | { type: 'error'; message: string }

function reducer(_state: State, action: Action): State {
  switch (action.type) {
    case 'start': return { status: 'loading' }
    case 'success': return { status: 'success', html: action.html }
    case 'error': return { status: 'error', message: action.message }
  }
}

export function AsciiDocContent({ content }: MarkdownContentProps) {
  const { body, signature } = useMemo(() => extractStackSignature(content), [content])
  const [state, dispatch] = useReducer(reducer, { status: 'loading' })

  useEffect(() => {
    let cancelled = false
    dispatch({ type: 'start' })
    convertAdoc(body)
      .then((out) => {
        if (!cancelled) dispatch({ type: 'success', html: out })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          dispatch({ type: 'error', message: err instanceof Error ? err.message : String(err) })
        }
      })
    return () => { cancelled = true }
  }, [body])

  if (state.status === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground" role="status" aria-live="polite">
        <Loader2 className="size-4 animate-spin" />
        Загрузка рендерера AsciiDoc…
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="my-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
        <div className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-400">
          <FileWarning className="size-4 shrink-0" />
          Ошибка рендеринга AsciiDoc
        </div>
        <pre className="mt-2 max-h-48 overflow-auto text-xs text-muted-foreground">
          {state.message}
        </pre>
      </div>
    )
  }

  return (
    <>
      <div
        className="asciidoc-body mt-3 [&_pre]:overflow-x-auto [&_a]:break-all"
        dangerouslySetInnerHTML={{ __html: state.html }}
      />
      {signature && (
        <div className="mt-6 pt-4 border-t border-dashed border-border">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span className="text-terminal-accent select-none">$</span>
            <span className="uppercase tracking-wider text-3xs">stack</span>
          </div>
          <p className="mt-1.5 text-sm font-mono text-foreground/80">{signature}</p>
        </div>
      )}
    </>
  )
}
