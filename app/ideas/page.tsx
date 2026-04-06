'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Star, Lightbulb, Target, TrendingUp, X } from 'lucide-react';

type IdeaCategory = 'ALL' | 'アプローチ' | '分析手法' | 'ツール改善' | 'データ源';

interface Idea {
  id: number;
  title: string;
  body: string;
  category: Exclude<IdeaCategory, 'ALL'>;
  starred: boolean;
  votes: number;
  date: string;
}

const initialIdeas: Idea[] = [
  { id: 1, title: 'LinkedInスクレイピングで退職者追跡', body: 'LinkedInの人事変動をクロールし、CTO・CFOの退職を事前キャッチする仕組みを構築する', category: 'データ源', starred: true, votes: 12, date: '3日前' },
  { id: 2, title: '税務署データとの連携', body: '国税庁の滞納公告をリアルタイムで取り込み、TAX_DELINQUENTシグナルの精度向上', category: 'データ源', starred: false, votes: 9, date: '5日前' },
  { id: 3, title: 'ウォームアップメール自動生成', body: 'GPTを使い、各企業のシグナルに合わせたパーソナライズされた初回アプローチ文を自動生成', category: 'アプローチ', starred: true, votes: 18, date: '1日前' },
  { id: 4, title: 'スコアリングモデルの改善', body: '現在の線形スコアをML（XGBoost）に変更し、過去の成約データで学習させる', category: '分析手法', starred: false, votes: 7, date: '1週間前' },
  { id: 5, title: 'Slack通知の即時アラート', body: 'CRITICALシグナルをSlackの専用チャンネルにプッシュ通知し、対応速度を向上', category: 'ツール改善', starred: false, votes: 14, date: '2日前' },
  { id: 6, title: '競合M&A動向トラッカー', body: '他のM&A仲介会社の動きをウォッチし、ターゲット企業への先手アプローチを実現', category: 'アプローチ', starred: true, votes: 21, date: '4日前' },
  { id: 7, title: 'OCR領収書解析', body: '法人登記書類のOCR処理で財務状態をより詳細に把握する', category: '分析手法', starred: false, votes: 5, date: '2週間前' },
  { id: 8, title: 'Googleマップレビュー解析', body: 'レビュー文のセンチメント解析でNEGATIVE_SENTIMENTの精度向上', category: 'データ源', starred: false, votes: 11, date: '6日前' },
];

const categoryIcon: Record<Exclude<IdeaCategory, 'ALL'>, React.ReactNode> = {
  'アプローチ': <Target size={12} />,
  '分析手法': <TrendingUp size={12} />,
  'ツール改善': <Lightbulb size={12} />,
  'データ源': <Star size={12} />,
};

const categoryColor: Record<Exclude<IdeaCategory, 'ALL'>, string> = {
  'アプローチ': 'var(--cyan-300)',
  '分析手法': 'var(--green)',
  'ツール改善': 'var(--amber)',
  'データ源': '#8B5CF6',
};

export default function IdeasPage() {
  const [filter, setFilter] = useState<IdeaCategory>('ALL');
  const [ideas, setIdeas] = useState<Idea[]>(initialIdeas);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newCat, setNewCat] = useState<Exclude<IdeaCategory, 'ALL'>>('アプローチ');

  const filters: IdeaCategory[] = ['ALL', 'アプローチ', '分析手法', 'ツール改善', 'データ源'];

  const filtered = ideas
    .filter(i => filter === 'ALL' || i.category === filter)
    .sort((a, b) => b.votes - a.votes);

  const toggleStar = (id: number) => {
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, starred: !i.starred } : i));
  };

  const vote = (id: number) => {
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, votes: i.votes + 1 } : i));
  };

  const addIdea = () => {
    if (!newTitle.trim()) return;
    setIdeas(prev => [{
      id: Date.now(), title: newTitle, body: newBody,
      category: newCat, starred: false, votes: 0, date: 'たった今',
    }, ...prev]);
    setNewTitle(''); setNewBody(''); setShowNew(false);
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: '22px', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>
            アイデアボード
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>改善・機能リクエスト</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '9px 16px', borderRadius: '8px', cursor: 'pointer',
            background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.3)',
            color: 'var(--cyan-300)', fontSize: '12px', fontWeight: 600,
          }}
        >
          <Plus size={13} /> アイデア追加
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
              background: filter === f ? (f === 'ALL' ? 'rgba(0,229,255,0.15)' : `${categoryColor[f as Exclude<IdeaCategory, 'ALL'>]}18`) : 'var(--bg-surface)',
              border: `1px solid ${filter === f ? (f === 'ALL' ? 'rgba(0,229,255,0.4)' : categoryColor[f as Exclude<IdeaCategory, 'ALL'>]) : 'var(--border-default)'}`,
              color: filter === f ? (f === 'ALL' ? 'var(--cyan-300)' : categoryColor[f as Exclude<IdeaCategory, 'ALL'>]) : 'var(--text-secondary)',
              transition: 'all 150ms',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* New idea form */}
      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: 'var(--bg-surface)', border: '1px solid rgba(0,229,255,0.25)',
              borderRadius: '12px', padding: '20px', overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>新しいアイデア</span>
              <X size={14} color="var(--text-muted)" onClick={() => setShowNew(false)} style={{ cursor: 'pointer' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="タイトル..."
                style={{
                  background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
                  borderRadius: '6px', padding: '9px 12px', fontSize: '13px', color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
              <textarea
                value={newBody}
                onChange={e => setNewBody(e.target.value)}
                placeholder="詳細説明..."
                rows={3}
                style={{
                  background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
                  borderRadius: '6px', padding: '9px 12px', fontSize: '12px', color: 'var(--text-primary)',
                  outline: 'none', resize: 'vertical', fontFamily: 'var(--font-inter)',
                }}
              />
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select
                  value={newCat}
                  onChange={e => setNewCat(e.target.value as Exclude<IdeaCategory, 'ALL'>)}
                  style={{
                    background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
                    borderRadius: '6px', padding: '7px 10px', fontSize: '12px', color: 'var(--text-secondary)', outline: 'none',
                  }}
                >
                  {filters.filter(f => f !== 'ALL').map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <button
                  onClick={addIdea}
                  style={{
                    padding: '8px 20px', borderRadius: '6px', cursor: 'pointer',
                    background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.3)',
                    color: 'var(--cyan-300)', fontSize: '12px', fontWeight: 600,
                  }}
                >
                  追加
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Masonry grid */}
      <div style={{
        columns: 'auto 280px', columnGap: '14px',
      }}>
        <AnimatePresence>
          {filtered.map((idea, i) => (
            <motion.div
              key={idea.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.04 }}
              style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                borderRadius: '10px', padding: '16px', marginBottom: '14px',
                breakInside: 'avoid', display: 'inline-block', width: '100%',
                borderTop: `2px solid ${categoryColor[idea.category]}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  fontSize: '10px', color: categoryColor[idea.category],
                  background: `${categoryColor[idea.category]}15`, borderRadius: '4px', padding: '2px 7px',
                }}>
                  {categoryIcon[idea.category]} {idea.category}
                </span>
                <button
                  onClick={() => toggleStar(idea.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                >
                  {idea.starred ? '⭐' : '☆'}
                </button>
              </div>

              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.4 }}>
                {idea.title}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.6 }}>
                {idea.body}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{idea.date}</span>
                <button
                  onClick={() => vote(idea.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    background: 'none', border: '1px solid var(--border-default)', borderRadius: '6px',
                    padding: '3px 10px', cursor: 'pointer',
                    fontSize: '11px', color: 'var(--text-secondary)',
                  }}
                >
                  ▲ <span style={{ fontFamily: 'var(--font-mono)' }}>{idea.votes}</span>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
