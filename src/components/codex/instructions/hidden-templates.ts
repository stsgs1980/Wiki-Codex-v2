'use client'

import { BUILTIN_TEMPLATES } from './builtin-templates'

export const HIDDEN_KEY = 'wiki-codex:hidden-templates'

export function getHiddenIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(HIDDEN_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

export function addHiddenId(id: string) {
  const hidden = getHiddenIds()
  hidden.add(id)
  localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hidden]))
}

export function removeHiddenId(id: string) {
  const hidden = getHiddenIds()
  hidden.delete(id)
  localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hidden]))
}

export function useBuiltinVisibleCount(hiddenIds: Set<string>): number {
  return BUILTIN_TEMPLATES.filter((t) => !hiddenIds.has(t.id)).length
}
