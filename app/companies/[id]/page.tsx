'use client';
import { useParams } from 'next/navigation';
import { companies, signalColors, signalLabels, urgencyColors } from '@/lib/mock-data';
import { useCountUp } from '@/lib/hooks';
import { motion } from 'framer-motion';
import { Phone, Mail, Globe, Copy, MessageSquare } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

export default function CompanyDetail() {
  const params = useParams();
  const id = Number(params.id);
  const company = companies.find(c => c.id === id) || companies[0];

  const revenueData = company.revenue.map((v, i) => ({
    year: `${2020 + i}`,
    revenue: v,
  }));

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
      <div style={{ marginBottom: 24 }}>
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

      {/* 3-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 280px', gap: 24, marginBottom: 24 }}>
        {/* LEFT: Score + Urgency */}
        <div>
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <ScoreRing score={company.score} />
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 12 }}>
              SIGNAL BREAKDOWN
            </div>
            {company.signals.map(s => (
              <div key={s} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: signalColors[s], fontFamily: 'var(--font-mono)' }}>{s}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{Math.floor(Math.random() * 40 + 60)}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg-raised)', borderRadius: 2 }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.floor(Math.random() * 40 + 60)}%` }}
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
            {/* Vertical line */}
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
                {/* Node */}
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
                <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
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
    </div>
  );
}
