'use client'

import { FileText, ArrowLeft, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sidebar, MobileSidebar } from '@/components/codex/sidebar'
import { Header } from '@/components/codex/header'
import { DashboardView } from '@/components/codex/dashboard-view'
import { DocumentsView } from '@/components/codex/documents-view'
import { UploadView } from '@/components/codex/upload-view'
import { DocumentViewer } from '@/components/codex/document-viewer'
import { NotesView } from '@/components/codex/notes-view'
import { NoteEditor } from '@/components/codex/note-editor'
import { DictionaryView } from '@/components/codex/dictionary-view'
import { InstructionsView } from '@/components/codex/instructions-view'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { motion, AnimatePresence } from 'framer-motion'
import { pluralize } from '@/lib/format'
import { TECH_ITEMS, NeuroLogoSmall } from '@/components/codex/tech-logos'
import { viewTransition } from '@/lib/motion'
import { useWikiCodex } from './use-wiki-codex'

export default function WikiCodex() {
  const {
    currentView,
    searchQuery,
    semanticMode,
    setView,
    mobileMenuOpen,
    setMobileMenuOpen,
    counters,
    categories,
    tags,
    fetchCategoriesAndTags,
    refreshAll,
    docs,
    notesHook,
    termsHook,
    handleUploadSuccess,
    handleDocumentDelete,
    handleDocumentUpdate,
    handleAnalysisApplied,
    handleNoteSelect,
    handleCreateNote,
    handleNoteDelete,
    handleNoteDeleteById,
    handleNoteSave,
  } = useWikiCodex()

  const renderView = () => {
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
            documents={docs.allDocuments}
            categories={categories}
            tags={tags}
            totalDocuments={counters.allDocumentsCount}
            totalStarred={counters.allStarredCount}
          />
        )

      case 'documents':
        return (
          <div className="flex flex-col gap-3">
            {semanticMode && searchQuery && (
              <div className="flex items-center gap-2 px-1">
                <Badge variant="secondary" className="gap-1.5 bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                  <Brain className="size-3" />
                  Семантический режим
                </Badge>
              </div>
            )}
            <DocumentsView
              documents={docs.documents}
              categories={categories}
              tags={tags}
            />
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
            document={docs.selectedDocument}
            categories={categories}
            onDelete={handleDocumentDelete}
            onUpdate={handleDocumentUpdate}
            onAnalysisApplied={handleAnalysisApplied}
          />
        )

      case 'notes':
        return (
          <NotesView
            notes={notesHook.notes}
            onNoteSelect={handleNoteSelect}
            onCreateNote={handleCreateNote}
            onDeleteNote={handleNoteDeleteById}
            isLoading={notesHook.isNotesLoading}
          />
        )

      case 'note-view':
        return (
          <NoteEditor
            note={notesHook.selectedNote}
            onSave={handleNoteSave}
            onCancel={() => setView('notes')}
            onDelete={handleNoteDelete}
            isSaving={notesHook.isNoteSaving}
          />
        )

      case 'dictionary':
        return (
          <DictionaryView
            terms={termsHook.terms}
            isLoading={termsHook.isTermsLoading}
            documents={docs.allDocuments}
            onTermsExtracted={() => termsHook.fetchTerms()}
          />
        )

      case 'instructions':
        return <InstructionsView onCountChange={counters.fetchGlobalCounters} />

      default:
        return null
    }
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar
        categories={categories}
        tags={tags}
        documentsCount={counters.allDocumentsCount}
        termsCount={counters.termsCount}
        notesCount={counters.notesCount}
        instructionsCount={counters.instructionsCount}
        onCategoryCreated={() => fetchCategoriesAndTags()}
        onTagCreated={() => fetchCategoriesAndTags()}
        onCategoryDeleted={() => { fetchCategoriesAndTags(); refreshAll() }}
        onTagDeleted={() => { fetchCategoriesAndTags(); refreshAll() }}
      />

      <MobileSidebar
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        categories={categories}
        tags={tags}
        documentsCount={counters.allDocumentsCount}
        termsCount={counters.termsCount}
        notesCount={counters.notesCount}
        instructionsCount={counters.instructionsCount}
        onCategoryCreated={() => fetchCategoriesAndTags()}
        onTagCreated={() => fetchCategoriesAndTags()}
        onCategoryDeleted={() => { fetchCategoriesAndTags(); refreshAll() }}
        onTagDeleted={() => { fetchCategoriesAndTags(); refreshAll() }}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <Header onMenuToggle={() => setMobileMenuOpen(true)} />

        <ScrollArea className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              variants={viewTransition}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>

        <footer className="mt-auto border-t bg-card px-4 py-1.5 md:px-6 flex items-center justify-between gap-2 font-mono text-[11px]">
          <span className="text-muted-foreground whitespace-nowrap flex items-center gap-2">
            <NeuroLogoSmall className="size-4 shrink-0" />
            <span className="text-terminal-accent">{'//>'}</span> Wiki Codex <span className="text-muted-foreground/70">v2.0</span>
            <span className="text-neuro-brand mx-1">|</span>
            <span className="text-muted-foreground/80">NEURO</span>
            <span className="hidden md:flex items-center gap-1.5 ml-2">
              {TECH_ITEMS.map(({ name, Logo }) => (
                <Logo key={name} className="size-3.5 text-muted-foreground/80" />
              ))}
            </span>
          </span>
          <span className="text-muted-foreground/80 text-right tabular-nums">
            {counters.allDocumentsCount} {pluralize(counters.allDocumentsCount, ['doc', 'docs', 'docs'])}
          </span>
        </footer>
      </div>
    </div>
  )
}
