import { NextResponse } from "next/server";
import { getDb } from "@/lib/news/db";
import { seedDatabase } from "@/lib/news/seed";

export async function GET() {
  try {
    const db = getDb();
    seedDatabase();

    const trendData = db.prepare(`
      SELECT topic, date, article_count, avg_score, velocity, predicted_peak
      FROM trend_history
      WHERE date >= date('now', '-14 days')
      ORDER BY topic, date
    `).all() as {
      topic: string; date: string; article_count: number;
      avg_score: number; velocity: number; predicted_peak: string | null
    }[];

    const topicMap = new Map<string, typeof trendData>();
    trendData.forEach(row => {
      if (!topicMap.has(row.topic)) topicMap.set(row.topic, []);
      topicMap.get(row.topic)!.push(row);
    });

    const trends = Array.from(topicMap.entries()).map(([topic, rows]) => {
      const latest = rows[rows.length - 1];
      const prev = rows[rows.length - 2];
      const velocity = latest?.velocity || 0;
      const currentCount = latest?.article_count || 0;
      const prevCount = prev?.article_count || 0;
      const change = prevCount > 0 ? ((currentCount - prevCount) / prevCount) * 100 : 0;

      return {
        topic,
        rows,
        dates: rows.map(r => r.date),
        counts: rows.map(r => r.article_count),
        velocity,
        currentCount,
        change: Math.round(change),
        predictedPeak: latest?.predicted_peak || null,
        trend: velocity > 0.1 ? "rising" : velocity < -0.1 ? "falling" : "stable",
      };
    });

    trends.sort((a, b) => b.velocity - a.velocity);

    return NextResponse.json({ trends });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch trends" }, { status: 500 });
  }
}
