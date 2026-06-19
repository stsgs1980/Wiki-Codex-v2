/**
 * STD-DOC-002 markdown preprocessing utilities (pure functions, no JSX).
 *
 * - extractStackSignature: detects `\n---\nBuilt with: <stack>` footer
 * - preprocessTextTags: rewrites [OK]/[FAIL]/[TODO] etc. into inline code
 *   placeholders (`[TAG:OK]`) that the `code` component override recognizes
 *   and renders as terminal-style badges.
 *
 * IMPORTANT: fenced code blocks (```...```) are skipped during tag
 * preprocessing — tags inside code samples must remain literal text.
 */

export interface MarkdownContentProps {
  content: string
}

/**
 * Detects STD-DOC-002 §8 Stack Signature at end of document.
 * Format: `\n---\nBuilt with: <stack>`
 * Finds the LAST occurrence (a doc may contain `---` horizontal rules earlier).
 * Returns { body, signature } — signature is null if not present.
 */
export function extractStackSignature(content: string): { body: string; signature: string | null } {
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
 * STD-DOC-002 §4.4 — preprocess text tags [OK] [FAIL] [TODO] etc into inline
 * code placeholders that the `code` component override recognizes and renders
 * as badges. Placeholder format: `[TAG:NAME]` wrapped in backticks.
 *
 * Using backticks ensures ReactMarkdown treats them as inline code nodes
 * (predictable children shape) rather than mixed text runs.
 *
 * IMPORTANT: fenced code blocks (```...```) are skipped — tags inside code
 * samples must remain literal text (they demonstrate the syntax, not act as
 * status badges).
 */
const TAG_NAMES = ['OK', 'DONE', 'PASS', 'FAIL', 'ERROR', 'TODO', 'WARNING', 'WARN', 'INFO', 'NOTE']
const TAG_PREPROCESS_RE = new RegExp(`\\[(${TAG_NAMES.join('|')})\\]`, 'g')

export function preprocessTextTags(content: string): string {
  // Split by fenced code blocks (```...```) — only process even-indexed segments
  const parts = content.split(/(```[\s\S]*?```)/g)
  return parts.map((part, i) => {
    if (i % 2 === 1) return part // inside code fence — leave as-is
    return part.replace(TAG_PREPROCESS_RE, (_m, name) => '`[TAG:' + name + ']`')
  }).join('')
}
