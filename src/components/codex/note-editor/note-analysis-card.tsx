'use client'

import { X, Tag, Lightbulb } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface NoteAnalysis {
  suggestedTitle: string | null
  summary: string | null
  topics: string[]
  mood: string | null
}

interface NoteAnalysisCardProps {
  analysis: NoteAnalysis
  onDismiss: () => void
  onApplyTitle: () => void
}

export function NoteAnalysisCard({ analysis, onDismiss, onApplyTitle }: NoteAnalysisCardProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Lightbulb className="size-3 text-star" />
            <span className="text-xs font-mono font-semibold text-foreground">analysis</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-5"
            onClick={onDismiss}
          >
            <X className="size-2.5" />
          </Button>
        </div>

        {analysis.suggestedTitle && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-muted-foreground">title:</span>
            <span className="font-medium">{analysis.suggestedTitle}</span>
            <Button
              size="sm"
              className="h-5 px-2 text-[10px] gap-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 font-mono"
              onClick={onApplyTitle}
            >
              apply
            </Button>
          </div>
        )}

        {analysis.summary && (
          <p className="text-xs text-muted-foreground leading-relaxed font-mono">
            {analysis.summary}
          </p>
        )}

        {analysis.topics && analysis.topics.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            <Tag className="size-3 text-muted-foreground" />
            {analysis.topics.map((topic, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] font-mono">
                {topic}
              </Badge>
            ))}
          </div>
        )}

        {analysis.mood && (
          <div className="flex items-center gap-1 text-xs font-mono">
            <span className="text-muted-foreground">type:</span>
            <Badge variant="outline" className="text-[10px] font-mono">
              {analysis.mood}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
