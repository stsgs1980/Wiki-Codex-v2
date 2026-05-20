'use client'

import { Star, FileText, File } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { staggerItem, cardHover } from '@/lib/motion'
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

interface DocumentCardProps {
  doc: Document
  formatDate: (d: string) => string
  onClick: () => void
}

export function DocumentCard({ doc, formatDate, onClick }: DocumentCardProps) {
  return (
    <motion.div
      variants={staggerItem}
      {...cardHover}
    >
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow hover:border-foreground/20 group"
        onClick={onClick}
      >
        <CardContent className="pt-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              {getFileIcon(doc.fileType)}
              <h3 className="font-semibold text-sm text-foreground line-clamp-1 leading-tight group-hover:text-muted-foreground transition-colors font-sans">
                {doc.title}
              </h3>
            </div>
            {doc.isStarred && (
              <Star className="size-3.5 text-star fill-star shrink-0" />
            )}
          </div>

          {doc.summary && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 font-sans">
              {doc.summary}
            </p>
          )}

          <div className="flex flex-wrap gap-1 mb-3">
            {doc.tags.slice(0, 3).map((dt) => (
              <Badge
                key={dt.tag.id}
                variant="outline"
                className="text-xs px-1.5 py-0 tag-color-text tag-color-border"
                style={{ '--tag-color': dt.tag.color } as React.CSSProperties}
              >
                {dt.tag.name}
              </Badge>
            ))}
            {doc.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                +{doc.tags.length - 3}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {doc.category && (
                <span
                  className="inline-flex items-center gap-1 tag-color-text"
                  style={{ '--tag-color': doc.category.color } as React.CSSProperties}
                >
                  <span
                    className="size-1.5 rounded-full inline-block"
                    style={{ backgroundColor: doc.category.color }}
                  />
                  {doc.category.name}
                </span>
              )}
            </div>
            <span>{formatDate(doc.updatedAt)}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
