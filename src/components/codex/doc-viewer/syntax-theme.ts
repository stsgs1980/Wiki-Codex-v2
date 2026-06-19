/**
 * STD-DOC-002 — Terminal-themed syntax highlighting color scheme.
 *
 * Uses CSS variables from the design system so the palette automatically
 * adapts to light/dark mode AND matches the terminal aesthetic of the
 * surrounding UI (no generic blue/red/green that clashes with the brand).
 *
 * Token → Brand mapping (aligned with rest of the app):
 *
 *   terminal-accent (green)   → keywords, operators, properties, attributes
 *                               "commands you run"
 *   neuro-brand    (orange)  → functions, tags, numbers, entities
 *                               "actions / actors"
 *   star           (amber)   → strings, chars, regex, attr-values
 *                               "values / literals"
 *   brand-purple   (purple)  → class-names, types, constants, booleans
 *                               "structures / types"
 *   muted-foreground          → comments, prolog, doctype, cdata
 *                               "faded meta"
 *   foreground                → punctuation, plain text, variables
 *   destructive               → deleted, important
 *
 * This is a Prism style object (Record<selector, CSS props>) compatible
 * with `react-syntax-highlighter`'s `style` prop.
 */
export type SyntaxStyle = Record<string, Record<string, string>>

export const terminalSyntaxTheme: SyntaxStyle = {
  'code[class*="language-"]': {
    color: 'var(--foreground)',
    fontFamily:
      'var(--font-geist-mono), ui-monospace, "Fira Code", Menlo, Consolas, monospace',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    lineHeight: '1.6',
    MozTabSize: '2',
    OTabSize: '2',
    tabSize: '2',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: 'var(--foreground)',
    fontFamily:
      'var(--font-geist-mono), ui-monospace, "Fira Code", Menlo, Consolas, monospace',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    lineHeight: '1.6',
    MozTabSize: '2',
    OTabSize: '2',
    tabSize: '2',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
    background: 'transparent',
    padding: '0',
    margin: '0',
    overflow: 'auto',
  },

  // ── Faded meta — comments & doc stuff ──
  comment: { color: 'var(--muted-foreground)', fontStyle: 'italic', opacity: '0.75' },
  prolog: { color: 'var(--muted-foreground)', fontStyle: 'italic', opacity: '0.75' },
  doctype: { color: 'var(--muted-foreground)', fontStyle: 'italic', opacity: '0.75' },
  cdata: { color: 'var(--muted-foreground)', fontStyle: 'italic', opacity: '0.75' },

  // ── Neutral — punctuation & plain text ──
  punctuation: { color: 'var(--foreground)', opacity: '0.7' },

  // ── Green / terminal-accent — keywords, properties, selectors ──
  property: { color: 'var(--terminal-accent)' },
  selector: { color: 'var(--terminal-accent)' },
  'attr-name': { color: 'var(--terminal-accent)' },
  keyword: { color: 'var(--terminal-accent)', fontWeight: '600' },
  atrule: { color: 'var(--terminal-accent)', fontWeight: '600' },
  builtin: { color: 'var(--terminal-accent)' },
  inserted: { color: 'var(--terminal-accent)' },
  operator: { color: 'var(--terminal-accent)', background: 'transparent' },

  // ── Orange / neuro-brand — functions, tags, numbers, entities ──
  function: { color: 'var(--neuro-brand)' },
  tag: { color: 'var(--neuro-brand)' },
  number: { color: 'var(--neuro-brand)' },
  entity: { color: 'var(--neuro-brand)', cursor: 'help' },
  url: { color: 'var(--neuro-brand)' },
  'namespace': { color: 'var(--neuro-brand)', opacity: '0.7' },

  // ── Amber / star — strings, chars, regex, attr-values ──
  string: { color: 'var(--star)' },
  char: { color: 'var(--star)' },
  regex: { color: 'var(--star)' },
  'attr-value': { color: 'var(--star)' },
  symbol: { color: 'var(--star)' },

  // ── Purple / brand-purple — types, classes, constants, booleans ──
  'class-name': { color: 'var(--brand-purple)' },
  'maybe-class-name': { color: 'var(--brand-purple)' },
  constant: { color: 'var(--brand-purple)' },
  boolean: { color: 'var(--brand-purple)' },
  'parameter': { color: 'var(--brand-purple)', opacity: '0.9' },

  // ── Foreground — variables, decorators ──
  variable: { color: 'var(--foreground)' },
  decorator: { color: 'var(--neuro-brand)', fontStyle: 'italic' },
  important: { color: 'var(--destructive)', fontWeight: 'bold' },
  deleted: { color: 'var(--destructive)' },

  // ── Language-specific refinements ──
  // JSON keys are properties (green) — already handled above.
  // YAML keys: property (green), values: string/number (amber/orange).
  // Markdown headings & separators.
  'title': { color: 'var(--neuro-brand)', fontWeight: '700' },
  'title.function': { color: 'var(--neuro-brand)' },
  'title.class': { color: 'var(--brand-purple)' },

  // Diff highlighting (used in markdown ````diff blocks)
  'diff-meta': { color: 'var(--muted-foreground)' },
  'diff-deleted': { color: 'var(--destructive)', background: 'color-mix(in srgb, var(--destructive) 8%, transparent)' },
  'diff-inserted': { color: 'var(--terminal-accent)', background: 'color-mix(in srgb, var(--terminal-accent) 8%, transparent)' },

  // Line numbers gutter (if enabled)
  'line-numbers': { color: 'var(--muted-foreground)', opacity: '0.5' },
  'line-numbers-rows': { color: 'var(--muted-foreground)', opacity: '0.4' },
}
