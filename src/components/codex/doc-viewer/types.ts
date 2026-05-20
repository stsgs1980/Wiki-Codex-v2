import type { Document, Category } from '@/lib/types'

export interface RelatedDocument extends Document {
  similarityScore: number
  reason: string
}

export interface DocumentViewerProps {
  document: Document
  categories: Category[]
  onDelete: (id: string) => void
  onUpdate: (doc: Document) => void
  onAnalysisApplied: (doc: Document) => void
}
