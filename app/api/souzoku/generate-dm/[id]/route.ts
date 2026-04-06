import { NextResponse } from "next/server";
import { getDb } from "@/lib/news/db";
import { OLLAMA_BASE } from "@/lib/config";

interface LeadRow {
  property_address: string | null;
  property_type: string | null;
  name: string;
  age: number | null;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const leadId = parseInt(id, 10);

  if (isNaN(leadId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const db = getDb();
  const lead = db.prepare(`
    SELECT l.property_address, l.property_type, d.name, d.age
    FROM souzoku_leads l
    LEFT JOIN souzoku_deceased d ON d.id = l.deceased_id
    WHERE l.id = ?
  `).get(leadId) as LeadRow | undefined;

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const prompt = `以下の相続案件の遺族向けに、不動産買取・相続相談のご案内DMを作成してください。
物件住所: ${lead.property_address ?? "ご自宅"}
物件種別: ${lead.property_type ?? "不動産"}
条件: 丁寧・誠実・押し売り感なし、無料相談を訴求、180字以内、文末に連絡先スペース確保`;

  let dmText = "";
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen3-bk:30b",
        prompt,
        stream: false,
        options: { temperature: 0.7, num_predict: 300 },
      }),
      signal: AbortSignal.timeout(90_000),
    });

    if (res.ok) {
      const data = (await res.json()) as { response?: unknown };
      if (typeof data.response === 'string') {
        dmText = data.response.trim().slice(0, 400);
      }
    } else {
      console.warn(`[generate-dm] Ollama returned ${res.status}, using fallback`);
    }
  } catch {
    // Ollama unavailable — use fallback
  }

  if (!dmText) {
    dmText =
      "この度はご家族様のご逝去に謹んでお悔やみ申し上げます。" +
      "相続に伴う不動産のお取り扱いでお困りの際は、" +
      "ぜひ当社の無料相談をご利用ください。【連絡先: 】";
  }

  db.prepare("UPDATE souzoku_leads SET dm_text = ? WHERE id = ?").run(dmText, leadId);

  return NextResponse.json({ dm_text: dmText });
}
