# &AI SENSE

> 85サイト以上の日本M&A・事業情報を24時間自動監視し、AIがディール候補を自動スコアリングするビジネスインテリジェンスプラットフォーム

## 🎯 概要

M&Aアドバイザー・PE・事業会社向けに、国内85以上のM&A/事業譲渡サイトをクロール。
AIがディール候補を自動分類・スコアリングし、最適なマッチング候補をリアルタイムで提示する。
andai-sense（バックエンド）+ andai-sense-v3（フロント）の統合版。

## ✨ 主な機能

- **24時間自動クロール** — 85+サイトを継続監視・差分検出
- **AIディールスコアリング** — 事業規模・業種・地域でAI自動分類
- **企業マッチングアルゴリズム** — 買い手条件に最適な案件を自動提案
- **センチメント分析 & トレンド追跡** — 市場動向・価格帯変化を可視化
- **ディールパイプライン管理** — Kanbanボードで商談進捗を管理
- **リアルタイムアラート** — Slack/LINE連携で即時通知

## 🛠️ 技術スタック

- **フロントエンド:** Next.js 16 + React 19 + TypeScript (strict) + Tailwind CSS 4 + Framer Motion + Recharts
- **バックエンド:** Python FastAPI（クローラーエンジン、Port 8002）
- **DB:** SQLite（4層スキーマ: 生HTML→パース→集計→ユーザー操作）/ 3MB本番データ
- **LLM:** Ollama/Qwen3（ローカル, Port 11434）+ OpenAI / Claude API
- **インフラ:** Vercel（フロント）/ ngrok（バックエンドトンネル）

## 🌐 URL

- **本番:** https://bk-sense.ngrok.app
- **Vercel:** https://andai-sense-v3.vercel.app
- **開発:** http://localhost:3000（フロント）/ http://localhost:8002（クローラーAPI）

## 📊 ステータス

🟡 開発中 — フロントエンドMVP完成、フロント/バックエンド統合進行中（最終コミット: 2026-04-05）

## 🔗 関連プロジェクト

- **統合元:** andai-sense-v3（andai-sense v1からニュース監視機能をマージ済み）
- **連携先:** &AI BRAIN（市場インサイト活用）

## 📁 プロジェクト構造

```
├── app/
│   ├── page.tsx              # ダッシュボード（実統計データ）
│   ├── articles/             # ニュース記事（実SQLiteデータ）
│   ├── companies/            # 企業一覧・詳細ページ
│   ├── matching/             # M&Aマッチングアルゴリズム
│   ├── pipeline/             # ディール Kanbanボード
│   ├── sentiment/            # センチメント分析チャート
│   ├── trends/               # トレンド追跡
│   └── api/                  # APIルート（news/ai/companies/crawlers/stats/health）
├── components/               # React コンポーネント
├── crawler_backend/
│   ├── main.py               # FastAPI クローラーサーバー（85+サイト対応）
│   ├── database.py           # SQLite 4層スキーマ管理
│   ├── sense.db              # 本番データ（3MB）
│   └── start.sh              # 起動スクリプト
└── types/                    # TypeScript 型定義
```

## 🚀 開始方法

```bash
# フロントエンド
pnpm install
pnpm dev

# クローラーバックエンド（別ターミナル）
cd crawler_backend
pip install -r requirements.txt
./start.sh
# または: python -m uvicorn main:app --host 0.0.0.0 --port 8002

# ローカルLLM（任意）
ollama run qwen3
```

---
*BKグループ &AI ブランド / 2026-04-06*
