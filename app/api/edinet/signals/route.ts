import { NextResponse } from "next/server";
import { BACKEND_BASE as BACKEND } from "@/lib/config";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "";
  const limit = searchParams.get("limit") ?? "50";
  const minScore = searchParams.get("min_score") ?? "0";

  try {
    const params = new URLSearchParams({ limit, min_score: minScore });
    if (type) params.set("signal_type", type);

    const res = await fetch(`${BACKEND}/api/edinet/signals?${params}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({ signals: [], total: 0, error: "backend error" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ signals: [], total: 0, error: "crawler backend offline" }, { status: 503 });
  }
}
