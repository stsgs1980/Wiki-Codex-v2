/**
 * API endpoint health checks — extracted from health-check.ts (R-02 anti-monolith split)
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
