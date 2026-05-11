'use client'

import { useReducer, useEffect, useState, useCallback } from 'react'
import { Save, Loader2, FileText, Sparkles, X, Tag, Lightbulb, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { useToast } from '@/hooks/use-toast'
import { pluralize } from '@/lib/format'
import { TerminalFrame } from '@/components/codex/terminal-frame'

interface NoteEditorProps {
  note: Note | null
  onSave: (data: { title: string; content: string }) => void
  onCancel: () => void
  onDelete: () => void
  isSaving: boolean
}

interface NoteAnalysis {
  suggestedTitle: string | null
  summary: string | null
  topics: string[]
  mood: string | null
}

type EditorState = {
  title: string
  content: string
}

type EditorAction =
  | { type: 'SET_TITLE'; value: string }
  | { type: 'SET_CONTENT'; value: string }
  | { type: 'RESET'; payload: Note | null }

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_TITLE':
      return { ...state, title: action.value }
    case 'SET_CONTENT':
      return { ...state, content: action.value }
    case 'RESET':
      return action.payload
        ? { title: action.payload.title, content: action.payload.content }
        : { title: '', content: '' }
  }
}

const initialState: EditorState = { title: '', content: '' }

export function NoteEditor({ note, onSave, onCancel, onDelete, isSaving }: NoteEditorProps) {
  const [state, dispatch] = useReducer(editorReducer, initialState)
  const [analysis, setAnalysis] = useState<NoteAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    dispatch({ type: 'RESET', payload: note })
    setAnalysis(null)
  }, [note])

  const handleAnalyze = useCallback(async () => {
    if (!state.content.trim() || state.content.trim().length < 10) {
      toast({
        title: 'Мало текста',
        description: 'Напишите хотя бы пару предложений для анализа',
        variant: 'destructive',
      })
      return
    }

    setIsAnalyzing(true)
    try {
      const res = await fetch('/api/notes/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: state.content }),
      })
      if (res.ok) {
        const result = await res.json()
        setAnalysis(result)
      }
    } catch {
      toast({
        title: 'Ошибка',
        description: 'Не удалось проанализировать заметку',
        variant: 'destructive',
      })
    } finally {
      setIsAnalyzing(false)
    }
  }, [state.content, toast])

  const applySuggestedTitle = useCallback(() => {
    if (analysis?.suggestedTitle) {
      dispatch({ type: 'SET_TITLE', value: analysis.suggestedTitle })
      toast({ title: 'Заголовок применён' })
    }
  }, [analysis, toast])

  const handleSave = () => {
    const trimmedTitle = state.title.trim()
    if (!trimmedTitle) return
    onSave({ title: trimmedTitle, content: state.content })
  }

  const isSaveDisabled = !state.title.trim() || isSaving
  const charCount = state.content.length

  return (
    <TerminalFrame title={note ? 'note/edit' : 'note/new'} className="m-4 md:m-6 max-w-3xl mx-auto" headerRight={
      <div className="flex items-center gap-1.5">
        {note && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-5 text-destructive hover:text-destructive"
                disabled={isSaving}
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
          onClick={handleSave}
          disabled={isSaveDisabled}
          className="gap-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-6"
        >
          {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
          {isSaving ? '...' : 'save'}
        </Button>
      </div>
    }>
      <div className="p-3 sm:p-4 flex flex-col gap-4">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="note-title" className="text-[11px] font-mono text-muted-foreground">$ title</Label>
          <Input
            id="note-title"
            value={state.title}
            onChange={(e) => dispatch({ type: 'SET_TITLE', value: e.target.value })}
            placeholder="Заголовок заметки"
            className="font-mono text-sm"
          />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="note-content" className="text-[11px] font-mono text-muted-foreground">$ content</Label>
            <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
              {charCount} {pluralize(charCount, ['char', 'chars', 'chars'])}
            </span>
          </div>
          <Textarea
            id="note-content"
            value={state.content}
            onChange={(e) => dispatch({ type: 'SET_CONTENT', value: e.target.value })}
            placeholder="Напишите заметку..."
            className="min-h-[400px] font-mono text-sm resize-y"
          />
        </div>

        {/* AI Analysis Button */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyze}
            disabled={isAnalyzing || charCount < 10}
            className="gap-1.5 text-xs h-6 font-mono"
          >
            {isAnalyzing ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
            analyze
          </Button>
          {charCount < 10 && charCount > 0 && (
            <span className="text-[10px] font-mono text-muted-foreground">
              min 10 chars
            </span>
          )}
        </div>

        {/* Analysis Results */}
        {analysis && (
          <Card className="border-dashed">
            <CardContent className="p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Lightbulb className="size-3 text-amber-500" />
                  <span className="text-xs font-mono font-semibold text-foreground">analysis</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5"
                  onClick={() => setAnalysis(null)}
                >
                  <X className="size-2.5" />
                </Button>
              </div>

              {analysis.suggestedTitle && (
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-muted-foreground">title:</span>
                  <span className="font-medium">{analysis.suggestedTitle}</span>
                  <Button
                    size="sm"
                    className="h-5 px-2 text-[10px] gap-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 font-mono"
                    onClick={applySuggestedTitle}
                  >
                    apply
                  </Button>
                </div>
              )}

              {analysis.summary && (
                <p className="text-xs text-muted-foreground leading-relaxed font-mono">
                  {analysis.summary}
                </p>
              )}

              {analysis.topics && analysis.topics.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <Tag className="size-3 text-muted-foreground" />
                  {analysis.topics.map((topic, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] font-mono">
                      {topic}
                    </Badge>
                  ))}
                </div>
              )}

              {analysis.mood && (
                <div className="flex items-center gap-1 text-xs font-mono">
                  <span className="text-muted-foreground">type:</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {analysis.mood}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </TerminalFrame>
  )
}
