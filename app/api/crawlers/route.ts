import { NextResponse } from 'next/server'
import { BACKEND_BASE } from '@/lib/config'

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/crawlers/status`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: 'crawler offline', recent_runs: [], total_companies: 0 })
  }
}

export async function POST() {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/crawlers/run-all`, {
      method: 'POST',
      signal: AbortSignal.timeout(30000),
    })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: 'crawler offline' })
  }
}
