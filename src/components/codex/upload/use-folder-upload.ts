/**
 * useFolderUpload — state hook for folder batch upload.
 *
 * Owns: pending file list, running state, progress snapshot, abort flag.
 * Does NOT own: UI presentation or side-effects after completion (caller
 * wires onProgress and onComplete via the hook return value).
 */
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { submitBatch } from './submit-batch'
import type { BatchFile, BatchProgress } from './submit-batch-types'

export interface FolderUploadState {
  folderName: string
  files: BatchFile[]
  isRunning: boolean
  isDone: boolean
  progress: BatchProgress | null
}

const initialState: FolderUploadState = {
  folderName: '',
  files: [],
  isRunning: false,
  isDone: false,
  progress: null,
}

function deriveTitle(file: File): string {
  // Strip extension; replace path separators with " — " for readability
  const noExt = file.name.replace(/\.[^/.]+$/, '')
  return noExt
}

export function useFolderUpload(onComplete?: (p: BatchProgress) => void) {
  const [state, setState] = useState<FolderUploadState>(initialState)
  const cancelRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const setFiles = useCallback((files: File[], folderName: string) => {
    const batchFiles: BatchFile[] = files.map((f) => ({
      file: f,
      title: deriveTitle(f),
      relativePath: f.webkitRelativePath || f.name,
    }))
    cancelRef.current = false
    setState({
      folderName,
      files: batchFiles,
      isRunning: false,
      isDone: false,
      progress: null,
    })
  }, [])

  const start = useCallback(
    async (categoryId: string) => {
      if (state.isRunning || state.files.length === 0) return

      setState((s) => ({ ...s, isRunning: true, isDone: false, progress: null }))

      // Local progress snapshot — submitBatch calls onProgress with the
      // full snapshot, but we must respect the cancel flag between files.
      // submitBatch itself doesn't support cancellation (fetch in flight),
      // but we can short-circuit if user cancels mid-batch.
      const final = await submitBatch(state.files, {
        categoryId,
        onProgress: (p) => {
          if (cancelRef.current) return
          setState((s) => ({ ...s, progress: p }))
        },
      })

      setState((s) => ({
        ...s,
        isRunning: false,
        isDone: true,
        progress: cancelRef.current ? s.progress : final,
      }))
      onCompleteRef.current?.(final)
    },
    [state.isRunning, state.files],
  )

  const cancel = useCallback(() => {
    cancelRef.current = true
    setState((s) => ({ ...s, isRunning: false, isDone: true }))
  }, [])

  const reset = useCallback(() => {
    cancelRef.current = true
    setState(initialState)
  }, [])

  return { state, setFiles, start, cancel, reset }
}
