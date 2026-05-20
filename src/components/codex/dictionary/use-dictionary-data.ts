'use client'

import { useDictionaryState } from './use-dictionary-state'
import { useDictionaryActions } from './use-dictionary-actions'
import type { DictionaryViewProps } from './types'

export function useDictionaryData({
  terms,
  documents,
  onTermsExtracted,
}: Pick<DictionaryViewProps, 'terms' | 'documents' | 'onTermsExtracted'>) {
  const state = useDictionaryState({ terms })

  const actions = useDictionaryActions({
    documents,
    onTermsExtracted,
    deleteTarget: state.deleteTarget,
    selectedIds: state.selectedIds,
    selectedCount: state.selectedCount,
    mergeKeepOverrides: state.mergeKeepOverrides,
    setIsExtracting: state.setIsExtracting,
    setExtractionProgress: state.setExtractionProgress,
    setIsDeleting: state.setIsDeleting,
    setDeleteTarget: state.setDeleteTarget,
    setIsBatchDeleting: state.setIsBatchDeleting,
    setShowBatchDeleteDialog: state.setShowBatchDeleteDialog,
    exitSelectionMode: state.exitSelectionMode,
    setIsFetchingDuplicates: state.setIsFetchingDuplicates,
    setDuplicateGroups: state.setDuplicateGroups,
    setTotalDuplicates: state.setTotalDuplicates,
    setShowDuplicatesDialog: state.setShowDuplicatesDialog,
    setIsMerging: state.setIsMerging,
  })

  return {
    // Search & view
    searchQuery: state.searchQuery, setSearchQuery: state.setSearchQuery,
    viewMode: state.viewMode, setViewMode: state.setViewMode,
    // Extraction
    isExtracting: state.isExtracting, extractionProgress: state.extractionProgress,
    handleExtractAll: actions.handleExtractAll,
    // Single delete
    deleteTarget: state.deleteTarget, setDeleteTarget: state.setDeleteTarget,
    isDeleting: state.isDeleting, handleDeleteTerm: actions.handleDeleteTerm,
    // Batch delete
    selectionMode: state.selectionMode, setSelectionMode: state.setSelectionMode,
    selectedIds: state.selectedIds, selectedCount: state.selectedCount,
    hasSelection: state.hasSelection,
    isBatchDeleting: state.isBatchDeleting,
    showBatchDeleteDialog: state.showBatchDeleteDialog, setShowBatchDeleteDialog: state.setShowBatchDeleteDialog,
    toggleSelection: state.toggleSelection, toggleSelectAll: state.toggleSelectAll,
    exitSelectionMode: state.exitSelectionMode, handleBatchDelete: actions.handleBatchDelete,
    // Duplicates
    duplicateGroups: state.duplicateGroups, totalDuplicates: state.totalDuplicates,
    showDuplicatesDialog: state.showDuplicatesDialog, setShowDuplicatesDialog: state.setShowDuplicatesDialog,
    isFetchingDuplicates: state.isFetchingDuplicates, handleFindDuplicates: actions.handleFindDuplicates,
    isMerging: state.isMerging, mergeKeepOverrides: state.mergeKeepOverrides,
    handleMergeKeepOverride: state.handleMergeKeepOverride, handleMergeGroup: actions.handleMergeGroup,
    handleCloseDuplicates: state.handleCloseDuplicates,
    // Derived data
    filteredTerms: state.filteredTerms, groupedTerms: state.groupedTerms,
  }
}
