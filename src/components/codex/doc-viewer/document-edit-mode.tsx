'use client'

import { X, Save, Loader2, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TerminalFrame } from '@/components/codex/terminal-frame'
import type { Category } from '@/lib/types'

interface DocumentEditModeProps {
  editTitle: string
  setEditTitle: (v: string) => void
  editContent: string
  setEditContent: (v: string) => void
  editCategoryId: string
  setEditCategoryId: (v: string) => void
  categories: Category[]
  isSaving: boolean
  onSave: () => void
  onCancel: () => void
}

export function DocumentEditMode({
  editTitle,
  setEditTitle,
  editContent,
  setEditContent,
  editCategoryId,
  setEditCategoryId,
  categories,
  isSaving,
  onSave,
  onCancel,
}: DocumentEditModeProps) {
  return (
    <TerminalFrame title="document/edit" className="m-3 sm:m-4 md:m-6 max-w-4xl mx-auto" headerRight={
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" onClick={onCancel} className="gap-1.5 text-xs h-6">
          <X className="size-3" />
          <span className="hidden sm:inline">Отмена</span>
        </Button>
        <Button onClick={onSave} disabled={isSaving} className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-6">
          {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
          {isSaving ? '...' : 'save'}
        </Button>
      </div>
    }>
      <div className="p-3 sm:p-4 flex flex-col gap-4">
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Заголовок документа"
          className="text-base font-semibold font-mono"
        />
        <div className="flex items-center gap-2">
          <FolderOpen className="size-3.5 text-muted-foreground shrink-0" />
          <Select value={editCategoryId} onValueChange={setEditCategoryId}>
            <SelectTrigger className="w-48 text-xs font-mono h-7">
              <SelectValue placeholder="Категория" />
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
        <Textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="min-h-[500px] font-mono text-sm resize-y"
          placeholder="markdown..."
        />
      </div>
    </TerminalFrame>
  )
}
