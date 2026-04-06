'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Search, Home, Building2, Map, Target, Mail, Lightbulb, BarChart3, Settings, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { companies } from '@/lib/mock-data';
import { motion, AnimatePresence } from 'framer-motion';

const commands = [
  { icon: Home, label: 'ホーム', action: '/' },
  { icon: Building2, label: '企業データベース', action: '/companies' },
  { icon: Map, label: '地図ビュー', action: '/map' },
  { icon: Target, label: 'マッチング', action: '/matching' },
  { icon: Mail, label: '問い合わせ', action: '/outreach' },
  { icon: Lightbulb, label: 'アイデアボード', action: '/ideas' },
  { icon: BarChart3, label: 'レポート', action: '/reports' },
  { icon: Settings, label: 'クローラー', action: '/crawler' },
  { icon: Bell, label: 'アラート', action: '/alerts' },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCompanies = companies.filter(c =>
    c.name.includes(query) || c.sector.includes(query) || c.prefecture.includes(query)
  ).slice(0, 5);

  const filteredCommands = commands.filter(c =>
    c.label.includes(query) || query === ''
  );

  const allItems = useMemo(() => [
    ...companies
      .filter(c => c.name.includes(query) || c.sector.includes(query) || c.prefecture.includes(query))
      .slice(0, 5)
      .map(c => ({ type: 'company' as const, id: c.id, label: c.name, sub: `${c.sector} · ${c.prefecture}`, action: `/companies/${c.id}` })),
    ...commands
      .filter(c => c.label.includes(query) || query === '')
      .map(c => ({ type: 'command' as const, id: c.label, label: c.label, sub: '', action: c.action })),
  ], [query]);

  const handleSelect = useCallback((action: string) => {
    router.push(action);
    onClose();
    setQuery('');
  }, [router, onClose]);

  // Intentionally reset selection when query changes — handled in onChange

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, allItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && allItems[selectedIndex]) {
        e.preventDefault();
        handleSelect(allItems[selectedIndex].action);
      } else if (e.key === 'Escape') {
        onClose();
        setQuery('');
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, selectedIndex, allItems, handleSelect, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(1, 2, 5, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '20vh',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 640,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 16,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), var(--glow-cyan-md)',
              overflow: 'hidden',
            }}
          >
            {/* Search Input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-default)',
            }}>
              <Search size={18} style={{ color: 'var(--cyan-300)', flexShrink: 0 }} />
              <input
                autoFocus
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                placeholder="企業名、コマンドを検索..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: 16,
                  fontFamily: 'var(--font-noto), var(--font-inter)',
                }}
              />
              <kbd style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 4,
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}>
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div style={{ maxHeight: 400, overflowY: 'auto', padding: '8px' }}>
              {filteredCompanies.length > 0 && (
                <>
                  <div style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    padding: '8px 12px 4px',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}>
                    企業
                  </div>
                  {filteredCompanies.map((company, i) => {
                    const idx = i;
                    return (
                      <div
                        key={company.id}
                        onClick={() => handleSelect(`/companies/${company.id}`)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 12px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          background: selectedIndex === idx ? 'var(--bg-hover)' : 'transparent',
                          color: selectedIndex === idx ? 'var(--cyan-300)' : 'var(--text-primary)',
                          transition: 'all 100ms',
                        }}
                      >
                        <Building2 size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 14 }}>{company.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {company.sector} · {company.prefecture} · スコア {company.score}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              <div style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                padding: '12px 12px 4px',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}>
                コマンド
              </div>
              {filteredCommands.map((cmd, i) => {
                const idx = filteredCompanies.length + i;
                const Icon = cmd.icon;
                return (
                  <div
                    key={cmd.label}
                    onClick={() => handleSelect(cmd.action)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: selectedIndex === idx ? 'var(--bg-hover)' : 'transparent',
                      color: selectedIndex === idx ? 'var(--cyan-300)' : 'var(--text-primary)',
                      transition: 'all 100ms',
                    }}
                  >
                    <Icon size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <span style={{ fontSize: 14 }}>{cmd.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
