'use client'

import { useState } from 'react'
import type { TermCardProps } from './types'
import { TermCardRow } from './term-card-row'
import { TermCardExpanded } from './term-card-expanded'

/**
 * List-mode term card. Slim container that owns the expand/collapse state and
 * composes the clickable row with the optional expanded details.
 *
 * Split out from a single 147-line file (R-02 anti-monolith):
 *   - term-card-row.tsx       — clickable row + keyboard a11y
 *   - term-card-expanded.tsx  — expanded details + mobile delete
 *   - term-delete-button.tsx  — shared delete control (also used by grid)
 */
export function TermCardList({
  term,
  onDelete,
  selectionMode,
  selected,
  onToggleSelection,
}: TermCardProps) {
  const [expanded, setExpanded] = useState(false)

  const handleToggle = () => {
    if (selectionMode) {
      onToggleSelection()
    } else {
      setExpanded((prev) => !prev)
    }
  }

  return (
    <div className="group">
      <TermCardRow
        term={term}
        expanded={expanded}
        selectionMode={selectionMode}
        selected={selected}
        onToggle={handleToggle}
        onToggleSelection={onToggleSelection}
        onDelete={onDelete}
      />

      {!selectionMode && expanded && (
        <TermCardExpanded term={term} onDelete={onDelete} />
      )}
    </div>
  )
}
