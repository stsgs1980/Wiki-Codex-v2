'use client'

import { Search, X, Brain } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useRef, useEffect } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface HeaderSearchProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  semanticMode: boolean
  onSemanticToggle: () => void
}

export function HeaderSearch({
  searchQuery,
  onSearchChange,
  semanticMode,
  onSemanticToggle,
}: HeaderSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0 md:max-w-xs lg:max-w-sm">
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={semanticMode ? 'default' : 'outline'}
              size="icon"
              className={cn('size-8 shrink-0', semanticMode && 'bg-primary hover:bg-primary/90 text-primary-foreground')}
              onClick={onSemanticToggle}
            >
              <Brain className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {semanticMode ? 'Обычный поиск' : 'Семантический поиск'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div className="relative flex-1 min-w-0">
        <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 size-4', semanticMode ? 'text-terminal-accent' : 'text-muted-foreground')} />
        <Input
          ref={inputRef}
          placeholder={semanticMode ? 'AI поиск...' : 'Поиск...'}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            'w-full pl-9 pr-8',
            semanticMode && 'border-terminal-accent/50 focus-visible:ring-terminal-accent/30'
          )}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 size-6"
            onClick={() => onSearchChange('')}
          >
            <X className="size-3" />
          </Button>
        )}
      </div>
    </div>
  )
}
