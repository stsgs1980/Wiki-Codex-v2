/**
 * use-single-upload — action handlers extracted from UploadSingleView (R-02).
 *
 * Owns: post-create side-effect flow (auto-categorize → extract-terms →
 * success → redirect). Submit / force-create / clear are bound to the
 * UploadState dispatchers; this hook just composes them into callbacks the
 * view can wire directly to the form.
 */
'use client'

import { useCallback, useRef, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { useUploadState } from './use-upload-state'
import {
  submitDocument,
  autoCategorizeDocument,
  extractTerms,
} from './use-upload-actions'

interface UseSingleUploadArgs {
  onUploadSuccess: () => void
  onTermsExtracted: () => void
}

export function useSingleUpload({ onUploadSuccess, onTermsExtracted }: UseSingleUploadArgs) {
  const { setView } = useAppStore()
  const {
    state,
    setTitle, setContent, setFileName, setCategoryId,
    setStatus, setError, setDuplicate, setAutoCategory, setCreatedDoc,
    clearError, reset,
  } = useUploadState()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDocUpdate, setIsDocUpdate] = useState(false)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    if (!state.title) setTitle(file.name.replace(/\.[^/.]+$/, ''))
    const reader = new FileReader()
    reader.onload = (ev) => setContent(ev.target?.result as string)
    reader.readAsText(file)
  }, [state.title, setFileName, setTitle, setContent])

  const handlePostCreate = useCallback(async (docId: string) => {
    if (state.categoryId === 'auto') {
      setStatus('auto-categorizing')
      const catName = await autoCategorizeDocument(docId)
      if (catName) setAutoCategory(catName)
    }
    setStatus('extracting-terms')
    await extractTerms(docId)
    onTermsExtracted()
    setStatus('success')
    onUploadSuccess()
    setTimeout(() => { reset(); setView('documents') }, 2500)
  }, [state.categoryId, setStatus, setAutoCategory, onTermsExtracted, onUploadSuccess, reset, setView])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!state.title.trim() || !state.content.trim()) return
    setStatus('uploading')
    const result = await submitDocument(state)
    if (result.duplicate) { setDuplicate(result.duplicate); return }
    if (!result.success) { setError(result.error || 'Ошибка загрузки'); return }
    if (result.docId) {
      setIsDocUpdate(!!result.updated)
      setCreatedDoc(result.docId)
      await handlePostCreate(result.docId)
    }
  }, [state, setStatus, setDuplicate, setError, setCreatedDoc, handlePostCreate])

  const handleForceCreate = useCallback(async () => {
    setStatus('uploading')
    const result = await submitDocument(state, true)
    if (!result.success) { setError(result.error || 'Ошибка загрузки'); return }
    if (result.docId) {
      setIsDocUpdate(!!result.updated)
      setCreatedDoc(result.docId)
      await handlePostCreate(result.docId)
    }
  }, [state, setStatus, setError, setCreatedDoc, handlePostCreate])

  const handleClear = useCallback(() => {
    reset()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [reset])

  return {
    state,
    fileInputRef,
    isDocUpdate,
    isUploading: state.status === 'uploading',
    setTitle, setContent, setCategoryId,
    handleFileSelect, handleSubmit, handleForceCreate, handleClear,
    clearError,
    duplicateInfo: state.duplicateInfo,
    status: state.status,
    autoCategoryName: state.autoCategoryName,
    errorMsg: state.errorMsg,
  }
}
