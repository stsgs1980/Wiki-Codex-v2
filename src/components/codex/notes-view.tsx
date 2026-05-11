'use client'

import { StickyNote, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { Note } from '@/lib/types'
import { formatDate } from '@/lib/format'
import { TerminalFrame } from '@/components/codex/terminal-frame'

interface NotesViewProps {
  notes: Note[]
  onNoteSelect: (id: string) => void
  onCreateNote: () => void
  onDeleteNote: (id: string) => void
  isLoading: boolean
}

function NoteCard({ note, onSelect, onDelete }: { note: Note; onSelect: (id: string) => void; onDelete: (id: string) => void }) {
  const preview = note.content.length > 100 ? note.content.slice(0, 100) + '...' : note.content

  return (
    <div
      className="flex items-start gap-3 rounded-lg border px-3 py-2.5 hover:bg-accent/50 transition-colors cursor-pointer font-mono text-sm group"
      onClick={() => onSelect(note.id)}
    >
      <span className="text-green-600 dark:text-green-400 shrink-0 select-none text-xs leading-5">$</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-foreground truncate leading-tight text-sm">{note.title}</span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="size-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить заметку?</AlertDialogTitle>
                <AlertDialogDescription>
                  &quot;{note.title}&quot; будет удалена без возможности восстановления.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(note.id)}>Удалить</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        {note.content && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-0.5 font-sans">{preview}</p>
        )}
        <span className="text-[10px] text-muted-foreground/60 mt-1 inline-block">
          {formatDate(note.updatedAt)}
        </span>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3 px-3 py-2.5">
          <Skeleton className="size-4 shrink-0 rounded-sm" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function NotesView({ notes, onNoteSelect, onCreateNote, onDeleteNote, isLoading }: NotesViewProps) {
  return (
    <TerminalFrame title="notes" className="m-4 md:m-6" headerRight={
      <Button onClick={onCreateNote} size="sm" className="gap-1.5 h-6 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
        <Plus className="size-3" />
        <span className="hidden sm:inline">new</span>
      </Button>
    }>
      {isLoading ? (
        <div className="p-3">
          <LoadingSkeleton />
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center px-6">
          <StickyNote className="size-10 text-muted-foreground/40 mb-3" />
          <p className="text-xs font-mono text-muted-foreground mb-1">~ no notes found</p>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">Заметок пока нет</p>
          <Button onClick={onCreateNote} size="sm" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="size-4" />
            Создать заметку
          </Button>
        </div>
      ) : (
        <div className="flex flex-col divide-y">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onSelect={onNoteSelect} onDelete={onDeleteNote} />
          ))}
        </div>
      )}
    </TerminalFrame>
  )
}
