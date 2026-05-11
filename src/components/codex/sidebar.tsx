'use client'

import { useState } from 'react'
import {
  BookOpen,
  LayoutDashboard,
  FileText,
  FolderOpen,
  Tags,
  StickyNote,
  BookA,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Loader2,
  Check,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { useAppStore, type ViewType } from '@/lib/store'
import type { Category, Tag } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { NeuroLogo } from '@/components/codex/neuro-logo'

interface SidebarContentProps {
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

interface SuggestedCategory {
  name: string
  description: string
  color: string
}

function SidebarContent({
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
  const {
    currentView,
    setView,
    setSelectedCategory,
    setSelectedTag,
    selectedTagId,
    toggleSidebar,
  } = useAppStore()

  const { toast } = useToast()

  // Category dialog
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [catName, setCatName] = useState('')
  const [catColor, setCatColor] = useState('#78716c')
  const [isCatCreating, setIsCatCreating] = useState(false)

  // AI suggestions
  const [suggestions, setSuggestions] = useState<SuggestedCategory[]>([])
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set())
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isCreatingBulk, setIsCreatingBulk] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Tag dialog
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [tagName, setTagName] = useState('')
  const [tagColor, setTagColor] = useState('#78716c')
  const [isTagCreating, setIsTagCreating] = useState(false)

  // When alwaysExpanded, treat as not collapsed
  const isCollapsed = alwaysExpanded ? false : collapsed

  const navItems: { icon: React.ReactNode; label: string; view: ViewType; count?: number }[] = [
    { icon: <LayoutDashboard className="size-4" />, label: 'Панель управления', view: 'dashboard' },
    { icon: <FileText className="size-4" />, label: 'Документы', view: 'documents', count: documentsCount },
    { icon: <StickyNote className="size-4" />, label: 'Заметки', view: 'notes', count: notesCount },
    { icon: <BookA className="size-4" />, label: 'Термины', view: 'dictionary', count: termsCount },
    { icon: <ClipboardList className="size-4" />, label: 'Инструкции', view: 'instructions', count: instructionsCount },
  ]

  const handleCreateCategory = async () => {
    if (!catName.trim()) return
    setIsCatCreating(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName.trim(), color: catColor }),
      })
      if (res.ok) {
        toast({ title: 'Категория создана', description: catName.trim() })
        setCatName('')
        setCatColor('#78716c')
        setCatDialogOpen(false)
        onCategoryCreated?.()
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось создать категорию', variant: 'destructive' })
    } finally {
      setIsCatCreating(false)
    }
  }

  const handleSuggestCategories = async () => {
    setIsSuggesting(true)
    setShowSuggestions(true)
    setSuggestions([])
    setSelectedSuggestions(new Set())
    try {
      const res = await fetch('/api/categories/suggest', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.categories && data.categories.length > 0) {
          setSuggestions(data.categories)
          setSelectedSuggestions(new Set(data.categories.map((_: SuggestedCategory, i: number) => i)))
        } else {
          toast({
            title: 'Нет предложений',
            description: data.message || 'AI не смог предложить новые категории',
          })
        }
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось получить предложения', variant: 'destructive' })
    } finally {
      setIsSuggesting(false)
    }
  }

  const toggleSuggestion = (index: number) => {
    setSelectedSuggestions((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const toggleAllSuggestions = () => {
    if (selectedSuggestions.size === suggestions.length) {
      setSelectedSuggestions(new Set())
    } else {
      setSelectedSuggestions(new Set(suggestions.map((_, i) => i)))
    }
  }

  const handleCreateSelected = async () => {
    const selected = suggestions.filter((_, i) => selectedSuggestions.has(i))
    if (selected.length === 0) return
    setIsCreatingBulk(true)
    try {
      let created = 0
      for (const cat of selected) {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cat.name, description: cat.description, color: cat.color }),
        })
        if (res.ok) created++
      }
      toast({
        title: 'Категории созданы',
        description: `${created} из ${selected.length} категорий добавлено`,
      })
      setSuggestions([])
      setSelectedSuggestions(new Set())
      setShowSuggestions(false)
      setCatDialogOpen(false)
      onCategoryCreated?.()
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось создать все категории', variant: 'destructive' })
    } finally {
      setIsCreatingBulk(false)
    }
  }

  const handleCreateTag = async () => {
    if (!tagName.trim()) return
    setIsTagCreating(true)
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName.trim(), color: tagColor }),
      })
      if (res.ok) {
        toast({ title: 'Тег создан', description: tagName.trim() })
        setTagName('')
        setTagColor('#78716c')
        setTagDialogOpen(false)
        onTagCreated?.()
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось создать тег', variant: 'destructive' })
    } finally {
      setIsTagCreating(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Категория удалена' })
        onCategoryDeleted?.()
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить категорию', variant: 'destructive' })
    }
  }

  const handleDeleteTag = async (id: string) => {
    try {
      const res = await fetch(`/api/tags?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Тег удалён' })
        onTagDeleted?.()
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить тег', variant: 'destructive' })
    }
  }

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
            <span className="text-[9px] font-mono text-[#FA3913] tracking-widest uppercase">
              NEURO
            </span>
          </div>
        )}
      </div>

      <Separator />

      {/* Navigation */}
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

      <Separator />

      {/* Categories */}
      <div className="flex flex-col gap-1 px-2 py-3 flex-1 min-h-0">
        <div className={cn('flex items-center gap-2 px-2 py-1', isCollapsed && 'justify-center')}>
          {!isCollapsed && (
            <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider flex-1">
              {'[ '}категории{' ]'}
            </span>
          )}
          {!isCollapsed && (
            <Dialog open={catDialogOpen} onOpenChange={(open) => {
              setCatDialogOpen(open)
              if (!open) {
                setShowSuggestions(false)
                setSuggestions([])
                setSelectedSuggestions(new Set())
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="size-5 shrink-0">
                  <Plus className="size-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Добавить категории</DialogTitle>
                </DialogHeader>

                {/* AI Suggest Button */}
                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleSuggestCategories}
                    disabled={isSuggesting}
                    className="gap-2"
                  >
                    {isSuggesting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Sparkles className="size-4 text-amber-500" />
                    )}
                    {isSuggesting ? 'AI анализирует документы...' : 'Предложить с AI'}
                  </Button>

                  {/* AI Suggestions List */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          Предложения ({selectedSuggestions.size}/{suggestions.length})
                        </span>
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={toggleAllSuggestions}>
                          {selectedSuggestions.size === suggestions.length ? 'Снять все' : 'Выбрать все'}
                        </Button>
                      </div>
                      <ScrollArea className="max-h-52">
                        <div className="flex flex-col gap-2 pr-3">
                          {suggestions.map((cat, i) => (
                            <div
                              key={i}
                              className={cn(
                                'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                                selectedSuggestions.has(i)
                                  ? 'border-primary/50 bg-primary/5'
                                  : 'border-border hover:border-foreground/20 hover:bg-muted/50'
                              )}
                              onClick={() => toggleSuggestion(i)}
                            >
                              <Checkbox
                                checked={selectedSuggestions.has(i)}
                                onCheckedChange={() => toggleSuggestion(i)}
                                className="mt-0.5"
                              />
                              <div className="flex flex-col gap-1 flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="size-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: cat.color }}
                                  />
                                  <span className="text-sm font-semibold truncate leading-tight">{cat.name}</span>
                                </div>
                                {cat.description && (
                                  <span className="text-xs text-muted-foreground line-clamp-2">
                                    {cat.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <Button
                        onClick={handleCreateSelected}
                        disabled={selectedSuggestions.size === 0 || isCreatingBulk}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                      >
                        {isCreatingBulk ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Check className="size-4" />
                        )}
                        {isCreatingBulk
                          ? 'Создание...'
                          : `Создать выбранные (${selectedSuggestions.size})`
                        }
                      </Button>
                    </div>
                  )}

                  {/* Manual creation divider */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="flex items-center gap-3">
                      <Separator className="flex-1" />
                      <span className="text-xs text-muted-foreground">или вручную</span>
                      <Separator className="flex-1" />
                    </div>
                  )}

                  {/* Manual creation */}
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="cat-name">Название</Label>
                      <Input
                        id="cat-name"
                        placeholder="Введите название"
                        value={catName}
                        onChange={(e) => setCatName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                        autoFocus={!showSuggestions || suggestions.length === 0}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="cat-color">Цвет</Label>
                      <div className="flex items-center gap-3">
                        <input
                          id="cat-color"
                          type="color"
                          value={catColor}
                          onChange={(e) => setCatColor(e.target.value)}
                          className="size-9 rounded-md border border-input cursor-pointer"
                        />
                        <span className="text-sm text-muted-foreground">{catColor}</span>
                      </div>
                    </div>
                    <Button
                      onClick={handleCreateCategory}
                      disabled={!catName.trim() || isCatCreating}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {isCatCreating ? 'Создание...' : 'Создать вручную'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <ScrollArea className="max-h-48">
          {categories.map((cat) => (
            <div key={cat.id} className="group flex items-center">
              <Button
                variant="ghost"
                className={cn(
                  'flex-1 justify-start gap-2 text-xs font-mono h-7 min-w-0',
                  isCollapsed && 'justify-center px-2'
                )}
                onClick={() => {
                  setSelectedCategory(cat.id)
                  setView('documents')
                  onNavigate?.()
                }}
                title={cat.name}
              >
                <div
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                {!isCollapsed && (
                  <>
                    <span className="truncate">{cat.name}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground tabular-nums shrink-0">
                      {cat._count?.documents || 0}
                    </span>
                  </>
                )}
              </Button>
              {!isCollapsed && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-5 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
                      <AlertDialogDescription>
                        &quot;{cat.name}&quot; будет удалена. Документы останутся без категории.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteCategory(cat.id)}>Удалить</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
          {!isCollapsed && categories.length === 0 && (
            <p className="text-[10px] text-muted-foreground/50 font-mono px-2">- пусто -</p>
          )}
        </ScrollArea>
      </div>

      <Separator />

      {/* Tags */}
      <div className="flex flex-col gap-1 px-2 py-3">
        <div className={cn('flex items-center gap-2 px-2 py-1', isCollapsed && 'justify-center')}>
          {!isCollapsed && (
            <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider flex-1">
              {'[ '}теги{' ]'}
            </span>
          )}
          {!isCollapsed && (
            <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="size-5 shrink-0">
                  <Plus className="size-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Новый тег</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 pt-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tag-name">Название</Label>
                    <Input
                      id="tag-name"
                      placeholder="Введите название"
                      value={tagName}
                      onChange={(e) => setTagName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                      autoFocus
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tag-color">Цвет</Label>
                    <div className="flex items-center gap-3">
                      <input
                        id="tag-color"
                        type="color"
                        value={tagColor}
                        onChange={(e) => setTagColor(e.target.value)}
                        className="size-9 rounded-md border border-input cursor-pointer"
                      />
                      <span className="text-sm text-muted-foreground">{tagColor}</span>
                    </div>
                  </div>
                  <Button
                    onClick={handleCreateTag}
                    disabled={!tagName.trim() || isTagCreating}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isTagCreating ? 'Создание...' : 'Создать'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <ScrollArea className="max-h-40">
          {!isCollapsed ? (
            <div className="flex flex-wrap gap-1.5 px-2">
              {tags.map((tag) => {
                const isActive = selectedTagId === tag.id
                return (
                  <div key={tag.id} className="group relative inline-flex">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs cursor-pointer transition-colors',
                        isActive
                          ? 'font-medium'
                          : 'hover:bg-accent'
                      )}
                      style={isActive
                        ? { backgroundColor: tag.color + '20', borderColor: tag.color, color: tag.color }
                        : { borderColor: tag.color, color: tag.color }
                      }
                      onClick={() => {
                        if (isActive) {
                          setSelectedTag(null)
                        } else {
                          setSelectedTag(tag.id)
                          setView('documents')
                        }
                        onNavigate?.()
                      }}
                    >
                      {tag.name}
                    </Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="absolute -top-1.5 -right-1.5 size-3.5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <X className="size-2" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Удалить тег?</AlertDialogTitle>
                          <AlertDialogDescription>
                            &quot;{tag.name}&quot; будет удалён. Связи с документами будут удалены.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteTag(tag.id)}>Удалить</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )
              })}
              {tags.length === 0 && (
                <span className="text-[10px] text-muted-foreground/50 font-mono">- пусто -</span>
              )}
            </div>
          ) : (
            <div className="flex justify-center px-2">
              <Badge variant="secondary" className="text-xs">
                {tags.length}
              </Badge>
            </div>
          )}
        </ScrollArea>
      </div>

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
                <span className="text-green-600 dark:text-green-400">{'[..]'}</span>
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

// --- Desktop Sidebar ---
interface SidebarProps {
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

// --- Mobile Sidebar (Sheet Drawer) ---
interface MobileSidebarProps extends SidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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
