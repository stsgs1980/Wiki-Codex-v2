# DECISIONS.md — Architecture Decision Records

Журнал архитектурных и технических решений проекта Wiki Codex v2.
Каждая запись в формате ADR (Architecture Decision Record): контекст → решение → последствия.

> Статусы: `Принято` / `Заменено` / `Устарело`. Новый записи добавляются сверху под соответствующим разделом.

---

## Содержание

### Архитектура и структура кода
- [ADR-001 — R-02: анти-монолитный лимит 150 строк на .ts/.tsx файл](#adr-001--r02-анти-монолитный-лимит-150-строк-на-ts--tsx-файл)
- [ADR-002 — Barrel-реэкспорты для под-модулей (index.ts)](#adr-002--barrel-реэкспорты-для-под-модулей-indexts)
- [ADR-003 — Исключение из R-02 для pure-data файлов](#adr-003--исключение-из-r02-для-pure-data-файлов)

### Markdown-рендеринг
- [ADR-004 — remark-gfm для GFM-таблиц и расширений](#adr-004--remarkgfm-для-gfmтаблиц-и-расширений)
- [ADR-005 — Препроцессор текстовых тегов [OK]/[FAIL]/[TODO]](#adr-005--препроцессор-текстовых-тегов-okfailtodo)

### Доступность (WCAG 2.1 AA)
- [ADR-006 — WCAG 2.1 AA compliance как минимум](#adr-006--wcag-21-aa-compliance-как-минимум)
- [ADR-007 — div[role=button] вместо вложенных &lt;button&gt;](#adr-007--divrolebutton-вместо-вложенных-button)
- [ADR-008 — useReducedMotion + CSS prefers-reduced-motion](#adr-008--usereducedmotion--css-prefersreducedmotion)

### Типографика
- [ADR-009 — Tailwind-токены text-3xs/text-2xs вместо text-[Npx]](#adr-009--tailwindтокены-text3xstext2xs-вместо-textnpx)
- [ADR-010 — var(--font-geist-sans) вместо хардкода "Inter"](#adr-010--varfontgeistsans-вместо-хардкода-inter)

### Загрузка документов
- [ADR-011 — Последовательная (не параллельная) batch-загрузка папки](#adr-011--последовательная-не-параллельная-batchзагрузка-папки)
- [ADR-012 — webkitdirectory через InputHTMLAttributes augmentation](#adr-012--webkitdirectory-через-inputhtmlattributes-augmentation)

### База данных и Prisma
- [ADR-013 — SQLite для dev, PostgreSQL для prod (единая schema)](#adr-013--sqlite-для-dev-postgresql-для-prod-единая-schema)
- [ADR-014 — Стабильные key-поля в seed-данных вместо runtime ID](#adr-014--стабильные-keyполя-в-seedданных-вместо-runtime-id)

### UI/UX
- [ADR-015 — Sticky footer через min-h-screen flex flex-col + mt-auto](#adr-015--sticky-footer-через-minhscreen-flex-flexcol--mtauto)
- [ADR-016 — Semantic цветовые токены, не хардкод hex/HSL](#adr-016--semantic-цветовые-токены-не-хардкод-hexhsl)

### Инфраструктура
- [ADR-017 — gitignore для локальных артефактов агентов](#adr-017--gitignore-для-локальных-артефактов-агентов)

---

## Архитектура и структура кода

### ADR-001 — R-02: анти-монолитный лимит 150 строк на .ts/.tsx файл

**Статус:** Принято
**Дата:** 2026-06-19
**Связанные коммиты:** `c6d2366`, серия refactor-коммитов

#### Контекст
Монолитные компоненты (300-400 строк) мешали переиспользованию, тестированию и review. Примеры до рефакторинга:
- `dashboard-view.tsx` — 388 строк
- `term-lookup.tsx` — 327 строк
- `seed/route.ts` — 358 строк
- `upload.tsx` — 503 строки
- `term-card-list.tsx` — 147 строк (на грани, плюс hydration-bug)

#### Решение
Жёсткий лимит **150 строк** для всех `.ts`/`.tsx` файлов вне `src/components/ui/` (shadcn primitives — исключение, они сторонние). При превышении — обязательный рефакторинг на:
- `use-*.ts` — хуки (состояние + обработчики)
- `*-types.ts` — shared типы
- `*-view.tsx` / оркестратор — тонкий (<150) компонент
- Саб-компоненты в одноимённой папке (`dashboard/`, `dictionary/`)

#### Последствия
- **+** Файлы читаются за один экран, легче review
- **+** Саб-компоненты переиспользуются (например `term-delete-button` — в list и grid)
- **+** Чёткие seam-линии для тестирования
- **−** Больше файлов → больше импортов (компенсируется barrel-реэкспортами, см. ADR-002)
- **−** Иногда приходится жёстко сжимать атрибуты (например term-lookup.tsx ровно 150 после ARIA-добавлений)

---

### ADR-002 — Barrel-реэкспорты для под-модулей (index.ts)

**Статус:** Принято
**Дата:** 2026-06-19

#### Контекст
После ADR-001 сплит создал 5-7 файлов на модуль. Импорты вида `import { X } from './dashboard/stats-grid'` засоряли оркестратор и были хрупки к переименованию.

#### Решение
Каждый под-модуль получает `index.ts` barrel:
```ts
// src/components/codex/dashboard/index.ts
export { StatsGrid } from './stats-grid'
export { CategoryBreakdown } from './category-breakdown'
export { useCleanup } from './use-cleanup'
// ...
```
Оркестратор импортирует через `./dashboard` (без указания конкретного файла).

**Важно:** barrel НЕ реэкспортирует сам оркестратор, чтобы избежать circular import (`dashboard-view.tsx → ./dashboard → ./dashboard-view`).

#### Последствия
- **+** Чистые импорты в оркестраторе: `import { StatsGrid, useCleanup } from './dashboard'`
- **+** Переименование саб-файла не ломает внешних импортов
- **−** Один уровень indirection — IDE переходит через 2 шага

---

### ADR-003 — Исключение из R-02 для pure-data файлов

**Статус:** Принято
**Дата:** 2026-06-19
**Связанный файл:** `src/app/api/seed/data/documents.ts` (308 строк)

#### Контекст
`documents.ts` содержит 5 markdown-документов как строковые константы. Это чистые данные без логики, но формально превышает R-02 лимит в 150 строк.

#### Решение
Файлы pure-data (массивы/объекты с контентом, без условной логики и функций) **исключаются** из R-02. Обязательное условие — заголовок-комментарий:
```ts
// R-02 exception: pure data file (no logic), exceed limit is intentional
```

#### Последствия
- **+** Markdown-контент остаётся в одном файле (а не разбивается искусственно)
- **+** Легко найти через `rg 'R-02 exception'`
- **−** Требует самодисциплины: нельзя использовать исключение как предлог не рефакторить логику

---

## Markdown-рендеринг

### ADR-004 — remark-gfm для GFM-таблиц и расширений

**Статус:** Принято
**Дата:** 2026-06-19
**Связанные коммиты:** `b4ef694`

#### Контекст
`ReactMarkdown` без плагинов поддерживает только CommonMark — **без GFM-таблиц**. Pipe-синтаксис `| col | col |` рендерился как literal text. 26 из 28 документов в БД содержали markdown-таблицы — все были нечитаемы:
```
| Practice | Description | |----------|-------------| | Use data-testid | ...
```

#### Решение
Подключить `remark-gfm` плагин:
```tsx
<ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
  {processedBody}
</ReactMarkdown>
```

Дополнительно — расширенные overrides для `table`/`thead`/`tbody`/`tr`/`th`/`td`: zebra-striping, hover, border-collapse, align-top.

#### Последствия
- **+** Все 26 документов с таблицами теперь читаемы
- **+** Бонусом: ~~strikethrough~~, autolink для голых URL, task-lists (`- [x]`)
- **+** VLM-проверка подтвердила: «настоящая HTML-таблица с видимыми границами»
- **−** +1 зависимость (`remark-gfm@4`)
- **−** GFM-расширения могут активироваться в существующих документах неожиданно (например task-lists) — но это всегда additive улучшение

---

### ADR-005 — Препроцессор текстовых тегов [OK]/[FAIL]/[TODO]

**Статус:** Принято
**Дата:** 2026-06-19
**Связанные файлы:** `markdown-preprocessors.ts`, `text-tags.tsx`, `markdown-code-block.tsx`

#### Контекст
В технической документации часто встречаются inline-теги статусов: `[OK]`, `[FAIL]`, `[DONE]`, `[TODO]`, `[WARNING]`, `[INFO]`. Без обработки они рендерятся как скучный текст в квадратных скобках, без визуального выделения.

#### Решение
Двухфазный препроцессинг:
1. **До ReactMarkdown** (`preprocessTextTags`): переписывает `[OK]` → `[TAG:OK]` вне fenced code blocks (§4.4 стандарта STD-DOC-002). Превращается в inline code-плейсхолдер.
2. **В code-block override**: regex `^\[TAG:(OK|DONE|PASS|FAIL|ERROR|TODO|WARNING|WARN|INFO|NOTE)\]$` матчает плейсхолдер и рендерит цветной бейдж (`bg-star/15 text-star border-star/40` для TODO и т.д.).

#### Последствия
- **+** Статус-теги визуально выделены цветом (terminal-эстетика)
- **+** Не ломается внутри code blocks (там остаётся как есть)
- **+** Расширяемо: добавить новый тег = 2 строки в `TAG_NAMES` массиве
- **−** Двойной pass по тексту (можно было бы решить через rehype-плагин, но текущий подход проще и предсказуемее)

---

## Доступность (WCAG 2.1 AA)

### ADR-006 — WCAG 2.1 AA compliance как минимум

**Статус:** Принято
**Дата:** 2026-06-19
**Связанные стандарты:** `standards/WCAG_2.1_AA_STANDARD.md` (seed-документ)

#### Контекст
Проект позиционируется как «интеллектуальная база знаний для разработчиков». Разработчики — широкая аудитория, включая пользователей скринридеров и с моторными ограничениями. До работы по доступности аудит выявил:
- 8 контрастных FAILs (star color, footer alpha, violet/amber/emerald accents, focus ring 50% alpha)
- 9 `div-onClick` (1 полностью блокировал загрузку с клавиатуры)
- 6 списков как `<div>` вместо `<ul>/<li>`
- Нет `<main>`, нет skip-link
- 20+ icon-only buttons без `aria-label`
- 0 `prefers-reduced-motion` support
- 0 `aria-live` / `role=alert` regions

#### Решение
WCAG 2.1 AA как обязательный минимум. Реализовано:
- **1.4.3 Contrast**: `--star` bumped hsl(40 55% 38%→32%), footer alpha /70→full, violet/amber/emerald→tokens
- **1.4.11 Non-text Contrast**: focus ring 50%→100% alpha
- **2.4.1 Bypass Blocks**: skip-link + `<main id="main-content" tabIndex={-1}>`
- **2.4.7 Focus Visible**: глобальный `:focus-visible` + shadcn primitives `ring-ring`
- **2.1.1 Keyboard**: 9 div-onClick→`<button>`, upload file input keyboard-accessible через label+sr-only pattern
- **1.3.1 Info & Relationships**: `<main>`, `<ul>/<li>`, heading hierarchy, `role="list"`
- **4.1.2 Name/Role/Value**: 31 aria-label, 11 aria-pressed, 4 aria-expanded, 1 aria-current, 7 aria-hidden
- **2.3.3 Animation**: CSS `@media (prefers-reduced-motion: reduce)` + `useReducedMotion()` hook
- **3.3.1/3.3.3 Error Identification**: `role="alert"`, `aria-live="polite"`, `aria-describedby`

#### Последствия
- **+** Проект доступен пользователям с инвалидностью
- **+** SEO-бонус (semantic HTML, heading hierarchy)
- **+** Будущее-proof: EU European Accessibility Act с 2025 года требует AA для многих сервисов
- **−** Больше атрибутов в JSX → файлы растут (приходится сжимать, см. term-lookup.tsx ровно 150)
- **−** Иконкам нужны осмысленные aria-label на русском — это постоянная забота при добавлении новых

---

### ADR-007 — div[role=button] вместо вложенных &lt;button&gt;

**Статус:** Принято
**Дата:** 2026-06-19
**Связанные коммиты:** `595c141`, `c6d2366`

#### Контекст
HTML spec запрещает `<button>` внутри `<button>`. React выбрасывал hydration error: `In HTML, <button> cannot be a descendant of <button>`. Конкретно — в term-card: внешняя карточка-кнопка (toggle expand) + внутренняя кнопка delete.

#### Решение
Внешний clickable-элемент становится `<div>` с a11y-атрибутами:
```tsx
<div
  role="button"
  tabIndex={0}
  aria-expanded={expanded}
  aria-controls={`term-content-${t.id}`}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle()
    }
    // Важно: e.target !== e.currentTarget, иначе closest('[role=button]')
    // матчит сам row и блокирует Enter/Space
  }}
  onClick={handleToggle}
>
  ...inner <button>Delete</button>...
</div>
```

#### Последствия
- **+** Hydration error устранён
- **+** Валидный HTML
- **+** Сохранён keyboard-access (Enter/Space работают)
- **−** Чуть больше boilerplate чем native `<button>`
- **−** Нужно помнить про `e.target !== e.currentTarget` в onKeyDown (иначе event bubbling ломает)

---

### ADR-008 — useReducedMotion + CSS prefers-reduced-motion

**Статус:** Принято
**Дата:** 2026-06-19
**Связанные файлы:** `src/app/globals.css`, `src/app/page.tsx`

#### Контекст
WCAG 2.3.3 «Animation from Interactions» требует уважать `prefers-reduced-motion`. У проекта много Framer Motion анимаций (view-transitions, card-hover, stagger).

#### Решение
Двухуровневая защита:
1. **CSS-уровень** (глобально, в `globals.css`):
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```
2. **React-уровень** (точечно, через `useReducedMotion()` из Framer Motion):
   ```tsx
   const reduceMotion = useReducedMotion()
   <motion.div
     initial={reduceMotion ? false : 'initial'}
     exit={reduceMotion ? undefined : 'exit'}
     transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
   >
   ```

#### Последствия
- **+** CSS ловит всё, включая hover-эффекты и сторонние виджеты
- **+** React-уровень даёт точечный контроль для сложных Framer-сцен
- **+** Пользователи с vestibular disorders не получают motion-sickness
- **−** Двойная реализация — но это намеренно: CSS = safety net, React = granular control

---

## Типографика

### ADR-009 — Tailwind-токены text-3xs/text-2xs вместо text-[Npx]

**Статус:** Принято
**Дата:** 2026-06-19
**Связанные файлы:** `src/app/globals.css` (`@theme inline`)

#### Контекст
Аудит выявил **67** arbitrary `text-[Npx]` значений в 26 файлах (`text-[10px]`, `text-[11px]`, `text-[12px]`). Это ломает design-system consistency:Tailwind не знает про эти размеры, нельзя поменять centrally, нет dark-mode оптимизации.

#### Решение
Добавить first-class Tailwind-токены в `@theme inline`:
```css
@theme inline {
  --text-3xs: 0.625rem;    /* 10px */
  --text-2xs: 0.6875rem;   /* 11px */
  /* text-xs/sm/base/... — уже есть в Tailwind */
}
```
Теперь `text-3xs` / `text-2xs` — полноценные utility-классы. Все 67 arbitrary-значений заменены.

**Tracking convention** (документировано в комментарии `globals.css`):
- `tracking-tight` → заголовки
- `tracking-wide` → table headers
- `tracking-wider` → uppercase labels
- `tracking-widest` → brand tagline

#### Последствия
- **+** Design system consistency — все размеры в одном месте
- **+** Dark-mode оптимизация через token-override возможна
- **+** Tailwind IDE-autocomplete работает
- **−** 2 deliberately-preserved `text-[0.7em]` в `markdown-code-block.tsx` и `text-tags.tsx` — relative-em для inline код внутри `<code>` (semantically correct, нельзя выразить через fixed tokens)

---

### ADR-010 — var(--font-geist-sans) вместо хардкода "Inter"

**Статус:** Принято
**Дата:** 2026-06-19
**Связанные файлы:** `neuro-logo.tsx`, `tech-logos/icons.tsx`

#### Контекст
9 SVG-логотипов (Next.js, TypeScript, Tailwind, PostgreSQL, Prisma, Zustand, Neuro) хардкодили `fontFamily="Inter"` в SVG-атрибутах. Но в Next.js font загружается через `next/font/google` с переменной `--font-geist-sans`, и прямая ссылка на "Inter" обходила эту систему.

#### Решение
```diff
- fontFamily="Inter"
+ fontFamily="var(--font-geist-sans)"
```
Константа `FONT_STACK = 'var(--font-geist-sans)'` в `neuro-logo.tsx` для переиспользования.

#### Последствия
- **+** Шрифт в SVG следует за theme/font-config приложения
- **+** Если поменяем Inter на другой шрифт — все SVG подхватят автоматически
- **−** var() в SVG-атрибуте `font-family` работает не во всех рендерерах (но во всех evergreen browsers — ОК)

---

## Загрузка документов

### ADR-011 — Последовательная (не параллельная) batch-загрузка папки

**Статус:** Принято
**Дата:** 2026-06-19
**Связанные коммиты:** `cf5c629`
**Связанные файлы:** `submit-batch.ts`, `submit-one.ts`

#### Контекст
Новый режим загрузки папки (`<input webkitdirectory>`) выбирает рекурсивно все файлы. Параллельная загрузка (Promise.all) казалась быстрее.

#### Решение
**Последовательная** загрузка через `for...of` loop с `await` на каждом файле:
```ts
for (const file of files) {
  if (cancelled) break
  onProgress(file, 'uploading')
  try {
    await submitOne(file, { category, force })
    onProgress(file, 'done')
  } catch (e) {
    onProgress(file, 'error', e.message)
    errors.push({ file, error: e.message })
    // НЕ abort — продолжаем остальные
  }
}
```

#### Последствия
- **+** Не насыщаем z-ai-web-dev-sdk (AI-анализ контента) — backend остаётся отзывчивым для других пользователей
- **+** Дубликаты ловятся корректно (последовательно — состояние БД консистентно)
- **+** Per-file progress точно отражает реальность (а не race condition)
- **+** Retry на 5xx/network — sandbox server может рестартить, последовательность устойчивее
- **−** Медленнее параллельной для больших папок — но для типичного use-case (10-50 файлов) разница незаметна, а надёжность критичнее

---

### ADR-012 — webkitdirectory через InputHTMLAttributes augmentation

**Статус:** Принято
**Дата:** 2026-06-19
**Связанные файлы:** `folder-input.tsx`, `folder-input-types.d.ts`

#### Контекст
Атрибут `webkitdirectory` (для выбора папки через file dialog) — non-standard, но поддерживается всеми evergreen browsers (Chrome, Firefox, Edge, Safari 11+). Однако React не включает его в `InputHTMLAttributes` по умолчанию.

#### Решение
TypeScript module augmentation вместо `@ts-expect-error` suppression:
```ts
// folder-input-types.d.ts
declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string
    directory?: string
  }
}
```

#### Последствия
- **+** Тип-безопасно — `webkitdirectory=""` валиден для компилятора
- **+** Без `@ts-expect-error` (который устаревает и ломает tsc, см. коммит `666657d`)
- **+** Переиспользуемо во всём проекте
- **−** Глобальное расширение React-типов — может конфликтовать если другой lib тоже augments InputHTMLAttributes (неактуально в этом проекте)
- **−** iOS Safari не поддерживает webkitdirectory — fallback на single-file picker (graceful degradation, задокументировано в JSDoc)

---

## База данных и Prisma

### ADR-013 — SQLite для dev, PostgreSQL для prod (единая schema)

**Статус:** Принято
**Дата:** 2026-06-19
**Связанные коммиты:** `b47a749`, `c728b9b`

#### Контекст
Vercel/production использует PostgreSQL (connection pooling, concurrent access). Локальная dev — SQLite (zero-config, fast). Изначально был `prisma-switch.js` скрипт для переключения provider, но он был хрупким и ломал deploys (Vercel Error 14).

#### Решение
Жёстко `postgresql` provider в `schema.prisma`. Для dev — локальный SQLite файл, подключаемый через `DATABASE_URL=file:./dev.db` (Prisma Client с SQLite-совместимым binary уже установлен). Убран `prisma-switch.js` полностью.

**Примечание:** на самом деле в текущей конфигурации dev тоже использует PostgreSQL-совместимый adapter, а SQLite — fallback для sandbox. Это компромисс: единая schema важнее dev/prod parity в этом проекте.

#### Последствия
- **+** Один `schema.prisma` — нет diverging schemas
- **+** Vercel deploys стабильны (не было сбоев после фикса)
- **+** Prisma migrations едины для всех окружений
- **−** Dev на PostgreSQL требует running PG instance (или neon/supabase — решается через `DATABASE_URL`)
- **−** SQLite-only фичи (например `PRAGMA`) недоступны — но не нужны

---

### ADR-014 — Стабильные key-поля в seed-данных вместо runtime ID

**Статус:** Принято
**Дата:** 2026-06-19
**Связанные файлы:** `src/app/api/seed/data/categories.ts`, `tags.ts`, `documents.ts`, `route.ts`

#### Контекст
Seed-данные должны ссылаться на категории и теги. Но Prisma генерирует ID при insert — нельзя захардкодить `categoryId: "cat_abc123"` в статичных данных. Изначально route.ts содержал runtime-логику вида `categoryId: categories.find(c => c.name === 'Frontend').id`, что делало его 358-строчным монолитом.

#### Решение
Stable `key` поля в data-файлах:
```ts
// categories.ts
export const SEED_CATEGORIES = [
  { key: 'frontend', name: 'Фронтенд', ... },
  { key: 'backend', name: 'Бэкенд', ... },
]

// documents.ts
{ title: '...', categoryKey: 'frontend', tagNames: ['React', 'Next.js'] }
```
Route.ts строит `categoryMap: Record<string, string>` (key→prisma id) и `tagMap` (name→id), затем резолвит при insert.

#### Последствия
- **+** Data-файлы чистые и типизированные (без runtime зависимостей)
- **+** Route.ts стал 66 строк (тонкий оркестратор)
- **+** Стабильные ключи переживают re-seed (ID меняются, keys — нет)
- **−** Один уровень indirection — но решается через lookup maps в route.ts

---

## UI/UX

### ADR-015 — Sticky footer через min-h-screen flex flex-col + mt-auto

**Статус:** Принято
**Дата:** 2026-06-19
**Связанные файлы:** `src/app/page.tsx` (root wrapper)

#### Контекст
Требование: footer должен быть прижат к низу viewport когда контент короткий, и естественно отодвигаться когда контент длинный. Классические подходы (fixed position, calc(100vh - footerHeight)) хрупки.

#### Решение
Tailwind-паттерн:
```tsx
<div className="min-h-screen flex flex-col">
  <Header />
  <main className="flex-1">{children}</main>
  <Footer className="mt-auto" />
</div>
```

#### Последствия
- **+** Footer всегда внизу на коротких страницах
- **+** На длинных — естественно прокручивается с контентом
- **+** Без JS, без `position: fixed`, без magic numbers
- **+** Mobile safe-area respected через `pb-[env(safe-area-inset-bottom)]` где нужно
- **+** Browser-verified: desktop 1280×800 footerBottom=577 viewportH=577 gap=0; mobile 375×812 footerBottom=812 atBottom=true

---

### ADR-016 — Semantic цветовые токены, не хардкод hex/HSL

**Статус:** Принято
**Дата:** 2026-06-19
**Связанные коммиты:** `899ed54`, `4b63dc6`, `3a95699`

#### Контекст
Первоначально в коде было множество `bg-violet-500`, `text-amber-600`, `text-[#78716c]` — хардкод цветов. Это ломало dark-mode (цвета не инвертировались), ломало consistency (оттенок violet в одном месте отличался от другого), и не давало темизировать централизованно.

#### Решение
Все цвета через Tailwind semantic tokens в `@theme inline` / CSS variables:
- `bg-background`, `text-foreground`, `text-muted-foreground`
- `bg-muted`, `border-border`
- `bg-primary`, `text-primary-foreground`
- Domain-specific: `text-terminal-accent`, `text-neuro-brand`, `bg-star`, `text-star`

Все хардкоды заменены. Для tag-colors — shared utility `tag-color-bg` в `lib/tag-colors.ts`.

#### Последствия
- **+** Dark mode работает корректно (все цвета инвертируются)
- **+** Centralized theming — поменять палитру = поменять CSS variables
- **+** WCAG-контраст проверяется в одном месте
- **−** Tailwind-классы длиннее (`text-muted-foreground` vs `text-gray-500`)
- **−** Новым разработчикам нужно выучить токены (но они self-documenting)

---

## Инфраструктура

### ADR-017 — gitignore для локальных артефактов агентов

**Статус:** Принято
**Дата:** 2026-06-19
**Связанные коммиты:** `666657d`, `3ce6cc5`

#### Контекст
В репозиторий изначально попали:
- 36 transient `tool-results/*.txt` файлов (~11.5k строк логов bash/read tool-output)
- `.env` (с секретами)
- `prisma/dev.db` (с тестовыми данными пользователей)

#### Решение
`.gitignore` расширен:
```gitignore
# Internal agent files
.claude
.z-ai-config
agent-ctx/
worklog.md          # internal scratch-log агентов
CLAUDE.md
AGENT_RULES.md
PROJECT_CONFIG.md
tool-results/       # transient tool output

# Env / secrets
.env
.env.local
.env.*.local
!.env.example

# Prisma local databases (SQLite dev artifacts)
prisma/*.db
prisma/*.db-journal
prisma/dev.db
prisma/prod.db
```

#### Последствия
- **+** Чистый репозиторий — только исходники, без артефактов
- **+** Секреты не утечут (`.env` в gitignore + `!.env.example` для шаблона)
- **+** SQLite dev-БД не коммитится (каждый разработчик свою накатывает через `bun run db:push && bun run seed`)
- **+** `tool-results/` больше не засоряет git history
- **−** `worklog.md` не в git — команда должна использовать другой канал для передачи контекста между session (GitHub Discussions / Issues)

---

## Журнал изменений документа

| Дата | Автор | Изменение |
|------|-------|-----------|
| 2026-06-19 | Z.ai Code (main agent) | Создан документ. 17 ADR-записей на основе worklog.md (1210 строк) и git-истории. |
