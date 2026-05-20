'use client'

import { cn } from '@/lib/utils'
import { STEP_TYPE_CONFIG } from './step-type-config'
import type { StepType } from './types'

export function StepCallout({ type, description }: { type: StepType; description: string }) {
  const config = STEP_TYPE_CONFIG[type]
  if (type === 'step') return null

  return (
    <div className={cn('flex items-start gap-3 p-3 rounded-lg border', config.bgClass, config.borderClass)}>
      <div className={cn('shrink-0 mt-0.5', config.textClass)}>
        {config.icon}
      </div>
      <p className={cn('text-sm leading-relaxed font-sans', config.descriptionClass)}>
        {description}
      </p>
    </div>
  )
}
