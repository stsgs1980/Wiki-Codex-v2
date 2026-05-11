/**
 * Circuit Breaker Pattern
 *
 * Based on agent-toolkit skill: api-retry
 * Prevents cascading failures by stopping requests to a failing service.
 *
 * States: CLOSED (normal) -> OPEN (failing) -> HALF_OPEN (testing recovery)
 */

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerConfig {
  /** Number of consecutive failures before opening the circuit */
  failureThreshold: number
  /** Time in ms before attempting recovery (HALF_OPEN) */
  recoveryTimeout: number
  /** Number of successful requests in HALF_OPEN to close the circuit */
  successThreshold: number
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  recoveryTimeout: 60000,  // 60s
  successThreshold: 2,
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount = 0
  private successCount = 0
  private lastFailureTime = 0
  private readonly config: CircuitBreakerConfig

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /** Current circuit state */
  getState(): CircuitState {
    if (this.state === CircuitState.OPEN) {
      const timeSinceFailure = Date.now() - this.lastFailureTime
      if (timeSinceFailure >= this.config.recoveryTimeout) {
        this.state = CircuitState.HALF_OPEN
        this.successCount = 0
      }
    }
    return this.state
  }

  /** Whether requests are allowed through */
  isAllowed(): boolean {
    const state = this.getState()
    return state === CircuitState.CLOSED || state === CircuitState.HALF_OPEN
  }

  /** Record a successful request */
  recordSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED
        this.failureCount = 0
        this.successCount = 0
      }
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount = 0
    }
  }

  /** Record a failed request */
  recordFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN
    }
  }

  /** Get diagnostic info */
  getStats() {
    return {
      state: this.getState(),
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
        ? new Date(this.lastFailureTime).toISOString()
        : null,
    }
  }

  /** Reset circuit to CLOSED state */
  reset(): void {
    this.state = CircuitState.CLOSED
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = 0
  }
}
