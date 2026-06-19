'use client'

import { CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getTermPlural } from './utils'
import { DuplicateGroupCard } from './duplicate-group-card'
import type { DuplicateGroup } from './types'

interface DuplicatesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  duplicateGroups: DuplicateGroup[]
  totalDuplicates: number
  isMerging: string | null
  mergeKeepOverrides: Record<string, string>
  onMergeKeepOverride: (groupId: string, keepId: string) => void
  onMergeGroup: (group: DuplicateGroup) => void
  onClose: () => void
}

export function DuplicatesDialog({
  open,
  onOpenChange,
  duplicateGroups,
  totalDuplicates,
  isMerging,
  mergeKeepOverrides,
  onMergeKeepOverride,
  onMergeGroup,
  onClose,
}: DuplicatesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => {
      onOpenChange(o)
      if (!o) onMergeKeepOverride('__clear__', '')
    }}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Найденные дубликаты</DialogTitle>
          <DialogDescription>
            {duplicateGroups.length === 0
              ? 'Дубликаты не найдены'
              : `${duplicateGroups.length} ${duplicateGroups.length === 1 ? 'группа' : getTermPlural(duplicateGroups.length).replace('термин', 'групп').replace('термина', 'группы').replace('терминов', 'групп')} дубликатов (${totalDuplicates} ${getTermPlural(totalDuplicates)})`
            }
          </DialogDescription>
        </DialogHeader>

        {duplicateGroups.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            <CheckSquare className="size-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Все термины уникальны</p>
          </div>
        )}

        {duplicateGroups.length > 0 && (
          <div className="space-y-4 mt-2">
            {duplicateGroups.map((group) => (
              <DuplicateGroupCard
                key={group.original.id}
                group={group}
                mergeKeepOverrides={mergeKeepOverrides}
                isMerging={isMerging}
                onMergeKeepOverride={onMergeKeepOverride}
                onMergeGroup={onMergeGroup}
              />
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
