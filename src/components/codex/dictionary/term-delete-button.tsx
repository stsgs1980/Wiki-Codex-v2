'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TermDeleteButtonProps {
  onDelete: () => void
  /** Visual variant: ghost icon (compact row/grid) or outlined (expanded mobile). */
  variant?: 'icon' | 'outlined'
  className?: string
}

/**
 * Delete control for a term card. Always renders as a real <button> so it must
 * NOT be nested inside another <button> (HTML forbids it and React will throw
 * a hydration error). When used inside a div[role=button] row, stopPropagation
 * is handled here so the row's onClick does not also fire.
 */
export function TermDeleteButton({
  onDelete,
  variant = 'icon',
  className,
}: TermDeleteButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onDelete()
  }

  if (variant === 'outlined') {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn(
          'mt-2 gap-1.5 text-xs text-destructive hover:text-destructive sm:hidden',
          className,
        )}
        onClick={handleClick}
      >
        <Trash2 className="size-3" />
        Удалить
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'size-6 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0',
        className,
      )}
      onClick={handleClick}
      title="Удалить термин"
      aria-label="Удалить термин"
    >
      <Trash2 className="size-3" />
    </Button>
  )
}
