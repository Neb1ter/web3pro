/**
 * RSS 自动抓取 + Telegram 推送
 *
 * 免费方案：
 *  - RSS 解析：纯 fetch + 正则，无需额外依赖
 *  - Telegram：官方 Bot API（免费，无限制）
 *  - 定时任务：Node.js setInterval，无需 cron 库
 *
 * 使用前在 Railway 环境变量中设置：
 *  TELEGRAM_BOT_TOKEN=你的 Bot Token（从 @BotFather 获取）
 *  TELEGRAM_CHANNEL_ID=你的频道 ID（如 @get8pro_news 或 -100xxxxxxxxx）
 *  RSS_ENABLED=true（默认开启）
 */

import { ENV } from "./env";
import { getDb } from "../db";
import { cryptoNews } from "../../drizzle/schema";
import { desc } from "drizzle-orm";

// ─── RSS 源配置 ────────────────────────────────────────────────────────────────
const RSS_SOURCES = [
  {
    name: "律动BlockBeats",
    url: "https://www.theblockbeats.info/rss",
    category: "market" as const,
  },
  {
    name: "深潮TechFlow",
    url: "https://www.techflowpost.com/rss.xml",
    category: "market" as const,
  },
  {
    name: "CoinDesk",
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    category: "market" as const,
  },
];

// ─── 分类关键词映射 ────────────────────────────────────────────────────────────
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  policy:   ["监管", "政策", "SEC", "法规", "合规", "立法", "regulation", "policy", "法案"],
  exchange: ["交易所", "Binance", "OKX", "Gate", "Bybit", "Bitget", "上线", "下架", "exchange"],
  defi:     ["DeFi", "DEX", "流动性", "协议", "TVL", "yield", "lending", "借贷", "AMM"],
  nft:      ["NFT", "元宇宙", "metaverse", "OpenSea", "藏品", "数字艺术"],
};

function detectCategory(title: string, summary: string): string {
  const text = (title + " " + summary).toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => text.includes(k.toLowerCase()))) return cat;
  }
  return "market";
}

// ─── 简易 RSS 解析（无依赖，纯正则）─────────────────────────────────────────
interface RssItem {
  title: string;
  summary: string;
  url: string;
  publishedAt: Date;
}

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title   = stripCdata(extract(block, "title")).slice(0, 200);
    const link    = stripCdata(extract(block, "link") || extract(block, "guid")).slice(0, 512);
    const desc    = stripCdata(extract(block, "description")).replace(/<[^>]*>/g, "").slice(0, 300);
    const pubDate = extract(block, "pubDate") || extract(block, "dc:date");

    if (!title) continue;

    let publishedAt = new Date();
    if (pubDate) {
      const parsed = new Date(pubDate);
      if (!isNaN(parsed.getTime())) publishedAt = parsed;
    }

    items.push({ title, summary: desc, url: link, publishedAt });
  }
  return items;
}

function extract(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1].trim() : "";
}

function stripCdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

// ─── Telegram 推送 ─────────────────────────────────────────────────────────────
async function sendTelegram(text: string): Promise<void> {
  if (!ENV.telegramBotToken || !ENV.telegramChannelId) return;
  try {
    const url = `https://api.telegram.org/bot${ENV.telegramBotToken}/sendMessage`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: ENV.telegramChannelId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });
  } catch (e) {
    console.warn("[Telegram] 推送失败:", e);
  }
}

function formatTelegramMessage(item: RssItem & { category: string }, source: string): string {
  const categoryEmoji: Record<string, string> = {
    market: "📊", policy: "⚖️", exchange: "🏦", defi: "🔄", nft: "🎨", other: "📰",
  };
  const emoji = categoryEmoji[item.category] ?? "📰";
  const siteUrl = ENV.siteUrl || "https://get8.pro";
  return [
    `${emoji} <b>${item.title}</b>`,
    item.summary ? `\n${item.summary}` : "",
    item.url ? `\n\n🔗 <a href="${item.url}">原文链接</a>` : "",
    `\n📡 来源：${source}`,
    `\n\n👉 更多快讯：<a href="${siteUrl}/crypto-news">${siteUrl}/crypto-news</a>`,
  ].join("");
}

// ─── 核心：抓取单个 RSS 源并入库 ──────────────────────────────────────────────
async function fetchAndIngest(source: typeof RSS_SOURCES[0]): Promise<number> {
  let xml: string;
  try {
    const res = await fetch(source.url, {
      headers: { "User-Agent": "Get8Pro-RSSBot/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return 0;
    xml = await res.text();
  } catch (e) {
    console.warn(`[RSS] 抓取失败 ${source.name}:`, e);
    return 0;
  }

  const items = parseRss(xml);
  if (!items.length) return 0;

  const db = await getDb();
  if (!db) return 0;

  // 取最近 200 条标题用于去重
  const existing = await db
    .select({ title: cryptoNews.title })
    .from(cryptoNews)
    .orderBy(desc(cryptoNews.createdAt))
    .limit(200);
  const existingTitles = new Set(existing.map(r => r.title));

  let inserted = 0;
  for (const item of items.slice(0, 20)) {
    if (existingTitles.has(item.title)) continue;
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
      inserted++;
      // 推送到 Telegram（每条新快讯）
      await sendTelegram(formatTelegramMessage({ ...item, category }, source.name));
    } catch (e) {
      console.warn("[RSS] 入库失败:", e);
    }
  }

  if (inserted > 0) {
    console.log(`[RSS] ${source.name} 新增 ${inserted} 条快讯`);
  }
  return inserted;
}

// ─── 启动定时任务（每 30 分钟抓取一次）────────────────────────────────────────
export function startRssScheduler(): void {
  if (!ENV.rssEnabled) {
    console.log("[RSS] 已禁用（RSS_ENABLED=false）");
    return;
  }

  const INTERVAL_MS = 30 * 60 * 1000; // 30 分钟

  const run = async () => {
    console.log("[RSS] 开始抓取快讯...");
    let total = 0;
    for (const source of RSS_SOURCES) {
      total += await fetchAndIngest(source);
    }
    console.log(`[RSS] 本轮共新增 ${total} 条快讯`);
  };

  // 启动后延迟 10 秒首次执行（等待 DB 连接就绪）
  setTimeout(() => {
    run();
    setInterval(run, INTERVAL_MS);
  }, 10_000);

  console.log("[RSS] 定时抓取已启动，间隔 30 分钟");
}
