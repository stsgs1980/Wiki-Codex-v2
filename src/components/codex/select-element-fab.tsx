'use client'

import { SelectElementFAB } from '@zai/select-element'

/**
 * Client wrapper for the @zai/select-element DOM picker (v2.1.0+).
 *
 * v2.1.0 made SelectElementFAB self-contained — it manages its own state
 * via useElementInspector and renders DetailsPopover automatically when
 * an element is picked. No more onElementSelect callback or ElementDialog.
 *
 * Architecture:
 * - Package installed via `github:stsgs1980/SelectElement` (resolved by bun)
 * - transpilePackages in next.config.ts — package ships raw .ts/.tsx
 * - This wrapper is 'use client' because FAB uses useState/useEffect internally
 */
export function SelectElementFABWrapper() {
  return <SelectElementFAB enableSourceInspection={false} />
}
