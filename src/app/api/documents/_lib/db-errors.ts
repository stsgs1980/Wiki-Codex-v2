import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

/**
 * Map Prisma errors to user-facing JSON responses.
 *  - P2003: foreign key constraint → 400 (category/tag does not exist)
 *  - P2002: unique constraint     → 409 (document already exists)
 *  - P2021: table missing         → 500 (DB migration required)
 *  - everything else              → 500 (truncated error message)
 */
export function handleDbError(error: unknown): NextResponse {
  console.error('[documents] DB error:', error)
  const errMsg = error instanceof Error ? error.message : String(error)

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2003: Foreign key constraint failed
    if (error.code === 'P2003') {
      return NextResponse.json(
        {
          error: `Указанная категория или тег не существует (${error.meta?.field_name ?? 'unknown'})`,
        },
        { status: 400 }
      )
    }
    // P2002: Unique constraint failed
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Документ с такими данными уже существует' },
        { status: 409 }
      )
    }
    // P2021: Table doesn't exist
    if (error.code === 'P2021') {
      return NextResponse.json(
        { error: 'Таблица документов не найдена. Необходима миграция БД.' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json(
    { error: `Ошибка создания документа: ${errMsg.substring(0, 200)}` },
    { status: 500 }
  )
}
