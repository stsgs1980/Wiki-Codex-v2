/**
 * extractTerms action — POST /api/terms/extract.
 * Uses fetchWithRetry for resilience (max 1 retry, 2s base delay).
 * Returns true on success, false on failure (silent — UI shows generic error).
 */
import { fetchWithRetry } from '@/lib/api-retry'

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
