'use client'

import { useEffect, useState } from 'react'
import { SelectElementFAB } from '@zai/select-element'

/**
 * Client wrapper for the @zai/select-element DOM picker (v2.1.0+).
 *
 * v2.1.0 made SelectElementFAB self-contained — it manages its own state
 * via useElementInspector and renders DetailsPopover automatically when
 * an element is picked.
 *
 * SSR Hydration Fix (mount guard):
 * InspectorFab calls setState during render guarded by `typeof window`.
 * On the server it renders pos={0,0}; on the client's first hydration
 * render window is already available → render-phase setState → mismatch.
 * In dev React 19 tolerates this (warning); in production it drops the
 * subtree, making the FAB invisible.
 *
 * Canonical Next.js fix: render null until after mount, then render FAB.
 * By that point window is guaranteed and the package's initial position
 * calculation runs cleanly on the very first client render.
 *
 * Architecture:
 * - Package installed via `github:stsgs1980/SelectElement` (resolved by bun)
 * - transpilePackages in next.config.ts — package ships raw .ts/.tsx
 * - This wrapper is 'use client' because FAB uses useState/useEffect internally
 */
export function SelectElementFABWrapper() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    // Mount guard: render null on server + first hydration render, then flip.
    // Canonical Next.js pattern for components that read window during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])
  if (!mounted) return null
  return <SelectElementFAB enableSourceInspection={false} />
}
