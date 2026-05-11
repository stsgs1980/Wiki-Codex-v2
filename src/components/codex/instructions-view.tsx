'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  ClipboardList,
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

interface CodeBlock {
  label: string
  code: string
}

interface Step {
  title: string
  description: string
  codeBlocks: CodeBlock[]
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

// --- Built-in Template Data (ASCII only) ---

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
        codeBlocks: [
          { label: 'Скачать данные', code: 'Открой в браузере: /api/download-db\nФайл wiki-codex-backup-YYYY-MM-DD.json скачается автоматически\nСодержит: все документы, заметки, инструкции, термины, категории, теги' },
        ],
      },
      {
        title: 'Создать бэкап',
        description: 'Создай моментальный снимок данных через API:',
        codeBlocks: [
          { label: 'API бэкапа', code: 'POST /api/backup\nВернёт статистику экспортированных данных' },
          { label: 'Скачать JSON', code: 'GET /api/download-db\nСкачает полный JSON-экспорт всех данных' },
        ],
      },
      {
        title: 'Восстановление на Vercel',
        description: 'Данные защищены управляемой PostgreSQL базой. Для восстановления:',
        codeBlocks: [
          { label: 'Vercel Postgres', code: 'Данные автоматически сохраняются в Vercel Postgres\nБэкапы управляются провайдером (Neon/Supabase)' },
          { label: 'Миграция', code: 'Импортируй JSON-экспорт через API\nPOST /api/documents — для каждого документа\nPOST /api/notes — для каждой заметки' },
        ],
      },
      {
        title: 'Проверь что всё работает',
        description: 'После развертывания открой приложение и проверь:',
        codeBlocks: [
          { label: 'Что проверить', code: '1. Sidebar -- счётчики не нули (документы, заметки, термины)\n2. Документы -- открой любой документ\n3. Заметки -- есть ли твои заметки\n4. Инструкции -- встроенные шаблоны видны\n5. Footer внизу -- "Built with: Next.js 16 + TypeScript + Tailwind CSS"' },
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
          { label: 'Переключиться', code: 'git checkout feature-name\n# или\n git switch feature-name' },
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

// --- Hidden templates persistence (localStorage) ---

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

// --- Dynamic count (accounts for hidden) ---

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

// --- Code Block with Copy ---

function CopyableCodeBlock({ label, code }: { label: string; code: string }) {
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

  return (
    <div className="group relative rounded-md border border-dashed bg-muted/30 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1 border-b border-dashed bg-muted/60">
        <span className="text-[10px] font-mono font-medium text-muted-foreground">{label}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 gap-1 px-1.5 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity font-mono"
          onClick={handleCopy}
        >
          {copied ? (
            <><Check className="size-2.5 text-green-600 dark:text-green-400" /><span className="text-green-600 dark:text-green-400">ok</span></>
          ) : (
            <><Copy className="size-2.5" /><span>copy</span></>
          )}
        </Button>
      </div>
      <pre className="px-3 py-2 overflow-x-auto text-[12px] leading-relaxed">
        <code className="font-mono text-foreground/85 whitespace-pre">{code}</code>
      </pre>
    </div>
  )
}

// --- Step Card ---

function StepCard({ step, stepNumber }: { step: Step; stepNumber: number }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="relative pl-8">
      <div className="absolute left-3 top-6 bottom-0 w-px border-l border-dashed" />
      <div className="absolute left-1 top-1.5 size-[22px] rounded-sm bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-mono font-bold ring-4 ring-background">
        {stepNumber}
      </div>
      <div className="pb-6 last:pb-0">
        <button
          className="flex items-center gap-2 text-left w-full group/step"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded
            ? <ChevronDown className="size-3 text-muted-foreground shrink-0 transition-transform" />
            : <ChevronRight className="size-3 text-green-600 dark:text-green-400 shrink-0 transition-transform" />
          }
          <h3 className="text-xs font-mono font-semibold text-foreground leading-tight group-hover/step:text-primary transition-colors">
            {step.title}
          </h3>
        </button>

        {expanded && (
          <div className="mt-3 flex flex-col gap-3">
            {step.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            )}
            {step.codeBlocks.map((block, idx) => (
              <CopyableCodeBlock key={`${block.label}-${idx}`} label={block.label} code={block.code} />
            ))}
          </div>
        )}
      </div>
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
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="cursor-pointer select-none pb-3" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center size-10 rounded-lg shrink-0"
            style={{ backgroundColor: group.color + '15', color: group.color }}
          >
            {group.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{group.title}</CardTitle>
              <Badge variant="secondary" className="text-[10px] px-1.5 shrink-0">
                {group.steps.length} {group.steps.length === 1 ? 'шаг' : 'шагов'}
              </Badge>
            </div>
            <CardDescription className="mt-1">{group.description}</CardDescription>
          </div>
          <div className="flex items-center gap-1 shrink-0 mt-0.5">
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
            {expanded
              ? <ChevronDown className="size-4 text-muted-foreground" />
              : <ChevronRight className="size-4 text-muted-foreground" />
            }
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 mb-5">
            <Badge variant="outline" className="text-[10px]">Шаблон</Badge>
            <Button variant="outline" size="sm" className="gap-2 text-xs h-7" onClick={(e) => { e.stopPropagation(); handleCopyAll() }}>
              {allCopied
                ? <><Check className="size-3 text-green-600 dark:text-green-400" />Скопировано</>
                : <><Copy className="size-3" />Копировать всё</>
              }
            </Button>
          </div>
          <div className="flex flex-col">
            {group.steps.map((step, idx) => (
              <StepCard key={group.id + '-' + idx} step={step} stepNumber={idx + 1} />
            ))}
          </div>
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
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="cursor-pointer select-none pb-3" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center size-10 rounded-lg shrink-0 bg-emerald-100 dark:bg-emerald-950">
            <Sparkles className="size-5 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">{instruction.title}</CardTitle>
              <Badge variant="secondary" className="text-[10px] px-1.5 shrink-0">
                {steps.length} {steps.length === 1 ? 'шаг' : 'шагов'}
              </Badge>
              {instruction.sourceDoc && (
                <Badge variant="outline" className="text-[10px] px-1.5 shrink-0 gap-1">
                  <FileText className="size-3" />
                  {instruction.sourceDoc.title}
                </Badge>
              )}
            </div>
            {instruction.description && (
              <CardDescription className="mt-1">{instruction.description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 mt-0.5">
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
        <CardContent className="pt-0">
          <div className="flex flex-col">
            {steps.map((step, idx) => (
              <StepCard key={instruction.id + '-' + idx} step={step} stepNumber={idx + 1} />
            ))}
          </div>
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
        s.codeBlocks.some((c) => c.code.toLowerCase().includes(q))
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
