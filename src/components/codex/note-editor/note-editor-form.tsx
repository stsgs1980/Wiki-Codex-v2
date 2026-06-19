'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { pluralize } from '@/lib/format'

interface NoteEditorFormProps {
  title: string
  content: string
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
}

export function NoteEditorForm({ title, content, onTitleChange, onContentChange }: NoteEditorFormProps) {
  const charCount = content.length

  return (
    <>
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note-title" className="text-2xs font-mono text-muted-foreground">$ title</Label>
        <Input
          id="note-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Заголовок заметки"
          className="font-mono text-sm"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="note-content" className="text-2xs font-mono text-muted-foreground">$ content</Label>
          <span className="text-3xs font-mono text-muted-foreground tabular-nums">
            {charCount} {pluralize(charCount, ['char', 'chars', 'chars'])}
          </span>
        </div>
        <Textarea
          id="note-content"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Напишите заметку..."
          className="min-h-[400px] font-mono text-sm resize-y"
        />
      </div>
    </>
  )
}
