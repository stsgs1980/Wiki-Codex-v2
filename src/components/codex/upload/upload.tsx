'use client'

import { useRef, useCallback } from 'react'
import { Upload, FileText, X, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TerminalFrame } from '@/components/codex/terminal-frame'
import { useAppStore } from '@/lib/store'
import type { Category } from '@/lib/types'
import { useUploadState } from './use-upload-state'
import { submitDocument, autoCategorizeDocument, extractTerms } from './use-upload-actions'
import { DuplicateDialogs } from './duplicate-dialogs'
import { UploadStatusBar } from './upload-status-bar'

interface UploadViewProps {
  categories: Category[]
  onUploadSuccess: () => void
  onTermsExtracted: () => void
}

export function UploadView({ categories, onUploadSuccess, onTermsExtracted }: UploadViewProps) {
  const { setView } = useAppStore()
  const {
    state,
    setTitle, setContent, setFileName, setCategoryId,
    setStatus, setError, setDuplicate, setAutoCategory, setCreatedDoc,
    clearError, reset,
  } = useUploadState()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    if (!state.title) setTitle(file.name.replace(/\.[^/.]+$/, ''))
    const reader = new FileReader()
    reader.onload = (ev) => setContent(ev.target?.result as string)
    reader.readAsText(file)
  }, [state.title, setFileName, setTitle, setContent])

  const handlePostCreate = async (docId: string) => {
    if (state.categoryId === 'auto') {
      setStatus('auto-categorizing')
      const catName = await autoCategorizeDocument(docId)
      if (catName) setAutoCategory(catName)
    }
    setStatus('extracting-terms')
    await extractTerms(docId)
    onTermsExtracted()
    setStatus('success')
    onUploadSuccess()
    setTimeout(() => { reset(); setView('documents') }, 2500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!state.title.trim() || !state.content.trim()) return
    setStatus('uploading')
    const result = await submitDocument(state)
    if (result.duplicate) { setDuplicate(result.duplicate); return }
    if (!result.success) { setError(result.error || 'Ошибка загрузки'); return }
    if (result.docId) { setCreatedDoc(result.docId); await handlePostCreate(result.docId) }
  }

  const handleForceCreate = async () => {
    setStatus('uploading')
    const result = await submitDocument(state, true)
    if (!result.success) { setError(result.error || 'Ошибка загрузки'); return }
    if (result.docId) { setCreatedDoc(result.docId); await handlePostCreate(result.docId) }
  }

  const handleClear = () => {
    reset()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const isUploading = state.status === 'uploading'

  return (
    <TerminalFrame title="upload" className="m-3 sm:m-4 md:m-6">
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Upload className="size-5" />
            Загрузить документ
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setView('documents')}>
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* File drop */}
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileText className="size-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-1">
              Нажмите для выбора файла или перетащите сюда
            </p>
            <p className="text-xs text-muted-foreground/60">
              Поддерживаются текстовые файлы (.md, .txt, .json, .js, .ts, .py)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt,.json,.js,.ts,.py,.yaml,.yml,.toml,.xml,.html,.css"
              className="hidden"
              onChange={handleFileSelect}
            />
            {state.fileName && (
              <p className="mt-2 text-sm font-medium text-primary">{state.fileName}</p>
            )}
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Заголовок</Label>
            <Input id="title" value={state.title} onChange={(e) => setTitle(e.target.value)} placeholder="Название документа" required />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <Label className="flex items-center gap-2">
              Категория
              <span className="text-xs text-violet-500 font-normal flex items-center gap-1">
                <Sparkles className="size-3" />
                AI автоматически определит
              </span>
            </Label>
            <Select value={state.categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Авто-определение" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">
                  <span className="flex items-center gap-2"><Sparkles className="size-3.5 text-violet-500" /> Авто (AI определит)</span>
                </SelectItem>
                <SelectItem value="none">Без категории</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full inline-block" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="content">Содержание</Label>
            <Textarea id="content" value={state.content} onChange={(e) => setContent(e.target.value)} placeholder="Вставьте текст или выберите файл выше" className="min-h-[200px] font-mono text-sm" required />
          </div>

          {/* Status */}
          <UploadStatusBar
            status={state.status}
            autoCategoryName={state.autoCategoryName}
            errorMsg={state.errorMsg}
          />

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={state.status !== 'idle' || !state.title.trim() || !state.content.trim()} className="gap-2">
              {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {isUploading ? 'Загрузка...' : 'Загрузить'}
            </Button>
            <Button type="button" variant="outline" onClick={handleClear}>
              Очистить
            </Button>
          </div>
        </form>

        <DuplicateDialogs
          status={state.status}
          duplicateInfo={state.duplicateInfo}
          onCancel={clearError}
          onForceCreate={handleForceCreate}
        />
      </div>
    </TerminalFrame>
  )
}
