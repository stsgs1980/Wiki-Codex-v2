'use client'

import { ShieldCheck, FolderGit2 } from 'lucide-react'
import type { TemplateGroup } from './types'

/**
 * Built-in instruction templates group A — part 1.
 * Contains: survival-guide, git-bundle.
 * Pure data module consumed by `builtin-templates-a.tsx`.
 */
export const TEMPLATES_A_PART_1: TemplateGroup[] = [
  {
    id: 'survival-guide',
    icon: <ShieldCheck className="size-5" />,
    title: 'Survival Guide',
    description: 'Как экспортировать данные и восстановить информацию',
    color: 'var(--destructive)',
    steps: [
      {
        title: 'Экспорт данных (JSON)',
        description: 'Все данные хранятся в облачной PostgreSQL базе. Экспортируй данные в JSON для резервной копии:',
        type: 'important',
        tags: ['backup', 'data'],
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
        tags: ['vercel', 'production'],
        codeBlocks: [
          { label: 'Vercel Postgres', code: '// Данные автоматически сохраняются\n// Бэкапы управляются провайдером\nNeon/Supabase' },
          { label: 'Миграция', code: '// Импортируй JSON-экспорт через API\nPOST /api/documents -- для каждого документа\nPOST /api/notes -- для каждой заметки' },
        ],
      },
      {
        title: 'Проверь что всё работает',
        description: 'После развертывания открой приложение и проверь:',
        type: 'tip',
        tags: ['qa'],
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
    color: 'var(--neuro-brand)',
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
]
