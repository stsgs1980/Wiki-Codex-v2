/**
 * Fallback Manager for AI Providers
 *
 * Based on agent-toolkit skill: fallback
 * Manages fallback between AI providers when the primary is unavailable.
 */

import { CircuitBreaker, type CircuitBreakerConfig } from './circuit-breaker'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Provider {
  name: string
  priority: number
  chat(messages: Array<{ role: string; content: string }>, options?: { temperature?: number }): Promise<string>
  isAvailable(): Promise<boolean>
}

export interface FallbackManagerConfig {
  /** Number of consecutive errors before switching provider */
  errorThreshold: number
  /** Circuit breaker config per provider */
  circuitBreaker: Partial<CircuitBreakerConfig>
}

const DEFAULT_CONFIG: FallbackManagerConfig = {
  errorThreshold: 3,
  circuitBreaker: {
    failureThreshold: 5,
    recoveryTimeout: 60000,
    successThreshold: 2,
  },
}

// ─── Fallback Manager ────────────────────────────────────────────────────────

export class FallbackManager {
  private readonly providers: Provider[]
  private readonly breakers: Map<string, CircuitBreaker> = new Map()
  private readonly config: FallbackManagerConfig
  private activeProviderName: string | null = null
  private consecutiveErrors = 0

  constructor(providers: Provider[], config: Partial<FallbackManagerConfig> = {}) {
    if (providers.length === 0) {
      throw new Error('At least one provider is required')
    }

    this.providers = [...providers].sort((a, b) => a.priority - b.priority)
    this.config = { ...DEFAULT_CONFIG, ...config }

    for (const provider of this.providers) {
      this.breakers.set(provider.name, new CircuitBreaker(this.config.circuitBreaker))
    }

    this.activeProviderName = this.providers[0].name
  }

  /** Get the current active provider */
  getActiveProvider(): Provider {
    const provider = this.providers.find((p) => p.name === this.activeProviderName)
    if (!provider) {
      this.activeProviderName = this.providers[0].name
      return this.providers[0]
    }
    return provider
  }

  /** Find the next available provider */
  private async findAvailableProvider(): Promise<Provider | null> {
    for (const provider of this.providers) {
      const breaker = this.breakers.get(provider.name)
      if (breaker && !breaker.isAllowed()) continue

      const isAvailable = await provider.isAvailable().catch(() => false)
      if (isAvailable) return provider
    }
    return null
  }

  /** Send a chat request with automatic fallback */
  async chat(
    messages: Array<{ role: string; content: string }>,
    options?: { temperature?: number }
  ): Promise<{ content: string; provider: string }> {
    const activeProvider = this.getActiveProvider()
    const breaker = this.breakers.get(activeProvider.name)!

    if (!breaker.isAllowed()) {
      const nextProvider = await this.findAvailableProvider()
      if (nextProvider) {
        this.activeProviderName = nextProvider.name
        return this.chat(messages, options)
      }
      throw new Error('All AI providers are unavailable')
    }

    try {
      const content = await activeProvider.chat(messages, options)
      breaker.recordSuccess()
      this.consecutiveErrors = 0
      return { content, provider: activeProvider.name }
    } catch (error) {
      breaker.recordFailure()
      this.consecutiveErrors++

      if (this.consecutiveErrors >= this.config.errorThreshold) {
        const nextProvider = await this.findAvailableProvider()
        if (nextProvider && nextProvider.name !== activeProvider.name) {
          this.activeProviderName = nextProvider.name
          this.consecutiveErrors = 0
          return this.chat(messages, options)
        }
      }

      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /** Get diagnostic info for all providers */
  getStats() {
    return this.providers.map((p) => ({
      name: p.name,
      priority: p.priority,
      active: p.name === this.activeProviderName,
      circuitBreaker: this.breakers.get(p.name)?.getStats(),
    }))
  }
}
