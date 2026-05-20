import type { Term, Document } from '@/lib/types'

export type { Term } from '@/lib/types'

export interface DictionaryViewProps {
  terms: Term[]
  isLoading: boolean
  documents: Document[]
  onTermsExtracted: () => void
}

export interface DuplicateGroup {
  original: Term
  duplicates: Term[]
}

export interface TermCardProps {
  term: Term
  onDelete: () => void
  selectionMode: boolean
  selected: boolean
  onToggleSelection: () => void
}
