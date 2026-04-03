'use client';
import { useState } from 'react';
import { crawlers } from '@/lib/mock-data';
import { motion } from 'framer-motion';
import { Settings, Plus, Zap } from 'lucide-react';
import { useCountUp } from '@/lib/hooks';

const statusConfig = {
  active: { icon: '●', color: 'var(--green)', label: 'Active' },
  warning: { icon: '⚠', color: 'var(--amber)', label: 'Warning' },
  error: { icon: '✗', color: 'var(--red)', label: 'Error' },
  paused: { icon: '⏸', color: 'var(--text-muted)', label: 'Paused' },
};

function StatFooter({ value, label, color }: { value: number; label: string; color: string }) {
  const count = useCountUp(value);
  return (
    <div className="card" style={{ padding: 16, textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color }}>{count}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function CrawlerControl() {
  const [url, setUrl] = useState('');
  const [interval, setInterval] = useState('1h');
  const [aiAnalyze, setAiAnalyze] = useState(true);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Settings size={20} style={{ color: 'var(--cyan-300)' }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>クローラーコントロール</h1>
      </div>

      {/* Add Crawler Form */}
      <div className="card" style={{
        padding: 20, marginBottom: 24,
        position: 'sticky', top: 48, zIndex: 20,
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="クロール対象のURLを入力..."
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 8,
              background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
              color: 'var(--text-primary)', fontSize: 14, outline: 'none',
            }}
          />
          <select
            value={interval}
            onChange={e => setInterval(e.target.value)}
            style={{
              padding: '10px 14px', borderRadius: 8,
              background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
              color: 'var(--text-primary)', fontSize: 13, outline: 'none',
            }}
          >
            <option value="30m">30分</option>
            <option value="1h">1時間</option>
            <option value="6h">6時間</option>
            <option value="24h">24時間</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={aiAnalyze} onChange={e => setAiAnalyze(e.target.checked)} style={{ accentColor: 'var(--cyan-300)' }} />
            AI分析
          </label>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8,
            background: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.2)',
            color: 'var(--cyan-300)', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            <Plus size={14} /> 追加
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8,
            background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)',
            color: '#8B5CF6', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            <Zap size={14} /> AI分析
          </button>
        </div>
      </div>

      {/* Status Table */}
      <div className="card" style={{ overflow: 'hidden', marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
              {['URL', 'ステータス', '最終実行', '次回実行', 'シグナル数'].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left', fontSize: 10,
                  fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
                  letterSpacing: '0.1em', fontWeight: 500,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {crawlers.map((c, i) => {
              const st = statusConfig[c.status];
              return (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{ borderBottom: '1px solid var(--border-default)' }}
                >
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--cyan-300)', fontFamily: 'var(--font-mono)' }}>
                    {c.url.replace('https://', '').replace('http://', '')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: st.color }}>
                      <span style={{ fontSize: 14 }}>{st.icon}</span>
                      {st.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{c.lastRun}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{c.nextRun}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 600, color: c.signals > 20 ? 'var(--amber)' : 'var(--text-secondary)' }}>{c.signals}</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatFooter value={5} label="アクティブ" color="var(--green)" />
        <StatFooter value={1} label="エラー" color="var(--red)" />
        <StatFooter value={138} label="今日のシグナル" color="var(--cyan-300)" />
        <StatFooter value={2847} label="処理済みURL" color="var(--text-secondary)" />
      </div>
    </div>
  );
}
