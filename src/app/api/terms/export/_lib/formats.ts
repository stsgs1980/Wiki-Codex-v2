/**
 * Markdown / AsciiDoc serializers for the Term export endpoint.
 *
 * Both formats share the same Term shape (see _lib/shared.ts). Output is a
 * single string ready to be written to a file with Content-Disposition:
 * attachment.
 *
 * Design choices:
 *  - Alphabetical A-Z section headers (## A / == A) for navigability.
 *  - Each term is a ### / === block so it gets a permalink anchor.
 *  - Source document title is cited when present (helps traceability).
 *  - Created date in ISO format (YYYY-MM-DD) for stable diffs.
 *  - Empty optional fields (usage, document) are omitted, not emitted as
 *    "N/A", to keep the file compact.
 */
import { type ExportTerm, firstLetter, isoDate, pluralTerms } from './shared'

/**
 * Markdown export.
 *
 * Layout:
 *   # Глоссарий — Wiki Codex
 *   > Экспортировано: 2026-06-19 · N терминов
 *
 *   ## A
 *   ### API
 *   **Перевод:** интерфейс программирования приложений
 *
 *   Пояснение...
 *
 *   *Пример:* `fetch('/api/...')`
 *
 *   *Источник:* AGENT_RULES · *Добавлено:* 2026-06-19
 */
export function toMarkdown(terms: ExportTerm[]): string {
  const date = isoDate(new Date())
  const lines: string[] = [
    `# Глоссарий — Wiki Codex`,
    ``,
    `> Экспортировано: ${date} · ${terms.length} ${pluralTerms(terms.length)}`,
    ``,
  ]

  let currentLetter = ''
  for (const t of terms) {
    const letter = firstLetter(t.term)
    if (letter !== currentLetter) {
      currentLetter = letter
      lines.push(``, `## ${letter}`, ``)
    }

    lines.push(`### ${t.term}`, ``)
    lines.push(`**Перевод:** ${t.translation}`, ``)

    if (t.explanation?.trim()) {
      lines.push(t.explanation.trim(), ``)
    }

    if (t.usage?.trim()) {
      lines.push(`*Пример:* ${t.usage.trim()}`, ``)
    }

    const meta: string[] = []
    if (t.document?.title) {
      meta.push(`*Источник:* ${t.document.title}`)
    }
    meta.push(`*Добавлено:* ${isoDate(t.createdAt)}`)
    lines.push(meta.join(' · '), ``)
  }

  return lines.join('\n') + '\n'
}

/**
 * AsciiDoc export.
 *
 * Layout mirrors the Markdown version but uses AsciiDoc syntax:
 *   = Глоссарий — Wiki Codex
 *   :toc: left
 *   :toclevels: 2
 *
 *   == A
 *   === API
 *   Перевод:: интерфейс программирования приложений
 *
 *   Пояснение...
 *
 *   [sidebar]
 *   --
 *   Пример: `fetch('/api/...')`
 *   Источник: AGENT_RULES · 2026-06-19
 *   --
 */
export function toAsciiDoc(terms: ExportTerm[]): string {
  const date = isoDate(new Date())
  const lines: string[] = [
    `= Глоссарий — Wiki Codex`,
    `:toc: left`,
    `:toclevels: 2`,
    `:lang: ru`,
    `:encoding: UTF-8`,
    ``,
    `Экспортировано: ${date} · ${terms.length} ${pluralTerms(terms.length)}`,
    ``,
  ]

  let currentLetter = ''
  for (const t of terms) {
    const letter = firstLetter(t.term)
    if (letter !== currentLetter) {
      currentLetter = letter
      lines.push(``, `== ${letter}`, ``)
    }

    lines.push(`=== ${t.term}`, ``)
    lines.push(`Перевод:: ${t.translation}`)

    if (t.explanation?.trim()) {
      lines.push(``, t.explanation.trim())
    }

    if (t.usage?.trim() || t.document?.title) {
      lines.push(``, `[sidebar]`, `--`)
      if (t.usage?.trim()) {
        lines.push(`Пример: ${t.usage.trim()}`)
      }
      if (t.document?.title) {
        lines.push(`Источник: ${t.document.title}`)
      }
      lines.push(`Добавлено: ${isoDate(t.createdAt)}`)
      lines.push(`--`)
    } else {
      lines.push(``, `_Добавлено: ${isoDate(t.createdAt)}_`)
    }

    lines.push(``)
  }

  return lines.join('\n') + '\n'
}
