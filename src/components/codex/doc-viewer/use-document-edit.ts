'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { Document } from '@/lib/types'

interface UseDocumentEditOptions {
  initialDoc: Document
  onSaveSuccess: (updated: Document) => void
}

export function useDocumentEdit({ initialDoc, onSaveSuccess }: UseDocumentEditOptions) {
  const { toast } = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(initialDoc.title)
  const [editContent, setEditContent] = useState(initialDoc.content)
  const [editCategoryId, setEditCategoryId] = useState(initialDoc.categoryId || '')
  const [isSaving, setIsSaving] = useState(false)

  // Reset form state when the document changes
  useEffect(() => {
    setEditTitle(initialDoc.title)
    setEditContent(initialDoc.content)
    setEditCategoryId(initialDoc.categoryId || '')
    setIsEditing(false)
  }, [initialDoc])

  const handleSave = async (doc: Document) => {
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
        onSaveSuccess(updated)
        setIsEditing(false)
        toast({ title: 'Сохранено', description: 'Документ успешно обновлен' })
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить документ', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const cancelEdit = (doc: Document) => {
    setIsEditing(false)
    setEditTitle(doc.title)
    setEditContent(doc.content)
    setEditCategoryId(doc.categoryId || '')
  }

  return {
    isEditing, setIsEditing,
    editTitle, setEditTitle,
    editContent, setEditContent,
    editCategoryId, setEditCategoryId,
    isSaving,
    handleSave,
    cancelEdit,
  }
}
