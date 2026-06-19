'use client'

import { useRef, useCallback, useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TerminalFrame } from '@/components/codex/terminal-frame'
import { useAppStore } from '@/lib/store'
import type { Category } from '@/lib/types'
import { useUploadState } from './use-upload-state'
import { submitDocument, autoCategorizeDocument, extractTerms } from './use-upload-actions'
import { DuplicateDialogs } from './duplicate-dialogs'
import { UploadStatusBar } from './upload-status-bar'
import { UploadFormFields } from './upload-form-fields'

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

  const [isDocUpdate, setIsDocUpdate] = useState(false)

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
    if (result.docId) { setIsDocUpdate(!!result.updated); setCreatedDoc(result.docId); await handlePostCreate(result.docId) }
  }

  const handleForceCreate = async () => {
    setStatus('uploading')
    const result = await submitDocument(state, true)
    if (!result.success) { setError(result.error || 'Ошибка загрузки'); return }
    if (result.docId) { setIsDocUpdate(!!result.updated); setCreatedDoc(result.docId); await handlePostCreate(result.docId) }
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
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Upload className="size-5" />
            Загрузить документ
          </h1>
          <Button variant="ghost" size="sm" onClick={() => setView('documents')}>
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <UploadFormFields
            title={state.title}
            onTitleChange={setTitle}
            content={state.content}
            onContentChange={setContent}
            fileName={state.fileName}
            onFileSelect={handleFileSelect}
            onFileInputClick={() => fileInputRef.current?.click()}
            fileInputRef={fileInputRef}
            categories={categories}
            selectedCategoryId={state.categoryId}
            onCategoryChange={setCategoryId}
          />

          {/* Status */}
          <UploadStatusBar
            status={state.status}
            autoCategoryName={state.autoCategoryName}
            errorMsg={state.errorMsg}
            isUpdate={isDocUpdate}
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
