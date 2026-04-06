import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/news/db";
import { seedDatabase } from "@/lib/news/seed";

export async function GET() {
  try {
    const db = getDb();
    seedDatabase();
    const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string | null }[];
    const settings: Record<string, string> = {};
    rows.forEach(({ key, value }) => { if (key && value != null) settings[key] = value; });
    return NextResponse.json({ settings });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

const ALLOWED_SETTINGS_KEYS = new Set([
  'score_threshold', 'min_ai_score', 'briefing_time_morning', 'briefing_time_evening',
  'briefing_enabled', 'scrape_interval', 'crawl_interval', 'notification_channels',
  'alert_channels', 'telegram_enabled', 'email_enabled', 'webhook_enabled',
  'notification_email', 'slack_webhook_url', 'language', 'language_filter',
  'theme', 'max_articles_per_briefing', 'max_articles_per_run', 'digest_enabled',
  'digest_time', 'ollama_host', 'ollama_model',
]);

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = (await req.json()) as Record<string, unknown>;

    const upsert = db.prepare(`
      INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    const upsertMany = db.transaction((settings: Record<string, unknown>) => {
      for (const [key, value] of Object.entries(settings)) {
        if (ALLOWED_SETTINGS_KEYS.has(key)) {
          upsert.run(key, String(value));
        }
      }
    });

    upsertMany(body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
