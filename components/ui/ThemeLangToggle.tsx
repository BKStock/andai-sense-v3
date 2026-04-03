'use client'
import { useApp } from '@/lib/theme-context'

export function ThemeLangToggle() {
  const { theme, lang, toggleTheme, toggleLang } = useApp()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* Language toggle */}
      <button
        onClick={toggleLang}
        style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '4px 10px',
          borderRadius: '6px',
          border: '1px solid var(--border-default)',
          background: 'transparent',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 600,
          transition: 'all 0.15s',
        }}
        title={lang === 'ja' ? 'Switch to English' : '日本語に切替'}
      >
        {lang === 'ja' ? '🇯🇵 JP' : '🇺🇸 EN'}
      </button>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '32px', height: '32px',
          borderRadius: '6px',
          border: '1px solid var(--border-default)',
          background: 'transparent',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: '16px',
          transition: 'all 0.15s',
        }}
        title={theme === 'dark' ? 'ライトモード' : 'ダークモード'}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  )
}
