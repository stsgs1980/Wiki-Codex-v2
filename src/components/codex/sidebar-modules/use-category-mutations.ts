import type { SuggestedCategory } from './types'

export interface CreateCategoryInput {
  name: string
  color: string
  description?: string
}

/**
 * POST /api/categories — create a single category.
 * Returns true if the response was ok, false otherwise.
 */
export async function createCategory(input: CreateCategoryInput): Promise<boolean> {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return res.ok
}

/**
 * POST /api/categories (loop) — create multiple categories from AI suggestions.
 * Returns the count of successfully created categories.
 */
export async function createCategoriesBulk(items: SuggestedCategory[]): Promise<number> {
  let created = 0
  for (const cat of items) {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cat.name, description: cat.description, color: cat.color }),
    })
    if (res.ok) created++
  }
  return created
}

export interface SuggestCategoriesResult {
  categories: SuggestedCategory[]
  message?: string
}

/**
 * POST /api/categories/suggest — ask AI for category suggestions.
 * Returns null if the response was not ok.
 */
export async function suggestCategories(): Promise<SuggestCategoriesResult | null> {
  const res = await fetch('/api/categories/suggest', { method: 'POST' })
  if (!res.ok) return null
  const data = await res.json()
  return {
    categories: data.categories ?? [],
    message: data.message,
  }
}

/**
 * DELETE /api/categories?id=... — delete a single category.
 * Returns true if the response was ok, false otherwise.
 */
export async function deleteCategory(id: string): Promise<boolean> {
  const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' })
  return res.ok
}
