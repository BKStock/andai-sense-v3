"""
&AI SENSE - 4層データベース設計
蓄積・整理・分析のための完全なデータ管理システム
"""
import sqlite3
import hashlib
import json
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent / "sense.db"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")  # 並列書き込み対応
    return conn


def init_db():
    conn = get_db()
    
    # ================================================================
    # Layer 1: raw_crawls（生データアーカイブ）
    # ================================================================
    conn.execute("""
        CREATE TABLE IF NOT EXISTS raw_crawls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,           -- BATONZ / 法人番号API等
            url TEXT,                       -- クロール元URL
            content_hash TEXT,              -- 内容のハッシュ（重複検知）
            raw_text TEXT,                  -- 生テキスト
            crawled_at TEXT NOT NULL,       -- クロール日時
            processed INTEGER DEFAULT 0     -- AI分析済みフラグ
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_raw_hash ON raw_crawls(content_hash)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_raw_source ON raw_crawls(source)")
    
    # ================================================================
    # Layer 2: companies（企業マスタ）
    # ================================================================
    conn.execute("""
        CREATE TABLE IF NOT EXISTS companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,                      -- 企業名
            normalized_name TEXT,           -- 正規化名（重複排除用）
            url TEXT,                       -- 参照URL
            source TEXT,                    -- 発見ソース
            description TEXT,              -- 説明
            score INTEGER DEFAULT 0,        -- 現在のスコア
            prev_score INTEGER DEFAULT 0,   -- 前回スコア（変化検知）
            score_trend TEXT DEFAULT 'stable', -- up/down/stable
            sector TEXT,                    -- 業種
            prefecture TEXT,               -- 都道府県
            revenue TEXT,                  -- 売上規模
            employees TEXT,               -- 従業員数
            reason TEXT,                   -- スコア理由
            status TEXT DEFAULT 'new',     -- new/watching/contacted/archived
            first_seen TEXT,               -- 初回発見日
            last_updated TEXT,             -- 最終更新日
            times_seen INTEGER DEFAULT 1,   -- 発見回数
            raw_crawl_id INTEGER,          -- 元の生データID
            FOREIGN KEY (raw_crawl_id) REFERENCES raw_crawls(id)
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_companies_score ON companies(score DESC)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_companies_sector ON companies(sector)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(normalized_name)")
    
    # ================================================================
    # Layer 3: company_history（変更履歴）
    # ================================================================
    conn.execute("""
        CREATE TABLE IF NOT EXISTS company_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER NOT NULL,
            score INTEGER,                  -- その時点のスコア
            score_delta INTEGER DEFAULT 0,  -- 前回からの変化
            description TEXT,             -- その時の説明
            source TEXT,                   -- 更新ソース
            recorded_at TEXT NOT NULL,     -- 記録日時
            FOREIGN KEY (company_id) REFERENCES companies(id)
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_history_company ON company_history(company_id)")
    
    # ================================================================
    # Layer 4: actions（アクション管理）
    # ================================================================
    conn.execute("""
        CREATE TABLE IF NOT EXISTS actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER NOT NULL,
            action_type TEXT NOT NULL,      -- inquiry/comment/follow_up/archived
            content TEXT,                   -- 内容（コメント・送信文等）
            status TEXT DEFAULT 'pending',  -- pending/done/failed
            created_at TEXT NOT NULL,
            done_at TEXT,
            FOREIGN KEY (company_id) REFERENCES companies(id)
        )
    """)
    
    # ================================================================
    # クロール実行ログ
    # ================================================================
    conn.execute("""
        CREATE TABLE IF NOT EXISTS crawler_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT,
            status TEXT,                    -- running/success/error
            items_crawled INTEGER DEFAULT 0,
            items_new INTEGER DEFAULT 0,    -- 新規発見数
            items_updated INTEGER DEFAULT 0, -- 更新数
            items_duplicate INTEGER DEFAULT 0, -- 重複スキップ数
            started_at TEXT,
            finished_at TEXT,
            error TEXT
        )
    """)
    
    conn.commit()
    conn.close()
    print("[DB] 4層データベース初期化完了")


# ================================================================
# データ保存ロジック
# ================================================================

def content_hash(text: str) -> str:
    """テキストのハッシュ値を生成（重複検知用）"""
    return hashlib.sha256(text.encode()).hexdigest()


def normalize_name(name: str) -> str:
    """企業名を正規化（重複排除用）"""
    if not name:
        return ""
    # 株式会社・有限会社等を除去、全角→半角
    import re
    name = re.sub(r'[（）()【】\[\]]', '', name)
    name = name.replace('株式会社', '').replace('有限会社', '')
    name = name.replace('合同会社', '').replace('合資会社', '')
    name = name.strip()
    return name


def save_raw_crawl(conn, source: str, url: str, text: str) -> tuple[int, bool]:
    """
    Layer1: 生データを保存
    Returns: (id, is_new) - 既存の場合はis_new=False
    """
    h = content_hash(text)
    
    # 重複チェック
    existing = conn.execute(
        "SELECT id FROM raw_crawls WHERE content_hash = ?", (h,)
    ).fetchone()
    
    if existing:
        return existing['id'], False
    
    cursor = conn.execute(
        "INSERT INTO raw_crawls (source, url, content_hash, raw_text, crawled_at) VALUES (?, ?, ?, ?, ?)",
        (source, url, h, text, datetime.now().isoformat())
    )
    return cursor.lastrowid, True


def upsert_company(conn, raw_id: int, analysis: dict, source: str, url: str, raw_text: str) -> tuple[int, str]:
    """
    Layer2: 企業マスタを更新または新規作成
    Returns: (company_id, action) - action: 'created'/'updated'/'duplicate'
    """
    name = analysis.get("company_name", "").strip()
    norm_name = normalize_name(name)
    score = analysis.get("score", 0)
    now = datetime.now().isoformat()
    
    # 同一企業チェック（正規化名で検索）
    existing = None
    if norm_name:
        existing = conn.execute(
            "SELECT * FROM companies WHERE normalized_name = ? LIMIT 1",
            (norm_name,)
        ).fetchone()
    
    if existing:
        # 既存企業のスコア更新
        prev_score = existing['score']
        score_delta = score - prev_score
        trend = 'up' if score_delta > 5 else 'down' if score_delta < -5 else 'stable'
        
        conn.execute("""
            UPDATE companies SET
                score = ?, prev_score = ?, score_trend = ?,
                last_updated = ?, times_seen = times_seen + 1,
                description = ?, reason = ?
            WHERE id = ?
        """, (score, prev_score, trend, now, 
              analysis.get("description", "")[:200],
              analysis.get("reason", ""),
              existing['id']))
        
        # Layer3: 履歴記録
        conn.execute("""
            INSERT INTO company_history (company_id, score, score_delta, description, source, recorded_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (existing['id'], score, score_delta, 
              analysis.get("description", "")[:200], source, now))
        
        return existing['id'], 'updated'
    
    else:
        # 新規企業
        cursor = conn.execute("""
            INSERT INTO companies 
            (name, normalized_name, url, source, description, score, sector, 
             prefecture, revenue, reason, status, first_seen, last_updated, raw_crawl_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)
        """, (
            name or "不明",
            norm_name,
            url,
            source,
            analysis.get("description", raw_text[:200]),
            score,
            analysis.get("sector", "不明"),
            analysis.get("prefecture", ""),
            analysis.get("revenue", "不明"),
            analysis.get("reason", ""),
            now, now,
            raw_id
        ))
        company_id = cursor.lastrowid
        
        # Layer3: 初回履歴記録
        conn.execute("""
            INSERT INTO company_history (company_id, score, score_delta, description, source, recorded_at)
            VALUES (?, ?, 0, ?, ?, ?)
        """, (company_id, score, analysis.get("description", "")[:200], source, now))
        
        return company_id, 'created'


# ================================================================
# 統計・分析クエリ
# ================================================================

def get_stats(conn) -> dict:
    """データベースの統計情報"""
    total = conn.execute("SELECT COUNT(*) FROM companies").fetchone()[0]
    new_today = conn.execute(
        "SELECT COUNT(*) FROM companies WHERE date(first_seen) = date('now')"
    ).fetchone()[0]
    high_score = conn.execute(
        "SELECT COUNT(*) FROM companies WHERE score >= 80"
    ).fetchone()[0]
    trending_up = conn.execute(
        "SELECT COUNT(*) FROM companies WHERE score_trend = 'up'"
    ).fetchone()[0]
    watching = conn.execute(
        "SELECT COUNT(*) FROM companies WHERE status = 'watching'"
    ).fetchone()[0]
    total_raw = conn.execute("SELECT COUNT(*) FROM raw_crawls").fetchone()[0]
    
    sector_dist = {}
    for row in conn.execute(
        "SELECT sector, COUNT(*) as cnt FROM companies GROUP BY sector ORDER BY cnt DESC LIMIT 8"
    ).fetchall():
        sector_dist[row['sector']] = row['cnt']
    
    # 今日のスコア急上昇企業
    trending = [dict(r) for r in conn.execute("""
        SELECT c.name, c.score, c.prev_score, (c.score - c.prev_score) as delta
        FROM companies c
        WHERE c.score_trend = 'up' AND (c.score - c.prev_score) > 10
        ORDER BY (c.score - c.prev_score) DESC
        LIMIT 5
    """).fetchall()]
    
    return {
        "total_companies": total,
        "new_today": new_today,
        "high_score_count": high_score,
        "trending_up": trending_up,
        "watching": watching,
        "total_raw_crawls": total_raw,
        "sector_distribution": sector_dist,
        "trending_companies": trending
    }


def get_daily_summary(conn, days: int = 7) -> list:
    """過去N日間の日次サマリー"""
    return [dict(r) for r in conn.execute("""
        SELECT 
            date(first_seen) as date,
            COUNT(*) as new_companies,
            AVG(score) as avg_score,
            MAX(score) as max_score
        FROM companies
        WHERE first_seen >= date('now', ? || ' days')
        GROUP BY date(first_seen)
        ORDER BY date DESC
    """, (f'-{days}',)).fetchall()]


if __name__ == "__main__":
    init_db()
    conn = get_db()
    print("統計:", get_stats(conn))
    conn.close()
