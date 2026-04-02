import { and, eq } from "drizzle-orm";
import { articles, mediaPlatforms, publishLogs } from "../../drizzle/schema";
import { getDb } from "../db";
import { ENV } from "./env";
import { getPlatformCapability } from "./mediaAutomation";

export interface PublishContent {
  type: "article" | "news";
  id: number;
  title: string;
  excerpt?: string | null;
  url?: string | null;
  source?: string;
}

export interface PlatformConfig {
  platform: string;
  apiKey?: string | null;
  apiSecret?: string | null;
  channelId?: string | null;
  extraConfig?: string | null;
}

export interface PublishResult {
  platform: string;
  status: "success" | "failed" | "skipped";
  message: string;
}

interface PlatformPublisher {
  readonly platformId: string;
  readonly displayName: string;
  publish(content: PublishContent, config: PlatformConfig): Promise<string>;
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

function buildPlainText(content: PublishContent): string {
  const chunks = [content.title];
  if (content.excerpt) chunks.push(content.excerpt);
  if (content.source && content.type === "news") chunks.push(`Source: ${content.source}`);
  if (content.url) chunks.push(content.url);
  return chunks.filter(Boolean).join("\n\n");
}

function buildNotionBlocks(content: PublishContent) {
  const blocks: Array<Record<string, unknown>> = [
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [{ type: "text", text: { content: content.title } }],
      },
    },
  ];

  if (content.excerpt) {
    blocks.push({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [{ type: "text", text: { content: content.excerpt.slice(0, 1800) } }],
      },
    });
  }

  if (content.url) {
    blocks.push({
      object: "block",
      type: "bookmark",
      bookmark: { url: content.url },
    });
  }

  return blocks;
}

class TelegramPublisher implements PlatformPublisher {
  readonly platformId = "telegram";
  readonly displayName = "Telegram";

  async publish(content: PublishContent, config: PlatformConfig): Promise<string> {
    const token = config.apiKey || ENV.telegramBotToken;
    const channelId = config.channelId || ENV.telegramChannelId;

    if (!token || !channelId) {
      throw new Error("Telegram Bot Token or Channel ID is not configured.");
    }

    let text = "";
    if (content.type === "article") {
      text = `📪 *${escapeMarkdown(content.title)}*\n\n`;
      if (content.excerpt) {
        text += `${escapeMarkdown(content.excerpt.slice(0, 200))}\\.\\.\\.\n\n`;
      }
      if (content.url) {
        text += `🔗 [Read the full article](${content.url})`;
      }
      text += "\n\n_Get8 Pro | get8\\.pro_";
    } else {
      text = `⚡ *Flash Update* | ${escapeMarkdown(content.title)}`;
      if (content.source) text += `\n\n_Source: ${escapeMarkdown(content.source)}_`;
      if (content.url) text += `\n🔗 [Original link](${content.url})`;
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
    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description ?? "unknown error"}`);
    }

    return "Published to Telegram.";
  }
}

class WechatPublisher implements PlatformPublisher {
  readonly platformId = "wechat";
  readonly displayName = "微信公众号";

  async publish(): Promise<string> {
    throw new Error("WeChat currently uses the assisted workflow. Generate a media draft package instead.");
  }
}

class WeiboPublisher implements PlatformPublisher {
  readonly platformId = "weibo";
  readonly displayName = "微博";

  async publish(): Promise<string> {
    throw new Error("Weibo currently uses the assisted workflow. Generate a platform-specific short draft instead.");
  }
}

class TwitterPublisher implements PlatformPublisher {
  readonly platformId = "twitter";
  readonly displayName = "Twitter/X";

  async publish(): Promise<string> {
    throw new Error("Twitter/X currently uses the assisted workflow. Generate a thread draft instead.");
  }
}

class DouyinPublisher implements PlatformPublisher {
  readonly platformId = "douyin";
  readonly displayName = "抖音";

  async publish(): Promise<string> {
    throw new Error("Douyin is still planned and does not support publishing yet.");
  }
}

class DiscordPublisher implements PlatformPublisher {
  readonly platformId = "discord";
  readonly displayName = "Discord";

  async publish(content: PublishContent, config: PlatformConfig): Promise<string> {
    const webhookUrl = config.apiKey || config.channelId;
    if (!webhookUrl) {
      throw new Error("Discord Webhook URL is not configured.");
    }

    const embed = {
      title: content.title,
      description: (content.excerpt || content.source || "").slice(0, 4000) || undefined,
      url: content.url || undefined,
      color: content.type === "article" ? 0x22c55e : 0x06b6d4,
      footer: { text: "Get8 Pro" },
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: content.url ? `New ${content.type}: ${content.url}` : `New ${content.type} from Get8 Pro`,
        embeds: [embed],
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      throw new Error(`Discord webhook failed: ${res.status} ${res.statusText}`);
    }

    return "Published to Discord via webhook.";
  }
}

class SlackPublisher implements PlatformPublisher {
  readonly platformId = "slack";
  readonly displayName = "Slack";

  async publish(content: PublishContent, config: PlatformConfig): Promise<string> {
    const webhookUrl = config.apiKey || config.channelId;
    if (!webhookUrl) {
      throw new Error("Slack Incoming Webhook URL is not configured.");
    }

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: buildPlainText(content),
        blocks: [
          {
            type: "header",
            text: { type: "plain_text", text: content.title.slice(0, 150), emoji: true },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: content.excerpt
                ? `${content.excerpt.slice(0, 280)}${content.url ? `\n\n<${content.url}|Open link>` : ""}`
                : content.url
                  ? `<${content.url}|Open link>`
                  : buildPlainText(content).slice(0, 280),
            },
          },
        ],
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      throw new Error(`Slack webhook failed: ${res.status} ${res.statusText}`);
    }

    return "Published to Slack via incoming webhook.";
  }
}

class RedditPublisher implements PlatformPublisher {
  readonly platformId = "reddit";
  readonly displayName = "Reddit";

  async publish(): Promise<string> {
    throw new Error("Reddit currently uses the assisted workflow. Generate a discussion-post draft instead.");
  }
}

class LinePublisher implements PlatformPublisher {
  readonly platformId = "line";
  readonly displayName = "LINE";

  async publish(): Promise<string> {
    throw new Error("LINE is still planned and does not support publishing yet.");
  }
}

class InstagramPublisher implements PlatformPublisher {
  readonly platformId = "instagram";
  readonly displayName = "Instagram";

  async publish(): Promise<string> {
    throw new Error("Instagram is still planned and does not support publishing yet.");
  }
}

class FacebookPublisher implements PlatformPublisher {
  readonly platformId = "facebook";
  readonly displayName = "Facebook";

  async publish(): Promise<string> {
    throw new Error("Facebook is still planned and does not support publishing yet.");
  }
}

class NotionPublisher implements PlatformPublisher {
  readonly platformId = "notion";
  readonly displayName = "Notion";

  async publish(content: PublishContent, config: PlatformConfig): Promise<string> {
    if (!config.apiKey) {
      throw new Error("Notion Integration Token is not configured.");
    }
    if (!config.channelId) {
      throw new Error("Notion Database ID is not configured.");
    }

    const headers = {
      Authorization: `Bearer ${config.apiKey}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    };

    const databaseRes = await fetch(`https://api.notion.com/v1/databases/${config.channelId}`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    });

    if (!databaseRes.ok) {
      throw new Error(`Notion database lookup failed: ${databaseRes.status} ${databaseRes.statusText}`);
    }

    const database = await databaseRes.json() as {
      properties?: Record<string, { type?: string }>;
    };
    const titleProperty = Object.entries(database.properties ?? {}).find(([, value]) => value.type === "title");
    if (!titleProperty) {
      throw new Error("Notion database has no title property.");
    }

    const pageRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers,
      body: JSON.stringify({
        parent: { database_id: config.channelId },
        properties: {
          [titleProperty[0]]: {
            title: [{ type: "text", text: { content: content.title.slice(0, 180) } }],
          },
        },
        children: buildNotionBlocks(content),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!pageRes.ok) {
      const errorText = await pageRes.text();
      throw new Error(`Notion page creation failed: ${pageRes.status} ${errorText.slice(0, 200)}`);
    }

    const page = await pageRes.json() as { url?: string };
    return page.url ? `Archived to Notion: ${page.url}` : "Archived to Notion.";
  }
}

const PLATFORM_REGISTRY = new Map<string, PlatformPublisher>([
  ["telegram", new TelegramPublisher()],
  ["wechat", new WechatPublisher()],
  ["weibo", new WeiboPublisher()],
  ["douyin", new DouyinPublisher()],
  ["twitter", new TwitterPublisher()],
  ["discord", new DiscordPublisher()],
  ["slack", new SlackPublisher()],
  ["reddit", new RedditPublisher()],
  ["line", new LinePublisher()],
  ["instagram", new InstagramPublisher()],
  ["facebook", new FacebookPublisher()],
  ["notion", new NotionPublisher()],
]);

export async function publishContent(
  content: PublishContent,
  platformIds: string[],
): Promise<PublishResult[]> {
  const db = await getDb();
  if (!db) return [];

  const results: PublishResult[] = [];

  for (const platformId of platformIds) {
    const capability = getPlatformCapability(platformId);
    const [platformConfig] = await db
      .select()
      .from(mediaPlatforms)
      .where(eq(mediaPlatforms.platform, platformId))
      .limit(1);

    if (!platformConfig?.isEnabled) {
      const response = "Platform is disabled.";
      await db.insert(publishLogs).values({
        contentType: content.type,
        contentId: content.id,
        contentTitle: content.title.slice(0, 255),
        platform: platformId,
        status: "skipped",
        response,
      });
      results.push({ platform: platformId, status: "skipped", message: response });
      continue;
    }

    if (capability.deliveryMode !== "direct") {
      const response =
        capability.deliveryMode === "assisted"
          ? "This platform currently uses the assisted workflow. Generate a media draft package instead of direct publishing."
          : "This platform is still planned and does not support publishing yet.";
      await db.insert(publishLogs).values({
        contentType: content.type,
        contentId: content.id,
        contentTitle: content.title.slice(0, 255),
        platform: platformId,
        status: "skipped",
        response,
      });
      results.push({ platform: platformId, status: "skipped", message: response });
      continue;
    }

    const publisher = PLATFORM_REGISTRY.get(platformId);
    let status: "success" | "failed" = "failed";
    let message = "";

    if (!publisher) {
      message = `No publisher implementation registered for "${platformId}".`;
    } else {
      try {
        message = await publisher.publish(content, platformConfig);
        status = "success";
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }
    }

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

export async function autoPublishArticle(articleId: number, articleUrl: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const [article] = await db
    .select()
    .from(articles)
    .where(eq(articles.id, articleId))
    .limit(1);

  if (!article) return;

  const enabledPlatforms = await db
    .select()
    .from(mediaPlatforms)
    .where(and(eq(mediaPlatforms.autoPublish, true), eq(mediaPlatforms.isEnabled, true)));

  if (!enabledPlatforms.length) return;

  await publishContent(
    {
      type: "article",
      id: articleId,
      title: article.title,
      excerpt: article.excerpt,
      url: articleUrl,
    },
    enabledPlatforms.map((platform: { platform: string }) => platform.platform),
  );
}

export function registerPlatformPublisher(publisher: PlatformPublisher): void {
  PLATFORM_REGISTRY.set(publisher.platformId, publisher);
  console.log(`[Publish] Registered platform publisher: ${publisher.displayName} (${publisher.platformId})`);
}

export function getRegisteredPlatforms(): string[] {
  return Array.from(PLATFORM_REGISTRY.keys());
}
