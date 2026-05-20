'use client'

import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { getTermPlural } from './utils'
import type { Term } from '@/lib/types'

interface DeleteDialogsProps {
  deleteTarget: Term | null
  setDeleteTarget: (v: Term | null) => void
  isDeleting: boolean
  handleDeleteTerm: () => void
  showBatchDeleteDialog: boolean
  setShowBatchDeleteDialog: (v: boolean) => void
  isBatchDeleting: boolean
  selectedCount: number
  handleBatchDelete: () => void
}

export function DeleteDialogs({
  deleteTarget,
  setDeleteTarget,
  isDeleting,
  handleDeleteTerm,
  showBatchDeleteDialog,
  setShowBatchDeleteDialog,
  isBatchDeleting,
  selectedCount,
  handleBatchDelete,
}: DeleteDialogsProps) {
  return (
    <>
      {/* Delete single term confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удаление термина</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить термин &quot;{deleteTarget?.term}&quot;? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTerm}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1" />
                  Удаление...
                </>
              ) : (
                'Удалить'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch delete confirmation dialog */}
      <AlertDialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удаление терминов</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить {selectedCount} {getTermPlural(selectedCount)}? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBatchDeleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              disabled={isBatchDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isBatchDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1" />
                  Удаление...
                </>
              ) : (
                'Удалить'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
