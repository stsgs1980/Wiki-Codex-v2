/**
 * Shared helpers for the Term export serializers.
 *
 * Extracted from formats.ts to keep that file under the R-02 150-line
 * anti-monolith limit (formats.ts has two long serializer bodies; mixing
 * small helpers in pushed it over).
 */

export type ExportTerm = {
  id: string
  term: string
  translation: string
  explanation: string
  usage: string | null
  documentId: string | null
  document: { id: string; title: string } | null
  createdAt: Date
  updatedAt: Date
}

/** First letter uppercase for A-Z section headers; "#" for everything else. */
export function firstLetter(term: string): string {
  const ch = term.trim().charAt(0).toUpperCase()
  // Latin letters pass through; everything else (Cyrillic, digits, symbols)
  // collapses to "#" so we don't emit empty "## Я" sections for ASCII-only
  // dictionaries.
  return /[A-Z]/.test(ch) ? ch : '#'
}

/** ISO date (YYYY-MM-DD) — stable across timezone differences in diffs. */
export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Russian plural rules: 1 термин / 2-4 термина / 5+ терминов. */
export function pluralTerms(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'термин'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'термина'
  return 'терминов'
}
