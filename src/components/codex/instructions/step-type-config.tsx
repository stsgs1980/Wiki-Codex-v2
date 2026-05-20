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
    bgClass: 'bg-zinc-500/5',
    borderClass: 'border-zinc-500/20',
    textClass: 'text-zinc-400',
    badgeClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    descriptionClass: 'text-zinc-300/80',
  },
  warning: {
    icon: <AlertTriangle className="size-4" />,
    label: 'warning',
    color: '#d97706',
    bgClass: 'bg-amber-500/5',
    borderClass: 'border-amber-500/20',
    textClass: 'text-amber-400',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    descriptionClass: 'text-amber-200/80',
  },
  info: {
    icon: <Info className="size-4" />,
    label: 'info',
    color: '#3b82f6',
    bgClass: 'bg-blue-500/5',
    borderClass: 'border-blue-500/20',
    textClass: 'text-blue-400',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    descriptionClass: 'text-blue-200/80',
  },
  tip: {
    icon: <Lightbulb className="size-4" />,
    label: 'tip',
    color: '#22c55e',
    bgClass: 'bg-green-500/5',
    borderClass: 'border-green-500/20',
    textClass: 'text-green-400',
    badgeClass: 'bg-green-500/10 text-green-400 border-green-500/20',
    descriptionClass: 'text-green-200/80',
  },
  important: {
    icon: <AlertTriangle className="size-4" />,
    label: 'important',
    color: '#f59e0b',
    bgClass: 'bg-amber-500/5',
    borderClass: 'border-amber-500/20',
    textClass: 'text-amber-400',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    descriptionClass: 'text-amber-200/80',
  },
}

// Resolve step type - normalize unknown types to 'step'
export function resolveStepType(type?: string): StepType {
  if (type && type in STEP_TYPE_CONFIG) return type as StepType
  return 'step'
}
