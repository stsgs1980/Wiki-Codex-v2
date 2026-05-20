'use client'

import { FileText, CheckSquare, Copy, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { getTermPlural } from './utils'
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
            {duplicateGroups.map((group) => {
              const keepId = mergeKeepOverrides[group.original.id] || group.original.id
              const allTerms = [group.original, ...group.duplicates]
              return (
                <div key={group.original.id} className="border rounded-lg p-3 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm truncate">
                      {group.original.term}
                    </span>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {group.duplicates.length + 1} {getTermPlural(group.duplicates.length + 1)}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {allTerms.map((t) => (
                      <label
                        key={t.id}
                        className={cn(
                          'flex items-center gap-2 sm:gap-3 rounded-md border px-2.5 sm:px-3 py-2 cursor-pointer transition-colors',
                          t.id === keepId
                            ? 'border-primary/50 bg-primary/5'
                            : 'border-transparent bg-muted/50 hover:bg-muted'
                        )}
                      >
                        <input
                          type="radio"
                          name={`keep-${group.original.id}`}
                          checked={t.id === keepId}
                          onChange={() => onMergeKeepOverride(group.original.id, t.id)}
                          className="accent-primary shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-semibold truncate leading-tight">
                            {t.term}
                            {t.id === group.original.id && (
                              <span className="text-[10px] sm:text-xs text-muted-foreground ml-1.5">(основной)</span>
                            )}
                          </div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            {t.translation}
                          </div>
                        </div>
                        {t.document && (
                          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <FileText className="size-3" />
                            <span className="truncate max-w-24">{t.document.title}</span>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>

                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Выберите термин, который нужно сохранить. Остальные будут удалены и объединены с выбранным.
                  </p>

                  <Button
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => onMergeGroup(group)}
                    disabled={isMerging === group.original.id}
                  >
                    {isMerging === group.original.id ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Объединение...
                      </>
                    ) : (
                      <>
                        <Copy className="size-4" />
                        Объединить все
                      </>
                    )}
                  </Button>
                </div>
              )
            })}
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
