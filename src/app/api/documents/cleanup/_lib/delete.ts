import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

/**
 * Delete mode: Delete specific duplicate documents by IDs.
 * Cascade deletes tags via DocumentTag.
 */
export async function handleDelete(ids: string[] | undefined): Promise<NextResponse> {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: 'ids must be a non-empty array of document IDs' },
      { status: 400 }
    )
  }

  try {
    let deleted = 0

    await db.$transaction(async (tx) => {
      for (const id of ids) {
        try {
          // Delete DocumentTag relations first (explicit, even though cascade exists)
          await tx.documentTag.deleteMany({ where: { documentId: id } })
          await tx.document.delete({ where: { id } })
          deleted++
        } catch (docError) {
          // Individual document may not exist — skip and continue
          const errMsg =
            docError instanceof Error ? docError.message : String(docError)
          if (errMsg.includes('Record to delete not found')) {
            console.warn(`[cleanup] Document ${id} not found, skipping`)
          } else {
            throw docError // re-throw unexpected errors to rollback transaction
          }
        }
      }
    })

    return NextResponse.json({
      deleted,
      ids,
    })
  } catch (error) {
    console.error('[cleanup] Delete failed:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'One or more documents not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete duplicate documents' },
      { status: 500 }
    )
  }
}
