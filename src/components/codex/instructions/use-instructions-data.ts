'use client'

import { useState, useCallback, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { BUILTIN_TEMPLATES, BUILTIN_COUNT } from './builtin-templates'
import { getHiddenIds, addHiddenId } from './hidden-templates'
import { parseSteps } from './parse-steps'
import type { InstructionItem } from './types'

export function useInstructionsData(onCountChange?: () => void) {
  const [searchQuery, setSearchQuery] = useState('')
  const [dbInstructions, setDbInstructions] = useState<InstructionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractDialogOpen, setExtractDialogOpen] = useState(false)
  const [selectedDocId, setSelectedDocId] = useState('')
  const [documents, setDocuments] = useState<{ id: string; title: string }[]>([])
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())

  const { toast } = useToast()

  // Fetch DB instructions + documents list
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [instrRes, docRes] = await Promise.all([
        fetch('/api/instructions'),
        fetch('/api/documents?limit=100'),
      ])
      if (instrRes.ok) {
        const data = await instrRes.json()
        setDbInstructions(data.instructions || [])
      }
      if (docRes.ok) {
        const data = await docRes.json()
        setDocuments((data.documents || []).map((d: { id: string; title: string }) => ({ id: d.id, title: d.title })))
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Extract instructions from a document
  const handleExtract = useCallback(async () => {
    if (!selectedDocId) return
    setIsExtracting(true)
    try {
      const res = await fetch('/api/instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractFromDocId: selectedDocId }),
      })
      if (res.ok) {
        const data = await res.json()
        const count = data.total || 0
        if (count > 0) {
          toast({ title: `Извлечено ${count} инструкций`, description: 'Из документа: ' + (documents.find((d) => d.id === selectedDocId)?.title || '') })
        } else {
          toast({ title: 'Инструкции не найдены', description: data.message || 'Попробуйте другой документ', variant: 'destructive' })
        }
        fetchData()
        setExtractDialogOpen(false)
        setSelectedDocId('')
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось извлечь инструкции', variant: 'destructive' })
    } finally {
      setIsExtracting(false)
    }
  }, [selectedDocId, documents, fetchData, toast])

  // Load hidden IDs from localStorage
  useEffect(() => {
    setHiddenIds(getHiddenIds())
  }, [])

  const handleHideTemplate = useCallback((id: string) => {
    addHiddenId(id)
    setHiddenIds(getHiddenIds())
    toast({ title: 'Инструкция удалена' })
    onCountChange?.()
  }, [toast, onCountChange])

  // Delete instruction (DB)
  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/instructions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Удалено' })
        fetchData()
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить', variant: 'destructive' })
    }
  }, [fetchData, toast])

  // Filter
  const q = searchQuery.toLowerCase()
  const filteredTemplates = BUILTIN_TEMPLATES.filter((g) => {
    if (hiddenIds.has(g.id)) return false
    if (!q) return true
    return (
      g.title.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      g.steps.some((s) =>
        s.title.toLowerCase().includes(q) ||
        s.codeBlocks.some((c) => c.label.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
      )
    )
  })

  const filteredDb = dbInstructions.filter((i) => {
    if (!q) return true
    const steps = parseSteps(i.steps)
    return (
      i.title.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      steps.some((s) =>
        s.title.toLowerCase().includes(q) ||
        s.codeBlocks.some((c) => c.code.toLowerCase().includes(q))
      )
    )
  })

  const visibleBuiltinCount = BUILTIN_COUNT - hiddenIds.size
  const totalCount = visibleBuiltinCount + dbInstructions.length

  return {
    searchQuery, setSearchQuery,
    isLoading,
    isExtracting,
    extractDialogOpen, setExtractDialogOpen,
    selectedDocId, setSelectedDocId,
    documents,
    filteredTemplates,
    filteredDb,
    totalCount,
    handleExtract,
    handleHideTemplate,
    handleDelete,
  }
}
