import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SEED_CATEGORIES, SEED_TAGS, SEED_DOCUMENTS } from './data'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Seeding is not allowed in production' },
      { status: 403 }
    )
  }

  try {
    // Удаляем старые тестовые данные и пересоздаём
    await db.documentTag.deleteMany()
    await db.document.deleteMany()
    await db.term.deleteMany()
    await db.tag.deleteMany()
    await db.category.deleteMany()
    await db.note.deleteMany()

    // Создание категорий (key -> id mapping для последующих ссылок)
    const categoryMap: Record<string, string> = {}
    for (const { key, ...data } of SEED_CATEGORIES) {
      const created = await db.category.create({ data })
      categoryMap[key] = created.id
    }

    // Создание тегов (name -> id mapping для последующих ссылок)
    const tagMap: Record<string, string> = {}
    for (const data of SEED_TAGS) {
      const created = await db.tag.create({ data })
      tagMap[data.name] = created.id
    }

    // Создание документов с привязкой категорий и тегов
    for (const { categoryKey, tagNames, ...rest } of SEED_DOCUMENTS) {
      await db.document.create({
        data: {
          ...rest,
          categoryId: categoryMap[categoryKey],
          tags: {
            create: tagNames.map((name: string) => ({
              tag: { connect: { id: tagMap[name] } },
            })),
          },
        },
      })
    }

    return NextResponse.json({
      message: 'Тестовые данные успешно созданы',
      counts: {
        categories: SEED_CATEGORIES.length,
        tags: SEED_TAGS.length,
        documents: SEED_DOCUMENTS.length,
      },
    })
  } catch (error) {
    console.error('Ошибка при посеве данных:', error)
    return NextResponse.json(
      { error: 'Не удалось создать тестовые данные' },
      { status: 500 }
    )
  }
}
