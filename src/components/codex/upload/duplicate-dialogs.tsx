/**
 * Duplicate detection dialog components.
 */
'use client'

import { AlertCircle, Shield, RefreshCw } from 'lucide-react'
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

      {/* Exact duplicate — allow update or force create */}
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
                  Можно обновить существующий документ или создать копию.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel onClick={onCancel}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction onClick={onForceCreate} className="bg-primary hover:bg-primary/90 gap-1.5">
              <RefreshCw className="size-3.5" />
              Обновить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
