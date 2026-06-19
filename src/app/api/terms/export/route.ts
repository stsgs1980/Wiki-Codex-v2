import { NextRequest, NextResponse } from 'next/server'
import { fetchTermsForExport } from './_lib/fetch'
import { toMarkdown, toAsciiDoc } from './_lib/formats'

/**
 * GET /api/terms/export?format=markdown|adoc
 *
 * Returns the full glossary as a downloadable file attachment. Browsers
 * trigger a "Save As..." dialog via Content-Disposition: attachment.
 *
 * Formats:
 *  - markdown  → .md   (GFM-compatible, renders on GitHub/GitLab)
 *  - adoc      → .adoc (AsciiDoc, used by Antora / AsciiDoctor)
 *
 * Default: markdown. Unknown formats fall back to markdown with a 200
 * (lenient — avoids breaking the UI if a typo slips into the query).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = (searchParams.get('format') || 'markdown').toLowerCase()

    const terms = await fetchTermsForExport()

    if (terms.length === 0) {
      return NextResponse.json(
        { error: 'Словарь пуст — нечего экспортировать' },
        { status: 404 },
      )
    }

    const isAdoc = format === 'adoc' || format === 'asciidoc'
    const body = isAdoc ? toAsciiDoc(terms) : toMarkdown(terms)
    const ext = isAdoc ? 'adoc' : 'md'
    const mime = isAdoc ? 'text/asciidoc' : 'text/markdown'
    const date = new Date().toISOString().slice(0, 10)
    const filename = `glossary-${date}.${ext}`

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': `${mime}; charset=utf-8`,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Error exporting terms:', error)
    return NextResponse.json(
      { error: 'Failed to export terms' },
      { status: 500 },
    )
  }
}
