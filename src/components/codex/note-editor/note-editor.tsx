'use client'

import { useReducer, useEffect, useState, useCallback } from 'react'
import { TerminalFrame } from '@/components/codex/terminal-frame'
import { useToast } from '@/hooks/use-toast'
import type { Note } from '@/lib/types'
import { NoteAnalysisCard } from './note-analysis-card'
import type { NoteAnalysis } from './note-analysis-card'
import { NoteEditorToolbar, NoteEditorAnalyzeButton } from './note-editor-toolbar'
import { NoteEditorForm } from './note-editor-form'

interface NoteEditorProps {
  note: Note | null
  onSave: (data: { title: string; content: string }) => void
  onCancel: () => void
  onDelete: () => void
  isSaving: boolean
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
    <TerminalFrame title={note ? 'note/edit' : 'note/new'} className="m-3 sm:m-4 md:m-6 max-w-3xl mx-auto" headerRight={
      <NoteEditorToolbar
        note={note}
        isSaving={isSaving}
        isSaveDisabled={isSaveDisabled}
        onSave={handleSave}
        onCancel={onCancel}
        onDelete={onDelete}
      />
    }>
      <div className="p-3 sm:p-4 flex flex-col gap-4">
        <NoteEditorForm
          title={state.title}
          content={state.content}
          onTitleChange={(value) => dispatch({ type: 'SET_TITLE', value })}
          onContentChange={(value) => dispatch({ type: 'SET_CONTENT', value })}
        />

        {/* AI Analysis Button */}
        <NoteEditorAnalyzeButton
          isAnalyzing={isAnalyzing}
          charCount={charCount}
          onAnalyze={handleAnalyze}
        />

        {/* Analysis Results */}
        {analysis && (
          <NoteAnalysisCard
            analysis={analysis}
            onDismiss={() => setAnalysis(null)}
            onApplyTitle={applySuggestedTitle}
          />
        )}
      </div>
    </TerminalFrame>
  )
}
