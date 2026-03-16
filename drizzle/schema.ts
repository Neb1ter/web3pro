import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, tinyint, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Contact form submissions from users seeking fee rebate configuration.
 */
export const contactSubmissions = mysqlTable("contact_submissions", {
  id: int("id").autoincrement().primaryKey(),
  platform: varchar("platform", { length: 64 }).notNull(),
  accountName: varchar("accountName", { length: 256 }).notNull(),
  exchangeUid: varchar("exchangeUid", { length: 128 }),
  exchangeUsername: varchar("exchangeUsername", { length: 256 }),
  message: text("message"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;

/**
 * Exchange referral links and invite codes — editable from the Dashboard Database panel.
 */
export const exchangeLinks = mysqlTable("exchange_links", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 64 }).notNull(),
  referralLink: text("referralLink").notNull(),
  inviteCode: varchar("inviteCode", { length: 64 }).notNull(),
  rebateRate: varchar("rebateRate", { length: 16 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExchangeLink = typeof exchangeLinks.$inferSelect;
export type InsertExchangeLink = typeof exchangeLinks.$inferInsert;

/**
 * FAQ (新手问答) — editable from the Dashboard Database panel.
 * Add, edit, or delete questions and answers without redeploying.
 * category: "basic" | "trading" | "security" | "fees" | "other"
 */
export const faqs = mysqlTable("faqs", {
  id: int("id").autoincrement().primaryKey(),
  /** Short question text */
  question: text("question").notNull(),
  /** Full answer text (supports simple markdown) */
  answer: text("answer").notNull(),
  /** Category tag for filtering */
  category: varchar("category", { length: 32 }).default("basic").notNull(),
  /** Display order (lower = first) */
  sortOrder: int("sortOrder").default(0).notNull(),
  /** Whether this FAQ is visible on the site */
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Faq = typeof faqs.$inferSelect;
export type InsertFaq = typeof faqs.$inferInsert;

/**
 * Crypto news items — seeded from BlockBeats/OKX, editable from Dashboard.
 * Displayed on the /crypto-news timeline page.
 */
export const cryptoNews = mysqlTable("crypto_news", {
  id: int("id").autoincrement().primaryKey(),
  /** News headline */
  title: text("title").notNull(),
  /** Brief summary (1-2 sentences) */
  summary: text("summary"),
  /** Source name, e.g. "律动BlockBeats" */
  source: varchar("source", { length: 64 }).default("律动BlockBeats").notNull(),
  /** Original article URL */
  url: text("url"),
  /** Category: "market" | "policy" | "exchange" | "defi" | "nft" | "other" */
  category: varchar("category", { length: 32 }).default("market").notNull(),
  /** Whether pinned to top */
  isPinned: boolean("isPinned").default(false).notNull(),
  /** Whether visible on site */
  isActive: boolean("isActive").default(true).notNull(),
  /** Publication time (used for timeline ordering) */
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CryptoNews = typeof cryptoNews.$inferSelect;
export type InsertCryptoNews = typeof cryptoNews.$inferInsert;

/**
 * Exchange feature categories — the 13 functional areas of a CEX.
 * Editable from Dashboard Database panel.
 */
export const exchangeFeatureCategories = mysqlTable("exchange_feature_categories", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 32 }).notNull().unique(),
  nameZh: varchar("nameZh", { length: 64 }).notNull(),
  nameEn: varchar("nameEn", { length: 64 }).notNull(),
  icon: varchar("icon", { length: 8 }).notNull(),
  descZh: text("descZh").notNull(),
  descEn: text("descEn").notNull(),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).default("beginner").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
});

export type ExchangeFeatureCategory = typeof exchangeFeatureCategories.$inferSelect;
export type InsertExchangeFeatureCategory = typeof exchangeFeatureCategories.$inferInsert;

/**
 * Exchange feature support details — per-exchange support level and details for each feature.
 * Editable from Dashboard Database panel or /admin/exchange-guide.
 */
export const exchangeFeatureSupport = mysqlTable("exchange_feature_support", {
  id: int("id").autoincrement().primaryKey(),
  exchangeSlug: varchar("exchangeSlug", { length: 32 }).notNull(),
  featureSlug: varchar("featureSlug", { length: 32 }).notNull(),
  supported: tinyint("supported").default(1).notNull(),
  levelZh: varchar("levelZh", { length: 32 }).notNull(),
  levelEn: varchar("levelEn", { length: 64 }).notNull(),
  detailZh: text("detailZh").notNull(),
  detailEn: text("detailEn").notNull(),
  maxLeverage: varchar("maxLeverage", { length: 16 }),
  feeInfo: varchar("feeInfo", { length: 256 }),
  highlight: tinyint("highlight").default(0).notNull(),
  /** KYC requirement level: none | basic | standard | enhanced */
  kycLevel: varchar("kycLevel", { length: 16 }).default("standard"),
  /** Comma-separated supported regions, e.g. "CN,HK,TW,SG" */
  supportedRegions: varchar("supportedRegions", { length: 256 }),
  /** Fee tier label, e.g. "低" / "中" / "高" */
  feeLevel: varchar("feeLevel", { length: 8 }),
  /** Extra notes shown in admin panel */
  notes: text("notes"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExchangeFeatureSupport = typeof exchangeFeatureSupport.$inferSelect;
export type InsertExchangeFeatureSupport = typeof exchangeFeatureSupport.$inferInsert;

/**
 * Simulated trading history — stores closed positions for each user.
 * simType: "spot" | "futures" | "margin"
 * direction: "long" | "short" | "buy" | "sell"
 * Data is tied to the user's account; reset only on explicit user request.
 */
export const simTradeHistory = mysqlTable("sim_trade_history", {
  id: int("id").autoincrement().primaryKey(),
  /** User who made the trade */
  userId: int("userId").notNull(),
  /** Type of simulation: spot, futures, margin */
  simType: mysqlEnum("simType", ["spot", "futures", "margin"]).notNull(),
  /** Trading pair, e.g. BTC/USDT */
  symbol: varchar("symbol", { length: 16 }).notNull(),
  /** Trade direction */
  direction: mysqlEnum("direction", ["long", "short", "buy", "sell"]).notNull(),
  /** Entry price */
  entryPrice: varchar("entryPrice", { length: 32 }).notNull(),
  /** Exit price */
  exitPrice: varchar("exitPrice", { length: 32 }).notNull(),
  /** Position size (e.g. BTC amount) */
  size: varchar("size", { length: 32 }).notNull(),
  /** Leverage multiplier (1 for spot) */
  leverage: int("leverage").default(1).notNull(),
  /** Realized PnL in USDT */
  pnl: varchar("pnl", { length: 32 }).notNull(),
  /** PnL percentage */
  pnlPct: varchar("pnlPct", { length: 16 }).notNull(),
  /** How position was closed: manual | tp | sl | liquidated | reversed */
  closeReason: varchar("closeReason", { length: 32 }).default("manual").notNull(),
  /** Margin mode for futures/margin: cross | isolated */
  marginMode: varchar("marginMode", { length: 16 }),
  /** When the position was opened */
  openedAt: timestamp("openedAt").notNull(),
  /** When the position was closed */
  closedAt: timestamp("closedAt").defaultNow().notNull(),
});

export type SimTradeHistory = typeof simTradeHistory.$inferSelect;
export type InsertSimTradeHistory = typeof simTradeHistory.$inferInsert;

/**
 * Crypto tools collection — curated list of useful crypto tools for users.
 * Editable from admin panel.
 */
export const cryptoTools = mysqlTable("crypto_tools", {
  id: int("id").autoincrement().primaryKey(),
  /** Tool name in Chinese */
  name: varchar("name", { length: 64 }).notNull(),
  /** Tool name in English */
  nameEn: varchar("nameEn", { length: 64 }).notNull(),
  /** Description in Chinese */
  description: text("description").notNull(),
  /** Description in English */
  descriptionEn: text("descriptionEn").notNull(),
  /** Category: "price" | "chart" | "onchain" | "defi" | "nft" | "security" | "tax" | "news" | "general" */
  category: varchar("category", { length: 32 }).default("general").notNull(),
  /** Source/provider name, e.g. "CoinGecko", "TradingView" */
  source: varchar("source", { length: 128 }).notNull(),
  /** Tool URL */
  url: varchar("url", { length: 512 }).notNull(),
  /** Emoji icon */
  icon: varchar("icon", { length: 8 }).default("🔧").notNull(),
  /** Comma-separated tags */
  tags: varchar("tags", { length: 256 }),
  /** Difficulty level */
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).default("beginner").notNull(),
  /** Sort order */
  sortOrder: int("sortOrder").default(0).notNull(),
  /** Whether visible on site */
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CryptoTool = typeof cryptoTools.$inferSelect;
export type InsertCryptoTool = typeof cryptoTools.$inferInsert;

/**
 * System settings — key/value store for runtime configuration.
 * Editable from admin panel without redeployment.
 * key examples: "rss_enabled", "telegram_enabled"
 */
export const systemSettings = mysqlTable("system_settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  value: varchar("value", { length: 256 }).notNull(),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;

/**
 * Articles — deep-dive articles written/generated for the content hub.
 * Supports AI generation, SEO fields, compliance review, and multi-platform publishing.
 * status: "draft" | "pending_review" | "approved" | "published" | "rejected"
 */
export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  /** Article title */
  title: varchar("title", { length: 256 }).notNull(),
  /** URL slug (e.g. "bitcoin-2024-outlook") */
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  /** Article body in Markdown */
  content: text("content").notNull(),
  /** Short excerpt for listing pages */
  excerpt: text("excerpt"),
  /** Cover image URL */
  coverImage: varchar("coverImage", { length: 512 }),
  /** Category: "analysis" | "tutorial" | "news_decode" | "project" | "promo" | "report" */
  category: varchar("category", { length: 32 }).default("analysis").notNull(),
  /** Comma-separated tags */
  tags: varchar("tags", { length: 512 }),
  /** Author name */
  author: varchar("author", { length: 64 }).default("Get8Pro编辑部").notNull(),
  /** Article status */
  status: mysqlEnum("status", ["draft", "pending_review", "approved", "published", "rejected"]).default("draft").notNull(),
  /** AI generation perspective: "neutral" | "bullish" | "bearish" | "educational" */
  perspective: varchar("perspective", { length: 32 }).default("neutral"),
  /** Target audience: "beginner" | "intermediate" | "professional" | "institutional" */
  targetAudience: varchar("targetAudience", { length: 32 }).default("beginner"),
  /** Content style: "formal" | "casual" | "marketing" */
  contentStyle: varchar("contentStyle", { length: 32 }).default("formal"),
  /** Whether generated by AI */
  isAiGenerated: boolean("isAiGenerated").default(false).notNull(),
  /** AI generation prompt used */
  aiPrompt: text("aiPrompt"),
  /** Sensitive word check result: "pending" | "clean" | "flagged" */
  sensitiveStatus: varchar("sensitiveStatus", { length: 32 }).default("pending"),
  /** Flagged sensitive words (JSON array) */
  sensitiveWords: text("sensitiveWords"),
  /** Admin review notes */
  reviewNotes: text("reviewNotes"),
  /** SEO meta title */
  metaTitle: varchar("metaTitle", { length: 256 }),
  /** SEO meta description */
  metaDescription: varchar("metaDescription", { length: 512 }),
  /** SEO keywords (comma-separated) */
  metaKeywords: varchar("metaKeywords", { length: 512 }),
  /** View count */
  viewCount: int("viewCount").default(0).notNull(),
  /** Whether pinned to top */
  isPinned: boolean("isPinned").default(false).notNull(),
  /** Whether visible on site */
  isActive: boolean("isActive").default(true).notNull(),
  /** Scheduled publish time */
  scheduledAt: timestamp("scheduledAt"),
  /** Actual publish time */
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

/**
 * Media platform configurations — API keys and settings for each publishing platform.
 * platform: "telegram" | "wechat" | "weibo" | "twitter" | "tiktok" | "rss"
 */
export const mediaPlatforms = mysqlTable("media_platforms", {
  id: int("id").autoincrement().primaryKey(),
  /** Platform identifier */
  platform: varchar("platform", { length: 32 }).notNull().unique(),
  /** Display name */
  name: varchar("name", { length: 64 }).notNull(),
  /** Platform icon emoji */
  icon: varchar("icon", { length: 8 }).default("📢").notNull(),
  /** Whether this platform is enabled */
  isEnabled: boolean("isEnabled").default(false).notNull(),
  /** API key / access token (encrypted in production) */
  apiKey: text("apiKey"),
  /** API secret / refresh token */
  apiSecret: text("apiSecret"),
  /** Channel/account ID (e.g. Telegram channel ID) */
  channelId: varchar("channelId", { length: 256 }),
  /** Extra config as JSON (e.g. {"app_id":"xxx","app_secret":"yyy"}) */
  extraConfig: text("extraConfig"),
  /** Auto-publish new articles to this platform */
  autoPublish: boolean("autoPublish").default(false).notNull(),
  /** Auto-publish news flashes to this platform */
  autoPublishNews: boolean("autoPublishNews").default(false).notNull(),
  /** Sensitive word standard for this platform: "wechat" | "weibo" | "tiktok" | "general" */
  sensitiveStandard: varchar("sensitiveStandard", { length: 32 }).default("general"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MediaPlatform = typeof mediaPlatforms.$inferSelect;
export type InsertMediaPlatform = typeof mediaPlatforms.$inferInsert;

/**
 * Publish logs — records every push attempt to external platforms.
 * status: "pending" | "success" | "failed" | "skipped"
 */
export const publishLogs = mysqlTable("publish_logs", {
  id: int("id").autoincrement().primaryKey(),
  /** Content type: "article" | "news" */
  contentType: varchar("contentType", { length: 16 }).notNull(),
  /** ID of the article or news item */
  contentId: int("contentId").notNull(),
  /** Content title snapshot */
  contentTitle: varchar("contentTitle", { length: 256 }).notNull(),
  /** Target platform */
  platform: varchar("platform", { length: 32 }).notNull(),
  /** Push status */
  status: mysqlEnum("status", ["pending", "success", "failed", "skipped"]).default("pending").notNull(),
  /** Platform response or error message */
  response: text("response"),
  /** Retry count */
  retryCount: int("retryCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PublishLog = typeof publishLogs.$inferSelect;
export type InsertPublishLog = typeof publishLogs.$inferInsert;

/**
 * Sensitive word library — platform-specific word lists for content compliance.
 * platform: "wechat" | "weibo" | "tiktok" | "twitter" | "general"
 * severity: "block" | "warn" | "replace"
 */
export const sensitiveWords = mysqlTable("sensitive_words", {
  id: int("id").autoincrement().primaryKey(),
  /** The sensitive word or phrase */
  word: varchar("word", { length: 128 }).notNull(),
  /** Which platform this rule applies to (comma-separated or "all") */
  platforms: varchar("platforms", { length: 128 }).default("all").notNull(),
  /** Severity level */
  severity: mysqlEnum("severity", ["block", "warn", "replace"]).default("warn").notNull(),
  /** Replacement word (for "replace" severity) */
  replacement: varchar("replacement", { length: 128 }),
  /** Category: "political" | "financial" | "adult" | "spam" | "custom" */
  category: varchar("category", { length: 32 }).default("custom").notNull(),
  /** Whether this rule is active */
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SensitiveWord = typeof sensitiveWords.$inferSelect;
export type InsertSensitiveWord = typeof sensitiveWords.$inferInsert;

/**
 * Sensitive word update logs — records each automatic/manual update run.
 * source: which word list source was pulled
 * status: "success" | "failed" | "partial"
 */
export const sensitiveWordUpdateLogs = mysqlTable("sensitive_word_update_logs", {
  id: int("id").autoincrement().primaryKey(),
  /** Update source identifier (e.g. "github_dfa", "github_stopwords", "ai_crypto", "manual") */
  source: varchar("source", { length: 64 }).notNull(),
  /** Human-readable source name */
  sourceName: varchar("sourceName", { length: 128 }).notNull(),
  /** Number of new words added in this run */
  addedCount: int("addedCount").default(0).notNull(),
  /** Number of words skipped (already exist) */
  skippedCount: int("skippedCount").default(0).notNull(),
  /** Run status */
  status: mysqlEnum("status", ["success", "failed", "partial"]).default("success").notNull(),
  /** Error message if failed */
  errorMessage: text("errorMessage"),
  /** Whether this was triggered manually by admin */
  isManual: boolean("isManual").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SensitiveWordUpdateLog = typeof sensitiveWordUpdateLogs.$inferSelect;
export type InsertSensitiveWordUpdateLog = typeof sensitiveWordUpdateLogs.$inferInsert;
