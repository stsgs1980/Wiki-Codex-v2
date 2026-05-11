'use client'

import { useEffect, useState, useCallback } from 'react'
import { FileText, ArrowLeft, Brain } from 'lucide-react'
import { useAppStore } from '@/lib/store'
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
import { useToast } from '@/hooks/use-toast'
import { pluralize } from '@/lib/format'
import {
  useGlobalCounters,
  useCategoriesAndTags,
  useDocuments,
  useNotes,
  useTerms,
} from '@/hooks/use-codex-data'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { TECH_ITEMS } from '@/components/codex/tech-logos'

export default function WikiCodex() {
  const {
    currentView,
    selectedDocumentId,
    selectedNoteId,
    searchQuery,
    selectedCategoryId,
    selectedTagId,
    semanticMode,
    setView,
    selectNote,
  } = useAppStore()

  const { toast } = useToast()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // --- Keyboard shortcuts ---
  useKeyboardShortcuts()

  // --- Data hooks ---
  const counters = useGlobalCounters()
  const { categories, tags, fetchCategoriesAndTags } = useCategoriesAndTags()
  const docs = useDocuments()
  const notesHook = useNotes()
  const termsHook = useTerms()

  // =========================================================================
  // Master refresh
  // =========================================================================
  const refreshAll = useCallback(() => {
    docs.fetchDocuments()
    fetchCategoriesAndTags()
    termsHook.fetchTerms()
    counters.fetchGlobalCounters()
    docs.fetchAllDocuments()
  }, [docs.fetchDocuments, fetchCategoriesAndTags, termsHook.fetchTerms, counters.fetchGlobalCounters, docs.fetchAllDocuments])

  // =========================================================================
  // Initial load
  // =========================================================================
  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  // =========================================================================
  // View-dependent fetches
  // =========================================================================
  useEffect(() => {
    if (currentView === 'dashboard' || currentView === 'documents') {
      docs.fetchDocuments()
    }
  }, [currentView, docs.fetchDocuments])

  useEffect(() => {
    if (currentView === 'notes' || currentView === 'note-view') {
      notesHook.fetchNotes()
    }
  }, [currentView, notesHook.fetchNotes])

  useEffect(() => {
    if (currentView === 'dictionary') {
      termsHook.fetchTerms()
      docs.fetchAllDocuments()
    }
  }, [currentView, termsHook.fetchTerms, docs.fetchAllDocuments])

  useEffect(() => {
    if (selectedDocumentId && currentView === 'document-view') {
      docs.fetchDocument(selectedDocumentId)
    }
  }, [selectedDocumentId, currentView, docs.fetchDocument])

  useEffect(() => {
    if (selectedNoteId && currentView === 'note-view') {
      const note = notesHook.notes.find((n) => n.id === selectedNoteId)
      if (note) {
        notesHook.setSelectedNote(note)
      } else {
        fetch(`/api/notes/${selectedNoteId}`)
          .then((res) => res.ok ? res.json() : null)
          .then((data) => {
            if (data) notesHook.setSelectedNote(data)
            else { selectNote(null); setView('notes') }
          })
          .catch(() => { selectNote(null); setView('notes') })
      }
    }
  }, [selectedNoteId, currentView, notesHook.notes, notesHook.fetchNotes, notesHook.setSelectedNote, selectNote, setView])

  // =========================================================================
  // Mutation handlers
  // =========================================================================
  const handleUploadSuccess = useCallback(() => {
    setTimeout(refreshAll, 300)
  }, [refreshAll])

  const handleDocumentDelete = useCallback((id: string) => {
    docs.setSelectedDocument(null)
    useAppStore.getState().selectDocument(null)
    refreshAll()
  }, [refreshAll, docs.setSelectedDocument])

  const handleDocumentUpdate = useCallback(() => {
    refreshAll()
  }, [refreshAll])

  const handleAnalysisApplied = useCallback(() => {
    refreshAll()
  }, [refreshAll])

  // =========================================================================
  // Clear stale state on view change
  // =========================================================================
  useEffect(() => {
    if (currentView !== 'document-view') {
      docs.setSelectedDocument(null)
      const storeState = useAppStore.getState()
      if (storeState.selectedDocumentId) storeState.selectDocument(null)
    }
    if (currentView !== 'note-view') {
      notesHook.setSelectedNote(null)
      const storeState = useAppStore.getState()
      if (storeState.selectedNoteId) storeState.selectNote(null)
    }
  }, [currentView, docs.setSelectedDocument, notesHook.setSelectedNote])

  // =========================================================================
  // Note handlers
  // =========================================================================
  const handleNoteSelect = useCallback((id: string) => {
    selectNote(id)
    setView('note-view')
  }, [selectNote, setView])

  const handleCreateNote = useCallback(() => {
    notesHook.setSelectedNote(null)
    selectNote(null)
    setView('note-view')
  }, [notesHook.setSelectedNote, selectNote, setView])

  const handleNoteDelete = useCallback(async () => {
    if (!notesHook.selectedNote) return
    try {
      const res = await fetch(`/api/notes/${notesHook.selectedNote.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Заметка удалена', description: `"${notesHook.selectedNote.title}"` })
        selectNote(null)
        setView('notes')
        notesHook.fetchNotes()
        counters.fetchGlobalCounters()
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить заметку', variant: 'destructive' })
    }
  }, [notesHook.selectedNote, selectNote, setView, notesHook.fetchNotes, counters.fetchGlobalCounters, toast])

  const handleNoteDeleteById = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Заметка удалена' })
        notesHook.fetchNotes()
        counters.fetchGlobalCounters()
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить заметку', variant: 'destructive' })
    }
  }, [notesHook.fetchNotes, counters.fetchGlobalCounters, toast])

  const handleNoteSave = useCallback(async (data: { title: string; content: string }) => {
    notesHook.setIsNoteSaving(true)
    try {
      const isEditing = notesHook.selectedNote !== null
      const url = isEditing ? `/api/notes/${notesHook.selectedNote!.id}` : '/api/notes'
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        toast({
          title: isEditing ? 'Заметка обновлена' : 'Заметка создана',
          description: `"${data.title}"`,
        })
        notesHook.fetchNotes()
        setView('notes')
      }
    } catch {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить заметку',
        variant: 'destructive',
      })
    } finally {
      notesHook.setIsNoteSaving(false)
    }
  }, [notesHook.selectedNote, notesHook.fetchNotes, notesHook.setIsNoteSaving, setView, toast])

  // =========================================================================
  // Render
  // =========================================================================
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
              <FileText className="size-10 text-stone-300 dark:text-stone-600" />
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
      {/* Desktop sidebar */}
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

      {/* Mobile sidebar (Sheet drawer) */}
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
          {renderView()}
        </ScrollArea>

        <footer className="mt-auto border-t bg-zinc-900 dark:bg-zinc-950 px-4 py-1.5 md:px-6 flex items-center justify-between gap-2 font-mono text-[11px]">
          <span className="text-zinc-400 whitespace-nowrap flex items-center gap-2">
            <span className="text-green-500">{'//>'}</span> Wiki Codex <span className="text-zinc-600">v2.0</span>
            <span className="text-[#FA3913] mx-1">|</span>
            <span className="text-zinc-500">NEURO</span>
            <span className="hidden md:flex items-center gap-1.5 ml-2">
              {TECH_ITEMS.map(({ name, Logo }) => (
                <Logo key={name} className="size-3.5 text-zinc-500" />
              ))}
            </span>
          </span>
          <span className="text-zinc-500 text-right tabular-nums">
            {counters.allDocumentsCount} {pluralize(counters.allDocumentsCount, ['doc', 'docs', 'docs'])}
          </span>
        </footer>
      </div>
    </div>
  )
}
