'use client'

import { BookOpen, Sparkles, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface DictionaryEmptyStatesProps {
  isLoading: boolean
  termsCount: number
  filteredTermsCount: number
  documentsCount: number
  isExtracting: boolean
  onExtractAll: () => void
  onResetSearch: () => void
}

export function DictionaryEmptyStates({
  isLoading,
  termsCount,
  filteredTermsCount,
  documentsCount,
  isExtracting,
  onExtractAll,
  onResetSearch,
}: DictionaryEmptyStatesProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-3 sm:p-5 space-y-2 sm:space-y-3">
            <div className="flex items-baseline gap-2">
              <Skeleton className="h-5 sm:h-6 w-28 sm:w-40" />
              <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
            </div>
            <Skeleton className="h-3 sm:h-4 w-full" />
            <Skeleton className="h-2.5 sm:h-3 w-16 sm:w-20" />
          </div>
        ))}
      </div>
    )
  }

  if (termsCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center px-4">
        <BookOpen className="size-10 sm:h-12 sm:w-12 text-muted-foreground/40 mb-3 sm:mb-4" />
        <p className="text-sm text-muted-foreground leading-relaxed">Список терминов пуст</p>
        <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
          Загрузите документы -- термины будут извлечены автоматически
        </p>
        {documentsCount > 0 && (
          <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={onExtractAll} disabled={isExtracting}>
            <Sparkles className="size-4" />
            {isExtracting ? 'Извлечение...' : 'Извлечь из документов'}
          </Button>
        )}
      </div>
    )
  }

  if (filteredTermsCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center px-4">
        <Search className="size-10 sm:h-12 sm:w-12 text-muted-foreground/40 mb-3 sm:mb-4" />
        <p className="text-sm text-muted-foreground leading-relaxed">Ничего не найдено</p>
        <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">Попробуйте изменить запрос</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onResetSearch}>Сбросить</Button>
      </div>
    )
  }

  return null
}
