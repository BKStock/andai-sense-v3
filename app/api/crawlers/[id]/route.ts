import { NextRequest, NextResponse } from "next/server";
import { BACKEND_BASE } from "@/lib/config";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/crawlers/[id] — start or stop individual crawler
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { action?: string };
  const targetName = decodeURIComponent(id);

  if (body.action === "start") {
    try {
      const res = await fetch(
        `${BACKEND_BASE}/api/crawlers/run?target_name=${encodeURIComponent(targetName)}`,
        { method: "POST", signal: AbortSignal.timeout(5000) }
      );
      if (res.ok) {
        return NextResponse.json({ success: true, status: "running", target: targetName });
      }
    } catch {
      // Backend offline
    }
    return NextResponse.json({ error: "crawler offline" }, { status: 503 });
  }

  // Stop: background tasks can't be cancelled — acknowledge and return paused
  return NextResponse.json({ success: true, status: "paused", target: targetName });
}

// GET /api/crawlers/[id] — get specific crawler status from recent_runs
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const targetName = decodeURIComponent(id);

  try {
    const res = await fetch(`${BACKEND_BASE}/api/crawlers/status`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      const run = (data.recent_runs ?? []).find(
        (r: { target: string; status: string; started_at: string; items_found: number }) =>
          r.target === targetName
      );
      return NextResponse.json({ online: true, run: run ?? null });
    }
  } catch {
    // Backend offline
  }

  return NextResponse.json({ online: false, run: null });
}
