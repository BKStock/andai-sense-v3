import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/news/db";
import { seedDatabase } from "@/lib/news/seed";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    seedDatabase();

    const { searchParams } = new URL(req.url);
    const rawPage = parseInt(searchParams.get("page") || "1");
    const rawLimit = parseInt(searchParams.get("limit") || "20");
    const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
    const limit = Math.min(100, Math.max(1, isNaN(rawLimit) ? 20 : rawLimit));
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const sentiment = searchParams.get("sentiment") || "";
    const rawMinScore = parseInt(searchParams.get("minScore") || "0", 10);
    const minScore = Math.max(0, Math.min(100, isNaN(rawMinScore) ? 0 : rawMinScore));
    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";
    const params: (string | number)[] = [];

    if (search) {
      where += " AND (a.title LIKE ? OR a.summary LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      where += " AND a.category = ?";
      params.push(category);
    }
    if (sentiment) {
      where += " AND a.sentiment = ?";
      params.push(sentiment);
    }
    if (minScore > 0) {
      where += " AND a.ai_score >= ?";
      params.push(minScore);
    }

    const articles = db.prepare(`
      SELECT a.*, s.name as source_name
      FROM articles a
      LEFT JOIN sources s ON a.source_id = s.id
      ${where}
      ORDER BY a.published_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const countResult = db.prepare(`
      SELECT COUNT(*) as count FROM articles a ${where}
    `).get(...params) as { count: number } | undefined;
    const total = countResult?.count ?? 0;

    return NextResponse.json({ articles, total, page, limit });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}
