/**
 * RSS auto-ingest, translation, and Telegram push pipeline.
 *
 * Key behaviors:
 * - Pulls from a fixed list of crypto media RSS feeds
 * - Translates English feed items into Chinese before storing
 * - Stores new items into `cryptoNews`
 * - Optionally pushes new items to Telegram based on admin settings
 */

import { desc, eq } from "drizzle-orm";
import { cryptoNews, mediaPlatforms } from "../../drizzle/schema";
import { getDb, getSystemSetting } from "../db";
import { ENV } from "./env";

const RSS_SOURCES = [
  { name: "吳說區塊鏈", url: "https://wublock.substack.com/feed", lang: "zh" as const },
  { name: "Foresight News", url: "https://foresightnews.pro/rss", lang: "zh" as const },
  { name: "Odaily每日星球", url: "https://www.odaily.news/rss", lang: "zh" as const },
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/", lang: "en" as const },
  { name: "CoinTelegraph", url: "https://cointelegraph.com/rss", lang: "en" as const },
  { name: "Decrypt", url: "https://decrypt.co/feed", lang: "en" as const },
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  policy: ["监管", "政策", "sec", "法规", "合规", "立法", "regulation", "policy", "法案", "etf", "批准"],
  exchange: ["交易所", "binance", "okx", "gate", "bybit", "bitget", "上线", "下架", "exchange", "上市", "暂停"],
  defi: ["defi", "dex", "流动性", "协议", "tvl", "yield", "lending", "借贷", "amm", "质押", "staking"],
  nft: ["nft", "元宇宙", "metaverse", "opensea", "藏品", "数字艺术", "gamefi"],
};

const DEFAULT_RSS_INTERVAL_MINUTES = 10;

type RssItem = {
  title: string;
  summary: string;
  url: string;
  publishedAt: Date;
};

type TranslateInput = {
  title: string;
  summary: string;
};

type TranslateOutput = {
  title: string;
  summary: string;
};

type TelegramPlatformConfig = {
  isEnabled: boolean;
  autoPublishNews: boolean;
  apiKey: string | null;
  channelId: string | null;
};

function detectCategory(title: string, summary: string): string {
  const text = `${title} ${summary}`.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) return category;
  }
  return "market";
}

function isEnglish(text: string): boolean {
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  return chineseChars / Math.max(text.length, 1) < 0.1;
}

function extract(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? match[1].trim() : "";
}

function stripCdata(value: string): string {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = stripCdata(extract(block, "title")).slice(0, 200);
    const url = stripCdata(extract(block, "link") || extract(block, "guid")).slice(0, 512);
    const summary = stripCdata(extract(block, "description")).replace(/<[^>]*>/g, "").slice(0, 300);
    const pubDate = extract(block, "pubDate") || extract(block, "dc:date");

    if (!title) continue;

    let publishedAt = new Date();
    if (pubDate) {
      const parsed = new Date(pubDate);
      if (!Number.isNaN(parsed.getTime())) publishedAt = parsed;
    }

    items.push({ title, summary, url, publishedAt });
  }

  return items;
}

function parseCsvSetting(value: string | null | undefined): string[] | null {
  const normalized = (value ?? "").trim();
  if (!normalized || normalized.toLowerCase() === "all") return null;
  return normalized
    .split(",")
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);
}

function clampIntervalMinutes(value: string | null | undefined): number {
  const parsed = Number.parseInt((value ?? "").trim(), 10);
  if (!Number.isFinite(parsed)) return DEFAULT_RSS_INTERVAL_MINUTES;
  return Math.min(Math.max(parsed, 1), 180);
}

async function batchTranslateToZh(items: TranslateInput[]): Promise<TranslateOutput[]> {
  if (!items.length) return [];

  const apiKey = ENV.deepseekApiKey || ENV.forgeApiKey;
  if (!apiKey) {
    console.log("[RSS翻译] 未配置翻译 API Key，保留原标题和摘要");
    return items.map(item => ({ title: item.title, summary: item.summary }));
  }

  const baseUrl = ENV.deepseekApiKey
    ? (ENV.deepseekApiUrl || "https://api.deepseek.com/v1")
    : (ENV.forgeApiUrl ? ENV.forgeApiUrl.replace(/\/$/, "") : "https://api.openai.com/v1");
  const apiUrl = baseUrl.endsWith("/v1") ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;
  const model = ENV.deepseekApiKey ? "deepseek-chat" : "gpt-4o-mini";

  const numbered = items
    .map((item, index) => `[${index + 1}] 标题: ${item.title}\n摘要: ${item.summary || "（无摘要）"}`)
    .join("\n\n");

  const prompt = `你是加密货币新闻翻译助手。请把下面英文新闻标题和摘要翻译成简体中文，保持术语准确。

严格按 JSON 返回，不要添加任何其他内容：
{"results":[{"title":"中文标题","summary":"中文摘要"}]}

待翻译内容：
${numbered}`;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      console.warn(`[RSS翻译] API 请求失败: ${response.status}`);
      return items.map(item => ({ title: item.title, summary: item.summary }));
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data?.choices?.[0]?.message?.content ?? "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("无法解析翻译响应");

    const parsed = JSON.parse(jsonMatch[0]) as { results?: TranslateOutput[] };
    if (!Array.isArray(parsed.results) || parsed.results.length !== items.length) {
      throw new Error("翻译结果数量不匹配");
    }

    return parsed.results.map((result, index) => ({
      title: result.title || items[index].title,
      summary: result.summary || items[index].summary,
    }));
  } catch (error) {
    console.warn("[RSS翻译] 翻译失败，保留原文", error);
    return items.map(item => ({ title: item.title, summary: item.summary }));
  }
}

async function getTelegramPlatformConfig(): Promise<TelegramPlatformConfig | null> {
  const db = await getDb();
  if (!db) return null;

  const [telegramPlatform] = await db
    .select({
      isEnabled: mediaPlatforms.isEnabled,
      autoPublishNews: mediaPlatforms.autoPublishNews,
      apiKey: mediaPlatforms.apiKey,
      channelId: mediaPlatforms.channelId,
    })
    .from(mediaPlatforms)
    .where(eq(mediaPlatforms.platform, "telegram"))
    .limit(1);

  return telegramPlatform ?? null;
}

async function sendTelegram(text: string): Promise<void> {
  const telegramPlatform = await getTelegramPlatformConfig();
  if (telegramPlatform && (!telegramPlatform.isEnabled || !telegramPlatform.autoPublishNews)) {
    return;
  }

  const telegramEnabled = await getSystemSetting("telegram_enabled", "true");
  if (telegramEnabled !== "true") return;

  const botToken = telegramPlatform?.apiKey?.trim() || ENV.telegramBotToken;
  const channelId = telegramPlatform?.channelId?.trim() || ENV.telegramChannelId;
  if (!botToken || !channelId) {
    console.warn("[Telegram] 跳过推送：后台平台配置和环境变量中都没有完整 token/channel");
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: channelId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
      signal: AbortSignal.timeout(12_000),
    });
  } catch (error) {
    console.warn("[Telegram] 推送失败", error);
  }
}

function formatTelegramMessage(item: RssItem & { category: string }, source: string): string {
  const categoryEmoji: Record<string, string> = {
    market: "📳",
    policy: "⚖️",
    exchange: "🏟",
    defi: "📧",
    nft: "🎨",
    other: "📰",
  };

  const emoji = categoryEmoji[item.category] ?? "📰";
  const siteUrl = ENV.siteUrl || "https://get8.pro";

  return [
    `${emoji} <b>${item.title}</b>`,
    item.summary ? `\n${item.summary}` : "",
    item.url ? `\n\n🔆 <a href="${item.url}">原文链接</a>` : "",
    `\n📗 来源: ${source}`,
    `\n\n👉 更多快讯: <a href="${siteUrl}/crypto-news">${siteUrl}/crypto-news</a>`,
  ].join("");
}

async function shouldPushNews(source: string, category: string): Promise<boolean> {
  const [rssPushEnabled, sourceSetting, categorySetting] = await Promise.all([
    getSystemSetting("rss_push_enabled", "true"),
    getSystemSetting("rss_push_sources", "all"),
    getSystemSetting("rss_push_categories", "all"),
  ]);

  if (rssPushEnabled !== "true") return false;

  const selectedSources = parseCsvSetting(sourceSetting);
  if (selectedSources && !selectedSources.includes(source.trim().toLowerCase())) return false;

  const selectedCategories = parseCsvSetting(categorySetting);
  if (selectedCategories && !selectedCategories.includes(category.trim().toLowerCase())) return false;

  return true;
}

async function fetchAndIngest(source: typeof RSS_SOURCES[number]): Promise<number> {
  let xml = "";
  try {
    const response = await fetch(source.url, {
      headers: { "User-Agent": "Mozilla/5.0 Get8Pro-RSSBot/1.0" },
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      console.warn(`[RSS] ${source.name} 返回 ${response.status}`);
      return 0;
    }

    xml = await response.text();
  } catch (error) {
    console.warn(`[RSS] 抓取失败 ${source.name}:`, error);
    return 0;
  }

  const items = parseRss(xml);
  if (!items.length) {
    console.warn(`[RSS] ${source.name} 解析到 0 条`);
    return 0;
  }

  const db = await getDb();
  if (!db) return 0;

  let existingTitles: Set<string>;
  try {
    const existing = await db
      .select({ title: cryptoNews.title })
      .from(cryptoNews)
      .orderBy(desc(cryptoNews.createdAt))
      .limit(200);
    existingTitles = new Set(existing.map((item: { title: string }) => item.title));
  } catch (error) {
    console.warn(`[RSS] ${source.name} 查询去重列表失败，跳过本轮`, error);
    return 0;
  }

  const newItems = items.slice(0, 20).filter(item => !existingTitles.has(item.title));
  if (!newItems.length) return 0;

  let translatedItems = newItems;
  if (source.lang === "en") {
    const itemsToTranslate = newItems.filter(item => isEnglish(item.title));
    if (itemsToTranslate.length > 0) {
      const batchSize = 5;
      const translated = [...newItems];
      for (let index = 0; index < itemsToTranslate.length; index += batchSize) {
        const batch = itemsToTranslate.slice(index, index + batchSize);
        const results = await batchTranslateToZh(batch);
        results.forEach((result, batchIndex) => {
          const original = itemsToTranslate[index + batchIndex];
          const originalIndex = newItems.indexOf(original);
          if (originalIndex !== -1) {
            translated[originalIndex] = {
              ...newItems[originalIndex],
              title: result.title,
              summary: result.summary,
            };
          }
        });
      }
      translatedItems = translated;
    }
  }

  let inserted = 0;
  for (const item of translatedItems) {
    const category = detectCategory(item.title, item.summary);
    try {
      await db.insert(cryptoNews).values({
        title: item.title,
        summary: item.summary || null,
        source: source.name,
        url: item.url || null,
        category,
        isPinned: false,
        isActive: true,
        publishedAt: item.publishedAt,
      });
      inserted += 1;

      if (await shouldPushNews(source.name, category)) {
        await sendTelegram(formatTelegramMessage({ ...item, category }, source.name));
      }
    } catch (error) {
      console.warn("[RSS] 入库失败:", error);
    }
  }

  if (inserted > 0) {
    console.log(`[RSS] ${source.name} 新增 ${inserted} 条快讯`);
  }

  return inserted;
}

export async function retranslateEnglishNews(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const allNews = await db
    .select({ id: cryptoNews.id, title: cryptoNews.title, summary: cryptoNews.summary })
    .from(cryptoNews)
    .orderBy(desc(cryptoNews.publishedAt))
    .limit(100);

  const englishNews = allNews.filter((item: { title: string }) => isEnglish(item.title));
  if (!englishNews.length) {
    console.log("[RSS重译] 没有需要翻译的英文快讯");
    return 0;
  }

  const batchSize = 5;
  let updated = 0;
  for (let index = 0; index < englishNews.length; index += batchSize) {
    const batch = englishNews.slice(index, index + batchSize);
    const results = await batchTranslateToZh(batch);
    for (let resultIndex = 0; resultIndex < results.length; resultIndex += 1) {
      const result = results[resultIndex];
      const original = batch[resultIndex];
      if (result.title !== original.title || result.summary !== original.summary) {
        await db
          .update(cryptoNews)
          .set({ title: result.title, summary: result.summary || original.summary })
          .where(eq(cryptoNews.id, original.id));
        updated += 1;
      }
    }
  }

  console.log(`[RSS重译] 完成，共更新 ${updated} 条快讯`);
  return updated;
}

export function startRssScheduler(): void {
  if (!ENV.rssEnabled) {
    console.log("[RSS] 已禁用（RSS_ENABLED=false）");
    return;
  }

  const run = async () => {
    try {
      const rssEnabled = await getSystemSetting("rss_enabled", "true");
      if (rssEnabled !== "true") {
        console.log("[RSS] 已在后台关闭，本轮跳过");
        return;
      }

      console.log("[RSS] 开始抓取快讯...");
      let total = 0;
      for (const source of RSS_SOURCES) {
        total += await fetchAndIngest(source);
      }
      console.log(`[RSS] 本轮共新增 ${total} 条快讯`);
    } catch (error) {
      console.error("[RSS] 本轮抓取出现异常", error);
    } finally {
      const intervalMinutes = clampIntervalMinutes(
        await getSystemSetting("rss_interval_minutes", String(DEFAULT_RSS_INTERVAL_MINUTES)),
      );
      setTimeout(() => {
        run().catch(error => console.error("[RSS] 定时任务异常:", error));
      }, intervalMinutes * 60 * 1000);
    }
  };

  setTimeout(() => {
    run().catch(error => console.error("[RSS] 首次抓取异常:", error));
  }, 15_000);

  console.log(`[RSS] 定时抓取已启动，默认间隔 ${DEFAULT_RSS_INTERVAL_MINUTES} 分钟，共 ${RSS_SOURCES.length} 个源`);
}
