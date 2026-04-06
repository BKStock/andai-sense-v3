import { NextResponse } from "next/server";
import { getDb } from "@/lib/news/db";

interface DeceasedRow {
  id: number;
  name: string;
  age: number | null;
  prefecture: string | null;
  city: string | null;
  published_date: string | null;
}

interface LeadRow {
  id: number;
  deceased_id: number;
  property_address: string | null;
  property_type: string | null;
  estimated_value: number;
  lead_score: number;
  dm_status: string;
  dm_text: string | null;
  notes: string | null;
  created_at: string;
}

interface LeadResult extends LeadRow, DeceasedRow {}

export async function GET() {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT
        l.id, l.deceased_id, l.property_address, l.property_type,
        l.estimated_value, l.lead_score, l.dm_status, l.dm_text,
        l.notes, l.created_at,
        d.name, d.age, d.prefecture, d.city, d.published_date
      FROM souzoku_leads l
      LEFT JOIN souzoku_deceased d ON d.id = l.deceased_id
      ORDER BY l.lead_score DESC, l.created_at DESC
      LIMIT 200
    `).all() as LeadResult[];

    return NextResponse.json({ leads: rows });
  } catch (error) {
    console.error("[souzoku/leads GET]", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      name: string;
      age?: number;
      prefecture?: string;
      city?: string;
      property_address?: string;
      property_type?: string;
      estimated_value?: number;
      lead_score?: number;
      published_date?: string;
    };

    if (typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const db = getDb();
    const deceasedResult = db.prepare(`
      INSERT INTO souzoku_deceased (name, age, prefecture, city, source_name, published_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      body.name.trim(),
      body.age ?? null,
      body.prefecture ?? null,
      body.city ?? null,
      "手動入力",
      body.published_date ?? new Date().toISOString().split("T")[0],
    );

    const leadResult = db.prepare(`
      INSERT INTO souzoku_leads
        (deceased_id, property_address, property_type, estimated_value, lead_score)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      Number(deceasedResult.lastInsertRowid),
      body.property_address ?? null,
      body.property_type ?? "不動産",
      body.estimated_value ?? 0,
      body.lead_score ?? 50,
    );

    return NextResponse.json({ id: leadResult.lastInsertRowid }, { status: 201 });
  } catch (error) {
    console.error("[souzoku/leads POST]", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
