/**
 * Duplicate detection dialog components.
 */
'use client'

import { AlertCircle, Shield } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { DuplicateInfo } from './use-upload-state'

interface DuplicateDialogsProps {
  status: string
  duplicateInfo: DuplicateInfo | null
  onCancel: () => void
  onForceCreate: () => void
}

export function DuplicateDialogs({ status, duplicateInfo, onCancel, onForceCreate }: DuplicateDialogsProps) {
  return (
    <>
      {/* Similar content warning */}
      <AlertDialog open={status === 'duplicate-similar'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-amber-500" />
              Обнаружен похожий документ
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>{duplicateInfo?.message}</p>
                <p className="text-sm text-muted-foreground">
                  Документ может быть дубликатом с небольшими изменениями.
                  Создать всё равно?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancel}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction onClick={onForceCreate} className="bg-amber-600 hover:bg-amber-700">
              Создать всё равно
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Exact duplicate — blocked */}
      <AlertDialog open={status === 'duplicate-exact'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="size-5 text-destructive" />
              Документ уже существует
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>{duplicateInfo?.message}</p>
                <p className="text-sm text-muted-foreground">
                  Точное совпадение по заголовку или содержанию. Загрузка невозможна.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={onCancel}>
              Понятно
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
