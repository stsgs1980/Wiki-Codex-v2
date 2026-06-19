'use client'

import { FileText, Copy, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getTermPlural } from './utils'
import type { DuplicateGroup } from './types'

interface DuplicateGroupCardProps {
  group: DuplicateGroup
  mergeKeepOverrides: Record<string, string>
  isMerging: string | null
  onMergeKeepOverride: (groupId: string, keepId: string) => void
  onMergeGroup: (group: DuplicateGroup) => void
}

export function DuplicateGroupCard({
  group,
  mergeKeepOverrides,
  isMerging,
  onMergeKeepOverride,
  onMergeGroup,
}: DuplicateGroupCardProps) {
  const keepId = mergeKeepOverrides[group.original.id] || group.original.id
  const allTerms = [group.original, ...group.duplicates]

  return (
    <div className="border rounded-lg p-3 sm:p-4 space-y-3">
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
                : 'border-border bg-muted/50 hover:bg-muted'
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
                  <span className="text-3xs sm:text-xs text-muted-foreground ml-1.5">(основной)</span>
                )}
              </div>
              <div className="text-3xs sm:text-xs text-muted-foreground truncate">
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

      <p className="text-3xs sm:text-xs text-muted-foreground" id="merge-hint">
        Выберите термин, который нужно сохранить. Остальные будут удалены и объединены с выбранным.
      </p>

      <Button
        size="sm"
        className="w-full gap-2"
        onClick={() => onMergeGroup(group)}
        disabled={isMerging === group.original.id}
        aria-describedby="merge-hint"
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
}
