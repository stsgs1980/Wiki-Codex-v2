/**
 * API Retry pure helpers — extracted from api-retry.ts (R-02 anti-monolith split)
 *
 * Based on agent-toolkit skill: api-retry
 * Exponential backoff delay calculation and retryable-status predicate.
 */

import type { RetryConfig } from "./api-retry-types"

// ─── Exponential Backoff Delay ───────────────────────────────────────────────

export function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt)
  const jitter = Math.random() * 0.3 * delay // Add 30% jitter
  return Math.min(delay + jitter, config.maxDelay)
}

// ─── Retryable Check ────────────────────────────────────────────────────────

export function isRetryable(status: number, config: RetryConfig): boolean {
  return (config.retryableStatuses as readonly number[]).includes(status)
}
