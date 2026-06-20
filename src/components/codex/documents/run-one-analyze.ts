/**
 * Per-document analyze + auto-apply logic.
 *
 * Mirrors use-document-analysis.ts handleAnalyze + handleApplyAnalysis,
 * but as a standalone async function (no React state) so it can be called
 * from a sequential loop in use-batch-analyze.ts.
 *
 * Flow per doc:
 *   1. Skip if doc already has summary + tags (when skipAnalyzed=true).
 *   2. POST /api/ai/analyze with content.
 *   3. Create new category if suggestedNewCategory && !suggestedCategory.id.
 *   4. Create new tags (from newTagNames) — collect their IDs.
 *   5. PATCH /api/documents/{id} with summary, categoryId, tagIds.
 *
 * Returns { status, error? } where status ∈ 'applied' | 'failed' | 'skipped'.
 */
import type { AIAnalysis } from '@/lib/types'
import type { BatchAnalyzeInput, BatchAnalyzeStatus } from './batch-analyze-types'

interface RunOneResult {
  status: BatchAnalyzeStatus
  error?: string
}

export async function runOneAnalyze(
  doc: BatchAnalyzeInput,
  skipAnalyzed: boolean,
): Promise<RunOneResult> {
  // 1. Skip docs that already look analyzed.
  if (skipAnalyzed && doc.summary && doc.tags.length > 0) {
    return { status: 'skipped', error: 'already analyzed' }
  }

  try {
    // 2. Analyze
    const analyzeRes = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: doc.content }),
    })
    if (!analyzeRes.ok) {
      return { status: 'failed', error: `analyze HTTP ${analyzeRes.status}` }
    }
    const analysis: AIAnalysis = await analyzeRes.json()

    // 3. Resolve category
    let categoryId: string | null = analysis.suggestedCategory?.id || null
    if (analysis.suggestedNewCategory && !categoryId) {
      try {
        const catRes = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: analysis.suggestedNewCategory }),
        })
        if (catRes.ok) {
          const newCat = await catRes.json()
          categoryId = newCat.id
        }
      } catch {
        // continue without new category
      }
    }

    // 4. Resolve new tags
    const tagIds: string[] = [...new Set(analysis.matchedTags.map((t) => t.id))]
    for (const tagName of analysis.newTagNames) {
      try {
        const tagRes = await fetch('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tagName }),
        })
        if (tagRes.ok) {
          const newTag = await tagRes.json()
          tagIds.push(newTag.id)
        }
      } catch {
        // continue without this tag
      }
    }

    // 5. Apply
    const patchRes = await fetch(`/api/documents/${doc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: analysis.summary, categoryId, tagIds }),
    })
    if (!patchRes.ok) {
      return { status: 'failed', error: `apply HTTP ${patchRes.status}` }
    }

    return { status: 'applied' }
  } catch (err) {
    return {
      status: 'failed',
      error: err instanceof Error ? err.message : 'unknown error',
    }
  }
}
