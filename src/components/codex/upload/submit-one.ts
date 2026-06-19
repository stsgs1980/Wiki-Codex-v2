/**
 * submit-one — single-file submit logic extracted from submit-batch.ts (R-02).
 *
 * Reads the file as text, POSTs to /api/documents with one retry on 5xx or
 * network error. Returns a BatchFileResult — never throws. Duplicate (409)
 * is reported as a status, not an error, so the batch can continue.
 */
import type { DuplicateInfo } from './use-upload-state'
import type { BatchFile, BatchFileResult } from './submit-batch-types'

const MAX_RETRIES = 1
const RETRY_DELAY_MS = 2000

const VALID_EXT = new Set([
  'md', 'txt', 'html', 'pdf', 'json', 'js', 'ts', 'py',
  'yaml', 'yml', 'toml', 'xml', 'css', 'sql', 'sh', 'jsx', 'tsx', 'csv',
])

export function normalizeFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || 'md'
  return VALID_EXT.has(ext) ? ext : 'md'
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'))
    reader.readAsText(file)
  })
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function submitOne(
  batchFile: BatchFile,
  categoryId: string,
  forceCreate: boolean,
): Promise<BatchFileResult> {
  const id = batchFile.relativePath || batchFile.file.name

  try {
    const content = await readAsText(batchFile.file)
    if (!content.trim()) {
      return { id, status: 'error', error: 'Пустой файл' }
    }

    const body: Record<string, unknown> = {
      title: batchFile.title,
      content,
      fileName: batchFile.file.name,
      fileType: normalizeFileType(batchFile.file.name),
      fileSize: batchFile.file.size,
      categoryId: categoryId !== 'auto' && categoryId !== 'none' ? categoryId : undefined,
    }
    if (forceCreate) body.forceCreate = true

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (res.status === 409) {
          const data = await res.json()
          return {
            id,
            status: 'duplicate',
            duplicate: {
              existingId: data.existingId,
              existingTitle: data.existingTitle,
              message: data.error,
              severity: data.severity,
            } satisfies DuplicateInfo,
          }
        }

        if (res.status >= 400 && res.status < 500) {
          const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
          const err = typeof data.error === 'string' ? data.error : JSON.stringify(data.error)
          return { id, status: 'error', error: err }
        }

        if (!res.ok) {
          if (attempt < MAX_RETRIES) {
            await sleep(RETRY_DELAY_MS)
            continue
          }
          return { id, status: 'error', error: `HTTP ${res.status}` }
        }

        const doc = await res.json()
        return {
          id,
          status: doc._updated ? 'updated' : 'success',
          docId: doc.id as string,
        }
      } catch (err) {
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS)
          continue
        }
        return {
          id,
          status: 'error',
          error: err instanceof Error ? err.message : 'Сеть недоступна',
        }
      }
    }
  } catch (err) {
    return {
      id,
      status: 'error',
      error: err instanceof Error ? err.message : 'Ошибка чтения файла',
    }
  }

  return { id, status: 'error', error: 'Превышено число попыток' }
}
