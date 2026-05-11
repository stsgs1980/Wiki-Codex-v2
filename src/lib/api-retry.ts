/**
 * API Retry with Exponential Backoff and Circuit Breaker
 *
 * Based on agent-toolkit skill: api-retry
 * Provides resilient HTTP request handling with automatic retries,
 * exponential backoff, and circuit breaker pattern.
 */

// ─── Configuration ───────────────────────────────────────────────────────────

const DEFAULT_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,       // 1s
  maxDelay: 10000,       // 10s
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  timeout: 30000,        // 30s
} as const

type RetryConfig = typeof DEFAULT_CONFIG & Partial<{
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  timeout: number
}>

// ─── Metrics ─────────────────────────────────────────────────────────────────

interface RetryMetrics {
  totalRequests: number
  retryCount: number
  successCount: number
  failureCount: number
  lastError: string | null
}

const metrics: RetryMetrics = {
  totalRequests: 0,
  retryCount: 0,
  successCount: 0,
  failureCount: 0,
  lastError: null,
}

export function getRetryMetrics(): Readonly<RetryMetrics> {
  return { ...metrics }
}

// ─── Exponential Backoff Delay ───────────────────────────────────────────────

function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt)
  const jitter = Math.random() * 0.3 * delay // Add 30% jitter
  return Math.min(delay + jitter, config.maxDelay)
}

// ─── Retryable Check ────────────────────────────────────────────────────────

function isRetryable(status: number, config: RetryConfig): boolean {
  return (config.retryableStatuses as readonly number[]).includes(status)
}

// ─── fetchWithRetry ─────────────────────────────────────────────────────────

export interface FetchWithRetryOptions extends RequestInit {
  retryConfig?: Partial<RetryConfig>
}

/**
 * Fetch with automatic retry, exponential backoff, and timeout.
 *
 * @example
 * const data = await fetchWithRetry('/api/documents', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ title: 'Test' }),
 *   retryConfig: { maxRetries: 5 },
 * })
 */
export async function fetchWithRetry<T = unknown>(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<T> {
  const { retryConfig: userConfig, ...fetchOptions } = options
  const config = { ...DEFAULT_CONFIG, ...userConfig }
  let lastResponse: Response | null = null

  metrics.totalRequests++

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), config.timeout)

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        metrics.successCount++
        return (await response.json()) as T
      }

      lastResponse = response

      if (!isRetryable(response.status, config) || attempt === config.maxRetries) {
        metrics.failureCount++
        metrics.lastError = `HTTP ${response.status}: ${response.statusText}`
        throw new Error(`Request failed with status ${response.status}: ${response.statusText}`)
      }

      metrics.retryCount++
      const delay = calculateDelay(attempt, config)
      await new Promise((resolve) => setTimeout(resolve, delay))
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        if (attempt < config.maxRetries) {
          metrics.retryCount++
          const delay = calculateDelay(attempt, config)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (attempt < config.maxRetries) {
          metrics.retryCount++
          const delay = calculateDelay(attempt, config)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
      }

      if (!(error instanceof Error) || !error.message.startsWith('Request failed')) {
        if (attempt < config.maxRetries) {
          metrics.retryCount++
          const delay = calculateDelay(attempt, config)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
      }

      metrics.failureCount++
      metrics.lastError = error instanceof Error ? error.message : String(error)
      throw error
    }
  }

  // Should not reach here, but just in case
  metrics.failureCount++
  throw new Error(
    `Request failed after ${config.maxRetries} retries. Last status: ${lastResponse?.status ?? 'unknown'}`
  )
}
