import { db } from '@/lib/db'
import { contains } from '@/lib/db-filter'
import { contentFingerprint, type DuplicateCheckResult } from '@/lib/content-hash'

/**
 * Two-level duplicate check:
 * 1. Exact title match (case-insensitive)
 * 2. Content similarity (near-duplicates with Jaccard ≥ 70%)
 *
 * Returns severity 'exact' | 'similar' | 'none' with the existing document's
 * id/title and a user-facing Russian message when a duplicate is found.
 */
export async function checkDuplicates(
  title: string,
  content: string,
  fp: { head: string; tail: string; length: number }
): Promise<DuplicateCheckResult> {
  // Level 1: Title match (case-insensitive at application level)
  const byTitleCandidates = await db.document.findMany({
    where: { title: contains(title) },
    select: { id: true, title: true, content: true },
  })
  const byTitle = byTitleCandidates.find(
    (d) => d.title.toLowerCase() === title.toLowerCase()
  )
  if (byTitle) {
    return {
      severity: 'exact',
      existingId: byTitle.id,
      existingTitle: byTitle.title,
      message: `Документ с заголовком "${byTitle.title}" уже существует`,
    }
  }

  // Level 2: Similar content (near-duplicate check via Jaccard similarity)
  const lengthMin = Math.floor(fp.length * 0.8)
  const lengthMax = Math.ceil(fp.length * 1.2)

  const candidates = await db.document.findMany({
    select: { id: true, title: true, content: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  for (const candidate of candidates) {
    const candidateFp = contentFingerprint(candidate.content)

    if (candidateFp.length < lengthMin || candidateFp.length > lengthMax) continue

    const wordsA = new Set(fp.head.split(/\s+/).filter(Boolean))
    const wordsB = new Set(candidateFp.head.split(/\s+/).filter(Boolean))
    const intersection = [...wordsA].filter((w) => wordsB.has(w))
    const union = new Set([...wordsA, ...wordsB])
    const jaccard = union.size > 0 ? intersection.length / union.size : 0

    if (jaccard >= 0.7) {
      return {
        severity: 'similar',
        existingId: candidate.id,
        existingTitle: candidate.title,
        message: `Обнаружен похожий документ: "${candidate.title}". Схожесть: ${Math.round(jaccard * 100)}%. Загрузить всё равно?`,
      }
    }
  }

  return { severity: 'none', existingId: null, existingTitle: null, message: null }
}
