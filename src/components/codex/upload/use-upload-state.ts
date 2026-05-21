/**
 * Upload state management — useReducer instead of 9 useState.
 */
import { useReducer, useCallback } from 'react'

export type UploadStatus =
  | 'idle'
  | 'uploading'
  | 'auto-categorizing'
  | 'extracting-terms'
  | 'success'
  | 'error'
  | 'duplicate-exact'
  | 'duplicate-similar'

export interface DuplicateInfo {
  existingId: string
  existingTitle: string
  message: string
  severity: 'exact' | 'similar'
}

export interface UploadState {
  title: string
  content: string
  fileName: string
  categoryId: string
  status: UploadStatus
  errorMsg: string
  autoCategoryName: string | null
  duplicateInfo: DuplicateInfo | null
  createdDocId: string | null
}

type UploadAction =
  | { type: 'SET_TITLE'; value: string }
  | { type: 'SET_CONTENT'; value: string }
  | { type: 'SET_FILENAME'; value: string }
  | { type: 'SET_CATEGORY'; value: string }
  | { type: 'SET_STATUS'; value: UploadStatus }
  | { type: 'SET_ERROR'; message: string }
  | { type: 'SET_DUPLICATE'; info: DuplicateInfo }
  | { type: 'SET_AUTO_CATEGORY'; name: string }
  | { type: 'SET_CREATED_DOC'; id: string }
  | { type: 'RESET' }
  | { type: 'CLEAR_ERROR' }

const initialState: UploadState = {
  title: '',
  content: '',
  fileName: '',
  categoryId: 'auto',
  status: 'idle',
  errorMsg: '',
  autoCategoryName: null,
  duplicateInfo: null,
  createdDocId: null,
}

function uploadReducer(state: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    case 'SET_TITLE':
      return { ...state, title: action.value }
    case 'SET_CONTENT':
      return { ...state, content: action.value }
    case 'SET_FILENAME':
      return { ...state, fileName: action.value }
    case 'SET_CATEGORY':
      return { ...state, categoryId: action.value }
    case 'SET_STATUS':
      return { ...state, status: action.value, errorMsg: action.value === 'idle' || action.value === 'uploading' ? '' : state.errorMsg }
    case 'SET_ERROR':
      return { ...state, status: 'error', errorMsg: action.message }
    case 'SET_DUPLICATE':
      return { ...state, status: `duplicate-${action.info.severity}` as UploadStatus, duplicateInfo: action.info }
    case 'SET_AUTO_CATEGORY':
      return { ...state, autoCategoryName: action.name }
    case 'SET_CREATED_DOC':
      return { ...state, createdDocId: action.id }
    case 'CLEAR_ERROR':
      return { ...state, duplicateInfo: null, status: 'idle' }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

export function useUploadState() {
  const [state, dispatch] = useReducer(uploadReducer, initialState)

  const setTitle = useCallback((v: string) => dispatch({ type: 'SET_TITLE', value: v }), [])
  const setContent = useCallback((v: string) => dispatch({ type: 'SET_CONTENT', value: v }), [])
  const setFileName = useCallback((v: string) => dispatch({ type: 'SET_FILENAME', value: v }), [])
  const setCategoryId = useCallback((v: string) => dispatch({ type: 'SET_CATEGORY', value: v }), [])
  const setStatus = useCallback((v: UploadStatus) => dispatch({ type: 'SET_STATUS', value: v }), [])
  const setError = useCallback((m: string) => dispatch({ type: 'SET_ERROR', message: m }), [])
  const setDuplicate = useCallback((i: DuplicateInfo) => dispatch({ type: 'SET_DUPLICATE', info: i }), [])
  const setAutoCategory = useCallback((n: string) => dispatch({ type: 'SET_AUTO_CATEGORY', name: n }), [])
  const setCreatedDoc = useCallback((id: string) => dispatch({ type: 'SET_CREATED_DOC', id }), [])
  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), [])
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  return {
    state,
    setTitle,
    setContent,
    setFileName,
    setCategoryId,
    setStatus,
    setError,
    setDuplicate,
    setAutoCategory,
    setCreatedDoc,
    clearError,
    reset,
  }
}
