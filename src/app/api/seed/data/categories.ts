// R-02 exception: pure data file (no logic), exceed limit is intentional

export interface SeedCategory {
  /** Stable key used by documents to reference this category */
  key: string
  name: string
  description: string
  color: string
  sortOrder: number
}

export const SEED_CATEGORIES: SeedCategory[] = [
  { key: 'frontend', name: 'Фронтенд', description: 'HTML, CSS, JavaScript фреймворки', color: '#059669', sortOrder: 0 },
  { key: 'backend', name: 'Бэкенд', description: 'Серверная разработка', color: '#d97706', sortOrder: 1 },
  { key: 'devops', name: 'DevOps', description: 'CI/CD, Docker, Kubernetes', color: '#dc2626', sortOrder: 2 },
  { key: 'arch', name: 'Архитектура', description: 'Проектирование систем и паттерны', color: '#7c3aed', sortOrder: 3 },
]
