'use client'

import { TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { sectionEntrance } from '@/lib/motion'
import type { CategoryBreakdownItem } from './types'

interface CategoryBreakdownProps {
  categoryBreakdown: CategoryBreakdownItem[]
  maxCatCount: number
}

/**
 * CategoryBreakdown — top-6 categories with horizontal bar chart.
 * Only renders when there is at least one category with documents.
 */
export function CategoryBreakdown({ categoryBreakdown, maxCatCount }: CategoryBreakdownProps) {
  if (categoryBreakdown.length === 0) return null

  return (
    <motion.div
      variants={sectionEntrance}
      initial="initial"
      animate="animate"
      className="rounded-md border border-dashed p-3"
    >
      <div className="flex items-center gap-2 px-1 mb-2">
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
              className="size-2 rounded-full shrink-0 tag-color-bg"
              style={{ '--tag-color': cat.color } as React.CSSProperties}
            />
            <span className="text-xs font-sans truncate min-w-0 flex-1">{cat.name}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <div
                className="h-1.5 rounded-full tag-color-bg"
                style={{
                  '--tag-color': cat.color,
                  width: `${Math.max(24, (cat.count / maxCatCount) * 80)}px`,
                  opacity: 0.6,
                } as React.CSSProperties}
              />
              <span className="text-3xs font-mono text-muted-foreground tabular-nums w-5 text-right">{cat.count}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
