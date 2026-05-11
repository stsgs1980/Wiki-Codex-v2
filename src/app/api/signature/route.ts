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
  if (mode === 'dark') darkUI = true
  if (mode === 'light') darkUI = false

  if (darkUI) {
    return darkAdapt[content] || content
  }

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
// 8. Read SVG logo file for the resolved theme
// ---------------------------------------------------------------------------

function readLogoSvg(theme: string): string {
  const svgFileName = `${theme}.svg`
  const svgPath = join(process.cwd(), 'logos', svgFileName)

  try {
    return readFileSync(svgPath, 'utf-8')
  } catch {
    // Fallback to light.svg if the specific theme file doesn't exist
    try {
      return readFileSync(join(process.cwd(), 'logos', 'light.svg'), 'utf-8')
    } catch {
      return '<!-- logo not found -->'
    }
  }
}

// ---------------------------------------------------------------------------
// 9. Build HTML email signature
// ---------------------------------------------------------------------------

function buildSignatureHtml(params: {
  name: string
  role: string
  email: string
  phone: string
  logoSvg: string
}): string {
  const { name, role, email, phone } = params

  // Sanitize the inline SVG for safe HTML embedding
  const safeLogoSvg = params.logoSvg
    .replace(/<\?xml[^?]*\?>/g, '')
    .trim()

  const emailLink = email
    ? `<a href="mailto:${escapeHtml(email)}" style="color:#555555;text-decoration:none;">${escapeHtml(email)}</a>`
    : ''
  const phoneLink = phone
    ? `<a href="tel:${escapeHtml(phone)}" style="color:#555555;text-decoration:none;">${escapeHtml(phone)}</a>`
    : ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;">
<table cellpadding="0" cellspacing="0" border="0" style="border-top:3px solid #FA3913;padding-top:12px;max-width:480px;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td style="vertical-align:top;padding-right:16px;">
      <div style="width:48px;height:48px;">
        ${safeLogoSvg}
      </div>
    </td>
    <td style="vertical-align:top;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size:16px;font-weight:bold;color:#1a1a1a;padding-bottom:2px;">
            ${escapeHtml(name)}
          </td>
        </tr>
        ${role ? `<tr><td style="font-size:13px;color:#777777;padding-bottom:6px;">${escapeHtml(role)}</td></tr>` : ''}
        ${email ? `<tr><td style="font-size:13px;color:#555555;padding-bottom:2px;">${emailLink}</td></tr>` : ''}
        ${phone ? `<tr><td style="font-size:13px;color:#555555;">${phoneLink}</td></tr>` : ''}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// HTML entity escaping
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const project = searchParams.get('project') || 'wiki-codex'
    const name = searchParams.get('name') || ''
    const role = searchParams.get('role') || ''
    const email = searchParams.get('email') || ''
    const phone = searchParams.get('phone') || ''
    const mode = searchParams.get('mode') || 'auto'

    // Validate mode
    const validModes = ['auto', 'dark', 'light']
    if (!validModes.includes(mode)) {
      return NextResponse.json(
        { error: `Invalid mode "${mode}". Must be one of: auto, dark, light` },
        { status: 400 },
      )
    }

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Query parameter "name" is required' },
        { status: 400 },
      )
    }

    // Detect theme using the same logic as logo-theme
    const description = getProjectDescription(project)
    const content = detectContent(description)
    const darkUI = detectDarkUI(description)
    const theme = resolve(content, darkUI, mode)

    // Read the appropriate SVG file
    const logoSvg = readLogoSvg(theme)

    // Generate the HTML signature
    const html = buildSignatureHtml({
      name,
      role,
      email,
      phone,
      logoSvg,
    })

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Error generating signature:', error)
    return NextResponse.json(
      { error: 'Failed to generate signature' },
      { status: 500 },
    )
  }
}
