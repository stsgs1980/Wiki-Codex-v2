'use client'

import { useState } from 'react'
import { FileText, Filter, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import type { Document, Category, Tag } from '@/lib/types'
import { formatDate, formatFileSize } from '@/lib/format'
import { motion, AnimatePresence } from 'framer-motion'
import { staggerContainer } from '@/lib/motion'
import { TerminalFrame } from '@/components/codex/terminal-frame'
import { DocumentCard } from './document-card'
import { DocumentListItem } from './document-list-item'
import { DocumentsToolbar } from './documents-toolbar'

interface DocumentsViewProps {
  documents: Document[]
  categories: Category[]
  tags: Tag[]
}

export function DocumentsView({ documents, categories, tags }: DocumentsViewProps) {
  const { searchQuery, selectDocument, setView, selectedCategoryId, setSelectedCategory, selectedTagId } = useAppStore()
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
            className="gap-2"
          >
            <FileText className="size-4" />
            Загрузить документ
          </Button>
        </div>
      </div>
    )
  }

  return (
    <TerminalFrame title="documents" className="m-3 sm:m-4 md:m-6">
      <h1 className="sr-only">Документы</h1>
      <div className="flex flex-col gap-3 p-4">
      {/* Toolbar */}
      <DocumentsToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        starFilter={starFilter}
        setStarFilter={setStarFilter}
        selectedTagId={selectedTagId}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategory={setSelectedCategory}
        tags={tags}
        categories={categories}
        filteredDocsCount={filteredDocs.length}
      />

      {/* Documents */}
      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          <motion.ul
            key="grid"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0 }}
            className="list-none p-0 m-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
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
          </motion.ul>
        ) : (
          <motion.ul
            key="list"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0 }}
            className="list-none p-0 m-0 flex flex-col gap-2"
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
          </motion.ul>
        )}
      </AnimatePresence>
      </div>
    </TerminalFrame>
  )
}
