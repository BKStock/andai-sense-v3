"""
&AI SENSE - AIクローラーバックエンド（4層DB版）
Qwen3 30B（ローカル）でM&A情報を自動分析・スコアリング・蓄積
"""
import asyncio, json, time, sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional
import httpx
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import ollama
from database import (
    get_db, init_db, save_raw_crawl, upsert_company, get_stats, get_daily_summary,
    DB_PATH
)
from edinet_crawler import EdinetCrawler
from crypto_news_crawler import CryptoNewsCrawler

app = FastAPI(title="&AI SENSE Crawler Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = Path(__file__).parent / "sense.db"

# ============================================================
# DB初期化
# ============================================================
init_db()

# ============================================================
# クローリング対象サイト
# ============================================================
CRAWL_TARGETS = [
    # === M&A・事業承継 ===
    {"name": "TDB倒産速報", "url": "https://www.tdb.co.jp/tosan/", "category": "倒産情報"},
    {"name": "帝国データバンク", "url": "https://www.tdb.co.jp/news/", "category": "企業情報"},
    {"name": "東京商工リサーチ", "url": "https://www.tsr-net.co.jp/news/tsr/", "category": "企業信用情報"},
    {"name": "M&Aクラウド", "url": "https://macloud.jp/sellers", "category": "M&A売却案件"},
    {"name": "BATONZ事業承継", "url": "https://batonz.jp/", "category": "事業承継"},
    {"name": "トランビM&A", "url": "https://www.tranbi.com/buy/", "category": "M&A買収案件"},
    {"name": "ビズリーチサクシード", "url": "https://br-succeed.jp/buy/", "category": "M&A後継者"},
    {"name": "MA Navigator売却", "url": "https://ma-navigator.com/sell/", "category": "M&A売却"},

    # === スタートアップ・資金調達 ===
    {"name": "PRTIMES資金調達", "url": "https://prtimes.jp/main/html/searchrlp/company_id/0", "category": "資金調達"},
    {"name": "Crunchbase Japan", "url": "https://www.crunchbase.com/hub/japan-companies", "category": "スタートアップ"},
    {"name": "B Dash Camp", "url": "https://bdash-camp.com/news/", "category": "スタートアップ"},

    # === ビジネス情報・経済 ===
    {"name": "日経産業新聞", "url": "https://www.nikkei.com/business/", "category": "ビジネストレンド"},
    {"name": "東洋経済オンライン", "url": "https://toyokeizai.net/category/topnews", "category": "経済"},
    {"name": "ダイヤモンドオンライン", "url": "https://diamond.jp/list/special/senmonsho", "category": "ビジネス"},

    # === 不動産・資産 ===
    {"name": "健美家収益物件", "url": "https://www.kenbiya.com/ar/cl/", "category": "不動産収益"},
    {"name": "楽待収益物件", "url": "https://www.rakumachi.jp/syuuekibukken/area/", "category": "不動産"},

    # === 法的情報 ===
    {"name": "官報倒産情報", "url": "https://kanpou.npb.go.jp/", "category": "官報・法的"},
    {"name": "裁判所民事再生", "url": "https://www.courts.go.jp/saibanrei/index.html", "category": "法的手続き"},

    # === EC・D2C ===
    {"name": "Shop買収候補", "url": "https://macloud.jp/sellers?category=ec", "category": "ECサイト"},
    {"name": "サイト売買ラッコ", "url": "https://rakkoma.com/project/list", "category": "Webサイト売買"},

    # === 求人・採用情報（大量採用=資金調達の証拠）===
    {"name": "Wantedly急募", "url": "https://www.wantedly.com/projects/new", "category": "採用・資金調達"},
    {"name": "Indeed急募", "url": "https://jp.indeed.com/jobs?q=%E6%80%A5%E5%8B%9F&sort=date", "category": "急成長企業"},
    {"name": "LinkedIn日本", "url": "https://www.linkedin.com/jobs/search/?location=Japan&sortBy=DD", "category": "採用動向"},
    {"name": "PR TIMES採用", "url": "https://prtimes.jp/main/html/searchrlp/searchword/採用", "category": "採用ニュース"},

    # === 特許・知財（特許売却=M&A前兆）===
    {"name": "J-PlatPat特許", "url": "https://www.j-platpat.inpit.go.jp/", "category": "特許・知財"},
    {"name": "特許庁公報", "url": "https://www.jpo.go.jp/news/kouhou/index.html", "category": "知財動向"},
    {"name": "IP Force特許譲渡", "url": "https://ipforce.jp/transfer/patent/list", "category": "特許売買"},

    # === SNS・メディア（バズビジネス発見）===
    {"name": "NewsPicksトレンド", "url": "https://newspicks.com/topic/business-trend", "category": "SNSトレンド"},
    {"name": "Twitterビジネス話題", "url": "https://twitter.com/search?q=%E8%B3%87%E9%87%91%E8%AA%BF%E9%81%94%20OR%20M%26A%20OR%20%E5%A3%B2%E5%8D%B4&f=live", "category": "SNS動向"},
    {"name": "はてなビジネス", "url": "https://b.hatena.ne.jp/hotentry/it", "category": "IT話題"},

    # === 業界専門誌 ===
    {"name": "飲食店.COM売店舗", "url": "https://www.inshokuten.com/owner/sell/", "category": "飲食業界"},
    {"name": "美容サロン売却", "url": "https://beauty.hotpepper.jp/salon/", "category": "美容業界"},
    {"name": "医療ビジネス", "url": "https://www.medifax.co.jp/news/", "category": "医療業界"},
    {"name": "IT業界M&A", "url": "https://www.itmedia.co.jp/news/subtop/ma/", "category": "IT業界"},
    {"name": "小売業界動向", "url": "https://www.ryutsuu.biz/strategy/", "category": "小売業界"},

    # === 海外・アジア（英語・韓国語）===
    {"name": "Nikkei Asia M&A", "url": "https://asia.nikkei.com/Business/Mergers-Acquisitions", "category": "アジアM&A"},
    {"name": "Korea JoongAng", "url": "https://koreajoongangdaily.joins.com/business", "category": "韓国ビジネス"},
    {"name": "Malaysia Business", "url": "https://www.thestar.com.my/business", "category": "マレーシア"},
    {"name": "TechCrunch Japan", "url": "https://jp.techcrunch.com/category/startups/", "category": "テック・スタートアップ"},
    {"name": "Deal Street Asia", "url": "https://www.dealstreetasia.com/stories/", "category": "アジアスタートアップ"},

    # === 競合分析（コニベット・カジノ系）===
    {"name": "iGaming Business", "url": "https://igamingbusiness.com/news/", "category": "オンラインカジノ"},
    {"name": "Gambling Insider", "url": "https://gamblinginsider.com/news/", "category": "カジノ業界"},
    {"name": "CalvinAyre M&A", "url": "https://calvinayre.com/category/business/", "category": "カジノM&A"},

    # === ニュースサイト（新規追加）===
    {"name": "NHKニュース", "url": "https://www3.nhk.or.jp/news/", "category": "国内ニュース"},
    {"name": "朝日新聞デジタル", "url": "https://www.asahi.com/business/", "category": "経済ニュース"},
    {"name": "読売新聞オンライン", "url": "https://www.yomiuri.co.jp/economy/", "category": "経済ニュース"},
    {"name": "毎日新聞経済", "url": "https://mainichi.jp/economy/", "category": "経済ニュース"},
    {"name": "産経ニュース経済", "url": "https://www.sankei.com/economy/", "category": "経済ニュース"},
    {"name": "日本経済新聞", "url": "https://www.nikkei.com/news/category/economy/", "category": "経済ニュース"},
    {"name": "Bloomberg日本", "url": "https://www.bloomberg.co.jp/markets", "category": "金融ニュース"},
    {"name": "ロイター日本語", "url": "https://jp.reuters.com/markets/", "category": "国際経済"},
    {"name": "Yahoo!ニュース経済", "url": "https://news.yahoo.co.jp/categories/business", "category": "総合ニュース"},
    {"name": "JBpress", "url": "https://jbpress.ismedia.jp/category/economy", "category": "経済コラム"},
    {"name": "現代ビジネス", "url": "https://gendai.media/category/economics", "category": "経済コラム"},
    {"name": "ITmediaビジネス", "url": "https://www.itmedia.co.jp/business/", "category": "ITビジネス"},
    {"name": "マレーシアナビ", "url": "https://malaysia-navi.jp/news/", "category": "マレーシア情報"},
    {"name": "シンガポールBizTimes", "url": "https://www.businesstimes.com.sg/", "category": "シンガポール"},

    # === AIニュース（新規追加）===
    {"name": "AI Frontier Japan", "url": "https://ainow.ai/", "category": "AI国内"},
    {"name": "Ledge.ai", "url": "https://ledge.ai/", "category": "AI国内"},
    {"name": "TechCrunch AI", "url": "https://techcrunch.com/category/artificial-intelligence/", "category": "AI海外"},
    {"name": "The Verge AI", "url": "https://www.theverge.com/ai-artificial-intelligence", "category": "AI海外"},
    {"name": "VentureBeat AI", "url": "https://venturebeat.com/ai/", "category": "AI海外"},
    {"name": "Hugging Face Blog", "url": "https://huggingface.co/blog", "category": "AI技術"},
    {"name": "Anthropic News", "url": "https://www.anthropic.com/news", "category": "AI企業"},
    {"name": "OpenAI Blog", "url": "https://openai.com/blog/", "category": "AI企業"},
    {"name": "Google DeepMind Blog", "url": "https://deepmind.google/discover/blog/", "category": "AI企業"},
    {"name": "Mistral AI Blog", "url": "https://mistral.ai/news/", "category": "AI企業"},
    {"name": "AIトレンド", "url": "https://ai-trend.jp/", "category": "AI国内"},
    {"name": "AINOW", "url": "https://ainow.ai/category/ai-news/", "category": "AI国内"},

    # === AI×M&A・AI企業動向（新規追加）===
    # AI企業M&A専門
    {"name": "AI Business M&A", "url": "https://aibusiness.com/ml/", "category": "AI企業M&A"},
    {"name": "The Information AI", "url": "https://www.theinformation.com/tech/artificial-intelligence", "category": "AIディープ"},
    {"name": "Axios AI+", "url": "https://www.axios.com/ai/", "category": "AI海外"},
    {"name": "MIT Tech Review AI", "url": "https://www.technologyreview.com/topic/artificial-intelligence/", "category": "AI技術"},
    {"name": "Wired AI", "url": "https://www.wired.com/tag/artificial-intelligence/", "category": "AI海外"},
    # 日本AI企業・投資動向
    {"name": "ASCII AI", "url": "https://ascii.jp/elem/000/004/", "category": "AI国内"},
    {"name": "週刊アスキーAI", "url": "https://ascii.jp/tag/AI/", "category": "AI国内"},
    {"name": "BRIDGE AI", "url": "https://thebridge.jp/tag/machine-learning/", "category": "AI国内スタートアップ"},
    {"name": "Coral Capital AI", "url": "https://coralcap.co/insights/", "category": "AI投資"},
    # AI×フィンテック・投資
    {"name": "FinSum AI", "url": "https://finsum.jp/", "category": "AIフィンテック"},
    {"name": "Bloomberg AI", "url": "https://www.bloomberg.com/ai", "category": "AIビジネス"},
    # AI規制・政策
    {"name": "経済産業省AI", "url": "https://www.meti.go.jp/policy/it_policy/ai/index.html", "category": "AI政策"},
    {"name": "内閣府AI", "url": "https://www8.cao.go.jp/cstp/ai/index.html", "category": "AI政策"},
    # AI×医療・ヘルスケア
    {"name": "日経メディカルAI", "url": "https://medical.nikkeibp.co.jp/inc/all/keyword/ai.html", "category": "AIヘルスケア"},
    # グローバルAI M&A追跡
    {"name": "CB Insights AI", "url": "https://www.cbinsights.com/research/artificial-intelligence/", "category": "AI投資分析"},
    {"name": "PitchBook AI", "url": "https://pitchbook.com/news/reports/artificial-intelligence", "category": "AI資金調達"},
]

# ============================================================
# Qwen3でスコアリング
# ============================================================
async def ai_score(text: str, source: str) -> dict:
    """Qwen3 30BでM&A観点からスコアリング"""
    prompt = f"""あなたはM&A・ビジネスインテリジェンスの専門家です。
以下のビジネス情報をM&Aや投資機会の観点から分析してください。

情報ソース: {source}
テキスト: {text[:1000]}

以下のJSON形式で回答してください（日本語）:
{{
  "score": 0-100の整数（M&A/投資機会としての重要度）,
  "sector": "業種（小売/IT/製造/サービス/飲食/医療/不動産/その他）",
  "prefecture": "都道府県（不明な場合は空文字）",
  "company_name": "企業名（推定できる場合）",
  "revenue": "売上規模（推定: 1億以下/1-10億/10-100億/100億以上/不明）",
  "reason": "スコアの理由（50文字以内）",
  "keywords": ["キーワード1", "キーワード2"]
}}

JSONのみ返答してください。"""

    try:
        response = ollama.chat(
            model='qwen3:30b',
            messages=[{'role': 'user', 'content': prompt}],
            options={"temperature": 0.1}
        )
        content = response['message']['content']
        # JSONを抽出
        import re
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except Exception as e:
        print(f"[AI] スコアリングエラー: {e}")
    
    return {"score": 50, "sector": "不明", "prefecture": "", "company_name": "", "revenue": "不明", "reason": "解析失敗", "keywords": []}

# ============================================================
# Webスクレイピング
# ============================================================
async def scrape_site(target: dict) -> list[dict]:
    """サイトをスクレイピングしてテキストを取得"""
    results = []

    # CloudFlare保護サイトはStealthyFetcher
    if target.get("name") in CF_SITES:
        print(f"[Stealth] {target['name']} をStealthyFetcherで取得")
        return scrape_with_stealth(target)

    # Steel Browser対応サイトはJS経由で取得
    if target.get("name") in STEEL_SITES:
        print(f"[Steel] {target['name']} をSteel Browserで取得")
        return scrape_with_steel(target)

    try:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            headers = {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
            }
            
            if target.get("api"):
                # APIの場合
                response = await client.get(target["url"], headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    companies = data.get("corporations", [])[:10]
                    for c in companies:
                        results.append({
                            "text": f"{c.get('name', '')} {c.get('location', '')} {c.get('kind', '')}",
                            "url": target["url"],
                            "source": target["name"]
                        })
            else:
                # 通常のWebページ
                response = await client.get(target["url"], headers=headers)
                if response.status_code == 200:
                    from html.parser import HTMLParser
                    
                    class TextExtractor(HTMLParser):
                        def __init__(self):
                            super().__init__()
                            self.texts = []
                            self.current_text = []
                            self.in_body = False
                            
                        def handle_starttag(self, tag, attrs):
                            if tag == 'body':
                                self.in_body = True
                                
                        def handle_data(self, data):
                            if self.in_body:
                                text = data.strip()
                                if len(text) > 20:
                                    self.current_text.append(text)
                                    if len(self.current_text) >= 3:
                                        self.texts.append(' '.join(self.current_text))
                                        self.current_text = []
                    
                    extractor = TextExtractor()
                    extractor.feed(response.text)
                    
                    for i, text in enumerate(extractor.texts[:15]):
                        results.append({
                            "text": text[:500],
                            "url": target["url"],
                            "source": target["name"]
                        })
    
    except Exception as e:
        print(f"[Scrape] {target['name']} エラー: {e}")
    
    return results

# ============================================================
# メインクローラー処理
# ============================================================
async def run_crawler(target: dict):
    """1つのターゲットをクロールしてAI分析"""
    run_id = None
    conn = get_db()
    
    try:
        # クロール開始記録
        cursor = conn.execute(
            "INSERT INTO crawler_runs (source, status, started_at) VALUES (?, ?, ?)",
            (target["url"], "running", datetime.now().isoformat())
        )
        run_id = cursor.lastrowid
        conn.commit()
        
        print(f"[Crawler] {target['name']} クロール開始...")
        
        # スクレイピング
        items = await scrape_site(target)
        print(f"[Crawler] {target['name']}: {len(items)}件取得")
        
        # AI分析（Qwen3）
        saved = 0
        for item in items:
            if len(item["text"]) < 30:
                continue
            
            # Qwen3でスコアリング
            analysis = await ai_score(item["text"], target["name"])
            
            if analysis.get("score", 0) >= 40:  # スコア40以上のみ保存
                conn.execute("""
                    INSERT INTO companies
                    (name, url, source, description, score, sector, prefecture,
                     revenue, reason, first_seen, last_updated)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    analysis.get("company_name", "不明"),
                    item["url"],
                    item["source"],
                    item["text"][:200],
                    analysis.get("score", 50),
                    analysis.get("sector", "不明"),
                    analysis.get("prefecture", ""),
                    analysis.get("revenue", "不明"),
                    analysis.get("reason", ""),
                    datetime.now().isoformat(),
                    datetime.now().isoformat(),
                ))
                saved += 1
        
        conn.commit()
        
        # 完了記録
        conn.execute(
            "UPDATE crawler_runs SET status=?, items_new=?, finished_at=? WHERE id=?",
            ("success", saved, datetime.now().isoformat(), run_id)
        )
        conn.commit()
        print(f"[Crawler] {target['name']}: {saved}件保存完了")
        
    except Exception as e:
        if run_id:
            conn.execute(
                "UPDATE crawler_runs SET status=?, error=?, finished_at=? WHERE id=?",
                ("error", str(e), datetime.now().isoformat(), run_id)
            )
            conn.commit()
        print(f"[Crawler] エラー: {e}")
    finally:
        conn.close()

# ============================================================
# API エンドポイント
# ============================================================
@app.get("/api/companies")
async def get_companies(limit: int = 50, min_score: int = 0, sector: str = ""):
    conn = get_db()
    conn.row_factory = sqlite3.Row
    
    query = "SELECT * FROM companies WHERE score >= ?"
    params = [min_score]
    
    if sector:
        query += " AND sector = ?"
        params.append(sector)
    
    query += " ORDER BY score DESC, last_updated DESC LIMIT ?"
    params.append(limit)
    
    rows = [dict(r) for r in conn.execute(query, params).fetchall()]
    conn.close()
    return {"companies": rows, "total": len(rows)}

@app.get("/api/crawlers/status")
async def get_crawler_status():
    conn = get_db()
    conn.row_factory = sqlite3.Row
    
    runs = [dict(r) for r in conn.execute(
        "SELECT * FROM crawler_runs ORDER BY started_at DESC LIMIT 20"
    ).fetchall()]
    
    total = conn.execute("SELECT COUNT(*) FROM companies").fetchone()[0]
    high_score = conn.execute("SELECT COUNT(*) FROM companies WHERE score >= 80").fetchone()[0]
    
    conn.close()
    return {
        "recent_runs": runs,
        "total_companies": total,
        "high_score_count": high_score,
        "targets": [{"name": t["name"], "url": t["url"]} for t in CRAWL_TARGETS]
    }

@app.post("/api/crawlers/run")
async def trigger_crawl(background_tasks: BackgroundTasks, target_name: str = ""):
    """クロール手動実行"""
    targets = CRAWL_TARGETS if not target_name else [t for t in CRAWL_TARGETS if t["name"] == target_name]
    
    async def run_all():
        for target in targets:
            await run_crawler(target)
    
    background_tasks.add_task(run_all)
    return {"ok": True, "message": f"{len(targets)}件のクロールを開始しました", "targets": [t["name"] for t in targets]}

@app.post("/api/crawlers/run-all")
async def trigger_all_crawls(background_tasks: BackgroundTasks):
    """全サイトを並列クロール"""
    async def run_parallel():
        tasks = [run_crawler(t) for t in CRAWL_TARGETS]
        await asyncio.gather(*tasks, return_exceptions=True)
    
    background_tasks.add_task(run_parallel)
    return {"ok": True, "message": f"全{len(CRAWL_TARGETS)}サイトの並列クロールを開始", "targets": [t["name"] for t in CRAWL_TARGETS]}

@app.get("/api/companies/{company_id}")
async def get_company(company_id: int):
    conn = get_db()
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT * FROM companies WHERE id=?", (company_id,)).fetchone()
    conn.close()
    if not row:
        return {"error": "not found"}
    return dict(row)

@app.delete("/api/companies/{company_id}")
async def delete_company(company_id: int):
    conn = get_db()
    conn.execute("DELETE FROM companies WHERE id=?", (company_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


@app.get("/api/stats")
async def get_statistics():
    """統計情報・日次サマリー"""
    conn = get_db()
    stats = get_stats(conn)
    daily = get_daily_summary(conn, days=7)
    conn.close()
    return {"stats": stats, "daily_summary": daily}

@app.get("/api/companies/trending")
async def get_trending():
    """スコア急上昇企業"""
    conn = get_db()
    conn.row_factory = sqlite3.Row
    rows = [dict(r) for r in conn.execute("""
        SELECT c.*, 
               (SELECT COUNT(*) FROM company_history WHERE company_id=c.id) as history_count
        FROM companies c 
        WHERE c.score_trend='up' 
        ORDER BY (c.score - c.prev_score) DESC 
        LIMIT 20
    """).fetchall()]
    conn.close()
    return {"trending": rows}

@app.post("/api/companies/{company_id}/watch")
async def watch_company(company_id: int):
    """企業をウォッチリストに追加"""
    conn = get_db()
    conn.execute("UPDATE companies SET status='watching' WHERE id=?", (company_id,))
    conn.commit()
    conn.close()
    return {"ok": True}

@app.post("/api/companies/{company_id}/action")
async def add_action(company_id: int, request: dict):
    """アクション記録（問い合わせ・コメント等）"""
    conn = get_db()
    conn.execute("""
        INSERT INTO actions (company_id, action_type, content, status, created_at)
        VALUES (?, ?, ?, 'done', ?)
    """, (company_id, request.get("type","comment"), request.get("content",""), datetime.now().isoformat()))
    conn.commit()
    conn.close()
    return {"ok": True}

@app.get("/api/companies/{company_id}/history")
async def get_company_history(company_id: int):
    """企業のスコア変化履歴"""
    conn = get_db()
    history = [dict(r) for r in conn.execute(
        "SELECT * FROM company_history WHERE company_id=? ORDER BY recorded_at DESC",
        (company_id,)
    ).fetchall()]
    conn.close()
    return {"history": history}

@app.get("/api/edinet/signals")
async def get_edinet_signals(
    signal_type: str = "",
    limit: int = 50,
    min_score: int = 0,
):
    """EDINETシグナル一覧"""
    conn = get_db()
    conn.row_factory = sqlite3.Row

    query = "SELECT * FROM edinet_signals WHERE signal_score >= ?"
    params: list = [min_score]

    if signal_type:
        query += " AND signal_type = ?"
        params.append(signal_type)

    query += " ORDER BY signal_score DESC, submit_datetime DESC LIMIT ?"
    params.append(limit)

    try:
        rows = [dict(r) for r in conn.execute(query, params).fetchall()]
    except Exception:
        rows = []
    finally:
        conn.close()

    return {"signals": rows, "total": len(rows)}


@app.post("/api/edinet/run")
async def run_edinet(background_tasks: BackgroundTasks, days_back: int = 1):
    """EDINET手動実行"""
    async def _run():
        crawler = EdinetCrawler(str(DB_PATH))
        await crawler.run(days_back=days_back)

    background_tasks.add_task(_run)
    return {"ok": True, "message": f"EDINET {days_back}日分のクロールを開始しました"}


@app.get("/api/crypto/sentiment")
async def get_crypto_sentiment():
    """暗号資産センチメント最新値"""
    conn = get_db()
    conn.row_factory = sqlite3.Row

    try:
        rows = conn.execute(
            "SELECT sentiment, COUNT(*) as cnt FROM crypto_news "
            "WHERE date(published_at) >= date('now', '-1 day') GROUP BY sentiment"
        ).fetchall()
        counts = {r["sentiment"]: r["cnt"] for r in rows}
        total = sum(counts.values()) or 1
        return {
            "positive_ratio": counts.get("positive", 0) / total,
            "negative_ratio": counts.get("negative", 0) / total,
            "neutral_ratio": counts.get("neutral", 0) / total,
            "total": total,
            "score": (counts.get("positive", 0) - counts.get("negative", 0)) / total,
        }
    except Exception:
        return {"score": 0.0, "total": 0}
    finally:
        conn.close()


@app.post("/api/crypto/run")
async def run_crypto_news(background_tasks: BackgroundTasks):
    """暗号資産ニュース手動実行"""
    async def _run():
        crawler = CryptoNewsCrawler(str(DB_PATH))
        await crawler.run()

    background_tasks.add_task(_run)
    return {"ok": True, "message": "暗号資産ニュース取得を開始しました"}


# ============================================================
# スケジューラー（起動時バックグラウンド）
# ============================================================
async def _scheduler():
    """EDINET: 毎日9:00(平日) / Crypto: 毎時"""
    from zoneinfo import ZoneInfo
    import calendar

    tz = ZoneInfo("Asia/Tokyo")
    last_edinet_date: str = ""
    last_crypto_hour: int = -1

    while True:
        now = datetime.now(tz)

        # EDINET: 平日9:00に1回
        is_weekday = now.weekday() < 5
        today_str = now.strftime("%Y-%m-%d")
        if is_weekday and now.hour == 9 and today_str != last_edinet_date:
            last_edinet_date = today_str
            try:
                crawler = EdinetCrawler(str(DB_PATH))
                await crawler.run(days_back=1)
                print(f"[Scheduler] EDINET完了: {today_str}")
            except Exception as e:
                print(f"[Scheduler] EDINETエラー: {e}")

        # Crypto News: 毎時
        if now.hour != last_crypto_hour:
            last_crypto_hour = now.hour
            try:
                crawler = CryptoNewsCrawler(str(DB_PATH))
                await crawler.run()
                print(f"[Scheduler] CryptoNews完了: {now.strftime('%H:%M')}")
            except Exception as e:
                print(f"[Scheduler] CryptoNewsエラー: {e}")

        await asyncio.sleep(60)  # 1分ごとにチェック


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(_scheduler())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)

# ============================================================
# Steel Browser統合（JSレンダリング対応）
# ============================================================

# JSレンダリングが必要なサイト（Steel Browser使用）
STEEL_SITES = {
    "M&Aクラウド", "バトンズ", "東洋経済オンライン", "ダイヤモンドオンライン",
    "東京商工リサーチ", "帝国データバンク", "日経産業新聞", "Nikkei Asia M&A",
    "Bloomberg日本", "日本経済新聞", "Axios AI+", "BRIDGE AI"
}

def scrape_with_steel(target: dict) -> list[dict]:
    """Steel Browser経由でJSサイトをスクレイピング"""
    import subprocess, time as _time
    results = []
    try:
        # ページを開く
        subprocess.run(["agent-browser", "open", target["url"]], 
                      capture_output=True, timeout=15)
        _time.sleep(4)  # JSレンダリング待ち

        # テキスト取得
        res = subprocess.run(["agent-browser", "get", "text", "body"],
                             capture_output=True, text=True, timeout=15)
        full_text = res.stdout

        # 20文字以上の行をチャンク化
        chunks = [line.strip() for line in full_text.split('\n') 
                  if len(line.strip()) > 20]
        
        for i in range(0, min(len(chunks), 30), 3):
            chunk = ' '.join(chunks[i:i+3])[:500]
            if chunk:
                results.append({
                    "text": chunk,
                    "url": target["url"],
                    "source": target["name"] + " [Steel]"
                })
    except Exception as e:
        print(f"[Steel] {target['name']} エラー: {e}")
    return results

# ============================================================
# Scrapling StealthyFetcher（CloudFlare突破）
# ============================================================

# CloudFlare保護があるサイト
CF_SITES = {
    "M&Aクラウド", "バトンズ",
}

def scrape_with_stealth(target: dict) -> list[dict]:
    """StealthyFetcherでCloudFlare保護サイトを突破"""
    import asyncio
    from scrapling import StealthyFetcher

    results = []

    async def _fetch():
        fetcher = StealthyFetcher.configure(headless=True, network_idle=True)
        page = await fetcher.async_fetch(target["url"], timeout=40000)
        return page.get_all_text(ignore_tags=['script','style'])

    try:
        text = asyncio.run(_fetch())
        chunks = [l.strip() for l in text.split('\n') if len(l.strip()) > 20]
        for i in range(0, min(len(chunks), 30), 3):
            chunk = ' '.join(chunks[i:i+3])[:500]
            if chunk:
                results.append({
                    "text": chunk,
                    "url": target["url"],
                    "source": target["name"] + " [Stealth]"
                })
        print(f"[Stealth] ✅ {target['name']}: {len(chunks)}行取得")
    except Exception as e:
        print(f"[Stealth] ❌ {target['name']}: {e}")
    return results
