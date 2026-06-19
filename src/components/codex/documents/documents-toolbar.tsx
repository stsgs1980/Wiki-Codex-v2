'use client'

import { Star, Grid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Category, Tag } from '@/lib/types'
import { pluralDocs } from '@/lib/format'
import { cn } from '@/lib/utils'

interface DocumentsToolbarProps {
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void
  starFilter: boolean
  setStarFilter: (filter: boolean) => void
  selectedTagId: string | null
  selectedCategoryId: string | null
  setSelectedCategory: (id: string | null) => void
  tags: Tag[]
  categories: Category[]
  filteredDocsCount: number
}

export function DocumentsToolbar({
  viewMode,
  setViewMode,
  starFilter,
  setStarFilter,
  selectedTagId,
  selectedCategoryId,
  setSelectedCategory,
  tags,
  categories,
  filteredDocsCount,
}: DocumentsToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        {selectedTagId && (
          <Badge variant="secondary" className="gap-1.5">
            <span className="size-2 rounded-full tag-color-bg" style={{ '--tag-color': tags.find((t) => t.id === selectedTagId)?.color || 'var(--muted-foreground)' } as React.CSSProperties} />
            {tags.find((t) => t.id === selectedTagId)?.name || 'Тег'}
          </Badge>
        )}
        <Select
          value={selectedCategoryId || 'all'}
          onValueChange={(val) => setSelectedCategory(val === 'all' ? null : val)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Все категории" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={starFilter ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setStarFilter(!starFilter)}
          className="gap-1.5 sm:gap-2"
        >
          <Star className={cn('size-4', starFilter && 'fill-star text-star')} />
          <span className="hidden sm:inline">Избранные</span>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {filteredDocsCount} {pluralDocs(filteredDocsCount)}
        </span>
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="size-8 rounded-r-none"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="size-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="size-8 rounded-l-none"
            onClick={() => setViewMode('list')}
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
