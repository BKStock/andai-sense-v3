'use client';
import { useState } from 'react';
import { outreachDrafts, outreachSent, outreachReplies } from '@/lib/mock-data';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Edit, SkipForward, Mail, X } from 'lucide-react';

type TabKey = 'draft' | 'sent' | 'replied' | 'templates';

const tabs: { key: TabKey; label: string; count: number; dot?: boolean }[] = [
  { key: 'draft', label: '送信待ち', count: 47 },
  { key: 'sent', label: '送信済み', count: 12 },
  { key: 'replied', label: '返信あり', count: 3, dot: true },
  { key: 'templates', label: 'テンプレート', count: 0 },
];

export default function OutreachCenter() {
  const [activeTab, setActiveTab] = useState<TabKey>('draft');
  const [confirmModal, setConfirmModal] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<number>>(new Set());

  const handleSend = (company: string) => {
    setConfirmModal(company);
  };

  const confirmSend = () => {
    setConfirmModal(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Mail size={20} style={{ color: 'var(--cyan-300)' }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>問い合わせセンター</h1>
      </div>

      {/* Tab Bar */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24, padding: 4,
        background: 'var(--bg-surface)', borderRadius: 12,
        border: '1px solid var(--border-default)',
        position: 'sticky', top: 48, zIndex: 20,
      }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
              background: activeTab === t.key ? 'var(--bg-hover)' : 'transparent',
              color: activeTab === t.key ? 'var(--cyan-300)' : 'var(--text-secondary)',
              fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6,
              transition: 'all 200ms',
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 10,
                background: activeTab === t.key ? 'rgba(0,229,255,0.2)' : 'var(--bg-raised)',
                fontFamily: 'var(--font-mono)',
              }}>{t.count}</span>
            )}
            {t.dot && (
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)',
                animation: 'pulse 2s ease-in-out infinite',
              }} />
            )}
          </button>
        ))}
      </div>

      {/* Draft Cards */}
      {activeTab === 'draft' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {outreachDrafts.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card"
              style={{ padding: 20 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{d.company}</div>
                  <div style={{ fontSize: 13, color: 'var(--cyan-300)', marginTop: 4 }}>{d.subject}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{d.date}</div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>{d.preview}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleSend(d.company)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
                  background: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.2)',
                  color: 'var(--cyan-300)', fontSize: 12, cursor: 'pointer',
                }}>
                  <Send size={12} /> 送信
                </button>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
                  background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
                }}>
                  <Edit size={12} /> 編集
                </button>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
                  background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
                  color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
                }}>
                  <SkipForward size={12} /> スキップ
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Sent */}
      {activeTab === 'sent' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {outreachSent.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{d.company}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{d.subject}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{d.date}</div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{d.preview}</div>
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>✓ 送信完了</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Replies */}
      {activeTab === 'replied' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {outreachReplies.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card" style={{ padding: 20, borderLeft: '4px solid var(--amber)', background: 'rgba(255, 184, 0, 0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{d.company}</div>
                  <div style={{ fontSize: 13, color: 'var(--amber)', marginTop: 4 }}>{d.subject}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{d.date}</div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{d.preview}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Templates */}
      {activeTab === 'templates' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)' }}>
          テンプレート機能は準備中です
        </div>
      )}

      {/* Send Confirmation Modal */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmModal(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(1, 2, 5, 0.6)',
              backdropFilter: 'blur(20px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                borderRadius: 16, padding: 32, maxWidth: 420, width: '100%',
                boxShadow: '0 25px 50px rgba(0,0,0,0.8)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>送信確認</div>
                <X size={20} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setConfirmModal(null)} />
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>
                <strong style={{ color: 'var(--text-primary)' }}>{confirmModal}</strong> に問い合わせメールを送信します。よろしいですか？
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={confirmSend}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 10,
                    background: 'var(--cyan-300)', color: 'var(--bg-void)',
                    fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer',
                  }}
                >
                  送信する
                </button>
                <button
                  onClick={() => setConfirmModal(null)}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 10,
                    background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  }}
                >
                  キャンセル
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
