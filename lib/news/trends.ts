import { getDb } from "./db";

interface TrendData {
  topic: string;
  counts: number[];
  dates: string[];
  velocity: number;
  avgVelocity: number;
  predictedPeak: string | null;
  currentCount: number;
  trend: "rising" | "falling" | "stable";
}

export function calculateTrends(): TrendData[] {
  const db = getDb();

  // Get trending topics from keyword matches over last 14 days
  const rows = db.prepare(`
    SELECT 
      k.term as topic,
      date(a.published_at) as date,
      COUNT(*) as count,
      AVG(a.ai_score) as avg_score
    FROM keyword_matches km
    JOIN keywords k ON km.keyword_id = k.id
    JOIN articles a ON km.article_id = a.id
    WHERE a.published_at > datetime('now', '-14 days')
    GROUP BY k.term, date(a.published_at)
    ORDER BY k.term, date
  `).all() as { topic: string; date: string; count: number; avg_score: number }[];

  // Also get topics from article categories
  const categoryRows = db.prepare(`
    SELECT 
      category as topic,
      date(published_at) as date,
      COUNT(*) as count,
      AVG(ai_score) as avg_score
    FROM articles
    WHERE published_at > datetime('now', '-14 days')
      AND ai_score IS NOT NULL
    GROUP BY category, date(published_at)
    ORDER BY category, date
  `).all() as { topic: string; date: string; count: number; avg_score: number }[];

  const allRows = [...rows, ...categoryRows];
  const topicMap = new Map<string, Map<string, number>>();

  allRows.forEach(row => {
    if (!topicMap.has(row.topic)) topicMap.set(row.topic, new Map());
    topicMap.get(row.topic)!.set(row.date, (topicMap.get(row.topic)!.get(row.date) || 0) + row.count);
  });

  const trends: TrendData[] = [];

  topicMap.forEach((dateMap, topic) => {
    const sortedDates = Array.from(dateMap.keys()).sort();
    const counts = sortedDates.map(d => dateMap.get(d) || 0);

    if (counts.length < 2) return;

    // Calculate moving average and velocity
    const windowSize = Math.min(3, counts.length);
    const recentCounts = counts.slice(-windowSize);
    const earlierCounts = counts.slice(-windowSize * 2, -windowSize);

    const recentAvg = recentCounts.reduce((a, b) => a + b, 0) / recentCounts.length;
    const earlierAvg = earlierCounts.length > 0
      ? earlierCounts.reduce((a, b) => a + b, 0) / earlierCounts.length
      : recentAvg;

    const velocity = earlierAvg > 0 ? (recentAvg - earlierAvg) / earlierAvg : 0;
    const avgVelocity = counts.slice(1).reduce((sum, count, i) => {
      const prev = counts[i];
      return sum + (prev > 0 ? (count - prev) / prev : 0);
    }, 0) / (counts.length - 1);

    // Predict peak if velocity is strongly positive
    let predictedPeak: string | null = null;
    if (velocity > 0.3) {
      const peakDate = new Date();
      peakDate.setDate(peakDate.getDate() + 1);
      predictedPeak = peakDate.toISOString().split("T")[0];
    } else if (velocity > 0.15) {
      const peakDate = new Date();
      peakDate.setDate(peakDate.getDate() + 2);
      predictedPeak = peakDate.toISOString().split("T")[0];
    }

    const trend: "rising" | "falling" | "stable" =
      velocity > 0.1 ? "rising" : velocity < -0.1 ? "falling" : "stable";

    trends.push({
      topic,
      counts,
      dates: sortedDates,
      velocity,
      avgVelocity,
      predictedPeak,
      currentCount: recentAvg,
      trend,
    });

    // Save to DB
    const today = new Date().toISOString().split("T")[0];
    db.prepare(`
      INSERT OR REPLACE INTO trend_history (topic, date, article_count, avg_score, velocity, predicted_peak)
      VALUES (?, ?, ?, 0, ?, ?)
    `).run(topic, today, Math.round(recentAvg), velocity, predictedPeak);
  });

  return trends.sort((a, b) => b.velocity - a.velocity);
}

export function getTopTrends(limit = 10): TrendData[] {
  return calculateTrends().slice(0, limit);
}
