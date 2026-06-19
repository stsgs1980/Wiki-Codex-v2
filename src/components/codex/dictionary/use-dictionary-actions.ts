'use client'

import { useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { getTermPlural } from './utils'
import {
  extractTermsFromDocuments,
  deleteTermById,
  batchDeleteTerms,
  fetchDuplicateGroups,
  mergeDuplicateGroup,
} from './use-term-mutations'
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
    try {
      const { created, skipped } = await extractTermsFromDocuments(documents, setExtractionProgress)
      if (created > 0) {
        toast({ title: 'Извлечение завершено', description: `Добавлено ${created} ${getTermPlural(created)} в словарь${skipped > 0 ? `, ${skipped} пропущено` : ''}` })
        onTermsExtracted()
      } else {
        toast({ title: 'Нет новых терминов', description: skipped > 0 ? `${skipped} ${getTermPlural(skipped)} уже существуют в словаре` : 'Не удалось извлечь термины из документов' })
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
      const ok = await deleteTermById(deleteTarget.id)
      if (ok) {
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
      const ok = await batchDeleteTerms(Array.from(selectedIds))
      if (ok) {
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
      const result = await fetchDuplicateGroups()
      if (result) {
        setDuplicateGroups(result.duplicates)
        setTotalDuplicates(result.totalDuplicates)
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
      const ok = await mergeDuplicateGroup({ keepId, mergeIds, keptTerm })
      if (ok) {
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
