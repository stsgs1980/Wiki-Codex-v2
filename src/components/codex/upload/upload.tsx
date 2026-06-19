/**
 * Upload view — entry point for document uploads.
 *
 * Two modes:
 *   - 'single' — UploadSingleView (the original single-file form with manual
 *     title / content editing, AI categorization and term extraction).
 *   - 'folder' — FolderUploadView (batch import a folder of text files).
 *
 * Mode toggle is local state (no store pollution) — user picks whichever
 * flow fits the current task. Default is 'single' to preserve existing UX.
 */
'use client'

import { useState } from 'react'
import type { Category } from '@/lib/types'
import { UploadSingleView } from './upload-single-view'
import { FolderUploadView } from './folder-upload-view'

interface UploadViewProps {
  categories: Category[]
  onUploadSuccess: () => void
  onTermsExtracted: () => void
}

export function UploadView({ categories, onUploadSuccess, onTermsExtracted }: UploadViewProps) {
  const [mode, setMode] = useState<'single' | 'folder'>('single')

  if (mode === 'folder') {
    return (
      <FolderUploadView
        categories={categories}
        onUploadSuccess={onUploadSuccess}
        onSwitchToSingle={() => setMode('single')}
      />
    )
  }

  return (
    <UploadSingleView
      categories={categories}
      onUploadSuccess={onUploadSuccess}
      onTermsExtracted={onTermsExtracted}
      onSwitchToFolder={() => setMode('folder')}
    />
  )
}
