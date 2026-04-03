'use client';
import './globals.css';
import { Inter, JetBrains_Mono, Noto_Sans_JP } from 'next/font/google';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import CommandPalette from '@/components/layout/CommandPalette';
import { AICopilot } from '@/components/ai-copilot';
import { AppProvider } from '@/lib/theme-context';
import { useState, useEffect } from 'react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
const notoSansJP = Noto_Sans_JP({ subsets: ['latin'], variable: '--font-noto' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <html lang="ja" className={`${inter.variable} ${jetbrainsMono.variable} ${notoSansJP.variable}`}>
      <body style={{ background: 'var(--bg-base)', margin: 0 }}>
        <AppProvider>
          <Sidebar />
          <div style={{ marginLeft: 56 }}>
            <TopBar onOpenCommand={() => setCommandOpen(true)} />
            <main style={{ padding: 24, minHeight: 'calc(100vh - 48px)' }}>
              {children}
            </main>
          </div>
          <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
          <AICopilot />
        </AppProvider>
      </body>
    </html>
  );
}
