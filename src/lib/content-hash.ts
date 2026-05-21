/**
 * Content hashing and similarity utilities for duplicate detection.
 *
 * Supports environments where crypto.subtle may be unavailable
 * (some edge runtimes, older Node.js) via fallback hashing.
 */

/**
 * Simple non-cryptographic hash (djb2 variant).
 * Used as fallback when crypto.subtle is unavailable.
 */
function djb2Hash(str: string): string {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0
  }
  return 'fb-' + Math.abs(h).toString(16).padStart(16, '0')
}

/**
 * Compute a SHA-256 hash of the content.
 * Returns hex string, or a fallback hash if crypto.subtle is unavailable.
 */
export async function computeContentHash(content: string): Promise<string> {
  // Try crypto.subtle first (Node.js 18+, browsers, Vercel)
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle?.digest) {
      const encoder = new TextEncoder()
      const data = encoder.encode(content)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    }
  } catch {
    // Fall through to fallback
  }

  // Fallback: djb2 hash on content fingerprint
  return djb2Hash(content.substring(0, 500) + content.length)
}

/**
 * Extract a "fingerprint" from content for similarity detection.
 * Returns first 200 chars + last 200 chars + length.
 * This catches near-duplicates (minor edits at beginning/end).
 */
export function contentFingerprint(content: string): {
  head: string
  tail: string
  length: number
} {
  const normalized = content.trim()
  return {
    head: normalized.substring(0, 200).toLowerCase(),
    tail: normalized.substring(Math.max(0, normalized.length - 200)).toLowerCase(),
    length: normalized.length,
  }
}

/**
 * Check if two contents are "similar" (near-duplicate).
 * Heuristic: same length ±10% and overlapping head/tail.
 */
export function isContentSimilar(
  a: string,
  b: string,
  options: { lengthTolerance?: number; headOverlap?: number } = {}
): boolean {
  const { lengthTolerance = 0.1, headOverlap = 0.8 } = options
  const fpA = contentFingerprint(a)
  const fpB = contentFingerprint(b)

  const lengthRatio = Math.min(fpA.length, fpB.length) / Math.max(fpA.length, fpB.length)
  if (lengthRatio < 1 - lengthTolerance) return false

  const wordsA = new Set(fpA.head.split(/\s+/).filter(Boolean))
  const wordsB = new Set(fpB.head.split(/\s+/).filter(Boolean))
  const intersection = [...wordsA].filter((w) => wordsB.has(w))
  const union = new Set([...wordsA, ...wordsB])
  const jaccard = union.size > 0 ? intersection.length / union.size : 0

  return jaccard >= headOverlap
}

/**
 * Severity level for duplicate detection result.
 */
export type DuplicateSeverity = 'exact' | 'similar' | 'none'

/**
 * Result of duplicate detection.
 */
export interface DuplicateCheckResult {
  severity: DuplicateSeverity
  existingId: string | null
  existingTitle: string | null
  message: string | null
}
