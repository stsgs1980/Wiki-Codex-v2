```
 __        __   _       ___  ____  _     ___   ___  ____      _
 \ \      / /__| |__   / _ \/ ___|| |   / _ \ / _ \|  _ \    / \
  \ \ /\ / / _ \ '_ \ | | | \___ \| |  | | | | | | | |_) |  / _ \
   \ V  V /  __/ |_) || |_| |___) | |__| |_| | |_| |  _ <  / ___ \
    \_/\_/ \___|_.__/  \___/|____/|_____\___/ \___/|_| \_\/_/   \_\
```

> Intelligent knowledge base for developers.
> Documentation, notes, terms & instructions with AI analysis.

---

## Quick Start

```bash
# 1. Setup environment
cp .env.example .env

# 2. Install dependencies
bun install

# 3. Create database
bun run db:push

# 4. Run dev server
bun run dev
```

```
> Wiki Codex v2.0.0 ready at http://localhost:3000
```

---

## Features

| Module | Description |
|---|---|
| **Documents** | Upload `.md` `.txt` `.html`, Markdown preview, categories, tags, favorites |
| **Search** | Text search + AI-powered semantic search |
| **Notes** | CRUD with AI analysis (topics, title, mood) |
| **Dictionary** | AI term extraction from documents, duplicate merging |
| **Instructions** | Built-in templates + AI extraction from docs |
| **AI** | Auto-categorization, tag/category suggestions, semantic search |
| **Backups** | Automatic DB snapshots (last 10 retained) |
| **Keyboard** | `Ctrl+K` search, `Ctrl+N` new note, `Ctrl+U` upload, `Esc` back |
| **Navigation** | Breadcrumbs in document viewer |

---

## Stack

```
Next.js 16 ............. Framework (App Router, Turbopack)
TypeScript 5 ........... Language
Tailwind CSS 4 .......... Styling
shadcn/ui ............... Component Library
Prisma ORM (SQLite) ..... Database
Zod .................... API Validation
Zustand ................. State Management
z-ai-web-dev-sdk ........ AI Integration
```

---

## Project Structure

```
src/
  app/
    layout.tsx                          # Root layout (ThemeProvider, Toaster)
    page.tsx                            # SPA shell (sidebar + header + views)
    globals.css                         # Tailwind + custom styles
    api/
      route.ts                          # GET  /api             health check
      seed/route.ts                     # POST /api/seed         dev-only DB seeding
      backup/route.ts                   # GET|POST /api/backup   backup management
      documents/
        route.ts                        # GET|POST  /api/documents       (zod)
        [id]/route.ts                   # GET|PATCH|DELETE /api/documents/:id
        related/route.ts                # POST /api/documents/related     AI similar docs
      ai/analyze/route.ts               # POST /api/ai/analyze            AI doc analysis
      categories/
        route.ts                        # GET|POST|DELETE /api/categories (zod)
        suggest/route.ts                # POST /api/categories/suggest    AI suggestions
      tags/route.ts                     # GET|POST|DELETE /api/tags       (zod)
      terms/
        route.ts                        # GET|POST|PATCH|DELETE /api/terms
        parse/route.ts                  # POST /api/terms/parse           AI extraction
      notes/
        route.ts                        # GET|POST /api/notes             (zod)
        [id]/route.ts                   # GET|PATCH|DELETE /api/notes/:id
        analyze/route.ts                # POST /api/notes/analyze         AI analysis
      instructions/
        route.ts                        # GET|POST /api/instructions
        [id]/route.ts                   # DELETE /api/instructions/:id
      search/semantic/route.ts          # POST /api/search/semantic       AI search
  components/
    codex/                              # App components (11 files)
      sidebar.tsx                       # Navigation (categories, tags, counters)
      header.tsx                        # Search bar, theme toggle, actions
      dashboard-view.tsx                # Stats grid, tech logos, recent docs
      documents-view.tsx                # Document list (grid/list, filters)
      document-viewer.tsx               # Markdown viewer, AI analysis, breadcrumbs
      upload-view.tsx                   # Drag & drop (.md/.txt/.html)
      notes-view.tsx                    # Notes list
      note-editor.tsx                   # Note editor with AI
      dictionary-view.tsx               # Terms dictionary (merge, dedup)
      instructions-view.tsx             # Instructions (templates + extracted)
      tech-logos.tsx                    # Brand SVG logos
    ui/                                 # shadcn/ui (39 components)
  hooks/
    use-toast.ts                        # Toast notifications
    use-mobile.ts                       # Mobile detection
    use-codex-data.ts                   # Data hooks (documents, notes, counters, terms)
    use-keyboard-shortcuts.ts           # Global hotkeys (Ctrl+K/N/U, Esc)
  lib/
    store.ts                            # Zustand store (views, filters, UI state)
    types.ts                            # TypeScript interfaces
    db.ts                               # PrismaClient singleton (connection_limit=1)
    backup.ts                           # autoBackup() -- last 10 snapshots
    format.ts                           # pluralize, formatDate, formatFileSize
    validations.ts                      # Zod schemas for API validation
    utils.ts                            # cn() -- Tailwind merge
prisma/
  schema.prisma                         # Database schema (6 models)
  migrations/
    0_init/migration.sql                # Initial migration
eslint-rules/
  no-unicode-policy.mjs                 # ESLint rule: No-Unicode Policy v1.0
tests/
  api/
    categories.test.ts                  # 7 tests
    tags.test.ts                        # 7 tests
    notes.test.ts                       # 10 tests
    documents.test.ts                   # 10 tests
    validation.test.ts                  # 11 tests (zod)
Dockerfile                              # Multi-stage build (prisma migrate deploy)
.github/workflows/ci.yml                # CI: lint + test + build (45 tests)
```

---

## Data Models

```
Category --------< Document >-------- Tag
  id                 id                  id
  name               title               name
  description        content             color
  color              summary
  sortOrder          fileType             DocumentTag
                     fileSize              documentId
  Term               fileName             tagId
  id                 categoryId
  term (unique)      isStarred
  translation        viewCount
  explanation
  usage              Note
  documentId          id
                      title
  Instruction         content
  id
  title              steps (JSON)
  description        sourceDocId
  isBuiltIn
```

---

## API Reference

> All POST/PATCH endpoints validated via Zod schemas (`src/lib/validations.ts`).
> Invalid requests return `400` with error details.

### Documents

```
GET    /api/documents?search=&categoryId=&tagId=&starred=&page=&limit=
POST   /api/documents                          # Dedup by title (409 on conflict)
GET    /api/documents/:id                      # +viewCount increment
PATCH  /api/documents/:id                      # title, categoryId, isStarred, content, tagIds
DELETE /api/documents/:id
POST   /api/documents/related                  # AI: find similar documents
```

### AI

```
POST /api/ai/analyze              # Document analysis: summary, category, tags
POST /api/search/semantic         # Semantic search across documents
POST /api/categories/suggest      # AI: suggest new categories
POST /api/terms/parse             # AI: extract terms from text
POST /api/notes/analyze           # Note analysis: title, summary, topics, mood
POST /api/instructions?extractFromDocId=   # AI: extract instructions
```

### Categories & Tags

```
GET    /api/categories            # List with _count.documents
POST   /api/categories            # Create (dedup)
DELETE /api/categories?id=
GET    /api/tags                  # List with _count.documents
POST   /api/tags                  # Create (dedup)
DELETE /api/tags?id=
```

### Terms

```
GET    /api/terms?search=&documentId=&duplicates=true
POST   /api/terms                  # Create (dedup)
DELETE /api/terms?id= | ?ids=a,b,c # Single + bulk delete
PATCH  /api/terms                  # Merge duplicates (keepId + mergeIds)
```

### Notes

```
GET    /api/notes?search=
POST   /api/notes
GET    /api/notes/:id
PATCH  /api/notes/:id
DELETE /api/notes/:id
```

### Instructions

```
GET    /api/instructions                    # List (extracted + built-in)
POST   /api/instructions?extractFromDocId=  # Extract from document
DELETE /api/instructions/:id
```

### System

```
GET  /api           # Health check
POST /api/seed      # Dev-only DB seeding (blocked in production)
GET  /api/backup    # List backups
POST /api/backup    # Create backup
```

---

## Standards & Rules

All standards are mandatory for development, AI generation, and application usage.

---

### Standard 1: No-Unicode Policy v1.0

> Icon and graphic usage standard. Design System / Engineering Governance level.

#### 1.1 Purpose

This standard establishes a **strict ban** on all Unicode graphic symbols (including emoji) across all product layers: UI, content, code, system communications.

Goals:

- Ensure visual consistency
- Maintain professional product level
- Guarantee control via design system
- Eliminate uncontrolled visual artifacts

#### 1.2 Absolute Ban on Unicode Graphics

**What is banned:**

| Category | Examples |
|---|---|
| Emoji | Any pictograms: emotions, objects, UI symbols, all emoji packs on all platforms |
| Symbol pseudo-graphics | Arrows, markers, decorative elements, highlighting symbols |
| Unicode icons | Any symbols used as icon replacements: statuses, actions, notifications |

**Scope of the ban:**

| Layer | What is banned |
|---|---|
| UI | Buttons, menus, tables, tooltips, notifications, statuses |
| Content | In-product texts, onboarding, system messages, in-UI documentation |
| Code | Comments, strings, mock data, variable names |
| System communications | Logging, errors, API responses, system events |

#### 1.3 Reasons for the Ban

- **Rendering inconsistency** -- Unicode renders differently across OS, browsers, devices
- **Lack of control** -- Impossible to centrally change style, manage themes, inject design tokens
- **Lack of scalability** -- No size management, no responsiveness, no system integration
- **Professional standard violation** -- Reduces trust, breaks visual hierarchy, contradicts enterprise level

#### 1.4 Only Acceptable Standard -- SVG

**Basic rule:** any visual symbol = **SVG ONLY**

Alternatives banned: Unicode, PNG (for icons), JPG, WebP (for icons), font icons.

**SVG requirements:**

- Be part of Design System
- Use design tokens
- Support theming
- Be optimized (SVGO)
- Have unified stroke/fill style

**Icon library (fixed at architecture level):** Lucide (primary, used in project).

**Brand logos:** Use official vendor SVG logos when displaying technologies in UI.

#### 1.5 Mandatory Use of Brand Logos

When mentioning technologies, services or integrations -- **ALWAYS use official logos (SVG)**.

| Entity | Requirement |
|---|---|
| Next.js, TypeScript, Tailwind CSS | Use official SVG logos |
| SQLite | Use brand icon |
| Prisma ORM | Use brand icon |
| Zustand | Use brand icon |

Banned: text logo replacements, Unicode replacements, unofficial icons, custom styles without approval.

#### 1.6 Strict Bans by Context

| Context | Banned |
|---|---|
| Dialog / UX texts | Notifications, alerts, onboarding, empty states |
| Code | Comments with graphic symbols, UI strings, console.log, test data |
| Navigation | Sidebar, header, breadcrumbs |
| Buttons and actions | CTA, action icons via symbols, statuses (success, error) |

#### 1.7 Stack Signature Format (Mandatory)

- Placement: bottom-right corner, fixed position
- Format: `Built with: Next.js 16 + TypeScript + Tailwind CSS`
- Allowed: Latin, Cyrillic, digits
- Banned: Any symbols outside standard alphabet, any graphic elements

#### 1.8 Control & Enforcement

- **Linting (mandatory)** -- Unicode range ban, string checking, CI checks. Implementation: `eslint-rules/no-unicode-policy.mjs`
- **Code Review** -- Any PR rejected if Unicode graphics, unauthorized icons, missing SVG found
- **Design Review** -- Icon system compliance, brand logo usage, no visual deviations

#### 1.9 Exceptions

Allowed **ONLY**: standard punctuation, letters (including Cyrillic), and digits. Any other exceptions are banned by default and require architectural approval.

#### 1.10 Implementation

- AI instruction prompt (English): `output must contain ONLY ASCII characters`
- Pre-analysis emoji cleanup: `replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]|[\u{1F900}-\u{1F9FF}]|[\u{2702}-\u{27B0}]/gu, '')`
- Final sanitization (allows Cyrillic): `replace(/[^\x20-\x7E\u0400-\u04FF]/g, '')`
- Built-in templates (BUILTIN_TEMPLATES) -- ASCII for code, Cyrillic allowed for descriptions
- All project icons -- Lucide (SVG)
- Where: `/api/instructions`, `instructions-view.tsx`, `eslint-rules/no-unicode-policy.mjs`

---

### Standard 2: Z.ai Reproducibility Standard v1.0

> **`git clone` + `bun install` + `bun run dev` = working application.**
> Always. Everywhere. On any machine. No exceptions.

#### 2.1 Levels

```
L1 -- Environment     Files, paths, dependencies, environment
L2 -- Code            Source code, DB, API, security
L3 -- Delivery        CI, Docker, build, deploy
L4 -- Process         Audit, tests, checklist, repo management
```

#### L1 -- Environment

**`.env.example` -- mandatory.** Contains all variables with safe defaults. Secrets as placeholders. `.env` in gitignore.

**Paths -- relative only.** Banned: `/home/`, `/Users/`, `http://localhost:` in code.

```typescript
// BANNED
fetch('http://localhost:3000/api/documents')

// REQUIRED
fetch('/api/documents')
```

For cross-port services -- only `XTransformPort`:

```typescript
// BANNED
fetch('http://localhost:3003/api/chat')

// REQUIRED
fetch('/api/chat?XTransformPort=3003')
```

**Runtime environment validation.** Critical variables checked at startup. Missing vars -- warning, not crash.

**Binary files -- outside git.** Only source code and configuration in git. No `.db`, `.sqlite`, images in upload/, backups, logs, build artifacts.

#### L2 -- Code

**Database: relative path via `path.resolve()`:**

```typescript
const dbPath = resolve(process.cwd(), rawUrl.replace(/^file:/, ''))
if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
```

**Database: safe permissions:** `0o755` for directories, `0o644` for files.

**SQLite: no `mode: 'insensitive'`** -- SQLite does not support case-insensitive in Prisma. Use `contains`.

**Error handling: no internal error leaks.** API routes never expose Prisma error messages to clients:

```typescript
// BANNED -- leaks internal details
catch (error) {
  const msg = error instanceof Error ? error.message : 'Failed'
  return NextResponse.json({ error: msg }, { status: 500 })
}

// REQUIRED -- generic message + log
catch (error) {
  console.error('Error creating document:', error)
  return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
}
```

**Anti-fragility: error isolation.** Non-critical operations (backup, AI analysis) do not break the main flow. Critical operations (save, delete) MUST show error to user via toast.

**Dark theme: mandatory.** Use only CSS variables: `bg-primary`, `text-foreground`, `bg-muted`, `text-muted-foreground`.

**Color palette:** default `stone`, `slate`, `neutral`, `green`, `emerald`. `indigo` / `blue` -- only if explicitly requested.

**Dependencies:** no dead packages. Every package in `dependencies` MUST be used in `src/`.

**UI components:** `src/components/ui/` -- shadcn/ui library, excluded from dead file checks. Every custom file in `src/components/codex/` MUST be imported in `src/`.

#### L3 -- Delivery

**Default branch:** `main`. Lockfile committed (`bun.lock`). Semantic Versioning in `package.json`.

**CI pipeline:** `.github/workflows/ci.yml` -- lint + test (45 tests) + build on every push/PR.

**Dockerfile:** production image based on `node:20-alpine`, multi-stage build, Bun runtime. Uses `prisma migrate deploy` for safe migration application. No `.env`, `.db`, or backups included.

#### L4 -- Process

**Pre-commit checklist:**

- [ ] `bun run lint` -- 0 errors
- [ ] No absolute paths in code
- [ ] No `console.log` (only `console.error` in catch)
- [ ] No unused packages / files
- [ ] API error handling -- generic messages
- [ ] Binary files not in git

**Pre-release checklist:**

- [ ] All items from commit checklist
- [ ] `.env.example` exists with all variables
- [ ] `bun install && bun run dev` on clean clone -- works
- [ ] Dark theme works
- [ ] All API routes return correct statuses
- [ ] Tests pass without errors

**Worklog:** `worklog.md` file in root, append only (never overwrite).

**Clean repository formula:**

```
clone + install + dev = works
```

Anything violating this formula is a bug.

---

### Rule 3. Deduplication-First

All create endpoints **must** check for existing records before creation.

**Algorithm (two levels):**
1. Exact match: `findFirst({ where: { name: { equals: value } } })`
2. Case-insensitive fallback (for SQLite): `findFirst({ where: { name: { equals: value.toLowerCase() } } })`

**If found** -- return existing record (HTTP 200), do not create duplicate.

**Applies to all entities:** Category, Tag, Term, Document (by title)

---

### Rule 4. Auto-Backup Policy

Every write mutation (POST, PATCH, DELETE) calls `autoBackup()`.

- Location: `db/backups/custom_YYYY-MM-DD_HH-MM.db`
- Retained: last 10 backups, oldest deleted automatically
- Backup error **never** interrupts the main operation

**Where:** `src/lib/backup.ts` -- `autoBackup()`

---

### Rule 5. SQLite Safety (connection_limit=1)

PrismaClient uses `connection_limit=1&pool_timeout=0` to prevent P2025 errors (database locked).

**Where:** `src/lib/db.ts` -- `datasourceUrl: file:${dbPath}?connection_limit=1&pool_timeout=0`

---

### Rule 6. AI Prompt Language Standard

All AI system prompts are written **in Russian** (except instruction extraction prompt -- in English per No-Unicode Policy).

| Task | Temperature |
|---|---|
| Instruction/term extraction, semantic search | 0.1--0.2 (maximum determinism) |
| Document/note/category analysis | 0.3 (creativity/accuracy balance) |

**Response format:** All AI endpoints require `ONLY valid JSON, no markdown formatting`.

---

### Rule 7. Counter Synchronization

All sidebar counters are synchronized with actual DB state + localStorage.

- `fetchGlobalCounters()` called on init and after every mutation
- Instructions counter = `(BUILTIN_COUNT - hiddenTemplates) + dbInstructionsTotal`
- Documents counter = `data.allTotal` (from API)
- Notes counter = `notesData.length` (from API)
- Terms counter = `data.total` (from API)
- On deletion -- immediate `refreshAll()`

---

### Rule 8. Safe Delete Policy

Deleting any entity requires **explicit confirmation** via AlertDialog. All 7 entities. No exceptions.

---

### Rule 9. localStorage Persistence

Data not stored in DB is persisted in localStorage with `wiki-codex:*` keys:

- `wiki-codex:hidden-templates` -- Array of hidden built-in instruction IDs
- `wiki-codex:sidebar-collapsed` -- Sidebar state
- `wiki-codex:theme` -- Selected theme

---

### Rule 10. JSON-Only AI Responses

All AI endpoints use **parsing protection**: strip markdown fences, regex-extract JSON. If JSON unrecognized -- fallback value, error not propagated upstream.

---

## Delete Operations

| Entity | Location | Method |
|---|---|---|
| Note | List + Editor | Trash2 button + AlertDialog confirmation |
| Extracted instruction | List | Trash2 button + AlertDialog confirmation |
| Built-in instruction | List | Trash2 button + AlertDialog (localStorage, persistent) |
| Document | Viewer | Trash2 button + AlertDialog confirmation |
| Category | Sidebar | Trash2 button (hover) + AlertDialog confirmation |
| Tag | Sidebar | X button (hover) + AlertDialog confirmation |
| Term | Dictionary | Trash2 button (hover) + AlertDialog, bulk select + delete |
