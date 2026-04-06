'use client';
import { useEffect, useState, useCallback } from 'react';
import { FileText, TrendingUp, RefreshCw, AlertTriangle, Filter } from 'lucide-react';
import { useApp } from '@/lib/theme-context';
import { BACKEND_BASE } from '@/lib/config';

interface EdinetSignal {
  id: number;
  edinet_code: string | null;
  company_name: string | null;
  doc_type_code: string;
  doc_type_name: string;
  submit_datetime: string | null;
  doc_description: string | null;
  signal_type: string;
  signal_score: number;
  is_read: number;
  created_at: string;
}

type FilterType = 'ALL' | 'TOB_FILED' | 'TOB_COMPLETED' | 'TOB_WITHDRAWN' | 'LARGE_HOLDER' | 'LARGE_HOLDER_CHANGE' | 'MA_EVENT' | 'FINANCIAL_ALERT';

const SIGNAL_LABELS: Record<string, { ja: string; en: string; color: string }> = {
  TOB_FILED:             { ja: 'TOB届出',   en: 'TOB Filed',    color: '#ef4444' },
  TOB_COMPLETED:         { ja: 'TOB完了',   en: 'TOB Complete', color: '#f97316' },
  TOB_WITHDRAWN:         { ja: 'TOB撤回',   en: 'TOB Withdrawn',color: '#eab308' },
  LARGE_HOLDER:          { ja: '大量保有',   en: 'Large Holder', color: '#f59e0b' },
  LARGE_HOLDER_CHANGE:   { ja: '保有変更',   en: 'Holder Change',color: '#a78bfa' },
  MA_EVENT:              { ja: 'M&Aイベント',en: 'M&A Event',    color: '#facc15' },
  FINANCIAL_ALERT:       { ja: '業績警報',   en: 'Fin. Alert',   color: '#fb923c' },
  TEMPORARY_REPORT:      { ja: '臨時報告',   en: 'Temp. Report', color: '#94a3b8' },
  REGULAR_DOC:           { ja: '通常書類',   en: 'Regular Doc',  color: '#64748b' },
};

const FILTER_OPTIONS: { value: FilterType; ja: string; en: string }[] = [
  { value: 'ALL',               ja: 'すべて',       en: 'All' },
  { value: 'TOB_FILED',         ja: 'TOB届出',      en: 'TOB Filed' },
  { value: 'TOB_COMPLETED',     ja: 'TOB完了',      en: 'TOB Complete' },
  { value: 'LARGE_HOLDER',      ja: '大量保有',     en: 'Large Holder' },
  { value: 'LARGE_HOLDER_CHANGE',ja: '保有変更',    en: 'Holder Change' },
  { value: 'MA_EVENT',          ja: 'M&Aイベント',  en: 'M&A Event' },
  { value: 'FINANCIAL_ALERT',   ja: '業績警報',     en: 'Fin. Alert' },
];

function SignalBadge({ type }: { type: string }) {
  const meta = SIGNAL_LABELS[type] ?? { ja: type, en: type, color: '#64748b' };
  return (
    <span style={{
      background: `${meta.color}22`,
      color: meta.color,
      border: `1px solid ${meta.color}55`,
      borderRadius: 4,
      padding: '2px 8px',
      fontSize: 11,
      fontWeight: 700,
      fontFamily: 'var(--font-mono)',
      whiteSpace: 'nowrap',
    }}>
      {meta.ja}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? '#ef4444' : score >= 75 ? '#f59e0b' : score >= 50 ? '#22d3ee' : '#64748b';
  return (
    <span style={{
      background: `${color}22`,
      color,
      border: `1px solid ${color}55`,
      borderRadius: 4,
      padding: '2px 8px',
      fontSize: 12,
      fontWeight: 700,
      fontFamily: 'var(--font-mono)',
      minWidth: 36,
      textAlign: 'center',
    }}>
      {score}
    </span>
  );
}

function SkeletonRow() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 160px 140px 60px',
      gap: 16,
      padding: '14px 20px',
      borderBottom: '1px solid var(--border-default)',
      alignItems: 'center',
    }}>
      {[180, 120, 100, 36].map((w, i) => (
        <div key={i} className="row-shimmer" style={{ height: 16, width: w, borderRadius: 4 }} />
      ))}
    </div>
  );
}

export default function EdinetPage() {
  const { lang } = useApp();
  const [signals, setSignals] = useState<EdinetSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const fetchSignals = useCallback(async (type: FilterType = filter) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (type !== 'ALL') params.set('type', type);
      const res = await fetch(`/api/edinet/signals?${params}`);
      const data = await res.json() as { signals?: EdinetSignal[]; error?: string };
      if (data.error && data.error !== 'crawler backend offline') {
        setError(data.error);
      } else {
        setSignals(data.signals ?? []);
      }
    } catch {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchSignals(filter); }, [filter, fetchSignals]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch(`${BACKEND_BASE}/api/edinet/run`, { method: 'POST', cache: 'no-store' });
      await new Promise(r => setTimeout(r, 2000));
      await fetchSignals(filter);
    } catch {
      await fetchSignals(filter);
    } finally {
      setRefreshing(false);
    }
  };

  const title = lang === 'ja' ? 'EDINETシグナル' : 'EDINET Signals';
  const subtitle = lang === 'ja' ? 'M&A・大株主変動・TOB監視' : 'M&A · Shareholder · TOB Monitoring';

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FileText size={22} color="var(--cyan-300)" />
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{subtitle}</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: 'rgba(0,229,255,0.1)',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            color: 'var(--cyan-300)',
            fontSize: 13,
            cursor: refreshing ? 'not-allowed' : 'pointer',
            opacity: refreshing ? 0.6 : 1,
          }}
        >
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : undefined }} />
          {lang === 'ja' ? '今すぐ取得' : 'Fetch Now'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { label: lang === 'ja' ? '総シグナル' : 'Total Signals', value: signals.length, color: 'var(--cyan-300)' },
          { label: 'TOB', value: signals.filter(s => s.signal_type.startsWith('TOB')).length, color: '#ef4444' },
          { label: lang === 'ja' ? '大量保有' : 'Large Holder', value: signals.filter(s => s.signal_type.includes('HOLDER')).length, color: '#f59e0b' },
          { label: lang === 'ja' ? 'M&Aイベント' : 'M&A Events', value: signals.filter(s => s.signal_type === 'MA_EVENT').length, color: '#facc15' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 10,
            padding: '12px 20px',
            minWidth: 120,
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: stat.color, fontFamily: 'var(--font-mono)' }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={14} color="var(--text-muted)" />
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            style={{
              padding: '5px 12px',
              borderRadius: 6,
              border: '1px solid',
              borderColor: filter === opt.value ? 'var(--cyan-300)' : 'var(--border-default)',
              background: filter === opt.value ? 'rgba(0,229,255,0.1)' : 'transparent',
              color: filter === opt.value ? 'var(--cyan-300)' : 'var(--text-secondary)',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'var(--font-noto)',
            }}
          >
            {lang === 'ja' ? opt.ja : opt.en}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 160px 140px 60px',
          gap: 16,
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-default)',
          background: 'var(--bg-raised)',
        }}>
          {[
            lang === 'ja' ? '企業名 / 書類種別' : 'Company / Doc Type',
            lang === 'ja' ? 'シグナル' : 'Signal',
            lang === 'ja' ? '提出日' : 'Submitted',
            lang === 'ja' ? 'スコア' : 'Score',
          ].map(h => (
            <div key={h} style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <AlertTriangle size={32} style={{ marginBottom: 8, opacity: 0.5, display: 'block', margin: '0 auto 8px' }} />
            <p style={{ margin: 0 }}>{lang === 'ja' ? 'クローラーバックエンドがオフラインです' : 'Crawler backend offline'}</p>
            <p style={{ margin: '4px 0 0', fontSize: 12 }}>http://localhost:8002</p>
          </div>
        ) : signals.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <TrendingUp size={32} style={{ marginBottom: 8, opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
            <p style={{ margin: 0 }}>{lang === 'ja' ? 'シグナルなし — 「今すぐ取得」でEDINETを取得してください' : 'No signals — click "Fetch Now" to pull EDINET data'}</p>
          </div>
        ) : (
          signals.map(sig => (
            <div
              key={sig.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 160px 140px 60px',
                gap: 16,
                padding: '14px 20px',
                borderBottom: '1px solid var(--border-default)',
                alignItems: 'center',
                transition: 'background 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {sig.company_name ?? '—'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {sig.doc_type_name}
                  {sig.doc_description ? ` — ${sig.doc_description.slice(0, 60)}` : ''}
                </div>
              </div>
              <div><SignalBadge type={sig.signal_type} /></div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {sig.submit_datetime ? sig.submit_datetime.slice(0, 16).replace('T', ' ') : '—'}
              </div>
              <div><ScoreBadge score={sig.signal_score} /></div>
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
