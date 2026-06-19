/**
 * Language detection for term-lookup input.
 *
 * Preserved verbatim from the original /api/terms/lookup POST handler:
 * any Cyrillic character (а-яёА-ЯЁ) in the trimmed input → 'ru', else 'en'.
 */
const RUSSIAN_CHAR_REGEX = /[а-яёА-ЯЁ]/

export function detectLanguage(input: string): 'en' | 'ru' {
  return RUSSIAN_CHAR_REGEX.test(input) ? 'ru' : 'en'
}
