import { getDb } from "./db";

interface Article {
  id: number;
  title: string;
  url: string;
  ai_score: number;
  summary?: string;
  sentiment?: string;
}

// Telegram
export async function sendTelegram(message: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return false;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
          disable_web_page_preview: false,
        }),
        signal: AbortSignal.timeout(10_000),
      }
    );
    return response.ok;
  } catch (error) {
    console.error("Telegram error:", error);
    return false;
  }
}

// Email
export async function sendEmail(subject: string, html: string): Promise<boolean> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return false;

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || "587"),
      secure: SMTP_PORT === "465",
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: SMTP_USER,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Email error:", error);
    return false;
  }
}

// Webhook
export async function sendWebhook(payload: Record<string, unknown>): Promise<boolean> {
  const url = process.env.WEBHOOK_URL;
  if (!url) return false;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    return response.ok;
  } catch (error) {
    console.error("Webhook error:", error);
    return false;
  }
}

// Route notification by importance
export async function notifyArticle(article: Article): Promise<void> {
  const db = getDb();
  const score = article.ai_score;

  const channels: string[] = [];

  if (score >= 90) {
    // Critical: all channels
    channels.push("telegram", "email", "webhook");
  } else if (score >= 80) {
    // High: telegram + webhook
    channels.push("telegram", "webhook");
  } else if (score >= 70) {
    // Medium: telegram only
    channels.push("telegram");
  }

  const message = `*[AI Score: ${score}]* ${article.title}\n\n${article.summary || ""}\n\n[Read more](${article.url})`;

  for (const channel of channels) {
    let success = false;
    try {
      if (channel === "telegram") {
        success = await sendTelegram(message);
      } else if (channel === "email") {
        success = await sendEmail(
          `[AI Sense] Important: ${article.title}`,
          `<h2>${article.title}</h2><p>AI Score: ${score}</p><p>${article.summary || ""}</p><a href="${article.url}">Read more</a>`
        );
      } else if (channel === "webhook") {
        success = await sendWebhook({
          type: "article_alert",
          article: { id: article.id, title: article.title, url: article.url, score },
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error(`[notifyArticle] ${channel} notification failed for article ${article.id}:`, err);
      success = false;
    }

    db.prepare(`
      INSERT INTO alerts (article_id, channel, status, message, sent_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(article.id, channel, success ? "sent" : "failed", message.slice(0, 500));
  }

  if (channels.length > 0) {
    db.prepare("UPDATE articles SET is_notified = 1 WHERE id = ?").run(article.id);
  }
}
