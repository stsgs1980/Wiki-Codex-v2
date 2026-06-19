'use client'

import {
  Star, Trash2, Edit3, FileText, Calendar, Eye, HardDrive,
  Tag as TagIcon, FolderOpen, ChevronRight, LayoutDashboard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatFileSize } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Document } from '@/lib/types'
import type { ViewType } from '@/lib/store'

interface DocumentHeaderProps {
  doc: Document
  setView: (view: ViewType) => void
  setSelectedCategory: (id: string) => void
}

export function DocumentHeader({ doc, setView, setSelectedCategory }: DocumentHeaderProps) {
  return (
    <>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground mb-3">
        <button onClick={() => setView('dashboard')} className="hover:text-foreground transition-colors flex items-center gap-1">
          <LayoutDashboard className="size-3" /><span>~</span>
        </button>
        <ChevronRight className="size-3" />
        {doc.category ? (
          <>
            <button onClick={() => { setSelectedCategory(doc.category!.id); setView('documents') }} className="hover:text-foreground transition-colors">
              {doc.category.name}
            </button>
            <ChevronRight className="size-3" />
          </>
        ) : (
          <>
            <button onClick={() => setView('documents')} className="hover:text-foreground transition-colors">docs</button>
            <ChevronRight className="size-3" />
          </>
        )}
        <span className="text-foreground font-medium truncate">{doc.title}</span>
      </div>

      {/* Title */}
      <div className="flex items-center gap-2 mb-3">
        <FileText className="size-4 text-muted-foreground shrink-0" />
        <h1 className="text-lg sm:text-xl font-bold tracking-tight break-words truncate leading-tight font-sans">{doc.title}</h1>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 text-[11px] font-mono text-muted-foreground">
        {doc.category && (
          <div className="flex items-center gap-1">
            <FolderOpen className="size-3" />
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono tag-color-text tag-color-bg" style={{ '--tag-color': doc.category.color } as React.CSSProperties}>
              {doc.category.name}
            </Badge>
          </div>
        )}
        <div className="flex items-center gap-1"><Calendar className="size-3" /><span>{formatDate(doc.createdAt)}</span></div>
        <div className="flex items-center gap-1"><Eye className="size-3" /><span>{doc.viewCount}</span></div>
        <div className="flex items-center gap-1"><HardDrive className="size-3" /><span>{formatFileSize(doc.fileSize)}</span></div>
        <div className="flex items-center gap-1"><FileText className="size-3" /><span>{doc.fileType.toUpperCase()}</span></div>
      </div>

      {/* Tags */}
      {doc.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <TagIcon className="size-3 text-muted-foreground shrink-0" />
          {doc.tags.map((dt) => (
            <Badge key={dt.tag.id} variant="outline" className="text-[10px] font-mono tag-color-text tag-color-border" style={{ '--tag-color': dt.tag.color } as React.CSSProperties}>
              {dt.tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Summary */}
      {doc.summary && (
        <div className="bg-muted rounded-md p-3 mb-3 border border-dashed">
          <p className="text-xs text-foreground break-words leading-relaxed">{doc.summary}</p>
        </div>
      )}
    </>
  )
}

interface DocumentHeaderActionsProps {
  doc: Document
  onStar: () => void
  onEdit: () => void
  onDeleteClick: () => void
}

export function DocumentHeaderActions({ doc, onStar, onEdit, onDeleteClick }: DocumentHeaderActionsProps) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="size-6" onClick={onStar} title={doc.isStarred ? 'Убрать из избранного' : 'В избранное'}>
        <Star className={cn('size-3.5', doc.isStarred ? 'fill-star text-star' : 'text-muted-foreground')} />
      </Button>
      <Button variant="ghost" size="sm" className="gap-1 text-xs h-6" onClick={onEdit}>
        <Edit3 className="size-3" />
        <span className="hidden sm:inline">edit</span>
      </Button>
      <Button variant="ghost" size="icon" className="size-6 text-destructive hover:text-destructive" onClick={onDeleteClick}>
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  )
}
