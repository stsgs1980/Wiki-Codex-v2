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
    color: 'var(--muted-foreground)',
    bgClass: 'bg-muted/50',
    borderClass: 'border-border',
    textClass: 'text-muted-foreground',
    badgeClass: 'bg-muted text-muted-foreground border-border',
    descriptionClass: 'text-muted-foreground',
  },
  warning: {
    icon: <AlertTriangle className="size-4" />,
    label: 'warning',
    color: 'var(--star)',
    bgClass: 'bg-star/5',
    borderClass: 'border-star/20',
    textClass: 'text-star',
    badgeClass: 'bg-star/10 text-star border-star/20',
    descriptionClass: 'text-star',
  },
  info: {
    icon: <Info className="size-4" />,
    label: 'info',
    color: 'var(--terminal-accent)',
    bgClass: 'bg-terminal-accent/5',
    borderClass: 'border-terminal-accent/20',
    textClass: 'text-terminal-accent',
    badgeClass: 'bg-terminal-accent/10 text-terminal-accent border-terminal-accent/20',
    descriptionClass: 'text-terminal-accent',
  },
  tip: {
    icon: <Lightbulb className="size-4" />,
    label: 'tip',
    color: 'var(--terminal-accent)',
    bgClass: 'bg-terminal-accent/5',
    borderClass: 'border-terminal-accent/20',
    textClass: 'text-terminal-accent',
    badgeClass: 'bg-terminal-accent/10 text-terminal-accent border-terminal-accent/20',
    descriptionClass: 'text-terminal-accent',
  },
  important: {
    icon: <AlertTriangle className="size-4" />,
    label: 'important',
    color: 'var(--star)',
    bgClass: 'bg-star/5',
    borderClass: 'border-star/20',
    textClass: 'text-star',
    badgeClass: 'bg-star/10 text-star border-star/20',
    descriptionClass: 'text-star',
  },
}

// Resolve step type - normalize unknown types to 'step'
export function resolveStepType(type?: string): StepType {
  if (type && type in STEP_TYPE_CONFIG) return type as StepType
  return 'step'
}
