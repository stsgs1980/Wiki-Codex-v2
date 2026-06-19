'use client'

import { useState, useCallback, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { useToast } from '@/hooks/use-toast'
import { extractStackSignature, preprocessTextTags, type MarkdownContentProps } from './markdown-preprocessors'
import { createMarkdownOverrides } from './markdown-overrides'

/**
 * MarkdownContent — STD-DOC-002 compliant markdown renderer.
 *
 * Pipeline:
 *   1. extractStackSignature splits off the trailing `\n---\nBuilt with:`
 *      footer (§8) so it can be rendered separately from the prose.
 *   2. preprocessTextTags rewrites [OK]/[FAIL]/[TODO] etc. into inline code
 *      placeholders (`[TAG:OK]`) outside fenced code blocks (§4.4).
 *   3. ReactMarkdown renders the body with terminal-themed overrides built
 *      by createMarkdownOverrides — headings, lists, tables, blockquotes,
 *      links, and the code-block renderer (with copy button + SyntaxHighlighter).
 *   4. The stack signature is appended as a terminal-style footer.
 *
 * IMPORTANT: this export is named `MarkdownContent` (not `MarkdownRenderer`)
 * because document-view-mode.tsx imports it as `import { MarkdownContent }`.
 */
export function MarkdownContent({ content }: MarkdownContentProps) {
  const { toast } = useToast()
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null)

  const { body, signature } = useMemo(() => extractStackSignature(content), [content])
  const processedBody = useMemo(() => preprocessTextTags(body), [body])

  const handleCopyCodeBlock = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedBlockId(id)
      toast({ title: 'Скопировано', description: 'Код скопирован в буфер обмена' })
      setTimeout(() => setCopiedBlockId(null), 2000)
    }).catch(() => {
      toast({ title: 'Ошибка', description: 'Не удалось скопировать', variant: 'destructive' })
    })
  }, [toast])

  const components = useMemo(
    () => createMarkdownOverrides({ copiedBlockId, onCopy: handleCopyCodeBlock }),
    [copiedBlockId, handleCopyCodeBlock],
  )

  return (
    <div className="prose dark:prose-invert prose-sm md:prose-base max-w-none break-words [&_pre]:overflow-x-auto [&_code]:break-all [&_a]:break-all mt-3">
      <ReactMarkdown components={components}>
        {processedBody}
      </ReactMarkdown>
      {/* NOTE: body is preprocessed for text tags ([OK] → `[TAG:OK]`) before ReactMarkdown */}

      {/* STD-DOC-002 §8 Stack Signature footer */}
      {signature && (
        <div className="mt-6 pt-4 border-t border-dashed border-border">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span className="text-terminal-accent select-none">$</span>
            <span className="uppercase tracking-wider text-[10px]">stack</span>
          </div>
          <p className="mt-1.5 text-sm font-mono text-foreground/80">{signature}</p>
        </div>
      )}
    </div>
  )
}
