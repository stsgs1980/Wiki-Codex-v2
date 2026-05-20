import type { Category, Tag } from '@/lib/types'
import type { ViewType } from '@/lib/store'

export interface SidebarContentProps {
  categories: Category[]
  tags: Tag[]
  documentsCount?: number
  termsCount?: number
  notesCount?: number
  instructionsCount?: number
  onCategoryCreated?: () => void
  onTagCreated?: () => void
  onCategoryDeleted?: () => void
  onTagDeleted?: () => void
  onNavigate?: () => void
  collapsed: boolean
  alwaysExpanded?: boolean
}

export interface SuggestedCategory {
  name: string
  description: string
  color: string
}

export interface SidebarProps {
  categories: Category[]
  tags: Tag[]
  documentsCount?: number
  termsCount?: number
  notesCount?: number
  instructionsCount?: number
  onCategoryCreated?: () => void
  onTagCreated?: () => void
  onCategoryDeleted?: () => void
  onTagDeleted?: () => void
  onNavigate?: () => void
}

export interface MobileSidebarProps extends SidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export interface NavItem {
  icon: React.ReactNode
  label: string
  view: ViewType
  count?: number
}
