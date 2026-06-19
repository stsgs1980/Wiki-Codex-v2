'use client'

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TerminalFrame } from '@/components/codex/terminal-frame'
import type { Document, AIAnalysis } from '@/lib/types'
import type { ViewType } from '@/lib/store'
import type { RelatedDocument } from './types'
import { MarkdownContent } from './markdown-renderer'
import { RelatedDocsSection } from './related-docs-section'
import { DocumentHeader, DocumentHeaderActions } from './document-header'
import { DocumentAnalysisSection } from './document-analysis-section'

interface DocumentViewModeProps {
  doc: Document
  isAnalyzing: boolean
  analysis: AIAnalysis | null
  isApplying: boolean
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
  setView: (view: ViewType) => void
  selectDocument: (id: string) => void
  setSelectedCategory: (id: string) => void
}

export function DocumentViewMode({
  doc, isAnalyzing, analysis, isApplying,
  relatedDocs, isRelatedLoading, relatedFetched,
  showDeleteDialog, setShowDeleteDialog,
  onStar, onDelete, onAnalyze, onApplyAnalysis,
  onFetchRelated, onRelatedClick, onEdit,
  setView, selectDocument, setSelectedCategory,
}: DocumentViewModeProps) {
  return (
    <TerminalFrame title="document/view" className="m-3 sm:m-4 md:m-6 max-w-4xl mx-auto" headerRight={
      <DocumentHeaderActions
        doc={doc}
        onStar={onStar}
        onEdit={onEdit}
        onDeleteClick={() => setShowDeleteDialog(true)}
      />
    }>
      <div className="p-3 sm:p-4">
        <DocumentHeader doc={doc} setView={setView} setSelectedCategory={setSelectedCategory} />

        <DocumentAnalysisSection
          isAnalyzing={isAnalyzing}
          analysis={analysis}
          isApplying={isApplying}
          onAnalyze={onAnalyze}
          onApplyAnalysis={onApplyAnalysis}
        />

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
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TerminalFrame>
  )
}
