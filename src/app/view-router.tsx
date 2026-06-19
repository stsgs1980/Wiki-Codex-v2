'use client'

import { FileText, ArrowLeft, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DashboardView } from '@/components/codex/dashboard-view'
import { DocumentsView } from '@/components/codex/documents-view'
import { UploadView } from '@/components/codex/upload-view'
import { DocumentViewer } from '@/components/codex/document-viewer'
import { NotesView } from '@/components/codex/notes-view'
import { NoteEditor } from '@/components/codex/note-editor'
import { DictionaryView } from '@/components/codex/dictionary-view'
import { InstructionsView } from '@/components/codex/instructions-view'
import type { useWikiCodex } from './use-wiki-codex'

export type ViewRouterProps = ReturnType<typeof useWikiCodex>

export function ViewRouter(props: ViewRouterProps) {
  const {
    currentView, searchQuery, semanticMode, setView, counters,
    categories, tags, refreshAll, docs, notesHook, termsHook,
    handleUploadSuccess, handleDocumentDelete, handleDocumentUpdate,
    handleAnalysisApplied, handleNoteSelect, handleCreateNote,
    handleNoteDelete, handleNoteDeleteById, handleNoteSave,
  } = props

  if (docs.isLoading && (currentView === 'dashboard' || currentView === 'documents')) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 md:h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-52 md:h-64 rounded-xl" />
      </div>
    )
  }

  if (docs.isDocLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-full max-w-xs" />
        <Separator />
        <Skeleton className="h-72 md:h-96 rounded-xl" />
      </div>
    )
  }

  switch (currentView) {
    case 'dashboard':
      return (
        <DashboardView
          documents={docs.allDocuments} categories={categories} tags={tags}
          totalDocuments={counters.allDocumentsCount} totalStarred={counters.allStarredCount}
          onCleanupComplete={refreshAll}
        />
      )

    case 'documents':
      return (
        <div className="flex flex-col gap-3">
          {semanticMode && searchQuery && (
            <div className="flex items-center gap-2 px-1">
              <Badge variant="secondary" className="gap-1.5 bg-terminal-accent/10 text-terminal-accent border border-terminal-accent/20">
                <Brain className="size-3" />
                Семантический режим
              </Badge>
            </div>
          )}
          <DocumentsView documents={docs.documents} categories={categories} tags={tags} />
        </div>
      )

    case 'upload':
      return (
        <UploadView
          categories={categories}
          onUploadSuccess={handleUploadSuccess}
          onTermsExtracted={() => termsHook.fetchTerms()}
        />
      )

    case 'document-view':
      if (!docs.selectedDocument) {
        return (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <FileText className="size-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">Документ не найден</p>
            <Button variant="outline" className="gap-2" onClick={() => setView('documents')}>
              <ArrowLeft className="size-4" />
              К списку документов
            </Button>
          </div>
        )
      }
      return (
        <DocumentViewer
          document={docs.selectedDocument} categories={categories}
          onDelete={handleDocumentDelete} onUpdate={handleDocumentUpdate}
          onAnalysisApplied={handleAnalysisApplied}
        />
      )

    case 'notes':
      return (
        <NotesView
          notes={notesHook.notes} onNoteSelect={handleNoteSelect}
          onCreateNote={handleCreateNote} onDeleteNote={handleNoteDeleteById}
          isLoading={notesHook.isNotesLoading}
        />
      )

    case 'note-view':
      return (
        <NoteEditor
          note={notesHook.selectedNote} onSave={handleNoteSave}
          onCancel={() => setView('notes')} onDelete={handleNoteDelete}
          isSaving={notesHook.isNoteSaving}
        />
      )

    case 'dictionary':
      return (
        <DictionaryView
          terms={termsHook.terms}
          isLoading={termsHook.isTermsLoading}
          documents={docs.allDocuments}
          onTermsExtracted={() => {
            termsHook.fetchTerms()
            counters.fetchGlobalCounters()
          }}
        />
      )

    case 'instructions':
      return <InstructionsView onCountChange={counters.fetchGlobalCounters} />

    default:
      return null
  }
}
