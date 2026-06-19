'use client'

import { useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import type { Document, DocumentsResponse } from '@/lib/types'

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
