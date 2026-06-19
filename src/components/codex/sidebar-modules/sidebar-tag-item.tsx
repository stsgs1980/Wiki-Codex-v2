'use client'

import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import type { Tag } from '@/lib/types'

interface SidebarTagItemProps {
  tag: Tag
  isActive: boolean
  onClick: () => void
  onDelete: (id: string) => void
}

export function SidebarTagItem({
  tag,
  isActive,
  onClick,
  onDelete,
}: SidebarTagItemProps) {
  return (
    <div className="group relative inline-flex">
      <Badge
        variant="outline"
        className={cn(
          'text-xs cursor-pointer transition-colors',
          isActive
            ? 'font-medium tag-color-bg tag-color-border tag-color-text'
            : 'hover:bg-accent tag-color-text tag-color-border'
        )}
        style={{ '--tag-color': tag.color } as React.CSSProperties}
        onClick={onClick}
      >
        {tag.name}
      </Badge>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            className="absolute -top-1.5 -right-1.5 size-3.5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
            onClick={(e) => e.stopPropagation()}
          >
            <X className="size-2" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить тег?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{tag.name}&quot; будет удалён. Связи с документами будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(tag.id)}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
