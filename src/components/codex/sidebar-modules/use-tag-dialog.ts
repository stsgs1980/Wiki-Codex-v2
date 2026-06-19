'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface TagDialogCallbacks {
  onTagCreated?: () => void
  onTagDeleted?: () => void
}

export function useTagDialog(callbacks: TagDialogCallbacks) {
  const { toast } = useToast()

  // Tag dialog
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [tagName, setTagName] = useState('')
  const [tagColor, setTagColor] = useState('#78716c')
  const [isTagCreating, setIsTagCreating] = useState(false)

  const handleCreateTag = async () => {
    if (!tagName.trim()) return
    setIsTagCreating(true)
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName.trim(), color: tagColor }),
      })
      if (res.ok) {
        toast({ title: 'Тег создан', description: tagName.trim() })
        setTagName('')
        setTagColor('#78716c')
        setTagDialogOpen(false)
        callbacks.onTagCreated?.()
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось создать тег', variant: 'destructive' })
    } finally {
      setIsTagCreating(false)
    }
  }

  const handleDeleteTag = async (id: string) => {
    try {
      const res = await fetch(`/api/tags?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Тег удалён' })
        callbacks.onTagDeleted?.()
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить тег', variant: 'destructive' })
    }
  }

  return {
    tagDialogOpen,
    setTagDialogOpen,
    tagName,
    setTagName,
    tagColor,
    setTagColor,
    isTagCreating,
    handleCreateTag,
    handleDeleteTag,
  }
}
