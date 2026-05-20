'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import {
  useGlobalCounters,
  useCategoriesAndTags,
  useDocuments,
  useNotes,
  useTerms,
} from '@/hooks/use-codex-data'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

export function useWikiCodex() {
  const {
    currentView,
    selectedDocumentId,
    selectedNoteId,
    searchQuery,
    selectedCategoryId,
    selectedTagId,
    semanticMode,
    setView,
    selectNote,
  } = useAppStore()

  const { toast } = useToast()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // --- Keyboard shortcuts ---
  useKeyboardShortcuts()

  // --- Data hooks ---
  const counters = useGlobalCounters()
  const { categories, tags, fetchCategoriesAndTags } = useCategoriesAndTags()
  const docs = useDocuments()
  const notesHook = useNotes()
  const termsHook = useTerms()

  // --- Master refresh ---
  const refreshAll = useCallback(() => {
    docs.fetchDocuments()
    fetchCategoriesAndTags()
    termsHook.fetchTerms()
    counters.fetchGlobalCounters()
    docs.fetchAllDocuments()
  }, [docs.fetchDocuments, fetchCategoriesAndTags, termsHook.fetchTerms, counters.fetchGlobalCounters, docs.fetchAllDocuments])

  // --- Initial load ---
  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  // --- View-dependent fetches ---
  useEffect(() => {
    if (currentView === 'dashboard' || currentView === 'documents') {
      docs.fetchDocuments()
    }
  }, [currentView, docs.fetchDocuments])

  useEffect(() => {
    if (currentView === 'notes' || currentView === 'note-view') {
      notesHook.fetchNotes()
    }
  }, [currentView, notesHook.fetchNotes])

  useEffect(() => {
    if (currentView === 'dictionary') {
      termsHook.fetchTerms()
      docs.fetchAllDocuments()
    }
  }, [currentView, termsHook.fetchTerms, docs.fetchAllDocuments])

  useEffect(() => {
    if (selectedDocumentId && currentView === 'document-view') {
      docs.fetchDocument(selectedDocumentId)
    }
  }, [selectedDocumentId, currentView, docs.fetchDocument])

  useEffect(() => {
    if (selectedNoteId && currentView === 'note-view') {
      const note = notesHook.notes.find((n) => n.id === selectedNoteId)
      if (note) {
        notesHook.setSelectedNote(note)
      } else {
        fetch(`/api/notes/${selectedNoteId}`)
          .then((res) => res.ok ? res.json() : null)
          .then((data) => {
            if (data) notesHook.setSelectedNote(data)
            else { selectNote(null); setView('notes') }
          })
          .catch(() => { selectNote(null); setView('notes') })
      }
    }
  }, [selectedNoteId, currentView, notesHook.notes, notesHook.fetchNotes, notesHook.setSelectedNote, selectNote, setView])

  // --- Mutation handlers ---
  const handleUploadSuccess = useCallback(() => {
    setTimeout(refreshAll, 300)
  }, [refreshAll])

  const handleDocumentDelete = useCallback((id: string) => {
    docs.setSelectedDocument(null)
    useAppStore.getState().selectDocument(null)
    refreshAll()
  }, [refreshAll, docs.setSelectedDocument])

  const handleDocumentUpdate = useCallback(() => {
    refreshAll()
  }, [refreshAll])

  const handleAnalysisApplied = useCallback(() => {
    refreshAll()
  }, [refreshAll])

  // --- Clear stale state on view change ---
  useEffect(() => {
    if (currentView !== 'document-view') {
      docs.setSelectedDocument(null)
      const storeState = useAppStore.getState()
      if (storeState.selectedDocumentId) storeState.selectDocument(null)
    }
    if (currentView !== 'note-view') {
      notesHook.setSelectedNote(null)
      const storeState = useAppStore.getState()
      if (storeState.selectedNoteId) storeState.selectNote(null)
    }
  }, [currentView, docs.setSelectedDocument, notesHook.setSelectedNote])

  // --- Note handlers ---
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
      }
    } catch {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить заметку',
        variant: 'destructive',
      })
    } finally {
      notesHook.setIsNoteSaving(false)
    }
  }, [notesHook.selectedNote, notesHook.fetchNotes, notesHook.setIsNoteSaving, setView, toast])

  return {
    // Store state
    currentView,
    selectedDocumentId,
    selectedNoteId,
    searchQuery,
    selectedCategoryId,
    selectedTagId,
    semanticMode,
    setView,
    selectNote,
    // UI state
    mobileMenuOpen,
    setMobileMenuOpen,
    // Data
    counters,
    categories,
    tags,
    fetchCategoriesAndTags,
    docs,
    notesHook,
    termsHook,
    // Handlers
    refreshAll,
    handleUploadSuccess,
    handleDocumentDelete,
    handleDocumentUpdate,
    handleAnalysisApplied,
    handleNoteSelect,
    handleCreateNote,
    handleNoteDelete,
    handleNoteDeleteById,
    handleNoteSave,
  }
}
