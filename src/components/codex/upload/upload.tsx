'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle, Sparkles, Shield } from 'lucide-react'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TerminalFrame } from '@/components/codex/terminal-frame'
import { useAppStore } from '@/lib/store'
import type { Category } from '@/lib/types'

interface UploadViewProps {
  categories: Category[]
  onUploadSuccess: () => void
  onTermsExtracted: () => void
}

type UploadStatus = 'idle' | 'uploading' | 'dedup-check' | 'auto-categorizing' | 'extracting-terms' | 'success' | 'error' | 'duplicate-exact' | 'duplicate-similar'

interface DuplicateInfo {
  existingId: string
  existingTitle: string
  message: string
  severity: 'exact' | 'similar'
}

export function UploadView({ categories, onUploadSuccess, onTermsExtracted }: UploadViewProps) {
  const { setView } = useAppStore()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [fileName, setFileName] = useState('')
  const [categoryId, setCategoryId] = useState<string>('auto')
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [autoCategoryName, setAutoCategoryName] = useState<string | null>(null)
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateInfo | null>(null)
  const [createdDocId, setCreatedDocId] = useState<string | null>(null)
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
    setAutoCategoryName(null)
    setDuplicateInfo(null)

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
          categoryId: categoryId !== 'auto' && categoryId !== 'none' ? categoryId : undefined,
        }),
      })

      if (res.status === 409) {
        const data = await res.json()
        if (data.severity === 'exact') {
          setStatus('duplicate-exact')
          setDuplicateInfo({
            existingId: data.existingId,
            existingTitle: data.existingTitle,
            message: data.error,
            severity: 'exact',
          })
          return
        }
        if (data.severity === 'similar') {
          setStatus('duplicate-similar')
          setDuplicateInfo({
            existingId: data.existingId,
            existingTitle: data.existingTitle,
            message: data.error,
            severity: 'similar',
          })
          return
        }
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }

      const doc = await res.json()
      setCreatedDocId(doc.id)

      // Step 2: Auto-categorize if "auto" selected
      if (categoryId === 'auto') {
        setStatus('auto-categorizing')
        try {
          const catRes = await fetch('/api/documents/auto-categorize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId: doc.id }),
          })

          if (catRes.ok) {
            const catData = await catRes.json()
            if (catData.autoAssigned && catData.category) {
              setAutoCategoryName(catData.category.name)
            }
          }
        } catch {
          // Auto-categorization is optional, continue
        }
      }

      // Step 3: Auto-extract terms
      setStatus('extracting-terms')
      try {
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

      setStatus('success')
      onUploadSuccess()

      // Reset after success display
      setTimeout(() => {
        setTitle('')
        setContent('')
        setFileName('')
        setCategoryId('auto')
        setStatus('idle')
        setAutoCategoryName(null)
        setDuplicateInfo(null)
        setCreatedDocId(null)
        setView('documents')
      }, 2500)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  const handleForceCreate = async () => {
    if (!title.trim() || !content.trim()) return

    setStatus('uploading')
    setDuplicateInfo(null)

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
          categoryId: categoryId !== 'auto' && categoryId !== 'none' ? categoryId : undefined,
          forceCreate: true,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }

      const doc = await res.json()
      setCreatedDocId(doc.id)

      // Auto-categorize
      if (categoryId === 'auto') {
        setStatus('auto-categorizing')
        try {
          const catRes = await fetch('/api/documents/auto-categorize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId: doc.id }),
          })

          if (catRes.ok) {
            const catData = await catRes.json()
            if (catData.autoAssigned && catData.category) {
              setAutoCategoryName(catData.category.name)
            }
          }
        } catch {
          // Optional
        }
      }

      // Extract terms
      setStatus('extracting-terms')
      try {
        await fetch('/api/terms/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: doc.id }),
        })
        onTermsExtracted()
      } catch {
        // Optional
      }

      setStatus('success')
      onUploadSuccess()

      setTimeout(() => {
        setTitle('')
        setContent('')
        setFileName('')
        setCategoryId('auto')
        setStatus('idle')
        setAutoCategoryName(null)
        setDuplicateInfo(null)
        setCreatedDocId(null)
        setView('documents')
      }, 2500)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  const handleClear = () => {
    setTitle('')
    setContent('')
    setFileName('')
    setCategoryId('auto')
    setStatus('idle')
    setErrorMsg('')
    setAutoCategoryName(null)
    setDuplicateInfo(null)
    setCreatedDocId(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const statusMessage = () => {
    switch (status) {
      case 'dedup-check':
        return { icon: <Shield className="size-4 animate-pulse" />, text: 'Проверка на дубликаты...', color: 'text-amber-600' }
      case 'auto-categorizing':
        return { icon: <Sparkles className="size-4 animate-pulse" />, text: 'AI определяет категорию...', color: 'text-violet-600' }
      case 'extracting-terms':
        return { icon: <Loader2 className="size-4 animate-spin" />, text: 'Извлечение терминов...', color: 'text-terminal-accent' }
      case 'success':
        return {
          icon: <CheckCircle2 className="size-4" />,
          text: autoCategoryName
            ? `Загружено! AI категория: ${autoCategoryName}`
            : 'Документ загружен успешно!',
          color: 'text-emerald-600',
        }
      case 'error':
        return { icon: <AlertCircle className="size-4" />, text: errorMsg, color: 'text-destructive' }
      default:
        return null
    }
  }

  const sm = statusMessage()

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

          {/* Category — with auto option */}
          <div className="flex flex-col gap-1.5">
            <Label className="flex items-center gap-2">
              Категория
              <span className="text-xs text-violet-500 font-normal flex items-center gap-1">
                <Sparkles className="size-3" />
                AI автоматически определит
              </span>
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Авто-определение" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">
                  <span className="flex items-center gap-2">
                    <Sparkles className="size-3.5 text-violet-500" />
                    Авто (AI определит)
                  </span>
                </SelectItem>
                <SelectItem value="none">Без категории</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full inline-block"
                        style={{ backgroundColor: cat.color }}
                      />
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
          {sm && (
            <div className={`flex items-center gap-2 p-3 rounded-md ${
              status === 'success' ? 'bg-emerald-500/10' :
              status === 'error' ? 'bg-destructive/10' :
              'bg-violet-500/10'
            } ${sm.color}`}>
              {sm.icon}
              <span className="text-sm">{sm.text}</span>
            </div>
          )}

          {/* Dedup protection badge */}
          {status === 'idle' && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="size-3.5" />
              <span>Защита от дубликатов: по заголовку, хешу контента и семантическому сходству</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={status !== 'idle' && status !== 'duplicate-similar' && status !== 'duplicate-exact' || !title.trim() || !content.trim()}
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

        {/* Duplicate alert dialog — similar content */}
        <AlertDialog open={status === 'duplicate-similar'}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="size-5 text-amber-500" />
                Обнаружен похожий документ
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2">
                  <p>{duplicateInfo?.message}</p>
                  <p className="text-sm text-muted-foreground">
                    Документ может быть дубликатом с небольшими изменениями.
                    Создать всё равно?
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setStatus('idle'); setDuplicateInfo(null) }}>
                Отмена
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleForceCreate} className="bg-amber-600 hover:bg-amber-700">
                Создать всё равно
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Duplicate alert dialog — exact match */}
        <AlertDialog open={status === 'duplicate-exact'}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Shield className="size-5 text-destructive" />
                Документ уже существует
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2">
                  <p>{duplicateInfo?.message}</p>
                  <p className="text-sm text-muted-foreground">
                    Точное совпадение по заголовку или содержанию. Загрузка невозможна.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => { setStatus('idle'); setDuplicateInfo(null) }}>
                Понятно
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TerminalFrame>
  )
}
