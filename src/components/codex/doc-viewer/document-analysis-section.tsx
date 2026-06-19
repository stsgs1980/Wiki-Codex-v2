'use client'

import { Loader2, Sparkles, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { AIAnalysis } from '@/lib/types'

interface DocumentAnalysisSectionProps {
  isAnalyzing: boolean
  analysis: AIAnalysis | null
  isApplying: boolean
  onAnalyze: () => void
  onApplyAnalysis: () => void
}

export function DocumentAnalysisSection({
  isAnalyzing, analysis, isApplying, onAnalyze, onApplyAnalysis,
}: DocumentAnalysisSectionProps) {
  return (
    <>
      {/* AI Analysis Controls */}
      <div className="flex items-center gap-2 mb-3">
        <Button variant="outline" size="sm" onClick={onAnalyze} disabled={isAnalyzing} className="gap-1.5 text-xs h-6 font-mono">
          {isAnalyzing ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
          analyze
        </Button>
        {analysis && !isAnalyzing && (
          <Button variant="outline" size="sm" onClick={onApplyAnalysis} disabled={isApplying} className="gap-1.5 text-xs h-6 font-mono">
            {isApplying ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
            apply
          </Button>
        )}
      </div>

      {/* AI Analysis Result */}
      {analysis && (
        <div className="bg-muted border border-dashed rounded-md p-3 mb-3 flex flex-col gap-2 text-xs font-mono">
          <div>
            <span className="text-muted-foreground">summary: </span>
            <span className="text-foreground">{analysis.summary}</span>
          </div>
          <Separator />
          <div>
            <span className="text-muted-foreground">category: </span>
            {analysis.suggestedCategory ? (
              <Badge variant="secondary" className="text-3xs">{analysis.suggestedCategory.name}</Badge>
            ) : analysis.suggestedNewCategory ? (
              <Badge variant="outline" className="text-3xs">new: {analysis.suggestedNewCategory}</Badge>
            ) : (
              <span className="text-muted-foreground">--</span>
            )}
          </div>
          {analysis.matchedTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-muted-foreground">tags:</span>
              {Array.from(
                new Map(analysis.matchedTags.map((t) => [t.id, t])).values()
              ).map((t) => (
                <Badge key={t.id} variant="outline" className="text-3xs">{t.name}</Badge>
              ))}
              {analysis.newTagNames.map((n, i) => (
                <Badge key={i} variant="secondary" className="text-3xs">+{n}</Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
