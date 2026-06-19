'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'wiki-codex-recently-viewed'
const MAX_ITEMS = 8

export interface RecentlyViewedItem {
  id: string
  title: string
  viewedAt: string
}

function readFromStorage(): RecentlyViewedItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as RecentlyViewedItem[]
  } catch {
    return []
  }
}

function writeToStorage(items: RecentlyViewedItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // localStorage may be full or unavailable
  }
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>(() => readFromStorage())

  // Sync across tabs via storage event
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setItems(e.newValue ? JSON.parse(e.newValue) : [])
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const addViewed = useCallback((doc: { id: string; title: string }) => {
    setItems((prev) => {
      // Remove existing entry for this doc (dedupe)
      const filtered = prev.filter((item) => item.id !== doc.id)
      // Add to front
      const newItem: RecentlyViewedItem = {
        id: doc.id,
        title: doc.title,
        viewedAt: new Date().toISOString(),
      }
      const updated = [newItem, ...filtered].slice(0, MAX_ITEMS)
      writeToStorage(updated)
      return updated
    })
  }, [])

  const clearHistory = useCallback(() => {
    setItems([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  return { items, addViewed, clearHistory }
}
