'use client';

import { useEffect, useRef, useState } from 'react';
import { signalLabels, signalColors, companies } from '@/lib/mock-data';

interface FeedItem {
  id: number;
  companyName: string;
  signal: string;
  time: string;
  isNew: boolean;
}

function generateItem(id: number): FeedItem {
  const company = companies[Math.floor(Math.random() * companies.length)];
  const signal = company.signals[Math.floor(Math.random() * company.signals.length)];
  const mins = Math.floor(Math.random() * 59) + 1;
  return {
    id,
    companyName: company.name,
    signal,
    time: `${mins}分前`,
    isNew: true,
  };
}

export function LiveFeed() {
  const [items, setItems] = useState<FeedItem[]>(() =>
    Array.from({ length: 12 }, (_, i) => ({ ...generateItem(i), isNew: false, time: `${(i + 1) * 3}分前` }))
  );
  const [paused, setPaused] = useState(false);
  const nextId = useRef(100);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      const newItem = generateItem(nextId.current++);
      setItems(prev => [newItem, ...prev.slice(0, 19)]);
      setTimeout(() => {
        setItems(prev => prev.map(it => it.id === newItem.id ? { ...it, isNew: false } : it));
      }, 800);
    }, 2500);
    return () => clearInterval(interval);
  }, [paused]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        padding: '4px',
      }}
    >
      {items.map(item => (
        <div
          key={item.id}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: '6px',
            background: item.isNew ? 'rgba(0,229,255,0.08)' : 'transparent',
            border: `1px solid ${item.isNew ? 'rgba(0,229,255,0.2)' : 'transparent'}`,
            transition: 'background 600ms ease, border 600ms ease',
          }}
        >
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: signalColors[item.signal] || 'var(--text-muted)',
            flexShrink: 0,
            marginTop: '4px',
            boxShadow: `0 0 6px ${signalColors[item.signal] || 'transparent'}`,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '12px',
              color: 'var(--text-primary)',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {item.companyName}
            </div>
            <div style={{
              fontSize: '11px',
              color: signalColors[item.signal] || 'var(--text-muted)',
              marginTop: '2px',
            }}>
              {signalLabels[item.signal] || item.signal}
            </div>
          </div>
          <div style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-jetbrains-mono)',
            flexShrink: 0,
          }}>
            {item.time}
          </div>
        </div>
      ))}
    </div>
  );
}
