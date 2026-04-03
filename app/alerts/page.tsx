'use client';
import { useState } from 'react';
import { alerts, companies, signalTypes } from '@/lib/mock-data';
import { motion } from 'framer-motion';
import { Bell, Plus } from 'lucide-react';

export default function AlertsPage() {
  const [alertList, setAlertList] = useState(alerts);
  const [newAlert, setNewAlert] = useState({
    company: companies[0].name,
    condition: 'SCORE_ABOVE',
    threshold: '80',
    notification: 'email',
  });

  const toggleAlert = (id: number) => {
    setAlertList(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Bell size={20} style={{ color: 'var(--cyan-300)' }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>アラート管理</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 24 }}>
        {/* LEFT: Active Alerts */}
        <div>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 16 }}>
            ACTIVE ALERTS ({alertList.filter(a => a.enabled).length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alertList.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card"
                style={{
                  padding: '16px 20px',
                  opacity: a.enabled ? 1 : 0.5,
                  borderLeft: `3px solid ${a.enabled ? (a.isNew ? 'var(--cyan-300)' : 'var(--text-muted)') : 'var(--bg-raised)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{a.company}</span>
                      {a.isNew && (
                        <span style={{
                          fontSize: 9, padding: '1px 6px', borderRadius: 4,
                          background: 'rgba(0, 229, 255, 0.15)', color: 'var(--cyan-300)',
                          fontFamily: 'var(--font-mono)',
                        }}>新着</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.condition}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                      Last: {a.lastTriggered}
                    </div>
                  </div>
                  {/* Toggle */}
                  <div
                    onClick={() => toggleAlert(a.id)}
                    style={{
                      width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                      background: a.enabled ? 'var(--cyan-300)' : 'var(--bg-raised)',
                      border: '1px solid var(--border-default)',
                      position: 'relative', transition: 'background 200ms',
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: a.enabled ? 'var(--bg-void)' : 'var(--text-muted)',
                      position: 'absolute', top: 1,
                      left: a.enabled ? 22 : 1,
                      transition: 'left 200ms',
                    }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* RIGHT: New Alert Form */}
        <div className="card" style={{ padding: 24, height: 'fit-content', position: 'sticky', top: 72 }}>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 20 }}>
            NEW ALERT
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>企業</label>
            <select
              value={newAlert.company}
              onChange={e => setNewAlert(prev => ({ ...prev, company: e.target.value }))}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
                color: 'var(--text-primary)', fontSize: 13, outline: 'none',
              }}
            >
              <option value="全企業">全企業</option>
              {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>条件</label>
            <select
              value={newAlert.condition}
              onChange={e => setNewAlert(prev => ({ ...prev, condition: e.target.value }))}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
                color: 'var(--text-primary)', fontSize: 13, outline: 'none',
              }}
            >
              <option value="SCORE_ABOVE">スコア超過</option>
              <option value="NEW_SIGNAL">新規シグナル検知</option>
              <option value="URGENCY_CHANGE">緊急度変更</option>
              {signalTypes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>しきい値</label>
            <input
              value={newAlert.threshold}
              onChange={e => setNewAlert(prev => ({ ...prev, threshold: e.target.value }))}
              placeholder="80"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
                color: 'var(--text-primary)', fontSize: 13, outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>通知方法</label>
            <select
              value={newAlert.notification}
              onChange={e => setNewAlert(prev => ({ ...prev, notification: e.target.value }))}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
                color: 'var(--text-primary)', fontSize: 13, outline: 'none',
              }}
            >
              <option value="email">Email</option>
              <option value="webhook">Webhook</option>
              <option value="slack">Slack</option>
            </select>
          </div>

          <button style={{
            width: '100%', padding: '14px 0', borderRadius: 10,
            background: 'var(--cyan-300)', color: 'var(--bg-void)',
            fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Plus size={16} />
            アラート作成
          </button>
        </div>
      </div>
    </div>
  );
}
