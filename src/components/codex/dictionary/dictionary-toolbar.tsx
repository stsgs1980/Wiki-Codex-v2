'use client'

import { Search, Grid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface DictionaryToolbarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  groupedTerms: [string, unknown[]][]
}

export function DictionaryToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  groupedTerms,
}: DictionaryToolbarProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 sm:size-4 text-muted-foreground" />
        <Input
          placeholder="Поиск терминов..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 text-sm"
        />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {!searchQuery.trim() && (
          <div className="hidden md:flex gap-1">
            {groupedTerms.map(([letter]) => (
              <button
                key={letter}
                className="w-7 h-7 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-center"
                onClick={() => {
                  const el = document.getElementById(`group-${letter}`)
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                {letter}
              </button>
            ))}
          </div>
        )}
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="size-7 sm:size-8 rounded-r-none"
            onClick={() => onViewModeChange('grid')}
          >
            <Grid className="size-3.5 sm:size-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="size-7 sm:size-8 rounded-l-none"
            onClick={() => onViewModeChange('list')}
          >
            <List className="size-3.5 sm:size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
