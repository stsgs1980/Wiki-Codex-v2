'use client'

import { useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { getTermPlural } from './utils'
import type { DictionaryViewProps, DuplicateGroup, Term } from './types'

interface UseDictionaryActionsParams {
  documents: DictionaryViewProps['documents']
  onTermsExtracted: () => void
  deleteTarget: Term | null
  selectedIds: Set<string>
  selectedCount: number
  mergeKeepOverrides: Record<string, string>
  setIsExtracting: (v: boolean) => void
  setExtractionProgress: (v: string) => void
  setIsDeleting: (v: boolean) => void
  setDeleteTarget: (v: Term | null) => void
  setIsBatchDeleting: (v: boolean) => void
  setShowBatchDeleteDialog: (v: boolean) => void
  exitSelectionMode: () => void
  setIsFetchingDuplicates: (v: boolean) => void
  setDuplicateGroups: (v: DuplicateGroup[] | ((prev: DuplicateGroup[]) => DuplicateGroup[])) => void
  setTotalDuplicates: (v: number | ((prev: number) => number)) => void
  setShowDuplicatesDialog: (v: boolean) => void
  setIsMerging: (v: string | null) => void
}

export function useDictionaryActions(params: UseDictionaryActionsParams) {
  const { toast } = useToast()
  const {
    documents, onTermsExtracted,
    deleteTarget, selectedIds, selectedCount, mergeKeepOverrides,
    setIsExtracting, setExtractionProgress,
    setIsDeleting, setDeleteTarget,
    setIsBatchDeleting, setShowBatchDeleteDialog, exitSelectionMode,
    setIsFetchingDuplicates, setDuplicateGroups, setTotalDuplicates,
    setShowDuplicatesDialog, setIsMerging,
  } = params

  const handleExtractAll = useCallback(async () => {
    if (documents.length === 0) {
      toast({ title: 'Нет документов', description: 'Сначала загрузите документы для извлечения терминов', variant: 'destructive' })
      return
    }
    setIsExtracting(true)
    let totalCreated = 0
    let totalSkipped = 0
    const processedIds = new Set<string>()
    try {
      for (const doc of documents) {
        if (!doc.content || doc.content.trim().length < 50) continue
        if (processedIds.has(doc.id)) continue
        processedIds.add(doc.id)
        setExtractionProgress(`Обработка: ${doc.title}`)
        try {
          const res = await fetch('/api/terms/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: doc.content, documentId: doc.id }),
          })
          if (res.ok) {
            const data = await res.json()
            totalCreated += data.created || 0
            totalSkipped += data.skipped || 0
          }
        } catch { /* continue */ }
      }
      if (totalCreated > 0) {
        toast({ title: 'Извлечение завершено', description: `Добавлено ${totalCreated} ${getTermPlural(totalCreated)} в словарь${totalSkipped > 0 ? `, ${totalSkipped} пропущено` : ''}` })
        onTermsExtracted()
      } else {
        toast({ title: 'Нет новых терминов', description: totalSkipped > 0 ? `${totalSkipped} ${getTermPlural(totalSkipped)} уже существуют в словаре` : 'Не удалось извлечь термины из документов' })
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось завершить извлечение терминов', variant: 'destructive' })
    } finally {
      setIsExtracting(false)
      setExtractionProgress('')
    }
  }, [documents, toast, onTermsExtracted, setIsExtracting, setExtractionProgress])

  const handleDeleteTerm = useCallback(async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/terms?id=${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Термин удален', description: `"${deleteTarget.term}" удален из словаря` })
        onTermsExtracted()
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить термин', variant: 'destructive' })
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }, [deleteTarget, toast, onTermsExtracted, setIsDeleting, setDeleteTarget])

  const handleBatchDelete = useCallback(async () => {
    if (selectedIds.size === 0) return
    setIsBatchDeleting(true)
    try {
      const ids = Array.from(selectedIds).join(',')
      const res = await fetch(`/api/terms?ids=${ids}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Удалено', description: `${selectedCount} ${getTermPlural(selectedCount)} удалено из словаря` })
        onTermsExtracted()
        exitSelectionMode()
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить выбранные термины', variant: 'destructive' })
    } finally {
      setIsBatchDeleting(false)
      setShowBatchDeleteDialog(false)
    }
  }, [selectedIds, selectedCount, toast, onTermsExtracted, exitSelectionMode, setIsBatchDeleting, setShowBatchDeleteDialog])

  const handleFindDuplicates = useCallback(async () => {
    setIsFetchingDuplicates(true)
    try {
      const res = await fetch('/api/terms?duplicates=true')
      if (res.ok) {
        const data = await res.json()
        setDuplicateGroups(data.duplicates || [])
        setTotalDuplicates(data.totalDuplicates || 0)
        setShowDuplicatesDialog(true)
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось выполнить поиск дубликатов', variant: 'destructive' })
    } finally {
      setIsFetchingDuplicates(false)
    }
  }, [toast, setIsFetchingDuplicates, setDuplicateGroups, setTotalDuplicates, setShowDuplicatesDialog])

  const handleMergeGroup = useCallback(async (group: DuplicateGroup) => {
    const keepId = mergeKeepOverrides[group.original.id] || group.original.id
    const mergeIds = [group.original, ...group.duplicates].filter((t) => t.id !== keepId).map((t) => t.id)
    if (mergeIds.length === 0) return
    const keptTerm = [group.original, ...group.duplicates].find((t) => t.id === keepId) || group.original
    setIsMerging(group.original.id)
    try {
      const res = await fetch('/api/terms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keepId, mergeIds, mergeTranslations: { translation: keptTerm.translation, explanation: keptTerm.explanation } }),
      })
      if (res.ok) {
        toast({ title: 'Объединено', description: `"${keptTerm.term}" -- ${mergeIds.length} ${getTermPlural(mergeIds.length)} объединено` })
        setDuplicateGroups((prev) => prev.filter((g) => g.original.id !== group.original.id))
        setTotalDuplicates((prev) => Math.max(0, prev - mergeIds.length))
        onTermsExtracted()
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось объединить дубликаты', variant: 'destructive' })
    } finally {
      setIsMerging(null)
    }
  }, [mergeKeepOverrides, toast, onTermsExtracted, setIsMerging, setDuplicateGroups, setTotalDuplicates])

  return { handleExtractAll, handleDeleteTerm, handleBatchDelete, handleFindDuplicates, handleMergeGroup }
}
