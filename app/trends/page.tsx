'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/theme-context';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

interface TrendTopic {
  term: string;
  velocity: number;
  direction: 'rising' | 'falling' | 'stable';
  predictedPeak: string | null;
  articles: number;
  heatCurve: { date: string; count: number }[];
}

const MOCK_TRENDS: TrendTopic[] = [
  { term: 'AI / Machine Learning', velocity: 42, direction: 'rising', predictedPeak: '2026-04-03', articles: 156, heatCurve: [{ date: '03-26', count: 18 }, { date: '03-27', count: 22 }, { date: '03-28', count: 30 }, { date: '03-29', count: 38 }, { date: '03-30', count: 45 }, { date: '03-31', count: 52 }, { date: '04-01', count: 64 }] },
  { term: 'Quantum Computing', velocity: 28, direction: 'rising', predictedPeak: '2026-04-02', articles: 48, heatCurve: [{ date: '03-26', count: 4 }, { date: '03-27', count: 6 }, { date: '03-28', count: 8 }, { date: '03-29', count: 14 }, { date: '03-30', count: 18 }, { date: '03-31', count: 24 }, { date: '04-01', count: 30 }] },
  { term: 'EV / Battery Technology', velocity: -8, direction: 'falling', predictedPeak: null, articles: 72, heatCurve: [{ date: '03-26', count: 22 }, { date: '03-27', count: 20 }, { date: '03-28', count: 18 }, { date: '03-29', count: 16 }, { date: '03-30', count: 14 }, { date: '03-31', count: 12 }, { date: '04-01', count: 10 }] },
  { term: 'Semiconductor', velocity: 5, direction: 'stable', predictedPeak: null, articles: 94, heatCurve: [{ date: '03-26', count: 12 }, { date: '03-27', count: 14 }, { date: '03-28', count: 13 }, { date: '03-29', count: 15 }, { date: '03-30', count: 14 }, { date: '03-31', count: 13 }, { date: '04-01', count: 15 }] },
  { term: 'Fintech / DeFi', velocity: 18, direction: 'rising', predictedPeak: '2026-04-05', articles: 61, heatCurve: [{ date: '03-26', count: 6 }, { date: '03-27', count: 8 }, { date: '03-28', count: 10 }, { date: '03-29', count: 12 }, { date: '03-30', count: 14 }, { date: '03-31', count: 18 }, { date: '04-01', count: 22 }] },
  { term: 'Climate / ESG', velocity: -15, direction: 'falling', predictedPeak: null, articles: 38, heatCurve: [{ date: '03-26', count: 16 }, { date: '03-27', count: 14 }, { date: '03-28', count: 12 }, { date: '03-29', count: 10 }, { date: '03-30', count: 8 }, { date: '03-31', count: 6 }, { date: '04-01', count: 5 }] },
];

const DIRECTION_CONFIG = {
  rising: { icon: TrendingUp, color: 'var(--green)', bgColor: 'rgba(0, 255, 136, 0.1)', hexColor: '#00FF88' },
  falling: { icon: TrendingDown, color: 'var(--red)', bgColor: 'rgba(255, 59, 59, 0.1)', hexColor: '#FF3B3B' },
  stable: { icon: Minus, color: 'var(--text-muted)', bgColor: 'rgba(136, 150, 179, 0.1)', hexColor: '#8896B3' },
};

function isPeakSoon(predictedPeak: string | null): boolean {
  if (!predictedPeak) return false;
  const peak = new Date(predictedPeak);
  const now = new Date();
  const diffHours = (peak.getTime() - now.getTime()) / (1000 * 60 * 60);
  return diffHours <= 24 && diffHours >= 0;
}

export default function TrendsPage() {
  const { lang } = useApp();
  const [trends, setTrends] = useState<TrendTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/news/trends')
      .then(r => r.json())
      .then(d => {
        const fetchedTrends = d.trends?.length ? d.trends.map((t: { topic: string; velocity: number; trend: string; predictedPeak: string | null; currentCount: number; counts: number[]; dates: string[] }) => ({
          term: t.topic,
          velocity: Math.round(t.velocity * 100),
          direction: t.trend || 'stable',
          predictedPeak: t.predictedPeak,
          articles: t.currentCount || 0,
          heatCurve: (t.counts || []).map((count, i) => ({ date: (t.dates || [])[i] || String(i), count })),
        })) : MOCK_TRENDS;
        setTrends(fetchedTrends);
        setLoading(false);
      })
      .catch(() => { setTrends(MOCK_TRENDS); setLoading(false); });
  }, []);

  const selectedTrend = trends.find(t => t.term === selected) || trends[0];

  const labels = {
    title: lang === 'ja' ? 'トレンド予測' : 'Trend Prediction',
    subtitle: lang === 'ja' ? 'トピックの熱量曲線とピーク予測' : 'Topic heat curves and peak predictions',
    rising: lang === 'ja' ? '上昇中' : 'Rising',
    falling: lang === 'ja' ? '下降中' : 'Falling',
    stable: lang === 'ja' ? '安定' : 'Stable',
    velocity: lang === 'ja' ? '勢い' : 'Velocity',
    predictedPeak: lang === 'ja' ? '予測ピーク' : 'Predicted Peak',
    articles: lang === 'ja' ? '記事数' : 'Articles',
    heatCurve: lang === 'ja' ? '熱量曲線' : 'Heat Curve',
    topTrends: lang === 'ja' ? '急上昇トピック' : 'Top Trending Topics',
    peakWarning: lang === 'ja' ? '24時間以内にピーク到達予測' : 'Peak expected within 24 hours',
    loading: lang === 'ja' ? '読み込み中...' : 'Loading...',
  };

  const tooltipStyle = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: 8,
    fontSize: 12,
    color: 'var(--text-primary)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', fontFamily: 'var(--font-syne)' }}>
          {labels.title}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{labels.subtitle}</p>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: labels.rising, count: trends.filter(t => t.direction === 'rising').length, color: 'var(--green)' },
          { label: labels.stable, count: trends.filter(t => t.direction === 'stable').length, color: 'var(--text-muted)' },
          { label: labels.falling, count: trends.filter(t => t.direction === 'falling').length, color: 'var(--red)' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card"
            style={{ padding: 16 }}
          >
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 6px' }}>{item.label}</p>
            <p style={{ fontSize: 32, fontWeight: 700, color: item.color, margin: 0, fontFamily: 'var(--font-syne)' }}>{item.count}</p>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 24 }}>
        {/* Topic list */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
          style={{ padding: 20 }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px', fontFamily: 'var(--font-syne)' }}>
            {labels.topTrends}
          </h2>
          {loading ? (
            <div style={{ padding: '32px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>{labels.loading}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {trends.map((topic, i) => {
                const cfg = DIRECTION_CONFIG[topic.direction];
                const Icon = cfg.icon;
                const isActive = (selected || trends[0]?.term) === topic.term;
                const peakSoon = isPeakSoon(topic.predictedPeak);
                return (
                  <motion.button
                    key={topic.term}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    onClick={() => setSelected(topic.term)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: 12, borderRadius: 8, border: isActive ? '1px solid rgba(0,229,255,0.2)' : '1px solid transparent',
                      background: isActive ? 'rgba(0, 229, 255, 0.08)' : 'transparent',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 200ms',
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-raised)'; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, background: cfg.bgColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon size={14} style={{ color: cfg.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {topic.term}
                        </span>
                        {peakSoon && <AlertTriangle size={12} style={{ color: 'var(--amber)', flexShrink: 0 }} />}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{topic.articles} {labels.articles}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color }}>
                          {topic.velocity > 0 ? '+' : ''}{topic.velocity}% {labels.velocity}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Heat curve detail */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card"
          style={{ padding: 20 }}
        >
          {selectedTrend ? (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px', fontFamily: 'var(--font-syne)' }}>
                    {selectedTrend.term}
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{labels.heatCurve}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {selectedTrend.predictedPeak && (
                    <div style={{
                      fontSize: 11, padding: '4px 10px', borderRadius: 8,
                      background: isPeakSoon(selectedTrend.predictedPeak) ? 'rgba(255, 184, 0, 0.1)' : 'var(--bg-raised)',
                      color: isPeakSoon(selectedTrend.predictedPeak) ? 'var(--amber)' : 'var(--text-muted)',
                      border: isPeakSoon(selectedTrend.predictedPeak) ? '1px solid rgba(255, 184, 0, 0.2)' : '1px solid transparent',
                    }}>
                      {isPeakSoon(selectedTrend.predictedPeak) && <AlertTriangle size={11} style={{ display: 'inline', marginRight: 4 }} />}
                      {labels.predictedPeak}: {selectedTrend.predictedPeak}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 8 }}>
                    {(() => {
                      const cfg = DIRECTION_CONFIG[selectedTrend.direction];
                      const Icon = cfg.icon;
                      return <>
                        <Icon size={16} style={{ color: cfg.color }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: cfg.color }}>
                          {selectedTrend.velocity > 0 ? '+' : ''}{selectedTrend.velocity}%
                        </span>
                      </>;
                    })()}
                  </div>
                </div>
              </div>
              <div style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedTrend.heatCurve} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="heatGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={DIRECTION_CONFIG[selectedTrend.direction].hexColor} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={DIRECTION_CONFIG[selectedTrend.direction].hexColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'var(--border-default)' }} />
                    <Area
                      type="monotone" dataKey="count"
                      stroke={DIRECTION_CONFIG[selectedTrend.direction].hexColor}
                      strokeWidth={2} fill="url(#heatGradient)"
                      name={labels.articles}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {isPeakSoon(selectedTrend.predictedPeak) && (
                <div style={{
                  marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, padding: 12,
                  borderRadius: 8, background: 'rgba(255, 184, 0, 0.1)', border: '1px solid rgba(255, 184, 0, 0.2)',
                }}>
                  <AlertTriangle size={16} style={{ color: 'var(--amber)', flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: 'var(--amber)', margin: 0 }}>{labels.peakWarning}</p>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '64px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
              Select a topic to view its heat curve
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
