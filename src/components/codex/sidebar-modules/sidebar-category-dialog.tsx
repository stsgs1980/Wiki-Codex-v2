'use client'

import {
  Sparkles,
  Loader2,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { SuggestedCategory } from './types'

export interface CategoryDialogState {
  catDialogOpen: boolean
  catName: string
  setCatName: (v: string) => void
  catColor: string
  setCatColor: (v: string) => void
  isCatCreating: boolean
  suggestions: SuggestedCategory[]
  selectedSuggestions: Set<number>
  isSuggesting: boolean
  isCreatingBulk: boolean
  showSuggestions: boolean
  handleCreateCategory: () => Promise<void>
  handleSuggestCategories: () => Promise<void>
  toggleSuggestion: (index: number) => void
  toggleAllSuggestions: () => void
  handleCreateSelected: () => Promise<void>
  handleDeleteCategory: (id: string) => Promise<void>
  closeCatDialog: () => void
  openCatDialog: () => void
}

export function CategoryDialogForm({ dialog }: { dialog: CategoryDialogState }) {
  return (
    <div className="flex flex-col gap-3 pt-2">
      {/* AI Suggest Button */}
      <Button
        variant="outline"
        onClick={dialog.handleSuggestCategories}
        disabled={dialog.isSuggesting}
        className="gap-2"
      >
        {dialog.isSuggesting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4 text-star" />
        )}
        {dialog.isSuggesting ? 'AI анализирует документы...' : 'Предложить с AI'}
      </Button>

      {/* AI Suggestions List */}
      {dialog.showSuggestions && dialog.suggestions.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Предложения ({dialog.selectedSuggestions.size}/{dialog.suggestions.length})
            </span>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={dialog.toggleAllSuggestions}>
              {dialog.selectedSuggestions.size === dialog.suggestions.length ? 'Снять все' : 'Выбрать все'}
            </Button>
          </div>
          <ScrollArea className="max-h-52">
            <div className="flex flex-col gap-2 pr-3">
              {dialog.suggestions.map((cat, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    dialog.selectedSuggestions.has(i)
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border hover:border-foreground/20 hover:bg-muted/50'
                  )}
                  onClick={() => dialog.toggleSuggestion(i)}
                >
                  <Checkbox
                    checked={dialog.selectedSuggestions.has(i)}
                    onCheckedChange={() => dialog.toggleSuggestion(i)}
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
            onClick={dialog.handleCreateSelected}
            disabled={dialog.selectedSuggestions.size === 0 || dialog.isCreatingBulk}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            {dialog.isCreatingBulk ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            {dialog.isCreatingBulk
              ? 'Создание...'
              : `Создать выбранные (${dialog.selectedSuggestions.size})`
            }
          </Button>
        </div>
      )}

      {/* Manual creation divider */}
      {dialog.showSuggestions && dialog.suggestions.length > 0 && (
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
            value={dialog.catName}
            onChange={(e) => dialog.setCatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && dialog.handleCreateCategory()}
            autoFocus={!dialog.showSuggestions || dialog.suggestions.length === 0}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cat-color">Цвет</Label>
          <div className="flex items-center gap-3">
            <input
              id="cat-color"
              type="color"
              value={dialog.catColor}
              onChange={(e) => dialog.setCatColor(e.target.value)}
              className="size-9 rounded-md border border-input cursor-pointer"
            />
            <span className="text-sm text-muted-foreground">{dialog.catColor}</span>
          </div>
        </div>
        <Button
          onClick={dialog.handleCreateCategory}
          disabled={!dialog.catName.trim() || dialog.isCatCreating}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {dialog.isCatCreating ? 'Создание...' : 'Создать вручную'}
        </Button>
      </div>
    </div>
  )
}
