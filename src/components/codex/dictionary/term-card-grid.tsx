'use client'

import { FileText, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { motion } from 'framer-motion'
import { staggerItem, cardHover } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { TermCardProps } from './types'

export function TermCardGrid({
  term: t,
  onDelete,
  selectionMode,
  selected,
  onToggleSelection,
}: TermCardProps) {
  return (
    <motion.div variants={staggerItem} {...cardHover}>
      <Card className={cn(
        'overflow-hidden group hover:shadow-md transition-shadow border-dashed',
        selected && 'ring-2 ring-primary bg-primary/5 border-solid'
      )}>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2 mb-1 sm:mb-1.5">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              {selectionMode && (
                <Checkbox
                  checked={selected}
                  onCheckedChange={onToggleSelection}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <span className="font-semibold text-sm sm:text-base truncate font-sans">{t.term}</span>
            </div>
            {!selectionMode && (
              <Button
                variant="ghost"
                size="icon"
                className="size-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                onClick={onDelete}
                title="Удалить термин"
              >
                <Trash2 className="size-3" />
              </Button>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2 leading-relaxed font-sans">{t.translation}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground/80 line-clamp-2 sm:line-clamp-3">{t.explanation}</p>
          {t.document && (
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2">
              <FileText className="size-2.5 sm:size-3" />
              <span className="truncate">{t.document.title}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
