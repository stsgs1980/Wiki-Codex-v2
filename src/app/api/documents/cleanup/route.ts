import { NextRequest, NextResponse } from 'next/server'
import { handleScan } from './_lib/scan'
import { handleDelete } from './_lib/delete'

interface ScanBody {
  action: 'scan'
  ids?: string[]
}

interface DeleteBody {
  action: 'delete'
  ids: string[]
}

type CleanupBody = ScanBody | DeleteBody

export async function POST(request: NextRequest) {
  // ── 1. Parse & validate body ────────────────────────────────────────
  let body: CleanupBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.action || (body.action !== 'scan' && body.action !== 'delete')) {
    return NextResponse.json(
      { error: 'Invalid action. Must be "scan" or "delete"' },
      { status: 400 }
    )
  }

  // ── 2. Route to handler ─────────────────────────────────────────────
  if (body.action === 'scan') {
    return handleScan()
  }

  return handleDelete(body.ids)
}
