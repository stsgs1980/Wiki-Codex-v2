import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

// ---------------------------------------------------------------------------
// 1. Content keyword rules (bilingual RU/EN)
// ---------------------------------------------------------------------------

const contentRules: Record<string, string[]> = {
  light: [
    'образование', 'education', 'обучен', 'курс', 'course',
    'школа', 'school', 'университет', 'university', 'учеб',
    'студенч', 'student', 'преподав', 'учитель', 'teacher',
    'школьн', 'академи', 'academy', 'лекци', 'lecture',
    'тренажёр', 'трениров', 'training', 'методич', 'учебник',
    'textbook', 'наставник', 'ментор', 'mentor', 'репетитор',
    'дошкольн', 'детски', 'воспитан', 'просвещен', 'enlighten',
  ],
  dark: [
    'ai', 'ии', 'искусственн', 'нейро', 'neuro',
    'ml', 'machine learning', 'глубок', 'deep',
    'data science', 'data', 'данн', 'analytics', 'аналити',
    'платформ', 'platform', 'saas', 'cloud', 'облачн',
    'генераци', 'generation', 'автоматиз', 'automation',
    'алгоритм', 'algorithm', 'модел', 'model',
    'predict', 'предсказ', 'robot', 'робот', 'кибер', 'cyber',
    'блокчейн', 'blockchain', 'crypto', 'крипто',
  ],
  mono: [
    'минимал', 'minimal', 'консол', 'console', 'cli',
    'терминал', 'terminal', 'devops', 'инфраструктур',
    'infrastructure', 'server', 'сервер', 'deploy', 'депло',
    'docker', 'container', 'контейнер', 'kubernetes', 'k8s',
    'ci/cd', 'pipeline', 'пайплайн', 'мониторинг', 'monitoring',
    'лог', 'log', 'ssh', 'vpn', 'proxy', 'прокси',
  ],
  outline: [
    'дизайн', 'design', 'креатив', 'creative', 'арт',
    'art', 'иллюстрац', 'illustration', 'график', 'graphic',
    'ui/ux', 'интерфейс', 'interface', 'макет', 'mockup',
    'прототип', 'prototype', 'figma', 'sketch', 'стиль',
    'style', 'бренд', 'brand', 'айдентика', 'identity',
    'типограф', 'typography', 'верстк', 'layout',
  ],
  inverted: [
    'безопасн', 'security', 'защит', 'protect',
    'firewall', 'файрвол', 'антивирус', 'antivirus',
    'шифрован', 'encrypt', 'аудит', 'audit', 'compliance',
    'соответств', 'приватн', 'privacy', 'gdpr',
    'vulnerability', 'уязвим', 'pentest', 'пенетрац',
    'инцидент', 'incident', 'threat', 'угроз', 'forensic',
  ],
}

// ---------------------------------------------------------------------------
// 2. Dark UI trigger keywords
// ---------------------------------------------------------------------------

const darkUIKeys: string[] = [
  'тёмн', 'темн', 'dark',
  'ночь', 'night', 'ночн',
  'чёрн', 'черн', 'black',
  'shadow', 'тень',
  'mode', 'режим',
  'oled', 'amoled',
  'obsidian', 'onyx',
]

// ---------------------------------------------------------------------------
// 3. Adaptation maps
// ---------------------------------------------------------------------------

const darkAdapt: Record<string, string> = {
  light: 'dark',
  mono: 'mono-dark',
  outline: 'outline-dark',
}

const lightAdapt: Record<string, string> = {
  dark: 'light',
  'mono-dark': 'mono',
  'outline-dark': 'outline',
}

// ---------------------------------------------------------------------------
// 4. Detection: content theme from description
// ---------------------------------------------------------------------------

function detectContent(desc: string): string {
  const lower = desc.toLowerCase()

  let bestTheme = 'light'
  let bestScore = 0

  for (const [name, keywords] of Object.entries(contentRules)) {
    const score = keywords.reduce(
      (sum, kw) => sum + (lower.includes(kw.toLowerCase()) ? 1 : 0),
      0,
    )
    if (score > bestScore) {
      bestTheme = name
      bestScore = score
    }
  }

  return bestTheme
}

// ---------------------------------------------------------------------------
// 5. Detection: dark UI preference from description
// ---------------------------------------------------------------------------

function detectDarkUI(desc: string): boolean {
  const lower = desc.toLowerCase()
  return darkUIKeys.some((k) => lower.includes(k.toLowerCase()))
}

// ---------------------------------------------------------------------------
// 6. Resolve: apply adaptation based on darkUI flag and mode override
// ---------------------------------------------------------------------------

function resolve(content: string, darkUI: boolean, mode: string): string {
  // Manual override takes priority
  if (mode === 'dark') darkUI = true
  if (mode === 'light') darkUI = false

  // If UI is dark, adapt light themes
  if (darkUI) {
    return darkAdapt[content] || content
  }

  // If UI is light, adapt dark themes
  return lightAdapt[content] || content
}

// ---------------------------------------------------------------------------
// 7. Read project description from package.json
// ---------------------------------------------------------------------------

function getProjectDescription(project: string): string {
  try {
    const pkgPath = join(process.cwd(), 'package.json')
    const raw = readFileSync(pkgPath, 'utf-8')
    const pkg = JSON.parse(raw) as { description?: string }
    return pkg.description || ''
  } catch {
    return ''
  }
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const project = searchParams.get('project') || 'wiki-codex'
    const mode = searchParams.get('mode') || 'auto'

    // Validate mode
    const validModes = ['auto', 'dark', 'light']
    if (!validModes.includes(mode)) {
      return NextResponse.json(
        { error: `Invalid mode "${mode}". Must be one of: auto, dark, light` },
        { status: 400 },
      )
    }

    // Read project description from package.json
    const description = getProjectDescription(project)

    // Detect content theme and dark UI preference
    const content = detectContent(description)
    const darkUI = detectDarkUI(description)

    // Resolve the final theme
    const theme = resolve(content, darkUI, mode)

    return NextResponse.json({
      project,
      content,
      darkUI,
      mode,
      theme,
    })
  } catch (error) {
    console.error('Error resolving logo theme:', error)
    return NextResponse.json(
      { error: 'Failed to resolve logo theme' },
      { status: 500 },
    )
  }
}
