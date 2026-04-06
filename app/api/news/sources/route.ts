import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/news/db";
import { seedDatabase } from "@/lib/news/seed";

export async function GET() {
  try {
    const db = getDb();
    seedDatabase();
    const sources = db.prepare("SELECT * FROM sources ORDER BY name").all();
    return NextResponse.json({ sources });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch sources" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const { name, url, type = "rss", category = "general", language = "en" } = body;

    if (!name || !url) {
      return NextResponse.json({ error: "Name and URL required" }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO sources (name, url, type, category, language, enabled)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(name, url, type, category, language);

    return NextResponse.json({ id: result.lastInsertRowid, success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create source" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = getDb();
    const { id } = await req.json();
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    db.prepare("DELETE FROM sources WHERE id = ?").run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete source" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const { id, enabled, name, url, category, language } = body;

    if (enabled !== undefined) {
      db.prepare("UPDATE sources SET enabled = ? WHERE id = ?").run(enabled ? 1 : 0, id);
    } else {
      db.prepare(`
        UPDATE sources SET name = ?, url = ?, category = ?, language = ? WHERE id = ?
      `).run(name, url, category, language, id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update source" }, { status: 500 });
  }
}
