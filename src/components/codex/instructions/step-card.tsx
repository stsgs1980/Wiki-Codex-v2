'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { STEP_TYPE_CONFIG, resolveStepType } from './step-type-config'
import { StepCallout } from './step-callout'
import { CopyableCodeBlock } from './copyable-code-block'
import type { Step } from './types'

export function StepCard({ step, stepNumber, groupColor }: { step: Step; stepNumber: number; groupColor: string }) {
  const [expanded, setExpanded] = useState(true)
  const stepType = resolveStepType(step.type)
  const typeConfig = STEP_TYPE_CONFIG[stepType]
  const activeColor = stepType === 'step' ? groupColor : typeConfig.color
  const isNonStepType = stepType !== 'step'

  return (
    <div className="relative pl-10 pb-8 last:pb-0">
      {/* Colored gradient timeline line */}
      <div
        className="absolute left-[15px] top-9 bottom-0 w-[2px] rounded-full"
        style={{
          background: `linear-gradient(to bottom, ${activeColor}60, ${activeColor}10)`,
        }}
      />
      {/* Number badge with glow */}
      <div
        className="absolute left-0.5 top-0 size-7 rounded-lg flex items-center justify-center text-[11px] font-mono font-bold text-white"
        style={{
          backgroundColor: activeColor,
          boxShadow: `0 0 12px ${activeColor}40`,
        }}
      >
        {stepNumber}
      </div>

      <div>
        <button
          className="flex items-center gap-2.5 text-left w-full group/step"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded
            ? <ChevronDown className="size-4 text-muted-foreground shrink-0 transition-transform group-hover/step:text-primary" />
            : <ChevronRight className="size-4 shrink-0 transition-transform" style={{ color: activeColor }} />
          }
          <h3 className="text-sm font-semibold text-foreground leading-snug group-hover/step:text-primary transition-colors font-sans">
            {step.title}
          </h3>
          {isNonStepType && (
            <span className={cn('text-[10px] font-mono px-2 py-0.5 rounded-full border', typeConfig.badgeClass)}>
              {typeConfig.label}
            </span>
          )}
          {/* Tags */}
          {step.tags && step.tags.map((tag) => (
            <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-muted/50 text-muted-foreground border-border">
              {tag}
            </span>
          ))}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 pl-6">
          {/* Callout box for non-default types */}
          {isNonStepType && step.description && (
            <StepCallout type={stepType} description={step.description} />
          )}
          {/* Regular description for default type */}
          {stepType === 'step' && step.description && (
            <p className="text-sm text-zinc-300 leading-relaxed font-sans">{step.description}</p>
          )}
          {step.codeBlocks.map((block, idx) => (
            <CopyableCodeBlock key={`${block.label}-${idx}`} label={block.label} code={block.code} accentColor={activeColor} />
          ))}
        </div>
      )}
    </div>
  )
}
