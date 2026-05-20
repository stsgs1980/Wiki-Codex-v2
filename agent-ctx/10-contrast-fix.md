# Task ID: 10
# Agent: contrast-fix
# Task: Fix all light theme contrast/readability issues

## Work Log
- Fixed globals.css :root (light theme) tokens: --muted-foreground oklch(0.556→0.44), --border oklch(0.922→0.88), --input oklch(0.922→0.88), --sidebar-border oklch(0.922→0.88)
- Rewrote step-type-config.tsx: all 5 step types now use theme-aware classes with light/dark variants (e.g. text-amber-600 dark:text-amber-400, bg-amber-50 dark:bg-amber-500/5)
- Fixed step-card.tsx: text-zinc-300 → text-muted-foreground for step descriptions
- Fixed sidebar-categories.tsx: /60→/80 on section labels, /50→/70 on empty states
- Fixed sidebar-tags.tsx: /60→/80 on section labels, /50→/70 on empty states
- Fixed sidebar-nav.tsx: /50→/70 on inactive nav indicators
- Fixed dashboard-view.tsx: /60→/80 on file type count badges
- Fixed recently-viewed-section.tsx: /40→/60 on clear button, /30→/50 on empty icon, /60→/80 on count and timestamps
- Fixed latest-documents-section.tsx: /40→/50 on empty icon, /60→/80 on count and dates
- Fixed notes-view.tsx: /60→/80 on dates, /40→/50 on empty state icon
- Fixed dictionary-view.tsx: /60→/80 on group counts
- Fixed dictionary-empty-states.tsx: /40→/50 on empty icons, /70→/80 on subtitle text
- Fixed term-card-list.tsx: /50→/70 on equals sign
- Fixed term-card-grid.tsx: /70→/80 on explanation text
- Fixed instructions-view.tsx: /60→/80 on "built-in" separator label
- Fixed page.tsx: /40→/50 on empty doc icon, /50→/70 on version, /70→/80 on NEURO/tech logos/footer count
- Left copyable-code-block.tsx and semantic-highlight.tsx unchanged (always-dark terminal aesthetic)
- Lint passes clean, dev server running

## Stage Summary
- --muted-foreground now ~4.5:1 contrast on white (passes WCAG AA)
- All 5 step type configs use light+dark theme-aware classes
- Zero remaining text-zinc-200/300/400 outside always-dark code blocks
- All text-muted-foreground/N opacity values raised: /60→/80 for text, /50→/70 for labels, /40→/50 for decorative icons
- Dark theme preserved via dark: prefix variants throughout
