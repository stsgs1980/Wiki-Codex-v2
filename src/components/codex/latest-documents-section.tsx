'use client'

import { FileText, Star, Upload, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import type { Document } from '@/lib/types'
import { formatDate } from '@/lib/format'
import { staggerContainer, staggerItem, sectionEntrance, listItemHover } from '@/lib/motion'

interface LatestDocumentsSectionProps {
  documents: Document[]
}

export function LatestDocumentsSection({ documents }: LatestDocumentsSectionProps) {
  const { setView, selectDocument } = useAppStore()
  const latestDocs = documents.slice(0, 5)

  return (
    <motion.div
      variants={sectionEntrance}
      initial="initial"
      animate="animate"
    >
      <div className="flex items-center gap-2 px-1 mb-2">
        <FileText className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-mono text-muted-foreground">latest</span>
        <div className="flex-1 h-px border-t border-dashed" />
        <span className="text-[10px] font-mono text-muted-foreground/80">{latestDocs.length}</span>
      </div>

      {latestDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="size-8 text-muted-foreground/50 mb-2" />
          <p className="font-mono text-xs text-muted-foreground mb-1">~ no documents yet</p>
          <p className="text-sm text-muted-foreground mb-3">Документов пока нет</p>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 font-mono text-xs"
            onClick={() => setView('upload')}
          >
            <Upload className="size-3.5" />
            Загрузить первый документ
          </Button>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="flex flex-col gap-1"
        >
          {latestDocs.map((doc) => (
            <motion.button
              key={doc.id}
              variants={staggerItem}
              {...listItemHover}
              className="flex items-center gap-2 sm:gap-3 rounded-md border border-dashed px-3 py-2 text-left hover:bg-accent/50 transition-colors w-full font-mono group"
              onClick={() => {
                selectDocument(doc.id)
                setView('document-view')
              }}
            >
              <span className="text-terminal-accent text-xs shrink-0 select-none">$</span>
              <div className="flex items-center justify-center size-7 rounded-sm bg-muted shrink-0">
                <FileText className="size-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm truncate leading-tight font-sans">{doc.title}</span>
                  {doc.isStarred && (
                    <Star className="size-3 text-star fill-star shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {doc.category && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 font-mono tag-color-text tag-color-bg"
                      style={{ '--tag-color': doc.category.color } as React.CSSProperties}
                    >
                      {doc.category.name}
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground/80">
                    {formatDate(doc.updatedAt)}
                  </span>
                </div>
              </div>
              <ArrowRight className="size-3.5 text-muted-foreground shrink-0 hidden sm:block" />
            </motion.button>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
