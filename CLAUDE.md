# Wiki Codex -- Project Rules

## Icons & Emojis

- **No Unicode emojis anywhere.** Never use emoji characters (e.g. `` `` etc.) in code, UI text, comments, API responses, generated documents, notes, terms, instructions, or any project file.
- **Always use SVG icons.** The project uses Lucide React (`lucide-react`) for all iconography. If an icon is needed in a component, import the corresponding SVG icon from `lucide-react`. For any new icon needs, find or create an SVG solution -- never fall back to Unicode emojis.
- This rule applies to:
  - Application UI (components, pages, layouts)
  - API response messages and toast notifications
  - AI-generated content (document summaries, extracted terms, instructions)
  - Code comments and documentation
  - README and all markdown files

## CLI / Code Art Styling

- All main views (dashboard, documents, notes, dictionary, instructions) must use `TerminalFrame` wrapper component.
- Use `font-mono` for labels, metadata, and navigation.
- Use `border-dashed` for list items and cards.
- Use green `$` prefix for list rows (`text-green-600 dark:text-green-400`).
- Header uses `codex:~/path $` terminal prompt format.
- Sidebar uses `>_` brand, `[ categories ]` labels, navigation indicators.

## Agent Toolkit Integration

This project integrates the [agent-toolkit](https://github.com/stsgs1980/agent-toolkit) framework:

- **AGENT_RULES.md** -- Behavioral rules for AI agents
- **PROJECT_CONFIG.md** -- Stack-specific configuration (Next.js 16 + TypeScript + Tailwind CSS)
- **standards/** -- Governance documents (No-Unicode Policy, Markdown Standard, Reproducibility Standard)
- **instructions/** -- Behavioral instructions (onboarding, git workflow, language rule, etc.)
- **skills/** -- Automation skills (api-retry, health-check, fallback, git-safe-ops, dev-watchdog)
- **templates/** -- Operational templates (workflows, CI, E2E tests)

Implemented skills in `src/lib/`:
- `api-retry.ts` -- fetchWithRetry with exponential backoff
- `circuit-breaker.ts` -- Circuit Breaker pattern
- `health-check.ts` -- API health monitoring
- `fallback-manager.ts` -- AI provider fallback

## NEURO Brand

This project uses the [agent-logo](https://github.com/stsgs1980/agent-logo) system:

- **logos/** -- NEURO brand SVGs (light, dark, mono, outline, inverted variants)
- **scripts-logo/** -- Logo detection agent (auto-selects theme based on project description)
- Brand color: `#FA3913`
- Slogan: "INTELLIGENCE THAT WORKS FOR YOU"

## Stack Signature

Built with: Next.js 16 + TypeScript + Tailwind CSS + Prisma + PostgreSQL
