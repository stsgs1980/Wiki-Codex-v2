import type { Term } from '@/lib/types'

export interface TermLookupResult {
  term: Term
  inputLanguage: 'en' | 'ru'
  source: 'database' | 'ai'
  isExisting: boolean
  saved: boolean
}

export interface TermLookupProps {
  /** Called when a new term was added to the dictionary (saved=true) */
  onTermAdded?: () => void
}

/**
 * Regex that detects Cyrillic characters in the input.
 * Used both on the client (inline language hint) and by the API route
 * (`/api/terms/lookup`) to auto-detect the lookup direction.
 */
export const RUSSIAN_CHAR_REGEX = /[а-яёА-ЯЁ]/
