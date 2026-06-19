/**
 * Folder upload view — batch import a folder of documents.
 *
 * Flow:
 *   1. User picks a folder via FolderInput (webkitdirectory).
 *   2. We filter to accepted text files and show a count + category picker.
 *   3. User clicks "Загрузить" → submitBatch runs sequentially.
 *   4. FolderUploadProgress shows per-file status; FolderUploadSummary shows
 *      aggregate progress + done banner.
 *
 * R-02 split: presentational sub-components in FolderInput, FolderUploadProgress
 * and FolderUploadSummary; state in useFolderUpload; submit in submitBatch.
 */
'use client'

import { useState } from 'react'
import { Upload, X, FolderUp, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
import { FolderInput } from './folder-input'
import { FolderUploadProgress } from './folder-upload-progress'
import { FolderUploadSummary } from './folder-upload-summary'
import { useFolderUpload } from './use-folder-upload'

interface FolderUploadViewProps {
  categories: Category[]
  onUploadSuccess: () => void
  onSwitchToSingle: () => void
}

export function FolderUploadView({
  categories,
  onUploadSuccess,
  onSwitchToSingle,
}: FolderUploadViewProps) {
  const { setView } = useAppStore()
  const [categoryId, setCategoryId] = useState('auto')
  const { state, setFiles, start, reset } = useFolderUpload((progress) => {
    if (progress.succeeded + progress.updated > 0) onUploadSuccess()
  })

  const handleClose = () => setView('documents')
  const handleReset = () => { reset(); setCategoryId('auto') }

  return (
    <TerminalFrame title="folder-upload" className="m-3 sm:m-4 md:m-6">
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FolderUp className="size-5" />
            Загрузить папку
          </h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onSwitchToSingle}>
              <Upload className="size-4" />
              <span className="hidden sm:inline ml-1">Один файл</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {!state.files.length ? (
          <FolderInput onSelect={setFiles} />
        ) : (
          <div className="flex flex-col gap-5">
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
              <p className="font-medium text-foreground">📁 {state.folderName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {state.files.length} поддерживаемых файлов готово к загрузке
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Категория для всех файлов</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={state.isRunning}>
                <SelectTrigger><SelectValue placeholder="Авто-определение" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Авто (AI определит для каждого)</SelectItem>
                  <SelectItem value="none">Без категории</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {state.progress && (
              <>
                <FolderUploadSummary
                  progress={state.progress}
                  done={state.isDone}
                  running={state.isRunning}
                />
                <FolderUploadProgress results={state.progress.results} running={state.isRunning} />
              </>
            )}

            <div className="flex items-center gap-3">
              {!state.isRunning && !state.isDone && (
                <Button onClick={() => start(categoryId)} className="gap-2">
                  <Upload className="size-4" />
                  Загрузить {state.files.length} файл(ов)
                </Button>
              )}
              {state.isRunning && (
                <Button disabled className="gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Загрузка...
                </Button>
              )}
              {state.isDone && (
                <Button onClick={() => setView('documents')} className="gap-2">
                  <CheckCircle2 className="size-4" />
                  К документам
                </Button>
              )}
              <Button type="button" variant="outline" onClick={handleReset} disabled={state.isRunning}>
                Сбросить
              </Button>
            </div>
          </div>
        )}
      </div>
    </TerminalFrame>
  )
}
