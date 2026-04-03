import { NextResponse } from "next/server";
import { getDb } from "@/lib/news/db";
import { seedDatabase } from "@/lib/news/seed";
import { scoreArticle } from "@/lib/news/ai";
import { notifyArticle } from "@/lib/news/notifications";

export async function POST() {
  try {
    const db = getDb();
    seedDatabase();

    const { scrapeAllSources } = await import("@/lib/news/scraper");
    const { total, errors } = await scrapeAllSources();

    const threshold = parseInt(
      (db.prepare("SELECT value FROM settings WHERE key = 'score_threshold'").get() as { value: string })?.value || "70"
    );

    const unscoredArticles = db.prepare(`
      SELECT id, title, content FROM articles 
      WHERE ai_score IS NULL 
      ORDER BY published_at DESC 
      LIMIT 10
    `).all() as { id: number; title: string; content: string }[];

    let scored = 0;
    for (const article of unscoredArticles) {
      try {
        const result = await scoreArticle(article.title, article.content || "");
        db.prepare(`
          UPDATE articles 
          SET ai_score = ?, sentiment = ?, sentiment_score = ?, summary = ?, keywords = ?, category = ?
          WHERE id = ?
        `).run(
          result.score, result.sentiment, result.sentiment_score,
          result.summary, JSON.stringify(result.keywords), result.category,
          article.id
        );

        if (result.score >= threshold) {
          const fullArticle = db.prepare("SELECT * FROM articles WHERE id = ?").get(article.id) as {
            id: number; title: string; url: string; ai_score: number; summary: string; sentiment: string
          };
          if (fullArticle) {
            await notifyArticle(fullArticle);
          }
        }
        scored++;
      } catch (err) {
        console.error("Scoring error:", err);
      }
    }

    return NextResponse.json({ success: true, scraped: total, errors, scored });
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json({ error: "Scrape failed" }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
