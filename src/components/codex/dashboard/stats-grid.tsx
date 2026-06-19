'use client'

import { motion } from 'framer-motion'
import { staggerContainer, staggerItem, countUp, cardHover } from '@/lib/motion'
import type { StatItem } from './types'

interface StatsGridProps {
  stats: StatItem[]
}

/**
 * StatsGrid — renders the 4-stat card row (Документы / Категории / Теги / Избранные).
 * Pure presentational component; the stats array itself is computed by the parent.
 */
export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-2 gap-2 sm:gap-3"
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          variants={staggerItem}
          {...cardHover}
          className="flex items-center gap-2 sm:gap-3 rounded-md border border-dashed px-3 py-2.5 hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center justify-center size-7 sm:size-8 rounded-sm bg-muted shrink-0">
            {stat.icon}
          </div>
          <div className="min-w-0">
            <motion.p
              variants={countUp}
              className="text-lg sm:text-xl font-bold text-foreground font-mono leading-tight tabular-nums"
            >
              {stat.value}
            </motion.p>
            <p className="text-3xs sm:text-xs text-muted-foreground font-mono">{stat.label.toLowerCase()}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
