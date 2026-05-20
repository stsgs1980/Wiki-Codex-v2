'use client'

import {
  LayoutDashboard,
  FileText,
  StickyNote,
  BookA,
  ClipboardList,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { NavItem } from './types'

interface SidebarNavProps {
  documentsCount?: number
  termsCount?: number
  notesCount?: number
  instructionsCount?: number
  isCollapsed: boolean
  onNavigate?: () => void
}

const buildNavItems = (props: {
  documentsCount?: number
  termsCount?: number
  notesCount?: number
  instructionsCount?: number
}): NavItem[] => [
  { icon: <LayoutDashboard className="size-4" />, label: 'Панель управления', view: 'dashboard' },
  { icon: <FileText className="size-4" />, label: 'Документы', view: 'documents', count: props.documentsCount },
  { icon: <StickyNote className="size-4" />, label: 'Заметки', view: 'notes', count: props.notesCount },
  { icon: <BookA className="size-4" />, label: 'Термины', view: 'dictionary', count: props.termsCount },
  { icon: <ClipboardList className="size-4" />, label: 'Инструкции', view: 'instructions', count: props.instructionsCount },
]

export function SidebarNav({
  documentsCount = 0,
  termsCount = 0,
  notesCount = 0,
  instructionsCount = 0,
  isCollapsed,
  onNavigate,
}: SidebarNavProps) {
  const { currentView, setView } = useAppStore()

  const navItems = buildNavItems({ documentsCount, termsCount, notesCount, instructionsCount })

  return (
    <nav className="flex flex-col gap-0.5 px-2 py-2">
      {navItems.map((item) => {
        const isActive = currentView === item.view
        return (
          <Button
            key={item.view}
            variant="ghost"
            className={cn(
              'justify-start gap-2 font-mono text-xs h-8',
              isCollapsed && 'justify-center px-2',
              isActive && 'bg-muted/80 text-foreground'
            )}
            onClick={() => { setView(item.view); onNavigate?.() }}
            title={item.label}
          >
            <span className={cn(
              'text-[10px] select-none shrink-0',
              isActive ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground/50'
            )}>
              {isActive ? '>' : '-'}
            </span>
            {!isCollapsed && (
              <>
                <span className={cn('truncate', isActive && 'text-foreground font-semibold')}>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className="ml-auto text-[10px] text-muted-foreground tabular-nums shrink-0">{item.count}</span>
                )}
              </>
            )}
          </Button>
        )
      })}
    </nav>
  )
}
