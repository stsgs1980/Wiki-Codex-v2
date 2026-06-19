'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { DuplicateGroup } from './types'

/**
 * useCleanup — owns all state and handlers for the "Очистить дубли" flow:
 *  - scanning for duplicate documents via /api/documents/cleanup
 *  - showing the duplicate groups in an AlertDialog
 *  - deleting the duplicates after user confirmation
 *
 * Returns the same fields the old monolithic DashboardView held inline.
 */
export function useCleanup(onCleanupComplete?: () => void) {
  const { toast } = useToast()
  const [isScanning, setIsScanning] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
  const [showCleanupDialog, setShowCleanupDialog] = useState(false)

  const handleCleanupScan = useCallback(async () => {
    setIsScanning(true)
    try {
      const res = await fetch('/api/documents/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scan' }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Ошибка сканирования')
      }

      const data = await res.json()

      if (data.totalDuplicates === 0) {
        toast({ title: 'Дубликаты не найдены' })
        return
      }

      setDuplicateGroups(data.groups)
      setShowCleanupDialog(true)
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось выполнить сканирование',
        variant: 'destructive',
      })
    } finally {
      setIsScanning(false)
    }
  }, [toast])

  const handleCleanupDelete = useCallback(async () => {
    const allDuplicateIds = duplicateGroups.flatMap((g) => g.duplicates.map((d) => d.id))
    if (allDuplicateIds.length === 0) return

    setIsCleaning(true)
    try {
      const res = await fetch('/api/documents/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids: allDuplicateIds }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Ошибка удаления')
      }

      const data = await res.json()
      setShowCleanupDialog(false)
      setDuplicateGroups([])

      toast({ title: `Удалено ${data.deleted} дубликатов` })
      onCleanupComplete?.()
    } catch (error) {
      toast({
        title: 'Ошибка удаления',
        description: error instanceof Error ? error.message : 'Не удалось удалить дубликаты',
        variant: 'destructive',
      })
    } finally {
      setIsCleaning(false)
    }
  }, [duplicateGroups, toast, onCleanupComplete])

  return {
    isScanning,
    isCleaning,
    duplicateGroups,
    showCleanupDialog,
    setShowCleanupDialog,
    handleCleanupScan,
    handleCleanupDelete,
  }
}
