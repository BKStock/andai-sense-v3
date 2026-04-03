'use client';
import { Search, Bell } from 'lucide-react';
import { ThemeLangToggle } from '@/components/ui/ThemeLangToggle';

interface TopBarProps {
  onOpenCommand: () => void;
}

export default function TopBar({ onOpenCommand }: TopBarProps) {
  return (
    <header style={{
      height: 48,
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-default)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      backdropFilter: 'blur(12px)',
    }}>
      {/* Left: Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontFamily: 'var(--font-syne)',
          fontWeight: 800,
          fontSize: 16,
          color: 'var(--cyan-300)',
          letterSpacing: '-0.02em',
        }}>
          &AI SENSE
        </span>
        <span style={{
          fontSize: 10,
          color: 'var(--text-muted)',
          background: 'var(--bg-raised)',
          padding: '2px 6px',
          borderRadius: 4,
          fontFamily: 'var(--font-mono)',
        }}>
          v3
        </span>
      </div>

      {/* Center: Search */}
      <button
        onClick={onOpenCommand}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--bg-raised)',
          border: '1px solid var(--border-default)',
          borderRadius: 8,
          padding: '6px 16px',
          color: 'var(--text-muted)',
          fontSize: 13,
          cursor: 'pointer',
          minWidth: 280,
        }}
      >
        <Search size={14} />
        <span>検索...</span>
        <span style={{
          marginLeft: 'auto',
          fontSize: 11,
          background: 'var(--bg-overlay)',
          padding: '1px 6px',
          borderRadius: 4,
          fontFamily: 'var(--font-mono)',
        }}>
          ⌘K
        </span>
      </button>

      {/* Right: Live + Bell + Toggles + Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <ThemeLangToggle />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            className="animate-live-pulse"
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#FF3B3B',
            }}
          />
          <span style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            letterSpacing: '0.05em',
          }}>
            ⊙ LIVE
          </span>
        </div>
        <Bell size={16} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} />
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--cyan-400), var(--cyan-500))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--bg-void)',
        }}>
          KK
        </div>
      </div>
    </header>
  );
}
