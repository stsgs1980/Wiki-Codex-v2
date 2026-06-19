/**
 * Upload form fields — presentational sub-component.
 * Pure JSX: file drop zone, title input, category select, content textarea.
 * All state and handlers are owned by the parent (upload.tsx).
 */
'use client'

import { FileText, Sparkles } from 'lucide-react'
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
import type { Category } from '@/lib/types'

export interface UploadFormFieldsProps {
  title: string
  onTitleChange: (value: string) => void
  content: string
  onContentChange: (value: string) => void
  fileName: string
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFileInputClick: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  categories: Category[]
  selectedCategoryId: string
  onCategoryChange: (value: string) => void
}

export function UploadFormFields({
  title, onTitleChange,
  content, onContentChange,
  fileName, onFileSelect, onFileInputClick, fileInputRef,
  categories, selectedCategoryId, onCategoryChange,
}: UploadFormFieldsProps) {
  return (
    <>
      {/* File drop — label-input association triggers the file dialog on both click and keyboard */}
      <label
        htmlFor="upload-file-input"
        className="block border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
      >
        <FileText className="size-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-1">
          Нажмите для выбора файла или перетащите сюда
        </p>
        <p className="text-xs text-muted-foreground/60" id="upload-file-hint">
          Поддерживаются текстовые файлы (.md, .txt, .json, .js, .ts, .py)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          id="upload-file-input"
          accept=".md,.txt,.json,.js,.ts,.py,.yaml,.yml,.toml,.xml,.html,.css"
          className="sr-only"
          onChange={onFileSelect}
          aria-describedby="upload-file-hint"
        />
        {fileName && (
          <p className="mt-2 text-sm font-medium text-primary">{fileName}</p>
        )}
      </label>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Заголовок</Label>
        <Input id="title" value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder="Название документа" required />
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1.5">
        <Label className="flex items-center gap-2">
          Категория
          <span className="text-xs text-terminal-accent font-normal flex items-center gap-1">
            <Sparkles className="size-3" />
            AI автоматически определит
          </span>
        </Label>
        <Select value={selectedCategoryId} onValueChange={onCategoryChange}>
          <SelectTrigger><SelectValue placeholder="Авто-определение" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">
              <span className="flex items-center gap-2"><Sparkles className="size-3.5 text-terminal-accent" /> Авто (AI определит)</span>
            </SelectItem>
            <SelectItem value="none">Без категории</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full inline-block tag-color-bg" style={{ '--tag-color': cat.color } as React.CSSProperties} />
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
        <Textarea id="content" value={content} onChange={(e) => onContentChange(e.target.value)} placeholder="Вставьте текст или выберите файл выше" className="min-h-[200px] font-mono text-sm" required />
      </div>
    </>
  )
}
