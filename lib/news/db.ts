import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "db");
const DB_PATH = path.join(DB_DIR, "andai-sense.db");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT 'rss',
      category TEXT DEFAULT 'general',
      language TEXT DEFAULT 'en',
      enabled INTEGER DEFAULT 1,
      last_fetched_at TEXT,
      article_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id INTEGER REFERENCES sources(id),
      title TEXT NOT NULL,
      content TEXT,
      summary TEXT,
      url TEXT UNIQUE NOT NULL,
      author TEXT,
      published_at TEXT,
      fetched_at TEXT DEFAULT (datetime('now')),
      ai_score INTEGER DEFAULT NULL,
      sentiment TEXT DEFAULT NULL,
      sentiment_score REAL DEFAULT NULL,
      keywords TEXT DEFAULT '[]',
      category TEXT DEFAULT 'general',
      language TEXT DEFAULT 'en',
      is_notified INTEGER DEFAULT 0,
      is_read INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS keywords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      term TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      condition_type TEXT DEFAULT 'OR',
      related_terms TEXT DEFAULT '[]',
      exclude_terms TEXT DEFAULT '[]',
      priority INTEGER DEFAULT 1,
      color TEXT DEFAULT '#6366f1',
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS keyword_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER REFERENCES articles(id),
      keyword_id INTEGER REFERENCES keywords(id),
      matched_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER REFERENCES articles(id),
      channel TEXT NOT NULL,
      status TEXT DEFAULT 'sent',
      message TEXT,
      sent_at TEXT DEFAULT (datetime('now')),
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS sentiment_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      keyword TEXT,
      positive_count INTEGER DEFAULT 0,
      neutral_count INTEGER DEFAULT 0,
      negative_count INTEGER DEFAULT 0,
      avg_score REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trend_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      date TEXT NOT NULL,
      article_count INTEGER DEFAULT 0,
      avg_score REAL DEFAULT 0,
      velocity REAL DEFAULT 0,
      predicted_peak TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS briefings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      article_ids TEXT DEFAULT '[]',
      sent_at TEXT DEFAULT (datetime('now')),
      channel TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_score ON articles(ai_score DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source_id);
    CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
    CREATE INDEX IF NOT EXISTS idx_trend_topic ON trend_history(topic, date);
    CREATE INDEX IF NOT EXISTS idx_sentiment_date ON sentiment_history(date, category);
  `);
}

export default getDb;
