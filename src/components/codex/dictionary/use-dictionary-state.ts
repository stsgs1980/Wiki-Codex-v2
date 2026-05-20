'use client'

import { useState, useMemo, useCallback } from 'react'
import { getGroupKey } from './utils'
import type { DictionaryViewProps, DuplicateGroup } from './types'

export function useDictionaryState({
  terms,
}: Pick<DictionaryViewProps, 'terms'>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionProgress, setExtractionProgress] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<DictionaryViewProps['terms'][0] | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBatchDeleting, setIsBatchDeleting] = useState(false)
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false)

  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
  const [totalDuplicates, setTotalDuplicates] = useState(0)
  const [showDuplicatesDialog, setShowDuplicatesDialog] = useState(false)
  const [isFetchingDuplicates, setIsFetchingDuplicates] = useState(false)
  const [isMerging, setIsMerging] = useState<string | null>(null)
  const [mergeKeepOverrides, setMergeKeepOverrides] = useState<Record<string, string>>({})

  const filteredTerms = searchQuery.trim()
    ? terms.filter((t) => {
        const q = searchQuery.toLowerCase()
        return (
          t.term.toLowerCase().includes(q) ||
          t.translation.toLowerCase().includes(q) ||
          t.explanation.toLowerCase().includes(q)
        )
      })
    : terms

  const groupedTerms = useMemo(() => {
    const groups: Record<string, DictionaryViewProps['terms']> = {}
    for (const t of filteredTerms) {
      const key = getGroupKey(t.term)
      if (!groups[key]) groups[key] = []
      groups[key].push(t)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredTerms])

  const selectedCount = selectedIds.size
  const hasSelection = selectedCount > 0

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedCount === filteredTerms.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredTerms.map((t) => t.id)))
    }
  }, [selectedCount, filteredTerms])

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }, [])

  const handleMergeKeepOverride = useCallback((groupId: string, keepId: string) => {
    if (groupId === '__clear__') {
      setMergeKeepOverrides({})
      return
    }
    setMergeKeepOverrides((prev) => ({ ...prev, [groupId]: keepId }))
  }, [])

  const handleCloseDuplicates = useCallback(() => {
    setShowDuplicatesDialog(false)
    setMergeKeepOverrides({})
  }, [])

  return {
    searchQuery, setSearchQuery, viewMode, setViewMode,
    isExtracting, setIsExtracting, extractionProgress, setExtractionProgress,
    deleteTarget, setDeleteTarget, isDeleting, setIsDeleting,
    selectionMode, setSelectionMode, selectedIds, setSelectedIds,
    isBatchDeleting, setIsBatchDeleting, showBatchDeleteDialog, setShowBatchDeleteDialog,
    duplicateGroups, setDuplicateGroups, totalDuplicates, setTotalDuplicates,
    showDuplicatesDialog, setShowDuplicatesDialog,
    isFetchingDuplicates, setIsFetchingDuplicates,
    isMerging, setIsMerging, mergeKeepOverrides, setMergeKeepOverrides,
    filteredTerms, groupedTerms, selectedCount, hasSelection,
    toggleSelection, toggleSelectAll, exitSelectionMode,
    handleMergeKeepOverride, handleCloseDuplicates,
  }
}
