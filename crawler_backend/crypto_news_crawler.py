#!/usr/bin/env python3
"""
free-crypto-news API統合
APIキー不要・200+ソース・感情分析内蔵
&AI SENSEのセンチメント分析に使用
"""

import asyncio
import json
import sqlite3
from datetime import datetime
from pathlib import Path

import httpx


class CryptoNewsCrawler:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.setup_tables()

    def setup_tables(self) -> None:
        db = sqlite3.connect(self.db_path)
        db.executescript("""
            CREATE TABLE IF NOT EXISTS crypto_news (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                text TEXT,
                source_name TEXT,
                source_url TEXT,
                news_url TEXT UNIQUE,
                tickers TEXT,
                topics TEXT,
                sentiment TEXT,
                sentiment_score REAL,
                published_at TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_crypto_sentiment ON crypto_news(sentiment);
            CREATE INDEX IF NOT EXISTS idx_crypto_published ON crypto_news(published_at);
        """)
        db.commit()
        db.close()

    async def fetch_news(self, tickers: str = "BTC,ETH") -> list[dict]:
        """暗号資産ニュース取得"""
        endpoints = [
            # nirholas/free-crypto-news
            ("https://free-crypto-news.vercel.app/api/news", {"tickers": tickers, "items": 50}),
            # フォールバック
            ("https://cryptonews-api.com/api/v1/category", {"section": "alltickers", "items": 30, "token": "demo"}),
        ]

        async with httpx.AsyncClient(timeout=15) as client:
            for url, params in endpoints:
                try:
                    r = await client.get(url, params=params)
                    if r.status_code == 200:
                        return r.json().get("data", [])
                except Exception as e:
                    print(f"Crypto news endpoint failed ({url}): {e}")

        return []

    def analyze_sentiment(self, articles: list[dict]) -> dict:
        """感情分析集計"""
        counts: dict[str, int] = {"positive": 0, "negative": 0, "neutral": 0}

        for art in articles:
            s = art.get("sentiment", "neutral").lower()
            if s in counts:
                counts[s] += 1

        total = sum(counts.values()) or 1
        return {
            "positive_ratio": counts["positive"] / total,
            "negative_ratio": counts["negative"] / total,
            "neutral_ratio": counts["neutral"] / total,
            "total": total,
            "score": (counts["positive"] - counts["negative"]) / total,
        }

    async def run(self) -> dict:
        """実行"""
        btc_news = await self.fetch_news("BTC")
        await asyncio.sleep(1)
        eth_news = await self.fetch_news("ETH")

        all_news = btc_news + eth_news
        db = sqlite3.connect(self.db_path)
        saved = 0

        try:
            for article in all_news:
                news_url = article.get("news_url", "")
                if not news_url:
                    continue

                exists = db.execute(
                    "SELECT id FROM crypto_news WHERE news_url=?",
                    [news_url],
                ).fetchone()

                if not exists:
                    db.execute(
                        """
                        INSERT INTO crypto_news
                        (title, text, source_name, source_url, news_url,
                         tickers, topics, sentiment, sentiment_score, published_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        [
                            article.get("title"),
                            (article.get("text", "") or "")[:500],
                            article.get("source_name"),
                            article.get("source_url"),
                            news_url,
                            json.dumps(article.get("tickers", [])),
                            json.dumps(article.get("topics", [])),
                            article.get("sentiment", "neutral"),
                            article.get("sentiment_score", 0.0),
                            article.get("date"),
                        ],
                    )
                    saved += 1

            db.commit()
        finally:
            db.close()

        sentiment = self.analyze_sentiment(all_news)
        print(f"Crypto news: {saved}件保存, センチメント: {sentiment['score']:.2f}")
        return sentiment


if __name__ == "__main__":
    db_path = str(Path(__file__).parent / "sense.db")
    crawler = CryptoNewsCrawler(db_path)
    asyncio.run(crawler.run())
