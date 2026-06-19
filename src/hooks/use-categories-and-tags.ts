'use client'

import { useState, useCallback } from 'react'
import type { Category, Tag } from '@/lib/types'

export function useCategoriesAndTags() {
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])

  const fetchCategoriesAndTags = useCallback(async () => {
    try {
      const [catRes, tagRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/tags'),
      ])
      if (catRes.ok) setCategories(await catRes.json())
      if (tagRes.ok) setTags(await tagRes.json())
    } catch (error) {
      console.error('Error fetching categories/tags:', error)
    }
  }, [])

  return { categories, tags, setCategories, setTags, fetchCategoriesAndTags }
}
