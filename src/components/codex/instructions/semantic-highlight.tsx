'use client'

/**
 * STD-DOC-002 — Semantic code highlighter for Instructions page.
 *
 * Lightweight line-oriented tokenizer (no full grammar) tuned for the
 * command/snippet style content used in step cards: shell commands, env
 * vars, flags, paths, URLs, strings, comments, numbers, HTTP methods, etc.
 *
 * Color scheme aligns with the terminal-themed Prism theme (./syntax-theme.ts):
 *
 *   terminal-accent (green)  → HTTP methods, numbered list markers, env keys
 *   neuro-brand    (orange) → URLs, API paths
 *   star           (amber)  → quoted strings, env values
 *   muted-foreground         → comments, flags, file paths (faded)
 *   foreground               → plain text
 *
 * Token rules live in ./semantic-highlight-rules.ts (pure data + matchers,
 * no JSX) so this file owns only the React rendering loop.
 */
import { TOKEN_RULES } from './semantic-highlight-rules'

export function highlightCode(code: string): React.ReactNode[] {
  const lines = code.split('\n')
  return lines.map((line, lineIdx) => {
    const nodes: React.ReactNode[] = []
    let remaining = line
    let keyIdx = 0

    while (remaining.length > 0) {
      let matched = false

      for (const rule of TOKEN_RULES) {
        const result = rule.match(remaining)
        if (!result) continue

        for (const span of result.spans) {
          nodes.push(
            <span key={keyIdx++} className={span.className}>
              {span.text}
            </span>,
          )
        }
        remaining = result.next
        matched = true
        break
      }

      if (!matched) {
        // No match: take one character as plain text
        nodes.push(<span key={keyIdx++}>{remaining[0]}</span>)
        remaining = remaining.slice(1)
      }
    }

    return (
      <span key={lineIdx}>
        {nodes}
        {lineIdx < lines.length - 1 ? '\n' : ''}
      </span>
    )
  })
}
