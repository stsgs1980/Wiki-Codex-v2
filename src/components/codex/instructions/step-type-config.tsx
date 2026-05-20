'use client'

import { ChevronRight, AlertTriangle, Info, Lightbulb } from 'lucide-react'
import type { StepType } from './types'

export const STEP_TYPE_CONFIG: Record<StepType, {
  icon: React.ReactNode
  label: string
  color: string
  bgClass: string
  borderClass: string
  textClass: string
  badgeClass: string
  descriptionClass: string
}> = {
  step: {
    icon: <ChevronRight className="size-4" />,
    label: 'step',
    color: '#71717a',
    bgClass: 'bg-muted/50',
    borderClass: 'border-border',
    textClass: 'text-muted-foreground',
    badgeClass: 'bg-muted text-muted-foreground border-border',
    descriptionClass: 'text-muted-foreground',
  },
  warning: {
    icon: <AlertTriangle className="size-4" />,
    label: 'warning',
    color: '#d97706',
    bgClass: 'bg-amber-50 dark:bg-amber-500/5',
    borderClass: 'border-amber-200 dark:border-amber-500/20',
    textClass: 'text-amber-600 dark:text-amber-400',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    descriptionClass: 'text-amber-800 dark:text-amber-200',
  },
  info: {
    icon: <Info className="size-4" />,
    label: 'info',
    color: '#3b82f6',
    bgClass: 'bg-blue-50 dark:bg-blue-500/5',
    borderClass: 'border-blue-200 dark:border-blue-500/20',
    textClass: 'text-blue-600 dark:text-blue-400',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    descriptionClass: 'text-blue-800 dark:text-blue-200',
  },
  tip: {
    icon: <Lightbulb className="size-4" />,
    label: 'tip',
    color: '#22c55e',
    bgClass: 'bg-green-50 dark:bg-green-500/5',
    borderClass: 'border-green-200 dark:border-green-500/20',
    textClass: 'text-green-600 dark:text-green-400',
    badgeClass: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
    descriptionClass: 'text-green-800 dark:text-green-200',
  },
  important: {
    icon: <AlertTriangle className="size-4" />,
    label: 'important',
    color: '#f59e0b',
    bgClass: 'bg-amber-50 dark:bg-amber-500/5',
    borderClass: 'border-amber-200 dark:border-amber-500/20',
    textClass: 'text-amber-600 dark:text-amber-400',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    descriptionClass: 'text-amber-800 dark:text-amber-200',
  },
}

// Resolve step type - normalize unknown types to 'step'
export function resolveStepType(type?: string): StepType {
  if (type && type in STEP_TYPE_CONFIG) return type as StepType
  return 'step'
}
