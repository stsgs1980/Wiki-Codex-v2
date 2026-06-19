import type { Document, Category, Tag } from '@/lib/types'

// ── Types for cleanup API response ──────────────────────────────────────

export interface DuplicateEntry {
  id: string
  title: string
  updatedAt: string
}

export interface DuplicateGroup {
  reason: 'title'
  keep: DuplicateEntry
  duplicates: DuplicateEntry[]
}

// ── Component props ─────────────────────────────────────────────────────

export interface DashboardViewProps {
  documents: Document[]
  categories: Category[]
  tags: Tag[]
  totalDocuments: number
  totalStarred: number
  onCleanupComplete?: () => void
}

// ── Derived data shapes ─────────────────────────────────────────────────

export interface CategoryBreakdownItem extends Category {
  count: number
}

export interface StatItem {
  label: string
  value: number
  icon: React.ReactNode
}
