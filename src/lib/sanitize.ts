/**
 * Sanitize text per MARKDOWN_STANDARD.md / MARKDOWN_STANDARD_RU.md v1.0
 *
 * Implements both sanitization levels from the standard:
 * 1. Pre-analysis Cleanup - strips emoji ranges
 * 2. Final Sanitization - keeps only ASCII printable + Cyrillic + control chars
 *
 * Allowed: \n \r \t, ASCII printable (0x20-0x7E), Cyrillic (U+0400-U+04FF)
 * Everything else is stripped.
 */

// Pre-analysis Cleanup regex (MARKDOWN_STANDARD.md section 6.1)
const EMOJI_REGEX = /[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]|[\u{1F900}-\u{1F9FF}]|[\u{2702}-\u{27B0}]/gu

// Final Sanitization: keep only ASCII printable + Cyrillic + essential control chars
// ASCII printable: 0x20-0x7E
// Cyrillic: U+0400-U+04FF
// Control: \n (0x0A), \r (0x0D), \t (0x09)
const FINAL_REGEX = /[^\x09\x0A\x0D\x20-\x7E\u0400-\u04FF]/g

/**
 * Pre-analysis cleanup - strip emoji ranges first.
 * MARKDOWN_STANDARD.md section 6.1, step 2.
 */
export function stripEmojis(text: string): { text: string; removed: number } {
  const before = text.length
  const clean = text.replace(EMOJI_REGEX, '')
  return { text: clean, removed: before - clean.length }
}

/**
 * Final sanitization - keep only ASCII printable + Cyrillic + control chars.
 * MARKDOWN_STANDARD.md section 6.1, step 3.
 * MARKDOWN_STANDARD_RU.md section 6.1, step 3.
 */
export function sanitizeFinal(text: string): { text: string; removed: number } {
  const before = text.length
  const clean = text.replace(FINAL_REGEX, '')
  return { text: clean, removed: before - clean.length }
}

/**
 * Full sanitization pipeline per the standard.
 * 1. Strip emojis (pre-analysis cleanup)
 * 2. Final sanitization (ASCII + Cyrillic only)
 *
 * Returns sanitized text and total characters removed.
 */
export function sanitizeText(text: string): { text: string; removed: number } {
  const step1 = stripEmojis(text)
  const step2 = sanitizeFinal(step1.text)
  return { text: step2.text, removed: step1.removed + step2.removed }
}

/**
 * Sanitize a text field. Returns sanitized text.
 * Logs a warning if any characters were stripped.
 */
export function sanitizeField(text: string, label = 'content'): string {
  const { text: clean, removed } = sanitizeText(text)
  if (removed > 0) {
    console.warn(`[sanitize] ${removed} character(s) stripped from "${label}" per MARKDOWN_STANDARD`)
  }
  return clean
}

// Stack Signature per MARKDOWN_STANDARD.md section 5
const STACK_SIGNATURE = '\n\n---\nBuilt with: Next.js 16 + TypeScript + Tailwind CSS\n'

/**
 * Ensure document content ends with Stack Signature.
 * MARKDOWN_STANDARD.md section 5 / MARKDOWN_STANDARD_RU.md section 5.
 * Adds the signature only if missing.
 */
export function ensureStackSignature(content: string): string {
  const sig = 'Built with: Next.js 16 + TypeScript + Tailwind CSS'
  if (content.includes(sig)) return content
  return content.trimEnd() + STACK_SIGNATURE
}
