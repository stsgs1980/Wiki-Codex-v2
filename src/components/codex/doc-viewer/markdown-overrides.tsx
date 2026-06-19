'use client'

import type { Components } from 'react-markdown'
import { MarkdownCode } from './markdown-code-block'

/**
 * Factory for the `components` prop passed to ReactMarkdown.
 *
 * Terminal-themed overrides for headings, paragraphs, lists, blockquotes,
 * tables, links, and `<hr>` — matching the existing markdown-renderer look.
 * The `code` override is delegated to MarkdownCode so it can access the
 * parent's `copiedBlockId` / `onCopy` for the copy-button state.
 */
export interface CreateMarkdownOverridesParams {
  copiedBlockId: string | null
  onCopy: (code: string, id: string) => void
}

export function createMarkdownOverrides({ copiedBlockId, onCopy }: CreateMarkdownOverridesParams): Components {
  return {
    code(props) {
      return <MarkdownCode {...props} copiedBlockId={copiedBlockId} onCopy={onCopy} />
    },
    h1({ children }) {
      return (
        <h1 className="flex items-center gap-2 text-xl md:text-2xl font-bold text-foreground mt-5 md:mt-7 mb-2 md:mb-3 leading-tight font-mono">
          <span className="text-terminal-accent select-none">#</span>
          <span>{children}</span>
        </h1>
      )
    },
    h2({ children }) {
      return (
        <h2 className="flex items-center gap-2 text-lg md:text-xl font-semibold text-foreground mt-4 md:mt-6 mb-1.5 md:mb-2 leading-tight font-mono">
          <span className="text-terminal-accent select-none">##</span>
          <span>{children}</span>
        </h2>
      )
    },
    h3({ children }) {
      return (
        <h3 className="flex items-center gap-2 text-base md:text-lg font-semibold text-foreground mt-3 md:mt-5 mb-1.5 md:mb-2 leading-tight font-mono">
          <span className="text-terminal-accent/70 select-none">###</span>
          <span>{children}</span>
        </h3>
      )
    },
    p({ children }) {
      return <p className="text-muted-foreground leading-relaxed mb-3 md:mb-4">{children}</p>
    },
    li({ children }) {
      return <li className="text-muted-foreground leading-relaxed">{children}</li>
    },
    ul({ children }) {
      return <ul className="list-none pl-5 md:pl-6 mb-3 md:mb-4 text-muted-foreground space-y-0.5 md:space-y-1 [&_li::before]:content-['-'] [&_li::before]:text-terminal-accent [&_li::before]:mr-2 [&_li::before]:font-mono">{children}</ul>
    },
    ol({ children }) {
      return <ol className="list-none pl-5 md:pl-6 mb-3 md:mb-4 text-muted-foreground space-y-0.5 md:space-y-1 counter-reset-step">{children}</ol>
    },
    blockquote({ children }) {
      return (
        <blockquote className="border-l-2 border-terminal-accent/50 pl-3 md:pl-4 py-1 my-3 bg-muted/30 rounded-r text-muted-foreground italic">
          {children}
        </blockquote>
      )
    },
    a({ href, children }) {
      return (
        <a href={href} className="text-neuro-brand underline decoration-neuro-brand/40 hover:decoration-neuro-brand transition-colors break-all" target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      )
    },
    table({ children }) {
      return (
        <div className="overflow-x-auto mb-4 my-3 border border-border rounded-md">
          <table className="min-w-full">{children}</table>
        </div>
      )
    },
    th({ children }) {
      return <th className="border-b border-border bg-muted/60 px-3 py-2 text-left text-xs font-mono font-semibold text-foreground uppercase tracking-wide">{children}</th>
    },
    td({ children }) {
      return <td className="border-b border-border/50 px-3 py-2 text-sm text-muted-foreground">{children}</td>
    },
    hr() {
      return <hr className="border-border my-6" />
    },
  }
}
