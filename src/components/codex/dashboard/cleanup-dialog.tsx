'use client'

import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import type { DuplicateGroup } from './types'

interface CleanupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: DuplicateGroup[]
  totalDuplicates: number
  isCleaning: boolean
  onDelete: () => void
}

/**
 * CleanupDialog — AlertDialog that lists detected duplicate groups and lets the
 * user confirm deletion. Behaviour is identical to the inline dialog in the
 * pre-refactor DashboardView (same wording, same animations, same disabled states).
 */
export function CleanupDialog({
  open,
  onOpenChange,
  groups,
  totalDuplicates,
  isCleaning,
  onDelete,
}: CleanupDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="font-mono">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-mono">Найдены дубликаты</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="flex flex-col gap-3 text-left max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              <p className="text-muted-foreground text-sm">
                Обнаружено {totalDuplicates} {totalDuplicates === 1 ? 'дубликат' : 'дубликатов'} в {groups.length} {groups.length === 1 ? 'группе' : 'группах'}. Для каждой группы будет сохранён последний изменённый документ.
              </p>
              {groups.map((group, gi) => (
                <motion.div
                  key={gi}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gi * 0.05 }}
                  className="rounded-md border border-dashed p-3"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="secondary" className="text-[10px] font-mono gap-1">
                      заголовок
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      → оставить: <span className="text-foreground">{group.keep.title}</span>
                    </span>
                  </div>
                  <ul className="flex flex-col gap-1">
                    {group.duplicates.map((dup) => (
                      <li key={dup.id} className="text-xs text-destructive/80 flex items-center gap-1.5">
                        <Trash2 className="size-3 shrink-0" />
                        {dup.title}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="font-mono text-xs" disabled={isCleaning}>
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            disabled={isCleaning}
            className="font-mono text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isCleaning ? 'Удаление...' : `Удалить дубликаты (${totalDuplicates})`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
