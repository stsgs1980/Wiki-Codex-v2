'use client'

import {
  Star, Trash2, Edit3, Loader2, Eye, Calendar, HardDrive,
  FileText, Tag as TagIcon, FolderOpen, Check,
  Sparkles, ArrowLeft, ChevronRight, LayoutDashboard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TerminalFrame } from '@/components/codex/terminal-frame'
import { formatDate, formatFileSize } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Document, AIAnalysis } from '@/lib/types'
import type { RelatedDocument } from './types'
import { MarkdownContent } from './markdown-renderer'
import { RelatedDocsSection } from './related-docs-section'

interface DocumentViewModeProps {
  doc: Document
  isAnalyzing: boolean
  analysis: AIAnalysis | null
  isSaving: boolean
  relatedDocs: RelatedDocument[]
  isRelatedLoading: boolean
  relatedFetched: boolean
  showDeleteDialog: boolean
  setShowDeleteDialog: (v: boolean) => void
  onStar: () => void
  onDelete: () => void
  onAnalyze: () => void
  onApplyAnalysis: () => void
  onFetchRelated: (docId: string) => void
  onRelatedClick: (relDoc: RelatedDocument) => void
  onEdit: () => void
  setView: (view: string) => void
  selectDocument: (id: string) => void
  setSelectedCategory: (id: string) => void
}

export function DocumentViewMode({
  doc, isAnalyzing, analysis, isSaving,
  relatedDocs, isRelatedLoading, relatedFetched,
  showDeleteDialog, setShowDeleteDialog,
  onStar, onDelete, onAnalyze, onApplyAnalysis,
  onFetchRelated, onRelatedClick, onEdit,
  setView, selectDocument, setSelectedCategory,
}: DocumentViewModeProps) {
  return (
    <TerminalFrame title="document/view" className="m-3 sm:m-4 md:m-6 max-w-4xl mx-auto" headerRight={
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="size-6" onClick={onStar} title={doc.isStarred ? 'Убрать из избранного' : 'В избранное'}>
          <Star className={cn('size-3.5', doc.isStarred ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground')} />
        </Button>
        <Button variant="ghost" size="sm" className="gap-1 text-xs h-6" onClick={onEdit}>
          <Edit3 className="size-3" />
          <span className="hidden sm:inline">edit</span>
        </Button>
        <Button variant="ghost" size="icon" className="size-6 text-destructive hover:text-destructive" onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    }>
      <div className="p-3 sm:p-4">
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
          <h1 className="text-lg sm:text-xl font-bold tracking-tight break-words truncate leading-tight font-mono">{doc.title}</h1>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 text-[11px] font-mono text-muted-foreground">
          {doc.category && (
            <div className="flex items-center gap-1">
              <FolderOpen className="size-3" />
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono" style={{ backgroundColor: doc.category.color + '20', color: doc.category.color }}>
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
              <Badge key={dt.tag.id} variant="outline" className="text-[10px] font-mono" style={{ borderColor: dt.tag.color, color: dt.tag.color }}>
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

        {/* AI Analysis Controls */}
        <div className="flex items-center gap-2 mb-3">
          <Button variant="outline" size="sm" onClick={onAnalyze} disabled={isAnalyzing} className="gap-1.5 text-xs h-6 font-mono">
            {isAnalyzing ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
            analyze
          </Button>
          {analysis && !isAnalyzing && (
            <Button variant="outline" size="sm" onClick={onApplyAnalysis} disabled={isSaving} className="gap-1.5 text-xs h-6 font-mono">
              {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
              apply
            </Button>
          )}
        </div>

        {/* AI Analysis Result */}
        {analysis && (
          <div className="border border-dashed rounded-md p-3 mb-3 flex flex-col gap-2 text-xs font-mono">
            <div>
              <span className="text-muted-foreground">summary: </span>
              <span className="text-foreground">{analysis.summary}</span>
            </div>
            <Separator />
            <div>
              <span className="text-muted-foreground">category: </span>
              {analysis.suggestedCategory ? (
                <Badge variant="secondary" className="text-[10px]">{analysis.suggestedCategory.name}</Badge>
              ) : analysis.suggestedNewCategory ? (
                <Badge variant="outline" className="text-[10px]">new: {analysis.suggestedNewCategory}</Badge>
              ) : (
                <span className="text-muted-foreground">--</span>
              )}
            </div>
            {analysis.matchedTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-muted-foreground">tags:</span>
                {analysis.matchedTags.map((t) => (
                  <Badge key={t.id} variant="outline" className="text-[10px]">{t.name}</Badge>
                ))}
                {analysis.newTagNames.map((n, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">+{n}</Badge>
                ))}
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Related Documents */}
        <RelatedDocsSection
          docId={doc.id}
          relatedDocs={relatedDocs}
          isRelatedLoading={isRelatedLoading}
          relatedFetched={relatedFetched}
          onFetchRelated={onFetchRelated}
          onRelatedClick={onRelatedClick}
        />

        <Separator />

        {/* Markdown Content */}
        <MarkdownContent content={doc.content} />

        {/* Back button */}
        <div className="mt-4 pt-3 border-t border-dashed">
          <Button variant="ghost" size="sm" onClick={() => setView('documents')} className="gap-1.5 text-xs font-mono text-muted-foreground">
            <ArrowLeft className="size-3" />
            back
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удаление документа</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить &quot;{doc.title}&quot;? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TerminalFrame>
  )
}
