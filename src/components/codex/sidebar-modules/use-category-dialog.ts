'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { SuggestedCategory } from './types'

interface CategoryDialogCallbacks {
  onCategoryCreated?: () => void
  onCategoryDeleted?: () => void
}

export function useCategoryDialog(callbacks: CategoryDialogCallbacks) {
  const { toast } = useToast()

  // Category dialog
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [catName, setCatName] = useState('')
  const [catColor, setCatColor] = useState('#78716c')
  const [isCatCreating, setIsCatCreating] = useState(false)

  // AI suggestions
  const [suggestions, setSuggestions] = useState<SuggestedCategory[]>([])
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set())
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isCreatingBulk, setIsCreatingBulk] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleCreateCategory = async () => {
    if (!catName.trim()) return
    setIsCatCreating(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName.trim(), color: catColor }),
      })
      if (res.ok) {
        toast({ title: 'Категория создана', description: catName.trim() })
        setCatName('')
        setCatColor('#78716c')
        setCatDialogOpen(false)
        callbacks.onCategoryCreated?.()
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось создать категорию', variant: 'destructive' })
    } finally {
      setIsCatCreating(false)
    }
  }

  const handleSuggestCategories = async () => {
    setIsSuggesting(true)
    setShowSuggestions(true)
    setSuggestions([])
    setSelectedSuggestions(new Set())
    try {
      const res = await fetch('/api/categories/suggest', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.categories && data.categories.length > 0) {
          setSuggestions(data.categories)
          setSelectedSuggestions(new Set(data.categories.map((_: SuggestedCategory, i: number) => i)))
        } else {
          toast({
            title: 'Нет предложений',
            description: data.message || 'AI не смог предложить новые категории',
          })
        }
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось получить предложения', variant: 'destructive' })
    } finally {
      setIsSuggesting(false)
    }
  }

  const toggleSuggestion = (index: number) => {
    setSelectedSuggestions((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const toggleAllSuggestions = () => {
    if (selectedSuggestions.size === suggestions.length) {
      setSelectedSuggestions(new Set())
    } else {
      setSelectedSuggestions(new Set(suggestions.map((_, i) => i)))
    }
  }

  const handleCreateSelected = async () => {
    const selected = suggestions.filter((_, i) => selectedSuggestions.has(i))
    if (selected.length === 0) return
    setIsCreatingBulk(true)
    try {
      let created = 0
      for (const cat of selected) {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cat.name, description: cat.description, color: cat.color }),
        })
        if (res.ok) created++
      }
      toast({
        title: 'Категории созданы',
        description: `${created} из ${selected.length} категорий добавлено`,
      })
      setSuggestions([])
      setSelectedSuggestions(new Set())
      setShowSuggestions(false)
      setCatDialogOpen(false)
      callbacks.onCategoryCreated?.()
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось создать все категории', variant: 'destructive' })
    } finally {
      setIsCreatingBulk(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Категория удалена' })
        callbacks.onCategoryDeleted?.()
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить категорию', variant: 'destructive' })
    }
  }

  const openCatDialog = () => setCatDialogOpen(true)
  const closeCatDialog = () => {
    setCatDialogOpen(false)
    setShowSuggestions(false)
    setSuggestions([])
    setSelectedSuggestions(new Set())
  }

  return {
    catDialogOpen,
    setCatDialogOpen,
    catName,
    setCatName,
    catColor,
    setCatColor,
    isCatCreating,
    suggestions,
    selectedSuggestions,
    isSuggesting,
    isCreatingBulk,
    showSuggestions,
    handleCreateCategory,
    handleSuggestCategories,
    toggleSuggestion,
    toggleAllSuggestions,
    handleCreateSelected,
    handleDeleteCategory,
    openCatDialog,
    closeCatDialog,
  }
}
