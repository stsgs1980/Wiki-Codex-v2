'use client'

import { useState, useEffect, useCallback } from 'react'
import type { RelatedDocument } from './types'

export function useRelatedDocuments(docId: string) {
  const [relatedDocs, setRelatedDocs] = useState<RelatedDocument[]>([])
  const [isRelatedLoading, setIsRelatedLoading] = useState(false)
  const [relatedFetched, setRelatedFetched] = useState(false)

  const fetchRelatedDocuments = useCallback(async (id: string) => {
    setIsRelatedLoading(true)
    try {
      const res = await fetch('/api/documents/related', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: id, limit: 5 }),
      })
      if (res.ok) {
        const data = await res.json()
        setRelatedDocs(data.related || [])
      }
    } catch (error) {
      console.error('Error fetching related documents:', error)
    } finally {
      setIsRelatedLoading(false)
      setRelatedFetched(true)
    }
  }, [])

  useEffect(() => {
    if (docId) fetchRelatedDocuments(docId)
  }, [docId, fetchRelatedDocuments])

  return {
    relatedDocs,
    isRelatedLoading,
    relatedFetched,
    fetchRelatedDocuments,
  }
}
