'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Play, Pause, RefreshCw, Globe, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface Crawler {
  id: number;
  name: string;
  url: string;
  type: string;
  status: 'running' | 'paused' | 'error' | 'idle';
  lastRun: string;
  signalsFound: number;
  interval: string;
}

const initialCrawlers: Crawler[] = [
  { id: 1, name: '国税庁 滞納公告', url: 'https://www.nta.go.jp/', type: '税務', status: 'running', lastRun: '5分前', signalsFound: 23, interval: '毎時' },
  { id: 2, name: 'バトンズ 事業売却', url: 'https://batonz.jp/', type: 'M&A市場', status: 'running', lastRun: '12分前', signalsFound: 8, interval: '30分毎' },
  { id: 3, name: '東京商工リサーチ', url: 'https://www.tsr-net.co.jp/', type: '信用情報', status: 'paused', lastRun: '2時間前', signalsFound: 45, interval: '日次' },
  { id: 4, name: 'Indeed 採用中止検知', url: 'https://jp.indeed.com/', type: '採用動向', status: 'running', lastRun: '28分前', signalsFound: 12, interval: '2時間毎' },
  { id: 5, name: 'Google Map レビュー', url: 'https://maps.google.com/', type: 'センチメント', status: 'error', lastRun: '6時間前', signalsFound: 0, interval: '日次' },
  { id: 6, name: 'J-PlatPat 特許情報', url: 'https://j-platpat.inpit.go.jp/', type: '特許', status: 'idle', lastRun: '1日前', signalsFound: 7, interval: '週次' },
];

const statusColor: Record<Crawler['status'], string> = {
  running: 'var(--green)',
  paused: 'var(--amber)',
  error: 'var(--red)',
  idle: 'var(--text-muted)',
};

const statusLabel: Record<Crawler['status'], string> = {
  running: '稼働中',
  paused: '一時停止',
  error: 'エラー',
  idle: '待機中',
};

const statusIcon: Record<Crawler['status'], React.ReactNode> = {
  running: <RefreshCw size={12} style={{ animation: 'spin 2s linear infinite' }} />,
  paused: <Pause size={12} />,
  error: <AlertCircle size={12} />,
  idle: <Clock size={12} />,
};

export default function CrawlersPage() {
  const [crawlers, setCrawlers] = useState<Crawler[]>(initialCrawlers);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState('');
  const [newInterval, setNewInterval] = useState('日次');

  const totalSignals = crawlers.reduce((a, c) => a + c.signalsFound, 0);
  const runningCount = crawlers.filter(c => c.status === 'running').length;
  const errorCount = crawlers.filter(c => c.status === 'error').length;

  const toggleStatus = (id: number) => {
    setCrawlers(prev => prev.map(c => {
      if (c.id !== id) return c;
      return { ...c, status: c.status === 'running' ? 'paused' : 'running' };
    }));
  };

  const addCrawler = () => {
    if (!newName || !newUrl) return;
    setCrawlers(prev => [...prev, {
      id: Date.now(), name: newName, url: newUrl, type: newType || '汎用',
      status: 'idle', lastRun: '未実行', signalsFound: 0, interval: newInterval,
    }]);
    setNewName(''); setNewUrl(''); setNewType(''); setShowAdd(false);
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: '22px', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>
            クローラー管理
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            データ収集エンジン
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '9px 16px', borderRadius: '8px', cursor: 'pointer',
            background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.3)',
            color: 'var(--cyan)', fontSize: '12px', fontWeight: 600,
          }}
        >
          <Plus size={13} /> 追加
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: '総クローラー', value: crawlers.length, color: 'var(--cyan)' },
          { label: '稼働中', value: runningCount, color: 'var(--green)' },
          { label: 'エラー', value: errorCount, color: 'var(--red)' },
          { label: '検出シグナル総計', value: totalSignals, color: 'var(--amber)' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            borderRadius: '10px', padding: '14px',
          }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              {stat.label}
            </div>
            <div style={{
              fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-jetbrains-mono)',
              color: stat.color,
            }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: 'var(--bg-surface)', border: '1px solid rgba(0,229,255,0.25)',
              borderRadius: '12px', padding: '20px', overflow: 'hidden',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              クローラー追加
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>名称</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="クローラー名" style={{ width: '100%', background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: '6px', padding: '8px 10px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>URL</label>
                <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: '6px', padding: '8px 10px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>種別</label>
                <input value={newType} onChange={e => setNewType(e.target.value)} placeholder="税務・採用など" style={{ width: '100%', background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: '6px', padding: '8px 10px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <button onClick={addCrawler} style={{ padding: '9px 16px', borderRadius: '6px', cursor: 'pointer', background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.3)', color: 'var(--cyan)', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                追加
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-raised)' }}>
              {['名称', 'URL', '種別', 'ステータス', '最終実行', 'シグナル数', '間隔', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {crawlers.map((crawler, i) => (
              <motion.tr
                key={crawler.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                style={{ borderBottom: '1px solid rgba(0,229,255,0.05)' }}
              >
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={13} color="var(--text-muted)" />
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{crawler.name}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>
                    {crawler.url.replace('https://', '').slice(0, 25)}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>{crawler.type}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    fontSize: '10px', fontWeight: 600, color: statusColor[crawler.status],
                    background: `${statusColor[crawler.status]}15`,
                    border: `1px solid ${statusColor[crawler.status]}40`,
                    borderRadius: '4px', padding: '2px 8px',
                    fontFamily: 'var(--font-jetbrains-mono)',
                  }}>
                    {statusIcon[crawler.status]}
                    {statusLabel[crawler.status]}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', fontSize: '11px', color: 'var(--text-muted)' }}>{crawler.lastRun}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--cyan)' }}>
                    {crawler.signalsFound}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', fontSize: '11px', color: 'var(--text-secondary)' }}>{crawler.interval}</td>
                <td style={{ padding: '12px 14px' }}>
                  <button
                    onClick={() => toggleStatus(crawler.id)}
                    style={{
                      background: 'none', border: '1px solid var(--border-default)',
                      borderRadius: '5px', padding: '4px 10px', cursor: 'pointer',
                      color: crawler.status === 'running' ? 'var(--amber)' : 'var(--green)',
                      fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px',
                    }}
                  >
                    {crawler.status === 'running' ? <><Pause size={10} /> 停止</> : <><Play size={10} /> 起動</>}
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
