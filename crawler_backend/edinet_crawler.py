#!/usr/bin/env python3
"""
EDINET APIクローラー — 上場企業の有価証券報告書・適時開示を監視
M&Aシグナル: 業績予告修正・大株主変動・役員変更・臨時報告書
"""

import httpx
import asyncio
import sqlite3
import json
from datetime import datetime, timedelta
from pathlib import Path

EDINET_API_KEY = "edb_e907f67ee166cde0e61e4f8fecfa0ac1"
EDINET_BASE = "https://api.edinet-fsa.go.jp/api/v2"

# M&Aシグナルとなる書類タイプ
MA_SIGNAL_DOCS = {
    "120": "有価証券報告書",
    "140": "四半期報告書",
    "160": "臨時報告書",      # 重要事象
    "170": "大量保有報告書",  # 大株主変動 ★最重要
    "180": "変更報告書",
    "350": "公開買付届出書",  # TOB ★超重要
    "360": "公開買付撤回届出書",
    "370": "公開買付報告書",
}


class EdinetCrawler:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.client = httpx.AsyncClient(timeout=30)
        self.setup_tables()

    def setup_tables(self) -> None:
        db = sqlite3.connect(self.db_path)
        db.executescript("""
            CREATE TABLE IF NOT EXISTS edinet_signals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                edinet_code TEXT,
                company_name TEXT,
                doc_type_code TEXT,
                doc_type_name TEXT,
                period_start TEXT,
                period_end TEXT,
                submit_datetime TEXT,
                doc_description TEXT,
                signal_type TEXT,
                signal_score INTEGER DEFAULT 50,
                is_read INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_edinet_submit ON edinet_signals(submit_datetime);
            CREATE INDEX IF NOT EXISTS idx_edinet_signal ON edinet_signals(signal_type);
        """)
        db.commit()
        db.close()

    async def fetch_daily_docs(self, target_date: str) -> list[dict]:
        """指定日の全提出書類を取得"""
        url = f"{EDINET_BASE}/documents.json"
        params = {
            "date": target_date,
            "type": 2,  # 書類一覧+メタデータ
            "Subscription-Key": EDINET_API_KEY,
        }

        try:
            r = await self.client.get(url, params=params)
            data = r.json()
            return data.get("results", [])
        except Exception as e:
            print(f"EDINET fetch error ({target_date}): {e}")
            return []

    def classify_signal(self, doc: dict) -> tuple[str, int]:
        """書類のM&Aシグナル分類とスコアリング"""
        doc_type = doc.get("docTypeCode", "")

        # TOB（公開買付）= 最高スコア
        if doc_type == "350":
            return "TOB_FILED", 95
        if doc_type == "360":
            return "TOB_WITHDRAWN", 70
        if doc_type == "370":
            return "TOB_COMPLETED", 90

        # 大量保有報告書 = 高スコア
        if doc_type == "170":
            return "LARGE_HOLDER", 80
        if doc_type == "180":
            return "LARGE_HOLDER_CHANGE", 75

        # 臨時報告書 = 中スコア（内容次第）
        if doc_type == "160":
            desc = doc.get("docDescription", "")
            if any(kw in desc for kw in ["合併", "買収", "子会社", "資本提携"]):
                return "MA_EVENT", 85
            if any(kw in desc for kw in ["業績", "下方修正", "赤字"]):
                return "FINANCIAL_ALERT", 60
            return "TEMPORARY_REPORT", 50

        return "REGULAR_DOC", 30

    async def run(self, days_back: int = 1) -> int:
        """実行（直近N日分）"""
        db = sqlite3.connect(self.db_path)
        total_signals = 0

        try:
            for i in range(days_back):
                target = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
                docs = await self.fetch_daily_docs(target)

                for doc in docs:
                    doc_type = doc.get("docTypeCode", "")
                    if doc_type not in MA_SIGNAL_DOCS:
                        continue

                    signal_type, score = self.classify_signal(doc)

                    # 既存チェック
                    exists = db.execute(
                        "SELECT id FROM edinet_signals WHERE edinet_code=? AND submit_datetime=?",
                        [doc.get("edinetCode"), doc.get("submitDateTime")],
                    ).fetchone()

                    if not exists:
                        db.execute(
                            """
                            INSERT INTO edinet_signals
                            (edinet_code, company_name, doc_type_code, doc_type_name,
                             period_start, period_end, submit_datetime, doc_description,
                             signal_type, signal_score)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """,
                            [
                                doc.get("edinetCode"),
                                doc.get("filerName"),
                                doc_type,
                                MA_SIGNAL_DOCS.get(doc_type, "その他"),
                                doc.get("periodStart"),
                                doc.get("periodEnd"),
                                doc.get("submitDateTime"),
                                doc.get("docDescription", ""),
                                signal_type,
                                score,
                            ],
                        )
                        total_signals += 1

            db.commit()
        finally:
            db.close()
            await self.client.aclose()

        print(f"EDINET: {total_signals}件のシグナル検出")
        return total_signals


async def main() -> None:
    import sys
    days = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    db_path = str(Path(__file__).parent / "sense.db")
    crawler = EdinetCrawler(db_path)
    await crawler.run(days_back=days)


if __name__ == "__main__":
    asyncio.run(main())
