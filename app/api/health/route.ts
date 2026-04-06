import { NextResponse } from "next/server";
import { BACKEND_BASE } from "@/lib/config";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/crawlers/status`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        online: true,
        total_companies: data.total_companies ?? 0,
        recent_count: data.recent_runs?.length ?? 0,
        targets_count: data.targets?.length ?? 0,
      });
    }
    return NextResponse.json({ online: false });
  } catch {
    return NextResponse.json({ online: false });
  }
}
