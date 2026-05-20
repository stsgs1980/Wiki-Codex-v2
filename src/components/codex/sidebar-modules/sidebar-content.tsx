'use client'

import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import { NeuroLogo } from '@/components/codex/neuro-logo'
import { useCategoryDialog } from './use-category-dialog'
import { useTagDialog } from './use-tag-dialog'
import { SidebarNav } from './sidebar-nav'
import { SidebarCategories } from './sidebar-categories'
import { SidebarTags } from './sidebar-tags'
import type { SidebarContentProps } from './types'

export function SidebarContent({
  categories,
  tags,
  documentsCount = 0,
  termsCount = 0,
  notesCount = 0,
  instructionsCount = 0,
  onCategoryCreated,
  onTagCreated,
  onCategoryDeleted,
  onTagDeleted,
  onNavigate,
  collapsed,
  alwaysExpanded = false,
}: SidebarContentProps) {
  const { toggleSidebar } = useAppStore()

  // When alwaysExpanded, treat as not collapsed
  const isCollapsed = alwaysExpanded ? false : collapsed

  const categoryDialog = useCategoryDialog({ onCategoryCreated, onCategoryDeleted })
  const tagDialog = useTagDialog({ onTagCreated, onTagDeleted })

  return (
    <>
      {/* Brand */}
      <div className="flex items-center gap-2 px-3 py-4">
        <NeuroLogo size="sm" className="shrink-0 text-foreground" />
        {!isCollapsed && (
          <div className="flex flex-col gap-0.5 min-w-0">
            <h1 className="text-sm font-bold tracking-tight text-foreground leading-tight font-mono">
              Wiki Codex
            </h1>
            <span className="text-[9px] font-mono text-neuro-brand tracking-widest uppercase">
              NEURO
            </span>
          </div>
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <SidebarNav
        documentsCount={documentsCount}
        termsCount={termsCount}
        notesCount={notesCount}
        instructionsCount={instructionsCount}
        isCollapsed={isCollapsed}
        onNavigate={onNavigate}
      />

      <Separator />

      {/* Categories */}
      <SidebarCategories
        categories={categories}
        isCollapsed={isCollapsed}
        onNavigate={onNavigate}
        dialog={categoryDialog}
      />

      <Separator />

      {/* Tags */}
      <SidebarTags
        tags={tags}
        isCollapsed={isCollapsed}
        onNavigate={onNavigate}
        dialog={tagDialog}
      />

      {/* Collapse Toggle -- only on desktop */}
      {!alwaysExpanded && (
        <>
          <Separator />
          <div className="px-2 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center font-mono text-xs text-muted-foreground"
              onClick={toggleSidebar}
            >
              {isCollapsed ? (
                <span className="text-terminal-accent">{'[..]'}</span>
              ) : (
                <span>{'[ - ]'}</span>
              )}
            </Button>
          </div>
        </>
      )}
    </>
  )
}
