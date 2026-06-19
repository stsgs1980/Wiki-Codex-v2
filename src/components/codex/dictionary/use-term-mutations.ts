import type { DictionaryViewProps, DuplicateGroup, Term } from './types'

export interface ExtractResult {
  created: number
  skipped: number
}

export interface DuplicateFetchResult {
  duplicates: DuplicateGroup[]
  totalDuplicates: number
}

export interface MergeParams {
  keepId: string
  mergeIds: string[]
  keptTerm: Term
}

// Iterate documents, POST each one's content to /api/terms/parse, accumulate
// created/skipped counts. Per-document fetch errors are swallowed silently
// (matches the original inline behavior of catch-with-empty-block continue).
export async function extractTermsFromDocuments(
  documents: DictionaryViewProps['documents'],
  onProgress: (msg: string) => void,
): Promise<ExtractResult> {
  let totalCreated = 0
  let totalSkipped = 0
  const processedIds = new Set<string>()
  for (const doc of documents) {
    if (!doc.content || doc.content.trim().length < 50) continue
    if (processedIds.has(doc.id)) continue
    processedIds.add(doc.id)
    onProgress(`Обработка: ${doc.title}`)
    try {
      const res = await fetch('/api/terms/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: doc.content, documentId: doc.id }),
      })
      if (res.ok) {
        const data = await res.json()
        totalCreated += data.created || 0
        totalSkipped += data.skipped || 0
      }
    } catch { /* continue */ }
  }
  return { created: totalCreated, skipped: totalSkipped }
}

export async function deleteTermById(id: string): Promise<boolean> {
  const res = await fetch(`/api/terms?id=${id}`, { method: 'DELETE' })
  return res.ok
}

export async function batchDeleteTerms(ids: string[]): Promise<boolean> {
  const res = await fetch(`/api/terms?ids=${ids.join(',')}`, { method: 'DELETE' })
  return res.ok
}

export async function fetchDuplicateGroups(): Promise<DuplicateFetchResult | null> {
  const res = await fetch('/api/terms?duplicates=true')
  if (!res.ok) return null
  const data = await res.json()
  return {
    duplicates: data.duplicates || [],
    totalDuplicates: data.totalDuplicates || 0,
  }
}

export async function mergeDuplicateGroup(params: MergeParams): Promise<boolean> {
  const { keepId, mergeIds, keptTerm } = params
  const res = await fetch('/api/terms', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keepId,
      mergeIds,
      mergeTranslations: { translation: keptTerm.translation, explanation: keptTerm.explanation },
    }),
  })
  return res.ok
}
