'use client'

import { SelectElementFAB } from '@zai/select-element'

/**
 * Client wrapper for the @zai/select-element DOM picker.
 *
 * v2.5.0 upstream fixed the hydration bug (InspectorFab initial position
 * now set via useEffect instead of render-phase setState), so the mount
 * guard we added in v2.1.0 is no longer required and has been removed.
 *
 * v2.5.0 also fixed TS18047 (source null) in DetailsPopover.tsx —
 * only gh-theme.ts:29 TS2698 remains, handled by
 * scripts/patch-select-element.js postinstall.
 *
 * Architecture:
 * - Package installed via `github:stsgs1980/SelectElement` (resolved by bun)
 * - transpilePackages in next.config.ts — package ships raw .ts/.tsx
 * - This wrapper is 'use client' because FAB uses useState/useEffect internally
 */
export function SelectElementFABWrapper() {
  return <SelectElementFAB enableSourceInspection={false} />
}
