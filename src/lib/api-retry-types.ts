/**
 * API Retry types and default config — extracted from api-retry.ts (R-02 anti-monolith split)
 *
 * Based on agent-toolkit skill: api-retry
 */

// ─── Configuration ───────────────────────────────────────────────────────────

export const DEFAULT_CONFIG: {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryableStatuses: number[]
  timeout: number
} = {
  maxRetries: 3,
  baseDelay: 1000,       // 1s
  maxDelay: 10000,       // 10s
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  timeout: 30000,        // 30s
}

export type RetryConfig = typeof DEFAULT_CONFIG & Partial<{
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  timeout: number
}>

// ─── Metrics ─────────────────────────────────────────────────────────────────

export interface RetryMetrics {
  totalRequests: number
  retryCount: number
  successCount: number
  failureCount: number
  lastError: string | null
}

// ─── fetchWithRetry Options ──────────────────────────────────────────────────

export interface FetchWithRetryOptions extends RequestInit {
  retryConfig?: Partial<RetryConfig>
}
