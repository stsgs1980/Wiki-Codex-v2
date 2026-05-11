export interface Category {
  id: string
  name: string
  description: string | null
  color: string
  sortOrder: number
  createdAt: string
  updatedAt: string
  _count?: { documents: number }
}

export interface Tag {
  id: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
  _count?: { documents: number }
}

export interface DocumentTag {
  documentId: string
  tagId: string
  tag: Tag
}

export interface Document {
  id: string
  title: string
  content: string
  summary: string | null
  fileType: string
  fileSize: number
  fileName: string
  categoryId: string | null
  isStarred: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
  category: Category | null
  tags: DocumentTag[]
}

export interface DocumentsResponse {
  documents: Document[]
  total: number
  allTotal: number
  allStarred: number
  page: number
  limit: number
  totalPages: number
}

export interface AIAnalysis {
  summary: string
  suggestedCategory: { id: string; name: string } | null
  suggestedNewCategory: string | null
  matchedTags: { id: string; name: string; color: string }[]
  newTagNames: string[]
}

export interface Term {
  id: string
  term: string
  translation: string
  explanation: string
  usage: string | null
  documentId: string | null
  document: { id: string; title: string } | null
  createdAt: string
  updatedAt: string
}

export interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}
