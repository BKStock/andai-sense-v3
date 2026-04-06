import { NextResponse } from 'next/server';

interface CompanyData {
  name: string;
  sector: string;
  prefecture: string;
  score: number;
  urgency: string;
  signals: string[];
  revenue: number[];
}

const SIGNAL_LABELS: Record<string, string> = {
  TAX_DELINQUENT: '税金滞納',
  CEO_CHANGE: '代表変更',
  HIRING_FREEZE: '採用凍結',
  PATENT_LAPSED: '特許失効',
  DOMAIN_EXPIRING: 'ドメイン期限切れ',
  NEGATIVE_SENTIMENT: 'ネガティブ評判',
  MASS_RESIGNATION: '大量退職',
  BANKRUPTCY_ADJACENT: '倒産隣接',
  REVENUE_DECLINE: '売上減少',
  LISTED_ON_BATONZ: 'バトンズ掲載',
  OFFICE_CLOSURE: '事務所閉鎖',
  POST_FREQ_DROP: '情報発信頻度低下',
};

export async function POST(request: Request) {
  const body = (await request.json()) as { company?: CompanyData };
  const { company } = body;

  if (!company?.name || !Array.isArray(company.signals) || !Array.isArray(company.revenue)) {
    return NextResponse.json({ error: 'Invalid company data' }, { status: 400 });
  }

  const signalJa = company.signals.map(s => SIGNAL_LABELS[s] || s).join('、');
  const revenueStartYear = new Date().getFullYear() - company.revenue.length + 1;
  const revenueStr = company.revenue.map((v, i) => `${revenueStartYear + i}年: ${v}百万円`).join('、');
  const revTrend = company.revenue[company.revenue.length - 1] < company.revenue[0] ? '減少傾向' : '増加傾向';

  const prompt = `あなたは日本のM&Aアドバイザーです。以下の企業情報を分析し、2段落の日本語ビジネスサマリーを作成してください。余計な前置きや説明なしに、そのまま2段落を出力してください。

企業名: ${company.name}
セクター: ${company.sector}
所在地: ${company.prefecture}
M&Aスコア: ${company.score}/100
緊急度: ${company.urgency}
検知シグナル: ${signalJa}
売上推移: ${revenueStr}（${revTrend}）

第1段落：現在の企業状況と財務健全性（売上推移・シグナルに基づく）
第2段落：M&A対象としての魅力、潜在的リスク、推奨アクション`;

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen3-bk:30b',
        prompt,
        stream: false,
        options: { temperature: 0.7, num_predict: 512 },
      }),
      signal: AbortSignal.timeout(90_000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Ollama API error' }, { status: 502 });
    }

    const data = (await response.json()) as { response?: string };
    if (!data.response) {
      return NextResponse.json({ error: 'Invalid Ollama response' }, { status: 502 });
    }
    return NextResponse.json({ summary: data.response });
  } catch (error) {
    console.error('[AI company-summary]', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 });
  }
}
