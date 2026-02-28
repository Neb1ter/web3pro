/**
 * RSS 自动抓取 + 中文翻译 + Telegram 推送
 *
 * 策略：
 *  - 优先抓取中文 RSS 源（律动、深潮、Foresight、吴说、Odaily），直接入库
 *  - 英文源（CoinDesk）使用 gpt-4.1-nano 批量翻译（每批 5 条合并一次请求，节约 API）
 *  - 翻译失败时保留原文，不影响入库
 *  - 定时任务：每 30 分钟抓取一次
 *
 * Railway 环境变量：
 *  TELEGRAM_BOT_TOKEN  Bot Token（从 @BotFather 获取）
 *  TELEGRAM_CHANNEL_ID 频道 ID（如 -100xxxxxxxxx）
 *  BUILT_IN_FORGE_API_KEY  OpenAI 兼容 API Key（用于翻译）
 *  BUILT_IN_FORGE_API_URL  API Base URL（可选，默认 forge.manus.im）
 */

import { ENV } from "./env";
import { getDb, getSystemSetting } from "../db";
import { cryptoNews } from "../../drizzle/schema";
import { desc } from "drizzle-orm";

// ─── RSS 源配置 ────────────────────────────────────────────────────────────────
// needsTranslation: true 表示该源为英文，需要翻译成中文
const RSS_SOURCES = [
  // ── 中文源（直接入库，不消耗翻译 API）──────────────────────────────────────
  {
    name: "律动BlockBeats",
    url: "https://www.theblockbeats.info/rss",
    lang: "zh" as const,
  },
  {
    name: "深潮TechFlow",
    url: "https://www.techflowpost.com/rss.xml",
    lang: "zh" as const,
  },
  {
    name: "Foresight News",
    url: "https://foresightnews.pro/rss",
    lang: "zh" as const,
  },
  {
    name: "吴说区块链",
    url: "https://wublock.substack.com/feed",
    lang: "zh" as const,
  },
  {
    name: "Odaily每日星球",
    url: "https://www.odaily.news/rss",
    lang: "zh" as const,
  },
  // ── 英文源（入库前批量翻译为中文）──────────────────────────────────────────
  {
    name: "CoinDesk",
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    lang: "en" as const,
  },
];

// ─── 分类关键词映射 ────────────────────────────────────────────────────────────
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  policy:   ["监管", "政策", "SEC", "法规", "合规", "立法", "regulation", "policy", "法案", "ETF", "批准"],
  exchange: ["交易所", "Binance", "OKX", "Gate", "Bybit", "Bitget", "上线", "下架", "exchange", "上市", "暂停"],
  defi:     ["DeFi", "DEX", "流动性", "协议", "TVL", "yield", "lending", "借贷", "AMM", "质押", "staking"],
  nft:      ["NFT", "元宇宙", "metaverse", "OpenSea", "藏品", "数字艺术", "GameFi"],
};

function detectCategory(title: string, summary: string): string {
  const text = (title + " " + summary).toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => text.includes(k.toLowerCase()))) return cat;
  }
  return "market";
}

// ─── 判断文本是否为英文 ────────────────────────────────────────────────────────
function isEnglish(text: string): boolean {
  // 如果中文字符占比 < 10%，则认为是英文
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  return chineseChars / text.length < 0.1;
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
    const rawDesc = stripCdata(extract(block, "description")).replace(/<[^>]*>/g, "").slice(0, 300);
    const pubDate = extract(block, "pubDate") || extract(block, "dc:date");

    if (!title) continue;

    let publishedAt = new Date();
    if (pubDate) {
      const parsed = new Date(pubDate);
      if (!isNaN(parsed.getTime())) publishedAt = parsed;
    }

    items.push({ title, summary: rawDesc, url: link, publishedAt });
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

// ─── 批量翻译（gpt-4.1-nano，节约 API 调用）──────────────────────────────────
interface TranslateInput {
  title: string;
  summary: string;
}
interface TranslateOutput {
  title: string;
  summary: string;
}

async function batchTranslateToZh(items: TranslateInput[]): Promise<TranslateOutput[]> {
  if (!items.length) return [];

  // 没有配置 API Key 时直接返回原文
  const apiKey = ENV.forgeApiKey;
  if (!apiKey) {
    console.log("[RSS翻译] 未配置 BUILT_IN_FORGE_API_KEY，跳过翻译");
    return items.map(i => ({ title: i.title, summary: i.summary }));
  }

  const apiUrl = ENV.forgeApiUrl
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://api.openai.com/v1/chat/completions";

  // 构建批量翻译 prompt，一次请求翻译多条，节约 API
  const numbered = items.map((item, idx) =>
    `[${idx + 1}] 标题：${item.title}\n摘要：${item.summary || "（无摘要）"}`
  ).join("\n\n");

  const prompt = `你是一个加密货币新闻翻译助手。请将以下英文新闻标题和摘要翻译成简体中文，保持专业术语准确（如 Bitcoin→比特币，Ethereum→以太坊，DeFi→DeFi，NFT→NFT 等专有名词可保留英文）。

严格按照以下 JSON 格式返回，不要添加任何其他内容：
{"results":[{"title":"中文标题","summary":"中文摘要"},...]}}

待翻译内容：
${numbered}`;

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-nano",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      console.warn(`[RSS翻译] API 请求失败: ${res.status}`);
      return items.map(i => ({ title: i.title, summary: i.summary }));
    }

    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data?.choices?.[0]?.message?.content ?? "";

    // 解析 JSON 响应
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("无法解析翻译响应");

    const parsed = JSON.parse(jsonMatch[0]) as { results?: TranslateOutput[] };
    const results = parsed?.results;

    if (!Array.isArray(results) || results.length !== items.length) {
      throw new Error("翻译结果数量不匹配");
    }

    console.log(`[RSS翻译] 成功翻译 ${items.length} 条快讯`);
    return results.map((r, i) => ({
      title: r.title || items[i].title,
      summary: r.summary || items[i].summary,
    }));
  } catch (e) {
    console.warn("[RSS翻译] 翻译失败，保留原文:", e);
    return items.map(i => ({ title: i.title, summary: i.summary }));
  }
}

// ─── Telegram 推送 ─────────────────────────────────────────────────────────────
async function sendTelegram(text: string): Promise<void> {
  if (!ENV.telegramBotToken || !ENV.telegramChannelId) return;
  // 检查数据库中的 Telegram 推送开关
  const telegramEnabled = await getSystemSetting("telegram_enabled", "true");
  if (telegramEnabled !== "true") return;
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
      headers: { "User-Agent": "Mozilla/5.0 Get8Pro-RSSBot/1.0" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      console.warn(`[RSS] ${source.name} 返回 ${res.status}`);
      return 0;
    }
    xml = await res.text();
  } catch (e) {
    console.warn(`[RSS] 抓取失败 ${source.name}:`, e);
    return 0;
  }

  const items = parseRss(xml);
  if (!items.length) {
    console.warn(`[RSS] ${source.name} 解析到 0 条`);
    return 0;
  }

  const db = await getDb();
  if (!db) return 0;

  // 取最近 200 条标题用于去重
  const existing = await db
    .select({ title: cryptoNews.title })
    .from(cryptoNews)
    .orderBy(desc(cryptoNews.createdAt))
    .limit(200);
  const existingTitles = new Set(existing.map((r: { title: string }) => r.title));

  // 筛选出新条目（最多取 20 条）
  const newItems = items.slice(0, 20).filter(item => !existingTitles.has(item.title));
  if (!newItems.length) return 0;

  // ── 英文源：批量翻译（每批 5 条，减少 API 调用次数）──────────────────────
  let translatedItems = newItems;
  if (source.lang === "en") {
    // 只翻译确实是英文的条目
    const toTranslate = newItems.filter(item => isEnglish(item.title));
    if (toTranslate.length > 0) {
      const BATCH_SIZE = 5;
      const translated: RssItem[] = [...newItems];
      for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
        const batch = toTranslate.slice(i, i + BATCH_SIZE);
        const results = await batchTranslateToZh(batch);
        results.forEach((r, j) => {
          const origIdx = newItems.indexOf(toTranslate[i + j]);
          if (origIdx !== -1) {
            translated[origIdx] = {
              ...newItems[origIdx],
              title: r.title,
              summary: r.summary,
            };
          }
        });
      }
      translatedItems = translated;
    }
  }

  // ── 入库 ──────────────────────────────────────────────────────────────────
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
    // 检查数据库中的 RSS 抓取开关
    const rssEnabled = await getSystemSetting("rss_enabled", "true");
    if (rssEnabled !== "true") {
      console.log("[RSS] 已通过管理后台关闭，跳过本轮抓取");
      return;
    }

    console.log("[RSS] 开始抓取快讯...");
    let total = 0;
    for (const source of RSS_SOURCES) {
      total += await fetchAndIngest(source);
    }
    console.log(`[RSS] 本轮共新增 ${total} 条快讯`);
  };

  // 启动后延迟 15 秒首次执行（等待 DB 连接就绪）
  setTimeout(() => {
    run();
    setInterval(run, INTERVAL_MS);
  }, 15_000);

  console.log("[RSS] 定时抓取已启动，间隔 30 分钟，共 " + RSS_SOURCES.length + " 个源");
}
