import { getDb } from "./db";

export function seedDatabase() {
  const db = getDb();

  // Check if already seeded
  const sourceCount = db.prepare("SELECT COUNT(*) as count FROM sources").get() as { count: number };
  if (sourceCount.count > 0) return;

  // Seed sources
  const insertSource = db.prepare(`
    INSERT OR IGNORE INTO sources (name, url, type, category, language, enabled, last_fetched_at, article_count)
    VALUES (?, ?, ?, ?, ?, 1, datetime('now', '-1 hour'), ?)
  `);

  const sources = [
    ["TechCrunch", "https://techcrunch.com/feed/", "rss", "technology", "en", 47],
    ["Hacker News", "https://hnrss.org/frontpage", "rss", "technology", "en", 31],
    ["Reddit r/technology", "https://www.reddit.com/r/technology/.rss", "rss", "technology", "en", 22],
    ["NHK News (Japanese)", "https://www3.nhk.or.jp/rss/news/cat0.xml", "rss", "news", "ja", 18],
    ["Bloomberg Japan", "https://www.bloomberg.co.jp/feeds/bbiz", "rss", "finance", "ja", 14],
  ];

  sources.forEach(([name, url, type, category, language, count]) => {
    insertSource.run(name, url, type, category, language, count);
  });

  // Seed keywords
  const insertKeyword = db.prepare(`
    INSERT OR IGNORE INTO keywords (term, category, condition_type, related_terms, exclude_terms, priority, color)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const keywords = [
    ["AI", "technology", "OR", '["artificial intelligence","machine learning","LLM","GPT"]', '["AI art controversy"]', 5, "#6366f1"],
    ["OpenAI", "technology", "AND", '["ChatGPT","GPT-4","Sam Altman"]', '[]', 4, "#8b5cf6"],
    ["Startup", "business", "OR", '["venture capital","funding","Series A","IPO"]', '[]', 3, "#10b981"],
    ["Security", "technology", "OR", '["cybersecurity","breach","vulnerability","hack"]', '[]', 4, "#ef4444"],
    ["Japan", "news", "OR", '["日本","Tokyo","政府","経済"]', '[]', 3, "#f59e0b"],
    ["Climate", "environment", "OR", '["climate change","renewable energy","carbon","sustainability"]', '[]', 3, "#14b8a6"],
    ["Crypto", "finance", "OR", '["Bitcoin","Ethereum","blockchain","DeFi","NFT"]', '["meme coin"]', 2, "#f97316"],
    ["Apple", "technology", "AND", '["iPhone","Mac","iOS","Tim Cook","WWDC"]', '[]', 3, "#06b6d4"],
  ];

  keywords.forEach(([term, category, condition_type, related_terms, exclude_terms, priority, color]) => {
    insertKeyword.run(term, category, condition_type, related_terms, exclude_terms, priority, color);
  });

  // Seed articles with mock data
  const insertArticle = db.prepare(`
    INSERT OR IGNORE INTO articles 
    (source_id, title, content, summary, url, author, published_at, ai_score, sentiment, sentiment_score, keywords, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const mockArticles = [
    [1, "OpenAI Launches GPT-5 with Unprecedented Reasoning Capabilities", "OpenAI has announced the release of GPT-5, its most capable language model to date. The new model demonstrates remarkable improvements in reasoning, mathematical problem-solving, and multimodal understanding...", "OpenAI's GPT-5 sets new benchmarks in AI reasoning and multimodal capabilities, launching to select enterprise customers.", "https://techcrunch.com/2024/01/15/openai-gpt5", "Sarah Perez", "2024-01-15T09:00:00Z", 94, "positive", 0.82, '["AI","OpenAI"]', "technology"],
    [1, "Apple Vision Pro Hits 1 Million Sales in First Quarter", "Apple's mixed reality headset, the Vision Pro, has exceeded analyst expectations by reaching the 1 million unit sales milestone within its first quarter...", "Apple Vision Pro achieves significant sales milestone, defying skeptics of the spatial computing market.", "https://techcrunch.com/2024/01/14/apple-vision-pro-sales", "Darrell Etherington", "2024-01-14T14:30:00Z", 87, "positive", 0.74, '["Apple"]', "technology"],
    [2, "Ask HN: What are you building with local LLMs in 2024?", "The hacker news community discusses local LLM deployments, covering tools like Ollama, LM Studio, and various quantized models...", "Community discussion on local LLM tooling reveals growing interest in privacy-first AI deployments.", "https://news.ycombinator.com/item?id=38901234", "Various", "2024-01-14T11:00:00Z", 72, "neutral", 0.51, '["AI"]', "technology"],
    [1, "Major Security Breach Exposes 100M User Records at Tech Giant", "A major technology company has disclosed a significant data breach affecting approximately 100 million user accounts. The breach, discovered last week, exposed names, email addresses, and hashed passwords...", "Security incident affecting 100M users highlights ongoing vulnerabilities in enterprise data protection.", "https://techcrunch.com/2024/01/13/security-breach-100m", "Zack Whittaker", "2024-01-13T16:45:00Z", 91, "negative", -0.78, '["Security"]', "technology"],
    [3, "Reddit IPO Filing Reveals Massive Ad Revenue Growth", "Reddit has officially filed for its long-awaited IPO, revealing impressive advertising revenue growth of 48% year-over-year. The social platform reported $804 million in revenue...", "Reddit's IPO filing shows strong ad revenue growth as platform prepares for public market debut.", "https://reddit.com/r/technology/article/reddit-ipo", "u/tech_news_bot", "2024-01-13T10:20:00Z", 83, "positive", 0.61, '["Startup"]', "business"],
    [4, "日本政府、AIガバナンス法案を国会に提出", "日本政府は、人工知能の開発と利用に関する包括的なガバナンス法案を国会に提出した。この法案は、AIシステムの透明性、説明責任、安全性を確保することを目的としている...", "日本政府がAI規制の法整備を進め、透明性と安全性の確保を目指す。", "https://nhk.or.jp/news/ai-governance-2024", "NHK編集部", "2024-01-13T08:00:00Z", 88, "neutral", 0.45, '["AI","Japan"]', "news"],
    [5, "日本の新興企業、AIチップ開発で1000億円の資金調達", "東京を拠点とするAIチップスタートアップが、国内外の投資家から1000億円規模の資金調達を完了した。この資金は次世代AIプロセッサの開発に充てられる予定...", "国内AI半導体スタートアップが大型調達、国産AIインフラ整備に向けた動き加速。", "https://bloomberg.co.jp/news/ai-chip-startup", "Bloomberg編集部", "2024-01-12T12:30:00Z", 85, "positive", 0.69, '["AI","Startup","Japan"]', "finance"],
    [1, "Climate Tech Startups Raised $8.5B in Q4 2023", "Climate technology companies raised a record $8.5 billion in the fourth quarter of 2023, signaling continued investor confidence in the sector despite broader market headwinds...", "Record climate tech investment in Q4 2023 reflects sustained investor commitment to clean energy transition.", "https://techcrunch.com/2024/01/12/climate-tech-q4", "Tim De Chant", "2024-01-12T09:15:00Z", 79, "positive", 0.66, '["Climate","Startup"]', "environment"],
    [2, "Show HN: I built an open-source alternative to Perplexity AI", "Introducing Quasar Search - a fully open-source AI-powered search engine that respects your privacy. Built with Rust, Ollama, and React...", "Open-source Perplexity alternative gains traction on Hacker News, demonstrating community demand for privacy-first AI search.", "https://news.ycombinator.com/item?id=38891234", "throwaway_hacker", "2024-01-12T06:00:00Z", 76, "positive", 0.58, '["AI"]', "technology"],
    [1, "Ethereum ETF Gets SEC Approval, Market Surges 15%", "The Securities and Exchange Commission has approved the first spot Ethereum ETF applications, triggering a 15% surge in ETH price and broader crypto market enthusiasm...", "SEC approval of Ethereum ETF marks major regulatory milestone, sending crypto markets sharply higher.", "https://techcrunch.com/2024/01/11/ethereum-etf-sec", "Jacquelyn Melinek", "2024-01-11T15:00:00Z", 92, "positive", 0.88, '["Crypto"]', "finance"],
    [3, "Tesla Cybertruck Production Issues Continue to Plague Launch", "Tesla's highly anticipated Cybertruck is facing continued production challenges, with reports of quality control issues and slower-than-expected factory ramp...", "Cybertruck production difficulties raise questions about Tesla's manufacturing capacity amid high demand.", "https://reddit.com/r/technology/tesla-cybertruck", "u/ev_watcher", "2024-01-11T09:45:00Z", 68, "negative", -0.42, '[]', "technology"],
    [4, "サイバーセキュリティ企業、量子暗号化技術を発表", "国内大手サイバーセキュリティ企業が、量子コンピューティング時代に対応した新しい暗号化技術を発表した。この技術は現在の暗号化手法が量子コンピュータに脆弱になる問題を解決する...", "量子耐性暗号技術の実用化が加速、ポスト量子時代のセキュリティ基盤整備へ。", "https://nhk.or.jp/news/quantum-security", "NHK技術部", "2024-01-11T07:30:00Z", 81, "positive", 0.55, '["Security","Japan"]', "technology"],
    [1, "Microsoft Copilot Integration Drives 40% Productivity Boost in Enterprise", "A new study commissioned by Microsoft shows that enterprise users leveraging Copilot AI assistance report an average 40% improvement in task completion speed...", "Microsoft Copilot demonstrates measurable productivity gains in enterprise settings, supporting aggressive AI integration strategy.", "https://techcrunch.com/2024/01/10/microsoft-copilot-productivity", "Frederic Lardinois", "2024-01-10T13:00:00Z", 77, "positive", 0.63, '["AI"]', "technology"],
    [2, "The death of the junior developer role", "As AI coding assistants become more capable, many in the industry are questioning what role junior developers will play in the future of software engineering...", "Industry debate on AI's impact on junior developer roles intensifies as coding assistants advance.", "https://news.ycombinator.com/item?id=38881234", "Various", "2024-01-10T10:30:00Z", 74, "negative", -0.31, '["AI"]', "technology"],
    [5, "日銀、マイナス金利政策の終了を検討と報道", "日本銀行がマイナス金利政策の終了を検討していると複数のメディアが報道した。円高が進み、国債利回りも上昇している...", "日銀のマイナス金利解除観測が強まり、円高・金利上昇の動きが加速。", "https://bloomberg.co.jp/news/boj-negative-rate", "Bloomberg経済部", "2024-01-10T04:00:00Z", 89, "neutral", 0.38, '["Japan"]', "finance"],
    [1, "Google DeepMind Breakthrough Solves Protein Folding for Rare Diseases", "Google DeepMind has announced a major breakthrough in protein folding prediction for rare genetic diseases, potentially accelerating drug discovery for conditions that have no current treatment...", "DeepMind's protein folding breakthrough could transform treatment development for rare genetic diseases.", "https://techcrunch.com/2024/01/09/deepmind-protein-folding", "Natasha Mascarenhas", "2024-01-09T11:00:00Z", 95, "positive", 0.91, '["AI"]', "technology"],
    [3, "Amazon Lays Off 2,000 More Workers in AWS Division", "Amazon has announced another round of layoffs affecting approximately 2,000 employees primarily in its Amazon Web Services division. The company cited restructuring efforts...", "AWS layoffs continue Amazon's broader workforce reduction, signaling continued cost optimization in cloud division.", "https://reddit.com/r/technology/amazon-layoffs", "u/tech_layoffs_tracker", "2024-01-09T16:30:00Z", 71, "negative", -0.53, '[]', "business"],
    [4, "スタートアップ支援施策、過去最大規模に拡充", "経済産業省は、スタートアップ企業への支援施策を過去最大規模に拡充すると発表した。5年間で10兆円規模の投資を呼び込む目標を掲げている...", "経産省の大規模スタートアップ支援策が始動、日本のイノベーションエコシステム強化へ。", "https://nhk.or.jp/news/startup-support", "NHK経済部", "2024-01-09T06:45:00Z", 82, "positive", 0.71, '["Startup","Japan"]', "business"],
    [1, "New Study Warns AI Could Consume More Power Than Small Countries by 2030", "A comprehensive study on AI energy consumption projects that data centers running large AI models could consume electricity equivalent to several small nations by 2030...", "Research highlights escalating energy demands of AI infrastructure, raising sustainability concerns for the industry.", "https://techcrunch.com/2024/01/08/ai-energy-consumption", "Tim De Chant", "2024-01-08T09:00:00Z", 86, "negative", -0.44, '["AI","Climate"]', "technology"],
    [2, "PostgreSQL 17 Beta Released with Major Performance Improvements", "PostgreSQL 17 beta is now available, featuring significant performance improvements including faster vacuum operations, improved parallel query execution, and new JSON functions...", "PostgreSQL 17 beta brings substantial performance gains and developer features ahead of stable release.", "https://news.ycombinator.com/item?id=38871234", "postgres_dev", "2024-01-08T13:00:00Z", 65, "positive", 0.48, '[]', "technology"],
    [1, "Anthropic Raises $750M Series C at $18.4B Valuation", "AI safety company Anthropic has closed a $750 million Series C funding round, pushing its valuation to $18.4 billion. The round was led by Google with participation from Spark Capital...", "Anthropic's latest funding round underscores intense investor competition in foundational AI model development.", "https://techcrunch.com/2024/01/07/anthropic-funding", "Connie Loizos", "2024-01-07T14:00:00Z", 93, "positive", 0.84, '["AI","Startup"]', "technology"],
  ];

  mockArticles.forEach(args => {
    insertArticle.run(...args);
  });

  // Seed sentiment history
  const insertSentiment = db.prepare(`
    INSERT OR IGNORE INTO sentiment_history (date, category, keyword, positive_count, neutral_count, negative_count, avg_score)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const categories = ["technology", "business", "finance", "news", "environment"];
  const sentimentKeywords = ["AI", "Security", "Startup", "Crypto", "Japan"];

  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    categories.forEach(cat => {
      const base = Math.floor(Math.random() * 15) + 5;
      const pos = Math.floor(base * (0.3 + Math.random() * 0.3));
      const neg = Math.floor(base * (0.1 + Math.random() * 0.2));
      const neu = base - pos - neg;
      const avgScore = (pos * 0.7 - neg * 0.7 + neu * 0.1) / Math.max(base, 1);
      insertSentiment.run(dateStr, cat, null, Math.max(pos, 0), Math.max(neu, 0), Math.max(neg, 0), avgScore);
    });

    sentimentKeywords.forEach(kw => {
      const base = Math.floor(Math.random() * 8) + 2;
      const pos = Math.floor(base * (0.3 + Math.random() * 0.3));
      const neg = Math.floor(base * (0.1 + Math.random() * 0.2));
      const neu = base - pos - neg;
      const avgScore = (pos * 0.7 - neg * 0.7) / Math.max(base, 1);
      insertSentiment.run(dateStr, "keyword", kw, Math.max(pos, 0), Math.max(neu, 0), Math.max(neg, 0), avgScore);
    });
  }

  // Seed trend history
  const insertTrend = db.prepare(`
    INSERT OR IGNORE INTO trend_history (topic, date, article_count, avg_score, velocity, predicted_peak)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const topics = ["AI", "Security", "Crypto", "Climate", "Apple", "OpenAI"];
  topics.forEach(topic => {
    let prevCount = Math.floor(Math.random() * 10) + 2;
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const count = Math.max(1, prevCount + Math.floor(Math.random() * 5) - 2);
      const velocity = (count - prevCount) / Math.max(prevCount, 1);
      const avgScore = 60 + Math.floor(Math.random() * 30);
      const predictedPeak = velocity > 0.2 ? new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0] : null;
      insertTrend.run(topic, dateStr, count, avgScore, velocity, predictedPeak);
      prevCount = count;
    }
  });

  // Seed alerts
  const insertAlert = db.prepare(`
    INSERT OR IGNORE INTO alerts (article_id, channel, status, message, sent_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const alertData = [
    [1, "telegram", "sent", "High-importance article: OpenAI Launches GPT-5 (Score: 94)", "2024-01-15T09:01:00Z"],
    [4, "telegram", "sent", "High-importance article: Major Security Breach (Score: 91)", "2024-01-13T16:46:00Z"],
    [10, "telegram", "sent", "High-importance article: Ethereum ETF SEC Approval (Score: 92)", "2024-01-11T15:01:00Z"],
    [16, "email", "sent", "Critical article: DeepMind Protein Folding Breakthrough (Score: 95)", "2024-01-09T11:01:00Z"],
    [21, "telegram", "sent", "High-importance article: Anthropic Raises $750M (Score: 93)", "2024-01-07T14:01:00Z"],
    [6, "webhook", "sent", "AI Governance article detected: 日本政府、AIガバナンス法案 (Score: 88)", "2024-01-13T08:01:00Z"],
    [2, "telegram", "failed", "Apple Vision Pro Sales article (Score: 87)", "2024-01-14T14:31:00Z"],
    [15, "email", "sent", "BOJ Policy Change: 日銀、マイナス金利政策 (Score: 89)", "2024-01-10T04:01:00Z"],
  ];

  alertData.forEach(args => {
    insertAlert.run(...args);
  });

  // Seed settings
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
  `);

  const defaultSettings = [
    ["score_threshold", "70"],
    ["briefing_time_morning", "08:00"],
    ["briefing_time_evening", "20:00"],
    ["briefing_enabled", "true"],
    ["scrape_interval", "30"],
    ["notification_channels", '["telegram"]'],
    ["telegram_enabled", "true"],
    ["email_enabled", "false"],
    ["webhook_enabled", "false"],
    ["language", "en"],
    ["theme", "dark"],
    ["max_articles_per_briefing", "5"],
  ];

  defaultSettings.forEach(([key, value]) => {
    insertSetting.run(key, value);
  });

  // Seeding complete (log removed for production)
}
