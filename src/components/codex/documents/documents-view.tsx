'use client'

import { useState } from 'react'
import { FileText, Star, Grid, List, Filter, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import type { Document, Category, Tag } from '@/lib/types'
import { formatDate, formatFileSize, pluralDocs } from '@/lib/format'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { staggerContainer } from '@/lib/motion'
import { TerminalFrame } from '@/components/codex/terminal-frame'
import { DocumentCard } from './document-card'
import { DocumentListItem } from './document-list-item'

interface DocumentsViewProps {
  documents: Document[]
  categories: Category[]
  tags: Tag[]
}

export function DocumentsView({ documents, categories, tags }: DocumentsViewProps) {
  const { searchQuery, selectDocument, setView, selectedCategoryId, setSelectedCategory, selectedTagId, setSelectedTag } = useAppStore()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [starFilter, setStarFilter] = useState(false)

  const filteredDocs = starFilter
    ? documents.filter((doc) => doc.isStarred)
    : documents

  if (filteredDocs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <Search className="size-12 text-muted-foreground mb-4" />
        <h3 className="text-base font-semibold text-foreground mb-1 leading-tight">Документы не найдены</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {searchQuery || selectedCategoryId || selectedTagId || starFilter
            ? 'Попробуйте изменить параметры поиска или фильтры'
            : 'Загрузите первый документ, чтобы начать работу'}
        </p>
        <div className="flex gap-2">
          {(searchQuery || selectedCategoryId || selectedTagId || starFilter) && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                useAppStore.getState().resetFilters()
                setStarFilter(false)
              }}
            >
              <Filter className="size-4" />
              Сбросить фильтры
            </Button>
          )}
          <Button
            onClick={() => setView('upload')}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <FileText className="size-4" />
            Загрузить документ
          </Button>
        </div>
      </div>
    )
  }

  return (
    <TerminalFrame title="documents" className="m-4 md:m-6">
      <div className="flex flex-col gap-3 p-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {selectedTagId && (
            <Badge variant="secondary" className="gap-1.5">
              <span className="size-2 rounded-full tag-color-bg" style={{ '--tag-color': tags.find((t) => t.id === selectedTagId)?.color || '#78716c', backgroundColor: tags.find((t) => t.id === selectedTagId)?.color || '#78716c' } as React.CSSProperties} />
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
            {filteredDocs.length} {pluralDocs(filteredDocs.length)}
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

      {/* Documents */}
      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          <motion.div
            key="grid"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                formatDate={formatDate}
                onClick={() => {
                  selectDocument(doc.id)
                  setView('document-view')
                }}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2"
          >
            {filteredDocs.map((doc) => (
              <DocumentListItem
                key={doc.id}
                doc={doc}
                formatDate={formatDate}
                formatFileSize={formatFileSize}
                onClick={() => {
                  selectDocument(doc.id)
                  setView('document-view')
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </TerminalFrame>
  )
}
