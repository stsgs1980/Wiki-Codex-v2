'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Trash2, Sparkles, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { StepCard } from './step-card'
import { parseSteps } from './parse-steps'
import type { InstructionItem } from './types'

export function DbInstructionCard({
  instruction,
  onDelete,
}: {
  instruction: InstructionItem
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const steps = parseSteps(instruction.steps)

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md hover:shadow-terminal-accent/5">
      <CardHeader
        className="cursor-pointer select-none pb-4 border-b border-border"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center size-11 rounded-xl shrink-0 bg-terminal-accent/10">
            <Sparkles className="size-5 text-terminal-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <CardTitle className="text-lg font-sans font-bold">{instruction.title}</CardTitle>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-terminal-accent/10 text-terminal-accent border-terminal-accent/20">
                {steps.length} {steps.length === 1 ? 'step' : 'steps'}
              </span>
              {instruction.sourceDoc && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border gap-1 inline-flex items-center">
                  <FileText className="size-3" />
                  {instruction.sourceDoc.title}
                </span>
              )}
            </div>
            {instruction.description && (
              <CardDescription className="font-sans">{instruction.description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
              AI
            </span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить инструкцию?</AlertDialogTitle>
                  <AlertDialogDescription>
                    &quot;{instruction.title}&quot; будет удалена без возможности восстановления.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(instruction.id)}>Удалить</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {expanded
              ? <ChevronDown className="size-4 text-muted-foreground" />
              : <ChevronRight className="size-4 text-muted-foreground" />
            }
          </div>
        </div>
      </CardHeader>

      {expanded && steps.length > 0 && (
        <CardContent className="pt-6 pb-6 px-6">
          {steps.map((step, idx) => (
            <StepCard key={instruction.id + '-' + idx} step={step} stepNumber={idx + 1} groupColor="#10b981" />
          ))}
        </CardContent>
      )}
    </Card>
  )
}
