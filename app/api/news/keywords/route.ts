import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/news/db";
import { seedDatabase } from "@/lib/news/seed";

export async function GET() {
  try {
    const db = getDb();
    seedDatabase();
    const keywords = db.prepare(`
      SELECT k.*, COUNT(km.id) as match_count
      FROM keywords k
      LEFT JOIN keyword_matches km ON k.id = km.keyword_id
      GROUP BY k.id
      ORDER BY k.priority DESC, k.term
    `).all();
    return NextResponse.json({ keywords });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch keywords" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const {
      term, category = "general", condition_type = "OR",
      related_terms = [], exclude_terms = [], priority = 1, color = "#6366f1"
    } = body;

    if (!term || typeof term !== 'string') {
      return NextResponse.json({ error: "Term required" }, { status: 400 });
    }
    const safeRelated = Array.isArray(related_terms) ? related_terms : [];
    const safeExcluded = Array.isArray(exclude_terms) ? exclude_terms : [];

    const result = db.prepare(`
      INSERT INTO keywords (term, category, condition_type, related_terms, exclude_terms, priority, color)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(term, category, condition_type, JSON.stringify(safeRelated), JSON.stringify(safeExcluded), priority, color);

    return NextResponse.json({ id: result.lastInsertRowid, success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create keyword" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = getDb();
    const { id } = await req.json();
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    db.prepare("DELETE FROM keyword_matches WHERE keyword_id = ?").run(id);
    db.prepare("DELETE FROM keywords WHERE id = ?").run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete keyword" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const { id, term, category, condition_type, related_terms, exclude_terms, priority, color, enabled } = body;

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    if (enabled !== undefined) {
      db.prepare("UPDATE keywords SET enabled = ? WHERE id = ?").run(enabled ? 1 : 0, id);
    } else {
      if (!term || typeof term !== 'string') {
        return NextResponse.json({ error: "term is required" }, { status: 400 });
      }
      const safeRelated = Array.isArray(related_terms) ? related_terms : [];
      const safeExcluded = Array.isArray(exclude_terms) ? exclude_terms : [];
      db.prepare(`
        UPDATE keywords SET term=?, category=?, condition_type=?, related_terms=?, exclude_terms=?, priority=?, color=?
        WHERE id = ?
      `).run(term, category, condition_type, JSON.stringify(safeRelated), JSON.stringify(safeExcluded), priority, color, id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update keyword" }, { status: 500 });
  }
}
