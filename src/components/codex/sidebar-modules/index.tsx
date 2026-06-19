'use client'

import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { SidebarContent } from './sidebar-content'
import type { SidebarProps, MobileSidebarProps } from './types'

export function Sidebar(props: SidebarProps) {
  const { sidebarCollapsed } = useAppStore()

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r bg-card transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <SidebarContent collapsed={sidebarCollapsed} {...props} />
    </aside>
  )
}

export function MobileSidebar({ open, onOpenChange, ...sidebarProps }: MobileSidebarProps) {
  const onNavigate = () => onOpenChange(false)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 pt-6 overflow-hidden">
        <SheetTitle className="sr-only">Навигация</SheetTitle>
        <div className="flex flex-col h-full">
          <SidebarContent collapsed={false} onNavigate={onNavigate} alwaysExpanded {...sidebarProps} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
