'use client'

import { RefreshCw, FileSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { RelatedDocument } from './types'

interface RelatedDocsSectionProps {
  docId: string
  relatedDocs: RelatedDocument[]
  isRelatedLoading: boolean
  relatedFetched: boolean
  onFetchRelated: (docId: string) => void
  onRelatedClick: (relDoc: RelatedDocument) => void
}

export function RelatedDocsSection({
  docId, relatedDocs, isRelatedLoading, relatedFetched,
  onFetchRelated, onRelatedClick,
}: RelatedDocsSectionProps) {
  return (
    <div className="flex flex-col gap-2 my-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <FileSearch className="size-3 text-muted-foreground" />
          <span className="text-[11px] font-mono text-muted-foreground">related</span>
        </div>
        <Button variant="ghost" size="icon" className="size-5" onClick={() => onFetchRelated(docId)} disabled={isRelatedLoading}>
          <RefreshCw className={cn('size-3', isRelatedLoading && 'animate-spin')} />
        </Button>
      </div>

      {isRelatedLoading && (
        <div className="flex flex-col gap-1.5">
          {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-8 rounded-sm" />))}
        </div>
      )}

      {!isRelatedLoading && relatedDocs.length > 0 && (
        <div className="flex flex-col gap-1">
          {relatedDocs.map((relDoc) => (
            <div
              key={relDoc.id}
              className="flex items-center justify-between gap-2 rounded-md border border-dashed px-2.5 py-1.5 hover:bg-accent/50 transition-colors cursor-pointer font-mono"
              onClick={() => onRelatedClick(relDoc)}
            >
              <span className="text-xs text-foreground truncate min-w-0">{relDoc.title}</span>
              <Badge
                variant="secondary"
                className={cn(
                  'shrink-0 text-[10px]',
                  relDoc.similarityScore >= 0.8
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : relDoc.similarityScore >= 0.6
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                )}
              >
                {Math.round(relDoc.similarityScore * 100)}%
              </Badge>
            </div>
          ))}
        </div>
      )}

      {!isRelatedLoading && relatedFetched && relatedDocs.length === 0 && (
        <p className="text-[11px] font-mono text-muted-foreground">-- no related docs</p>
      )}
    </div>
  )
}
