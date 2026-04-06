// AI scoring and analysis via OpenRouter API

interface ScoringResult {
  score: number;
  sentiment: "positive" | "neutral" | "negative";
  sentiment_score: number;
  summary: string;
  keywords: string[];
  category: string;
}

interface BriefingResult {
  title: string;
  content: string;
  articles: { title: string; score: number; summary: string }[];
}

export async function scoreArticle(
  title: string,
  content: string
): Promise<ScoringResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    // Return mock data if no API key
    return mockScore(title, content);
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "AI Sense",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a business intelligence analyst. Analyze the given news article and respond with a JSON object containing:
- score (0-100): importance for business/tech professionals
- sentiment: "positive", "neutral", or "negative"
- sentiment_score: float from -1 to 1
- summary: 1-2 sentence summary
- keywords: array of up to 5 relevant keyword strings
- category: one of "technology", "business", "finance", "news", "environment", "other"

Respond ONLY with valid JSON, no markdown.`,
          },
          {
            role: "user",
            content: `Title: ${title}\n\nContent: ${content?.slice(0, 2000) || title}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content0 = (data.choices as Array<{ message: { content: string } }> | undefined)?.[0]?.message?.content;
    if (!content0) throw new Error("Empty OpenRouter response");
    const result = JSON.parse(content0);

    return {
      score: Math.min(100, Math.max(0, result.score || 50)),
      sentiment: result.sentiment || "neutral",
      sentiment_score: result.sentiment_score || 0,
      summary: result.summary || "",
      keywords: result.keywords || [],
      category: result.category || "general",
    };
  } catch (error) {
    console.error("AI scoring error:", error);
    return mockScore(title, content);
  }
}

function mockScore(title: string, _content: string): ScoringResult {
  const lowerTitle = title.toLowerCase();
  let score = 50 + Math.floor(Math.random() * 30);
  let sentiment: "positive" | "neutral" | "negative" = "neutral";
  let sentimentScore = 0;

  if (lowerTitle.includes("breach") || lowerTitle.includes("hack") || lowerTitle.includes("layoff")) {
    sentiment = "negative";
    sentimentScore = -(0.5 + Math.random() * 0.4);
    score = 75 + Math.floor(Math.random() * 20);
  } else if (lowerTitle.includes("launch") || lowerTitle.includes("raises") || lowerTitle.includes("breakthrough")) {
    sentiment = "positive";
    sentimentScore = 0.5 + Math.random() * 0.4;
    score = 70 + Math.floor(Math.random() * 25);
  }

  return {
    score,
    sentiment,
    sentiment_score: sentimentScore,
    summary: `Analysis of: ${title.slice(0, 100)}`,
    keywords: [],
    category: "technology",
  };
}

export async function generateBriefing(
  articles: { title: string; score: number; summary: string; sentiment: string }[],
  type: "morning" | "evening",
  language: "en" | "ja" = "en"
): Promise<BriefingResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const top5 = articles.slice(0, 5);

  if (!apiKey) {
    return mockBriefing(top5, type, language);
  }

  try {
    const langInstructions = language === "ja" ? "Respond in Japanese." : "Respond in English.";
    const timeLabel = type === "morning" ? "Morning" : "Evening";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "AI Sense",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a professional news briefing writer. Create a concise ${timeLabel} briefing from the top articles. ${langInstructions}
Respond with a JSON object containing: title (string), content (markdown string with brief analysis).`,
          },
          {
            role: "user",
            content: `Top articles:\n${top5.map((a, i) => `${i + 1}. [Score: ${a.score}] ${a.title}\nSummary: ${a.summary}`).join("\n\n")}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) throw new Error("API error");

    const data = await response.json();
    const content0 = (data.choices as Array<{ message: { content: string } }> | undefined)?.[0]?.message?.content;
    if (!content0) throw new Error("Empty OpenRouter response");
    const result = JSON.parse(content0);

    return {
      title: result.title,
      content: result.content,
      articles: top5,
    };
  } catch (error) {
    console.error("Briefing generation error:", error);
    return mockBriefing(top5, type, language);
  }
}

function mockBriefing(
  articles: { title: string; score: number; summary: string }[],
  type: "morning" | "evening",
  language: "en" | "ja"
): BriefingResult {
  const timeLabel = language === "ja"
    ? (type === "morning" ? "朝のブリーフィング" : "夕方のブリーフィング")
    : (type === "morning" ? "Morning Briefing" : "Evening Briefing");

  const content = language === "ja"
    ? `本日の重要ニュースTop ${articles.length}をお届けします。\n\n${articles.map((a, i) => `**${i + 1}. ${a.title}** (スコア: ${a.score})\n${a.summary}`).join("\n\n")}`
    : `Here are the top ${articles.length} important stories for today:\n\n${articles.map((a, i) => `**${i + 1}. ${a.title}** (Score: ${a.score})\n${a.summary}`).join("\n\n")}`;

  return {
    title: `${timeLabel} - ${new Date().toLocaleDateString()}`,
    content,
    articles,
  };
}
