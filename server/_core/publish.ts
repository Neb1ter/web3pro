/**
 * Multi-platform publishing module
 *
 * 架构设计（支持日后扩展新平台）：
 *  - PlatformPublisher 接口：每个平台实现 publish(content, config) 方法
 *  - PLATFORM_REGISTRY：平台注册表，新增平台只需在此注册一个实现类
 *  - publishContent：统一入口，根据平台 ID 查表分发，自动写入 publish_logs
 *
 * 已支持平台：
 *  - telegram  ✅ 完整实现
 *
 * 开发中平台（占位实现，配置好 API Key 后可快速接入）：
 *  - wechat    🔧 微信公众号
 *  - weibo     🔧 微博
 *  - twitter   🔧 Twitter/X
 *  - douyin    🔧 抖音
 *
 * 新增平台步骤：
 *  1. 实现 PlatformPublisher 接口（publishArticle / publishNews）
 *  2. 在 PLATFORM_REGISTRY 中注册
 *  3. 在数据库 media_platforms 表中插入对应配置行
 */

import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { mediaPlatforms, publishLogs, articles } from "../../drizzle/schema";
import { ENV } from "./env";

// ─── 核心类型 ─────────────────────────────────────────────────────────────────

/** 推送内容的统一描述 */
export interface PublishContent {
  type: "article" | "news";
  id: number;
  title: string;
  excerpt?: string | null;
  url?: string | null;
  source?: string;
}

/** 平台配置（来自数据库 media_platforms 表） */
export interface PlatformConfig {
  platform: string;
  apiKey?: string | null;
  apiSecret?: string | null;
  channelId?: string | null;
  extraConfig?: string | null;
}

/** 推送结果 */
export interface PublishResult {
  platform: string;
  status: "success" | "failed" | "skipped";
  message: string;
}

// ─── PlatformPublisher 接口 ───────────────────────────────────────────────────

/**
 * 每个平台实现此接口。
 * 新增平台时只需实现 publish 方法，然后在 PLATFORM_REGISTRY 中注册。
 */
interface PlatformPublisher {
  /** 平台唯一标识，与数据库 media_platforms.platform 字段一致 */
  readonly platformId: string;
  /** 平台中文名，用于日志 */
  readonly displayName: string;
  /**
   * 执行推送。
   * @throws Error 推送失败时抛出错误，错误信息会被记录到 publish_logs
   */
  publish(content: PublishContent, config: PlatformConfig): Promise<string>;
}

// ─── Telegram 实现 ────────────────────────────────────────────────────────────

class TelegramPublisher implements PlatformPublisher {
  readonly platformId = "telegram";
  readonly displayName = "Telegram";

  async publish(content: PublishContent, config: PlatformConfig): Promise<string> {
    const token = config.apiKey || ENV.telegramBotToken;
    const channelId = config.channelId || ENV.telegramChannelId;

    if (!token || !channelId) {
      throw new Error("Telegram Bot Token 或 Channel ID 未配置");
    }

    let text = "";
    if (content.type === "article") {
      text = `📰 *${escapeMarkdown(content.title)}*\n\n`;
      if (content.excerpt) {
        text += `${escapeMarkdown(content.excerpt.slice(0, 200))}\\.\\.\\.\n\n`;
      }
      if (content.url) {
        text += `🔗 [阅读全文](${content.url})`;
      }
      text += `\n\n_来源：Get8Pro \\| get8\\.pro_`;
    } else {
      text = `⚡ *快讯* \\| ${escapeMarkdown(content.title)}`;
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
}

// ─── WeChat 实现（占位，待接入微信公众号 API）────────────────────────────────

class WechatPublisher implements PlatformPublisher {
  readonly platformId = "wechat";
  readonly displayName = "微信公众号";

  async publish(_content: PublishContent, config: PlatformConfig): Promise<string> {
    if (!config.apiKey || !config.apiSecret) {
      throw new Error("微信公众号 AppID 或 AppSecret 未配置");
    }
    // TODO: 接入微信公众号 API
    // 步骤：
    //   1. GET /cgi-bin/token 获取 access_token
    //   2. POST /cgi-bin/media/upload 上传封面图
    //   3. POST /cgi-bin/draft/add 创建草稿
    //   4. POST /cgi-bin/freepublish/submit 发布草稿
    throw new Error("微信公众号推送功能开发中，配置 AppID + AppSecret 后可快速接入");
  }
}

// ─── Weibo 实现（占位，待接入微博 API）──────────────────────────────────────

class WeiboPublisher implements PlatformPublisher {
  readonly platformId = "weibo";
  readonly displayName = "微博";

  async publish(_content: PublishContent, config: PlatformConfig): Promise<string> {
    if (!config.apiKey) {
      throw new Error("微博 Access Token 未配置");
    }
    // TODO: 接入微博 API
    // POST https://api.weibo.com/2/statuses/share.json
    throw new Error("微博推送功能开发中，配置 Access Token 后可快速接入");
  }
}

// ─── Twitter/X 实现（占位，待接入 Twitter API v2）───────────────────────────

class TwitterPublisher implements PlatformPublisher {
  readonly platformId = "twitter";
  readonly displayName = "Twitter/X";

  async publish(_content: PublishContent, config: PlatformConfig): Promise<string> {
    if (!config.apiKey || !config.apiSecret) {
      throw new Error("Twitter API Key 或 Secret 未配置");
    }
    // TODO: 接入 Twitter API v2
    // POST https://api.twitter.com/2/tweets
    // 需要 OAuth 1.0a 签名（apiKey=consumer_key, apiSecret=consumer_secret）
    throw new Error("Twitter/X 推送功能开发中，配置 API Key + Secret 后可快速接入");
  }
}

// ─── 抖音实现（占位，待接入抖音开放平台）────────────────────────────────────

class DouyinPublisher implements PlatformPublisher {
  readonly platformId = "douyin";
  readonly displayName = "抖音";

  async publish(_content: PublishContent, config: PlatformConfig): Promise<string> {
    if (!config.apiKey) {
      throw new Error("抖音 Client Key 未配置");
    }
    // TODO: 接入抖音开放平台 API
    // https://open.douyin.com/platform/doc/
    throw new Error("抖音推送功能开发中，配置 Client Key 后可快速接入");
  }
}

// ─── Discord 实现（占位，待接入 Discord Webhook）────────────────────────────

class DiscordPublisher implements PlatformPublisher {
  readonly platformId = "discord";
  readonly displayName = "Discord";

  async publish(content: PublishContent, config: PlatformConfig): Promise<string> {
    // channelId 存放 Webhook URL
    const webhookUrl = config.channelId || config.apiKey;
    if (!webhookUrl) {
      throw new Error("Discord Webhook URL 未配置（填写到 Channel ID 字段）");
    }
    // TODO: 接入 Discord Webhook API
    // POST {webhookUrl}
    // body: { content: "...", embeds: [...] }
    throw new Error("Discord 推送功能开发中，配置 Webhook URL 后可快速接入");
  }
}

// ─── Slack 实现（占位，待接入 Slack Incoming Webhook）───────────────────────

class SlackPublisher implements PlatformPublisher {
  readonly platformId = "slack";
  readonly displayName = "Slack";

  async publish(content: PublishContent, config: PlatformConfig): Promise<string> {
    const webhookUrl = config.channelId || config.apiKey;
    if (!webhookUrl) {
      throw new Error("Slack Incoming Webhook URL 未配置（填写到 Channel ID 字段）");
    }
    // TODO: 接入 Slack Incoming Webhook
    // POST {webhookUrl}
    // body: { text: "...", blocks: [...] }
    throw new Error("Slack 推送功能开发中，配置 Webhook URL 后可快速接入");
  }
}

// ─── Reddit 实现（占位，待接入 Reddit API）──────────────────────────────────

class RedditPublisher implements PlatformPublisher {
  readonly platformId = "reddit";
  readonly displayName = "Reddit";

  async publish(_content: PublishContent, config: PlatformConfig): Promise<string> {
    if (!config.apiKey || !config.apiSecret) {
      throw new Error("Reddit Client ID 或 Client Secret 未配置");
    }
    // TODO: 接入 Reddit API
    // 1. POST https://www.reddit.com/api/v1/access_token 获取 token
    // 2. POST https://oauth.reddit.com/api/submit 发帖
    // channelId = 目标 subreddit（如 r/CryptoCurrency）
    throw new Error("Reddit 推送功能开发中，配置 Client ID + Secret 后可快速接入");
  }
}

// ─── LINE 实现（占位，待接入 LINE Notify / LINE Messaging API）──────────────

class LinePublisher implements PlatformPublisher {
  readonly platformId = "line";
  readonly displayName = "LINE";

  async publish(_content: PublishContent, config: PlatformConfig): Promise<string> {
    if (!config.apiKey) {
      throw new Error("LINE Channel Access Token 未配置");
    }
    // TODO: 接入 LINE Messaging API
    // POST https://api.line.me/v2/bot/message/broadcast
    // Header: Authorization: Bearer {channelAccessToken}
    throw new Error("LINE 推送功能开发中，配置 Channel Access Token 后可快速接入");
  }
}

// ─── Instagram 实现（占位，待接入 Meta Graph API）───────────────────────────

class InstagramPublisher implements PlatformPublisher {
  readonly platformId = "instagram";
  readonly displayName = "Instagram";

  async publish(_content: PublishContent, config: PlatformConfig): Promise<string> {
    if (!config.apiKey) {
      throw new Error("Instagram Access Token 未配置");
    }
    // TODO: 接入 Meta Graph API
    // 1. POST /{ig-user-id}/media 创建媒体容器
    // 2. POST /{ig-user-id}/media_publish 发布
    // 注意：Instagram 仅支持图片/视频帖子，文字内容需搭配图片
    throw new Error("Instagram 推送功能开发中，配置 Access Token 后可快速接入");
  }
}

// ─── Facebook Page 实现（占位，待接入 Meta Graph API）───────────────────────

class FacebookPublisher implements PlatformPublisher {
  readonly platformId = "facebook";
  readonly displayName = "Facebook Page";

  async publish(_content: PublishContent, config: PlatformConfig): Promise<string> {
    if (!config.apiKey) {
      throw new Error("Facebook Page Access Token 未配置");
    }
    // TODO: 接入 Meta Graph API
    // POST /{page-id}/feed
    // body: { message: "...", link: "..." }
    // channelId = Facebook Page ID
    throw new Error("Facebook Page 推送功能开发中，配置 Page Access Token 后可快速接入");
  }
}

// ─── Notion 实现（占位，待接入 Notion API）──────────────────────────────────

class NotionPublisher implements PlatformPublisher {
  readonly platformId = "notion";
  readonly displayName = "Notion";

  async publish(_content: PublishContent, config: PlatformConfig): Promise<string> {
    if (!config.apiKey) {
      throw new Error("Notion Integration Token 未配置");
    }
    // TODO: 接入 Notion API
    // POST https://api.notion.com/v1/pages
    // body: { parent: { database_id: channelId }, properties: {...}, children: [...] }
    // channelId = 目标 Notion Database ID
    throw new Error("Notion 推送功能开发中，配置 Integration Token + Database ID 后可快速接入");
  }
}

// ─── 平台注册表 ───────────────────────────────────────────────────────────────

/**
 * PLATFORM_REGISTRY — 平台注册表
 *
 * 新增平台步骤：
 *  1. 在上方实现 PlatformPublisher 接口
 *  2. 在此处注册实例
 *  3. 在数据库 media_platforms 表插入对应配置行（可在后台管理页面操作）
 */
const PLATFORM_REGISTRY: Map<string, PlatformPublisher> = new Map<string, PlatformPublisher>([
  // ── 已完整实现 ──────────────────────────────────────────────────────────────
  ["telegram",  new TelegramPublisher()  as PlatformPublisher],
  // ── 中文社交媒体（占位，待接入） ────────────────────────────────────────────
  ["wechat",    new WechatPublisher()    as PlatformPublisher],
  ["weibo",     new WeiboPublisher()     as PlatformPublisher],
  ["douyin",    new DouyinPublisher()    as PlatformPublisher],
  // ── 国际社交媒体（占位，待接入） ────────────────────────────────────────────
  ["twitter",   new TwitterPublisher()   as PlatformPublisher],
  ["discord",   new DiscordPublisher()   as PlatformPublisher],
  ["slack",     new SlackPublisher()     as PlatformPublisher],
  ["reddit",    new RedditPublisher()    as PlatformPublisher],
  ["line",      new LinePublisher()      as PlatformPublisher],
  ["instagram", new InstagramPublisher() as PlatformPublisher],
  ["facebook",  new FacebookPublisher()  as PlatformPublisher],
  ["notion",    new NotionPublisher()    as PlatformPublisher],
]);

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

// ─── 统一推送入口 ─────────────────────────────────────────────────────────────

/**
 * publishContent — 将内容推送到指定平台列表
 *
 * @param content  要推送的内容（文章或快讯）
 * @param platformIds  目标平台 ID 列表（与数据库 media_platforms.platform 一致）
 * @returns 每个平台的推送结果
 */
export async function publishContent(
  content: PublishContent,
  platformIds: string[]
): Promise<PublishResult[]> {
  const db = await getDb();
  if (!db) return [];

  const results: PublishResult[] = [];

  for (const platformId of platformIds) {
    // 从数据库读取平台配置
    const [platformConfig] = await db
      .select()
      .from(mediaPlatforms)
      .where(eq(mediaPlatforms.platform, platformId))
      .limit(1);

    // 平台未启用 → 跳过
    if (!platformConfig?.isEnabled) {
      const skipResult: PublishResult = {
        platform: platformId,
        status: "skipped",
        message: "平台未启用",
      };
      await db.insert(publishLogs).values({
        contentType: content.type,
        contentId: content.id,
        contentTitle: content.title.slice(0, 255),
        platform: platformId,
        status: "skipped",
        response: "平台未启用",
      });
      results.push(skipResult);
      continue;
    }

    // 查找平台实现
    const publisher = PLATFORM_REGISTRY.get(platformId);
    let status: "success" | "failed" = "failed";
    let message = "";

    if (!publisher) {
      // 注册表中没有该平台的实现
      message = `平台 "${platformId}" 暂未实现推送功能`;
    } else {
      try {
        message = await publisher.publish(content, platformConfig);
        status = "success";
      } catch (e) {
        message = e instanceof Error ? e.message : String(e);
        status = "failed";
      }
    }

    // 写入推送日志
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

// ─── 自动推送文章到已启用平台 ─────────────────────────────────────────────────

/**
 * autoPublishArticle — 文章发布时自动推送到所有开启了 autoPublish 的平台
 */
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
    .where(and(
      eq(mediaPlatforms.autoPublish, true),
      eq(mediaPlatforms.isEnabled, true),
    ));

  if (!enabledPlatforms.length) return;

  const content: PublishContent = {
    type: "article",
    id: articleId,
    title: article.title,
    excerpt: article.excerpt,
    url: articleUrl,
  };

  await publishContent(
    content,
    enabledPlatforms.map((p: { platform: string }) => p.platform)
  );
}

// ─── 注册新平台的帮助函数（供外部调用）──────────────────────────────────────

/**
 * registerPlatformPublisher — 动态注册新平台推送实现
 *
 * 适用于插件式扩展场景：在运行时注册第三方平台实现，无需修改本文件。
 *
 * @example
 * registerPlatformPublisher(new MyCustomPlatformPublisher());
 */
export function registerPlatformPublisher(publisher: PlatformPublisher): void {
  PLATFORM_REGISTRY.set(publisher.platformId, publisher);
  console.log(`[Publish] 已注册平台: ${publisher.displayName} (${publisher.platformId})`);
}

/**
 * getRegisteredPlatforms — 获取所有已注册的平台 ID 列表
 */
export function getRegisteredPlatforms(): string[] {
  return Array.from(PLATFORM_REGISTRY.keys());
}
