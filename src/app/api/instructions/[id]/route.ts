import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { autoBackup } from '@/lib/backup'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const instruction = await db.instruction.findUnique({ where: { id } })
    if (!instruction) {
      return NextResponse.json({ error: 'Instruction not found' }, { status: 404 })
    }

    await db.instruction.delete({ where: { id } })
    autoBackup()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting instruction:', error)
    return NextResponse.json({ error: 'Failed to delete instruction' }, { status: 500 })
  }
}
