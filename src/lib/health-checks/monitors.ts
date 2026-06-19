/**
 * Health monitoring helpers — extracted from health-check.ts (R-02 anti-monolith split)
 *
 * Based on agent-toolkit skill: health-check
 * FailureTracker tracks consecutive failures; ResponseTimeMonitor tracks latency.
 */

// ─── Failure Tracker ────────────────────────────────────────────────────────

export class FailureTracker {
  private count = 0
  private readonly threshold: number

  constructor(threshold = 3) {
    this.threshold = threshold
  }

  /** Record a failure. Returns true if threshold is exceeded. */
  recordFailure(): boolean {
    this.count++
    return this.count >= this.threshold
  }

  /** Record a success, resetting the counter. */
  recordSuccess(): void {
    this.count = 0
  }

  /** Current consecutive failure count */
  getCount(): number {
    return this.count
  }

  /** Whether the threshold has been exceeded */
  isExceeded(): boolean {
    return this.count >= this.threshold
  }

  reset(): void {
    this.count = 0
  }
}

// ─── Response Time Monitor ───────────────────────────────────────────────────

export class ResponseTimeMonitor {
  private readonly window: number[] = []
  private readonly maxSize: number
  private readonly alertThresholdMs: number

  constructor(maxSize = 10, alertThresholdMs = 5000) {
    this.maxSize = maxSize
    this.alertThresholdMs = alertThresholdMs
  }

  /** Record a response time */
  record(responseTimeMs: number): void {
    this.window.push(responseTimeMs)
    if (this.window.length > this.maxSize) {
      this.window.shift()
    }
  }

  /** Average response time across the window */
  getAverage(): number {
    if (this.window.length === 0) return 0
    return this.window.reduce((a, b) => a + b, 0) / this.window.length
  }

  /** Whether average response time exceeds the alert threshold */
  isSlow(): boolean {
    return this.getAverage() > this.alertThresholdMs
  }

  getStats() {
    return {
      average: Math.round(this.getAverage()),
      samples: this.window.length,
      isSlow: this.isSlow(),
      threshold: this.alertThresholdMs,
    }
  }
}
