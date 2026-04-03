import Parser from "rss-parser";
import { getDb } from "./db";

interface FeedItem {
  title?: string;
  link?: string;
  content?: string;
  contentSnippet?: string;
  pubDate?: string;
  creator?: string;
  author?: string;
}

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "AI-Sense/1.0 RSS Reader",
  },
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:description", "mediaDescription"],
    ],
  },
});

export async function scrapeSource(sourceId: number, url: string, language = "en"): Promise<number> {
  const db = getDb();
  let newCount = 0;

  try {
    const feed = await parser.parseURL(url);
    const insertArticle = db.prepare(`
      INSERT OR IGNORE INTO articles 
      (source_id, title, content, url, author, published_at, language)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of (feed.items || []).slice(0, 20) as FeedItem[]) {
      if (!item.title || !item.link) continue;

      const content = item.content || item.contentSnippet || item.title;
      const author = item.creator || item.author || "Unknown";
      const pubDate = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();

      try {
        const result = insertArticle.run(
          sourceId,
          item.title,
          content,
          item.link,
          author,
          pubDate,
          language
        );
        if (result.changes > 0) newCount++;
      } catch {
        // Skip duplicates
      }
    }

    // Update source stats
    db.prepare(`
      UPDATE sources 
      SET last_fetched_at = datetime('now'), 
          article_count = article_count + ?
      WHERE id = ?
    `).run(newCount, sourceId);

  } catch (error) {
    console.error(`Scraping error for source ${sourceId} (${url}):`, error);
  }

  return newCount;
}

export async function scrapeAllSources(): Promise<{ total: number; errors: number }> {
  const db = getDb();
  const sources = db.prepare("SELECT * FROM sources WHERE enabled = 1").all() as {
    id: number; url: string; language: string
  }[];

  let total = 0;
  let errors = 0;

  for (const source of sources) {
    try {
      const count = await scrapeSource(source.id, source.url, source.language);
      total += count;
    } catch {
      errors++;
    }
  }

  return { total, errors };
}
