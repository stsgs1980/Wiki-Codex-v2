import { create } from 'zustand'

export type ViewType =
  | 'dashboard'
  | 'documents'
  | 'upload'
  | 'document-view'
  | 'notes'
  | 'note-view'
  | 'dictionary'
  | 'instructions'

interface AppState {
  currentView: ViewType
  selectedDocumentId: string | null
  selectedNoteId: string | null
  searchQuery: string
  selectedCategoryId: string | null
  selectedTagId: string | null
  sidebarCollapsed: boolean
  semanticMode: boolean

  // Actions
  setView: (view: ViewType) => void
  selectDocument: (id: string | null) => void
  selectNote: (id: string | null) => void
  setSearchQuery: (query: string) => void
  setSelectedCategory: (categoryId: string | null) => void
  setSelectedTag: (tagId: string | null) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSemanticMode: () => void
  resetFilters: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard',
  selectedDocumentId: null,
  selectedNoteId: null,
  searchQuery: '',
  selectedCategoryId: null,
  selectedTagId: null,
  sidebarCollapsed: false,
  semanticMode: false,

  setView: (view) => set({ currentView: view }),
  selectDocument: (id) => set({ selectedDocumentId: id }),
  selectNote: (id) => set({ selectedNoteId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (categoryId) => set({ selectedCategoryId: categoryId, selectedTagId: null }),
  setSelectedTag: (tagId) => set({ selectedTagId: tagId, selectedCategoryId: null }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSemanticMode: () => set((state) => ({ semanticMode: !state.semanticMode })),
  resetFilters: () => set({ searchQuery: '', selectedCategoryId: null, selectedTagId: null }),
}))
