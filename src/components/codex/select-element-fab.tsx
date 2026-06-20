'use client'

import { useState } from 'react'
import { SelectElementFAB, ElementDialog } from '@zai/select-element'
import type { SelectedElement } from '@zai/select-element'

/**
 * Client wrapper for the @zai/select-element DOM picker.
 * Mounts the draggable FAB globally and shows the inspect dialog on pick.
 *
 * Architecture:
 * - Package installed via `github:stsgs1980/SelectElement` (resolved by bun)
 * - transpilePackages in next.config.ts — package ships raw .ts/.tsx
 * - This wrapper is 'use client' because FAB uses useState/useEffect
 */
export function SelectElementFABWrapper() {
  const [selected, setSelected] = useState<SelectedElement | null>(null)

  return (
    <>
      <SelectElementFAB onElementSelect={(el) => setSelected(el)} draggable />
      {selected && (
        <ElementDialog element={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
