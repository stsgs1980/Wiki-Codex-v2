'use client'

import { Sun, Moon, Plus, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { HeaderSearch } from './header-search'

interface HeaderProps {
  onMenuToggle?: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { searchQuery, setSearchQuery, currentView, setView, semanticMode, toggleSemanticMode } = useAppStore()
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const getTitle = () => {
    const sectionMap: Record<string, string> = {
      'dashboard': '~',
      'documents': '~/documents',
      'upload': '~/upload',
      'document-view': '~/documents/view',
      'notes': '~/notes',
      'note-view': '~/notes/edit',
      'dictionary': '~/terms',
      'instructions': '~/instructions',
    }
    const path = sectionMap[currentView] || '~'
    return path
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const showSearch = currentView === 'documents' || currentView === 'dashboard'

  return (
    <header className="border-b bg-card px-4 py-2.5 md:px-6 md:py-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
        {/* Left: hamburger + title */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0"
            onClick={onMenuToggle}
          >
            <Menu className="size-5" />
            <span className="sr-only">Меню</span>
          </Button>

          <h2 className="text-sm sm:text-base font-mono font-semibold tracking-tight leading-tight truncate">
            <span className="text-terminal-accent">codex</span>
            <span className="text-muted-foreground">:</span>
            <span className="text-foreground">{getTitle()}</span>
            <span className="text-terminal-accent"> $</span>
          </h2>
        </div>

        {/* Right: search + actions (ml-auto pushes to right on md+) */}
        <div className="flex items-center gap-2 md:ml-auto min-w-0">
          {showSearch && (
            <HeaderSearch
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              semanticMode={semanticMode}
              onSemanticToggle={toggleSemanticMode}
            />
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setView('upload')}
                  >
                    <Plus className="size-4" />
                    <span className="hidden sm:inline">Загрузить</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Загрузить документ</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
              >
                {theme === 'dark' ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
