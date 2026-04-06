'use client'
import { useState } from 'react'

export function AICopilot() {
  const [command, setCommand] = useState('')
  const [logs, setLogs] = useState<string[]>(['AIコパイロット準備完了 ✅'])
  const [isRunning, setIsRunning] = useState(false)

  const handleExecute = async () => {
    if (!command.trim()) return
    setIsRunning(true)
    setLogs(prev => [...prev, `⏳ 実行: "${command}"`])
    
    try {
      // page-agentはクライアントサイドのみ
      const { PageAgent } = await import('page-agent')
      const agent = new PageAgent({
        model: 'claude-haiku-4-5',
        apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '',
        baseURL: 'https://api.anthropic.com',
      })

      setLogs(prev => [...prev, '🔍 ページを解析中...'])
      await agent.execute(command)
      setLogs(prev => [...prev, '✅ 完了！'])
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message?.slice(0, 50) : String(e)
      setLogs(prev => [...prev, `⚠️ APIキーを設定してください: ${msg}`])
    } finally {
      setIsRunning(false)
      setCommand('')
    }
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 rounded-xl shadow-2xl overflow-hidden"
         style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2"
           style={{ background: 'var(--cyan-300)', color: 'white' }}>
        <span>🤖</span>
        <span className="font-semibold text-sm">AI コパイロット</span>
        <span className="ml-auto text-xs opacity-70">page-agent</span>
      </div>
      
      {/* Log */}
      <div className="p-3 h-32 overflow-y-auto text-xs font-mono"
           style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
        {logs.map((log, i) => (
          <div key={i} className="mb-1">{log}</div>
        ))}
      </div>
      
      {/* Input */}
      <div className="p-3 flex gap-2" style={{ background: 'var(--bg-raised)' }}>
        <input
          value={command}
          onChange={e => setCommand(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleExecute()}
          placeholder="例: スコア90以上に問い合わせして"
          className="flex-1 text-xs px-3 py-2 rounded-lg outline-none"
          style={{ 
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)'
          }}
        />
        <button
          onClick={handleExecute}
          disabled={isRunning}
          className="px-3 py-2 rounded-lg text-xs font-medium text-white disabled:opacity-50"
          style={{ background: 'var(--cyan-300)' }}
        >
          {isRunning ? '...' : '実行'}
        </button>
      </div>
    </div>
  )
}
