'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import type { Document, Category, Tag, DocumentsResponse, Note, Term } from '@/lib/types'
import { InstructionsView, BUILTIN_COUNT } from '@/components/codex/instructions-view'

// =============================================================================
// useGlobalCounters — sidebar counters always reflecting real totals
// =============================================================================
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

// =============================================================================
// useCategoriesAndTags — shared sidebar data
// =============================================================================
export function useCategoriesAndTags() {
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])

  const fetchCategoriesAndTags = useCallback(async () => {
    try {
      const [catRes, tagRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/tags'),
      ])
      if (catRes.ok) setCategories(await catRes.json())
      if (tagRes.ok) setTags(await tagRes.json())
    } catch (error) {
      console.error('Error fetching categories/tags:', error)
    }
  }, [])

  return { categories, tags, setCategories, setTags, fetchCategoriesAndTags }
}

// =============================================================================
// useDocuments — document list + single document
// =============================================================================
export function useDocuments() {
  const { searchQuery, selectedCategoryId, selectedTagId, semanticMode } = useAppStore()

  const [documents, setDocuments] = useState<Document[]>([])
  const [allDocuments, setAllDocuments] = useState<Document[]>([])
  const [totalDocuments, setTotalDocuments] = useState(0)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDocLoading, setIsDocLoading] = useState(false)

  const fetchDocuments = useCallback(async () => {
    if (semanticMode && searchQuery.trim()) {
      setIsLoading(true)
      try {
        const res = await fetch('/api/search/semantic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery.trim(), limit: 50 }),
        })
        if (res.ok) {
          const data = await res.json()
          setDocuments(data.results)
          setTotalDocuments(data.total)
        }
      } catch (error) {
        console.error('Error fetching semantic search results:', error)
      } finally {
        setIsLoading(false)
      }
      return
    }

    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (selectedCategoryId) params.set('categoryId', selectedCategoryId)
      if (selectedTagId) params.set('tagId', selectedTagId)
      params.set('limit', '50')

      const res = await fetch(`/api/documents?${params.toString()}`)
      if (res.ok) {
        const data: DocumentsResponse = await res.json()
        setDocuments(data.documents)
        setTotalDocuments(data.total)

        if (!searchQuery && !selectedCategoryId && !selectedTagId) {
          setAllDocuments(data.documents)
        }
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, selectedCategoryId, selectedTagId, semanticMode])

  const fetchDocument = useCallback(async (id: string) => {
    setIsDocLoading(true)
    setSelectedDocument(null)
    try {
      const res = await fetch(`/api/documents/${id}`)
      if (res.ok) {
        setSelectedDocument(await res.json())
      } else {
        useAppStore.getState().selectDocument(null)
        useAppStore.getState().setView('documents')
      }
    } catch (error) {
      console.error('Error fetching document:', error)
    } finally {
      setIsDocLoading(false)
    }
  }, [])

  const fetchAllDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/documents?limit=200')
      if (res.ok) {
        const data: DocumentsResponse = await res.json()
        setAllDocuments(data.documents)
      }
    } catch { /* silent */ }
  }, [])

  return {
    documents,
    allDocuments,
    totalDocuments,
    selectedDocument,
    setSelectedDocument,
    isLoading,
    isDocLoading,
    setAllDocuments,
    fetchDocuments,
    fetchDocument,
    fetchAllDocuments,
  }
}

// =============================================================================
// useNotes — notes CRUD
// =============================================================================
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

// =============================================================================
// useTerms — dictionary terms
// =============================================================================
export function useTerms() {
  const [terms, setTerms] = useState<Term[]>([])
  const [isTermsLoading, setIsTermsLoading] = useState(false)

  const fetchTerms = useCallback(async () => {
    setIsTermsLoading(true)
    try {
      const res = await fetch('/api/terms')
      if (res.ok) {
        const data = await res.json()
        const termsList = Array.isArray(data) ? data : (data.terms || [])
        setTerms(termsList)
      }
    } catch (error) {
      console.error('Error fetching terms:', error)
    } finally {
      setIsTermsLoading(false)
    }
  }, [])

  return {
    terms,
    isTermsLoading,
    fetchTerms,
  }
}
