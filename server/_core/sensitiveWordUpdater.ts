/**
 * Sensitive Word Library Auto-Updater
 *
 * 设计思路：
 *  - 维护一个「词库来源注册表」(WORD_SOURCES)，每个来源描述如何拉取词条
 *  - 支持三种来源类型：
 *      github   — 从 GitHub raw 文本文件拉取（每行一词）
 *      api      — 调用外部 REST API 获取 JSON 词条列表
 *      ai       — 调用 AI 生成特定领域的敏感词（如加密货币合规词汇）
 *  - 每次更新：拉取词条 → 去重（与数据库现有词条对比）→ 批量入库 → 写更新日志
 *  - 定时调度：每 24 小时自动执行一次（与 RSS 调度器同级）
 *  - 支持手动触发（通过后台 tRPC 路由调用 runWordUpdate()）
 *
 * 新增词库来源步骤：
 *  1. 在 WORD_SOURCES 数组中添加一个 WordSource 对象
 *  2. 如果是新类型，在 fetchWordsFromSource() 中添加对应的 case
 *  3. 无需修改其他代码
 *
 * 词库来源（当前已配置）：
 *  - github_dfa_cn        中文敏感词（DFA 算法词库，GitHub 开源）
 *  - github_crypto_cn     加密货币/Web3 合规词汇（自维护）
 *  - ai_crypto_compliance AI 生成的加密货币监管合规敏感词
 */

import { getDb, getSystemSetting } from "../db";
import { sensitiveWords, sensitiveWordUpdateLogs } from "../../drizzle/schema";
import { ENV } from "./env";
import { eq } from "drizzle-orm";

// ─── 类型定义 ─────────────────────────────────────────────────────────────────

type WordSourceType = "github" | "api" | "ai";

interface WordEntry {
  word: string;
  category: string;
  severity: "block" | "warn" | "replace";
  platforms: string;
  replacement?: string;
}

interface WordSource {
  /** 唯一标识，写入 update_logs.source */
  id: string;
  /** 中文名称，用于日志展示 */
  name: string;
  /** 来源类型 */
  type: WordSourceType;
  /** 来源 URL（github/api 类型必填） */
  url?: string;
  /** 默认分类（github 纯文本来源使用） */
  defaultCategory?: string;
  /** 默认处理方式 */
  defaultSeverity?: "block" | "warn" | "replace";
  /** 默认适用平台 */
  defaultPlatforms?: string;
  /** AI 来源的生成 prompt（ai 类型必填） */
  aiPrompt?: string;
  /** 是否启用 */
  enabled: boolean;
}

// ─── 词库来源注册表 ───────────────────────────────────────────────────────────

/**
 * WORD_SOURCES — 词库来源注册表
 *
 * 新增来源只需在此添加一个对象，无需修改其他代码。
 *
 * GitHub 来源说明：
 *  - url 指向 raw 文本文件，每行一个词（支持 # 注释行）
 *  - 词条会以 defaultCategory/defaultSeverity/defaultPlatforms 入库
 *
 * AI 来源说明：
 *  - 调用 DeepSeek/OpenAI 生成特定领域的敏感词列表
 *  - 返回 JSON 格式：[{ word, category, severity, platforms, replacement? }]
 *  - 适合生成「加密货币监管合规词汇」等领域专属词库
 */
const WORD_SOURCES: WordSource[] = [
  // ── GitHub 开源中文敏感词库 ────────────────────────────────────────────────
  {
    id: "github_dfa_cn_political",
    name: "GitHub 政治敏感词库",
    type: "github",
    url: "https://raw.githubusercontent.com/fwwdn/sensitive-stop-words/master/政治类.txt",
    defaultCategory: "political",
    defaultSeverity: "block",
    defaultPlatforms: "wechat,weibo,douyin",
    enabled: true,
  },
  {
    id: "github_dfa_cn_financial",
    name: "GitHub 金融违规词库",
    type: "github",
    url: "https://raw.githubusercontent.com/fwwdn/sensitive-stop-words/master/涉黄类.txt",
    defaultCategory: "adult",
    defaultSeverity: "block",
    defaultPlatforms: "all",
    enabled: true,
  },
  {
    id: "github_stopwords_cn",
    name: "GitHub 中文停用词库",
    type: "github",
    url: "https://raw.githubusercontent.com/goto456/stopwords/master/cn_stopwords.txt",
    defaultCategory: "spam",
    defaultSeverity: "warn",
    defaultPlatforms: "all",
    enabled: false, // 停用词较多，默认关闭，按需开启
  },
  // ── AI 生成的加密货币合规词库 ─────────────────────────────────────────────
  {
    id: "ai_crypto_compliance",
    name: "AI 生成加密货币合规词库",
    type: "ai",
    aiPrompt: `你是一位中国加密货币/Web3内容合规专家。请生成一份针对中国主流媒体平台（微信公众号、微博、抖音）的加密货币内容敏感词库。

要求：
1. 聚焦于以下类别：
   - financial: 虚假收益承诺、诱导投资、内幕消息（如"稳赚"、"保本"、"内幕"）
   - political: 涉及政策批评、监管对抗（如"绕过监管"、"逃避审查"）
   - spam: 常见营销违规词（如"私信我"、"加微信"、"限时秒杀"）
2. 每个词条包含：word（敏感词）、category（分类）、severity（block/warn/replace）、platforms（适用平台，逗号分隔或"all"）、replacement（替换词，仅replace类型需要）
3. 生成 30-50 个高质量词条，避免过于宽泛的词汇
4. 严格按照以下 JSON 格式返回，不要添加任何其他内容：
[
  {"word": "稳赚不赔", "category": "financial", "severity": "block", "platforms": "wechat,weibo,douyin"},
  {"word": "内幕消息", "category": "financial", "severity": "block", "platforms": "all"},
  {"word": "私信我", "category": "spam", "severity": "warn", "platforms": "wechat,weibo", "replacement": "欢迎联系"}
]`,
    defaultCategory: "financial",
    defaultSeverity: "warn",
    defaultPlatforms: "all",
    enabled: true,
  },
  // ── 自定义扩展来源（示例，默认禁用）──────────────────────────────────────
  // 新增来源时，复制以下模板并修改参数：
  // {
  //   id: "custom_my_source",
  //   name: "我的自定义词库",
  //   type: "github",
  //   url: "https://raw.githubusercontent.com/your-repo/words.txt",
  //   defaultCategory: "custom",
  //   defaultSeverity: "warn",
  //   defaultPlatforms: "all",
  //   enabled: false,
  // },
];

// ─── 从来源拉取词条 ───────────────────────────────────────────────────────────

async function fetchWordsFromSource(source: WordSource): Promise<WordEntry[]> {
  switch (source.type) {
    case "github":
      return fetchFromGithub(source);
    case "api":
      return fetchFromApi(source);
    case "ai":
      return fetchFromAi(source);
    default:
      throw new Error(`未知来源类型: ${(source as WordSource).type}`);
  }
}

/** 从 GitHub raw 文本文件拉取（每行一词） */
async function fetchFromGithub(source: WordSource): Promise<WordEntry[]> {
  if (!source.url) throw new Error(`${source.id}: url 未配置`);

  const res = await fetch(source.url, {
    headers: { "User-Agent": "Get8Pro-WordUpdater/1.0" },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} 拉取失败: ${source.url}`);
  }

  const text = await res.text();
  const words: WordEntry[] = [];

  for (const line of text.split("\n")) {
    const word = line.trim();
    // 跳过空行、注释行（# 开头）、过短（1字）或过长（>64字）的词
    if (!word || word.startsWith("#") || word.length < 2 || word.length > 64) continue;
    words.push({
      word,
      category: source.defaultCategory ?? "custom",
      severity: source.defaultSeverity ?? "warn",
      platforms: source.defaultPlatforms ?? "all",
    });
  }

  return words;
}

/** 从 REST API 拉取 JSON 格式词条 */
async function fetchFromApi(source: WordSource): Promise<WordEntry[]> {
  if (!source.url) throw new Error(`${source.id}: url 未配置`);

  const res = await fetch(source.url, {
    headers: { "User-Agent": "Get8Pro-WordUpdater/1.0", "Accept": "application/json" },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json() as unknown;
  if (!Array.isArray(data)) throw new Error("API 返回格式不是数组");

  return (data as Array<Record<string, string>>)
    .filter(item => item.word && item.word.length >= 2 && item.word.length <= 64)
    .map(item => ({
      word: String(item.word).trim(),
      category: String(item.category ?? source.defaultCategory ?? "custom"),
      severity: (["block", "warn", "replace"].includes(item.severity) ? item.severity : (source.defaultSeverity ?? "warn")) as "block" | "warn" | "replace",
      platforms: String(item.platforms ?? source.defaultPlatforms ?? "all"),
      replacement: item.replacement ? String(item.replacement) : undefined,
    }));
}

/** 调用 AI 生成词条 */
async function fetchFromAi(source: WordSource): Promise<WordEntry[]> {
  if (!source.aiPrompt) throw new Error(`${source.id}: aiPrompt 未配置`);

  const apiKey = ENV.deepseekApiKey || ENV.forgeApiKey;
  if (!apiKey) {
    throw new Error("未配置 AI API Key（DEEPSEEK_API_KEY 或 BUILT_IN_FORGE_API_KEY），跳过 AI 词库生成");
  }

  const baseUrl = ENV.deepseekApiKey
    ? (ENV.deepseekApiUrl || "https://api.deepseek.com/v1")
    : (ENV.forgeApiUrl ? ENV.forgeApiUrl.replace(/\/$/, "") : "https://api.openai.com/v1");
  const apiUrl = baseUrl.endsWith("/v1")
    ? `${baseUrl}/chat/completions`
    : `${baseUrl}/v1/chat/completions`;
  const model = ENV.deepseekApiKey ? "deepseek-chat" : "gpt-4o-mini";

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: source.aiPrompt }],
      max_tokens: 2000,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI API 请求失败: ${res.status} - ${errText.slice(0, 200)}`);
  }

  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = data?.choices?.[0]?.message?.content ?? "";

  // 提取 JSON 数组
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("无法从 AI 响应中提取 JSON 数组");

  const parsed = JSON.parse(jsonMatch[0]) as Array<Record<string, string>>;
  if (!Array.isArray(parsed)) throw new Error("AI 返回格式不是数组");

  return parsed
    .filter(item => item.word && String(item.word).length >= 2 && String(item.word).length <= 64)
    .map(item => ({
      word: String(item.word).trim(),
      category: String(item.category ?? source.defaultCategory ?? "financial"),
      severity: (["block", "warn", "replace"].includes(item.severity) ? item.severity : "warn") as "block" | "warn" | "replace",
      platforms: String(item.platforms ?? source.defaultPlatforms ?? "all"),
      replacement: item.replacement ? String(item.replacement) : undefined,
    }));
}

// ─── 单次来源更新 ─────────────────────────────────────────────────────────────

interface UpdateResult {
  source: string;
  sourceName: string;
  added: number;
  skipped: number;
  status: "success" | "failed" | "partial";
  error?: string;
}

async function updateFromSource(source: WordSource, isManual: boolean): Promise<UpdateResult> {
  const result: UpdateResult = {
    source: source.id,
    sourceName: source.name,
    added: 0,
    skipped: 0,
    status: "success",
  };

  const db = await getDb();
  if (!db) {
    result.status = "failed";
    result.error = "数据库连接失败";
    return result;
  }

  try {
    console.log(`[词库更新] 开始拉取: ${source.name} (${source.id})`);

    // 1. 拉取词条
    const newWords = await fetchWordsFromSource(source);
    if (!newWords.length) {
      console.log(`[词库更新] ${source.name}: 未获取到词条`);
      result.status = "partial";
      result.error = "未获取到词条";
      return result;
    }

    console.log(`[词库更新] ${source.name}: 获取到 ${newWords.length} 个词条，开始去重...`);

    // 2. 获取数据库中已有的词（用于去重）
    const existing = await db
      .select({ word: sensitiveWords.word })
      .from(sensitiveWords);
    const existingSet = new Set(existing.map((r: { word: string }) => r.word.toLowerCase()));

    // 3. 过滤出新词
    const toInsert = newWords.filter(w => !existingSet.has(w.word.toLowerCase()));
    result.skipped = newWords.length - toInsert.length;

    if (!toInsert.length) {
      console.log(`[词库更新] ${source.name}: 全部 ${newWords.length} 个词条已存在，跳过`);
      result.status = "success";
      return result;
    }

    // 4. 批量入库（每批 50 条，避免单次 INSERT 过大）
    const BATCH_SIZE = 50;
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE);
      await db.insert(sensitiveWords).values(
        batch.map(w => ({
          word: w.word,
          category: w.category,
          severity: w.severity,
          platforms: w.platforms,
          replacement: w.replacement ?? null,
          isActive: true,
        }))
      );
      result.added += batch.length;
    }

    console.log(`[词库更新] ${source.name}: 新增 ${result.added} 个词条，跳过 ${result.skipped} 个`);
  } catch (e) {
    result.status = "failed";
    result.error = e instanceof Error ? e.message : String(e);
    console.error(`[词库更新] ${source.name} 失败:`, e);
  }

  // 5. 写更新日志
  try {
    await db.insert(sensitiveWordUpdateLogs).values({
      source: result.source,
      sourceName: result.sourceName,
      addedCount: result.added,
      skippedCount: result.skipped,
      status: result.status,
      errorMessage: result.error ?? null,
      isManual,
    });
  } catch (e) {
    console.warn("[词库更新] 写日志失败:", e);
  }

  return result;
}

// ─── 批量更新（所有启用的来源）────────────────────────────────────────────────

export interface RunWordUpdateResult {
  results: UpdateResult[];
  totalAdded: number;
  totalSkipped: number;
  successCount: number;
  failedCount: number;
}

/**
 * runWordUpdate — 运行一次词库更新
 *
 * @param isManual  true = 管理员手动触发，false = 定时任务自动触发
 * @param sourceIds 指定来源 ID 列表（不传则更新所有启用的来源）
 */
export async function runWordUpdate(
  isManual = false,
  sourceIds?: string[]
): Promise<RunWordUpdateResult> {
  const sources = WORD_SOURCES.filter(s =>
    s.enabled && (sourceIds ? sourceIds.includes(s.id) : true)
  );

  if (!sources.length) {
    return { results: [], totalAdded: 0, totalSkipped: 0, successCount: 0, failedCount: 0 };
  }

  console.log(`[词库更新] 开始更新，共 ${sources.length} 个来源，isManual=${isManual}`);

  const results: UpdateResult[] = [];
  for (const source of sources) {
    const result = await updateFromSource(source, isManual);
    results.push(result);
  }

  const totalAdded   = results.reduce((s, r) => s + r.added, 0);
  const totalSkipped = results.reduce((s, r) => s + r.skipped, 0);
  const successCount = results.filter(r => r.status === "success").length;
  const failedCount  = results.filter(r => r.status === "failed").length;

  console.log(`[词库更新] 完成：新增 ${totalAdded}，跳过 ${totalSkipped}，成功 ${successCount}，失败 ${failedCount}`);

  return { results, totalAdded, totalSkipped, successCount, failedCount };
}

// ─── 获取所有来源的元信息（供前端展示）──────────────────────────────────────

export function getWordSources() {
  return WORD_SOURCES.map(s => ({
    id: s.id,
    name: s.name,
    type: s.type,
    enabled: s.enabled,
    url: s.url ?? null,
  }));
}

// ─── 启动定时更新调度器 ───────────────────────────────────────────────────────

/**
 * startWordUpdateScheduler — 启动敏感词库定时更新任务
 *
 * 默认每 24 小时更新一次（可通过环境变量 WORD_UPDATE_INTERVAL_HOURS 调整）。
 * 首次执行延迟 60 秒（等待 DB 连接就绪，避免与 RSS 调度器竞争）。
 */
export function startWordUpdateScheduler(): void {
  const intervalHours = ENV.wordUpdateIntervalHours;
  // 设为 0 表示禁用自动更新
  if (intervalHours <= 0) {
    console.log("[词库更新] 已禁用定时更新（WORD_UPDATE_INTERVAL_HOURS=0）");
    return;
  }
  const intervalMs = intervalHours * 60 * 60 * 1000;

  const run = async () => {
    try {
      // 检查数据库中的词库自动更新开关
      const enabled = await getSystemSetting("word_update_enabled", "true");
      if (enabled !== "true") {
        console.log("[词库更新] 已通过管理后台关闭，跳过本轮更新");
        return;
      }
      await runWordUpdate(false);
    } catch (e) {
      console.error("[词库更新] 本轮更新出现未预期错误:", e);
    }
  };

  // 启动后延迟 60 秒首次执行
  setTimeout(() => {
    run().catch(e => console.error("[词库更新] 定时任务异常:", e));
    setInterval(() => run().catch(e => console.error("[词库更新] 定时任务异常:", e)), intervalMs);
  }, 60_000);

  console.log(`[词库更新] 定时更新已启动，间隔 ${intervalHours} 小时，共 ${WORD_SOURCES.filter(s => s.enabled).length} 个启用来源`);
}
