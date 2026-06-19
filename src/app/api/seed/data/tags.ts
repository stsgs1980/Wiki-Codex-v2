// R-02 exception: pure data file (no logic), exceed limit is intentional

export interface SeedTag {
  name: string
  color: string
}

/** All seed tags share the same neutral color (matches original behavior). */
const TAG_COLOR = '#78716c'

export const SEED_TAGS: SeedTag[] = [
  'React',
  'TypeScript',
  'Next.js',
  'Node.js',
  'Docker',
  'API',
  'CSS',
  'Тестирование',
  'Производительность',
  'Безопасность',
].map((name) => ({ name, color: TAG_COLOR }))
