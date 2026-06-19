'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { SuggestedCategory } from './types'
import {
  createCategory,
  createCategoriesBulk,
  suggestCategories,
  deleteCategory,
} from './use-category-mutations'

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
      const ok = await createCategory({ name: catName.trim(), color: catColor })
      if (ok) {
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
      const result = await suggestCategories()
      if (result) {
        if (result.categories.length > 0) {
          setSuggestions(result.categories)
          setSelectedSuggestions(new Set(result.categories.map((_: SuggestedCategory, i: number) => i)))
        } else {
          toast({
            title: 'Нет предложений',
            description: result.message || 'AI не смог предложить новые категории',
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
      const created = await createCategoriesBulk(selected)
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
      const ok = await deleteCategory(id)
      if (ok) {
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
    catDialogOpen, setCatDialogOpen, catName, setCatName, catColor, setCatColor, isCatCreating,
    suggestions, selectedSuggestions, isSuggesting, isCreatingBulk, showSuggestions,
    handleCreateCategory, handleSuggestCategories, toggleSuggestion, toggleAllSuggestions,
    handleCreateSelected, handleDeleteCategory, openCatDialog, closeCatDialog,
  }
}
