/**
 * Multi-platform publishing module
 * Handles pushing articles and news to Telegram, WeChat, Weibo, Twitter, etc.
 */
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { mediaPlatforms, publishLogs, articles, cryptoNews } from "../../drizzle/schema";
import { ENV } from "./env";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublishContent {
  type: "article" | "news";
  id: number;
  title: string;
  excerpt?: string | null;
  url?: string | null;
  source?: string;
}

interface PlatformConfig {
  platform: string;
  apiKey?: string | null;
  apiSecret?: string | null;
  channelId?: string | null;
  extraConfig?: string | null;
}

// ─── Telegram Publisher ───────────────────────────────────────────────────────

async function publishToTelegram(content: PublishContent, config: PlatformConfig): Promise<string> {
  const token = config.apiKey || ENV.telegramBotToken;
  const channelId = config.channelId || ENV.telegramChannelId;

  if (!token || !channelId) {
    throw new Error("Telegram Bot Token 或 Channel ID 未配置");
  }

  let text = "";
  if (content.type === "article") {
    text = `📰 *${escapeMarkdown(content.title)}*\n\n`;
    if (content.excerpt) {
      text += `${escapeMarkdown(content.excerpt.slice(0, 200))}...\n\n`;
    }
    if (content.url) {
      text += `🔗 [阅读全文](${content.url})`;
    }
    text += `\n\n_来源：Get8Pro | get8\\.pro_`;
  } else {
    text = `⚡ *快讯* | ${escapeMarkdown(content.title)}`;
    if (content.source) text += `\n\n_来源：${escapeMarkdown(content.source)}_`;
    if (content.url) text += `\n🔗 [原文](${content.url})`;
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: channelId,
      text,
      parse_mode: "MarkdownV2",
      disable_web_page_preview: false,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  const data = await res.json() as { ok: boolean; description?: string };
  if (!data.ok) throw new Error(`Telegram API 错误: ${data.description}`);
  return "推送成功";
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

// ─── WeChat Publisher (placeholder) ──────────────────────────────────────────

async function publishToWechat(content: PublishContent, config: PlatformConfig): Promise<string> {
  // WeChat Official Account API requires app_id + app_secret
  // This is a placeholder — full implementation requires WeChat developer account
  if (!config.apiKey || !config.apiSecret) {
    throw new Error("微信公众号 AppID 或 AppSecret 未配置");
  }
  // TODO: Implement WeChat Official Account API
  // 1. Get access_token via /cgi-bin/token
  // 2. Upload media (cover image)
  // 3. Create draft via /cgi-bin/draft/add
  // 4. Publish draft via /cgi-bin/freepublish/submit
  throw new Error("微信公众号推送功能开发中，请等待 DeepSeek API 接入后完善");
}

// ─── Weibo Publisher (placeholder) ───────────────────────────────────────────

async function publishToWeibo(content: PublishContent, config: PlatformConfig): Promise<string> {
  if (!config.apiKey) {
    throw new Error("微博 Access Token 未配置");
  }
  // TODO: Implement Weibo API
  // POST https://api.weibo.com/2/statuses/share.json
  throw new Error("微博推送功能开发中，请等待 API 接入后完善");
}

// ─── Twitter/X Publisher (placeholder) ───────────────────────────────────────

async function publishToTwitter(content: PublishContent, config: PlatformConfig): Promise<string> {
  if (!config.apiKey || !config.apiSecret) {
    throw new Error("Twitter API Key 或 Secret 未配置");
  }
  // TODO: Implement Twitter API v2
  // POST https://api.twitter.com/2/tweets
  throw new Error("Twitter/X 推送功能开发中，请等待 API 接入后完善");
}

// ─── Main publish function ────────────────────────────────────────────────────

export async function publishContent(
  content: PublishContent,
  platformIds: string[]
): Promise<Array<{ platform: string; status: "success" | "failed"; message: string }>> {
  const db = await getDb();
  if (!db) return [];

  const results: Array<{ platform: string; status: "success" | "failed"; message: string }> = [];

  for (const platformId of platformIds) {
    // Get platform config
    const [platformConfig] = await db
      .select()
      .from(mediaPlatforms)
      .where(eq(mediaPlatforms.platform, platformId))
      .limit(1);

    if (!platformConfig?.isEnabled) {
      results.push({ platform: platformId, status: "skipped" as "failed", message: "平台未启用" });
      continue;
    }

    let status: "success" | "failed" = "failed";
    let message = "";

    try {
      switch (platformId) {
        case "telegram":
          message = await publishToTelegram(content, platformConfig);
          status = "success";
          break;
        case "wechat":
          message = await publishToWechat(content, platformConfig);
          status = "success";
          break;
        case "weibo":
          message = await publishToWeibo(content, platformConfig);
          status = "success";
          break;
        case "twitter":
          message = await publishToTwitter(content, platformConfig);
          status = "success";
          break;
        default:
          message = `未知平台: ${platformId}`;
      }
    } catch (e) {
      message = e instanceof Error ? e.message : String(e);
      status = "failed";
    }

    // Log the publish attempt
    await db.insert(publishLogs).values({
      contentType: content.type,
      contentId: content.id,
      contentTitle: content.title.slice(0, 255),
      platform: platformId,
      status,
      response: message.slice(0, 1000),
    });

    results.push({ platform: platformId, status, message });
  }

  return results;
}

// ─── Auto-publish article to enabled platforms ────────────────────────────────

export async function autoPublishArticle(articleId: number, articleUrl: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const [article] = await db
    .select()
    .from(articles)
    .where(eq(articles.id, articleId))
    .limit(1);

  if (!article) return;

  // Get platforms with autoPublish enabled
  const enabledPlatforms = await db
    .select()
    .from(mediaPlatforms)
    .where(eq(mediaPlatforms.autoPublish, true));

  if (!enabledPlatforms.length) return;

  const content: PublishContent = {
    type: "article",
    id: articleId,
    title: article.title,
    excerpt: article.excerpt,
    url: articleUrl,
  };

  await publishContent(content, enabledPlatforms.map((p: { platform: string }) => p.platform));
}
