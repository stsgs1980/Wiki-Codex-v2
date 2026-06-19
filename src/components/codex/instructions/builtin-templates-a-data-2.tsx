'use client'

import { GitBranch, Package } from 'lucide-react'
import type { TemplateGroup } from './types'

/**
 * Built-in instruction templates group A — part 2.
 * Contains: git-basics, project-setup.
 * Pure data module consumed by `builtin-templates-a.tsx`.
 */
export const TEMPLATES_A_PART_2: TemplateGroup[] = [
  {
    id: 'git-basics',
    icon: <GitBranch className="size-5" />,
    title: 'Основы Git',
    description: 'Базовые команды Git для повседневной работы',
    color: 'var(--terminal-accent)',
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
    color: 'var(--brand-purple)',
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
        tags: ['config', 'secrets'],
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
]
