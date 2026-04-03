'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navItems = [
  { icon: '🏠', label: 'ホーム', href: '/' },
  { icon: '🏢', label: '企業DB', href: '/companies' },
  { icon: '🗺️', label: '地図', href: '/map' },
  { icon: '🎯', label: 'マッチング', href: '/matching' },
  { icon: '📨', label: '問い合わせ', href: '/outreach' },
  { icon: '💡', label: 'アイデア', href: '/ideas' },
  { icon: '📊', label: 'レポート', href: '/reports' },
  { icon: '⚙️', label: 'クローラー', href: '/crawler' },
  { icon: '🔔', label: 'アラート', href: '/alerts' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        width: expanded ? 256 : 56,
        transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-default)',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{
        height: 48,
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        borderBottom: '1px solid var(--border-default)',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 20,
          fontWeight: 800,
          color: 'var(--cyan-300)',
          fontFamily: 'var(--font-syne)',
          whiteSpace: 'nowrap',
        }}>
          {expanded ? '&AI' : '⚛'}
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 16px',
                margin: '2px 6px',
                borderRadius: 8,
                textDecoration: 'none',
                color: isActive ? 'var(--cyan-300)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(0, 229, 255, 0.1)' : 'transparent',
                transition: 'all 200ms',
                whiteSpace: 'nowrap',
                fontSize: 14,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0, width: 24, textAlign: 'center' }}>{item.icon}</span>
              <span style={{
                opacity: expanded ? 1 : 0,
                transition: 'opacity 200ms',
                fontFamily: 'var(--font-noto)',
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border-default)',
        flexShrink: 0,
      }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--cyan-400), var(--cyan-500))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--bg-void)',
        }}>
          KK
        </div>
      </div>
    </aside>
  );
}
