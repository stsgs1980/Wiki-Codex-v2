'use client'

import { useCallback } from 'react'
import type { ViewType } from '@/lib/store'
import type { useNotes } from '@/hooks/use-notes'
import type { useGlobalCounters } from '@/hooks/use-global-counters'
import { toast } from '@/hooks/use-toast'

type NotesHook = ReturnType<typeof useNotes>
type Counters = ReturnType<typeof useGlobalCounters>
type ToastFn = typeof toast

interface UseNoteHandlersDeps {
  notesHook: NotesHook
  selectNote: (id: string | null) => void
  setView: (view: ViewType) => void
  counters: Counters
  toast: ToastFn
}

/**
 * Note CRUD handlers extracted from useWikiCodex (R-02 anti-monolith).
 * Behavior is byte-identical to the original inline handlers — same fetch URLs,
 * same toast wording, same control flow, same dependency arrays.
 */
export function useNoteHandlers(deps: UseNoteHandlersDeps) {
  const { notesHook, selectNote, setView, counters, toast } = deps

  const handleNoteSelect = useCallback((id: string) => {
    selectNote(id)
    setView('note-view')
  }, [selectNote, setView])

  const handleCreateNote = useCallback(() => {
    notesHook.setSelectedNote(null)
    selectNote(null)
    setView('note-view')
  }, [notesHook.setSelectedNote, selectNote, setView])

  const handleNoteDelete = useCallback(async () => {
    if (!notesHook.selectedNote) return
    try {
      const res = await fetch(`/api/notes/${notesHook.selectedNote.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Заметка удалена', description: `"${notesHook.selectedNote.title}"` })
        selectNote(null)
        setView('notes')
        notesHook.fetchNotes()
        counters.fetchGlobalCounters()
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить заметку', variant: 'destructive' })
    }
  }, [notesHook.selectedNote, selectNote, setView, notesHook.fetchNotes, counters.fetchGlobalCounters, toast])

  const handleNoteDeleteById = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Заметка удалена' })
        notesHook.fetchNotes()
        counters.fetchGlobalCounters()
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить заметку', variant: 'destructive' })
    }
  }, [notesHook.fetchNotes, counters.fetchGlobalCounters, toast])

  const handleNoteSave = useCallback(async (data: { title: string; content: string }) => {
    notesHook.setIsNoteSaving(true)
    try {
      const isEditing = notesHook.selectedNote !== null
      const url = isEditing ? `/api/notes/${notesHook.selectedNote!.id}` : '/api/notes'
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        toast({
          title: isEditing ? 'Заметка обновлена' : 'Заметка создана',
          description: `"${data.title}"`,
        })
        notesHook.fetchNotes()
        setView('notes')
      } else {
        // Extract error message from server response
        let errorMsg = `HTTP ${res.status}`
        try {
          const errData = await res.json()
          if (errData.error) errorMsg = typeof errData.error === 'string' ? errData.error : JSON.stringify(errData.error)
        } catch { /* ignore */ }
        toast({
          title: 'Ошибка сохранения',
          description: errorMsg,
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить заметку. Сервер недоступен.',
        variant: 'destructive',
      })
    } finally {
      notesHook.setIsNoteSaving(false)
    }
  }, [notesHook.selectedNote, notesHook.fetchNotes, notesHook.setIsNoteSaving, setView, toast])

  return {
    handleNoteSelect,
    handleCreateNote,
    handleNoteDelete,
    handleNoteDeleteById,
    handleNoteSave,
  }
}
