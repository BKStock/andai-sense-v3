import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/news/db";
import { seedDatabase } from "@/lib/news/seed";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    seedDatabase();

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30");
    const view = searchParams.get("view") || "category";

    if (view === "keyword") {
      const data = db.prepare(`
        SELECT date, keyword, positive_count, neutral_count, negative_count, avg_score
        FROM sentiment_history
        WHERE category = 'keyword'
          AND date >= date('now', '-${days} days')
          AND keyword IS NOT NULL
        ORDER BY date
      `).all();
      return NextResponse.json({ data, view });
    }

    const data = db.prepare(`
      SELECT date, category, positive_count, neutral_count, negative_count, avg_score
      FROM sentiment_history
      WHERE category != 'keyword'
        AND date >= date('now', '-${days} days')
      ORDER BY date
    `).all();

    const realtimeSentiment = db.prepare(`
      SELECT 
        category,
        SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive,
        SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END) as neutral,
        SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative,
        AVG(sentiment_score) as avg_score,
        COUNT(*) as total
      FROM articles
      WHERE ai_score IS NOT NULL
        AND published_at > datetime('now', '-30 days')
      GROUP BY category
      ORDER BY total DESC
    `).all();

    return NextResponse.json({ data, realtimeSentiment, view });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch sentiment" }, { status: 500 });
  }
}
