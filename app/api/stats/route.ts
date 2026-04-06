import { NextResponse } from "next/server";
import { getDb } from "@/lib/news/db";
import { BACKEND_BASE } from "@/lib/config";

export async function GET() {
  try {
    const db = getDb();

    const getCount = (sql: string): number =>
      (db.prepare(sql).get() as { count: number } | undefined)?.count ?? 0;

    const totalArticles = getCount("SELECT COUNT(*) as count FROM articles");
    const todayArticles = getCount(
      "SELECT COUNT(*) as count FROM articles WHERE date(fetched_at) = date('now')"
    );
    const activeSources = getCount("SELECT COUNT(*) as count FROM sources WHERE enabled = 1");
    const activeKeywords = getCount("SELECT COUNT(*) as count FROM keywords WHERE enabled = 1");
    const alertsToday = getCount(
      "SELECT COUNT(*) as count FROM alerts WHERE date(sent_at) = date('now')"
    );

    let backendStats: {
      stats?: {
        total_companies?: number;
        high_score_count?: number;
        total_signals?: number;
      };
    } | null = null;
    let crawlerOnline = false;

    try {
      const res = await fetch(`${BACKEND_BASE}/api/stats`, {
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        backendStats = await res.json();
        crawlerOnline = true;
      }
    } catch {
      // Backend offline — use local data
    }

    return NextResponse.json({
      alerts_today: alertsToday,
      articles_today: todayArticles,
      total_articles: totalArticles,
      active_sources: activeSources,
      active_keywords: activeKeywords,
      entities: backendStats?.stats?.total_companies ?? totalArticles,
      signals: backendStats?.stats?.total_signals ?? activeKeywords,
      urgent_cases: backendStats?.stats?.high_score_count ?? 0,
      crawler_online: crawlerOnline,
    });
  } catch (error) {
    console.error("[Stats API]", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
