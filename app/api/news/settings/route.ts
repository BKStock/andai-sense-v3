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

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    const upsert = db.prepare(`
      INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    const upsertMany = db.transaction((settings: Record<string, string>) => {
      for (const [key, value] of Object.entries(settings)) {
        upsert.run(key, String(value));
      }
    });

    upsertMany(body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
