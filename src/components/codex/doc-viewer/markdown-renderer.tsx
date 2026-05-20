'use client'

import { useState, useCallback, useSyncExternalStore } from 'react'
import ReactMarkdown from 'react-markdown'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
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
import { useTheme } from 'next-themes'
import { Check, Copy } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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

interface MarkdownContentProps {
  content: string
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const { toast } = useToast()
  const { theme } = useTheme()
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null)

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
    <div className="prose prose-stone dark:prose-invert prose-sm md:prose-base max-w-none break-words [&_pre]:overflow-x-auto [&_code]:break-all [&_a]:break-all mt-3">
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match
            const codeText = String(children).replace(/\n$/, '')
            const blockId = `code-${codeText.length}`

            if (isInline) {
              return (
                <code
                  className="bg-muted px-1 py-0.5 md:px-1.5 rounded text-foreground text-xs md:text-sm break-all whitespace-pre-wrap"
                  {...props}
                >
                  {children}
                </code>
              )
            }

            return (
              <div className="group relative">
                <button
                  className="absolute top-2 right-2 z-10 flex items-center gap-1.5 rounded-md border bg-background/80 backdrop-blur-sm px-2 py-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent hover:text-accent-foreground"
                  onClick={() => handleCopyCodeBlock(codeText, blockId)}
                >
                  {copiedBlockId === blockId ? (
                    <>
                      <Check className="size-3.5 text-terminal-accent" />
                      <span className="text-terminal-accent">ok</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>copy</span>
                    </>
                  )}
                </button>
                <SyntaxHighlighter
                  style={mounted && theme === 'dark' ? oneDark : oneLight}
                  language={match[1]}
                  PreTag="div"
                  className="rounded-md text-xs md:text-sm"
                  customStyle={{ overflowX: 'auto' }}
                >
                  {codeText}
                </SyntaxHighlighter>
              </div>
            )
          },
          h1({ children }) {
            return <h1 className="text-xl md:text-2xl font-bold text-foreground mt-4 md:mt-6 mb-2 md:mb-3 leading-tight">{children}</h1>
          },
          h2({ children }) {
            return <h2 className="text-lg md:text-xl font-semibold text-foreground mt-3 md:mt-5 mb-1.5 md:mb-2 leading-tight">{children}</h2>
          },
          h3({ children }) {
            return <h3 className="text-base md:text-lg font-semibold text-foreground mt-3 md:mt-4 mb-1.5 md:mb-2 leading-tight">{children}</h3>
          },
          p({ children }) {
            return <p className="text-muted-foreground leading-relaxed mb-3 md:mb-4">{children}</p>
          },
          ul({ children }) {
            return <ul className="list-disc pl-5 md:pl-6 mb-3 md:mb-4 text-muted-foreground space-y-0.5 md:space-y-1">{children}</ul>
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 md:pl-6 mb-3 md:mb-4 text-muted-foreground space-y-0.5 md:space-y-1">{children}</ol>
          },
          blockquote({ children }) {
            return <blockquote className="border-l-4 border-border pl-4 italic text-muted-foreground mb-4">{children}</blockquote>
          },
          a({ href, children }) {
            return (
              <a href={href} className="text-foreground underline hover:text-foreground/80 break-all" target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            )
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border border-border rounded-md">{children}</table>
              </div>
            )
          },
          th({ children }) {
            return <th className="border border-border bg-muted px-3 py-2 text-left text-sm font-medium text-foreground">{children}</th>
          },
          td({ children }) {
            return <td className="border border-border px-3 py-2 text-sm text-muted-foreground">{children}</td>
          },
          hr() {
            return <hr className="border-border my-6" />
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
