/**
 * Health Check Monitoring
 *
 * Based on agent-toolkit skill: health-check
 * Monitors availability of external APIs and services.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HealthCheckResult {
  url: string
  healthy: boolean
  status: number | null
  responseTimeMs: number
  error: string | null
  timestamp: string
}

export interface EndpointConfig {
  url: string
  timeout?: number  // ms, default 5000
  method?: 'HEAD' | 'GET'
}

// ─── Single Endpoint Check ───────────────────────────────────────────────────

/**
 * Check health of a single API endpoint.
 *
 * @example
 * const result = await checkApiHealth('https://api.example.com/health')
 * if (!result.healthy) console.warn('API is down:', result.error)
 */
export async function checkApiHealth(
  url: string,
  options: { timeout?: number; method?: 'HEAD' | 'GET' } = {}
): Promise<HealthCheckResult> {
  const { timeout = 5000, method = 'HEAD' } = options
  const start = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      method,
      signal: controller.signal,
      cache: 'no-store',
    })

    clearTimeout(timeoutId)

    return {
      url,
      healthy: response.ok,
      status: response.status,
      responseTimeMs: Date.now() - start,
      error: response.ok ? null : `HTTP ${response.status}`,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      url,
      healthy: false,
      status: null,
      responseTimeMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }
  }
}

// ─── Multiple Endpoints ──────────────────────────────────────────────────────

/**
 * Check health of multiple endpoints in parallel.
 *
 * @example
 * const results = await checkMultipleEndpoints([
 *   { url: '/api' },
 *   { url: '/api/categories', method: 'GET' },
 * ])
 */
export async function checkMultipleEndpoints(
  endpoints: EndpointConfig[]
): Promise<HealthCheckResult[]> {
  return Promise.all(
    endpoints.map((ep) =>
      checkApiHealth(ep.url, { timeout: ep.timeout, method: ep.method ?? 'HEAD' })
    )
  )
}

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
