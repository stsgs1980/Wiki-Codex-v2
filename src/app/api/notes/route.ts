import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createNoteSchema } from "@/lib/validations";
import { sanitizeField } from "@/lib/sanitize";
import { contains } from "@/lib/db-filter";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    const notes = await db.note.findMany({
      where: search
        ? {
            OR: [
              { title: contains(search) },
              { content: contains(search) },
            ],
          }
        : undefined,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { title, content } = parsed.data;

    const note = await db.note.create({
      data: {
        title: sanitizeField(title, 'note.title'),
        content: sanitizeField(content, 'note.content'),
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
