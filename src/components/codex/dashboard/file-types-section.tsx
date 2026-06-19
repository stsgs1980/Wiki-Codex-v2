'use client'

import { FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { sectionEntrance } from '@/lib/motion'

interface FileTypesSectionProps {
  fileTypeStats: Record<string, number>
}

/**
 * FileTypesSection — badges row summarising how many documents exist per file extension.
 * Sorted by count (desc). Only renders when at least one file type exists.
 */
export function FileTypesSection({ fileTypeStats }: FileTypesSectionProps) {
  const entries = Object.entries(fileTypeStats).sort(([, a], [, b]) => b - a)
  if (entries.length === 0) return null

  return (
    <motion.div
      variants={sectionEntrance}
      initial="initial"
      animate="animate"
      className="rounded-md border border-dashed p-3"
    >
      <div className="flex items-center gap-2 px-1 mb-2">
        <FileText className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-mono text-muted-foreground">file-types</span>
        <div className="flex-1 h-px border-t border-dashed" />
      </div>
      <div className="flex flex-wrap gap-2">
        {entries.map(([type, count], i) => (
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
  )
}
