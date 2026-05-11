'use client'

import { useState, useCallback, useRef } from 'react'
import {
  Upload,
  FileText,
  File,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react'
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
import { useAppStore } from '@/lib/store'
import type { Category } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { pluralTerms } from '@/lib/format'
import { TerminalFrame } from '@/components/codex/terminal-frame'

interface UploadViewProps {
  categories: Category[]
  onUploadSuccess: () => void
  onTermsExtracted: () => void
}

export function UploadView({ categories, onUploadSuccess, onTermsExtracted }: UploadViewProps) {
  const { setView } = useAppStore()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)

  const acceptedTypes = ['.md', '.txt', '.html']
  const maxFileSize = 5 * 1024 * 1024

  const validateFile = (f: File): string | null => {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase()
    if (!acceptedTypes.includes(ext)) {
      return 'Принимаются файлы .md, .txt и .html'
    }
    if (f.size > maxFileSize) {
      return 'Размер файла не должен превышать 5 МБ'
    }
    return null
  }

  const handleFileSelect = useCallback((f: File) => {
    const error = validateFile(f)
    if (error) {
      toast({
        title: 'Неверный файл',
        description: error,
        variant: 'destructive',
      })
      return
    }

    setFile(f)
    if (!title) {
      setTitle(f.name.replace(/\.[^/.]+$/, ''))
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setFileContent(e.target?.result as string)
    }
    reader.readAsText(f)
  }, [title, toast])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }, [handleFileSelect])

  const handleRemoveFile = () => {
    setFile(null)
    setFileContent('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const extractTerms = async (content: string, documentId: string) => {
    try {
      setIsExtracting(true)
      const res = await fetch('/api/terms/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, documentId }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.created > 0) {
          toast({
            title: 'Термины извлечены',
            description: `Добавлено ${data.created} ${pluralTerms(data.created)} в словарь${data.skipped > 0 ? ` (${data.skipped} пропущено)` : ''}`,
          })
          onTermsExtracted()
        } else if (data.skipped > 0) {
          toast({
            title: 'Термины уже существуют',
            description: `${data.skipped} ${pluralTerms(data.skipped)} найдено в словаре, новых нет`,
          })
        }
      }
    } catch {
      toast({
        title: 'Извлечение терминов',
        description: 'Не удалось извлечь термины, но документ сохранен',
        variant: 'destructive',
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const handleUpload = async () => {
    if (!title.trim()) {
      toast({
        title: 'Необходимо указать заголовок',
        description: 'Введите название для документа',
        variant: 'destructive',
      })
      return
    }

    if (!fileContent.trim()) {
      toast({
        title: 'Необходимо указать содержимое',
        description: 'Предоставьте содержимое файла',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    try {
      const fileType = file?.name.split('.').pop() || 'txt'
      const fileSize = file?.size || 0
      const fileName = file?.name || `${title}.txt`

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: fileContent,
          fileName,
          fileType,
          fileSize,
          categoryId: categoryId && categoryId !== 'none' ? categoryId : null,
          tagIds: [],
        }),
      })

      if (!response.ok) {
        if (response.status === 409) {
          toast({
            title: 'Документ уже существует',
            description: `"${title}" уже в базе знаний`,
            variant: 'destructive',
          })
          return
        }
        throw new Error('Не удалось загрузить документ')
      }

      const createdDocument = await response.json()

      toast({
        title: 'Документ загружен',
        description: `"${title}" успешно добавлен в базу знаний`,
      })

      onUploadSuccess()

      if (createdDocument?.id && fileContent.trim().length > 50) {
        await extractTerms(fileContent, createdDocument.id)
      }

      setView('documents')
    } catch {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить документ. Попробуйте ещё раз.',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <TerminalFrame title="upload" className="m-4 md:m-6 max-w-2xl mx-auto" headerRight={
      <Button variant="ghost" size="sm" onClick={() => setView('dashboard')} className="text-xs h-6 font-mono">
        esc
      </Button>
    }>
      <div className="p-3 sm:p-4 flex flex-col gap-4">
        {/* Drop Zone */}
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed p-6 transition-colors cursor-pointer',
            isDragging
              ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
              : file
                ? 'border-stone-300 dark:border-stone-700'
                : 'hover:border-stone-300 dark:hover:border-stone-700'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {file ? (
            <>
              <div className="flex items-center justify-center size-10 rounded-sm bg-muted">
                {file.name.endsWith('.md') ? (
                  <FileText className="size-5 text-stone-600 dark:text-stone-300" />
                ) : (
                  <File className="size-5 text-stone-600 dark:text-stone-300" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-mono font-medium text-foreground">{file.name}</p>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-mono text-muted-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveFile()
                }}
              >
                <X className="size-3 mr-1" />
                remove
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center size-10 rounded-sm bg-muted">
                <Upload className="size-5 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-mono text-muted-foreground">
                  drag & drop or click to select
                </p>
                <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">
                  .md .txt .html -- max 5 MB
                </p>
              </div>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt,.html"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFileSelect(f)
            }}
          />
        </div>

        {/* Document Details */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="doc-title" className="text-[11px] font-mono text-muted-foreground">$ title</Label>
            <Input
              id="doc-title"
              placeholder="document title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="doc-category" className="text-[11px] font-mono text-muted-foreground">$ category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="doc-category" className="font-mono text-sm h-9">
                <SelectValue placeholder="none" />
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

          {fileContent && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] font-mono text-muted-foreground">$ preview</Label>
              <Textarea
                value={fileContent.substring(0, 500) + (fileContent.length > 500 ? '...' : '')}
                readOnly
                className="min-h-28 font-mono text-xs resize-none"
              />
              {fileContent.length > 500 && (
                <p className="text-[10px] font-mono text-muted-foreground">
                  500 / {fileContent.length} chars
                </p>
              )}
            </div>
          )}
        </div>

        {/* Auto-extraction notice */}
        {fileContent && fileContent.trim().length > 50 && (
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground px-1">
            <Sparkles className="size-3 text-amber-500" />
            <span>terms will be extracted automatically</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleUpload}
            disabled={isUploading || isExtracting || !title.trim() || !fileContent.trim()}
            className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-7 font-mono"
          >
            {isUploading ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Upload className="size-3" />
            )}
            {isUploading
              ? 'uploading...'
              : isExtracting
                ? 'extracting...'
                : 'upload'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setView('dashboard')} className="text-xs h-7 font-mono">
            cancel
          </Button>
        </div>
      </div>
    </TerminalFrame>
  )
}
