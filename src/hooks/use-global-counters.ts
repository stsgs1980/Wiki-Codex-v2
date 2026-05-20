'use client'

import { useState, useCallback } from 'react'
import type { DocumentsResponse } from '@/lib/types'
import { BUILTIN_COUNT } from '@/components/codex/instructions'

export function useGlobalCounters() {
  const [allDocumentsCount, setAllDocumentsCount] = useState(0)
  const [allStarredCount, setAllStarredCount] = useState(0)
  const [termsCount, setTermsCount] = useState(0)
  const [notesCount, setNotesCount] = useState(0)
  const [instructionsCount, setInstructionsCount] = useState(0)

  const fetchGlobalCounters = useCallback(async () => {
    try {
      const [docRes, notesRes, termsRes, instrRes] = await Promise.all([
        fetch('/api/documents?limit=1'),
        fetch('/api/notes'),
        fetch('/api/terms'),
        fetch('/api/instructions'),
      ])
      if (docRes.ok) {
        const data: DocumentsResponse = await docRes.json()
        setAllDocumentsCount(data.allTotal)
        setAllStarredCount(data.allStarred)
      }
      if (notesRes.ok) {
        const notesData = await notesRes.json()
        setNotesCount(Array.isArray(notesData) ? notesData.length : 0)
      }
      if (termsRes.ok) {
        const termsData = await termsRes.json()
        const termsList = Array.isArray(termsData) ? termsData : (termsData.terms || [])
        setTermsCount(termsList.length)
      }
      if (instrRes.ok) {
        const instrData = await instrRes.json()
        const dbTotal = instrData.total ?? 0
        let hiddenCount = 0
        try {
          const raw = localStorage.getItem('wiki-codex:hidden-templates')
          if (raw) hiddenCount = (JSON.parse(raw) as string[]).length
        } catch { /* ignore */ }
        setInstructionsCount(BUILTIN_COUNT - hiddenCount + dbTotal)
      } else {
        let hiddenCount = 0
        try {
          const raw = localStorage.getItem('wiki-codex:hidden-templates')
          if (raw) hiddenCount = (JSON.parse(raw) as string[]).length
        } catch { /* ignore */ }
        setInstructionsCount(BUILTIN_COUNT - hiddenCount)
      }
    } catch { setInstructionsCount(BUILTIN_COUNT) }
  }, [])

  return {
    allDocumentsCount,
    allStarredCount,
    termsCount,
    notesCount,
    instructionsCount,
    setTermsCount: setTermsCount,
    fetchGlobalCounters,
  }
}
