'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
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

interface UploadViewProps {
  categories: Category[]
  onUploadSuccess: () => void
  onTermsExtracted: () => void
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

export function UploadView({ categories, onUploadSuccess, onTermsExtracted }: UploadViewProps) {
  const { setView } = useAppStore()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [fileName, setFileName] = useState('')
  const [categoryId, setCategoryId] = useState<string>('none')
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''))
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setContent(text)
    }
    reader.readAsText(file)
  }, [title])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    setStatus('uploading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          fileName: fileName || title.trim(),
          fileType: fileName.split('.').pop() || 'md',
          fileSize: new Blob([content]).size,
          categoryId: categoryId !== 'none' ? categoryId : undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }

      setStatus('success')
      onUploadSuccess()

      // Auto-extract terms
      try {
        const doc = await res.json()
        if (doc.id) {
          await fetch('/api/terms/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId: doc.id }),
          })
          onTermsExtracted()
        }
      } catch {
        // Term extraction is optional
      }

      // Reset after brief success display
      setTimeout(() => {
        setTitle('')
        setContent('')
        setFileName('')
        setCategoryId('none')
        setStatus('idle')
        setView('documents')
      }, 1500)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  const handleClear = () => {
    setTitle('')
    setContent('')
    setFileName('')
    setCategoryId('none')
    setStatus('idle')
    setErrorMsg('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

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
          {/* File drop area */}
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileText className="size-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-1">
              Нажмите для выбора файла или перетащите сюда
            </p>
            <p className="text-xs text-muted-foreground/60">
              Поддерживаются текстовые файлы (.md, .txt, .json)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt,.json,.js,.ts,.py,.yaml,.yml,.toml,.xml,.html,.css"
              className="hidden"
              onChange={handleFileSelect}
            />
            {fileName && (
              <p className="mt-2 text-sm font-medium text-primary">{fileName}</p>
            )}
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Заголовок</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название документа"
              required
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <Label>Категория</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Без категории" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без категории</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="content">Содержание</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Вставьте текст или выберите файл выше"
              className="min-h-[200px] font-mono text-sm"
              required
            />
          </div>

          {/* Status message */}
          {status === 'success' && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-terminal-accent/10 text-terminal-accent">
              <CheckCircle2 className="size-4" />
              <span className="text-sm">Документ загружен успешно!</span>
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive">
              <AlertCircle className="size-4" />
              <span className="text-sm">{errorMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={status === 'uploading' || !title.trim() || !content.trim()}
              className="gap-2"
            >
              {status === 'uploading' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {status === 'uploading' ? 'Загрузка...' : 'Загрузить'}
            </Button>
            <Button type="button" variant="outline" onClick={handleClear}>
              Очистить
            </Button>
          </div>
        </form>
      </div>
    </TerminalFrame>
  )
}
