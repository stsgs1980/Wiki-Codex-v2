'use client'

export function highlightCode(code: string): React.ReactNode[] {
  const lines = code.split('\n')
  return lines.map((line, lineIdx) => {
    const nodes: React.ReactNode[] = []
    let remaining = line
    let keyIdx = 0

    // Process each line for semantic tokens
    while (remaining.length > 0) {
      // Comment: starts with // or #
      const commentMatch = remaining.match(/^(\/\/|#)(.*)/)
      if (commentMatch) {
        nodes.push(<span key={keyIdx++} className="text-muted-foreground/60">{commentMatch[0]}</span>)
        remaining = ''
        break
      }

      // HTTP method: POST, GET, PUT, DELETE, PATCH at start
      const methodMatch = remaining.match(/^(POST|GET|PUT|DELETE|PATCH)\b(.*)/)
      if (methodMatch) {
        nodes.push(<span key={keyIdx++} className="text-terminal-accent font-semibold">{methodMatch[1]}</span>)
        remaining = methodMatch[2]
        continue
      }

      // API path: /api/...
      const pathMatch = remaining.match(/^(\/api\/[^\s]*)/)
      if (pathMatch) {
        nodes.push(<span key={keyIdx++} className="text-neuro-brand">{pathMatch[1]}</span>)
        remaining = remaining.slice(pathMatch[1].length)
        continue
      }

      // URL: https://...
      const urlMatch = remaining.match(/^(https?:\/\/[^\s]*)/)
      if (urlMatch) {
        nodes.push(<span key={keyIdx++} className="text-neuro-brand underline decoration-neuro-brand/30">{urlMatch[1]}</span>)
        remaining = remaining.slice(urlMatch[1].length)
        continue
      }

      // Quoted string
      const quoteMatch = remaining.match(/^("([^"]*)"|'([^']*)')(.*)/)
      if (quoteMatch) {
        nodes.push(<span key={keyIdx++} className="text-star">{quoteMatch[1]}</span>)
        remaining = quoteMatch[4] || ''
        continue
      }

      // Numbered list item: 1. 2. etc
      const numMatch = remaining.match(/^(\d+\.\s)(.*)/)
      if (numMatch) {
        nodes.push(<span key={keyIdx++} className="text-terminal-accent font-semibold">{numMatch[1]}</span>)
        remaining = numMatch[2]
        continue
      }

      // Flag: --something
      const flagMatch = remaining.match(/^(--[\w-]+)(.*)/)
      if (flagMatch) {
        nodes.push(<span key={keyIdx++} className="text-foreground/70">{flagMatch[1]}</span>)
        remaining = flagMatch[2]
        continue
      }

      // Environment var: KEY=value or KEY=value
      const envMatch = remaining.match(/^([A-Z_][A-Z0-9_]*=)([^\s]*)(.*)/)
      if (envMatch) {
        nodes.push(<span key={keyIdx++} className="text-terminal-accent">{envMatch[1]}</span>)
        nodes.push(<span key={keyIdx++} className="text-star">{envMatch[2]}</span>)
        remaining = envMatch[3]
        continue
      }

      // File path: .ext files, ~/. paths
      const fileMatch = remaining.match(/^(\.?\/?[~./][\w./-]+\.[\w]+)(.*)/)
      if (fileMatch) {
        nodes.push(<span key={keyIdx++} className="text-foreground/70">{fileMatch[1]}</span>)
        remaining = fileMatch[2]
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
