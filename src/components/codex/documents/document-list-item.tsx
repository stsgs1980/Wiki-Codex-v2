'use client'

import { Star, FileText, File } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { staggerItem, listItemHover } from '@/lib/motion'
import type { Document } from '@/lib/types'

function getFileIcon(fileType: string) {
  switch (fileType) {
    case 'md':
      return <FileText className="size-5 text-muted-foreground" />
    case 'html':
      return <FileText className="size-5 text-muted-foreground" />
    default:
      return <File className="size-5 text-muted-foreground" />
  }
}

interface DocumentListItemProps {
  doc: Document
  formatDate: (d: string) => string
  formatFileSize: (s: number) => string
  onClick: () => void
}

export function DocumentListItem({ doc, formatDate, formatFileSize, onClick }: DocumentListItemProps) {
  return (
    <motion.button
      variants={staggerItem}
      {...listItemHover}
      className="flex items-center gap-3 rounded-md border border-dashed p-3 text-left hover:bg-accent/50 transition-colors w-full font-mono group"
      onClick={onClick}
    >
      <span className="text-terminal-accent text-xs shrink-0 select-none">$</span>
      <div className="flex items-center justify-center size-8 rounded-sm bg-muted shrink-0">
        {getFileIcon(doc.fileType)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate leading-tight font-sans">{doc.title}</span>
          {doc.isStarred && (
            <Star className="size-3.5 text-star fill-star shrink-0" />
          )}
        </div>
        {doc.summary && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 font-sans">
            {doc.summary}
          </p>
        )}
      </div>
      <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground shrink-0">
        {doc.category && (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 font-mono tag-color-text tag-color-bg"
            style={{ '--tag-color': doc.category.color } as React.CSSProperties}
          >
            {doc.category.name}
          </Badge>
        )}
        <span>{formatFileSize(doc.fileSize)}</span>
        <span>{formatDate(doc.updatedAt)}</span>
      </div>
    </motion.button>
  )
}
