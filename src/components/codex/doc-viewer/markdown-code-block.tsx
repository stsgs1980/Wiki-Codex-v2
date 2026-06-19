'use client'

import type { ComponentPropsWithoutRef } from 'react'
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

/** `code` override for ReactMarkdown — renders STD-DOC-002 §4.4 text-tag badges (preprocessed
 *  placeholders), inline code, and terminal-themed fenced code blocks with language label + copy
 *  button (§5.4). `copiedBlockId` / `onCopy` are supplied by the parent so a single toast +
 *  clipboard state is shared. */
export interface MarkdownCodeProps extends Omit<ComponentPropsWithoutRef<'code'>, 'onCopy'> {
  node?: unknown
  copiedBlockId: string | null
  onCopy: (code: string, id: string) => void
}

export function MarkdownCode({ className, children, copiedBlockId, onCopy, ...props }: MarkdownCodeProps) {
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
          onClick={() => onCopy(codeText, blockId)}
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
}
