'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Search,
  Sparkles,
  FileText,
  BookOpen,
  Trash2,
  Loader2,
  Grid,
  List,
  ChevronDown,
  ChevronRight,
  Copy,
  CheckSquare,
  Square,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import type { Term, Document } from '@/lib/types'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { TerminalFrame } from '@/components/codex/terminal-frame'

interface DictionaryViewProps {
  terms: Term[]
  isLoading: boolean
  documents: Document[]
  onTermsExtracted: () => void
}

interface DuplicateGroup {
  original: Term
  duplicates: Term[]
}

function getTermPlural(n: number): string {
  const abs = Math.abs(n) % 100
  const lastDigit = abs % 10
  if (abs > 10 && abs < 20) return 'терминов'
  if (lastDigit > 1 && lastDigit < 5) return 'термина'
  if (lastDigit === 1) return 'термин'
  return 'терминов'
}

function getGroupKey(term: string): string {
  const letter = term.charAt(0).toUpperCase()
  if (/[A-Z]/.test(letter)) return letter
  if (/[А-ЯЁ]/.test(letter)) return letter
  return '#'
}

export function DictionaryView({
  terms,
  isLoading,
  documents,
  onTermsExtracted,
}: DictionaryViewProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionProgress, setExtractionProgress] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Term | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  // Batch delete state
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBatchDeleting, setIsBatchDeleting] = useState(false)
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false)

  // Duplicates state
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

  // Grouped terms by first letter
  const groupedTerms = useMemo(() => {
    const groups: Record<string, Term[]> = {}
    for (const t of filteredTerms) {
      const key = getGroupKey(t.term)
      if (!groups[key]) groups[key] = []
      groups[key].push(t)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredTerms])

  const selectedCount = selectedIds.size
  const hasSelection = selectedCount > 0

  // Toggle a term in selection
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // Select/deselect all visible terms
  const toggleSelectAll = useCallback(() => {
    if (selectedCount === filteredTerms.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredTerms.map((t) => t.id)))
    }
  }, [selectedCount, filteredTerms])

  // Exit selection mode
  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }, [])

  const handleExtractAll = async () => {
    if (documents.length === 0) {
      toast({
        title: 'Нет документов',
        description: 'Сначала загрузите документы для извлечения терминов',
        variant: 'destructive',
      })
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
        } catch {
          // Continue with next document even if one fails
        }
      }

      if (totalCreated > 0) {
        toast({
          title: 'Извлечение завершено',
          description: `Добавлено ${totalCreated} ${getTermPlural(totalCreated)} в словарь${totalSkipped > 0 ? `, ${totalSkipped} пропущено` : ''}`,
        })
        onTermsExtracted()
      } else {
        toast({
          title: 'Нет новых терминов',
          description: totalSkipped > 0
            ? `${totalSkipped} ${getTermPlural(totalSkipped)} уже существуют в словаре`
            : 'Не удалось извлечь термины из документов',
        })
      }
    } catch {
      toast({
        title: 'Ошибка',
        description: 'Не удалось завершить извлечение терминов',
        variant: 'destructive',
      })
    } finally {
      setIsExtracting(false)
      setExtractionProgress('')
    }
  }

  const handleDeleteTerm = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/terms?id=${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast({
          title: 'Термин удален',
          description: `"${deleteTarget.term}" удален из словаря`,
        })
        onTermsExtracted()
      }
    } catch {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить термин',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  // Batch delete
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    setIsBatchDeleting(true)
    try {
      const ids = Array.from(selectedIds).join(',')
      const res = await fetch(`/api/terms?ids=${ids}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast({
          title: 'Удалено',
          description: `${selectedCount} ${getTermPlural(selectedCount)} удалено из словаря`,
        })
        onTermsExtracted()
        exitSelectionMode()
      }
    } catch {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить выбранные термины',
        variant: 'destructive',
      })
    } finally {
      setIsBatchDeleting(false)
      setShowBatchDeleteDialog(false)
    }
  }

  // Find duplicates
  const handleFindDuplicates = async () => {
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
      toast({
        title: 'Ошибка',
        description: 'Не удалось выполнить поиск дубликатов',
        variant: 'destructive',
      })
    } finally {
      setIsFetchingDuplicates(false)
    }
  }

  // Merge duplicates in a group
  const handleMergeGroup = async (group: DuplicateGroup) => {
    const keepId = mergeKeepOverrides[group.original.id] || group.original.id
    const mergeIds = [group.original, ...group.duplicates]
      .filter((t) => t.id !== keepId)
      .map((t) => t.id)

    if (mergeIds.length === 0) return

    const keptTerm = [group.original, ...group.duplicates].find((t) => t.id === keepId) || group.original

    setIsMerging(group.original.id)
    try {
      const res = await fetch('/api/terms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keepId,
          mergeIds,
          mergeTranslations: {
            translation: keptTerm.translation,
            explanation: keptTerm.explanation,
          },
        }),
      })
      if (res.ok) {
        toast({
          title: 'Объединено',
          description: `"${keptTerm.term}" -- ${mergeIds.length} ${getTermPlural(mergeIds.length)} объединено`,
        })
        // Remove this group from the dialog
        setDuplicateGroups((prev) => prev.filter((g) => g.original.id !== group.original.id))
        setTotalDuplicates((prev) => Math.max(0, prev - mergeIds.length))
        onTermsExtracted()
      }
    } catch {
      toast({
        title: 'Ошибка',
        description: 'Не удалось объединить дубликаты',
        variant: 'destructive',
      })
    } finally {
      setIsMerging(null)
    }
  }

  return (
    <TerminalFrame title="dictionary" className="m-3 sm:m-4 md:m-6" headerRight={
      <div className="flex items-center gap-1">
        {!isLoading && terms.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => selectionMode ? exitSelectionMode() : setSelectionMode(true)}
          >
            {selectionMode ? <CheckSquare className="size-3" /> : <Square className="size-3" />}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 text-xs hidden sm:flex"
          onClick={handleExtractAll}
          disabled={isExtracting || documents.length === 0}
        >
          {isExtracting ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
          extract
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 text-xs sm:hidden"
          onClick={handleExtractAll}
          disabled={isExtracting || documents.length === 0}
        >
          {isExtracting ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
        </Button>
        {!isLoading && terms.length > 0 && (
          <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
            {terms.length}
          </Badge>
        )}
      </div>
    }>
      <div className="p-3 sm:p-4 max-w-5xl mx-auto w-full">
      {/* Extraction progress */}
      {isExtracting && extractionProgress && (
        <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground font-mono px-1">
          <Loader2 className="size-3 animate-spin" />
          <span className="truncate">{extractionProgress}</span>
        </div>
      )}

      {/* Select all bar (visible in selection mode) */}
      {selectionMode && !isLoading && filteredTerms.length > 0 && (
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 px-1">
          <Checkbox
            checked={selectedCount === filteredTerms.length && filteredTerms.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-xs sm:text-sm text-muted-foreground">
            {selectedCount === filteredTerms.length
              ? `Все (${filteredTerms.length})`
              : `${selectedCount} из ${filteredTerms.length}`}
          </span>
        </div>
      )}

      {/* Toolbar: Search + View toggle */}
      {!isLoading && terms.length > 0 && (
        <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 sm:size-4 text-muted-foreground" />
            <Input
              placeholder="Поиск терминов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Letter nav - scrollable on mobile, hidden when searching */}
            {!searchQuery.trim() && (
              <div className="hidden md:flex gap-1">
                {groupedTerms.map(([letter]) => (
                  <button
                    key={letter}
                    className="w-7 h-7 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-center"
                    onClick={() => {
                      const el = document.getElementById(`group-${letter}`)
                      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            )}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="size-7 sm:size-8 rounded-r-none"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="size-3.5 sm:size-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="size-7 sm:size-8 rounded-l-none"
                onClick={() => setViewMode('list')}
              >
                <List className="size-3.5 sm:size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-3 sm:p-5 space-y-2 sm:space-y-3">
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-5 sm:h-6 w-28 sm:w-40" />
                  <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
                </div>
                <Skeleton className="h-3 sm:h-4 w-full" />
                <Skeleton className="h-2.5 sm:h-3 w-16 sm:w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state: no terms at all */}
      {!isLoading && terms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center px-4">
          <BookOpen className="size-10 sm:h-12 sm:w-12 text-muted-foreground/40 mb-3 sm:mb-4" />
          <p className="text-sm text-muted-foreground leading-relaxed">Список терминов пуст</p>
          <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
            Загрузите документы -- термины будут извлечены автоматически
          </p>
          {documents.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 gap-2"
              onClick={handleExtractAll}
              disabled={isExtracting}
            >
              <Sparkles className="size-4" />
              {isExtracting ? 'Извлечение...' : 'Извлечь из документов'}
            </Button>
          )}
        </div>
      )}

      {/* Empty state: search has no matches */}
      {!isLoading && terms.length > 0 && filteredTerms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center px-4">
          <Search className="size-10 sm:h-12 sm:w-12 text-muted-foreground/40 mb-3 sm:mb-4" />
          <p className="text-sm text-muted-foreground leading-relaxed">Ничего не найдено</p>
          <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
            Попробуйте изменить запрос
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setSearchQuery('')}
          >
            Сбросить
          </Button>
        </div>
      )}

      {/* Terms with grouping */}
      {!isLoading && filteredTerms.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {groupedTerms.map(([letter, group]) => (
              <div key={letter} id={`group-${letter}`} className="mb-4 sm:mb-6 scroll-mt-4">
                {/* Group header */}
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <span className="text-xs font-mono font-bold text-green-600 dark:text-green-400 min-w-5 sm:min-w-7 leading-tight select-none">
                    [{letter}]
                  </span>
                  <Separator className="flex-1" />
                  <span className="text-[10px] sm:text-xs font-mono text-muted-foreground/60">
                    {group.length}
                  </span>
                </div>

                {/* Grid mode */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {group.map((t) => (
                      <TermCardGrid
                        key={t.id}
                        term={t}
                        onDelete={() => setDeleteTarget(t)}
                        selectionMode={selectionMode}
                        selected={selectedIds.has(t.id)}
                        onToggleSelection={() => toggleSelection(t.id)}
                      />
                    ))}
                  </div>
                )}

                {/* List mode */}
                {viewMode === 'list' && (
                  <div className="flex flex-col gap-1 sm:gap-1.5">
                    {group.map((t) => (
                      <TermCardList
                        key={t.id}
                        term={t}
                        onDelete={() => setDeleteTarget(t)}
                        selectionMode={selectionMode}
                        selected={selectedIds.has(t.id)}
                        onToggleSelection={() => toggleSelection(t.id)}
                      />
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
        {selectionMode && hasSelection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 sm:bottom-6 left-2 right-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-2 sm:gap-3 rounded-xl border bg-background/95 backdrop-blur-sm shadow-lg px-3 sm:px-5 py-2.5 sm:py-3">
              <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                {selectedCount}
              </span>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5 sm:gap-2 text-xs sm:text-sm"
                onClick={() => setShowBatchDeleteDialog(true)}
              >
                <Trash2 className="size-3.5 sm:size-4" />
                <span className="hidden sm:inline">Удалить</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm"
                onClick={exitSelectionMode}
              >
                Отмена
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete single term confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удаление термина</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить термин &quot;{deleteTarget?.term}&quot;? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTerm}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1" />
                  Удаление...
                </>
              ) : (
                'Удалить'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch delete confirmation dialog */}
      <AlertDialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удаление терминов</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить {selectedCount} {getTermPlural(selectedCount)}? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBatchDeleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              disabled={isBatchDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isBatchDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1" />
                  Удаление...
                </>
              ) : (
                'Удалить'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicates dialog */}
      <Dialog open={showDuplicatesDialog} onOpenChange={(open) => {
        setShowDuplicatesDialog(open)
        if (!open) setMergeKeepOverrides({})
      }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Найденные дубликаты</DialogTitle>
            <DialogDescription>
              {duplicateGroups.length === 0
                ? 'Дубликаты не найдены'
                : `${duplicateGroups.length} ${duplicateGroups.length === 1 ? 'группа' : getTermPlural(duplicateGroups.length).replace('термин', 'групп').replace('термина', 'группы').replace('терминов', 'групп')} дубликатов (${totalDuplicates} ${getTermPlural(totalDuplicates)})`
              }
            </DialogDescription>
          </DialogHeader>

          {duplicateGroups.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <CheckSquare className="size-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Все термины уникальны</p>
            </div>
          )}

          {duplicateGroups.length > 0 && (
            <div className="space-y-4 mt-2">
              {duplicateGroups.map((group) => {
                const keepId = mergeKeepOverrides[group.original.id] || group.original.id
                const allTerms = [group.original, ...group.duplicates]
                return (
                  <div key={group.original.id} className="border rounded-lg p-3 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm truncate">
                        {group.original.term}
                      </span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {group.duplicates.length + 1} {getTermPlural(group.duplicates.length + 1)}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {allTerms.map((t) => (
                        <label
                          key={t.id}
                          className={cn(
                            'flex items-center gap-2 sm:gap-3 rounded-md border px-2.5 sm:px-3 py-2 cursor-pointer transition-colors',
                            t.id === keepId
                              ? 'border-primary/50 bg-primary/5'
                              : 'border-transparent bg-muted/50 hover:bg-muted'
                          )}
                        >
                          <input
                            type="radio"
                            name={`keep-${group.original.id}`}
                            checked={t.id === keepId}
                            onChange={() =>
                              setMergeKeepOverrides((prev) => ({
                                ...prev,
                                [group.original.id]: t.id,
                              }))
                            }
                            className="accent-primary shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs sm:text-sm font-semibold truncate leading-tight">
                              {t.term}
                              {t.id === group.original.id && (
                                <span className="text-[10px] sm:text-xs text-muted-foreground ml-1.5">(основной)</span>
                              )}
                            </div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                              {t.translation}
                            </div>
                          </div>
                          {t.document && (
                            <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                              <FileText className="size-3" />
                              <span className="truncate max-w-24">{t.document.title}</span>
                            </div>
                          )}
                        </label>
                      ))}
                    </div>

                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Выберите термин, который нужно сохранить. Остальные будут удалены и объединены с выбранным.
                    </p>

                    <Button
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => handleMergeGroup(group)}
                      disabled={isMerging === group.original.id}
                    >
                      {isMerging === group.original.id ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Объединение...
                        </>
                      ) : (
                        <>
                          <Copy className="size-4" />
                          Объединить все
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDuplicatesDialog(false)
                setMergeKeepOverrides({})
              }}
            >
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </TerminalFrame>
  )
}

/* ---- Grid card ---- */
function TermCardGrid({
  term: t,
  onDelete,
  selectionMode,
  selected,
  onToggleSelection,
}: {
  term: Term
  onDelete: () => void
  selectionMode: boolean
  selected: boolean
  onToggleSelection: () => void
}) {
  return (
    <Card className={cn(
      'overflow-hidden group hover:shadow-md transition-all border-dashed',
      selected && 'ring-2 ring-primary border-solid'
    )}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 mb-1 sm:mb-1.5">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {selectionMode && (
              <Checkbox
                checked={selected}
                onCheckedChange={onToggleSelection}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <span className="font-mono font-semibold text-sm sm:text-base truncate">{t.term}</span>
          </div>
          {!selectionMode && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
              onClick={onDelete}
              title="Удалить термин"
            >
              <Trash2 className="size-3" />
            </Button>
          )}
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2 leading-relaxed">{t.translation}</p>
        <p className="text-[10px] sm:text-xs text-muted-foreground/70 line-clamp-2 sm:line-clamp-3">{t.explanation}</p>
        {t.document && (
          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2">
            <FileText className="size-2.5 sm:size-3" />
            <span className="truncate">{t.document.title}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ---- List row ---- */
function TermCardList({
  term: t,
  onDelete,
  selectionMode,
  selected,
  onToggleSelection,
}: {
  term: Term
  onDelete: () => void
  selectionMode: boolean
  selected: boolean
  onToggleSelection: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="group">
      <div
        className={cn(
          'flex items-center gap-2 sm:gap-3 rounded-md border border-dashed px-3 py-2 sm:px-4 sm:py-2.5 hover:bg-accent/50 transition-colors cursor-pointer font-mono',
          selected && 'ring-2 ring-primary bg-primary/5 border-solid'
        )}
        onClick={() => {
          if (selectionMode) {
            onToggleSelection()
          } else {
            setExpanded(!expanded)
          }
        }}
      >
        {/* Checkbox in selection mode */}
        {selectionMode && (
          <Checkbox
            checked={selected}
            onCheckedChange={onToggleSelection}
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {/* Expand icon */}
        {!selectionMode && (
          expanded
            ? <ChevronDown className="size-3 text-muted-foreground shrink-0" />
            : <ChevronRight className="size-3 text-green-600 dark:text-green-400 shrink-0" />
        )}

        {/* Term name */}
        <span className="font-semibold text-xs sm:text-sm min-w-0 shrink-0 text-foreground">{t.term}</span>

        <span className="text-muted-foreground/50 text-xs hidden sm:inline">=</span>

        {/* Translation */}
        <span className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:inline">
          {t.translation}
        </span>

        {/* Source doc - desktop only */}
        {t.document && (
          <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground shrink-0 ml-auto">
            <FileText className="size-3" />
            <span className="truncate max-w-32">{t.document.title}</span>
          </div>
        )}

        {/* Date - desktop only */}
        <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0 hidden sm:inline">
          {format(new Date(t.createdAt), 'd MMM yyyy', { locale: ru })}
        </span>

        {/* Delete - desktop only (hover) */}
        {!selectionMode && (
          <Button
            variant="ghost"
            size="icon"
            className="size-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 hidden sm:flex"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            title="Удалить термин"
          >
            <Trash2 className="size-3" />
          </Button>
        )}
      </div>

      {/* Expanded details */}
      {!selectionMode && expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 sm:px-10 py-2.5 sm:py-3"
        >
          <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2 break-words leading-relaxed">{t.explanation}</p>
          {t.usage && (
            <div className="bg-muted font-mono text-[10px] sm:text-xs p-2.5 sm:p-3 rounded-md whitespace-pre-wrap break-words">
              {t.usage}
            </div>
          )}
          {/* Delete button for mobile (shown in expanded state) */}
          <Button
            variant="outline"
            size="sm"
            className="mt-2 gap-1.5 text-xs text-destructive hover:text-destructive sm:hidden"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
          >
            <Trash2 className="size-3" />
            Удалить
          </Button>
        </motion.div>
      )}
    </div>
  )
}
