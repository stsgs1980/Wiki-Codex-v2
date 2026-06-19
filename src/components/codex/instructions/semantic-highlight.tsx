'use client'

/**
 * STD-DOC-002 — Semantic code highlighter for Instructions page.
 *
 * This is a lightweight line-oriented tokenizer (no full grammar) tuned for
 * the command/snippet style content used in step cards: shell commands, env
 * vars, flags, paths, URLs, strings, comments, numbers, HTTP methods, etc.
 *
 * Color scheme is aligned with the terminal-themed Prism theme used by the
 * Markdown renderer (see ./syntax-theme.ts):
 *
 *   terminal-accent (green)  → HTTP methods, numbered list markers, env keys
 *   neuro-brand    (orange) → URLs, API paths
 *   star           (amber)  → quoted strings, env values
 *   muted-foreground         → comments, flags, file paths (faded)
 *   foreground               → plain text
 */
export function highlightCode(code: string): React.ReactNode[] {
  const lines = code.split('\n')
  return lines.map((line, lineIdx) => {
    const nodes: React.ReactNode[] = []
    let remaining = line
    let keyIdx = 0

    while (remaining.length > 0) {
      // Comment: starts with // or # (but not #! shebang or # in the middle)
      const commentMatch = remaining.match(/^(\/\/|#)(.*)/)
      if (commentMatch) {
        nodes.push(
          <span key={keyIdx++} className="text-muted-foreground/60 italic">
            {commentMatch[0]}
          </span>,
        )
        remaining = ''
        break
      }

      // Shebang: #!/usr/bin/env ...
      const shebangMatch = remaining.match(/^(#!.*$)/)
      if (shebangMatch) {
        nodes.push(
          <span key={keyIdx++} className="text-muted-foreground/60 italic">
            {shebangMatch[1]}
          </span>,
        )
        remaining = ''
        break
      }

      // HTTP method: POST, GET, PUT, DELETE, PATCH at start
      const methodMatch = remaining.match(/^(POST|GET|PUT|DELETE|PATCH|HEAD|OPTIONS)\b(.*)/)
      if (methodMatch) {
        nodes.push(
          <span key={keyIdx++} className="text-terminal-accent font-semibold">
            {methodMatch[1]}
          </span>,
        )
        remaining = methodMatch[2]
        continue
      }

      // API path: /api/...
      const pathMatch = remaining.match(/^(\/api\/[^\s]*)/)
      if (pathMatch) {
        nodes.push(
          <span key={keyIdx++} className="text-neuro-brand">
            {pathMatch[1]}
          </span>,
        )
        remaining = remaining.slice(pathMatch[1].length)
        continue
      }

      // URL: https://...
      const urlMatch = remaining.match(/^(https?:\/\/[^\s]*)/)
      if (urlMatch) {
        nodes.push(
          <span key={keyIdx++} className="text-neuro-brand underline decoration-neuro-brand/30">
            {urlMatch[1]}
          </span>,
        )
        remaining = remaining.slice(urlMatch[1].length)
        continue
      }

      // Quoted string (double or single quotes)
      const quoteMatch = remaining.match(/^("([^"\\]|\\.)*"|'([^'\\]|\\.)*')(.*)/)
      if (quoteMatch) {
        nodes.push(
          <span key={keyIdx++} className="text-star">
            {quoteMatch[1]}
          </span>,
        )
        remaining = quoteMatch[4] || ''
        continue
      }

      // Numbered list item: 1. 2. etc
      const numMatch = remaining.match(/^(\d+\.\s)(.*)/)
      if (numMatch) {
        nodes.push(
          <span key={keyIdx++} className="text-terminal-accent font-semibold">
            {numMatch[1]}
          </span>,
        )
        remaining = numMatch[2]
        continue
      }

      // Flag: --something or -x (single-letter flag)
      const flagMatch = remaining.match(/^(--?[\w-]+)(.*)/)
      if (flagMatch) {
        nodes.push(
          <span key={keyIdx++} className="text-foreground/70">
            {flagMatch[1]}
          </span>,
        )
        remaining = flagMatch[2]
        continue
      }

      // Environment var: KEY=value or KEY=value (with optional quotes handled above)
      const envMatch = remaining.match(/^([A-Z_][A-Z0-9_]*=)([^\s]*)(.*)/)
      if (envMatch) {
        nodes.push(
          <span key={keyIdx++} className="text-terminal-accent">
            {envMatch[1]}
          </span>,
        )
        if (envMatch[2]) {
          nodes.push(
            <span key={keyIdx++} className="text-star">
              {envMatch[2]}
            </span>,
          )
        }
        remaining = envMatch[3]
        continue
      }

      // File path: .ext files, ~/. paths, ./relative, /absolute
      const fileMatch = remaining.match(/^(\.?\/?[~./][\w./-]+\.[\w]+)(.*)/)
      if (fileMatch) {
        nodes.push(
          <span key={keyIdx++} className="text-foreground/70">
            {fileMatch[1]}
          </span>,
        )
        remaining = fileMatch[2]
        continue
      }

      // Numeric literal (standalone number, not part of a word)
      const numLiteralMatch = remaining.match(/^(\b\d+(?:\.\d+)?\b)(.*)/)
      if (numLiteralMatch) {
        nodes.push(
          <span key={keyIdx++} className="text-neuro-brand">
            {numLiteralMatch[1]}
          </span>,
        )
        remaining = numLiteralMatch[2]
        continue
      }

      // No match: take one character as plain text
      nodes.push(<span key={keyIdx++}>{remaining[0]}</span>)
      remaining = remaining.slice(1)
    }

    return (
      <span key={lineIdx}>
        {nodes}
        {lineIdx < lines.length - 1 ? '\n' : ''}
      </span>
    )
  })
}
