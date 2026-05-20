'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import type { Document, AIAnalysis } from '@/lib/types'
import type { RelatedDocument, DocumentViewerProps } from './types'

export function useDocumentViewer({
  document: initialDoc,
  onDelete,
  onUpdate,
  onAnalysisApplied,
}: Omit<DocumentViewerProps, 'categories'>) {
  const { setView, selectDocument, setSelectedCategory } = useAppStore()
  const { toast } = useToast()

  const [doc, setDoc] = useState<Document>(initialDoc)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(doc.title)
  const [editContent, setEditContent] = useState(doc.content)
  const [editCategoryId, setEditCategoryId] = useState(doc.categoryId || '')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [relatedDocs, setRelatedDocs] = useState<RelatedDocument[]>([])
  const [isRelatedLoading, setIsRelatedLoading] = useState(false)
  const [relatedFetched, setRelatedFetched] = useState(false)

  useEffect(() => {
    setDoc(initialDoc)
    setEditTitle(initialDoc.title)
    setEditContent(initialDoc.content)
    setEditCategoryId(initialDoc.categoryId || '')
    setIsEditing(false)
    setAnalysis(null)
    setRelatedDocs([])
    setRelatedFetched(false)
  }, [initialDoc])

  const handleStar = async () => {
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: !doc.isStarred }),
      })
      if (res.ok) {
        const updated = await res.json()
        setDoc(updated)
        onUpdate(updated)
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось обновить статус', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Удалено', description: `"${doc.title}" удален из базы знаний` })
        onDelete(doc.id)
        setView('documents')
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить документ', variant: 'destructive' })
    }
  }

  const handleSave = async () => {
    if (!editTitle.trim()) {
      toast({ title: 'Необходим заголовок', variant: 'destructive' })
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent,
          categoryId: editCategoryId && editCategoryId !== 'none' ? editCategoryId : null,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setDoc(updated)
        onUpdate(updated)
        setIsEditing(false)
        toast({ title: 'Сохранено', description: 'Документ успешно обновлен' })
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить документ', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAnalyze = async () => {
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

  const handleApplyAnalysis = async () => {
    if (!analysis) return
    setIsSaving(true)
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
        setDoc(updated)
        onAnalysisApplied(updated)
        toast({ title: 'Анализ применен', description: 'Предложения AI успешно сохранены' })
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось применить анализ', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const fetchRelatedDocuments = useCallback(async (docId: string) => {
    setIsRelatedLoading(true)
    try {
      const res = await fetch('/api/documents/related', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId, limit: 5 }),
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
    if (doc.id) fetchRelatedDocuments(doc.id)
  }, [doc.id, fetchRelatedDocuments])

  const handleRelatedClick = (relDoc: RelatedDocument) => {
    selectDocument(relDoc.id)
    setView('document-view')
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setEditTitle(doc.title)
    setEditContent(doc.content)
    setEditCategoryId(doc.categoryId || '')
  }

  return {
    doc, isEditing, setIsEditing,
    editTitle, setEditTitle, editContent, setEditContent,
    editCategoryId, setEditCategoryId,
    showDeleteDialog, setShowDeleteDialog,
    isAnalyzing, analysis, isSaving,
    relatedDocs, isRelatedLoading, relatedFetched,
    handleStar, handleDelete, handleSave,
    handleAnalyze, handleApplyAnalysis,
    fetchRelatedDocuments, handleRelatedClick, cancelEdit,
    setView, selectDocument, setSelectedCategory,
  }
}
