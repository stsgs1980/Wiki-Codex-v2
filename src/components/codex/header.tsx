'use client'

import { Search, X, Sun, Moon, Plus, Brain, Menu } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useRef, useEffect, useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface HeaderProps {
  onMenuToggle?: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { searchQuery, setSearchQuery, currentView, setView, semanticMode, toggleSemanticMode } = useAppStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
            <div className="flex items-center gap-1.5 flex-1 min-w-0 md:max-w-xs lg:max-w-sm">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={semanticMode ? 'default' : 'outline'}
                      size="icon"
                      className={cn('size-8 shrink-0', semanticMode && 'bg-violet-600 hover:bg-violet-700 text-white')}
                      onClick={toggleSemanticMode}
                    >
                      <Brain className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {semanticMode ? 'Обычный поиск' : 'Семантический поиск'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="relative flex-1 min-w-0">
                <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 size-4', semanticMode ? 'text-violet-500' : 'text-muted-foreground')} />
                <Input
                  ref={inputRef}
                  placeholder={semanticMode ? 'AI поиск...' : 'Поиск...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    'w-full pl-9 pr-8',
                    semanticMode && 'border-violet-500/50 focus-visible:ring-violet-500/30'
                  )}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 size-6"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="size-3" />
                  </Button>
                )}
              </div>
            </div>
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
