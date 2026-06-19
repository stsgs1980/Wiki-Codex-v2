'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'
import type { Tag } from '@/lib/types'
import { cn } from '@/lib/utils'
import { SidebarTagItem } from './sidebar-tag-item'

interface TagDialogState {
  tagDialogOpen: boolean
  setTagDialogOpen: (v: boolean) => void
  tagName: string
  setTagName: (v: string) => void
  tagColor: string
  setTagColor: (v: string) => void
  isTagCreating: boolean
  handleCreateTag: () => Promise<void>
  handleDeleteTag: (id: string) => Promise<void>
}

interface SidebarTagsProps {
  tags: Tag[]
  isCollapsed: boolean
  onNavigate?: () => void
  dialog: TagDialogState
}

export function SidebarTags({
  tags,
  isCollapsed,
  onNavigate,
  dialog,
}: SidebarTagsProps) {
  const { selectedTagId, setSelectedTag, setView } = useAppStore()

  return (
    <div className="flex flex-col gap-1 px-2 py-3">
      <div className={cn('flex items-center gap-2 px-2 py-1', isCollapsed && 'justify-center')}>
        {!isCollapsed && (
          <span className="text-[10px] font-mono text-muted-foreground/80 uppercase tracking-wider flex-1">
            {'[ '}теги{' ]'}
          </span>
        )}
        {!isCollapsed && (
          <Dialog open={dialog.tagDialogOpen} onOpenChange={dialog.setTagDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="size-5 shrink-0">
                <Plus className="size-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Новый тег</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 pt-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tag-name">Название</Label>
                  <Input
                    id="tag-name"
                    placeholder="Введите название"
                    value={dialog.tagName}
                    onChange={(e) => dialog.setTagName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && dialog.handleCreateTag()}
                    autoFocus
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tag-color">Цвет</Label>
                  <div className="flex items-center gap-3">
                    <input
                      id="tag-color"
                      type="color"
                      value={dialog.tagColor}
                      onChange={(e) => dialog.setTagColor(e.target.value)}
                      className="size-9 rounded-md border border-input cursor-pointer"
                    />
                    <span className="text-sm text-muted-foreground">{dialog.tagColor}</span>
                  </div>
                </div>
                <Button
                  onClick={dialog.handleCreateTag}
                  disabled={!dialog.tagName.trim() || dialog.isTagCreating}
                >
                  {dialog.isTagCreating ? 'Создание...' : 'Создать'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <ScrollArea className="max-h-40">
        {!isCollapsed ? (
          <div className="flex flex-wrap gap-1.5 px-2">
            {tags.map((tag) => {
              const isActive = selectedTagId === tag.id
              return (
                <SidebarTagItem
                  key={tag.id}
                  tag={tag}
                  isActive={isActive}
                  onClick={() => {
                    if (isActive) {
                      setSelectedTag(null)
                    } else {
                      setSelectedTag(tag.id)
                      setView('documents')
                    }
                    onNavigate?.()
                  }}
                  onDelete={dialog.handleDeleteTag}
                />
              )
            })}
            {tags.length === 0 && (
              <span className="text-[10px] text-muted-foreground/70 font-mono">- пусто -</span>
            )}
          </div>
        ) : (
          <div className="flex justify-center px-2">
            <Badge variant="secondary" className="text-xs">
              {tags.length}
            </Badge>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
