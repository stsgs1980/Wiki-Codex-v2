'use client'

import { motion } from 'framer-motion'
import type { Term } from '@/lib/types'
import { TermDeleteButton } from './term-delete-button'

interface TermCardExpandedProps {
  term: Term
  onDelete: () => void
}

/**
 * Expanded details of a list-mode term card: explanation, optional usage
 * example, and a mobile-only delete button (desktop delete lives in the row).
 */
export function TermCardExpanded({ term, onDelete }: TermCardExpandedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="px-4 sm:px-10 py-2.5 sm:py-3"
      id={`term-content-${term.id}`}
    >
      <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2 break-words leading-relaxed">
        {term.explanation}
      </p>

      {term.usage && (
        <div className="bg-muted font-mono text-3xs sm:text-xs p-2.5 sm:p-3 rounded-md whitespace-pre-wrap break-words">
          {term.usage}
        </div>
      )}

      <TermDeleteButton onDelete={onDelete} variant="outlined" />
    </motion.div>
  )
}
