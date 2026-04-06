#!/usr/bin/env python3
"""
&AI SOUZOKU Crawler — おくやみ情報×不動産登記照合
Usage:
  python3 souzoku_crawler.py [--db DB_PATH] [--csv CSV_PATH]

注意: このクローラーはWebスクレイピングを含みます。
  各サイトの利用規約を確認し、適切な許可を取得してから使用してください。
  訃報情報の収集・利用には個人情報保護法の遵守が必要です。
"""

import argparse
import csv
import json
import re
import sqlite3
import sys
from datetime import date, datetime

import os

import requests
from bs4 import BeautifulSoup

OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")


class SouzokuCrawler:
    def __init__(self, db_path: str = "sense.db"):
        self.db = sqlite3.connect(db_path)
        self.db.row_factory = sqlite3.Row
        self._setup_tables()

    def _setup_tables(self) -> None:
        """相続リード管理テーブル作成"""
        self.db.executescript("""
            CREATE TABLE IF NOT EXISTS souzoku_deceased (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                age INTEGER,
                prefecture TEXT,
                city TEXT,
                source_name TEXT,
                published_date TEXT,
                raw_text TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS souzoku_leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                deceased_id INTEGER REFERENCES souzoku_deceased(id),
                property_address TEXT,
                property_type TEXT DEFAULT '不動産',
                estimated_value INTEGER DEFAULT 0,
                lead_score REAL DEFAULT 50,
                dm_status TEXT DEFAULT 'pending',
                dm_text TEXT,
                notes TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            );
        """)
        self.db.commit()

    def scrape_obituaries(self) -> list[dict]:
        """
        訃報情報収集（デモ実装）

        本番実装では各メディアの公式APIまたは
        許可されたデータフィードを使用してください。
        Yahoo!ニュース直接スクレイピングは利用規約違反の可能性があります。
        """
        results: list[dict] = []
        headers = {"User-Agent": "AndAI-SENSE/1.0 (commercial inquiry system)"}
        keywords = ["訃報", "逝去"]

        for kw in keywords[:1]:
            try:
                # 注: 実際の本番環境では各サイトの公式APIを使用すること
                url = f"https://search.yahoo.co.jp/search?p={kw}"
                r = requests.get(url, headers=headers, timeout=10)
                r.raise_for_status()
                soup = BeautifulSoup(r.text, "html.parser")

                for art in soup.select("article, .sw-Card, .w-Hd")[:10]:
                    text = art.get_text(separator=" ")[:200]
                    name_match = re.search(
                        r"([^\s、。]{2,5})(?:さん|氏|先生|様)?(?:が|は).*?(?:死去|逝去|永眠|亡くなった)",
                        text,
                    )
                    age_match = re.search(r"(\d{2,3})\s*歳", text)

                    if name_match:
                        results.append({
                            "name": name_match.group(1),
                            "age": int(age_match.group(1)) if age_match else None,
                            "source": "Yahoo!検索",
                            "raw_text": text[:200],
                            "published_date": date.today().isoformat(),
                        })
            except requests.RequestException as e:
                print(f"[WARN] 取得失敗: {e}", file=sys.stderr)

        return results

    def import_from_csv(self, csv_path: str) -> int:
        """手動インポート（登記DB / おくやみ情報 CSV）

        CSV列: name, age, prefecture, city, address, published_date
        """
        count = 0
        with open(csv_path, newline="", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                cur = self.db.execute(
                    """
                    INSERT INTO souzoku_deceased
                      (name, age, prefecture, city, source_name, published_date)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    [
                        row.get("name", "").strip(),
                        int(row["age"]) if row.get("age", "").isdigit() else None,
                        row.get("prefecture", "").strip(),
                        row.get("city", "").strip(),
                        "CSV Import",
                        row.get("published_date", date.today().isoformat()),
                    ],
                )
                deceased_id = cur.lastrowid
                address = row.get("address", "").strip()
                if address and deceased_id:
                    score = self._calc_lead_score(
                        {"age": int(row["age"]) if row.get("age", "").isdigit() else 75},
                        {"property_address": address, "property_type": row.get("property_type", "不動産")},
                    )
                    self.db.execute(
                        """
                        INSERT INTO souzoku_leads
                          (deceased_id, property_address, property_type, lead_score)
                        VALUES (?, ?, ?, ?)
                        """,
                        [deceased_id, address, row.get("property_type", "不動産"), score],
                    )
                count += 1
        self.db.commit()
        return count

    def generate_dm_text(self, lead: dict) -> str:
        """Ollama (qwen3-bk:30b) でDM文章生成"""
        try:
            r = requests.post(
                f"{OLLAMA_HOST}/api/generate",
                json={
                    "model": "qwen3-bk:30b",
                    "prompt": (
                        "以下の相続案件の遺族向けに不動産買取・相続相談のご案内DMを作成してください。\n"
                        f"物件住所: {lead.get('property_address', '不明')}\n"
                        f"物件種別: {lead.get('property_type', '不動産')}\n"
                        "条件: 丁寧・誠実・押し売り感なし、無料相談を訴求、180字以内"
                    ),
                    "stream": False,
                    "options": {"temperature": 0.7, "num_predict": 300},
                },
                timeout=60,
            )
            if r.ok:
                return r.json().get("response", "").strip()[:400]
        except requests.RequestException:
            pass
        return (
            "この度はご家族様のご逝去に謹んでお悔やみ申し上げます。"
            "相続に伴う不動産のお取り扱いでお困りの際は、"
            "ぜひ当社の無料相談をご利用ください。"
        )

    def _calc_lead_score(self, deceased: dict, prop: dict) -> float:
        """リードスコア算出（0〜100）"""
        score = 50.0
        type_scores = {"戸建": 20, "土地": 15, "マンション": 10, "アパート": 8}
        score += type_scores.get(prop.get("property_type", ""), 5)

        age = deceased.get("age") or 75
        if age >= 80:
            score += 15
        elif age >= 70:
            score += 10
        elif age >= 60:
            score += 5

        major_cities = ["東京", "大阪", "名古屋", "横浜", "福岡", "札幌", "京都", "神戸"]
        addr = prop.get("property_address", "")
        if any(c in addr for c in major_cities):
            score += 10

        return min(100.0, score)

    def run(self) -> dict:
        """メイン実行"""
        print("&AI SOUZOKU Crawler 開始...", flush=True)
        obituaries = self.scrape_obituaries()
        print(f"取得: {len(obituaries)}件", flush=True)

        imported = 0
        for ob in obituaries:
            cur = self.db.execute(
                """
                INSERT INTO souzoku_deceased (name, age, source_name, published_date, raw_text)
                VALUES (?, ?, ?, ?, ?)
                """,
                [ob["name"], ob.get("age"), ob["source"], ob["published_date"], ob.get("raw_text")],
            )
            deceased_id = cur.lastrowid
            if deceased_id:
                score = self._calc_lead_score(ob, {})
                self.db.execute(
                    "INSERT INTO souzoku_leads (deceased_id, lead_score) VALUES (?, ?)",
                    [deceased_id, score],
                )
                imported += 1

        self.db.commit()
        print(f"完了: {imported}件登録", flush=True)
        return {"scraped": len(obituaries), "imported": imported}


def main() -> None:
    parser = argparse.ArgumentParser(description="&AI SOUZOKU Crawler")
    parser.add_argument("--db", default="sense.db", help="SQLite DB path")
    parser.add_argument("--csv", help="CSVファイルパス (手動インポート)")
    args = parser.parse_args()

    crawler = SouzokuCrawler(db_path=args.db)

    if args.csv:
        n = crawler.import_from_csv(args.csv)
        print(json.dumps({"imported": n}))
    else:
        result = crawler.run()
        print(json.dumps(result))


if __name__ == "__main__":
    main()
