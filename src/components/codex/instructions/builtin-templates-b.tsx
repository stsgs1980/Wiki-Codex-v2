'use client'

import { Server, Terminal, FileCode } from 'lucide-react'
import type { TemplateGroup } from './types'

export const TEMPLATES_B: TemplateGroup[] = [
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
        tags: ['ssh', 'security'],
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
