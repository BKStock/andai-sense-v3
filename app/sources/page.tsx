'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/lib/theme-context';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, Check, X, RefreshCw, Globe, ToggleLeft, ToggleRight, Wifi, WifiOff, Clock } from 'lucide-react';
import { formInputStyle as inputStyle } from '@/lib/styles';

interface Source {
  id: number;
  name: string;
  url: string;
  type: string;
  category: string;
  language: string;
  enabled: number;
  last_fetched_at: string | null;
  article_count: number;
  created_at: string;
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  background: 'var(--bg-raised)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
};

const btnBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 14px',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  border: '1px solid var(--border-default)',
  transition: 'all 150ms',
};

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function healthColor(dateStr: string | null): string {
  if (!dateStr) return 'var(--text-muted)';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 86400) return 'var(--green)';
  if (diff < 604800) return 'var(--amber)';
  return 'var(--red)';
}

function EmptyState({ lang }: { lang: string }) {
  return (
    <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
      <Globe size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
      <p style={{ fontSize: 14, margin: '0 0 4px' }}>
        {lang === 'ja' ? 'ソースがありません' : 'No sources yet'}
      </p>
      <p style={{ fontSize: 12 }}>
        {lang === 'ja' ? '上部の「追加」ボタンから追加してください' : 'Use the Add button above to create sources'}
      </p>
    </div>
  );
}

export default function SourcesPage() {
  const { lang } = useApp();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [fetchingId, setFetchingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    url: '',
    type: 'rss',
    category: 'general',
    language: 'ja',
  });

  const L = {
    title: lang === 'ja' ? 'ソース管理' : 'Sources',
    subtitle: lang === 'ja' ? 'ニュースフィードとスクレイピング対象の設定' : 'Configure news feeds and scraping targets',
    add: lang === 'ja' ? '追加' : 'Add',
    cancel: lang === 'ja' ? 'キャンセル' : 'Cancel',
    save: lang === 'ja' ? '保存' : 'Save',
    fetchNow: lang === 'ja' ? '今すぐ取得' : 'Fetch Now',
    loading: lang === 'ja' ? '読み込み中...' : 'Loading...',
    deleteConfirm: lang === 'ja' ? 'このソースを削除しますか？' : 'Delete this source?',
    activeSources: lang === 'ja' ? '有効ソース' : 'Active Sources',
    totalArticles: lang === 'ja' ? '記事合計' : 'Total Articles',
  };

  const fetchSources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/news/sources');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setSources(data.sources ?? []);
    } catch {
      setError(lang === 'ja' ? '読み込みに失敗しました' : 'Failed to load sources');
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  const resetForm = () => setForm({ name: '', url: '', type: 'rss', category: 'general', language: 'ja' });

  const handleAdd = async () => {
    if (!form.name.trim() || !form.url.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/news/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { resetForm(); setShowAdd(false); fetchSources(); }
    } finally { setSaving(false); }
  };

  const handleEdit = async (id: number) => {
    if (!form.name.trim() || !form.url.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/news/sources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...form }),
      });
      if (res.ok) { setEditId(null); resetForm(); fetchSources(); }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(L.deleteConfirm)) return;
    try {
      const res = await fetch('/api/news/sources', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) { setError(lang === 'ja' ? '削除に失敗しました' : 'Delete failed'); return; }
      await fetchSources();
    } catch {
      setError(lang === 'ja' ? 'ネットワークエラー' : 'Network error');
    }
  };

  const handleToggle = async (s: Source) => {
    try {
      const res = await fetch('/api/news/sources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: s.id, enabled: s.enabled ? 0 : 1 }),
      });
      if (!res.ok) { setError(lang === 'ja' ? '変更に失敗しました' : 'Update failed'); return; }
      await fetchSources();
    } catch {
      setError(lang === 'ja' ? 'ネットワークエラー' : 'Network error');
    }
  };

  const handleFetchNow = async (s: Source) => {
    setFetchingId(s.id);
    try {
      const res = await fetch('/api/news/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: s.id }),
      });
      if (!res.ok) { setError(lang === 'ja' ? '取得に失敗しました' : 'Fetch failed'); return; }
      await fetchSources();
    } catch {
      setError(lang === 'ja' ? 'ネットワークエラー' : 'Network error');
    } finally {
      setFetchingId(null);
    }
  };

  const startEdit = (s: Source) => {
    setEditId(s.id);
    setShowAdd(false);
    setForm({ name: s.name, url: s.url, type: s.type, category: s.category, language: s.language });
  };

  const activeSources = sources.filter(s => s.enabled).length;
  const totalArticles = sources.reduce((sum, s) => sum + (s.article_count ?? 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', fontFamily: 'var(--font-syne)' }}>
            {L.title}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{L.subtitle}</p>
        </div>
        <button
          onClick={() => { setShowAdd(v => !v); setEditId(null); resetForm(); }}
          style={{ ...btnBase, background: 'rgba(0,229,255,0.1)', borderColor: 'rgba(0,229,255,0.3)', color: 'var(--cyan-300)' }}
        >
          <Plus size={13} /> {L.add}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: L.activeSources, value: activeSources, color: 'var(--green)', icon: <Wifi size={14} /> },
          { label: lang === 'ja' ? '無効ソース' : 'Disabled Sources', value: sources.length - activeSources, color: 'var(--text-muted)', icon: <WifiOff size={14} /> },
          { label: L.totalArticles, value: totalArticles, color: 'var(--cyan-300)', icon: <Clock size={14} /> },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              <span style={{ color: stat.color }}>{stat.icon}</span>
              {stat.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: stat.color, fontFamily: 'var(--font-mono)' }}>
              {stat.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card"
            style={{ overflow: 'hidden', padding: 20 }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
              {lang === 'ja' ? '新規ソース追加' : 'Add New Source'}
            </div>
            <SourceForm form={form} setForm={setForm} lang={lang} />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                onClick={handleAdd}
                disabled={saving || !form.name.trim() || !form.url.trim()}
                style={{ ...btnBase, background: 'rgba(0,229,255,0.15)', borderColor: 'rgba(0,229,255,0.4)', color: 'var(--cyan-300)', opacity: saving ? 0.5 : 1 }}
              >
                <Check size={13} /> {L.save}
              </button>
              <button onClick={() => { setShowAdd(false); resetForm(); }} style={{ ...btnBase, background: 'transparent', color: 'var(--text-muted)' }}>
                <X size={13} /> {L.cancel}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.3)', color: 'var(--red)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '200px 1fr 70px 90px 80px 80px 70px 120px',
          gap: 8, padding: '10px 16px',
          borderBottom: '1px solid var(--border-default)',
          background: 'var(--bg-raised)',
        }}>
          {[
            lang === 'ja' ? '名称' : 'Name',
            'URL',
            lang === 'ja' ? '種別' : 'Type',
            lang === 'ja' ? 'カテゴリ' : 'Category',
            lang === 'ja' ? '最終取得' : 'Last Fetch',
            lang === 'ja' ? '記事数' : 'Articles',
            lang === 'ja' ? '有効' : 'Enabled',
            lang === 'ja' ? '操作' : 'Actions',
          ].map(h => (
            <div key={h} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>{L.loading}</div>
        ) : sources.length === 0 ? (
          <EmptyState lang={lang} />
        ) : (
          <div>
            {sources.map((s, i) => (
              <div key={s.id}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="row-shimmer"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '200px 1fr 70px 90px 80px 80px 70px 120px',
                    gap: 8, padding: '12px 16px',
                    borderBottom: '1px solid var(--border-default)',
                    alignItems: 'center',
                    opacity: s.enabled ? 1 : 0.5,
                  }}
                >
                  {/* Name with health dot */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: healthColor(s.last_fetched_at), flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.name}
                    </span>
                  </div>
                  {/* URL */}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.url.replace('https://', '').replace('http://', '').slice(0, 40)}
                  </span>
                  {/* Type */}
                  <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: 'var(--bg-raised)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', width: 'fit-content' }}>
                    {s.type}
                  </span>
                  {/* Category */}
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{s.category}</span>
                  {/* Last fetched */}
                  <span style={{ fontSize: 11, color: healthColor(s.last_fetched_at), fontFamily: 'var(--font-mono)' }}>
                    {formatRelativeTime(s.last_fetched_at)}
                  </span>
                  {/* Article count */}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--cyan-300)' }}>
                    {s.article_count ?? 0}
                  </span>
                  {/* Toggle */}
                  <button onClick={() => handleToggle(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: s.enabled ? 'var(--green)' : 'var(--text-muted)' }}>
                    {s.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => handleFetchNow(s)}
                      disabled={fetchingId === s.id}
                      title={L.fetchNow}
                      style={{ ...btnBase, padding: '4px 8px', background: 'transparent', color: 'var(--amber)', borderColor: 'transparent' }}
                    >
                      <RefreshCw size={12} style={fetchingId === s.id ? { animation: 'spin 1s linear infinite' } : {}} />
                    </button>
                    <button
                      onClick={() => startEdit(s)}
                      style={{ ...btnBase, padding: '4px 8px', background: 'transparent', color: 'var(--cyan-300)', borderColor: 'transparent' }}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      style={{ ...btnBase, padding: '4px 8px', background: 'transparent', color: 'var(--red)', borderColor: 'transparent' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>

                {/* Inline Edit */}
                <AnimatePresence>
                  {editId === s.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden', background: 'var(--bg-raised)', borderBottom: '1px solid var(--border-default)', padding: 16 }}
                    >
                      <SourceForm form={form} setForm={setForm} lang={lang} />
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button
                          onClick={() => handleEdit(s.id)}
                          disabled={saving}
                          style={{ ...btnBase, background: 'rgba(0,229,255,0.15)', borderColor: 'rgba(0,229,255,0.4)', color: 'var(--cyan-300)', opacity: saving ? 0.5 : 1 }}
                        >
                          <Check size={13} /> {L.save}
                        </button>
                        <button onClick={() => { setEditId(null); resetForm(); }} style={{ ...btnBase, background: 'transparent', color: 'var(--text-muted)' }}>
                          <X size={13} /> {L.cancel}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function SourceForm({
  form,
  setForm,
  lang,
}: {
  form: { name: string; url: string; type: string; category: string; language: string };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  lang: string;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      <div>
        <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
          {lang === 'ja' ? '名称 *' : 'Name *'}
        </label>
        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder={lang === 'ja' ? 'ソース名' : 'Source name'} style={inputStyle} />
      </div>
      <div style={{ gridColumn: '2 / 4' }}>
        <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
          URL *
        </label>
        <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://..." style={inputStyle} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
          {lang === 'ja' ? '種別' : 'Type'}
        </label>
        <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={selectStyle}>
          {['rss', 'web', 'api', 'scrape'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
          {lang === 'ja' ? 'カテゴリ' : 'Category'}
        </label>
        <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={selectStyle}>
          {['general', 'ma', 'finance', 'legal', 'hr', 'patent', 'news', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
          {lang === 'ja' ? '言語' : 'Language'}
        </label>
        <select value={form.language} onChange={e => setForm(p => ({ ...p, language: e.target.value }))} style={selectStyle}>
          <option value="ja">日本語 (ja)</option>
          <option value="en">English (en)</option>
          <option value="all">{lang === 'ja' ? 'すべて' : 'All'}</option>
        </select>
      </div>
    </div>
  );
}
