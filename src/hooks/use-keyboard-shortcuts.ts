'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'

export function useKeyboardShortcuts() {
  const { setView, selectNote } = useAppStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey

      // Ctrl+N — new note
      if (mod && e.key === 'n') {
        e.preventDefault()
        selectNote(null)
        setView('note-view')
      }

      // Ctrl+U — upload document
      if (mod && e.key === 'u') {
        e.preventDefault()
        setView('upload')
      }

      // Escape — go back to documents or dashboard
      if (e.key === 'Escape') {
        const { currentView } = useAppStore.getState()
        if (currentView === 'document-view') {
          setView('documents')
        } else if (currentView === 'note-view') {
          setView('notes')
        } else if (currentView === 'upload') {
          setView('dashboard')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setView, selectNote])
}
