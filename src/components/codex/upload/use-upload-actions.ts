/**
 * Upload actions — API calls with retry and error handling.
 * Separated from UI to keep upload.tsx under 200 lines.
 */
import type { UploadState } from './use-upload-state'
import type { DuplicateInfo } from './use-upload-state'
import { fetchWithRetry } from '@/lib/api-retry'

/**
 * Normalizes file extension to a valid fileType.
 * Maps common extensions to our accepted enum values.
 */
function normalizeFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || 'md'
  const validTypes = new Set(['md', 'txt', 'html', 'pdf', 'json', 'js', 'ts', 'py', 'yaml', 'yml', 'toml', 'xml', 'css', 'sql', 'sh', 'jsx', 'tsx', 'csv'])
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

/** Max retries for upload — server may restart in sandbox */
const UPLOAD_RETRIES = 2

/** Delay between retries (ms) — give server time to restart */
const RETRY_DELAY = 3000

/**
 * Submit a document to the API with duplicate detection and retry.
 * Retries on network errors (server may be restarting in sandbox).
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

  let lastError = ''

  for (let attempt = 0; attempt <= UPLOAD_RETRIES; attempt++) {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      // Duplicate detected — not an error, don't retry
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

      // Client error (400, 422) — not retryable
      if (res.status >= 400 && res.status < 500) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        return { success: false, error: extractErrorMessage(data) }
      }

      // Server error (500+) — retry, but capture error message
      if (!res.ok) {
        let serverMsg = `HTTP ${res.status}`
        try {
          const errData = await res.json()
          if (errData.error) serverMsg = typeof errData.error === 'string' ? errData.error : JSON.stringify(errData.error)
        } catch { /* ignore parse error */ }
        lastError = `${serverMsg}. Попытка ${attempt + 1}/${UPLOAD_RETRIES + 1}...`
        if (attempt < UPLOAD_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY))
          continue
        }
        return { success: false, error: lastError }
      }

      // Success
      const doc = await res.json()
      return { success: true, docId: doc.id }

    } catch (err) {
      // Network error (server down/restarting) — retry
      lastError = `Сервер недоступен. Попытка ${attempt + 1}/${UPLOAD_RETRIES + 1}...`
      if (attempt < UPLOAD_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY))
        continue
      }
      return { success: false, error: 'Сервер недоступен. Попробуйте ещё раз через несколько секунд.' }
    }
  }

  return { success: false, error: lastError || 'Неизвестная ошибка' }
}

/**
 * Auto-categorize a document using AI.
 * Returns category name if auto-assigned.
 */
export async function autoCategorizeDocument(docId: string): Promise<string | null> {
  try {
    const data = await fetchWithRetry<{ autoAssigned?: boolean; category?: { name: string } }>(
      '/api/documents/auto-categorize',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId }),
        retryConfig: { maxRetries: 1, baseDelay: 2000 },
      }
    )
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
    await fetchWithRetry('/api/terms/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: docId }),
      retryConfig: { maxRetries: 1, baseDelay: 2000 },
    })
    return true
  } catch {
    return false
  }
}
