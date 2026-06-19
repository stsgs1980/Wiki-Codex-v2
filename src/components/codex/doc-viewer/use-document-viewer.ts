'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import type { Document } from '@/lib/types'
import type { RelatedDocument, DocumentViewerProps } from './types'
import { useDocumentEdit } from './use-document-edit'
import { useDocumentAnalysis } from './use-document-analysis'
import { useRelatedDocuments } from './use-related-documents'

export function useDocumentViewer({
  document: initialDoc,
  onDelete,
  onUpdate,
  onAnalysisApplied,
}: Omit<DocumentViewerProps, 'categories'>) {
  const { setView, selectDocument, setSelectedCategory } = useAppStore()
  const { toast } = useToast()

  const [doc, setDoc] = useState<Document>(initialDoc)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Sync doc when the incoming prop changes
  useEffect(() => {
    setDoc(initialDoc)
  }, [initialDoc])

  // Sub-hooks
  const edit = useDocumentEdit({
    initialDoc,
    onSaveSuccess: (updated) => {
      setDoc(updated)
      onUpdate(updated)
    },
  })

  const analysis = useDocumentAnalysis({
    initialDoc,
    onApplySuccess: (updated) => {
      setDoc(updated)
      onAnalysisApplied(updated)
    },
  })

  const related = useRelatedDocuments(doc.id)

  // Orchestrator-level handlers
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

  const handleRelatedClick = (relDoc: RelatedDocument) => {
    selectDocument(relDoc.id)
    setView('document-view')
  }

  // Wrap sub-hook handlers so consumers don't need to pass `doc`
  const handleSave = () => edit.handleSave(doc)
  const cancelEdit = () => edit.cancelEdit(doc)
  const handleAnalyze = () => analysis.handleAnalyze(doc)
  const handleApplyAnalysis = () => analysis.handleApplyAnalysis(doc)

  return {
    doc,
    isEditing: edit.isEditing,
    setIsEditing: edit.setIsEditing,
    editTitle: edit.editTitle,
    setEditTitle: edit.setEditTitle,
    editContent: edit.editContent,
    setEditContent: edit.setEditContent,
    editCategoryId: edit.editCategoryId,
    setEditCategoryId: edit.setEditCategoryId,
    isSaving: edit.isSaving,
    showDeleteDialog,
    setShowDeleteDialog,
    isAnalyzing: analysis.isAnalyzing,
    analysis: analysis.analysis,
    isApplying: analysis.isApplying,
    relatedDocs: related.relatedDocs,
    isRelatedLoading: related.isRelatedLoading,
    relatedFetched: related.relatedFetched,
    handleStar,
    handleDelete,
    handleSave,
    handleAnalyze,
    handleApplyAnalysis,
    fetchRelatedDocuments: related.fetchRelatedDocuments,
    handleRelatedClick,
    cancelEdit,
    setView,
    selectDocument,
    setSelectedCategory,
  }
}
