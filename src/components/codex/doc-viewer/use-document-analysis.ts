'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { Document, AIAnalysis } from '@/lib/types'

interface UseDocumentAnalysisOptions {
  initialDoc: Document
  onApplySuccess: (updated: Document) => void
}

export function useDocumentAnalysis({ initialDoc, onApplySuccess }: UseDocumentAnalysisOptions) {
  const { toast } = useToast()

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [isApplying, setIsApplying] = useState(false)

  // Reset analysis when the document changes
  useEffect(() => {
    setAnalysis(null)
  }, [initialDoc])

  const handleAnalyze = async (doc: Document) => {
    setIsAnalyzing(true)
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: doc.content }),
      })
      if (res.ok) {
        const result = await res.json()
        setAnalysis(result)
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось проанализировать документ', variant: 'destructive' })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleApplyAnalysis = async (doc: Document) => {
    if (!analysis) return
    setIsApplying(true)
    try {
      let categoryId = analysis.suggestedCategory?.id || null
      const tagIds = [...analysis.matchedTags.map((t) => t.id)]

      if (analysis.suggestedNewCategory && !categoryId) {
        const catRes = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: analysis.suggestedNewCategory }),
        })
        if (catRes.ok) {
          const newCat = await catRes.json()
          categoryId = newCat.id
        }
      }

      for (const tagName of analysis.newTagNames) {
        const tagRes = await fetch('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tagName }),
        })
        if (tagRes.ok) {
          const newTag = await tagRes.json()
          tagIds.push(newTag.id)
        }
      }

      const res = await fetch(`/api/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: analysis.summary, categoryId, tagIds }),
      })
      if (res.ok) {
        const updated = await res.json()
        onApplySuccess(updated)
        toast({ title: 'Анализ применен', description: 'Предложения AI успешно сохранены' })
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось применить анализ', variant: 'destructive' })
    } finally {
      setIsApplying(false)
    }
  }

  return {
    isAnalyzing,
    analysis,
    isApplying,
    handleAnalyze,
    handleApplyAnalysis,
  }
}
