// R-02 exception: pure data file (no logic), exceed limit is intentional

export interface SeedDocument {
  title: string
  content: string
  fileName: string
  fileType: string
  fileSize: number
  /** References SeedCategory.key, resolved to categoryId at insert time */
  categoryKey: string
  /** References SeedTag.name, resolved to tagId at insert time */
  tagNames: string[]
  isStarred: boolean
  summary: string
}

export const SEED_DOCUMENTS: SeedDocument[] = [
  {
    title: 'Начало работы с Next.js 16',
    content: `# Начало работы с Next.js 16

Next.js 16 представляет важные нововведения: улучшенный App Router, серверные компоненты по умолчанию и расширенные возможности для production-приложений.

## Ключевые возможности

- **App Router**: Файловая маршрутизация с layouts, templates и loading states
- **Серверные компоненты**: Компоненты React, которые рендерятся на сервере по умолчанию
- **Streaming**: Постепенная отправка контента для улучшенного UX
- **Оптимизация изображений**: Автоматическая оптимизация с next/image

## Быстрый старт

\`\`\`bash
npx create-next-app@latest my-app
cd my-app
npm run dev
\`\`\`

## Структура проекта

\`\`\`
src/
  app/
    layout.tsx
    page.tsx
    api/
  components/
  lib/
\`\`\`

> Next.js 16 -- лучший способ создания production-ready приложений на React.

## Советы по производительности

1. Используйте серверные компоненты по умолчанию
2. Лениво загружайте клиентские компоненты
3. Оптимизируйте изображения с помощью next/image
4. Реализуйте правильные стратегии кэширования`,
    fileName: 'nachalo-raboty-nextjs16.md',
    fileType: 'md',
    fileSize: 920,
    categoryKey: 'frontend',
    tagNames: ['React', 'Next.js', 'TypeScript'],
    isStarred: true,
    summary: 'Пошаговое руководство по началу работы с Next.js 16: App Router, серверные компоненты, streaming и оптимизация производительности.',
  },
  {
    title: 'Лучшие практики TypeScript',
    content: `# Лучшие практики TypeScript

Чистый и поддерживаемый код на TypeScript требует следования устоявшимся паттернам.

## Строгий режим

Всегда включайте строгий режим в tsconfig.json:

\`\`\`json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
\`\`\`

## Определение типов

### Интерфейсы для объектов

\`\`\`typescript
interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

type UserRole = 'admin' | 'editor' | 'viewer'
\`\`\`

### Размеченные объединения

\`\`\`typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string }
\`\`\`

## Утилитарные типы

- \`Partial<T>\` -- все свойства необязательные
- \`Required<T>\` -- все свойства обязательные
- \`Pick<T, K>\` -- подмножество свойств
- \`Omit<T, K>\` -- исключение свойств
- \`Record<K, V>\` -- пары ключ-значение

## Обобщения

\`\`\`typescript
function createAPI<T>(baseUrl: string): API<T> {
  return {
    get: (id: string) => fetch(\`\${baseUrl}/\${id}\`).then(r => r.json() as Promise<T>),
    list: () => fetch(baseUrl).then(r => r.json() as Promise<T[]>),
  }
}
\`\`\``,
    fileName: 'luchshie-praktiki-typescript.md',
    fileType: 'md',
    fileSize: 1150,
    categoryKey: 'frontend',
    tagNames: ['TypeScript', 'Производительность'],
    isStarred: true,
    summary: 'Лучшие практики TypeScript: строгий режим, интерфейсы, размеченные объединения, утилитарные типы и обобщения.',
  },
  {
    title: 'Создание REST API на Node.js',
    content: `# Создание REST API на Node.js

Практическое руководство по созданию масштабируемых REST API.

## Базовый сервер

\`\`\`javascript
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(3001, () => {
  console.log('Сервер запущен на порту 3001')
})
\`\`\`

## Организация маршрутов

\`\`\`
src/
  routes/
    users.ts
    posts.ts
  middleware/
    auth.ts
    errorHandler.ts
  models/
    User.ts
\`\`\`

## Middleware

1. **Аутентификация**: проверка JWT-токенов
2. **Валидация**: проверка тела запроса с Zod
3. **Ограничение частоты запросов**: защита от злоупотреблений
4. **Логирование**: отслеживание запросов
5. **Обработка ошибок**: единообразные ответы`,
    fileName: 'sozdanie-rest-api-nodejs.md',
    fileType: 'md',
    fileSize: 1010,
    categoryKey: 'backend',
    tagNames: ['Node.js', 'API', 'Безопасность'],
    isStarred: false,
    summary: 'Создание REST API на Node.js и Express: настройка, маршруты, middleware и безопасность.',
  },
  {
    title: 'Docker для разработки',
    content: `# Docker для разработки

Создание согласованных и воспроизводимых сред разработки.

## Лучшие практики Dockerfile

\`\`\`dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "dist/main.js"]
\`\`\`

## Docker Compose

\`\`\`yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - db
  db:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
\`\`\`

## Советы

- Используйте многоступенчатые сборки
- Никогда не запускайте от root в production
- Фиксируйте версии базовых образов
- Кэшируйте зависимости`,
    fileName: 'docker-dlya-razrabotki.md',
    fileType: 'md',
    fileSize: 1070,
    categoryKey: 'devops',
    tagNames: ['Docker'],
    isStarred: false,
    summary: 'Docker для разработки: многоступенчатые сборки, Docker Compose и советы для production.',
  },
  {
    title: 'Паттерны React-компонентов',
    content: `# Паттерны React-компонентов

Продвинутые паттерны для создания поддерживаемых компонентов.

## Составные компоненты (Compound Components)

\`\`\`tsx
function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>
}

Card.Header = function Header({ title }: { title: string }) {
  return <div className="card-header">{title}</div>
}

Card.Body = function Body({ children }: { children: React.ReactNode }) {
  return <div className="card-body">{children}</div>
}
\`\`\`

## Render Props

\`\`\`tsx
function List({ items, renderItem }: ListProps) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{renderItem(item)}</li>
      ))}
    </ul>
  )
}
\`\`\`

## Пользовательские хуки

\`\`\`tsx
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
\`\`\`

## Оптимизация

1. React.memo для дорогих компонентов
2. Мемоизация коллбэков с useCallback
3. Мемоизация вычислений с useMemo
4. Разделение кода с React.lazy
5. Виртуализация длинных списков`,
    fileName: 'patterny-react-komponentov.md',
    fileType: 'md',
    fileSize: 1120,
    categoryKey: 'arch',
    tagNames: ['React', 'Производительность'],
    isStarred: true,
    summary: 'Паттерны React: составные компоненты, render props, пользовательские хуки и оптимизация производительности.',
  },
]
