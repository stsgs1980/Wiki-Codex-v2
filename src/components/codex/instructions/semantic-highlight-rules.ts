/**
 * STD-DOC-002 — Token rules for the semantic code highlighter.
 *
 * Pure data + pure matchers. No React/JSX, no side effects.
 *
 * highlightCode() iterates TOKEN_RULES in order; the first rule whose
 * match() returns non-null wins. If no rule matches, the highlighter emits
 * one plain-text character and advances by one.
 *
 * Color scheme aligns with ./syntax-theme.ts:
 *   terminal-accent (green)  → HTTP methods, numbered list markers, env keys
 *   neuro-brand    (orange) → URLs, API paths, numeric literals
 *   star           (amber)  → quoted strings, env values
 *   muted-foreground         → comments, shebangs
 *   foreground/70            → flags, file paths (faded)
 *   foreground               → plain text (handled by highlightCode)
 */
export interface TokenSpan {
  text: string
  className: string
}

export interface TokenRuleMatch {
  spans: TokenSpan[]
  /** New remaining string after this token. Empty string ends the line. */
  next: string
}

export interface TokenRule {
  name: string
  match: (remaining: string) => TokenRuleMatch | null
}

export const TOKEN_RULES: TokenRule[] = [
  // Comment: starts with // or # (but not #! shebang — handled by next rule)
  {
    name: 'comment',
    match: (s) => {
      const m = s.match(/^(\/\/|#)(.*)/)
      return m
        ? { spans: [{ text: m[0], className: 'text-muted-foreground/60 italic' }], next: '' }
        : null
    },
  },
  // Shebang: #!/usr/bin/env ...
  {
    name: 'shebang',
    match: (s) => {
      const m = s.match(/^(#!.*$)/)
      return m
        ? { spans: [{ text: m[1], className: 'text-muted-foreground/60 italic' }], next: '' }
        : null
    },
  },
  // HTTP method: POST, GET, PUT, DELETE, PATCH, HEAD, OPTIONS at start
  {
    name: 'http-method',
    match: (s) => {
      const m = s.match(/^(POST|GET|PUT|DELETE|PATCH|HEAD|OPTIONS)\b(.*)/)
      return m
        ? { spans: [{ text: m[1], className: 'text-terminal-accent font-semibold' }], next: m[2] }
        : null
    },
  },
  // API path: /api/...
  {
    name: 'api-path',
    match: (s) => {
      const m = s.match(/^(\/api\/[^\s]*)/)
      return m
        ? { spans: [{ text: m[1], className: 'text-neuro-brand' }], next: s.slice(m[1].length) }
        : null
    },
  },
  // URL: https://...
  {
    name: 'url',
    match: (s) => {
      const m = s.match(/^(https?:\/\/[^\s]*)/)
      return m
        ? {
            spans: [{ text: m[1], className: 'text-neuro-brand underline decoration-neuro-brand/30' }],
            next: s.slice(m[1].length),
          }
        : null
    },
  },
  // Quoted string (double or single quotes)
  {
    name: 'quoted-string',
    match: (s) => {
      const m = s.match(/^("([^"\\]|\\.)*"|'([^'\\]|\\.)*')(.*)/)
      return m ? { spans: [{ text: m[1], className: 'text-star' }], next: m[4] || '' } : null
    },
  },
  // Numbered list item: 1. 2. etc
  {
    name: 'numbered-list',
    match: (s) => {
      const m = s.match(/^(\d+\.\s)(.*)/)
      return m
        ? { spans: [{ text: m[1], className: 'text-terminal-accent font-semibold' }], next: m[2] }
        : null
    },
  },
  // Flag: --something or -x (single-letter flag)
  {
    name: 'flag',
    match: (s) => {
      const m = s.match(/^(--?[\w-]+)(.*)/)
      return m
        ? { spans: [{ text: m[1], className: 'text-foreground/70' }], next: m[2] }
        : null
    },
  },
  // Environment var: KEY=value (value with optional quotes handled above)
  {
    name: 'env-var',
    match: (s) => {
      const m = s.match(/^([A-Z_][A-Z0-9_]*=)([^\s]*)(.*)/)
      if (!m) return null
      const spans: TokenSpan[] = [{ text: m[1], className: 'text-terminal-accent' }]
      if (m[2]) spans.push({ text: m[2], className: 'text-star' })
      return { spans, next: m[3] }
    },
  },
  // File path: .ext files, ~/. paths, ./relative, /absolute
  {
    name: 'file-path',
    match: (s) => {
      const m = s.match(/^(\.?\/?[~./][\w./-]+\.[\w]+)(.*)/)
      return m
        ? { spans: [{ text: m[1], className: 'text-foreground/70' }], next: m[2] }
        : null
    },
  },
  // Numeric literal (standalone number, not part of a word)
  {
    name: 'numeric-literal',
    match: (s) => {
      const m = s.match(/^(\b\d+(?:\.\d+)?\b)(.*)/)
      return m
        ? { spans: [{ text: m[1], className: 'text-neuro-brand' }], next: m[2] }
        : null
    },
  },
]
