// Barrel for the dashboard sub-module.
// Note: DashboardView itself lives at ../dashboard-view.tsx and acts as the
// orchestrator importing from here — so it is NOT re-exported from this barrel
// (that would create a circular import).
export { useCleanup } from './use-cleanup'
export { StatsGrid } from './stats-grid'
export { CategoryBreakdown } from './category-breakdown'
export { FileTypesSection } from './file-types-section'
export { CleanupDialog } from './cleanup-dialog'
export type {
  DashboardViewProps,
  DuplicateEntry,
  DuplicateGroup,
  CategoryBreakdownItem,
  StatItem,
} from './types'
