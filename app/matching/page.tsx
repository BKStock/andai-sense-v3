'use client';
import { useState } from 'react';
import { companies, urgencyColors } from '@/lib/mock-data';
import { useCountUp } from '@/lib/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Zap } from 'lucide-react';

interface MatchResult {
  company: typeof companies[0];
  score: number;
  reasons: string[];
}

function MatchCard({ match, index }: { match: MatchResult; index: number }) {
  const count = useCountUp(match.score);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.15, duration: 0.4 }}
      className="card"
      style={{ padding: 24 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{match.company.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{match.company.sector} · {match.company.prefecture}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 700, color: match.score >= 85 ? 'var(--green)' : 'var(--cyan-300)' }}>
            {count}%
          </div>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>MATCH</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {match.reasons.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--green)' }}>✓</span>
            {r}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        {match.company.signals.slice(0, 3).map(s => (
          <span key={s} style={{
            fontSize: 9, padding: '2px 6px', borderRadius: 4,
            background: 'rgba(0, 229, 255, 0.1)', color: 'var(--cyan-300)',
            fontFamily: 'var(--font-mono)',
          }}>{s}</span>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
        企業価値: <span style={{ color: 'var(--text-primary)' }}>{match.company.value}</span>
      </div>
    </motion.div>
  );
}

export default function Matching() {
  const [showResults, setShowResults] = useState(false);
  const [form, setForm] = useState({
    sector: '建設',
    budget: '10億円以下',
    region: '愛知',
    scale: '中小企業',
    priority: 'スコア優先',
  });

  const matchResults: MatchResult[] = [
    { company: companies[0], score: 94, reasons: ['同業種（建設）', '予算範囲内（¥8.2億）', '地域一致（愛知）', 'CRITICALスコア（92pt）'] },
    { company: companies[13], score: 87, reasons: ['同業種（建設）', '高スコア（89pt）', 'CRITICAL緊急度'] },
    { company: companies[7], score: 78, reasons: ['地域一致（愛知）', '予算範囲内（¥9.3億）', '金属加工関連'] },
    { company: companies[6], score: 72, reasons: ['CRITICAL緊急度', '予算範囲内（¥6.5億）', '印刷→建設 転用可能設備'] },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Target size={20} style={{ color: 'var(--cyan-300)' }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>マッチング</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', gap: 24 }}>
        {/* LEFT: Form */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 20 }}>
            BUYER PROFILE
          </div>
          {[
            { label: '業種', key: 'sector', options: ['建設', '製造', '食品', 'IT', '商社', '全て'] },
            { label: '予算', key: 'budget', options: ['5億円以下', '10億円以下', '20億円以下', '50億円以下'] },
            { label: '地域', key: 'region', options: ['愛知', '東京', '大阪', '全国'] },
            { label: '希望規模', key: 'scale', options: ['中小企業', '中堅企業', '指定なし'] },
            { label: '優先条件', key: 'priority', options: ['スコア優先', '価格優先', '地域優先'] },
          ].map(({ label, key, options }) => (
            <div key={key} style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</label>
              <select
                value={form[key as keyof typeof form]}
                onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                }}
              >
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowResults(true)}
            style={{
              width: '100%', padding: '16px 0', borderRadius: 10,
              background: 'linear-gradient(135deg, var(--cyan-400), var(--cyan-500))',
              color: 'var(--bg-void)', fontWeight: 700, fontSize: 15,
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: 'var(--glow-cyan-md)',
            }}
          >
            <Zap size={18} />
            マッチング実行
          </motion.button>
        </div>

        {/* RIGHT: Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AnimatePresence>
            {showResults ? (
              matchResults.map((m, i) => <MatchCard key={m.company.id} match={m} index={i} />)
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: 300, color: 'var(--text-muted)', fontSize: 14,
                }}
              >
                左のフォームに条件を入力し、「マッチング実行」をクリックしてください
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
