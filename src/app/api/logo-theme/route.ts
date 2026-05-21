import { NextRequest, NextResponse } from 'next/server'
import {
  detectContent,
  detectDarkUI,
  resolve,
  getProjectDescription,
} from '@/lib/theme-detection'

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const project = searchParams.get('project') || 'wiki-codex'
    const mode = searchParams.get('mode') || 'auto'

    // Validate mode
    const validModes = ['auto', 'dark', 'light']
    if (!validModes.includes(mode)) {
      return NextResponse.json(
        { error: `Invalid mode "${mode}". Must be one of: auto, dark, light` },
        { status: 400 },
      )
    }

    // Read project description from package.json
    const description = getProjectDescription(project)

    // Detect content theme and dark UI preference
    const content = detectContent(description)
    const darkUI = detectDarkUI(description)

    // Resolve the final theme
    const theme = resolve(content, darkUI, mode)

    return NextResponse.json({
      project,
      content,
      darkUI,
      mode,
      theme,
    })
  } catch (error) {
    console.error('Error resolving logo theme:', error)
    return NextResponse.json(
      { error: 'Failed to resolve logo theme' },
      { status: 500 },
    )
  }
}
