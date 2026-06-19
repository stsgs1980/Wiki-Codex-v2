/**
 * Single-file upload view — the original upload form, now slim.
 *
 * Action handlers and state live in use-single-upload.ts (R-02 split).
 * This file is presentational: header + form fields + status + actions +
 * duplicate dialog.
 */
'use client'

import { Upload, X, Loader2, FolderUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TerminalFrame } from '@/components/codex/terminal-frame'
import { useAppStore } from '@/lib/store'
import type { Category } from '@/lib/types'
import { useSingleUpload } from './use-single-upload'
import { DuplicateDialogs } from './duplicate-dialogs'
import { UploadStatusBar } from './upload-status-bar'
import { UploadFormFields } from './upload-form-fields'

interface UploadSingleViewProps {
  categories: Category[]
  onUploadSuccess: () => void
  onTermsExtracted: () => void
  onSwitchToFolder: () => void
}

export function UploadSingleView({
  categories,
  onUploadSuccess,
  onTermsExtracted,
  onSwitchToFolder,
}: UploadSingleViewProps) {
  const { setView } = useAppStore()
  const {
    state, fileInputRef, isDocUpdate, isUploading,
    setTitle, setContent, setCategoryId,
    handleFileSelect, handleSubmit, handleForceCreate, handleClear,
    clearError,
  } = useSingleUpload({ onUploadSuccess, onTermsExtracted })

  return (
    <TerminalFrame title="upload" className="m-3 sm:m-4 md:m-6">
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Upload className="size-5" />
            Загрузить документ
          </h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onSwitchToFolder}>
              <FolderUp className="size-4" />
              <span className="hidden sm:inline ml-1">Папка</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setView('documents')}>
              <X className="size-4" />
            </Button>
          </div>
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

          <UploadStatusBar
            status={state.status}
            autoCategoryName={state.autoCategoryName}
            errorMsg={state.errorMsg}
            isUpdate={isDocUpdate}
          />

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={state.status !== 'idle' || !state.title.trim() || !state.content.trim()}
              className="gap-2"
            >
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
