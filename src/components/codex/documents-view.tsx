'use client'

import { useState } from 'react'
import {
  FileText,
  Star,
  Grid,
  List,
  Filter,
  File,
  Search,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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
import { TerminalFrame } from '@/components/codex/terminal-frame'

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

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'md':
        return <FileText className="size-5 text-muted-foreground" />
      case 'html':
        return <FileText className="size-5 text-blue-500" />
      default:
        return <File className="size-5 text-muted-foreground" />
    }
  }

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
              <span className="size-2 rounded-full" style={{ backgroundColor: tags.find((t) => t.id === selectedTagId)?.color || '#78716c' }} />
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
            <Star className={cn('size-4', starFilter && 'fill-amber-500 text-amber-500')} />
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                getFileIcon={getFileIcon}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2"
          >
            {filteredDocs.map((doc) => (
              <DocumentListItem
                key={doc.id}
                doc={doc}
                getFileIcon={getFileIcon}
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

function DocumentCard({
  doc,
  getFileIcon,
  formatDate,
  onClick,
}: {
  doc: Document
  getFileIcon: (t: string) => React.ReactNode
  formatDate: (d: string) => string
  onClick: () => void
}) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all hover:border-foreground/20 group"
      onClick={onClick}
    >
      <CardContent className="pt-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {getFileIcon(doc.fileType)}
            <h3 className="font-semibold text-sm text-foreground line-clamp-1 leading-tight group-hover:text-muted-foreground transition-colors">
              {doc.title}
            </h3>
          </div>
          {doc.isStarred && (
            <Star className="size-3.5 text-amber-500 fill-amber-500 shrink-0" />
          )}
        </div>

        {doc.summary && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {doc.summary}
          </p>
        )}

        <div className="flex flex-wrap gap-1 mb-3">
          {doc.tags.slice(0, 3).map((dt) => (
            <Badge
              key={dt.tag.id}
              variant="outline"
              className="text-xs px-1.5 py-0"
              style={{ borderColor: dt.tag.color, color: dt.tag.color }}
            >
              {dt.tag.name}
            </Badge>
          ))}
          {doc.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              +{doc.tags.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {doc.category && (
              <span
                className="inline-flex items-center gap-1"
                style={{ color: doc.category.color }}
              >
                <span
                  className="size-1.5 rounded-full inline-block"
                  style={{ backgroundColor: doc.category.color }}
                />
                {doc.category.name}
              </span>
            )}
          </div>
          <span>{formatDate(doc.updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function DocumentListItem({
  doc,
  getFileIcon,
  formatDate,
  formatFileSize,
  onClick,
}: {
  doc: Document
  getFileIcon: (t: string) => React.ReactNode
  formatDate: (d: string) => string
  formatFileSize: (s: number) => string
  onClick: () => void
}) {
  return (
    <button
      className="flex items-center gap-3 rounded-md border border-dashed p-3 text-left hover:bg-accent/50 transition-colors w-full font-mono group"
      onClick={onClick}
    >
      <span className="text-green-600 dark:text-green-400 text-xs shrink-0 select-none">$</span>
      <div className="flex items-center justify-center size-8 rounded-sm bg-muted shrink-0">
        {getFileIcon(doc.fileType)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate leading-tight">{doc.title}</span>
          {doc.isStarred && (
            <Star className="size-3.5 text-amber-500 fill-amber-500 shrink-0" />
          )}
        </div>
        {doc.summary && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 font-sans">
            {doc.summary}
          </p>
        )}
      </div>
      <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground shrink-0">
        {doc.category && (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 font-mono"
            style={{ backgroundColor: doc.category.color + '20', color: doc.category.color }}
          >
            {doc.category.name}
          </Badge>
        )}
        <span>{formatFileSize(doc.fileSize)}</span>
        <span>{formatDate(doc.updatedAt)}</span>
      </div>
    </button>
  )
}
