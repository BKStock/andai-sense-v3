'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/theme-context';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SentimentData {
  timeline: { date: string; positive: number; neutral: number; negative: number }[];
  byCategory: { category: string; positive: number; neutral: number; negative: number }[];
  byKeyword: { term: string; positive: number; neutral: number; negative: number }[];
  overall: { sentiment: string; count: number; pct: number }[];
}

const MOCK_DATA: SentimentData = {
  timeline: [
    { date: '2026-03-26', positive: 18, neutral: 10, negative: 4 },
    { date: '2026-03-27', positive: 22, neutral: 12, negative: 6 },
    { date: '2026-03-28', positive: 15, neutral: 14, negative: 8 },
    { date: '2026-03-29', positive: 28, neutral: 9, negative: 3 },
    { date: '2026-03-30', positive: 20, neutral: 11, negative: 5 },
    { date: '2026-03-31', positive: 25, neutral: 13, negative: 4 },
    { date: '2026-04-01', positive: 30, neutral: 8, negative: 2 },
  ],
  byCategory: [
    { category: 'Technology', positive: 45, neutral: 20, negative: 8 },
    { category: 'Finance', positive: 22, neutral: 30, negative: 18 },
    { category: 'Business', positive: 38, neutral: 22, negative: 10 },
    { category: 'Environment', positive: 12, neutral: 15, negative: 28 },
    { category: 'General', positive: 30, neutral: 25, negative: 12 },
  ],
  byKeyword: [
    { term: 'AI / Machine Learning', positive: 52, neutral: 18, negative: 5 },
    { term: 'Semiconductor', positive: 28, neutral: 22, negative: 12 },
    { term: 'Cloud Computing', positive: 35, neutral: 20, negative: 6 },
    { term: 'EV / Battery', positive: 20, neutral: 18, negative: 22 },
    { term: 'Fintech', positive: 30, neutral: 28, negative: 10 },
  ],
  overall: [
    { sentiment: 'positive', count: 158, pct: 55 },
    { sentiment: 'neutral', count: 89, pct: 31 },
    { sentiment: 'negative', count: 40, pct: 14 },
  ],
};

const SENTIMENT_COLORS = {
  positive: 'var(--green)',
  neutral: 'var(--text-secondary)',
  negative: 'var(--red)',
};
const SENTIMENT_COLORS_HEX = {
  positive: '#00FF88',
  neutral: '#8896B3',
  negative: '#FF3B3B',
};

const PIE_COLORS = ['#00FF88', '#8896B3', '#FF3B3B'];

function SentimentTrend({ value }: { value: number }) {
  if (value > 2) return <TrendingUp size={14} style={{ color: 'var(--green)' }} />;
  if (value < -2) return <TrendingDown size={14} style={{ color: 'var(--red)' }} />;
  return <Minus size={14} style={{ color: 'var(--text-muted)' }} />;
}

export default function SentimentPage() {
  const { lang } = useApp();
  const [data, setData] = useState<SentimentData>(MOCK_DATA);
  const [range, setRange] = useState<'7d' | '30d'>('7d');

  useEffect(() => {
    fetch('/api/news/sentiment')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && (d.timeline || d.overall)) setData({ ...MOCK_DATA, ...d });
      })
      .catch(() => {});
  }, []);

  const labels = {
    title: lang === 'ja' ? 'センチメント分析' : 'Sentiment Analysis',
    subtitle: lang === 'ja' ? 'カテゴリ・キーワード別のセンチメント推移' : 'Track sentiment trends across categories and keywords',
    positive: lang === 'ja' ? 'ポジティブ' : 'Positive',
    neutral: lang === 'ja' ? 'ニュートラル' : 'Neutral',
    negative: lang === 'ja' ? 'ネガティブ' : 'Negative',
    trend: lang === 'ja' ? '推移' : 'Trend',
    byCategory: lang === 'ja' ? 'カテゴリ別' : 'By Category',
    byKeyword: lang === 'ja' ? 'キーワード別' : 'By Keyword',
    last7: lang === 'ja' ? '過去7日間' : 'Last 7 Days',
    last30: lang === 'ja' ? '過去30日間' : 'Last 30 Days',
    overall: lang === 'ja' ? '全体' : 'Overall',
  };

  const sentLabels: Record<string, string> = {
    positive: labels.positive,
    neutral: labels.neutral,
    negative: labels.negative,
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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', fontFamily: 'var(--font-syne)' }}>
            {labels.title}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{labels.subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-raised)', borderRadius: 10, padding: 4 }}>
          {(['7d', '30d'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12,
                background: range === r ? 'var(--bg-surface)' : 'transparent',
                color: range === r ? 'var(--text-primary)' : 'var(--text-muted)',
                transition: 'all 200ms',
              }}
            >
              {r === '7d' ? labels.last7 : labels.last30}
            </button>
          ))}
        </div>
      </div>

      {/* Overall KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {data.overall.map((item, i) => (
          <motion.div
            key={item.sentiment}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card"
            style={{ padding: 20 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {sentLabels[item.sentiment] || item.sentiment}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                background: (SENTIMENT_COLORS_HEX[item.sentiment as keyof typeof SENTIMENT_COLORS_HEX] || '#8896B3') + '20',
                color: SENTIMENT_COLORS[item.sentiment as keyof typeof SENTIMENT_COLORS] || 'var(--text-muted)',
              }}>
                {item.pct}%
              </span>
            </div>
            <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px', fontFamily: 'var(--font-syne)' }}>
              {item.count}
            </p>
            <div style={{ height: 4, background: 'var(--bg-raised)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2,
                width: `${item.pct}%`,
                background: SENTIMENT_COLORS[item.sentiment as keyof typeof SENTIMENT_COLORS] || 'var(--text-muted)',
                transition: 'width 600ms ease',
              }} />
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Timeline chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
          style={{ padding: 20 }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px', fontFamily: 'var(--font-syne)' }}>
            {labels.trend}
          </h2>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.timeline} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'var(--border-default)' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={v => sentLabels[v] || v} />
                <Line type="monotone" dataKey="positive" stroke={SENTIMENT_COLORS_HEX.positive} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="neutral" stroke={SENTIMENT_COLORS_HEX.neutral} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="negative" stroke={SENTIMENT_COLORS_HEX.negative} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pie chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card"
          style={{ padding: 20 }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px', fontFamily: 'var(--font-syne)' }}>
            {labels.overall}
          </h2>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.overall} dataKey="count" nameKey="sentiment" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {data.overall.map((entry, index) => (
                    <Cell key={entry.sentiment} fill={PIE_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} formatter={v => sentLabels[v] || v} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* By Category */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
        style={{ padding: 20 }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px', fontFamily: 'var(--font-syne)' }}>
          {labels.byCategory}
        </h2>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.byCategory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={14}>
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="positive" name={labels.positive} fill={SENTIMENT_COLORS_HEX.positive} radius={[3, 3, 0, 0]} />
              <Bar dataKey="neutral" name={labels.neutral} fill={SENTIMENT_COLORS_HEX.neutral} radius={[3, 3, 0, 0]} />
              <Bar dataKey="negative" name={labels.negative} fill={SENTIMENT_COLORS_HEX.negative} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* By Keyword */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="card"
        style={{ padding: 20 }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px', fontFamily: 'var(--font-syne)' }}>
          {labels.byKeyword}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.byKeyword.map((kw, i) => {
            const total = kw.positive + kw.neutral + kw.negative;
            const posPct = Math.round((kw.positive / total) * 100);
            const neuPct = Math.round((kw.neutral / total) * 100);
            const negPct = 100 - posPct - neuPct;
            return (
              <motion.div
                key={kw.term}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                style={{ display: 'flex', alignItems: 'center', gap: 16 }}
              >
                <div style={{ width: 160, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SentimentTrend value={kw.positive - kw.negative} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {kw.term}
                  </span>
                </div>
                <div style={{ flex: 1, height: 6, background: 'var(--bg-raised)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${posPct}%`, background: SENTIMENT_COLORS_HEX.positive, height: '100%' }} />
                  <div style={{ width: `${neuPct}%`, background: SENTIMENT_COLORS_HEX.neutral, height: '100%' }} />
                  <div style={{ width: `${negPct}%`, background: SENTIMENT_COLORS_HEX.negative, height: '100%' }} />
                </div>
                <div style={{ width: 80, textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>
                  {total} articles
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
