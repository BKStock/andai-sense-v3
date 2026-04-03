'use client';
import { useCountUp, useLiveFeed } from '@/lib/hooks';
import { companies, signalColors, urgencyColors } from '@/lib/mock-data';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

function Radar() {
  const blips = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 70,
    y: 50 + (Math.random() - 0.5) * 70,
    delay: Math.random() * 2,
    size: 2 + Math.random() * 3,
  }));

  return (
    <div style={{ position: 'relative', width: '100%', height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 200 200" style={{ width: 260, height: 260 }}>
        {/* Concentric rings */}
        {[80, 60, 40, 20].map((r, i) => (
          <circle key={i} cx="100" cy="100" r={r} fill="none" stroke="var(--cyan-300)"
            strokeWidth="0.5" opacity={0.12 + i * 0.04} />
        ))}
        {/* Outer pulsing ring */}
        <circle cx="100" cy="100" r="82" fill="none" stroke="var(--cyan-300)"
          strokeWidth="1" opacity="0.3" className="animate-pulse-slow" />
        {/* Cross lines */}
        <line x1="100" y1="18" x2="100" y2="182" stroke="var(--cyan-300)" strokeWidth="0.3" opacity="0.15" />
        <line x1="18" y1="100" x2="182" y2="100" stroke="var(--cyan-300)" strokeWidth="0.3" opacity="0.15" />
        {/* Sweep line */}
        <g className="animate-radar-sweep" style={{ transformOrigin: '100px 100px' }}>
          <defs>
            <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--cyan-300)" stopOpacity="0" />
              <stop offset="100%" stopColor="var(--cyan-300)" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <line x1="100" y1="100" x2="100" y2="18" stroke="url(#sweepGrad)" strokeWidth="2" />
          <path d="M 100 100 L 95 22 A 80 80 0 0 1 100 18 Z" fill="var(--cyan-300)" opacity="0.08" />
        </g>
        {/* Blip dots */}
        {blips.map(b => (
          <circle key={b.id} cx={b.x * 2} cy={b.y * 2} r={b.size} fill="var(--cyan-300)"
            className="animate-blip" style={{ animationDelay: `${b.delay}s` }} />
        ))}
        {/* Center dot */}
        <circle cx="100" cy="100" r="3" fill="var(--cyan-300)" />
      </svg>
      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
        letterSpacing: '0.15em', textTransform: 'uppercase',
      }}>
        RADAR ACTIVE
      </div>
    </div>
  );
}

function StatCard({ value, label, color, glow }: { value: number; label: string; color: string; glow?: boolean }) {
  const count = useCountUp(value);
  const formatted = value > 1000 ? count.toLocaleString() : count;
  return (
    <div className="card" style={{
      padding: '20px 24px',
      boxShadow: glow ? `0 0 20px rgba(255,59,59,0.4), var(--shadow-card)` : 'var(--shadow-card)',
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>
        {formatted}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
}

function LiveFeed() {
  const { signals, setIsPaused } = useLiveFeed();

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        height: 500,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <div style={{
        fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
        padding: '0 0 8px', letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>
        LIVE SIGNALS
      </div>
      {signals.map((s, i) => (
        <motion.div
          key={s.id}
          initial={i === 0 ? { opacity: 0, y: -10 } : false}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 0',
            borderBottom: '1px solid var(--border-default)',
            fontSize: 12,
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 11, flexShrink: 0 }}>
            {s.timestamp}
          </span>
          <span style={{ color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
            {s.company}
          </span>
          <span style={{
            fontSize: 10, padding: '2px 6px', borderRadius: 4,
            background: `${signalColors[s.signal] || '#8896B3'}20`,
            color: signalColors[s.signal] || '#8896B3',
            fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {s.signal}
          </span>
          <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            {Array.from({ length: 5 }, (_, j) => (
              <div key={j} style={{
                width: 3, height: 12,
                background: j < s.severity ? (signalColors[s.signal] || '#8896B3') : 'var(--bg-raised)',
                borderRadius: 1,
              }} />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function DashboardHome() {
  const sorted = [...companies].sort((a, b) => b.score - a.score);

  return (
    <div>
      {/* Hero */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <Radar />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <StatCard value={127} label="Alerts Today" color="var(--cyan-300)" />
          <StatCard value={8} label="Urgent Cases" color="var(--red)" glow />
          <StatCard value={45821} label="Entities" color="var(--cyan-300)" />
          <StatCard value={1847} label="Signals" color="var(--cyan-300)" />
        </div>
      </div>

      {/* Urgent Banner */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        style={{
          background: 'rgba(255, 59, 59, 0.12)',
          border: '1px solid rgba(255, 59, 59, 0.3)',
          borderRadius: 12,
          padding: '14px 24px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14 }}>🔴</span>
          <span style={{ color: 'var(--red)', fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>URGENT</span>
          <span style={{ color: 'var(--text-primary)', fontSize: 14 }}>有限会社田中建設（愛知）</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Sell Probability: <strong style={{ color: 'var(--red)' }}>92%</strong></span>
        </div>
        <Link href="/companies/1" style={{ color: 'var(--red)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
          View <ArrowRight size={14} />
        </Link>
      </motion.div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '62% 38%', gap: 24 }}>
        {/* Company Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-default)',
            fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            Company Intelligence
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                {['RANK', 'COMPANY', 'SECTOR', 'PREF', 'SCORE', 'URGENCY', 'VALUE'].map(h => (
                  <th key={h} style={{
                    padding: '10px 12px', textAlign: 'left', fontSize: 10,
                    fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
                    letterSpacing: '0.1em', fontWeight: 500,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.3 }}
                  className="row-shimmer"
                  style={{
                    borderLeft: `3px solid ${urgencyColors[c.urgency]}`,
                    borderBottom: '1px solid var(--border-default)',
                    cursor: 'pointer',
                    transition: 'background 200ms',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-primary)' }}>
                    <Link href={`/companies/${c.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{c.name}</Link>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{c.sector}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{c.prefecture}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: c.score >= 85 ? 'var(--red)' : c.score >= 70 ? 'var(--amber)' : 'var(--cyan-300)' }}>{c.score}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      fontSize: 10, padding: '3px 8px', borderRadius: 12,
                      background: `${urgencyColors[c.urgency]}15`,
                      color: urgencyColors[c.urgency],
                      fontFamily: 'var(--font-mono)', fontWeight: 600,
                    }}>{c.urgency}</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{c.value}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Live Feed */}
        <div className="card" style={{ padding: '16px 20px' }}>
          <LiveFeed />
        </div>
      </div>

      {/* AI Insight */}
      <div className="card" style={{ marginTop: 24, padding: '20px 24px', borderLeft: '4px solid var(--amber)' }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--amber)', letterSpacing: '0.1em', marginBottom: 8 }}>AI INSIGHT</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          本日のポートフォリオ分析: 愛知県建設セクターで異常なシグナル集中を検知。田中建設（スコア92）と林建設工業（スコア89）が同時にCRITICALに到達。
          両社とも税金滞納シグナルが発生しており、地域的な経済要因の可能性あり。緊急対応を推奨します。
        </div>
      </div>
    </div>
  );
}
