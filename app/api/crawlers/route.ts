import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('http://localhost:8002/api/crawlers/status', { cache: 'no-store' })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: 'crawler offline', recent_runs: [], total_companies: 0 })
  }
}

export async function POST() {
  try {
    const res = await fetch('http://localhost:8002/api/crawlers/run-all', { method: 'POST' })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: 'crawler offline' })
  }
}
