'use client'

import { useState, useCallback } from 'react'
import { Copy, Check, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
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
import { useToast } from '@/hooks/use-toast'
import { StepCard } from './step-card'
import type { TemplateGroup } from './types'

/** Build a CSS color with alpha from a var() color token using color-mix */
function withAlpha(color: string, alpha: number): string {
  return `color-mix(in srgb, ${color} ${alpha}%, transparent)`
}

export function TemplateCard({ group, defaultExpanded = false, onHide }: { group: TemplateGroup; defaultExpanded?: boolean; onHide?: (id: string) => void }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [allCopied, setAllCopied] = useState(false)
  const { toast } = useToast()

  const handleCopyAll = useCallback(() => {
    const allCode = group.steps
      .flatMap((step) => step.codeBlocks.map((block) => `# ${block.label}\n${block.code}`))
      .join('\n\n')

    navigator.clipboard.writeText(`[${group.title}]\n${'='.repeat(40)}\n\n${allCode}`)
      .then(() => {
        setAllCopied(true)
        toast({ title: 'Вся инструкция скопирована', description: `"${group.title}" - скопировано в буфер` })
        setTimeout(() => setAllCopied(false), 2000)
      }).catch(() => {
        toast({ title: 'Ошибка', description: 'Не удалось скопировать', variant: 'destructive' })
      })
  }, [group, toast])

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md hover:shadow-terminal-accent/5">
      {/* Header with color accent */}
      <CardHeader
        className="cursor-pointer select-none pb-4 border-b border-border"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex items-center justify-center size-11 rounded-xl shrink-0"
            style={{
              background: `linear-gradient(135deg, ${withAlpha(group.color, 20)}, ${withAlpha(group.color, 5)})`,
              color: group.color,
            }}
          >
            {group.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <CardTitle className="text-lg font-sans font-bold">{group.title}</CardTitle>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: withAlpha(group.color, 10),
                  color: group.color,
                  borderColor: withAlpha(group.color, 20),
                }}
              >
                {group.steps.length} {group.steps.length === 1 ? 'step' : 'steps'}
              </span>
            </div>
            <CardDescription className="font-sans">{group.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
              template
            </span>
            {onHide && (
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
                      &quot;{group.title}&quot; будет удалена из списка.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onHide(group.id)}>Удалить</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs h-7 font-mono"
              onClick={(e) => { e.stopPropagation(); handleCopyAll() }}
            >
              {allCopied
                ? <><Check className="size-3 text-terminal-accent" />ok</>
                : <><Copy className="size-3" />copy all</>
              }
            </Button>
            {expanded
              ? <ChevronDown className="size-4 text-muted-foreground" />
              : <ChevronRight className="size-4 text-muted-foreground" />
            }
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-6 pb-6 px-6">
          {group.steps.map((step, idx) => (
            <StepCard key={group.id + '-' + idx} step={step} stepNumber={idx + 1} groupColor={group.color} />
          ))}
        </CardContent>
      )}
    </Card>
  )
}
