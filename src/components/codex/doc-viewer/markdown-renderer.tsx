'use client'

import { useState, useCallback, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
// Only register languages we actually need — avoids importing all 400+ Prism languages
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown'
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript'
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript'
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python'
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql'
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml'
import docker from 'react-syntax-highlighter/dist/esm/languages/prism/docker'
import nginx from 'react-syntax-highlighter/dist/esm/languages/prism/nginx'
import diff from 'react-syntax-highlighter/dist/esm/languages/prism/diff'
import { Check, Copy } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { terminalSyntaxTheme } from './syntax-theme'

// Register only the languages we need
SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('sh', bash)
SyntaxHighlighter.registerLanguage('shell', bash)
SyntaxHighlighter.registerLanguage('css', css)
SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('md', markdown)
SyntaxHighlighter.registerLanguage('markdown', markdown)
SyntaxHighlighter.registerLanguage('ts', typescript)
SyntaxHighlighter.registerLanguage('tsx', typescript)
SyntaxHighlighter.registerLanguage('typescript', typescript)
SyntaxHighlighter.registerLanguage('js', javascript)
SyntaxHighlighter.registerLanguage('jsx', javascript)
SyntaxHighlighter.registerLanguage('javascript', javascript)
SyntaxHighlighter.registerLanguage('py', python)
SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('sql', sql)
SyntaxHighlighter.registerLanguage('yaml', yaml)
SyntaxHighlighter.registerLanguage('yml', yaml)
SyntaxHighlighter.registerLanguage('docker', docker)
SyntaxHighlighter.registerLanguage('dockerfile', docker)
SyntaxHighlighter.registerLanguage('nginx', nginx)
SyntaxHighlighter.registerLanguage('diff', diff)
SyntaxHighlighter.registerLanguage('patch', diff)

interface MarkdownContentProps {
  content: string
}

/**
 * Detects STD-DOC-002 §8 Stack Signature at end of document.
 * Format: `\n---\nBuilt with: <stack>`
 * Finds the LAST occurrence (a doc may contain `---` horizontal rules earlier).
 * Returns { body, signature } — signature is null if not present.
 */
function extractStackSignature(content: string): { body: string; signature: string | null } {
  const markers = [
    '\n---\nBuilt with:',
    '\n---\r\nBuilt with:',
    '\n--- \nBuilt with:',
  ]
  let idx = -1
  for (const m of markers) {
    const i = content.lastIndexOf(m)
    if (i > idx) idx = i
  }
  if (idx < 0) return { body: content, signature: null }
  const tail = content.slice(idx + 1)
  const lineMatch = tail.match(/^---\s*\n(Built with:[^\n]*)/)
  if (!lineMatch) return { body: content, signature: null }
  return {
    body: content.slice(0, idx).replace(/\n+$/, ''),
    signature: lineMatch[1].trim(),
  }
}

/**
 * STD-DOC-002 §4.4 — preprocess text tags [OK] [FAIL] [TODO] etc into inline code
 * placeholders that the `code` component override recognizes and renders as badges.
 * Placeholder format: `[TAG:NAME]` wrapped in backticks → ` `[TAG:OK]` `
 * Using backticks ensures ReactMarkdown treats them as inline code nodes
 * (predictable children shape) rather than mixed text runs.
 *
 * IMPORTANT: fenced code blocks (```...```) are skipped — tags inside code samples
 * must remain literal text (they demonstrate the syntax, not act as status badges).
 */
const TAG_NAMES = ['OK', 'DONE', 'PASS', 'FAIL', 'ERROR', 'TODO', 'WARNING', 'WARN', 'INFO', 'NOTE']
const TAG_PREPROCESS_RE = new RegExp(`\\[(${TAG_NAMES.join('|')})\\]`, 'g')

function preprocessTextTags(content: string): string {
  // Split by fenced code blocks (```...```) — only process even-indexed segments
  const parts = content.split(/(```[\s\S]*?```)/g)
  return parts.map((part, i) => {
    if (i % 2 === 1) return part // inside code fence — leave as-is
    return part.replace(TAG_PREPROCESS_RE, (_m, name) => '`[TAG:' + name + ']`')
  }).join('')
}

const TAG_INLINE_RE = /^\[TAG:(OK|DONE|PASS|FAIL|ERROR|TODO|WARNING|WARN|INFO|NOTE)\]$/

const TAG_STYLES: Record<string, string> = {
  OK: 'bg-terminal-accent/15 text-terminal-accent border-terminal-accent/40',
  DONE: 'bg-terminal-accent/15 text-terminal-accent border-terminal-accent/40',
  PASS: 'bg-terminal-accent/15 text-terminal-accent border-terminal-accent/40',
  FAIL: 'bg-destructive/15 text-destructive border-destructive/40',
  ERROR: 'bg-destructive/15 text-destructive border-destructive/40',
  TODO: 'bg-star/15 text-star border-star/40',
  WARNING: 'bg-star/15 text-star border-star/40',
  WARN: 'bg-star/15 text-star border-star/40',
  INFO: 'bg-neuro-brand/15 text-neuro-brand border-neuro-brand/40',
  NOTE: 'bg-neuro-brand/15 text-neuro-brand border-neuro-brand/40',
}

const TAG_LABELS: Record<string, string> = {
  WARNING: 'WARN',
}

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

  return (
    <div className="prose dark:prose-invert prose-sm md:prose-base max-w-none break-words [&_pre]:overflow-x-auto [&_code]:break-all [&_a]:break-all mt-3">
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match
            const codeText = String(children).replace(/\n$/, '')

            // STD-DOC-002 §4.4 — text tag badge rendering (preprocessed placeholder)
            const tagMatch = codeText.match(TAG_INLINE_RE)
            if (isInline && tagMatch) {
              const tagName = tagMatch[1]
              const label = TAG_LABELS[tagName] || tagName
              return (
                <span
                  className={
                    'inline-flex items-center rounded border px-1.5 py-px mx-0.5 ' +
                    'text-[0.7em] font-mono font-semibold uppercase tracking-wide align-baseline ' +
                    'leading-none select-none ' +
                    (TAG_STYLES[tagName] || '')
                  }
                >
                  {label}
                </span>
              )
            }

            const blockId = `code-${codeText.length}`
            const lang = match ? match[1] : ''

            if (isInline) {
              return (
                <code
                  className="bg-muted px-1 py-0.5 md:px-1.5 rounded text-foreground text-xs md:text-sm break-all whitespace-pre-wrap font-mono"
                  {...props}
                >
                  {children}
                </code>
              )
            }

            return (
              <div className="group relative my-4 rounded-lg border border-border overflow-hidden bg-card">
                {/* Header: language label + copy button (STD-DOC-002 §5.4) */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-muted/60 border-b border-border">
                  <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-muted-foreground">
                    {lang || 'text'}
                  </span>
                  <button
                    className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => handleCopyCodeBlock(codeText, blockId)}
                  >
                    {copiedBlockId === blockId ? (
                      <>
                        <Check className="size-3 text-terminal-accent" />
                        <span className="text-terminal-accent">ok</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        <span>copy</span>
                      </>
                    )}
                  </button>
                </div>
                <SyntaxHighlighter
                  style={terminalSyntaxTheme}
                  language={lang || 'text'}
                  PreTag="div"
                  className="!mt-0 !rounded-none text-xs md:text-sm syntax-terminal"
                  customStyle={{ overflowX: 'auto', margin: 0, padding: '0.75rem 1rem', background: 'transparent' }}
                  codeTagProps={{ style: { fontFamily: 'inherit' } }}
                >
                  {codeText}
                </SyntaxHighlighter>
              </div>
            )
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
        }}
      >
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
