'use client'

import { useState, useCallback } from 'react'
import type { Note } from '@/lib/types'

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isNotesLoading, setIsNotesLoading] = useState(false)
  const [isNoteSaving, setIsNoteSaving] = useState(false)

  const fetchNotes = useCallback(async () => {
    setIsNotesLoading(true)
    try {
      const res = await fetch('/api/notes')
      if (res.ok) {
        const data = await res.json()
        setNotes(data)
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setIsNotesLoading(false)
    }
  }, [])

  return {
    notes,
    setNotes,
    selectedNote,
    setSelectedNote,
    isNotesLoading,
    isNoteSaving,
    setIsNoteSaving,
    fetchNotes,
  }
}
