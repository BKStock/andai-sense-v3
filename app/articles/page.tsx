'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/theme-context';
import { formatRelativeTime } from '@/lib/utils';
import { ScoreBadge } from '@/components/news/ScoreBadge';
import { SentimentBadge } from '@/components/news/SentimentBadge';
import { motion } from 'framer-motion';
import { Search, Filter, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

interface Article {
  id: number;
  title: string;
  url: string;
  ai_score: number | null;
  sentiment: string | null;
  sentiment_score: number | null;
  source_name: string;
  published_at: string;
  summary: string;
  category: string;
  language: string;
  is_read: number;
}

const CATEGORIES = ['', 'technology', 'business', 'finance', 'news', 'environment', 'other'];
const SENTIMENTS = ['', 'positive', 'neutral', 'negative'];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  background: 'var(--bg-raised)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
};

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  background: 'var(--bg-raised)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
};

export default function ArticlesPage() {
  const { lang } = useApp();
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const limit = 20;

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          ...(search && { search }),
          ...(category && { category }),
          ...(sentiment && { sentiment }),
          ...(minScore > 0 && { minScore: String(minScore) }),
        });
        const res = await fetch(`/api/news/articles?${params}`);
        if (!res.ok) return;
        const data = await res.json() as { articles?: Article[]; total?: number };
        if (!cancelled) {
          setArticles(data.articles ?? []);
          setTotal(data.total ?? 0);
        }
      } catch { /* silently ignore network errors */ } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [page, search, category, sentiment, minScore]);

  const totalPages = Math.ceil(total / limit);

  const pageLabel = lang === 'ja'
    ? { title: '記事', subtitle: 'AI分析付き収集記事の一覧', search: '記事を検索...', filter: '絞り込み', noResults: '記事が見つかりません', loading: '読み込み中...' }
    : { title: 'Articles', subtitle: 'All collected articles with AI analysis', search: 'Search articles...', filter: 'Filter', noResults: 'No articles found', loading: 'Loading...' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', fontFamily: 'var(--font-syne)' }}>
            {pageLabel.title}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{pageLabel.subtitle}</p>
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{total} articles</span>
      </div>

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={pageLabel.search}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ ...inputStyle, paddingLeft: 36 }}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-default)',
            background: showFilters ? 'rgba(0, 229, 255, 0.1)' : 'var(--bg-raised)',
            color: showFilters ? 'var(--cyan-300)' : 'var(--text-primary)',
            fontSize: 13, cursor: 'pointer', transition: 'all 200ms',
          }}
        >
          <Filter size={14} />
          {pageLabel.filter}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 16 }}
        >
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
              {lang === 'ja' ? 'カテゴリ' : 'Category'}
            </label>
            <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} style={selectStyle}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c || (lang === 'ja' ? 'すべて' : 'All')}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
              {lang === 'ja' ? '感情' : 'Sentiment'}
            </label>
            <select value={sentiment} onChange={e => { setSentiment(e.target.value); setPage(1); }} style={selectStyle}>
              {SENTIMENTS.map(s => <option key={s} value={s}>{s || (lang === 'ja' ? 'すべて' : 'All')}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
              Min Score: {minScore}
            </label>
            <input
              type="range" min={0} max={100} step={5}
              value={minScore}
              onChange={e => { setMinScore(parseInt(e.target.value)); setPage(1); }}
              style={{ width: 140 }}
            />
          </div>
        </motion.div>
      )}

      {/* Articles table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '52px 1fr 100px 110px 80px',
          gap: 12, padding: '10px 16px',
          borderBottom: '1px solid var(--border-default)',
          background: 'var(--bg-raised)',
        }}>
          {['AI Score', 'Title', 'Source', 'Sentiment', 'Published'].map(h => (
            <div key={h} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            {pageLabel.loading}
          </div>
        ) : articles.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            {pageLabel.noResults}
          </div>
        ) : (
          <div>
            {articles.map((article, i) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="row-shimmer"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '52px 1fr 100px 110px 80px',
                  gap: 12,
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-default)',
                  alignItems: 'start',
                  opacity: article.is_read ? 0.6 : 1,
                  cursor: 'default',
                }}
              >
                <ScoreBadge score={article.ai_score || 0} size="sm" />
                <div style={{ minWidth: 0 }}>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 4,
                      color: 'var(--text-primary)', textDecoration: 'none',
                      fontSize: 13, fontWeight: 500, lineHeight: 1.4,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--cyan-300)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                  >
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {article.title}
                    </span>
                    <ExternalLink size={11} style={{ flexShrink: 0, marginTop: 2 }} />
                  </a>
                  {article.summary && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {article.summary}
                    </p>
                  )}
                  <span style={{
                    display: 'inline-block', marginTop: 4,
                    fontSize: 10, color: 'var(--text-muted)',
                    background: 'var(--bg-raised)', padding: '1px 6px', borderRadius: 4,
                    textTransform: 'capitalize',
                  }}>
                    {article.category}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', paddingTop: 2 }}>{article.source_name}</div>
                <div style={{ paddingTop: 2 }}>
                  {article.sentiment && <SentimentBadge sentiment={article.sentiment} />}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingTop: 2 }}>
                  {formatRelativeTime(article.published_at, lang)}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Page {page} of {totalPages} · {total} total
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { icon: ChevronLeft, disabled: page === 1, onClick: () => setPage(p => p - 1) },
              { icon: ChevronRight, disabled: page === totalPages, onClick: () => setPage(p => p + 1) },
            ].map(({ icon: Icon, disabled, onClick }, idx) => (
              <button
                key={idx}
                disabled={disabled}
                onClick={onClick}
                style={{
                  padding: 8, borderRadius: 8,
                  background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)', cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.4 : 1, transition: 'all 200ms',
                }}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
