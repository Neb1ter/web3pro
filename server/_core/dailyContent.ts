/**
 * Daily Content Automation — 每日内容自动化模块
 *
 * 功能：
 *  1. 每日快讯补充：检查当日快讯数量，不足 MIN_DAILY_NEWS 条时，
 *     基于当日热点话题用 AI 生成快讯补充至目标数量（5-10 条）
 *  2. 每日文章生成：每天在北京时间 08:30 / 14:30 / 20:30 各检查一次，
 *     若当日文章不足 TARGET_DAILY_ARTICLES 篇，自动生成并直接发布
 *
 * 环境变量依赖：
 *  DEEPSEEK_API_KEY  或  BUILT_IN_FORGE_API_KEY  （二选一，用于 AI 生成）
 *  DAILY_CONTENT_ENABLED  （可选，默认 true；设为 "false" 可关闭）
 *
 * 设计原则：
 *  - 完全异步，不阻塞主进程，不影响页面加载速度
 *  - 生成失败只记录日志，不抛出异常影响服务稳定性
 *  - 所有生成内容直接设置为 "published" 状态，立即对 SEO 可见
 */

import { ENV } from "./env";
import { getDb, getSystemSetting } from "../db";
import { cryptoNews, articles } from "../../drizzle/schema";
import { gte, and, eq, count } from "drizzle-orm";
import { generateArticleWithAI, generateSlug } from "./articles";

// ─── 配置常量 ─────────────────────────────────────────────────────────────────

/** 每日快讯最低数量，不足时触发 AI 补充 */
const MIN_DAILY_NEWS = 5;
/** 每日快讯目标数量（AI 补充至此为止） */
const TARGET_DAILY_NEWS = 8;
/** 每日文章目标数量 */
const TARGET_DAILY_ARTICLES = 2;
/** 每日最多生成文章数（防止 API 费用失控） */
const MAX_DAILY_ARTICLES = 3;

// ─── 快讯话题库（每次随机抽取，保证多样性）────────────────────────────────────

const NEWS_TOPICS = [
  // 市场行情
  { title: "比特币今日行情分析：多空博弈关键位", category: "market" },
  { title: "以太坊网络活跃度数据解读", category: "market" },
  { title: "加密市场恐慌贪婪指数今日读数分析", category: "market" },
  { title: "山寨币板块轮动信号观察", category: "market" },
  { title: "稳定币市值变化与市场流动性分析", category: "market" },
  // 政策监管
  { title: "全球加密监管动态周报：各国最新进展", category: "policy" },
  { title: "美国 SEC 加密监管最新动向解读", category: "policy" },
  { title: "香港 Web3 政策最新进展", category: "policy" },
  { title: "欧盟 MiCA 法规落地进展追踪", category: "policy" },
  // 交易所
  { title: "主流交易所最新上币动态汇总", category: "exchange" },
  { title: "交易所合规进展：牌照申请与审批动态", category: "exchange" },
  { title: "交易所手续费率调整与活动汇总", category: "exchange" },
  // DeFi
  { title: "DeFi 协议 TVL 排行榜最新变化", category: "defi" },
  { title: "链上数据：大额转账与鲸鱼动向追踪", category: "defi" },
  { title: "Layer2 生态最新进展与数据对比", category: "defi" },
  { title: "流动性质押赛道最新格局分析", category: "defi" },
  // 宏观经济
  { title: "美联储利率政策对加密市场的影响分析", category: "market" },
  { title: "全球宏观经济数据与比特币相关性解读", category: "market" },
  { title: "黄金与比特币：避险资产对比分析", category: "market" },
];

// ─── 文章选题库（覆盖 Web3 教育、区块链科普、经济解读）──────────────────────

const ARTICLE_TOPICS: Array<{
  topic: string;
  category: "analysis" | "tutorial" | "news_decode" | "project" | "report";
  perspective: "neutral" | "bullish" | "bearish" | "educational";
  targetAudience: "beginner" | "intermediate" | "professional";
  contentStyle: "formal" | "casual";
  keywords: string[];
}> = [
  // ── Web3 基础教育 ──────────────────────────────────────────────────────────
  {
    topic: "什么是 Web3？从 Web1 到 Web3 的互联网演进史",
    category: "tutorial",
    perspective: "educational",
    targetAudience: "beginner",
    contentStyle: "casual",
    keywords: ["Web3", "区块链", "去中心化", "互联网", "数字资产"],
  },
  {
    topic: "区块链技术原理入门：哈希、共识机制与不可篡改性",
    category: "tutorial",
    perspective: "educational",
    targetAudience: "beginner",
    contentStyle: "casual",
    keywords: ["区块链", "哈希", "共识机制", "PoW", "PoS"],
  },
  {
    topic: "加密钱包完全指南：热钱包、冷钱包与助记词安全",
    category: "tutorial",
    perspective: "educational",
    targetAudience: "beginner",
    contentStyle: "casual",
    keywords: ["加密钱包", "冷钱包", "助记词", "私钥", "安全"],
  },
  {
    topic: "DeFi 去中心化金融入门：AMM、流动性挖矿与收益农场",
    category: "tutorial",
    perspective: "educational",
    targetAudience: "beginner",
    contentStyle: "casual",
    keywords: ["DeFi", "AMM", "流动性挖矿", "Uniswap", "收益"],
  },
  {
    topic: "NFT 是什么？数字所有权与元宇宙经济的底层逻辑",
    category: "tutorial",
    perspective: "educational",
    targetAudience: "beginner",
    contentStyle: "casual",
    keywords: ["NFT", "数字所有权", "元宇宙", "智能合约", "ERC-721"],
  },
  {
    topic: "智能合约原理与应用：代码即法律的去信任世界",
    category: "tutorial",
    perspective: "educational",
    targetAudience: "intermediate",
    contentStyle: "formal",
    keywords: ["智能合约", "以太坊", "Solidity", "去信任", "自动执行"],
  },
  {
    topic: "Layer2 扩容方案对比：Rollup、ZK-Proof 与侧链的技术路线",
    category: "tutorial",
    perspective: "educational",
    targetAudience: "intermediate",
    contentStyle: "formal",
    keywords: ["Layer2", "Rollup", "ZK-Proof", "Arbitrum", "Optimism"],
  },
  {
    topic: "加密货币税务指南：如何合规申报数字资产收益",
    category: "tutorial",
    perspective: "educational",
    targetAudience: "intermediate",
    contentStyle: "formal",
    keywords: ["加密税务", "数字资产", "合规", "资本利得", "申报"],
  },
  // ── 市场分析 ───────────────────────────────────────────────────────────────
  {
    topic: "比特币减半历史复盘：每次减半后的市场规律与本轮展望",
    category: "analysis",
    perspective: "neutral",
    targetAudience: "intermediate",
    contentStyle: "formal",
    keywords: ["比特币减半", "BTC", "历史规律", "牛市", "矿工"],
  },
  {
    topic: "以太坊 ETF 获批后的市场影响深度分析",
    category: "analysis",
    perspective: "neutral",
    targetAudience: "intermediate",
    contentStyle: "formal",
    keywords: ["以太坊ETF", "ETH", "机构资金", "SEC", "合规"],
  },
  {
    topic: "稳定币赛道格局：USDT、USDC 与算法稳定币的竞争与风险",
    category: "analysis",
    perspective: "neutral",
    targetAudience: "intermediate",
    contentStyle: "formal",
    keywords: ["稳定币", "USDT", "USDC", "算法稳定币", "脱锚风险"],
  },
  {
    topic: "加密市场与美股相关性分析：宏观周期下的资产配置逻辑",
    category: "analysis",
    perspective: "neutral",
    targetAudience: "professional",
    contentStyle: "formal",
    keywords: ["加密市场", "美股", "相关性", "宏观经济", "资产配置"],
  },
  // ── 全球经济解读 ───────────────────────────────────────────────────────────
  {
    topic: "美联储加息周期结束了吗？对加密市场的中长期影响",
    category: "news_decode",
    perspective: "neutral",
    targetAudience: "intermediate",
    contentStyle: "formal",
    keywords: ["美联储", "加息", "利率", "通胀", "比特币"],
  },
  {
    topic: "人民币国际化进程与数字货币：CBDC 对全球金融格局的重塑",
    category: "news_decode",
    perspective: "neutral",
    targetAudience: "intermediate",
    contentStyle: "formal",
    keywords: ["人民币", "数字货币", "CBDC", "数字人民币", "国际化"],
  },
  {
    topic: "全球去美元化趋势下，比特币能否成为新的储备资产？",
    category: "analysis",
    perspective: "neutral",
    targetAudience: "professional",
    contentStyle: "formal",
    keywords: ["去美元化", "比特币", "储备资产", "黄金", "地缘政治"],
  },
  {
    topic: "硅谷银行倒闭事件回顾：加密行业的系统性风险警示",
    category: "news_decode",
    perspective: "neutral",
    targetAudience: "intermediate",
    contentStyle: "formal",
    keywords: ["硅谷银行", "银行危机", "系统性风险", "USDC", "加密"],
  },
  // ── 项目深度 ───────────────────────────────────────────────────────────────
  {
    topic: "Solana 生态崛起：高性能公链的技术优势与生态现状",
    category: "project",
    perspective: "neutral",
    targetAudience: "intermediate",
    contentStyle: "formal",
    keywords: ["Solana", "SOL", "高性能", "生态", "TPS"],
  },
  {
    topic: "Binance 生态全景：BNB Chain、BSC 与 CeFi 帝国的版图",
    category: "project",
    perspective: "neutral",
    targetAudience: "intermediate",
    contentStyle: "formal",
    keywords: ["Binance", "BNB", "BSC", "生态", "交易所"],
  },
  {
    topic: "Chainlink 预言机：连接区块链与现实世界的数据桥梁",
    category: "project",
    perspective: "educational",
    targetAudience: "beginner",
    contentStyle: "casual",
    keywords: ["Chainlink", "预言机", "LINK", "数据", "智能合约"],
  },
];

// ─── 辅助函数 ─────────────────────────────────────────────────────────────────

/** 获取今日北京时间的起始时间戳（00:00:00 CST） */
function getTodayStartCST(): Date {
  const now = new Date();
  // CST = UTC+8
  const cstOffset = 8 * 60 * 60 * 1000;
  const cstNow = new Date(now.getTime() + cstOffset);
  const cstMidnight = new Date(
    Date.UTC(cstNow.getUTCFullYear(), cstNow.getUTCMonth(), cstNow.getUTCDate())
  );
  // 转回 UTC 存储
  return new Date(cstMidnight.getTime() - cstOffset);
}

/** 随机打乱数组（Fisher-Yates shuffle） */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── 快讯生成 ─────────────────────────────────────────────────────────────────

/**
 * 使用 AI 生成一条加密快讯
 */
async function generateOneNews(topic: { title: string; category: string }): Promise<{
  title: string;
  summary: string;
} | null> {
  const apiKey = ENV.deepseekApiKey || ENV.forgeApiKey;
  if (!apiKey) return null;

  const baseUrl = ENV.deepseekApiKey
    ? (ENV.deepseekApiUrl || "https://api.deepseek.com/v1")
    : (ENV.forgeApiUrl ? ENV.forgeApiUrl.replace(/\/$/, "") : "https://api.openai.com/v1");
  const apiUrl = baseUrl.endsWith("/v1")
    ? `${baseUrl}/chat/completions`
    : `${baseUrl}/v1/chat/completions`;
  const model = ENV.deepseekApiKey ? "deepseek-chat" : "gpt-4o-mini";

  const today = new Date().toLocaleDateString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const prompt = `你是一位专业的加密货币资讯编辑，请根据以下话题生成一条今日（${today}）加密快讯。

话题：${topic.title}

要求：
1. 标题：20-40字，简洁有力，包含核心数据或关键词
2. 摘要：60-100字，客观描述市场动态或事件，不得出现"保证盈利"等违规词
3. 内容要有时效感，像真实的今日快讯
4. 符合中文加密媒体的写作风格

请严格按以下 JSON 格式返回，不要添加任何其他内容：
{"title":"快讯标题","summary":"快讯摘要内容"}`;

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.8,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data?.choices?.[0]?.message?.content ?? "";
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.title || !parsed.summary) return null;
    return { title: parsed.title, summary: parsed.summary };
  } catch {
    return null;
  }
}

/**
 * 检查当日快讯数量，不足时补充生成
 */
export async function ensureDailyNews(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const todayStart = getTodayStartCST();

  // 统计今日已有快讯数量
  const [{ value: todayCount }] = await db
    .select({ value: count() })
    .from(cryptoNews)
    .where(gte(cryptoNews.publishedAt, todayStart));

  const existing = Number(todayCount) || 0;
  console.log(`[DailyContent] 今日快讯数量: ${existing}，目标: ${TARGET_DAILY_NEWS}`);

  if (existing >= MIN_DAILY_NEWS) {
    console.log("[DailyContent] 快讯数量已达标，跳过生成");
    return;
  }

  const needed = TARGET_DAILY_NEWS - existing;
  const shuffledTopics = shuffle(NEWS_TOPICS).slice(0, needed);

  let generated = 0;
  for (const topic of shuffledTopics) {
    try {
      const news = await generateOneNews(topic);
      if (!news) continue;

      await db.insert(cryptoNews).values({
        title: news.title,
        summary: news.summary,
        source: "Get8Pro编辑部",
        category: topic.category,
        isActive: true,
        isPinned: false,
        publishedAt: new Date(),
      });
      generated++;
      console.log(`[DailyContent] 已生成快讯: ${news.title}`);

      // 每条快讯之间间隔 2 秒，避免 API 限流
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.error(`[DailyContent] 生成快讯失败 (${topic.title}):`, e);
    }
  }

  console.log(`[DailyContent] 快讯补充完成，新增 ${generated} 条`);
}

// ─── 文章生成 ─────────────────────────────────────────────────────────────────

/**
 * 检查当日文章数量，不足时自动生成并发布
 */
export async function ensureDailyArticles(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const todayStart = getTodayStartCST();

  // 统计今日已发布文章数量
  const [{ value: todayCount }] = await db
    .select({ value: count() })
    .from(articles)
    .where(
      and(
        eq(articles.status, "published"),
        eq(articles.isActive, true),
        gte(articles.publishedAt, todayStart)
      )
    );

  const existing = Number(todayCount) || 0;
  console.log(`[DailyContent] 今日已发布文章: ${existing}，目标: ${TARGET_DAILY_ARTICLES}`);

  if (existing >= TARGET_DAILY_ARTICLES) {
    console.log("[DailyContent] 文章数量已达标，跳过生成");
    return;
  }

  const needed = Math.min(TARGET_DAILY_ARTICLES - existing, MAX_DAILY_ARTICLES);
  // 随机选取不重复的选题
  const shuffledTopics = shuffle(ARTICLE_TOPICS).slice(0, needed);

  let generated = 0;
  for (const topicConfig of shuffledTopics) {
    try {
      console.log(`[DailyContent] 开始生成文章: ${topicConfig.topic}`);

      const result = await generateArticleWithAI({
        topic: topicConfig.topic,
        category: topicConfig.category,
        perspective: topicConfig.perspective,
        targetAudience: topicConfig.targetAudience,
        contentStyle: topicConfig.contentStyle,
        keywords: topicConfig.keywords,
        wordCount: 1000,
      });

      const slug = generateSlug(result.title);
      const now = new Date();

      await db.insert(articles).values({
        title: result.title,
        slug,
        content: result.content,
        excerpt: result.excerpt,
        category: topicConfig.category,
        tags: result.tags,
        author: "Get8Pro编辑部",
        status: "published",
        perspective: topicConfig.perspective,
        targetAudience: topicConfig.targetAudience,
        contentStyle: topicConfig.contentStyle,
        isAiGenerated: true,
        aiPrompt: topicConfig.topic,
        metaTitle: result.metaTitle,
        metaDescription: result.metaDescription,
        metaKeywords: result.metaKeywords,
        isActive: true,
        isPinned: false,
        publishedAt: now,
        viewCount: 0,
      });

      generated++;
      console.log(`[DailyContent] 文章已发布: ${result.title} (slug: ${slug})`);

      // 文章生成间隔 5 秒，避免 API 限流
      await new Promise(r => setTimeout(r, 5000));
    } catch (e) {
      console.error(`[DailyContent] 生成文章失败 (${topicConfig.topic}):`, e);
    }
  }

  console.log(`[DailyContent] 文章生成完成，新增 ${generated} 篇`);
}

// ─── 定时调度器 ───────────────────────────────────────────────────────────────

/**
 * 计算距离下一个目标小时（北京时间）的毫秒数
 * @param targetHours 目标小时列表（北京时间），如 [8, 14, 20]
 */
function msUntilNextCST(targetHours: number[]): number {
  const now = new Date();
  const cstOffset = 8 * 60 * 60 * 1000;
  const cstNow = new Date(now.getTime() + cstOffset);
  const cstHour = cstNow.getUTCHours();
  const cstMinute = cstNow.getUTCMinutes();

  // 找到今天剩余的目标时间点
  for (const h of targetHours.sort((a, b) => a - b)) {
    if (h > cstHour || (h === cstHour && cstMinute < 30)) {
      const targetMs =
        (h - cstHour) * 60 * 60 * 1000 - cstMinute * 60 * 1000 + 30 * 60 * 1000;
      return Math.max(targetMs, 60_000); // 最少等待 1 分钟
    }
  }

  // 今天的目标时间都过了，等到明天第一个目标时间
  const firstHour = Math.min(...targetHours);
  const hoursUntilMidnight = 24 - cstHour;
  return (hoursUntilMidnight + firstHour) * 60 * 60 * 1000 - cstMinute * 60 * 1000 + 30 * 60 * 1000;
}

/**
 * 启动每日内容自动化定时任务
 *
 * 快讯检查：北京时间 08:30 / 12:30 / 18:30 / 22:30（每天 4 次）
 * 文章生成：北京时间 08:30 / 14:30 / 20:30（每天 3 次）
 */
export function startDailyContentScheduler(): void {
  // 检查全局开关
  if (process.env.DAILY_CONTENT_ENABLED === "false") {
    console.log("[DailyContent] 已禁用（DAILY_CONTENT_ENABLED=false）");
    return;
  }

  const apiKey = ENV.deepseekApiKey || ENV.forgeApiKey;
  if (!apiKey) {
    console.log("[DailyContent] 未配置 AI API Key，每日内容自动化已跳过");
    return;
  }

  console.log("[DailyContent] 每日内容自动化调度器已启动");

  // ── 快讯检查：每 6 小时执行一次（北京时间 08:30/14:30/20:30/02:30）──────
  const NEWS_INTERVAL_MS = 6 * 60 * 60 * 1000;
  const scheduleNewsCheck = () => {
    const delay = msUntilNextCST([8, 14, 20]);
    console.log(`[DailyContent] 下次快讯检查将在 ${Math.round(delay / 60000)} 分钟后执行`);
    setTimeout(async () => {
      try {
        // 再次检查数据库开关
        const enabled = await getSystemSetting("daily_content_enabled", "true");
        if (enabled !== "false") {
          await ensureDailyNews();
        }
      } catch (e) {
        console.error("[DailyContent] 快讯检查异常:", e);
      }
      // 递归调度下一次
      setInterval(async () => {
        try {
          const enabled = await getSystemSetting("daily_content_enabled", "true");
          if (enabled !== "false") await ensureDailyNews();
        } catch (e) {
          console.error("[DailyContent] 快讯定时任务异常:", e);
        }
      }, NEWS_INTERVAL_MS);
    }, delay);
  };

  // ── 文章生成：每 8 小时执行一次（北京时间 08:30/16:30/00:30）────────────
  const ARTICLE_INTERVAL_MS = 8 * 60 * 60 * 1000;
  const scheduleArticleGeneration = () => {
    const delay = msUntilNextCST([8, 16]);
    console.log(`[DailyContent] 下次文章生成将在 ${Math.round(delay / 60000)} 分钟后执行`);
    setTimeout(async () => {
      try {
        const enabled = await getSystemSetting("daily_content_enabled", "true");
        if (enabled !== "false") {
          await ensureDailyArticles();
        }
      } catch (e) {
        console.error("[DailyContent] 文章生成异常:", e);
      }
      setInterval(async () => {
        try {
          const enabled = await getSystemSetting("daily_content_enabled", "true");
          if (enabled !== "false") await ensureDailyArticles();
        } catch (e) {
          console.error("[DailyContent] 文章定时任务异常:", e);
        }
      }, ARTICLE_INTERVAL_MS);
    }, delay);
  };

  // 服务启动后延迟 60 秒首次执行（等待 DB 连接就绪，避免与 RSS 调度器竞争）
  setTimeout(() => {
    scheduleNewsCheck();
    scheduleArticleGeneration();

    // 启动后立即执行一次检查（补充可能缺失的当日内容）
    setTimeout(async () => {
      try {
        const enabled = await getSystemSetting("daily_content_enabled", "true");
        if (enabled !== "false") {
          console.log("[DailyContent] 启动后首次内容检查...");
          await ensureDailyNews();
          await ensureDailyArticles();
        }
      } catch (e) {
        console.error("[DailyContent] 启动首次检查异常:", e);
      }
    }, 5000); // 在 scheduleNewsCheck 之前 5 秒执行
  }, 60_000);
}
