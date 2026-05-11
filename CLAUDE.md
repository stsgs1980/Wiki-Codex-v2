# Wiki Codex — Project Rules

## Icons & Emojis

- **No Unicode emojis anywhere.** Never use emoji characters (e.g. `` ✅ 📝 🔧 🚀 `` etc.) in code, UI text, comments, API responses, generated documents, notes, terms, instructions, or any project file.
- **Always use SVG icons.** The project uses Lucide React (`lucide-react`) for all iconography. If an icon is needed in a component, import the corresponding SVG icon from `lucide-react`. For any new icon needs, find or create an SVG solution — never fall back to Unicode emojis.
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
- Sidebar uses `>_` brand, `[ категории ]` labels, `▸/▹` nav indicators.
