/**
 * autoCategorizeDocument action — POST /api/documents/auto-categorize.
 * Uses fetchWithRetry for resilience (max 1 retry, 2s base delay).
 * Returns the AI-suggested category name if auto-assigned, otherwise null.
 */
import { fetchWithRetry } from '@/lib/api-retry'

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
