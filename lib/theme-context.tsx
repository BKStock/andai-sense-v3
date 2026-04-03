'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'dark' | 'light'
type Lang = 'ja' | 'en'

interface AppContextType {
  theme: Theme
  lang: Lang
  toggleTheme: () => void
  toggleLang: () => void
  t: (key: string) => string
}

const translations: Record<Lang, Record<string, string>> = {
  ja: {
    'nav.dashboard': 'ダッシュボード',
    'nav.companies': '企業DB',
    'nav.map': '地図',
    'nav.matching': 'マッチング',
    'nav.outreach': '問い合わせ',
    'nav.ideas': 'アイデア',
    'nav.reports': 'レポート',
    'nav.crawlers': 'クローラー',
    'nav.alerts': 'アラート',
    'header.live': 'LIVE',
    'header.signals': 'シグナル',
    'dashboard.alerts': 'アラート',
    'dashboard.urgent': '緊急案件',
    'dashboard.entities': 'スキャン済み',
    'dashboard.signals': '新規シグナル',
    'dashboard.today': '今日',
    'dashboard.ranking': 'グローバルランキング',
    'table.company': '企業名',
    'table.sector': '業種',
    'table.prefecture': '都道府県',
    'table.score': 'スコア',
    'table.value': '推定価値',
    'search.placeholder': '企業名・業種・地域で検索...',
  },
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.companies': 'Companies',
    'nav.map': 'Map',
    'nav.matching': 'Matching',
    'nav.outreach': 'Outreach',
    'nav.ideas': 'Ideas',
    'nav.reports': 'Reports',
    'nav.crawlers': 'Crawlers',
    'nav.alerts': 'Alerts',
    'header.live': 'LIVE',
    'header.signals': 'signals',
    'dashboard.alerts': 'Alerts',
    'dashboard.urgent': 'Urgent Cases',
    'dashboard.entities': 'Entities Scored',
    'dashboard.signals': 'New Signals',
    'dashboard.today': 'Today',
    'dashboard.ranking': 'Global Ranking',
    'table.company': 'Company',
    'table.sector': 'Sector',
    'table.prefecture': 'Prefecture',
    'table.score': 'Score',
    'table.value': 'Est. Value',
    'search.placeholder': 'Search company, sector, region...',
  }
}

const AppContext = createContext<AppContextType>({
  theme: 'dark', lang: 'ja',
  toggleTheme: () => {}, toggleLang: () => {},
  t: (k) => k,
})

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [lang, setLang] = useState<Lang>('ja')

  useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') as Theme) ||
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    const savedLang = (localStorage.getItem('lang') as Lang) || 'ja'
    setTheme(savedTheme)
    setLang(savedLang)
    document.documentElement.setAttribute('data-theme', savedTheme)
    document.documentElement.lang = savedLang
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
    document.documentElement.style.transition = 'background-color 0.2s, color 0.2s'
  }

  const toggleLang = () => {
    const next = lang === 'ja' ? 'en' : 'ja'
    setLang(next)
    localStorage.setItem('lang', next)
    document.documentElement.lang = next
  }

  const t = (key: string) => translations[lang][key] ?? key

  return (
    <AppContext.Provider value={{ theme, lang, toggleTheme, toggleLang, t }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
