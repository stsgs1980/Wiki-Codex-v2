'use client'

import { FileText, FolderOpen, Tags, Star, Upload, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import type { Document, Category, Tag } from '@/lib/types'
import { TerminalFrame } from '@/components/codex/terminal-frame'
import { staggerContainer, staggerItem, countUp, sectionEntrance, cardHover } from '@/lib/motion'
import { useRecentlyViewed } from '@/hooks/use-recently-viewed'
import { RecentlyViewedSection } from '@/components/codex/recently-viewed-section'
import { LatestDocumentsSection } from '@/components/codex/latest-documents-section'

interface DashboardViewProps {
  documents: Document[]
  categories: Category[]
  tags: Tag[]
  totalDocuments: number
  totalStarred: number
}

export function DashboardView({
  documents,
  categories,
  tags,
  totalDocuments,
  totalStarred,
}: DashboardViewProps) {
  const { setView } = useAppStore()
  const { items: recentlyViewed, clearHistory } = useRecentlyViewed()

  // Category breakdown for mini chart
  const categoryBreakdown = categories
    .map((cat) => ({
      ...cat,
      count: documents.filter((d) => d.category?.id === cat.id).length,
    }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const maxCatCount = categoryBreakdown.length > 0 ? categoryBreakdown[0].count : 1

  // File type stats
  const fileTypeStats = documents.reduce((acc, doc) => {
    acc[doc.fileType] = (acc[doc.fileType] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const stats = [
    {
      label: 'Документы',
      value: totalDocuments,
      icon: <FileText className="size-4 text-muted-foreground" />,
    },
    {
      label: 'Категории',
      value: categories.length,
      icon: <FolderOpen className="size-4 text-muted-foreground" />,
    },
    {
      label: 'Теги',
      value: tags.length,
      icon: <Tags className="size-4 text-muted-foreground" />,
    },
    {
      label: 'Избранные',
      value: totalStarred,
      icon: <Star className="size-4 text-muted-foreground" />,
    },
  ]

  return (
    <TerminalFrame title="dashboard" className="m-4 md:m-6">
      <div className="flex flex-col gap-4 p-3 sm:p-4">
        {/* Stats Grid */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-2 sm:gap-3"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={staggerItem}
              {...cardHover}
              className="flex items-center gap-2 sm:gap-3 rounded-md border border-dashed px-3 py-2.5 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center justify-center size-7 sm:size-8 rounded-sm bg-muted shrink-0">
                {stat.icon}
              </div>
              <div className="min-w-0">
                <motion.p
                  variants={countUp}
                  className="text-lg sm:text-xl font-bold text-foreground font-mono leading-tight tabular-nums"
                >
                  {stat.value}
                </motion.p>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-mono">{stat.label.toLowerCase()}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

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
        </motion.div>

        {/* Category Breakdown + File Types */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Category Distribution */}
          {categoryBreakdown.length > 0 && (
            <motion.div
              variants={sectionEntrance}
              initial="initial"
              animate="animate"
              className="rounded-md border border-dashed p-3"
            >
              <div className="flex items-center gap-2 px-1 mb-3">
                <TrendingUp className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-mono text-muted-foreground">categories</span>
                <div className="flex-1 h-px border-t border-dashed" />
              </div>
              <div className="flex flex-col gap-2">
                {categoryBreakdown.map((cat, i) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: 0.3 + i * 0.06, type: 'spring', stiffness: 300, damping: 25 }}
                    className="flex items-center gap-2"
                  >
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs font-sans truncate min-w-0 flex-1">{cat.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${Math.max(24, (cat.count / maxCatCount) * 80)}px`,
                          backgroundColor: cat.color,
                          opacity: 0.6,
                        }}
                      />
                      <span className="text-[10px] font-mono text-muted-foreground tabular-nums w-5 text-right">{cat.count}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* File Types */}
          {Object.keys(fileTypeStats).length > 0 && (
            <motion.div
              variants={sectionEntrance}
              initial="initial"
              animate="animate"
              className="rounded-md border border-dashed p-3"
            >
              <div className="flex items-center gap-2 px-1 mb-3">
                <FileText className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-mono text-muted-foreground">file-types</span>
                <div className="flex-1 h-px border-t border-dashed" />
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(fileTypeStats)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count], i) => (
                    <motion.div
                      key={type}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <Badge variant="secondary" className="font-mono text-xs gap-1.5">
                        <span className="text-terminal-accent">.</span>
                        {type}
                        <span className="text-muted-foreground/80">{count}</span>
                      </Badge>
                    </motion.div>
                  ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Recently Viewed (your history) */}
        <RecentlyViewedSection items={recentlyViewed} onClear={clearHistory} />

        {/* Latest Documents (by updatedAt) */}
        <LatestDocumentsSection documents={documents} />
      </div>
    </TerminalFrame>
  )
}
