'use client';
import { useParams } from 'next/navigation';
import { companies, signalColors, signalLabels, urgencyColors } from '@/lib/mock-data';
import { useCountUp } from '@/lib/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, Globe, Copy, MessageSquare, Sparkles, FileText, X, TrendingUp, TrendingDown } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, LineChart, Line,
} from 'recharts';
import { useState, useCallback, useMemo } from 'react';

// Deterministic "random" for signal strength bars (avoids Math.random in render)
function signalHash(signal: string, companyId: number): number {
  let h = companyId * 31;
  for (let i = 0; i < signal.length; i++) h = (h * 31 + signal.charCodeAt(i)) | 0;
  return 60 + (Math.abs(h) % 40);
}

// --- Score factors computed from company signals ---
function computeScoreFactors(score: number, signals: string[]) {
  const hasSignal = (s: string) => signals.includes(s);

  let financial = 30;
  if (hasSignal('REVENUE_DECLINE')) financial -= 10;
  if (hasSignal('BANKRUPTCY_ADJACENT')) financial -= 12;
  if (hasSignal('TAX_DELINQUENT')) financial -= 8;
  financial = Math.max(5, financial);

  let ownership = 20;
  if (hasSignal('CEO_CHANGE')) ownership -= 8;
  if (hasSignal('MASS_RESIGNATION')) ownership -= 10;
  ownership = Math.max(2, ownership);

  let market = 20;
  if (hasSignal('NEGATIVE_SENTIMENT')) market -= 8;
  if (hasSignal('PATENT_LAPSED')) market -= 6;
  if (hasSignal('LISTED_ON_BATONZ')) market -= 4;
  market = Math.max(2, market);

  let growth = 15;
  if (hasSignal('HIRING_FREEZE')) growth -= 6;
  if (hasSignal('POST_FREQ_DROP')) growth -= 4;
  growth = Math.max(2, growth);

  let readiness = 15;
  if (hasSignal('DOMAIN_EXPIRING')) readiness -= 3;
  if (hasSignal('OFFICE_CLOSURE')) readiness -= 5;
  readiness = Math.max(2, readiness);

  // Normalize to match total score
  const rawTotal = financial + ownership + market + growth + readiness;
  const ratio = score / rawTotal;
  return [
    { factor: '財務健全性', value: Math.round(financial * ratio), max: 30, color: '#FF3B3B' },
    { factor: 'オーナー安定', value: Math.round(ownership * ratio), max: 20, color: '#FFB800' },
    { factor: '市場ポジション', value: Math.round(market * ratio), max: 20, color: '#00E5FF' },
    { factor: '成長軌道', value: Math.round(growth * ratio), max: 15, color: '#00FF88' },
    { factor: 'M&A準備度', value: Math.round(readiness * ratio), max: 15, color: '#8B5CF6' },
  ];
}

// --- Generate mock 30-day score history ---
function generateScoreHistory(currentScore: number) {
  const days: { day: string; score: number }[] = [];
  const startScore = Math.max(10, currentScore - 15 + Math.round(Math.random() * 30 - 15));
  for (let i = 29; i >= 0; i--) {
    const progress = (29 - i) / 29;
    const noise = (Math.random() - 0.5) * 6;
    const score = Math.round(startScore + (currentScore - startScore) * progress + noise);
    days.push({ day: `${30 - i}d`, score: Math.min(100, Math.max(0, score)) });
  }
  return days;
}

// --- ScoreRing ---
function ScoreRing({ score }: { score: number }) {
  const count = useCountUp(score);
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 16px' }}>
      <svg viewBox="0 0 120 120" style={{ width: 140, height: 140 }}>
        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-raised)" strokeWidth="8" />
        <motion.circle
          cx="60" cy="60" r="52" fill="none"
          stroke={score >= 85 ? 'var(--red)' : score >= 70 ? 'var(--amber)' : 'var(--cyan-300)'}
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 700, color: 'var(--text-primary)' }}>{count}</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SCORE</span>
      </div>
    </div>
  );
}

// --- ScoreVelocity ---
function ScoreVelocity({ score }: { score: number }) {
  const history = generateScoreHistory(score);
  const firstScore = history[0].score;
  const delta = score - firstScore;
  const isUp = delta >= 0;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
          SCORE VELOCITY
        </span>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)',
          color: isUp ? 'var(--green)' : 'var(--red)',
        }}>
          {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {isUp ? '+' : ''}{delta}pts 今月
        </span>
      </div>
      <ResponsiveContainer width="100%" height={48}>
        <LineChart data={history}>
          <Line
            type="monotone" dataKey="score"
            stroke={isUp ? 'var(--green)' : 'var(--red)'}
            strokeWidth={1.5} dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- MultiFactorBreakdown ---
function MultiFactorBreakdown({ score, signals }: { score: number; signals: string[] }) {
  const factors = computeScoreFactors(score, signals);
  const radarData = factors.map(f => ({ factor: f.factor, value: f.value, max: f.max }));

  return (
    <div className="card" style={{ padding: 24, marginTop: 24 }}>
      <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 20 }}>
        MULTI-FACTOR SCORE BREAKDOWN
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Radar Chart */}
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="var(--border-default)" />
            <PolarAngleAxis
              dataKey="factor"
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            />
            <Radar
              name="スコア"
              dataKey="value"
              stroke="var(--cyan-300)"
              fill="var(--cyan-300)"
              fillOpacity={0.2}
              strokeWidth={1.5}
            />
          </RadarChart>
        </ResponsiveContainer>

        {/* Factor Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
          {factors.map(f => (
            <div key={f.factor}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-noto)' }}>{f.factor}</span>
                <span style={{ color: f.color, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {f.value} / {f.max}
                </span>
              </div>
              <div style={{ height: 4, background: 'var(--bg-raised)', borderRadius: 2 }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(f.value / f.max) * 100}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  style={{ height: '100%', background: f.color, borderRadius: 2 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- AI Summary Section ---
function AISummarySection({ company }: { company: ReturnType<typeof companies['find']> }) {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const generate = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    setError('');
    setSummary('');
    try {
      const res = await fetch('/api/ai/company-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company }),
      });
      const data = (await res.json()) as { summary?: string; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? 'AI分析に失敗しました');
      } else {
        setSummary(data.summary ?? '');
      }
    } catch {
      setError('AIサービスに接続できませんでした');
    } finally {
      setLoading(false);
    }
  }, [company]);

  return (
    <div className="card" style={{ padding: 24, marginTop: 24, borderLeft: '4px solid var(--cyan-300)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--cyan-300)', letterSpacing: '0.1em' }}>
          AI COMPANY ANALYSIS
        </div>
        <button
          onClick={generate}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 8,
            background: loading ? 'var(--bg-raised)' : 'rgba(0,229,255,0.1)',
            border: '1px solid var(--cyan-300)',
            color: loading ? 'var(--text-muted)' : 'var(--cyan-300)',
            fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 200ms',
          }}
        >
          <Sparkles size={14} />
          {loading ? 'AI分析中...' : 'AI分析を生成'}
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              height: 16, borderRadius: 4,
              background: 'linear-gradient(90deg, var(--bg-raised) 25%, var(--bg-overlay) 50%, var(--bg-raised) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              width: i === 3 ? '60%' : '100%',
            }} />
          ))}
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 8,
          background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.3)',
          color: 'var(--red)', fontSize: 13,
        }}>
          ⚠ {error}
        </div>
      )}

      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, fontFamily: 'var(--font-noto)', whiteSpace: 'pre-wrap' }}
        >
          {summary}
        </motion.div>
      )}

      {!loading && !error && !summary && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          ボタンをクリックして、Ollama / Qwen3によるAI企業分析を生成してください。
        </div>
      )}
    </div>
  );
}

// --- Deal Thesis Modal ---
function DealThesisModal({
  company,
  onClose,
}: {
  company: ReturnType<typeof companies['find']>;
  onClose: () => void;
}) {
  const [thesis, setThesis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const generate = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    setError('');
    setThesis('');
    try {
      const res = await fetch('/api/ai/deal-thesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company }),
      });
      const data = (await res.json()) as { thesis?: string; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? 'ディールサマリー生成に失敗しました');
      } else {
        setThesis(data.thesis ?? '');
      }
    } catch {
      setError('AIサービスに接続できませんでした');
    } finally {
      setLoading(false);
    }
  }, [company]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderLeft: '4px solid var(--amber)',
          borderRadius: 16,
          width: '100%', maxWidth: 680,
          maxHeight: '80vh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--amber)', letterSpacing: '0.1em', marginBottom: 4 }}>
              DEAL THESIS GENERATOR
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              {company?.name}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={generate}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 8,
                background: loading ? 'var(--bg-raised)' : 'rgba(255,184,0,0.1)',
                border: '1px solid var(--amber)',
                color: loading ? 'var(--text-muted)' : 'var(--amber)',
                fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              <FileText size={14} />
              {loading ? '生成中...' : 'ディールサマリー生成'}
            </button>
            <button
              onClick={onClose}
              style={{
                width: 36, height: 36, borderRadius: 8,
                background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
                color: 'var(--text-muted)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i}>
                  <div style={{ height: 14, width: '30%', borderRadius: 4, background: 'var(--bg-raised)', marginBottom: 8 }} />
                  <div style={{ height: 12, borderRadius: 4, background: 'var(--bg-raised)', marginBottom: 4 }} />
                  <div style={{ height: 12, width: '80%', borderRadius: 4, background: 'var(--bg-raised)' }} />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: 8,
              background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.3)',
              color: 'var(--red)', fontSize: 13,
            }}>
              ⚠ {error}
            </div>
          )}

          {thesis && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8,
                fontFamily: 'var(--font-noto)', whiteSpace: 'pre-wrap',
              }}
            >
              {thesis}
            </motion.div>
          )}

          {!loading && !error && !thesis && (
            <div style={{ textAlign: 'center', padding: '40px 24px' }}>
              <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'var(--font-noto)' }}>
                「ディールサマリー生成」をクリックして、AI投資メモを自動生成します
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                投資根拠・シナジー仮説・リスク・バリュエーション・次のステップを生成
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// --- Main Page ---
export default function CompanyDetail() {
  const params = useParams();
  const id = Number(params.id);
  const company = companies.find(c => c.id === id) ?? companies[0];
  const [thesisOpen, setThesisOpen] = useState(false);

  const revenueData = company.revenue.map((v, i) => ({
    year: `${2020 + i}`,
    revenue: v,
  }));

  // Signal strengths: deterministic per company+signal (no Math.random in render)
  const signalStrengths = useMemo(
    () => Object.fromEntries(company.signals.map(s => [s, signalHash(s, company.id)])),
    [company.signals, company.id]
  );

  const timelineEvents = [
    { date: '2024-03-28', signal: company.signals[0] || 'CEO_CHANGE', detail: `${company.name}で${signalLabels[company.signals[0]] || 'シグナル'}を検知。直ちにスコア更新を実行しました。` },
    { date: '2024-03-25', signal: company.signals[1] || 'REVENUE_DECLINE', detail: '四半期報告書の分析結果から、売上減少傾向を確認。市場動向との相関分析を実施中。' },
    { date: '2024-03-20', signal: 'DOMAIN_EXPIRING', detail: 'ドメイン更新期限の接近を検知。事業継続意思の低下指標として記録。' },
    { date: '2024-03-15', signal: 'POST_FREQ_DROP', detail: '公式サイトおよびSNSの更新頻度が過去3ヶ月で60%低下。活動停滞の兆候。' },
    { date: '2024-03-10', signal: 'NEGATIVE_SENTIMENT', detail: '口コミサイトでネガティブレビューが増加。顧客満足度の低下を示唆。' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>{company.name}</h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{company.sector}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>·</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{company.prefecture}</span>
            <span style={{
              fontSize: 10, padding: '3px 10px', borderRadius: 12,
              background: `${urgencyColors[company.urgency]}15`,
              color: urgencyColors[company.urgency],
              fontFamily: 'var(--font-mono)', fontWeight: 600,
            }}>{company.urgency}</span>
          </div>
        </div>
        {/* Deal Thesis Button */}
        <button
          onClick={() => setThesisOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10,
            background: 'rgba(255,184,0,0.1)',
            border: '1px solid var(--amber)',
            color: 'var(--amber)',
            fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)',
            cursor: 'pointer', transition: 'all 200ms',
          }}
        >
          <FileText size={15} />
          ディールサマリー生成
        </button>
      </div>

      {/* 3-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 280px', gap: 24, marginBottom: 24 }}>
        {/* LEFT: Score + Velocity + Signals */}
        <div>
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <ScoreRing score={company.score} />
            <ScoreVelocity score={company.score} />
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 12 }}>
              SIGNAL BREAKDOWN
            </div>
            {company.signals.map(s => (
              <div key={s} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: signalColors[s], fontFamily: 'var(--font-mono)' }}>{s}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{signalStrengths[s] ?? 70}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg-raised)', borderRadius: 2 }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${signalStrengths[s] ?? 70}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    style={{ height: '100%', background: signalColors[s], borderRadius: 2 }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button style={{
            width: '100%', padding: '14px 0', borderRadius: 10,
            background: 'var(--cyan-300)', color: 'var(--bg-void)',
            fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer',
          }}>
            <MessageSquare size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            コンタクト
          </button>
        </div>

        {/* CENTER: Timeline */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 20 }}>
            SIGNAL TIMELINE
          </div>
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            <div style={{
              position: 'absolute', left: 7, top: 4, bottom: 4, width: 2,
              background: 'var(--border-default)',
            }} />
            {timelineEvents.map((ev, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                style={{ marginBottom: 24, position: 'relative' }}
              >
                <div style={{
                  position: 'absolute', left: -20, top: 4,
                  width: 14, height: 14, borderRadius: '50%',
                  background: signalColors[ev.signal] || 'var(--cyan-300)',
                  border: '3px solid var(--bg-surface)',
                }} />
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 4 }}>{ev.date}</div>
                <span style={{
                  fontSize: 10, padding: '2px 6px', borderRadius: 4,
                  background: `${signalColors[ev.signal] || '#8896B3'}20`,
                  color: signalColors[ev.signal] || '#8896B3',
                  fontFamily: 'var(--font-mono)',
                }}>{ev.signal}</span>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6 }}>{ev.detail}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* RIGHT: Contact + AI */}
        <div>
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 16 }}>
              CONTACT INFO
            </div>
            {[
              { icon: Phone, label: company.phone },
              { icon: Mail, label: company.email },
              { icon: Globe, label: company.web },
            ].map(({ icon: Icon, label }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                <Icon size={14} style={{ color: 'var(--cyan-300)', flexShrink: 0 }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--amber)', letterSpacing: '0.1em' }}>
                AI推奨オープナー
              </div>
              <Copy size={14} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              「{company.name}の{company.sector}分野における実績を拝見し、大変感銘を受けました。
              昨今の業界動向を踏まえ、御社の今後の事業戦略について、お力添えできることがあるのではないかと考えております。
              ぜひ一度、お時間をいただけませんでしょうか。」
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 20 }}>
          REVENUE TREND (百万円)
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.08)" />
            <XAxis dataKey="year" stroke="#3D4F6E" fontSize={11} tickLine={false} />
            <YAxis stroke="#3D4F6E" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#0A1428', border: '1px solid rgba(0,229,255,0.12)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#8896B3' }}
            />
            <Area type="monotone" dataKey="revenue" stroke="#00E5FF" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 16, padding: '16px 0', borderTop: '1px solid var(--border-default)' }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--amber)', letterSpacing: '0.1em', marginBottom: 8 }}>AI ANALYSIS</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            過去5年間の売上推移は下降傾向にあり、2024年は最低値を記録。特に直近2年間の減少率が加速しており、
            事業継続への意欲低下が推測されます。{company.sector}業界の市場環境悪化と合わせ、M&A対象としての妥当性は高いと判断します。
          </div>
        </div>
      </div>

      {/* Multi-Factor Score Breakdown (#29) */}
      <MultiFactorBreakdown score={company.score} signals={company.signals} />

      {/* AI Company Summary (#17) */}
      <AISummarySection company={company} />

      {/* Deal Thesis Modal (#20) */}
      <AnimatePresence>
        {thesisOpen && (
          <DealThesisModal company={company} onClose={() => setThesisOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
