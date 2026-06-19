'use client'

import { useState, useCallback } from 'react'
import type { Term } from '@/lib/types'

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
