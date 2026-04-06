'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { companies, signalColors, signalLabels } from '@/lib/mock-data';

const urgencyColor: Record<string, string> = {
  CRITICAL: 'var(--red)',
  HIGH: 'var(--amber)',
  MEDIUM: '#8B5CF6',
  LOW: 'var(--text-muted)',
};

const urgencyOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export default function CompaniesPage() {
  const [query, setQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });

  const sectors = ['ALL', ...Array.from(new Set(companies.map(c => c.sector)))];
  const urgencies = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const filtered = companies
    .filter(c => {
      if (query && !c.name.includes(query) && !c.sector.includes(query) && !c.prefecture.includes(query)) return false;
      if (urgencyFilter !== 'ALL' && c.urgency !== urgencyFilter) return false;
      if (sectorFilter !== 'ALL' && c.sector !== sectorFilter) return false;
      return true;
    })
    .sort((a, b) => (urgencyOrder[a.urgency] ?? 9) - (urgencyOrder[b.urgency] ?? 9));

  const hoveredCompany = companies.find(c => c.id === hoveredId);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: '22px', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>
          企業データベース
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
          {companies.length}社 · シグナル検出済み
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
          borderRadius: '8px', padding: '8px 14px', maxWidth: '320px', flex: 1,
        }}>
          <Search size={14} color="var(--text-muted)" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="企業名・業種・都道府県..."
            style={{ background: 'none', border: 'none', outline: 'none', fontSize: '13px', color: 'var(--text-primary)', width: '100%' }}
          />
          {query && <X size={12} color="var(--text-muted)" onClick={() => setQuery('')} style={{ cursor: 'pointer' }} />}
        </div>

        <div style={{ display: 'flex', gap: '5px' }}>
          {urgencies.map(u => (
            <button
              key={u}
              onClick={() => setUrgencyFilter(u)}
              style={{
                fontSize: '11px', fontWeight: 600, padding: '5px 11px', borderRadius: '6px', cursor: 'pointer',
                fontFamily: 'var(--font-jetbrains-mono)', letterSpacing: '0.05em', transition: 'all 150ms',
                background: urgencyFilter === u ? (u === 'ALL' ? 'rgba(0,229,255,0.1)' : `${urgencyColor[u]}18`) : 'transparent',
                borderWidth: '1px', borderStyle: 'solid',
                borderColor: urgencyFilter === u ? (u === 'ALL' ? 'var(--cyan)' : urgencyColor[u]) : 'var(--border-default)',
                color: urgencyFilter === u ? (u === 'ALL' ? 'var(--cyan)' : urgencyColor[u]) : 'var(--text-muted)',
              }}
            >
              {u}
            </button>
          ))}
        </div>

        <select
          value={sectorFilter}
          onChange={e => setSectorFilter(e.target.value)}
          style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            borderRadius: '6px', padding: '6px 12px', fontSize: '12px',
            color: 'var(--text-secondary)', outline: 'none', cursor: 'pointer',
          }}
        >
          {sectors.map(s => <option key={s} value={s}>{s === 'ALL' ? '全業種' : s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-raised)' }}>
              {['企業名', '業種', '都道府県', 'スコア', '緊急度', 'シグナル', '推定価値', ''].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((company, idx) => (
                <motion.tr
                  key={company.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  style={{ borderBottom: '1px solid rgba(0,229,255,0.05)', cursor: 'pointer' }}
                  onMouseEnter={e => {
                    setHoveredId(company.id);
                    const rect = (e.currentTarget as HTMLTableRowElement).getBoundingClientRect();
                    setPopoverPos({ x: rect.right + 8, y: rect.top });
                    (e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg-hover)';
                  }}
                  onMouseLeave={e => {
                    setHoveredId(null);
                    (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                  }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{company.name}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>{company.sector}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>{company.prefecture}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontFamily: 'var(--font-jetbrains-mono)', fontSize: '15px', fontWeight: 800,
                      color: company.score >= 80 ? 'var(--cyan)' : company.score >= 60 ? 'var(--amber)' : 'var(--red)',
                    }}>{company.score}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, color: urgencyColor[company.urgency],
                      background: `${urgencyColor[company.urgency]}18`,
                      borderWidth: '1px', borderStyle: 'solid', borderColor: `${urgencyColor[company.urgency]}40`,
                      borderRadius: '4px', padding: '2px 7px', letterSpacing: '0.06em', fontFamily: 'var(--font-jetbrains-mono)',
                    }}>{company.urgency}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '200px' }}>
                      {company.signals.map(sig => (
                        <span key={sig} style={{
                          fontSize: '9px', color: signalColors[sig],
                          background: `${signalColors[sig]}18`,
                          borderWidth: '1px', borderStyle: 'solid', borderColor: `${signalColors[sig]}35`,
                          borderRadius: '3px', padding: '1px 5px', whiteSpace: 'nowrap',
                        }}>{signalLabels[sig]}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: '13px', color: 'var(--green)', fontWeight: 600 }}>
                      {company.value}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Link href={`/companies/${company.id}`} style={{
                      fontSize: '11px', color: 'var(--cyan)', textDecoration: 'none',
                      borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(0,229,255,0.25)',
                      borderRadius: '4px', padding: '3px 8px', whiteSpace: 'nowrap',
                    }}>詳細 →</Link>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            条件に合う企業が見つかりません
          </div>
        )}
      </div>

      {/* Hover popover */}
      <AnimatePresence>
        {hoveredCompany && (
          <motion.div
            key="popover"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'fixed',
              left: Math.min(popoverPos.x, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 280),
              top: Math.max(8, popoverPos.y - 20),
              zIndex: 200, width: '260px',
              background: 'var(--bg-raised)',
              borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(0,229,255,0.25)',
              borderRadius: '10px', padding: '16px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {hoveredCompany.name}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              {[
                { l: '業種', v: hoveredCompany.sector },
                { l: '都道府県', v: hoveredCompany.prefecture },
                { l: 'スコア', v: `${hoveredCompany.score}`, mono: true, color: 'var(--cyan)' },
                { l: '価値', v: hoveredCompany.value, mono: true, color: 'var(--green)' },
              ].map(item => (
                <div key={item.l}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.l}</div>
                  <div style={{
                    fontSize: '12px', color: item.color || 'var(--text-secondary)',
                    fontFamily: item.mono ? 'var(--font-jetbrains-mono)' : undefined,
                    fontWeight: item.mono ? 700 : 400,
                  }}>{item.v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {hoveredCompany.signals.map(sig => (
                <span key={sig} style={{
                  fontSize: '9px', color: signalColors[sig],
                  background: `${signalColors[sig]}18`,
                  borderWidth: '1px', borderStyle: 'solid', borderColor: `${signalColors[sig]}35`,
                  borderRadius: '3px', padding: '2px 6px',
                }}>{signalLabels[sig]}</span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
