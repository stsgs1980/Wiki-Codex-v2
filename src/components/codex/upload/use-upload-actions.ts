/**
 * Upload actions — API calls and orchestration.
 * Separated from UI to keep upload.tsx under 200 lines.
 */
import type { UploadState } from './use-upload-state'
import type { DuplicateInfo } from './use-upload-state'

/**
 * Normalizes file extension to a valid fileType.
 * Maps common extensions to our accepted enum values.
 */
function normalizeFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || 'md'
  const validTypes = new Set(['md', 'txt', 'html', 'pdf', 'json', 'js', 'ts', 'py', 'yaml', 'yml', 'toml', 'xml', 'css'])
  return validTypes.has(ext) ? ext : 'md'
}

/**
 * Extract a readable error message from API response.
 * Handles both string errors and Zod fieldErrors objects.
 */
function extractErrorMessage(data: { error?: string | Record<string, string[]> }): string {
  if (!data.error) return 'Ошибка загрузки'
  if (typeof data.error === 'string') return data.error
  // Zod fieldErrors: { fileType: ['Invalid enum value'] }
  const messages = Object.entries(data.error)
    .map(([field, errs]) => `${field}: ${(errs as string[]).join(', ')}`)
    .join('; ')
  return messages
}

export interface SubmitResult {
  success: boolean
  docId?: string
  duplicate?: DuplicateInfo
  error?: string
}

/**
 * Submit a document to the API with duplicate detection.
 */
export async function submitDocument(
  state: UploadState,
  forceCreate = false
): Promise<SubmitResult> {
  const fileType = normalizeFileType(state.fileName)

  const body: Record<string, unknown> = {
    title: state.title.trim(),
    content: state.content.trim(),
    fileName: state.fileName || state.title.trim(),
    fileType,
    fileSize: new Blob([state.content]).size,
    categoryId: state.categoryId !== 'auto' && state.categoryId !== 'none'
      ? state.categoryId
      : undefined,
  }

  if (forceCreate) {
    body.forceCreate = true
  }

  const res = await fetch('/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  // Duplicate detected
  if (res.status === 409) {
    const data = await res.json()
    return {
      success: false,
      duplicate: {
        existingId: data.existingId,
        existingTitle: data.existingTitle,
        message: data.error,
        severity: data.severity,
      },
    }
  }

  if (!res.ok) {
    const data = await res.json()
    return { success: false, error: extractErrorMessage(data) }
  }

  const doc = await res.json()
  return { success: true, docId: doc.id }
}

/**
 * Auto-categorize a document using AI.
 * Returns category name if auto-assigned.
 */
export async function autoCategorizeDocument(docId: string): Promise<string | null> {
  try {
    const res = await fetch('/api/documents/auto-categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: docId }),
    })

    if (!res.ok) return null

    const data = await res.json()
    return data.autoAssigned && data.category ? data.category.name : null
  } catch {
    return null
  }
}

/**
 * Extract terms from a document.
 */
export async function extractTerms(docId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/terms/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: docId }),
    })
    return res.ok
  } catch {
    return false
  }
}
