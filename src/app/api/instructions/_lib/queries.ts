import { db } from '@/lib/db'

/**
 * GET /api/instructions -- list all instructions.
 *
 * Returns instructions ordered by built-in first, then newest-created first.
 * Includes the source document's id+title for each instruction.
 */
export async function fetchInstructions() {
  const instructions = await db.instruction.findMany({
    include: {
      sourceDoc: { select: { id: true, title: true } },
    },
    orderBy: [{ isBuiltIn: 'desc' }, { createdAt: 'desc' }],
  })
  return { instructions, total: instructions.length }
}
