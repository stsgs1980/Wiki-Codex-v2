/**
 * Health Check Monitoring
 *
 * Based on agent-toolkit skill: health-check
 * Monitors availability of external APIs and services.
 *
 * This module is a thin barrel that re-exports the split submodules:
 *   - `./health-checks/api`      — checkApiHealth, checkMultipleEndpoints, types
 *   - `./health-checks/monitors` — FailureTracker, ResponseTimeMonitor
 *
 * Split performed for R-02 anti-monolith rule (each file ≤150 lines).
 * Public API is unchanged: every export below existed pre-split.
 */

export {
  type HealthCheckResult,
  type EndpointConfig,
  checkApiHealth,
  checkMultipleEndpoints,
} from "./health-checks/api"

export { FailureTracker, ResponseTimeMonitor } from "./health-checks/monitors"
