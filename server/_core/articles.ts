/**
 * Articles core module
 * Handles article CRUD, AI generation, sensitive word detection, and publishing.
 */
import { desc, eq, and, like, inArray } from "drizzle-orm";
import { getDb } from "../db";
import { articles, sensitiveWords, mediaPlatforms, publishLogs } from "../../drizzle/schema";
import { ENV } from "./env";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ArticleGenerateOptions {
  topic: string;
  category: string;
  perspective: "neutral" | "bullish" | "bearish" | "educational";
  targetAudience: "beginner" | "intermediate" | "professional" | "institutional";
  contentStyle: "formal" | "casual" | "marketing";
  keywords?: string[];
  wordCount?: number;
  relatedNewsTitle?: string;
}

export interface SensitiveCheckResult {
  isClean: boolean;
  flaggedWords: Array<{
    word: string;
    severity: string;
    replacement?: string | null;
    platforms: string;
    positions: number[];
  }>;
}

// ─── Slug generator ───────────────────────────────────────────────────────────

export function generateSlug(title: string): string {
  // For Chinese titles, use timestamp + random suffix
  const hasChinese = /[\u4e00-\u9fff]/.test(title);
  if (hasChinese) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 6);
    return `article-${timestamp}-${random}`;
  }
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
    + "-" + Date.now().toString(36);
}

// ─── AI Article Generation ────────────────────────────────────────────────────

export async function generateArticleWithAI(options: ArticleGenerateOptions): Promise<{
  title: string;
  content: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  tags: string;
}> {
  // 优先使用 DeepSeek，回退到 OpenAI
  const apiKey = ENV.deepseekApiKey || ENV.forgeApiKey;
  const baseUrl = ENV.deepseekApiKey
    ? (ENV.deepseekApiUrl || "https://api.deepseek.com/v1")
    : (ENV.forgeApiUrl ? ENV.forgeApiUrl.replace(/\/$/, "") : "https://api.openai.com/v1");
  const apiUrl = baseUrl.endsWith("/v1")
    ? `${baseUrl}/chat/completions`
    : `${baseUrl}/v1/chat/completions`;
  const model = ENV.deepseekApiKey ? "deepseek-chat" : "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("未配置 AI API Key（DEEPSEEK_API_KEY 或 BUILT_IN_FORGE_API_KEY）");
  }

  const perspectiveMap = {
    neutral: "客观中立，平衡呈现多方观点",
    bullish: "偏向看多，强调积极因素和上涨潜力",
    bearish: "偏向看空，关注风险和下行压力",
    educational: "教育科普，深入浅出解释概念",
  };

  const audienceMap = {
    beginner: "加密货币新手，需要解释基础概念",
    intermediate: "有一定经验的投资者，了解基本概念",
    professional: "专业交易员和分析师",
    institutional: "机构投资者和专业机构",
  };

  const styleMap = {
    formal: "严肃专业的分析文章风格",
    casual: "轻松易读的科普文章风格",
    marketing: "吸引眼球的营销推广风格",
  };

  const wordCountTarget = options.wordCount || 800;
  const keywordsHint = options.keywords?.length
    ? `\n关键词（需自然融入文章）：${options.keywords.join("、")}`
    : "";
  const relatedNewsHint = options.relatedNewsTitle
    ? `\n关联新闻（可作为文章背景）：${options.relatedNewsTitle}`
    : "";

  const prompt = `你是一位专业的加密货币/Web3领域内容创作者，为中文用户撰写高质量文章。

文章要求：
- 主题：${options.topic}
- 分类：${options.category}
- 观点角度：${perspectiveMap[options.perspective]}
- 目标读者：${audienceMap[options.targetAudience]}
- 写作风格：${styleMap[options.contentStyle]}
- 字数：约${wordCountTarget}字${keywordsHint}${relatedNewsHint}

重要合规要求：
1. 不得出现"保证盈利"、"稳赚不赔"、"内幕消息"等违规表述
2. 投资建议需加免责声明
3. 符合中国主流媒体平台的内容规范
4. 不得涉及政治敏感内容
5. 加密货币相关内容需客观，不得夸大收益

请严格按照以下 JSON 格式返回，不要添加任何其他内容：
{
  "title": "文章标题（吸引眼球，包含核心关键词）",
  "content": "文章正文（Markdown格式，包含标题、段落、重点标注）",
  "excerpt": "文章摘要（100-150字，用于列表页展示）",
  "metaTitle": "SEO标题（60字以内，含主关键词）",
  "metaDescription": "SEO描述（150字以内，吸引点击）",
  "metaKeywords": "关键词1,关键词2,关键词3,关键词4,关键词5",
  "tags": "标签1,标签2,标签3"
}`;

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3000,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI API 请求失败: ${res.status} - ${errText.slice(0, 200)}`);
  }

  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = data?.choices?.[0]?.message?.content ?? "";

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("无法解析 AI 响应");

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    title: parsed.title || options.topic,
    content: parsed.content || "",
    excerpt: parsed.excerpt || "",
    metaTitle: parsed.metaTitle || parsed.title || options.topic,
    metaDescription: parsed.metaDescription || parsed.excerpt || "",
    metaKeywords: parsed.metaKeywords || "",
    tags: parsed.tags || "",
  };
}

// ─── Sensitive Word Detection ─────────────────────────────────────────────────

export async function checkSensitiveWords(
  text: string,
  targetPlatforms: string[] = ["all"]
): Promise<SensitiveCheckResult> {
  const db = await getDb();
  if (!db) return { isClean: true, flaggedWords: [] };

  // 获取所有激活的敏感词
  const allWords = await db
    .select()
    .from(sensitiveWords)
    .where(eq(sensitiveWords.isActive, true));

  const flaggedWords: SensitiveCheckResult["flaggedWords"] = [];

  for (const sw of allWords) {
    // 检查是否适用于目标平台
    const wordPlatforms = sw.platforms.split(",").map((p: string) => p.trim());
    const appliesToPlatform = wordPlatforms.includes("all") ||
      targetPlatforms.some((tp: string) => wordPlatforms.includes(tp));

    if (!appliesToPlatform) continue;

    // 查找所有出现位置
    const positions: number[] = [];
    let searchIdx = 0;
    const lowerText = text.toLowerCase();
    const lowerWord = sw.word.toLowerCase();
    while (true) {
      const idx = lowerText.indexOf(lowerWord, searchIdx);
      if (idx === -1) break;
      positions.push(idx);
      searchIdx = idx + 1;
    }

    if (positions.length > 0) {
      flaggedWords.push({
        word: sw.word,
        severity: sw.severity,
        replacement: sw.replacement,
        platforms: sw.platforms,
        positions,
      });
    }
  }

  return {
    isClean: flaggedWords.filter(w => w.severity === "block" || w.severity === "warn").length === 0,
    flaggedWords,
  };
}

// ─── Auto-replace sensitive words ────────────────────────────────────────────

export function autoReplaceSensitiveWords(
  text: string,
  flaggedWords: SensitiveCheckResult["flaggedWords"]
): string {
  let result = text;
  for (const fw of flaggedWords) {
    if (fw.severity === "replace" && fw.replacement) {
      result = result.replace(new RegExp(fw.word, "gi"), fw.replacement);
    }
  }
  return result;
}

// ─── AI Rewrite for compliance ────────────────────────────────────────────────

export async function rewriteForCompliance(
  content: string,
  flaggedWords: SensitiveCheckResult["flaggedWords"]
): Promise<string> {
  const apiKey = ENV.deepseekApiKey || ENV.forgeApiKey;
  const baseUrl = ENV.deepseekApiKey
    ? (ENV.deepseekApiUrl || "https://api.deepseek.com/v1")
    : (ENV.forgeApiUrl ? ENV.forgeApiUrl.replace(/\/$/, "") : "https://api.openai.com/v1");
  const apiUrl = baseUrl.endsWith("/v1")
    ? `${baseUrl}/chat/completions`
    : `${baseUrl}/v1/chat/completions`;
  const model = ENV.deepseekApiKey ? "deepseek-chat" : "gpt-4o-mini";

  if (!apiKey || flaggedWords.length === 0) return content;

  const wordList = flaggedWords.map(w =>
    `"${w.word}"${w.replacement ? `（建议替换为"${w.replacement}"）` : "（需删除或改写）"}`
  ).join("、");

  const prompt = `请对以下文章内容进行合规改写，要求：
1. 将文中的敏感词替换为合规表达：${wordList}
2. 保持文章原意和结构不变
3. 改写后的内容需符合中国主流媒体平台规范
4. 只返回改写后的文章内容，不要添加任何说明

原文：
${content}`;

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
        max_tokens: 3000,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) return content;

    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data?.choices?.[0]?.message?.content || content;
  } catch {
    return content;
  }
}

// ─── Get articles for public listing ─────────────────────────────────────────

export async function getPublishedArticles(options: {
  limit?: number;
  offset?: number;
  category?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    eq(articles.status, "published"),
    eq(articles.isActive, true),
  ];
  if (options.category) {
    conditions.push(eq(articles.category, options.category));
  }

  return db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      coverImage: articles.coverImage,
      category: articles.category,
      tags: articles.tags,
      author: articles.author,
      viewCount: articles.viewCount,
      isPinned: articles.isPinned,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .where(and(...conditions))
    .orderBy(desc(articles.isPinned), desc(articles.publishedAt))
    .limit(options.limit ?? 20)
    .offset(options.offset ?? 0);
}

// ─── Increment view count ─────────────────────────────────────────────────────

export async function incrementArticleView(id: number) {
  const db = await getDb();
  if (!db) return;
  // Use raw SQL increment to avoid race conditions
  await db.execute(`UPDATE articles SET viewCount = viewCount + 1 WHERE id = ${id}`);
}
