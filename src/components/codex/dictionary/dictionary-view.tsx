'use client'

import {
  Sparkles,
  Trash2,
  Loader2,
  CheckSquare,
  Square,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { TerminalFrame } from '@/components/codex/terminal-frame'
import { TermCardGrid } from './term-card-grid'
import { TermCardList } from './term-card-list'
import { DuplicatesDialog } from './duplicates-dialog'
import { DeleteDialogs } from './delete-dialogs'
import { DictionaryToolbar } from './dictionary-toolbar'
import { DictionaryEmptyStates } from './dictionary-empty-states'
import { useDictionaryData } from './use-dictionary-data'
import { motion, AnimatePresence } from 'framer-motion'
import type { DictionaryViewProps } from './types'

export function DictionaryView({
  terms,
  isLoading,
  documents,
  onTermsExtracted,
}: DictionaryViewProps) {
  const d = useDictionaryData({ terms, documents, onTermsExtracted })

  return (
    <TerminalFrame title="dictionary" className="m-3 sm:m-4 md:m-6" headerRight={
      <div className="flex items-center gap-1">
        {!isLoading && terms.length > 0 && (
          <Button variant="ghost" size="icon" className="size-6"
            onClick={() => d.selectionMode ? d.exitSelectionMode() : d.setSelectionMode(true)}>
            {d.selectionMode ? <CheckSquare className="size-3" /> : <Square className="size-3" />}
          </Button>
        )}
        <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs hidden sm:flex"
          onClick={d.handleExtractAll} disabled={d.isExtracting || documents.length === 0}>
          {d.isExtracting ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
          extract
        </Button>
        <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs sm:hidden"
          onClick={d.handleExtractAll} disabled={d.isExtracting || documents.length === 0}>
          {d.isExtracting ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
        </Button>
        {!isLoading && terms.length > 0 && (
          <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">{terms.length}</Badge>
        )}
      </div>
    }>
      <div className="p-3 sm:p-4 max-w-5xl mx-auto w-full">
      {/* Extraction progress */}
      {d.isExtracting && d.extractionProgress && (
        <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground font-mono px-1">
          <Loader2 className="size-3 animate-spin" />
          <span className="truncate">{d.extractionProgress}</span>
        </div>
      )}

      {/* Select all bar */}
      {d.selectionMode && !isLoading && d.filteredTerms.length > 0 && (
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 px-1">
          <Checkbox checked={d.selectedCount === d.filteredTerms.length && d.filteredTerms.length > 0} onCheckedChange={d.toggleSelectAll} />
          <span className="text-xs sm:text-sm text-muted-foreground">
            {d.selectedCount === d.filteredTerms.length ? `Все (${d.filteredTerms.length})` : `${d.selectedCount} из ${d.filteredTerms.length}`}
          </span>
        </div>
      )}

      {/* Toolbar */}
      {!isLoading && terms.length > 0 && (
        <DictionaryToolbar
          searchQuery={d.searchQuery} onSearchChange={d.setSearchQuery}
          viewMode={d.viewMode} onViewModeChange={d.setViewMode}
          groupedTerms={d.groupedTerms}
        />
      )}

      {/* Empty / Loading states */}
      <DictionaryEmptyStates
        isLoading={isLoading} termsCount={terms.length}
        filteredTermsCount={d.filteredTerms.length} documentsCount={documents.length}
        isExtracting={d.isExtracting} onExtractAll={d.handleExtractAll}
        onResetSearch={() => d.setSearchQuery('')}
      />

      {/* Terms with grouping */}
      {!isLoading && d.filteredTerms.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div key={d.viewMode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {d.groupedTerms.map(([letter, group]) => (
              <div key={letter} id={`group-${letter}`} className="mb-4 sm:mb-6 scroll-mt-4">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <span className="text-xs font-mono font-bold text-green-600 dark:text-green-400 min-w-5 sm:min-w-7 leading-tight select-none">[{letter}]</span>
                  <Separator className="flex-1" />
                  <span className="text-[10px] sm:text-xs font-mono text-muted-foreground/60">{group.length}</span>
                </div>
                {d.viewMode === 'grid' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {group.map((t) => (
                      <TermCardGrid key={t.id} term={t} onDelete={() => d.setDeleteTarget(t)}
                        selectionMode={d.selectionMode} selected={d.selectedIds.has(t.id)}
                        onToggleSelection={() => d.toggleSelection(t.id)} />
                    ))}
                  </div>
                )}
                {d.viewMode === 'list' && (
                  <div className="flex flex-col gap-1 sm:gap-1.5">
                    {group.map((t) => (
                      <TermCardList key={t.id} term={t} onDelete={() => d.setDeleteTarget(t)}
                        selectionMode={d.selectionMode} selected={d.selectedIds.has(t.id)}
                        onToggleSelection={() => d.toggleSelection(t.id)} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Floating batch action bar */}
      <AnimatePresence>
        {d.selectionMode && d.hasSelection && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 sm:bottom-6 left-2 right-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50">
            <div className="flex items-center gap-2 sm:gap-3 rounded-xl border bg-background/95 backdrop-blur-sm shadow-lg px-3 sm:px-5 py-2.5 sm:py-3">
              <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{d.selectedCount}</span>
              <Button variant="destructive" size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-sm" onClick={() => d.setShowBatchDeleteDialog(true)}>
                <Trash2 className="size-3.5 sm:size-4" /><span className="hidden sm:inline">Удалить</span>
              </Button>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={d.exitSelectionMode}>Отмена</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete dialogs */}
      <DeleteDialogs
        deleteTarget={d.deleteTarget} setDeleteTarget={d.setDeleteTarget}
        isDeleting={d.isDeleting} handleDeleteTerm={d.handleDeleteTerm}
        showBatchDeleteDialog={d.showBatchDeleteDialog} setShowBatchDeleteDialog={d.setShowBatchDeleteDialog}
        isBatchDeleting={d.isBatchDeleting} selectedCount={d.selectedCount}
        handleBatchDelete={d.handleBatchDelete}
      />

      {/* Duplicates dialog */}
      <DuplicatesDialog
        open={d.showDuplicatesDialog} onOpenChange={d.setShowDuplicatesDialog}
        duplicateGroups={d.duplicateGroups} totalDuplicates={d.totalDuplicates}
        isMerging={d.isMerging} mergeKeepOverrides={d.mergeKeepOverrides}
        onMergeKeepOverride={d.handleMergeKeepOverride} onMergeGroup={d.handleMergeGroup}
        onClose={d.handleCloseDuplicates}
      />
      </div>
    </TerminalFrame>
  )
}
