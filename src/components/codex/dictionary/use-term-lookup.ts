'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { RUSSIAN_CHAR_REGEX, type TermLookupResult } from './term-lookup-types'

/**
 * STD-DOC — State and side-effects for the manual term lookup card.
 *
 * Owns:
 *  - `query` / `isLoading` / `result` / `error` state
 *  - `inputRef` + Escape-key handler that clears the result
 *  - `detectedLang` derived from Cyrillic detection in the input
 *  - `handleLookup` — POSTs to `/api/terms/lookup` and toasts on save/existing
 *  - `handleClear` — resets all state and re-focuses the input
 *
 * Behavior is identical to the pre-refactor monolithic component; this is
 * purely the extracted hook so the view layer can stay under R-02 (≤150 lines).
 */
export function useTermLookup(onTermAdded?: () => void) {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TermLookupResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Auto-detect input language for the inline hint badge
  const isRussian = RUSSIAN_CHAR_REGEX.test(query)
  const detectedLang: 'en' | 'ru' | null = query.trim() ? (isRussian ? 'ru' : 'en') : null

  const handleLookup = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/terms/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: trimmed, save: true }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Не удалось найти термин')
        return
      }

      setResult(data as TermLookupResult)

      if (data.saved) {
        toast({
          title: 'Термин добавлен в словарь',
          description: `"${data.term.term}" — ${data.term.translation}`,
        })
        onTermAdded?.()
      } else if (data.isExisting) {
        toast({
          title: 'Термин уже в словаре',
          description: `Найдено существующее определение для "${data.term.term}"`,
        })
      }
    } catch {
      setError('Сетевая ошибка. Попробуйте ещё раз.')
    } finally {
      setIsLoading(false)
    }
  }, [query, toast, onTermAdded])

  const handleClear = useCallback(() => {
    setQuery('')
    setResult(null)
    setError(null)
    inputRef.current?.focus()
  }, [])

  // Keyboard: Escape clears the result
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (result || query)) {
        handleClear()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [result, query, handleClear])

  return {
    query,
    setQuery,
    isLoading,
    result,
    error,
    inputRef,
    detectedLang,
    handleLookup,
    handleClear,
  }
}
