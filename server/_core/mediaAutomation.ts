import type { Article, CryptoNews } from "../../drizzle/schema";

export type DeliveryMode = "direct" | "assisted" | "planned";
export type MediaDraftTarget =
  | "medium"
  | "mirror"
  | "reddit"
  | "zhihu"
  | "wechat"
  | "twitter";

export interface PlatformCapability {
  platform: string;
  displayName: string;
  deliveryMode: DeliveryMode;
  supportsArticle: boolean;
  supportsNews: boolean;
  supportsConnectionTest: boolean;
  summaryZh: string;
  summaryEn: string;
}

export interface MediaDraftPackage {
  platform: MediaDraftTarget;
  displayName: string;
  publishUrl: string;
  title: string;
  summary: string;
  body: string;
  notes: string[];
  wordCount: number;
}

type ArticleLike = Pick<
  Article,
  | "title"
  | "excerpt"
  | "content"
  | "slug"
  | "author"
  | "category"
  | "metaDescription"
  | "metaTitle"
  | "publishedAt"
  | "updatedAt"
>;

type NewsLike = Pick<CryptoNews, "title" | "summary" | "source" | "url" | "category" | "publishedAt">;

const PLATFORM_CAPABILITIES: Record<string, PlatformCapability> = {
  telegram: {
    platform: "telegram",
    displayName: "Telegram",
    deliveryMode: "direct",
    supportsArticle: true,
    supportsNews: true,
    supportsConnectionTest: true,
    summaryZh: "已支持文章与快讯直连推送。",
    summaryEn: "Direct publish for articles and news is supported.",
  },
  discord: {
    platform: "discord",
    displayName: "Discord",
    deliveryMode: "direct",
    supportsArticle: true,
    supportsNews: true,
    supportsConnectionTest: false,
    summaryZh: "已支持通过 Webhook 直连推送。",
    summaryEn: "Direct publish via webhook is supported.",
  },
  slack: {
    platform: "slack",
    displayName: "Slack",
    deliveryMode: "direct",
    supportsArticle: true,
    supportsNews: true,
    supportsConnectionTest: false,
    summaryZh: "已支持通过 Incoming Webhook 直连推送。",
    summaryEn: "Direct publish via incoming webhook is supported.",
  },
  notion: {
    platform: "notion",
    displayName: "Notion",
    deliveryMode: "direct",
    supportsArticle: true,
    supportsNews: true,
    supportsConnectionTest: true,
    summaryZh: "已支持归档到 Notion 数据库。",
    summaryEn: "Archiving into a Notion database is supported.",
  },
  wechat: {
    platform: "wechat",
    displayName: "微信公众号",
    deliveryMode: "assisted",
    supportsArticle: true,
    supportsNews: false,
    supportsConnectionTest: false,
    summaryZh: "暂不直连，建议先生成图文草稿后手动发布。",
    summaryEn: "No direct publishing yet. Generate a draft package first.",
  },
  weibo: {
    platform: "weibo",
    displayName: "微博",
    deliveryMode: "assisted",
    supportsArticle: true,
    supportsNews: true,
    supportsConnectionTest: false,
    summaryZh: "暂不直连，建议使用平台定制短稿手动发布。",
    summaryEn: "No direct publishing yet. Use platform-specific short drafts.",
  },
  twitter: {
    platform: "twitter",
    displayName: "Twitter/X",
    deliveryMode: "assisted",
    supportsArticle: true,
    supportsNews: true,
    supportsConnectionTest: false,
    summaryZh: "暂不直连，建议先生成线程稿后手动发布。",
    summaryEn: "No direct publishing yet. Generate a thread draft first.",
  },
  reddit: {
    platform: "reddit",
    displayName: "Reddit",
    deliveryMode: "assisted",
    supportsArticle: true,
    supportsNews: false,
    supportsConnectionTest: false,
    summaryZh: "暂不直连，建议先生成讨论帖版本再手动发帖。",
    summaryEn: "No direct publishing yet. Generate a discussion post first.",
  },
  douyin: {
    platform: "douyin",
    displayName: "抖音",
    deliveryMode: "planned",
    supportsArticle: false,
    supportsNews: false,
    supportsConnectionTest: false,
    summaryZh: "目前仅保留规划位，后续按图文/视频流转补齐。",
    summaryEn: "Planned only for now.",
  },
  line: {
    platform: "line",
    displayName: "LINE",
    deliveryMode: "planned",
    supportsArticle: false,
    supportsNews: false,
    supportsConnectionTest: false,
    summaryZh: "目前仅保留规划位。",
    summaryEn: "Planned only for now.",
  },
  instagram: {
    platform: "instagram",
    displayName: "Instagram",
    deliveryMode: "planned",
    supportsArticle: false,
    supportsNews: false,
    supportsConnectionTest: false,
    summaryZh: "目前仅保留规划位，需要图像流支持后再接入。",
    summaryEn: "Planned only for now. Requires an image-first workflow.",
  },
  facebook: {
    platform: "facebook",
    displayName: "Facebook",
    deliveryMode: "planned",
    supportsArticle: false,
    supportsNews: false,
    supportsConnectionTest: false,
    summaryZh: "目前仅保留规划位。",
    summaryEn: "Planned only for now.",
  },
};

const DRAFT_TARGETS: Record<
  MediaDraftTarget,
  { displayName: string; publishUrl: string }
> = {
  medium: {
    displayName: "Medium",
    publishUrl: "https://medium.com/new-story",
  },
  mirror: {
    displayName: "Mirror / Paragraph",
    publishUrl: "https://paragraph.xyz/",
  },
  reddit: {
    displayName: "Reddit",
    publishUrl: "https://www.reddit.com/submit",
  },
  zhihu: {
    displayName: "知乎专栏",
    publishUrl: "https://zhuanlan.zhihu.com/write",
  },
  wechat: {
    displayName: "微信公众号",
    publishUrl: "https://mp.weixin.qq.com/",
  },
  twitter: {
    displayName: "Twitter/X",
    publishUrl: "https://x.com/compose/post",
  },
};

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function countWords(text: string): number {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
}

function resolveArticleUrl(article: ArticleLike): string {
  return `https://get8.pro/article/${article.slug}`;
}

function buildDisclosureBlock(articleUrl: string): string {
  return [
    "",
    "Disclosure:",
    "This draft is adapted from Get8 Pro.",
    "Some pages on the site include partner-related entry points, so limitations and disclosures should remain visible when publishing externally.",
    `Original reference: ${articleUrl}`,
  ].join("\n");
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function getArticleSummary(article: ArticleLike): string {
  const fallback = stripMarkdown(article.content).slice(0, 220);
  return truncate(
    article.excerpt?.trim() || article.metaDescription?.trim() || fallback,
    220,
  );
}

export function getPlatformCapability(platform: string): PlatformCapability {
  return (
    PLATFORM_CAPABILITIES[platform] ?? {
      platform,
      displayName: platform,
      deliveryMode: "planned",
      supportsArticle: false,
      supportsNews: false,
      supportsConnectionTest: false,
      summaryZh: "未定义的平台能力。",
      summaryEn: "No capability metadata defined.",
    }
  );
}

export function listPlatformCapabilities(): PlatformCapability[] {
  return Object.values(PLATFORM_CAPABILITIES);
}

export function buildArticleDraftPackages(article: ArticleLike): MediaDraftPackage[] {
  const articleUrl = resolveArticleUrl(article);
  const summary = getArticleSummary(article);
  const plainContent = stripMarkdown(article.content);
  const title = article.metaTitle?.trim() || article.title.trim();
  const subtitle = summary;
  const externalFooter = buildDisclosureBlock(articleUrl);
  const publishDate = article.publishedAt ?? article.updatedAt ?? new Date();
  const baseNotes = [
    `Author: ${article.author || "Get8 Pro"}`,
    `Category: ${article.category}`,
    `Last updated: ${publishDate.toISOString().slice(0, 10)}`,
  ];

  const mediumBody = [
    subtitle,
    "",
    article.content.trim(),
    externalFooter,
  ].join("\n");

  const mirrorBody = [
    subtitle,
    "",
    article.content.trim(),
    "",
    "Why this version works on Mirror / Paragraph:",
    "- Keeps the structure close to a research post.",
    "- Leaves disclosures visible instead of hiding them at the end.",
    "- Preserves the original reference for readers who want the full context.",
    externalFooter,
  ].join("\n");

  const redditBody = [
    "I have been refining this piece as part of a Web3 research and navigation project.",
    "",
    "Short summary:",
    summary,
    "",
    "Key points:",
    ...plainContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, 5)
      .map((line) => `- ${truncate(line, 180)}`),
    "",
    "If people want the full version, the original article is here:",
    articleUrl,
    "",
    "I am sharing this mainly to collect feedback on the structure, clarity, and trust signals.",
  ].join("\n");

  const zhihuBody = [
    summary,
    "",
    article.content.trim(),
    "",
    "说明：",
    "这篇内容整理自 Get8 Pro。若对外发布，建议保留来源说明、更新时间与限制条件，避免被理解成纯营销导流。",
    `原文参考：${articleUrl}`,
  ].join("\n");

  const wechatBody = [
    summary,
    "",
    article.content.trim(),
    "",
    "发布前检查：",
    "1. 补充封面图与导语。",
    "2. 保留限制说明和来源。",
    "3. 检查是否需要去掉过强的平台导流表达。",
    `原文参考：${articleUrl}`,
  ].join("\n");

  const twitterBody = [
    `${truncate(title, 90)}`,
    "",
    `1/${Math.min(5, 5)} ${truncate(summary, 240)}`,
    `2/5 ${truncate(plainContent.replace(/\n+/g, " "), 240)}`,
    `3/5 ${truncate("This piece is part of a Web3 research and navigation project focused on clearer onboarding, disclosures, and platform guidance.", 240)}`,
    `4/5 ${truncate("If published externally, the key thing is to keep limitations and disclosures visible instead of hiding them below the fold.", 240)}`,
    `5/5 Full reference: ${articleUrl}`,
  ].join("\n");

  return [
    {
      platform: "medium",
      displayName: DRAFT_TARGETS.medium.displayName,
      publishUrl: DRAFT_TARGETS.medium.publishUrl,
      title,
      summary,
      body: mediumBody,
      notes: [...baseNotes, "Best for long-form research-style publishing."],
      wordCount: countWords(mediumBody),
    },
    {
      platform: "mirror",
      displayName: DRAFT_TARGETS.mirror.displayName,
      publishUrl: DRAFT_TARGETS.mirror.publishUrl,
      title,
      summary,
      body: mirrorBody,
      notes: [...baseNotes, "Best for Web3-native editorial distribution."],
      wordCount: countWords(mirrorBody),
    },
    {
      platform: "reddit",
      displayName: DRAFT_TARGETS.reddit.displayName,
      publishUrl: DRAFT_TARGETS.reddit.publishUrl,
      title: truncate(title, 300),
      summary,
      body: redditBody,
      notes: [...baseNotes, "Use in profile posts or feedback-friendly communities."],
      wordCount: countWords(redditBody),
    },
    {
      platform: "zhihu",
      displayName: DRAFT_TARGETS.zhihu.displayName,
      publishUrl: DRAFT_TARGETS.zhihu.publishUrl,
      title,
      summary,
      body: zhihuBody,
      notes: [...baseNotes, "适合整理成长文专栏稿。"],
      wordCount: countWords(zhihuBody),
    },
    {
      platform: "wechat",
      displayName: DRAFT_TARGETS.wechat.displayName,
      publishUrl: DRAFT_TARGETS.wechat.publishUrl,
      title,
      summary,
      body: wechatBody,
      notes: [...baseNotes, "适合先做公众号图文草稿，再补封面与摘要。"],
      wordCount: countWords(wechatBody),
    },
    {
      platform: "twitter",
      displayName: DRAFT_TARGETS.twitter.displayName,
      publishUrl: DRAFT_TARGETS.twitter.publishUrl,
      title: truncate(title, 110),
      summary,
      body: twitterBody,
      notes: [...baseNotes, "当前按线程草稿输出，更适合手动审一遍后发。"],
      wordCount: countWords(twitterBody),
    },
  ];
}

export function buildNewsDraftPackages(news: NewsLike): MediaDraftPackage[] {
  const sourceLine = news.source ? `Source: ${news.source}` : "Source: Get8 Pro";
  const referenceLine = news.url ? `Reference: ${news.url}` : "Reference: https://get8.pro/crypto-news";
  const summary = truncate(news.summary?.trim() || news.title.trim(), 180);
  const publishDate = news.publishedAt ?? new Date();

  const redditBody = [
    news.title,
    "",
    summary,
    "",
    sourceLine,
    referenceLine,
    "",
    "Posting this here as a concise market update. If anyone has more context, feel free to add it.",
  ].join("\n");

  const twitterBody = [
    truncate(news.title, 240),
    "",
    truncate(summary, 240),
    "",
    sourceLine,
    referenceLine,
  ].join("\n");

  const zhihuBody = [
    news.title,
    "",
    summary,
    "",
    `发布时间：${publishDate.toISOString().slice(0, 10)}`,
    `来源：${news.source || "Get8 Pro"}`,
    `原文链接：${news.url || "https://get8.pro/crypto-news"}`,
  ].join("\n");

  return [
    {
      platform: "reddit",
      displayName: DRAFT_TARGETS.reddit.displayName,
      publishUrl: DRAFT_TARGETS.reddit.publishUrl,
      title: truncate(news.title, 300),
      summary,
      body: redditBody,
      notes: [`Category: ${news.category}`, `Published: ${publishDate.toISOString().slice(0, 10)}`],
      wordCount: countWords(redditBody),
    },
    {
      platform: "twitter",
      displayName: DRAFT_TARGETS.twitter.displayName,
      publishUrl: DRAFT_TARGETS.twitter.publishUrl,
      title: truncate(news.title, 110),
      summary,
      body: twitterBody,
      notes: [`Category: ${news.category}`, "Best for short-form update channels."],
      wordCount: countWords(twitterBody),
    },
    {
      platform: "zhihu",
      displayName: DRAFT_TARGETS.zhihu.displayName,
      publishUrl: DRAFT_TARGETS.zhihu.publishUrl,
      title: news.title,
      summary,
      body: zhihuBody,
      notes: [`Category: ${news.category}`, "适合整理成快讯简报。"],
      wordCount: countWords(zhihuBody),
    },
  ];
}
