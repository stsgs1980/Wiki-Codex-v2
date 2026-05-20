'use client'

import { Eye, X, FileText, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { formatRelativeTime } from '@/lib/format'
import type { RecentlyViewedItem } from '@/hooks/use-recently-viewed'
import { staggerContainer, staggerItem, sectionEntrance, listItemHover } from '@/lib/motion'

interface RecentlyViewedSectionProps {
  items: RecentlyViewedItem[]
  onClear: () => void
}

export function RecentlyViewedSection({ items, onClear }: RecentlyViewedSectionProps) {
  const { setView, selectDocument } = useAppStore()

  return (
    <motion.div
      variants={sectionEntrance}
      initial="initial"
      animate="animate"
    >
      <div className="flex items-center gap-2 px-1 mb-2">
        <Eye className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-mono text-muted-foreground">history</span>
        <div className="flex-1 h-px border-t border-dashed" />
        {items.length > 0 && (
          <button
            onClick={onClear}
            className="text-muted-foreground/40 hover:text-muted-foreground transition-colors p-0.5"
            aria-label="Очистить историю"
          >
            <X className="size-3" />
          </button>
        )}
        <span className="text-[10px] font-mono text-muted-foreground/60">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Eye className="size-6 text-muted-foreground/30 mb-2" />
          <p className="font-mono text-xs text-muted-foreground/60">~ no history yet</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="flex flex-col gap-1"
        >
          {items.map((item) => (
            <motion.button
              key={item.id}
              variants={staggerItem}
              {...listItemHover}
              className="flex items-center gap-2 sm:gap-3 rounded-md border border-dashed px-3 py-2 text-left hover:bg-accent/50 transition-colors w-full font-mono group"
              onClick={() => {
                selectDocument(item.id)
                setView('document-view')
              }}
            >
              <span className="text-terminal-accent text-xs shrink-0 select-none">$</span>
              <div className="flex items-center justify-center size-7 rounded-sm bg-muted shrink-0">
                <Eye className="size-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm truncate leading-tight font-sans block">{item.title}</span>
                <span className="text-[10px] text-muted-foreground/60">{formatRelativeTime(item.viewedAt)}</span>
              </div>
              <ArrowRight className="size-3.5 text-muted-foreground shrink-0 hidden sm:block" />
            </motion.button>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
