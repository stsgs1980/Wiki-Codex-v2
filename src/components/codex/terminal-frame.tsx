'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { dotPulse } from '@/lib/motion'

/**
 * TerminalFrame - wraps content in a terminal-style window with 3-dot title bar.
 * Uses the existing design token colors (bg-card, bg-muted) so it works in both light & dark themes.
 */
export function TerminalFrame({
  title,
  children,
  className,
  headerRight,
}: {
  title: string
  children: React.ReactNode
  className?: string
  headerRight?: React.ReactNode
}) {
  return (
    <div className={cn('rounded-lg border overflow-hidden', className)}>
      {/* Title bar */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b bg-muted/60">
        <div className="flex items-center gap-1.5 shrink-0">
          <motion.div className="size-2 rounded-full bg-red-400 dark:bg-red-500" variants={dotPulse} initial="initial" animate="animate" />
          <div className="size-2 rounded-full bg-yellow-400 dark:bg-yellow-500" />
          <div className="size-2 rounded-full bg-green-400 dark:bg-green-500" />
        </div>
        <span className="text-[11px] font-mono text-muted-foreground truncate">{title}</span>
        {headerRight && <div className="ml-auto shrink-0">{headerRight}</div>}
      </div>
      {/* Content */}
      <div>{children}</div>
    </div>
  )
}

/**
 * TerminalHeader - lightweight inline terminal prompt bar.
 * Ideal for section sub-headers within views.
 */
export function TerminalHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 border-b bg-muted/40 font-mono text-xs text-muted-foreground',
      className,
    )}>
      <span className="text-terminal-accent select-none">$</span>
      {children}
    </div>
  )
}
