'use client';
import { BarChart3 } from 'lucide-react';

export default function Reports() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <BarChart3 size={20} style={{ color: 'var(--cyan-300)' }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>レポート</h1>
      </div>
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <div style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8 }}>レポート機能は準備中です</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>AI分析レポートの自動生成機能を開発中です</div>
      </div>
    </div>
  );
}
