'use client'

import { MarkdownContent } from './markdown-renderer'
import { AsciiDocContent } from './asciidoc-renderer'
import type { Document } from '@/lib/types'

/**
 * DocumentContent — router that picks the right renderer based on
 * `doc.fileType`.
 *
 *  - 'adoc'                     → AsciiDocContent (asciidoctor.js)
 *  - 'md' / 'txt' / everything else → MarkdownContent (react-markdown + remark-gfm)
 *
 * Why a router instead of a single renderer?
 *  - AsciiDoc and Markdown are not interoperable — AsciiDoc syntax (`= H1`,
 *    `:toc:`, `Perевод::`) renders as literal text in react-markdown.
 *  - asciidoctor.js is ~2MB; lazy-loading only when needed keeps the md
 *    viewing path fast and the initial bundle small.
 *  - Future formats (reST, org-mode) can plug in here without touching
 *    document-view-mode.tsx — single seam for content rendering.
 *
 * The .asciidoc-body class is styled in globals.css to give adoc output
 * the same terminal-themed look as .prose (markdown).
 */
interface DocumentContentProps {
  doc: Pick<Document, 'content' | 'fileType'>
}

export function DocumentContent({ doc }: DocumentContentProps) {
  if (doc.fileType === 'adoc') {
    return <AsciiDocContent content={doc.content} />
  }
  return <MarkdownContent content={doc.content} />
}
