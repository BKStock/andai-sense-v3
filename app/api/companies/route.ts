import { NextResponse } from 'next/server'
import { BACKEND_BASE } from '@/lib/config'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawLimit = parseInt(searchParams.get('limit') ?? '50', 10)
  const rawMinScore = parseInt(searchParams.get('min_score') ?? '0', 10)
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 500) : 50
  const minScore = Number.isFinite(rawMinScore) ? Math.max(rawMinScore, 0) : 0

  try {
    const res = await fetch(`${BACKEND_BASE}/api/companies?limit=${limit}&min_score=${minScore}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    // フォールバック: モックデータ
    return NextResponse.json({ companies: [], total: 0, error: 'crawler offline' })
  }
}
