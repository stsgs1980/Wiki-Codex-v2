'use client'

import { Save, Loader2, Trash2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

interface NoteEditorToolbarProps {
  note: Note | null
  isSaving: boolean
  isSaveDisabled: boolean
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
}

export function NoteEditorToolbar({ note, isSaving, isSaveDisabled, onSave, onCancel, onDelete }: NoteEditorToolbarProps) {
  return (
    <div className="flex items-center gap-1.5">
      {note && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-5 text-destructive hover:text-destructive"
              disabled={isSaving}
              aria-label="Удалить заметку"
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
              <AlertDialogAction onClick={onDelete}>Удалить</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSaving} className="text-xs h-6 font-mono">
        esc
      </Button>
      <Button
        onClick={onSave}
        disabled={isSaveDisabled}
        className="gap-1 text-xs h-6"
      >
        {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
        {isSaving ? '...' : 'save'}
      </Button>
    </div>
  )
}

interface NoteEditorAnalyzeButtonProps {
  isAnalyzing: boolean
  charCount: number
  onAnalyze: () => void
}

export function NoteEditorAnalyzeButton({ isAnalyzing, charCount, onAnalyze }: NoteEditorAnalyzeButtonProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onAnalyze}
        disabled={isAnalyzing || charCount < 10}
        className="gap-1.5 text-xs h-6 font-mono"
        aria-describedby="analyze-hint"
      >
        {isAnalyzing ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
        analyze
      </Button>
      {charCount < 10 && charCount > 0 && (
        <span id="analyze-hint" className="text-3xs font-mono text-muted-foreground">
          min 10 chars
        </span>
      )}
    </div>
  )
}
