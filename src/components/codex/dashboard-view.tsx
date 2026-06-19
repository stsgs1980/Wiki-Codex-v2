'use client'

import { FileText, FolderOpen, Tags, Star, Upload, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { TerminalFrame } from '@/components/codex/terminal-frame'
import { sectionEntrance } from '@/lib/motion'
import { useRecentlyViewed } from '@/hooks/use-recently-viewed'
import { RecentlyViewedSection } from '@/components/codex/recently-viewed-section'
import { LatestDocumentsSection } from '@/components/codex/latest-documents-section'
import { StatsGrid, CategoryBreakdown, FileTypesSection, CleanupDialog, useCleanup } from './dashboard'
import type {
  DashboardViewProps,
  CategoryBreakdownItem,
  StatItem,
} from './dashboard'

export function DashboardView({
  documents,
  categories,
  tags,
  totalDocuments,
  totalStarred,
  onCleanupComplete,
}: DashboardViewProps) {
  const { setView } = useAppStore()
  const { items: recentlyViewed, clearHistory } = useRecentlyViewed()
  const {
    isScanning,
    isCleaning,
    duplicateGroups,
    showCleanupDialog,
    setShowCleanupDialog,
    handleCleanupScan,
    handleCleanupDelete,
  } = useCleanup(onCleanupComplete)

  // ── Derived data ────────────────────────────────────────────────────
  const categoryBreakdown: CategoryBreakdownItem[] = categories
    .map((cat) => ({ ...cat, count: documents.filter((d) => d.category?.id === cat.id).length }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const maxCatCount = categoryBreakdown.length > 0 ? categoryBreakdown[0].count : 1

  const fileTypeStats = documents.reduce((acc, doc) => {
    acc[doc.fileType] = (acc[doc.fileType] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const stats: StatItem[] = [
    { label: 'Документы', value: totalDocuments, icon: <FileText className="size-4 text-muted-foreground" /> },
    { label: 'Категории', value: categories.length, icon: <FolderOpen className="size-4 text-muted-foreground" /> },
    { label: 'Теги', value: tags.length, icon: <Tags className="size-4 text-muted-foreground" /> },
    { label: 'Избранные', value: totalStarred, icon: <Star className="size-4 text-muted-foreground" /> },
  ]

  const totalDuplicates = duplicateGroups.reduce((sum, g) => sum + g.duplicates.length, 0)

  return (
    <TerminalFrame title="dashboard" className="m-3 sm:m-4 md:m-6">
      <h1 className="sr-only">Панель управления</h1>
      <div className="flex flex-col gap-4 p-3 sm:p-4">
        {/* Stats Grid */}
        <StatsGrid stats={stats} />

        {/* Quick Actions */}
        <motion.div
          variants={sectionEntrance}
          initial="initial"
          animate="animate"
          className="flex items-center gap-2 px-1"
        >
          <span className="text-terminal-accent font-mono text-xs select-none shrink-0">$</span>
          <Button variant="outline" size="sm" onClick={() => { useAppStore.getState().resetFilters(); setView('documents') }} className="gap-2 font-mono text-xs h-7">
            <FileText className="size-3.5" />
            Все документы
          </Button>
          <Button variant="outline" size="sm" onClick={() => setView('upload')} className="gap-2 font-mono text-xs h-7">
            <Upload className="size-3.5" />
            Загрузить
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCleanupScan}
            disabled={isScanning || isCleaning}
            className="gap-2 font-mono text-xs h-7"
          >
            <Trash2 className="size-3.5" />
            {isScanning ? 'Сканирование...' : 'Очистить дубли'}
          </Button>
        </motion.div>

        {/* Category Breakdown + File Types */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CategoryBreakdown categoryBreakdown={categoryBreakdown} maxCatCount={maxCatCount} />
          <FileTypesSection fileTypeStats={fileTypeStats} />
        </div>

        {/* Recently Viewed (your history) */}
        <RecentlyViewedSection items={recentlyViewed} onClear={clearHistory} />

        {/* Latest Documents (by updatedAt) */}
        <LatestDocumentsSection documents={documents} />
      </div>

      {/* ── Cleanup Duplicates AlertDialog ──────────────────────────────── */}
      <CleanupDialog
        open={showCleanupDialog}
        onOpenChange={setShowCleanupDialog}
        groups={duplicateGroups}
        totalDuplicates={totalDuplicates}
        isCleaning={isCleaning}
        onDelete={handleCleanupDelete}
      />
    </TerminalFrame>
  )
}
