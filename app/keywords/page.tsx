'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/lib/theme-context';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, Check, X, Tag, ToggleLeft, ToggleRight } from 'lucide-react';
import { formInputStyle as inputStyle, formSelectStyle as selectStyle } from '@/lib/styles';

interface Keyword {
  id: number;
  term: string;
  category: string;
  priority: number;
  color: string;
  enabled: number;
  match_count: number;
  condition_type: string;
  related_terms: string;
  exclude_terms: string;
  created_at: string;
}

const PRESET_COLORS = ['#00E5FF', '#FF3B3B', '#FFB800', '#00FF88', '#A78BFA', '#F472B6', '#34D399', '#FB923C'];
const PRIORITY_LABELS: Record<number, { en: string; ja: string; color: string }> = {
  1: { en: 'Low', ja: '低', color: 'var(--text-muted)' },
  2: { en: 'Mid', ja: '中', color: 'var(--amber)' },
  3: { en: 'High', ja: '高', color: 'var(--red)' },
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

function EmptyState({ lang }: { lang: string }) {
  return (
    <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
      <Tag size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
      <p style={{ fontSize: 14, margin: '0 0 4px' }}>
        {lang === 'ja' ? 'キーワードがありません' : 'No keywords yet'}
      </p>
      <p style={{ fontSize: 12 }}>
        {lang === 'ja' ? '上部の「追加」ボタンから追加してください' : 'Use the Add button above to create keywords'}
      </p>
    </div>
  );
}

export default function KeywordsPage() {
  const { lang } = useApp();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    term: '',
    category: 'general',
    priority: 2,
    color: '#00E5FF',
    condition_type: 'OR',
    related_terms: '',
    exclude_terms: '',
  });

  const L = {
    title: lang === 'ja' ? 'キーワード管理' : 'Keywords',
    subtitle: lang === 'ja' ? '記事マッチング用キーワードの設定' : 'Configure keywords for article matching',
    add: lang === 'ja' ? '追加' : 'Add',
    cancel: lang === 'ja' ? 'キャンセル' : 'Cancel',
    save: lang === 'ja' ? '保存' : 'Save',
    term: lang === 'ja' ? 'キーワード' : 'Term',
    category: lang === 'ja' ? 'カテゴリ' : 'Category',
    priority: lang === 'ja' ? '優先度' : 'Priority',
    color: lang === 'ja' ? 'カラー' : 'Color',
    matches: lang === 'ja' ? 'マッチ数' : 'Matches',
    enabled: lang === 'ja' ? '有効' : 'Enabled',
    actions: lang === 'ja' ? '操作' : 'Actions',
    relatedTerms: lang === 'ja' ? '関連語（カンマ区切り）' : 'Related terms (comma-separated)',
    excludeTerms: lang === 'ja' ? '除外語（カンマ区切り）' : 'Exclude terms (comma-separated)',
    loading: lang === 'ja' ? '読み込み中...' : 'Loading...',
    deleteConfirm: lang === 'ja' ? '削除しますか？' : 'Delete this keyword?',
  };

  const fetchKeywords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/news/keywords');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setKeywords(data.keywords ?? []);
    } catch {
      setError(lang === 'ja' ? '読み込みに失敗しました' : 'Failed to load keywords');
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => { fetchKeywords(); }, [fetchKeywords]);

  const resetForm = () => {
    setForm({ term: '', category: 'general', priority: 2, color: '#00E5FF', condition_type: 'OR', related_terms: '', exclude_terms: '' });
  };

  const handleAdd = async () => {
    if (!form.term.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/news/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: form.term.trim(),
          category: form.category,
          priority: form.priority,
          color: form.color,
          condition_type: form.condition_type,
          related_terms: form.related_terms.split(',').map(s => s.trim()).filter(Boolean),
          exclude_terms: form.exclude_terms.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        resetForm();
        setShowAdd(false);
        fetchKeywords();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (kw: Keyword) => {
    if (!form.term.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/news/keywords', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: kw.id,
          term: form.term.trim(),
          category: form.category,
          priority: form.priority,
          color: form.color,
          condition_type: form.condition_type,
          related_terms: form.related_terms.split(',').map(s => s.trim()).filter(Boolean),
          exclude_terms: form.exclude_terms.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        setEditId(null);
        resetForm();
        fetchKeywords();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(L.deleteConfirm)) return;
    try {
      const res = await fetch('/api/news/keywords', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) { setError(lang === 'ja' ? '削除に失敗しました' : 'Delete failed'); return; }
      await fetchKeywords();
    } catch {
      setError(lang === 'ja' ? 'ネットワークエラー' : 'Network error');
    }
  };

  const handleToggle = async (kw: Keyword) => {
    try {
      const res = await fetch('/api/news/keywords', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: kw.id, enabled: kw.enabled ? 0 : 1 }),
      });
      if (!res.ok) { setError(lang === 'ja' ? '変更に失敗しました' : 'Update failed'); return; }
      await fetchKeywords();
    } catch {
      setError(lang === 'ja' ? 'ネットワークエラー' : 'Network error');
    }
  };

  const startEdit = (kw: Keyword) => {
    setEditId(kw.id);
    setShowAdd(false);
    let related: string[] = [];
    let excluded: string[] = [];
    try { related = JSON.parse(kw.related_terms || '[]') as string[]; } catch { related = []; }
    try { excluded = JSON.parse(kw.exclude_terms || '[]') as string[]; } catch { excluded = []; }
    setForm({
      term: kw.term,
      category: kw.category,
      priority: kw.priority,
      color: kw.color,
      condition_type: kw.condition_type,
      related_terms: related.join(', '),
      exclude_terms: excluded.join(', '),
    });
  };

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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {keywords.length} {lang === 'ja' ? '件' : 'total'}
          </span>
          <button
            onClick={() => { setShowAdd(v => !v); setEditId(null); resetForm(); }}
            style={{ ...btnBase, background: 'rgba(0,229,255,0.1)', borderColor: 'rgba(0,229,255,0.3)', color: 'var(--cyan-300)' }}
          >
            <Plus size={13} /> {L.add}
          </button>
        </div>
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
              {lang === 'ja' ? '新規キーワード追加' : 'Add New Keyword'}
            </div>
            <KeywordForm form={form} setForm={setForm} lang={lang} L={L} />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                onClick={handleAdd}
                disabled={saving || !form.term.trim()}
                style={{ ...btnBase, background: 'rgba(0,229,255,0.15)', borderColor: 'rgba(0,229,255,0.4)', color: 'var(--cyan-300)', opacity: (!form.term.trim() || saving) ? 0.5 : 1 }}
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
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '180px 1fr 90px 80px 70px 80px 100px',
          gap: 12, padding: '10px 16px',
          borderBottom: '1px solid var(--border-default)',
          background: 'var(--bg-raised)',
        }}>
          {[L.term, L.category, L.priority, L.color, L.matches, L.enabled, L.actions].map(h => (
            <div key={h} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>{L.loading}</div>
        ) : keywords.length === 0 ? (
          <EmptyState lang={lang} />
        ) : (
          <div>
            {keywords.map((kw, i) => (
              <div key={kw.id}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="row-shimmer"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '180px 1fr 90px 80px 70px 80px 100px',
                    gap: 12, padding: '12px 16px',
                    borderBottom: '1px solid var(--border-default)',
                    alignItems: 'center',
                    opacity: kw.enabled ? 1 : 0.5,
                  }}
                >
                  {/* Term */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: kw.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {kw.term}
                    </span>
                  </div>
                  {/* Category */}
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{kw.category}</span>
                  {/* Priority */}
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 12,
                    background: `${PRIORITY_LABELS[kw.priority]?.color}15`,
                    color: PRIORITY_LABELS[kw.priority]?.color,
                    fontFamily: 'var(--font-mono)', fontWeight: 700,
                    width: 'fit-content',
                  }}>
                    {lang === 'ja' ? PRIORITY_LABELS[kw.priority]?.ja : PRIORITY_LABELS[kw.priority]?.en}
                  </span>
                  {/* Color swatch */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 4, background: kw.color, border: '1px solid var(--border-default)' }} />
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{kw.color}</span>
                  </div>
                  {/* Match count */}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--cyan-300)' }}>
                    {kw.match_count}
                  </span>
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(kw)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: kw.enabled ? 'var(--green)' : 'var(--text-muted)' }}
                  >
                    {kw.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => startEdit(kw)}
                      style={{ ...btnBase, padding: '4px 8px', background: 'transparent', color: 'var(--cyan-300)' }}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(kw.id)}
                      style={{ ...btnBase, padding: '4px 8px', background: 'transparent', color: 'var(--red)', borderColor: 'transparent' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>

                {/* Inline Edit Form */}
                <AnimatePresence>
                  {editId === kw.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        overflow: 'hidden',
                        background: 'var(--bg-raised)',
                        borderBottom: '1px solid var(--border-default)',
                        padding: '16px',
                      }}
                    >
                      <KeywordForm form={form} setForm={setForm} lang={lang} L={L} />
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button
                          onClick={() => handleEdit(kw)}
                          disabled={saving || !form.term.trim()}
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
    </div>
  );
}

function KeywordForm({
  form,
  setForm,
  lang,
  L,
}: {
  form: {
    term: string;
    category: string;
    priority: number;
    color: string;
    condition_type: string;
    related_terms: string;
    exclude_terms: string;
  };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  lang: string;
  L: Record<string, string>;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{L.term} *</label>
          <input value={form.term} onChange={e => setForm(p => ({ ...p, term: e.target.value }))} placeholder={lang === 'ja' ? 'キーワード' : 'term'} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{L.category}</label>
          <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={{ ...selectStyle, width: '100%' }}>
            {['general', 'ma', 'finance', 'legal', 'hr', 'patent', 'realestate', 'other'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{L.priority}</label>
          <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: Number(e.target.value) }))} style={{ ...selectStyle, width: '100%' }}>
            <option value={1}>{lang === 'ja' ? '1 - 低' : '1 - Low'}</option>
            <option value={2}>{lang === 'ja' ? '2 - 中' : '2 - Mid'}</option>
            <option value={3}>{lang === 'ja' ? '3 - 高' : '3 - High'}</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{L.color}</label>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setForm(p => ({ ...p, color: c }))}
                style={{
                  width: 20, height: 20, borderRadius: 4, background: c,
                  border: form.color === c ? '2px solid white' : '2px solid transparent',
                  cursor: 'pointer', padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{L.relatedTerms}</label>
          <input value={form.related_terms} onChange={e => setForm(p => ({ ...p, related_terms: e.target.value }))} placeholder="term1, term2, ..." style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{L.excludeTerms}</label>
          <input value={form.exclude_terms} onChange={e => setForm(p => ({ ...p, exclude_terms: e.target.value }))} placeholder="term1, term2, ..." style={inputStyle} />
        </div>
      </div>
    </div>
  );
}
