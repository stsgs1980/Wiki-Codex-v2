'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { useGlobalCounters, useCategoriesAndTags, useDocuments, useNotes, useTerms } from '@/hooks/use-codex-data'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useRecentlyViewed } from '@/hooks/use-recently-viewed'
import { useNoteHandlers } from './use-note-handlers'

export function useWikiCodex() {
  const {
    currentView, selectedDocumentId, selectedNoteId, searchQuery,
    selectedCategoryId, selectedTagId, semanticMode, setView, selectNote,
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

  // --- Recently viewed tracking ---
  const { addViewed } = useRecentlyViewed()

  // --- Note handlers (extracted to use-note-handlers.ts) ---
  const {
    handleNoteSelect, handleCreateNote, handleNoteDelete,
    handleNoteDeleteById, handleNoteSave,
  } = useNoteHandlers({ notesHook, selectNote, setView, counters, toast })

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

  // --- Track recently viewed ---
  useEffect(() => {
    if (currentView === 'document-view' && docs.selectedDocument) {
      addViewed({ id: docs.selectedDocument.id, title: docs.selectedDocument.title })
    }
  }, [currentView, docs.selectedDocument, addViewed])

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

  // --- Document mutation handlers ---
  const handleUploadSuccess = useCallback(() => {
    setTimeout(refreshAll, 300)
  }, [refreshAll])

  // --- Document mutation handlers ---
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

  return {
    currentView, selectedDocumentId, selectedNoteId, searchQuery,
    selectedCategoryId, selectedTagId, semanticMode, setView, selectNote,
    mobileMenuOpen, setMobileMenuOpen,
    counters, categories, tags, fetchCategoriesAndTags,
    docs, notesHook, termsHook,
    refreshAll, handleUploadSuccess, handleDocumentDelete,
    handleDocumentUpdate, handleAnalysisApplied,
    handleNoteSelect, handleCreateNote, handleNoteDelete,
    handleNoteDeleteById, handleNoteSave,
  }
}
