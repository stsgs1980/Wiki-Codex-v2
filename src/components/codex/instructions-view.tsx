'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  FolderGit2,
  Package,
  Terminal,
  Server,
  GitBranch,
  Search,
  FileCode,
  Trash2,
  Sparkles,
  Loader2,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Info,
  Lightbulb,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { TerminalFrame } from '@/components/codex/terminal-frame'

// --- Types ---

type StepType = 'step' | 'warning' | 'info' | 'tip'

interface CodeBlock {
  label: string
  code: string
}

interface Step {
  title: string
  description: string
  codeBlocks: CodeBlock[]
  type?: StepType
}

interface InstructionItem {
  id: string
  title: string
  description: string
  steps: string // JSON string from DB
  sourceDocId: string | null
  sourceDoc: { id: string; title: string } | null
  isBuiltIn: boolean
  createdAt: string
  updatedAt: string
}

// --- Step Type Config ---

const STEP_TYPE_CONFIG: Record<StepType, {
  icon: React.ReactNode
  label: string
  color: string
  bgClass: string
  borderClass: string
  textClass: string
  badgeClass: string
}> = {
  step: {
    icon: <ChevronRight className="size-4" />,
    label: 'step',
    color: '#71717a',
    bgClass: 'bg-zinc-500/5',
    borderClass: 'border-zinc-500/20',
    textClass: 'text-zinc-400',
    badgeClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  },
  warning: {
    icon: <AlertTriangle className="size-4" />,
    label: 'warning',
    color: '#d97706',
    bgClass: 'bg-amber-500/5',
    borderClass: 'border-amber-500/20',
    textClass: 'text-amber-400',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  info: {
    icon: <Info className="size-4" />,
    label: 'info',
    color: '#3b82f6',
    bgClass: 'bg-blue-500/5',
    borderClass: 'border-blue-500/20',
    textClass: 'text-blue-400',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  tip: {
    icon: <Lightbulb className="size-4" />,
    label: 'tip',
    color: '#22c55e',
    bgClass: 'bg-green-500/5',
    borderClass: 'border-green-500/20',
    textClass: 'text-green-400',
    badgeClass: 'bg-green-500/10 text-green-400 border-green-500/20',
  },
}

// --- Semantic Code Highlighting ---

function highlightCode(code: string): React.ReactNode[] {
  const lines = code.split('\n')
  return lines.map((line, lineIdx) => {
    const nodes: React.ReactNode[] = []
    let remaining = line
    let keyIdx = 0

    // Process each line for semantic tokens
    while (remaining.length > 0) {
      // Comment: starts with // or #
      const commentMatch = remaining.match(/^(\/\/|#)(.*)/)
      if (commentMatch) {
        nodes.push(<span key={keyIdx++} className="text-zinc-500">{commentMatch[0]}</span>)
        remaining = ''
        break
      }

      // HTTP method: POST, GET, PUT, DELETE, PATCH at start
      const methodMatch = remaining.match(/^(POST|GET|PUT|DELETE|PATCH)\b(.*)/)
      if (methodMatch) {
        nodes.push(<span key={keyIdx++} className="text-lime-400 font-semibold">{methodMatch[1]}</span>)
        remaining = methodMatch[2]
        continue
      }

      // API path: /api/...
      const pathMatch = remaining.match(/^(\/api\/[^\s]*)/)
      if (pathMatch) {
        nodes.push(<span key={keyIdx++} className="text-purple-400">{pathMatch[1]}</span>)
        remaining = remaining.slice(pathMatch[1].length)
        continue
      }

      // URL: https://...
      const urlMatch = remaining.match(/^(https?:\/\/[^\s]*)/)
      if (urlMatch) {
        nodes.push(<span key={keyIdx++} className="text-purple-400 underline decoration-purple-400/30">{urlMatch[1]}</span>)
        remaining = remaining.slice(urlMatch[1].length)
        continue
      }

      // Quoted string
      const quoteMatch = remaining.match(/^("([^"]*)"|'([^']*)')(.*)/)
      if (quoteMatch) {
        nodes.push(<span key={keyIdx++} className="text-amber-400">{quoteMatch[1]}</span>)
        remaining = quoteMatch[4] || ''
        continue
      }

      // Numbered list item: 1. 2. etc
      const numMatch = remaining.match(/^(\d+\.\s)(.*)/)
      if (numMatch) {
        nodes.push(<span key={keyIdx++} className="text-green-400 font-semibold">{numMatch[1]}</span>)
        remaining = numMatch[2]
        continue
      }

      // Flag: --something
      const flagMatch = remaining.match(/^(--[\w-]+)(.*)/)
      if (flagMatch) {
        nodes.push(<span key={keyIdx++} className="text-blue-400">{flagMatch[1]}</span>)
        remaining = flagMatch[2]
        continue
      }

      // Environment var: KEY=value or KEY=value
      const envMatch = remaining.match(/^([A-Z_][A-Z0-9_]*=)([^\s]*)(.*)/)
      if (envMatch) {
        nodes.push(<span key={keyIdx++} className="text-cyan-400">{envMatch[1]}</span>)
        nodes.push(<span key={keyIdx++} className="text-amber-300">{envMatch[2]}</span>)
        remaining = envMatch[3]
        continue
      }

      // File path: .ext files, ~/. paths
      const fileMatch = remaining.match(/^(\.?\/?[~./][\w./-]+\.[\w]+)(.*)/)
      if (fileMatch) {
        nodes.push(<span key={keyIdx++} className="text-cyan-300">{fileMatch[1]}</span>)
        remaining = fileMatch[2]
        continue
      }

      // No match: take one character as plain text
      nodes.push(<span key={keyIdx++}>{remaining[0]}</span>)
      remaining = remaining.slice(1)
    }

    return (
      <span key={lineIdx}>
        {nodes}
        {lineIdx < lines.length - 1 ? '\n' : ''}
      </span>
    )
  })
}

// --- Built-in Template Data ---

interface TemplateGroup {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  color: string
  steps: Step[]
}

const BUILTIN_TEMPLATES: TemplateGroup[] = [
  {
    id: 'survival-guide',
    icon: <ShieldCheck className="size-5" />,
    title: 'Survival Guide',
    description: 'Как экспортировать данные и восстановить информацию',
    color: '#dc2626',
    steps: [
      {
        title: 'Экспорт данных (JSON)',
        description: 'Все данные хранятся в облачной PostgreSQL базе. Экспортируй данные в JSON для резервной копии:',
        type: 'important' as StepType,
        codeBlocks: [
          { label: 'Скачать данные', code: '// Открой в браузере\n/api/download-db\n\n// Файл скачается автоматически\nwiki-codex-backup-YYYY-MM-DD.json\n\n// Содержит:\n  - документы\n  - заметки\n  - инструкции\n  - термины, категории, теги' },
        ],
      },
      {
        title: 'Создать бэкап',
        description: 'Создай моментальный снимок данных через API:',
        codeBlocks: [
          { label: 'API бэкапа', code: 'POST /api/backup\n// Вернёт статистику экспортированных данных' },
          { label: 'Скачать JSON', code: 'GET /api/download-db\n// Скачает полный JSON-экспорт всех данных' },
        ],
      },
      {
        title: 'Восстановление на Vercel',
        description: 'Данные защищены управляемой PostgreSQL базой. Для восстановления:',
        type: 'warning',
        codeBlocks: [
          { label: 'Vercel Postgres', code: '// Данные автоматически сохраняются\n// Бэкапы управляются провайдером\nNeon/Supabase' },
          { label: 'Миграция', code: '// Импортируй JSON-экспорт через API\nPOST /api/documents -- для каждого документа\nPOST /api/notes -- для каждой заметки' },
        ],
      },
      {
        title: 'Проверь что всё работает',
        description: 'После развертывания открой приложение и проверь:',
        type: 'tip',
        codeBlocks: [
          { label: 'Что проверить', code: '1. Sidebar -- счётчики не нули\n2. Документы -- открой любой документ\n3. Заметки -- есть ли твои заметки\n4. Инструкции -- встроенные шаблоны видны\n5. Footer -- "Built with: Next.js 16 + TypeScript + Tailwind CSS"' },
        ],
      },
      {
        title: 'Локальная разработка',
        description: 'Для локальной разработки используй PostgreSQL:',
        codeBlocks: [
          { label: '.env', code: 'DATABASE_URL=postgresql://user:password@localhost:5432/wiki_codex' },
          { label: 'Миграции', code: 'npx prisma migrate dev\nnpx prisma db push' },
          { label: 'Запуск', code: 'bun run dev' },
        ],
      },
    ],
  },
  {
    id: 'git-bundle',
    icon: <FolderGit2 className="size-5" />,
    title: 'Создание Bundle',
    description: 'Как упаковать Git репозиторий в bundle файл для передачи без доступа к серверу',
    color: '#ea580c',
    steps: [
      {
        title: 'Найти Git репозиторий',
        description: 'Убедись, что в папке проекта есть папка .git:',
        codeBlocks: [
          { label: 'Windows', code: 'dir' },
          { label: 'Linux / Mac / Git Bash', code: 'ls -la' },
        ],
      },
      {
        title: 'Создать bundle файл',
        description: 'Упакуй весь репозиторий в один .bundle файл:',
        codeBlocks: [
          { label: 'Полный bundle', code: 'git bundle create repo.bundle --all' },
          { label: 'Только определённая ветка', code: 'git bundle create repo.bundle main' },
          { label: 'Последние N коммитов', code: 'git bundle create repo.bundle main~10..main' },
        ],
      },
      {
        title: 'Проверить bundle',
        description: 'Убедись, что bundle создан корректно:',
        type: 'tip',
        codeBlocks: [
          { label: 'Проверка', code: 'git bundle verify repo.bundle' },
          { label: 'Содержимое', code: 'git bundle list-heads repo.bundle' },
        ],
      },
      {
        title: 'Клонировать из bundle',
        description: 'На целевой машине клонируй проект:',
        codeBlocks: [
          { label: 'Клонирование', code: 'git clone repo.bundle my-project' },
          { label: 'В текущую папку', code: 'git clone repo.bundle .' },
        ],
      },
      {
        title: 'Настроить remote',
        description: 'После клонирования добавь настоящий remote:',
        codeBlocks: [
          { label: 'Добавить remote', code: 'git remote add origin https://github.com/user/repo.git' },
          { label: 'Проверить', code: 'git remote -v' },
        ],
      },
    ],
  },
  {
    id: 'git-basics',
    icon: <GitBranch className="size-5" />,
    title: 'Основы Git',
    description: 'Базовые команды Git для повседневной работы',
    color: '#16a34a',
    steps: [
      {
        title: 'Инициализация репозитория',
        description: 'Создать новый Git репозиторий:',
        codeBlocks: [
          { label: 'Инициализация', code: 'git init' },
          { label: 'Клонировать', code: 'git clone https://github.com/user/repo.git' },
        ],
      },
      {
        title: 'Базовый рабочий цикл',
        description: 'Стандартная последовательность: изменить -> добавить -> закоммитить:',
        type: 'info',
        codeBlocks: [
          { label: 'Статус', code: 'git status' },
          { label: 'Добавить всё', code: 'git add .' },
          { label: 'Коммит', code: 'git commit -m "Описание изменений"' },
        ],
      },
      {
        title: 'Ветвления',
        description: 'Работа с ветками:',
        codeBlocks: [
          { label: 'Создать ветку', code: 'git branch feature-name' },
          { label: 'Переключиться', code: 'git checkout feature-name\n# или\ngit switch feature-name' },
          { label: 'Создать и переключиться', code: 'git checkout -b feature-name' },
        ],
      },
    ],
  },
  {
    id: 'project-setup',
    icon: <Package className="size-5" />,
    title: 'Настройка проекта',
    description: 'Начальная настройка: зависимости, .env, база данных',
    color: '#9333ea',
    steps: [
      {
        title: 'Установить зависимости',
        description: 'Установить все пакеты:',
        codeBlocks: [
          { label: 'bun', code: 'bun install' },
          { label: 'npm', code: 'npm install' },
        ],
      },
      {
        title: 'Настроить .env',
        description: 'Создать файл .env на основе шаблона:',
        type: 'warning',
        codeBlocks: [
          { label: 'Копировать шаблон', code: 'cp .env.example .env' },
        ],
      },
      {
        title: 'База данных (Prisma)',
        description: 'Применить схему:',
        codeBlocks: [
          { label: 'Применить миграции', code: 'npx prisma db push' },
          { label: 'Prisma Studio', code: 'npx prisma studio' },
        ],
      },
      {
        title: 'Запустить проект',
        description: 'Запустить dev сервер:',
        type: 'tip',
        codeBlocks: [
          { label: 'bun', code: 'bun run dev' },
          { label: 'npm', code: 'npm run dev' },
        ],
      },
    ],
  },
  {
    id: 'server-commands',
    icon: <Server className="size-5" />,
    title: 'Серверные команды',
    description: 'Полезные команды: порты, процессы, диагностика',
    color: '#0891b2',
    steps: [
      {
        title: 'Работа с портами',
        description: 'Проверить, какой процесс занимает порт:',
        codeBlocks: [
          { label: 'Проверить порт', code: 'lsof -i:3000' },
          { label: 'Убить процесс', code: 'lsof -ti:3000 | xargs kill -9' },
        ],
      },
      {
        title: 'Управление процессами',
        description: 'Фоновые процессы:',
        codeBlocks: [
          { label: 'Список Node', code: 'ps aux | grep node' },
          { label: 'Убить по PID', code: 'kill -9 <PID>' },
          { label: 'Запуск в фоне', code: 'npm run dev > dev.log 2>&1 &' },
        ],
      },
    ],
  },
  {
    id: 'docker',
    icon: <Terminal className="size-5" />,
    title: 'Docker',
    description: 'Контейнеры, образы, Docker Compose',
    color: '#0891b2',
    steps: [
      {
        title: 'Контейнеры',
        description: 'Запуск и управление:',
        codeBlocks: [
          { label: 'Запустить', code: 'docker run -d --name myapp -p 3000:3000 myimage' },
          { label: 'Список', code: 'docker ps' },
          { label: 'Остановить', code: 'docker stop myapp' },
        ],
      },
      {
        title: 'Docker Compose',
        description: 'Многоконтейнерные приложения:',
        codeBlocks: [
          { label: 'Запустить', code: 'docker compose up -d' },
          { label: 'Остановить', code: 'docker compose down' },
          { label: 'Логи', code: 'docker compose logs -f' },
        ],
      },
    ],
  },
  {
    id: 'useful-commands',
    icon: <FileCode className="size-5" />,
    title: 'Полезные утилиты',
    description: 'SSH, поиск, архивация',
    color: '#c026d3',
    steps: [
      {
        title: 'SSH ключи',
        description: 'Генерация и управление:',
        type: 'warning',
        codeBlocks: [
          { label: 'Создать ключ', code: 'ssh-keygen -t ed25519 -C "email@example.com"' },
          { label: 'Публичный ключ', code: 'cat ~/.ssh/id_ed25519.pub' },
        ],
      },
      {
        title: 'Архивация',
        description: 'Работа с архивами:',
        codeBlocks: [
          { label: 'tar.gz', code: 'tar -czf archive.tar.gz folder/' },
          { label: 'Распаковать', code: 'tar -xzf archive.tar.gz' },
        ],
      },
    ],
  },
]

// --- Helpers ---

const HIDDEN_KEY = 'wiki-codex:hidden-templates'

function getHiddenIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(HIDDEN_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function addHiddenId(id: string) {
  const hidden = getHiddenIds()
  hidden.add(id)
  localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hidden]))
}

function removeHiddenId(id: string) {
  const hidden = getHiddenIds()
  hidden.delete(id)
  localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hidden]))
}

export function useBuiltinVisibleCount(hiddenIds: Set<string>): number {
  return BUILTIN_TEMPLATES.filter((t) => !hiddenIds.has(t.id)).length
}

export const BUILTIN_COUNT = BUILTIN_TEMPLATES.length

function parseSteps(stepsJson: string): Step[] {
  try {
    return JSON.parse(stepsJson)
  } catch {
    return []
  }
}

// Resolve step type - normalize unknown types to 'step'
function resolveStepType(type?: string): StepType {
  if (type && type in STEP_TYPE_CONFIG) return type as StepType
  // Map 'important' to 'info' as a reasonable default
  if (type === 'important') return 'info'
  return 'step'
}

// --- Code Block with Semantic Highlighting ---

function CopyableCodeBlock({ label, code, accentColor }: { label: string; code: string; accentColor?: string }) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast({ title: 'Скопировано', description: 'Команда скопирована в буфер обмена' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось скопировать', variant: 'destructive' })
    }
  }, [code, toast])

  const highlighted = useMemo(() => highlightCode(code), [code])

  return (
    <div className="group/code rounded-lg border border-border overflow-hidden bg-zinc-950 dark:bg-zinc-950">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <span
            className="size-2 rounded-full shrink-0"
            style={{ backgroundColor: accentColor ? accentColor + '99' : undefined }}
          />
          <span className="text-[11px] font-mono font-medium text-muted-foreground">{label}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1.5 px-2 text-[11px] opacity-0 group-hover/code:opacity-100 transition-opacity font-mono"
          onClick={handleCopy}
        >
          {copied ? (
            <><Check className="size-3 text-green-600 dark:text-green-400" /><span className="text-green-600 dark:text-green-400">ok</span></>
          ) : (
            <><Copy className="size-3" /><span>copy</span></>
          )}
        </Button>
      </div>
      <pre className="px-4 py-3 overflow-x-auto text-[13px] leading-relaxed">
        <code className="font-mono whitespace-pre text-foreground/90">{highlighted}</code>
      </pre>
    </div>
  )
}

// --- Step Callout Box (for warning/info/tip) ---

function StepCallout({ type, description }: { type: StepType; description: string }) {
  const config = STEP_TYPE_CONFIG[type]
  if (type === 'step') return null

  return (
    <div className={cn('flex items-start gap-3 p-3 rounded-lg border', config.bgClass, config.borderClass)}>
      <div className={cn('shrink-0 mt-0.5', config.textClass)}>
        {config.icon}
      </div>
      <p className={cn('text-sm leading-relaxed', type === 'warning' ? 'text-amber-200/80' : type === 'info' ? 'text-blue-200/80' : 'text-green-200/80')}>
        {description}
      </p>
    </div>
  )
}

// --- Step Card (Redesigned) ---

function StepCard({ step, stepNumber, groupColor }: { step: Step; stepNumber: number; groupColor: string }) {
  const [expanded, setExpanded] = useState(true)
  const stepType = resolveStepType(step.type)
  const typeConfig = STEP_TYPE_CONFIG[stepType]
  const activeColor = stepType === 'step' ? groupColor : typeConfig.color

  return (
    <div className="relative pl-10 pb-8 last:pb-0">
      {/* Colored gradient timeline line */}
      <div
        className="absolute left-[15px] top-9 bottom-0 w-[2px] rounded-full"
        style={{
          background: `linear-gradient(to bottom, ${activeColor}60, ${activeColor}10)`,
        }}
      />
      {/* Number badge with glow */}
      <div
        className="absolute left-0.5 top-0 size-7 rounded-lg flex items-center justify-center text-[11px] font-mono font-bold text-white"
        style={{
          backgroundColor: activeColor,
          boxShadow: `0 0 12px ${activeColor}40`,
        }}
      >
        {stepNumber}
      </div>

      <div>
        <button
          className="flex items-center gap-2.5 text-left w-full group/step"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded
            ? <ChevronDown className="size-4 text-muted-foreground shrink-0 transition-transform group-hover/step:text-primary" />
            : <ChevronRight className="size-4 text-green-600 dark:text-green-400 shrink-0 transition-transform" />
          }
          <h3 className="text-sm font-semibold text-foreground leading-snug group-hover/step:text-primary transition-colors font-sans">
            {step.title}
          </h3>
          {stepType !== 'step' && (
            <span className={cn('text-[10px] font-mono px-2 py-0.5 rounded-full border', typeConfig.badgeClass)}>
              {typeConfig.label}
            </span>
          )}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 pl-6">
          {/* Callout box for non-default types */}
          {stepType !== 'step' && step.description && (
            <StepCallout type={stepType} description={step.description} />
          )}
          {/* Regular description for default type */}
          {stepType === 'step' && step.description && (
            <p className="text-sm text-muted-foreground leading-relaxed font-sans">{step.description}</p>
          )}
          {step.codeBlocks.map((block, idx) => (
            <CopyableCodeBlock key={`${block.label}-${idx}`} label={block.label} code={block.code} accentColor={activeColor} />
          ))}
        </div>
      )}
    </div>
  )
}

// --- Instruction Group Card (Template) ---

function TemplateCard({ group, defaultExpanded = false, onHide }: { group: TemplateGroup; defaultExpanded?: boolean; onHide?: (id: string) => void }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [allCopied, setAllCopied] = useState(false)
  const { toast } = useToast()

  const handleCopyAll = useCallback(() => {
    const allCode = group.steps
      .flatMap((step) => step.codeBlocks.map((block) => `# ${block.label}\n${block.code}`))
      .join('\n\n')

    navigator.clipboard.writeText(`[${group.title}]\n${'='.repeat(40)}\n\n${allCode}`)
      .then(() => {
        setAllCopied(true)
        toast({ title: 'Вся инструкция скопирована', description: `"${group.title}" - скопировано в буфер` })
        setTimeout(() => setAllCopied(false), 2000)
      }).catch(() => {
        toast({ title: 'Ошибка', description: 'Не удалось скопировать', variant: 'destructive' })
      })
  }, [group, toast])

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md hover:shadow-primary/5">
      {/* Header with color accent */}
      <CardHeader
        className="cursor-pointer select-none pb-4 border-b border-border"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex items-center justify-center size-11 rounded-xl shrink-0"
            style={{
              background: `linear-gradient(135deg, ${group.color}20, ${group.color}05)`,
              color: group.color,
            }}
          >
            {group.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <CardTitle className="text-lg font-sans font-bold">{group.title}</CardTitle>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: group.color + '15',
                  color: group.color,
                  borderColor: group.color + '30',
                }}
              >
                {group.steps.length} {group.steps.length === 1 ? 'step' : 'steps'}
              </span>
            </div>
            <CardDescription className="font-sans">{group.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
              template
            </span>
            {onHide && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Удалить инструкцию?</AlertDialogTitle>
                    <AlertDialogDescription>
                      &quot;{group.title}&quot; будет удалена из списка.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onHide(group.id)}>Удалить</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs h-7 font-mono"
              onClick={(e) => { e.stopPropagation(); handleCopyAll() }}
            >
              {allCopied
                ? <><Check className="size-3 text-green-600 dark:text-green-400" />ok</>
                : <><Copy className="size-3" />copy all</>
              }
            </Button>
            {expanded
              ? <ChevronDown className="size-4 text-muted-foreground" />
              : <ChevronRight className="size-4 text-muted-foreground" />
            }
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-6 pb-6 px-6">
          {group.steps.map((step, idx) => (
            <StepCard key={group.id + '-' + idx} step={step} stepNumber={idx + 1} groupColor={group.color} />
          ))}
        </CardContent>
      )}
    </Card>
  )
}

// --- Instruction Card (from DB) ---

function DbInstructionCard({
  instruction,
  onDelete,
}: {
  instruction: InstructionItem
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const steps = parseSteps(instruction.steps)

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md hover:shadow-emerald-500/5">
      <CardHeader
        className="cursor-pointer select-none pb-4 border-b border-border"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center size-11 rounded-xl shrink-0 bg-emerald-100 dark:bg-emerald-950">
            <Sparkles className="size-5 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <CardTitle className="text-lg font-sans font-bold">{instruction.title}</CardTitle>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                {steps.length} {steps.length === 1 ? 'step' : 'steps'}
              </span>
              {instruction.sourceDoc && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border gap-1 inline-flex items-center">
                  <FileText className="size-3" />
                  {instruction.sourceDoc.title}
                </span>
              )}
            </div>
            {instruction.description && (
              <CardDescription className="font-sans">{instruction.description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
              AI
            </span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить инструкцию?</AlertDialogTitle>
                  <AlertDialogDescription>
                    &quot;{instruction.title}&quot; будет удалена без возможности восстановления.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(instruction.id)}>Удалить</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {expanded
              ? <ChevronDown className="size-4 text-muted-foreground" />
              : <ChevronRight className="size-4 text-muted-foreground" />
            }
          </div>
        </div>
      </CardHeader>

      {expanded && steps.length > 0 && (
        <CardContent className="pt-6 pb-6 px-6">
          {steps.map((step, idx) => (
            <StepCard key={instruction.id + '-' + idx} step={step} stepNumber={idx + 1} groupColor="#10b981" />
          ))}
        </CardContent>
      )}
    </Card>
  )
}

// --- Main View ---

export function InstructionsView({ onCountChange }: { onCountChange?: () => void }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [dbInstructions, setDbInstructions] = useState<InstructionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractDialogOpen, setExtractDialogOpen] = useState(false)
  const [selectedDocId, setSelectedDocId] = useState('')
  const [documents, setDocuments] = useState<{ id: string; title: string }[]>([])

  const { toast } = useToast()

  // Fetch DB instructions + documents list
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [instrRes, docRes] = await Promise.all([
        fetch('/api/instructions'),
        fetch('/api/documents?limit=100'),
      ])
      if (instrRes.ok) {
        const data = await instrRes.json()
        setDbInstructions(data.instructions || [])
      }
      if (docRes.ok) {
        const data = await docRes.json()
        setDocuments((data.documents || []).map((d: { id: string; title: string }) => ({ id: d.id, title: d.title })))
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Extract instructions from a document
  const handleExtract = useCallback(async () => {
    if (!selectedDocId) return
    setIsExtracting(true)
    try {
      const res = await fetch('/api/instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractFromDocId: selectedDocId }),
      })
      if (res.ok) {
        const data = await res.json()
        const count = data.total || 0
        if (count > 0) {
          toast({ title: `Извлечено ${count} инструкций`, description: 'Из документа: ' + (documents.find((d) => d.id === selectedDocId)?.title || '') })
        } else {
          toast({ title: 'Инструкции не найдены', description: data.message || 'Попробуйте другой документ', variant: 'destructive' })
        }
        fetchData()
        setExtractDialogOpen(false)
        setSelectedDocId('')
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось извлечь инструкции', variant: 'destructive' })
    } finally {
      setIsExtracting(false)
    }
  }, [selectedDocId, documents, fetchData, toast])

  // Hidden built-in templates
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setHiddenIds(getHiddenIds())
  }, [])

  const handleHideTemplate = useCallback((id: string) => {
    addHiddenId(id)
    setHiddenIds(getHiddenIds())
    toast({ title: 'Инструкция удалена' })
    onCountChange?.()
  }, [toast, onCountChange])

  // Delete instruction (DB)
  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/instructions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Удалено' })
        fetchData()
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить', variant: 'destructive' })
    }
  }, [fetchData, toast])

  // Filter
  const q = searchQuery.toLowerCase()
  const filteredTemplates = BUILTIN_TEMPLATES.filter((g) => {
    if (hiddenIds.has(g.id)) return false
    if (!q) return true
    return (
      g.title.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      g.steps.some((s) =>
        s.title.toLowerCase().includes(q) ||
        s.codeBlocks.some((c) => c.label.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
      )
    )
  })

  const filteredDb = dbInstructions.filter((i) => {
    if (!q) return true
    const steps = parseSteps(i.steps)
    return (
      i.title.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      steps.some((s) =>
        s.title.toLowerCase().includes(q) ||
        s.codeBlocks.some((c) => c.code.toLowerCase().includes(c.code.toLowerCase()))
      )
    )
  })

  const visibleBuiltinCount = BUILTIN_COUNT - hiddenIds.size
  const totalCount = visibleBuiltinCount + dbInstructions.length

  return (
    <TerminalFrame title="instructions" className="m-4 md:m-6" headerRight={
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
          {totalCount}
        </Badge>
        <Dialog open={extractDialogOpen} onOpenChange={setExtractDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" disabled={documents.length === 0}>
              <Sparkles className="size-3 text-amber-500" />
              <span className="hidden sm:inline">extract</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Извлечь инструкции</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 pt-2">
              <p className="text-sm text-muted-foreground">
                AI проанализирует документ и извлечёт все пошаговые инструкции автоматически.
              </p>
              <Select value={selectedDocId} onValueChange={setSelectedDocId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите документ..." />
                </SelectTrigger>
                <SelectContent>
                  {documents.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleExtract}
                disabled={!selectedDocId || isExtracting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                {isExtracting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {isExtracting ? 'AI анализирует...' : 'Извлечь инструкции'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    }>
      <div className="flex flex-col gap-4 p-3 sm:p-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          placeholder="grep -r ... (search instructions)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 font-mono text-xs h-8"
        />
      </div>

      {/* DB Instructions (extracted) */}
      {filteredDb.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span className="text-green-600 dark:text-green-400 select-none">$</span>
            <span>extracted from documents</span>
          </div>
          {filteredDb.map((instr) => (
            <DbInstructionCard key={instr.id} instruction={instr} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Separator */}
      {filteredDb.length > 0 && filteredTemplates.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border border-dashed" />
          <span className="text-[10px] font-mono text-muted-foreground/60">built-in</span>
          <div className="flex-1 h-px bg-border border-dashed" />
        </div>
      )}

      {/* Templates (built-in) */}
      <div className="flex flex-col gap-4">
        {filteredTemplates.length === 0 && filteredDb.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="font-mono text-xs text-muted-foreground mb-1">~ no match found</p>
            <p className="text-muted-foreground text-sm">
              Ничего не найдено по запросу &quot;{searchQuery}&quot;
            </p>
          </div>
        ) : (
          filteredTemplates.map((group, idx) => (
            <TemplateCard key={group.id} group={group} defaultExpanded={filteredDb.length === 0 && idx === 0} onHide={handleHideTemplate} />
          ))
        )}
      </div>
      </div>
    </TerminalFrame>
  )
}
