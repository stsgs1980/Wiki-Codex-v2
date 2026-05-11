import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sanitizeField } from "@/lib/sanitize";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const note = await db.note.findUnique({
      where: { id },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error fetching note:', error)
    return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content } = body;

    const updateData: { title?: string; content?: string } = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        return NextResponse.json(
          { error: "Title must be a non-empty string" },
          { status: 400 }
        );
      }
      updateData.title = sanitizeField(title.trim(), 'note.title');
    }

    if (content !== undefined) {
      updateData.content = sanitizeField(typeof content === "string" ? content : "", 'note.content');
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const note = await db.note.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error updating note:', error)
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.note.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error)
    if (error instanceof Error && error.message.includes('Record to delete not found')) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
