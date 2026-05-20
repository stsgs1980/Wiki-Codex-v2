'use client'

import {
  Plus,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { useAppStore } from '@/lib/store'
import type { Category } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CategoryDialogForm, type CategoryDialogState } from './sidebar-category-dialog'

interface SidebarCategoriesProps {
  categories: Category[]
  isCollapsed: boolean
  onNavigate?: () => void
  dialog: CategoryDialogState
}

export function SidebarCategories({
  categories,
  isCollapsed,
  onNavigate,
  dialog,
}: SidebarCategoriesProps) {
  const { setSelectedCategory, setView } = useAppStore()

  return (
    <div className="flex flex-col gap-1 px-2 py-3 flex-1 min-h-0">
      <div className={cn('flex items-center gap-2 px-2 py-1', isCollapsed && 'justify-center')}>
        {!isCollapsed && (
          <span className="text-[10px] font-mono text-muted-foreground/80 uppercase tracking-wider flex-1">
            {'[ '}категории{' ]'}
          </span>
        )}
        {!isCollapsed && (
          <Dialog open={dialog.catDialogOpen} onOpenChange={(open) => {
            if (open) dialog.openCatDialog()
            else dialog.closeCatDialog()
          }}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="size-5 shrink-0">
                <Plus className="size-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Добавить категории</DialogTitle>
              </DialogHeader>
              <CategoryDialogForm dialog={dialog} />
            </DialogContent>
          </Dialog>
        )}
      </div>
      <ScrollArea className="max-h-48">
        {categories.map((cat) => (
          <div key={cat.id} className="group flex items-center">
            <Button
              variant="ghost"
              className={cn(
                'flex-1 justify-start gap-2 text-xs font-mono h-7 min-w-0',
                isCollapsed && 'justify-center px-2'
              )}
              onClick={() => {
                setSelectedCategory(cat.id)
                setView('documents')
                onNavigate?.()
              }}
              title={cat.name}
            >
              <div
                className="size-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              {!isCollapsed && (
                <>
                  <span className="truncate">{cat.name}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground tabular-nums shrink-0">
                    {cat._count?.documents || 0}
                  </span>
                </>
              )}
            </Button>
            {!isCollapsed && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
                    <AlertDialogDescription>
                      &quot;{cat.name}&quot; будет удалена. Документы останутся без категории.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction onClick={() => dialog.handleDeleteCategory(cat.id)}>Удалить</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        ))}
        {!isCollapsed && categories.length === 0 && (
          <p className="text-[10px] text-muted-foreground/70 font-mono px-2">- пусто -</p>
        )}
      </ScrollArea>
    </div>
  )
}
