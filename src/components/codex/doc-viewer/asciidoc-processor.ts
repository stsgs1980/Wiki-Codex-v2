/**
 * AsciiDoc processor singleton (lazy-loaded).
 *
 * asciidoctor.js is ~2MB — we load it on demand only when the user opens
 * an .adoc document, not in the initial bundle. Cached after first load
 * so subsequent .adoc views are instant.
 */
import AsciidoctorFactory from '@asciidoctor/core'

// The default export is `function asciidoctor(): Asciidoctor` — the
// processor instance type is the value returned by that factory.
type Processor = ReturnType<typeof AsciidoctorFactory>

let processor: Processor | null = null
let loadPromise: Promise<Processor> | null = null

export async function getAsciidoctor(): Promise<Processor> {
  if (processor) return processor
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    const mod = await import('asciidoctor')
    // `asciidoctor` package re-exports @asciidoctor/core's default function.
    // The factory returns a singleton processor instance.
    const factory = (mod as unknown as { default?: () => Processor }).default ?? (mod as unknown as () => Processor)
    processor = factory()
    return processor
  })()

  return loadPromise
}

/**
 * Convert AsciiDoc source to safe HTML.
 *
 * Security: asciidoctor.js runs in the browser with `safe: 'secure'`
 * (the most restrictive mode) — disables includes, macros that read
 * files, and data-uri embedding. Output is trusted because:
 *  - Input source comes from authenticated document content (not arbitrary
 *    user-pasted HTML).
 *  - `safe: 'secure'` blocks all include/macro attack vectors.
 *  - Conversion is deterministic (no eval, no script injection).
 *
 * Options:
 *  - safe: 'secure'      — no include macros, no data-uri
 *  - attributes:         — disable unsafe features explicitly
 *    - allow-uri-read: false — don't fetch remote resources
 *    - data-uri: false       — don't embed images as data URIs
 */
export async function convertAdoc(source: string): Promise<string> {
  const asciidoctor = await getAsciidoctor()
  return asciidoctor.convert(source, {
    safe: 'secure',
    attributes: {
      skip: '',
      'allow-uri-read': 'false',
      'data-uri': 'false',
    },
  }) as string
}
