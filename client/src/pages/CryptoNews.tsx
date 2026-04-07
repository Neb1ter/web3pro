import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { goBack, useScrollMemory } from "@/hooks/useScrollMemory";
import { preloadRoute } from "@/lib/routePreload";
import { trpc } from "@/lib/trpc";
import { ZoomableImage } from "@/components/ZoomableImage";

type NewsView = "flash" | "articles";
type FlashFilter = "all" | "market" | "policy" | "exchange" | "defi" | "other";

type FlashNewsItem = {
  id: number;
  title: string;
  summary?: string | null;
  category: string;
  publishedAt: string | Date;
  source?: string | null;
  url?: string | null;
  isPinned?: boolean | null;
};

type ArticleItem = {
  id: number;
  slug: string;
  title: string;
  excerpt?: string | null;
  category: string;
  author: string;
  viewCount?: number | null;
  publishedAt?: string | null;
  isAiGenerated?: boolean | null;
  coverImage?: string | null;
  tags?: string | null;
};

const FLASH_FILTERS: FlashFilter[] = ["all", "market", "policy", "exchange", "defi", "other"];

const FLASH_CATEGORY_LABELS: Record<string, { zh: string; en: string; color: string }> = {
  market: {
    zh: "行情",
    en: "Market",
    color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  },
  policy: {
    zh: "政策",
    en: "Policy",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  exchange: {
    zh: "交易所",
    en: "Exchange",
    color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  defi: {
    zh: "DeFi",
    en: "DeFi",
    color: "bg-green-500/20 text-green-300 border-green-500/30",
  },
  other: {
    zh: "其他",
    en: "Other",
    color: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  },
};

const ARTICLE_CATEGORY_LABELS: Record<string, { zh: string; en: string; color: string }> = {
  analysis: {
    zh: "市场分析",
    en: "Analysis",
    color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  },
  tutorial: {
    zh: "使用教程",
    en: "Tutorial",
    color: "bg-green-500/20 text-green-300 border-green-500/30",
  },
  news_decode: {
    zh: "新闻解读",
    en: "News Decode",
    color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  },
  project: {
    zh: "项目介绍",
    en: "Project",
    color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  promo: {
    zh: "平台说明",
    en: "Platform Note",
    color: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  },
  report: {
    zh: "行业报告",
    en: "Report",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
};

function formatRelativeTime(date: Date | string, lang: "zh" | "en") {
  const target = new Date(date);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - target.getTime()) / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (lang === "zh") {
    if (diffMinutes < 1) return "刚刚";
    if (diffMinutes < 60) return `${diffMinutes} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return target.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  }

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return target.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateLabel(date: Date | string, lang: "zh" | "en") {
  const target = new Date(date);
  if (lang === "zh") {
    return target.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
  }
  return target.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function FlashNewsPanel({ zh }: { zh: boolean }) {
  const language = zh ? "zh" : "en";
  const [activeFilter, setActiveFilter] = useState<FlashFilter>("all");
  const { data: newsItems = [], isLoading, isError } = trpc.news.list.useQuery(
    { limit: 100 },
    {
      staleTime: 60_000,
      refetchInterval: 60_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  );

  const filteredItems = activeFilter === "all"
    ? newsItems
    : newsItems.filter((item: FlashNewsItem) => item.category === activeFilter);

  const groupedItems = useMemo(() => {
    const grouped = new Map<string, FlashNewsItem[]>();
    filteredItems.forEach((item: FlashNewsItem) => {
      const dateKey = formatDateLabel(item.publishedAt, language);
      const list = grouped.get(dateKey) ?? [];
      list.push(item);
      grouped.set(dateKey, list);
    });
    return Array.from(grouped.entries());
  }, [filteredItems, language]);

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {FLASH_FILTERS.map((filter) => {
          const label = filter === "all"
            ? (zh ? "全部" : "All")
            : (zh ? FLASH_CATEGORY_LABELS[filter].zh : FLASH_CATEGORY_LABELS[filter].en);
          const isActive = activeFilter === filter;

          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`flex-shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                isActive
                  ? "border-yellow-500 bg-yellow-500 text-gray-900"
                  : "border-gray-600 bg-transparent text-gray-400 hover:border-yellow-500/50 hover:text-yellow-400"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
        <span className="mt-0.5 flex-shrink-0 text-sm text-yellow-400">⚠</span>
        <p className="text-xs leading-relaxed text-gray-400">
          {zh
            ? "快讯内容来自多家专业媒体与公开公告，仅供参考，不构成投资建议。"
            : "News items are collected from professional media and public announcements for reference only, not investment advice."}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="mb-2 h-3 w-24 rounded bg-gray-700" />
              <div className="h-14 rounded-xl bg-gray-800" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="py-12 text-center text-gray-500">
          <div className="mb-3 text-4xl">⚠</div>
          <p className="text-sm">{zh ? "快讯加载失败，请稍后刷新重试。" : "Failed to load flash news. Please refresh and try again."}</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <div className="mb-3 text-4xl">📰</div>
          <p className="text-sm">{zh ? "当前没有符合条件的快讯。" : "No matching flash news yet."}</p>
          <p className="mt-1 text-xs text-gray-600">{zh ? "系统会定期同步最新资讯。" : "Fresh updates will appear here as they arrive."}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedItems.map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <div className="mb-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-yellow-500/30" />
                <span className="flex-shrink-0 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-xs font-semibold text-yellow-500/80">
                  {dateLabel}
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-yellow-500/30" />
              </div>

              <div className="relative space-y-3 pl-5">
                <div className="absolute bottom-2 left-1.5 top-2 w-px bg-gradient-to-b from-yellow-500/40 via-yellow-500/20 to-transparent" />
                {items.map((item) => {
                  const categoryInfo = FLASH_CATEGORY_LABELS[item.category] ?? FLASH_CATEGORY_LABELS.other;
                  return (
                    <div key={item.id} className="group relative">
                      <div
                        className={`absolute -left-5 top-3 h-2.5 w-2.5 rounded-full border-2 transition-transform group-hover:scale-125 ${
                          item.isPinned
                            ? "border-yellow-400 bg-yellow-400 shadow-[0_0_8px_rgba(255,215,0,0.6)]"
                            : "border-yellow-500/50 bg-gray-700 group-hover:bg-yellow-500/60"
                        }`}
                      />

                      <div
                        className={`rounded-xl border transition-all duration-200 group-hover:border-yellow-500/40 group-hover:shadow-[0_0_20px_rgba(255,215,0,0.06)] ${
                          item.isPinned ? "border-yellow-500/40 bg-yellow-500/5" : "border-gray-700/60 bg-gray-800/40"
                        }`}
                      >
                        <div className="p-3 sm:p-3.5">
                          <div className="mb-1.5 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${categoryInfo.color}`}>
                              {zh ? categoryInfo.zh : categoryInfo.en}
                            </span>
                            {item.isPinned && (
                              <span className="rounded-full border border-yellow-500/30 bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-300">
                                {zh ? "置顶" : "Pinned"}
                              </span>
                            )}
                            <span className="ml-auto text-xs text-gray-500">
                              {formatRelativeTime(item.publishedAt, language)}
                            </span>
                          </div>

                          <h3 className="mb-1 text-sm font-semibold leading-snug text-gray-100 transition-colors group-hover:text-yellow-300">
                            {item.title}
                          </h3>

                          {item.summary && (
                            <p className="line-clamp-2 text-xs leading-relaxed text-gray-400">{item.summary}</p>
                          )}

                          <div className="mt-2 flex items-center justify-between border-t border-gray-700/50 pt-2">
                            <span className="text-xs text-gray-500">
                              {zh ? "来源：" : "Source: "}
                              {item.source ?? (zh ? "加密资讯" : "Crypto Source")}
                            </span>
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-bold text-yellow-500 transition-colors hover:text-yellow-400"
                              >
                                {zh ? "查看原文" : "Read source"} →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ArticlesPanel({ zh }: { zh: boolean }) {
  const language = zh ? "zh" : "en";
  const [activeCategory, setActiveCategory] = useState("all");
  const { data: articles = [], isLoading } = trpc.articles.list.useQuery(
    { limit: 20, offset: 0 },
    {
      staleTime: 120_000,
      refetchInterval: 120_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  );

  const categories = useMemo(() => ["all", ...Object.keys(ARTICLE_CATEGORY_LABELS)], []);
  const filteredArticles = activeCategory === "all"
    ? articles
    : articles.filter((article: ArticleItem) => article.category === activeCategory);

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((category) => {
          const label = category === "all"
            ? (zh ? "全部" : "All")
            : (zh ? ARTICLE_CATEGORY_LABELS[category].zh : ARTICLE_CATEGORY_LABELS[category].en);
          const isActive = activeCategory === category;

          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`flex-shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                isActive
                  ? "border-cyan-500 bg-cyan-500 text-gray-900"
                  : "border-gray-600 bg-transparent text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-xl bg-gray-800" />
          ))}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <div className="mb-3 text-4xl">📘</div>
          <p className="text-sm">{zh ? "当前还没有相关文章。" : "No articles available yet."}</p>
          <p className="mt-1 text-xs text-gray-600">{zh ? "新的深度内容会持续补充。" : "More long-form content will be added over time."}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((article: ArticleItem, index: number) => {
            const categoryInfo = ARTICLE_CATEGORY_LABELS[article.category] ?? ARTICLE_CATEGORY_LABELS.analysis;
            const tags = article.tags
              ? article.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
              : [];

            return (
              <Link key={article.id} href={`/article/${article.slug}`} className="tap-target block">
                <div className="group overflow-hidden rounded-xl border border-gray-700/60 bg-gray-800/40 transition-all duration-200 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.06)]">
                  {article.coverImage && (
                    <div className="h-36 overflow-hidden">
                      <ZoomableImage
                        src={article.coverImage}
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading={index < 2 ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={index === 0 ? "high" : "auto"}
                        sizes="(max-width: 768px) 100vw, 480px"
                        buttonLabel={zh ? "全屏查看资讯封面" : "View news cover fullscreen"}
                      />
                    </div>
                  )}

                  <div className="p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${categoryInfo.color}`}>
                        {zh ? categoryInfo.zh : categoryInfo.en}
                      </span>
                      {article.isAiGenerated && (
                        <span className="rounded-full border border-purple-500/30 bg-purple-900/30 px-2 py-0.5 text-xs text-purple-400">
                          AI
                        </span>
                      )}
                      {tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="rounded-full bg-gray-700/40 px-2 py-0.5 text-xs text-gray-500">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <h3 className="mb-1.5 line-clamp-2 text-sm font-bold leading-snug text-gray-100 transition-colors group-hover:text-cyan-300 sm:text-base">
                      {article.title}
                    </h3>

                    {article.excerpt && (
                      <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-gray-400">{article.excerpt}</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {zh ? "作者：" : "Author: "}
                        {article.author}
                      </span>
                      <div className="flex items-center gap-3">
                        <span>{zh ? "阅读" : "Views"} {article.viewCount ?? 0}</span>
                        {article.publishedAt && (
                          <span>{formatRelativeTime(article.publishedAt, language)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CryptoNews() {
  const { language } = useLanguage();
  const zh = language === "zh";
  const [activeView, setActiveView] = useState<NewsView>("flash");

  useScrollMemory();

  const seoTitle = zh
    ? "加密快讯中心 - 实时快讯与深度文章 | Get8 Pro"
    : "Crypto News Hub - Flash News & In-Depth Articles | Get8 Pro";
  const seoDescription = zh
    ? "Get8 Pro 汇集实时加密快讯、交易所公告、市场更新与深度文章，帮助用户更快掌握 Web3 动态。"
    : "Get8 Pro brings together flash news, exchange announcements, market updates, and in-depth articles for Web3 users.";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: zh ? "加密快讯中心 - Get8 Pro" : "Crypto News Hub - Get8 Pro",
    description: seoDescription,
    url: "https://get8.pro/crypto-news",
    publisher: {
      "@type": "Organization",
      name: "Get8 Pro",
      url: "https://get8.pro",
    },
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#0A192F_0%,#0d2137_50%,#0A192F_100%)]">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={zh ? "加密快讯中心 | Get8 Pro" : "Crypto News Hub | Get8 Pro"} />
        <meta property="og:description" content={seoDescription} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <header className="sticky top-0 z-40 border-b border-yellow-500/20 bg-[rgba(10,25,47,0.92)] backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-yellow-400"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">{zh ? "返回" : "Back"}</span>
          </button>

          <h1 className="flex items-center gap-2 text-base font-bold text-yellow-400 sm:text-lg">
            <span>🗞</span>
            <span>{zh ? "加密快讯中心" : "Crypto News Hub"}</span>
          </h1>

          <div className="hidden text-xs text-gray-500 sm:block">
            {zh ? "实时快讯 / 深度文章" : "Flash News / Articles"}
          </div>
        </div>

        <div className="mx-auto flex max-w-5xl gap-1 px-4 pb-2">
          <button
            type="button"
            onClick={() => setActiveView("flash")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
              activeView === "flash"
                ? "border border-yellow-500/40 bg-yellow-500/20 text-yellow-300"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {zh ? "实时快讯" : "Flash News"}
          </button>
          <button
            type="button"
            onClick={() => setActiveView("articles")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
              activeView === "articles"
                ? "border border-cyan-500/40 bg-cyan-500/20 text-cyan-300"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {zh ? "深度文章" : "Articles"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {activeView === "flash" ? <FlashNewsPanel zh={zh} /> : <ArticlesPanel zh={zh} />}

        <div className="mt-12 rounded-2xl border border-gray-700 bg-gray-800/30 p-6 text-center">
          <h4 className="mb-2 font-bold text-gray-200">
            {zh ? "想继续比较交易所与注册路径？" : "Want to compare exchanges and registration paths?"}
          </h4>
          <p className="mb-4 text-xs text-gray-500">
            {zh
              ? "可以继续查看交易所对比、注册与下载教程，统一了解官方链接、邀请码和注意事项。"
              : "Continue to the exchange comparison and download guide for official links, invite-code notes, and onboarding steps."}
          </p>
          <Link
            href="/exchanges"
            className="tap-target inline-block rounded-lg bg-yellow-500 px-6 py-2 text-sm font-bold text-gray-900 transition-colors hover:bg-yellow-400"
            onMouseEnter={() => preloadRoute("/exchanges")}
            onTouchStart={() => preloadRoute("/exchanges")}
          >
            {zh ? "查看交易所对比" : "Compare Exchanges"}
          </Link>
        </div>
      </main>

      <footer className="mx-auto max-w-5xl border-t border-gray-800/50 px-4 py-8 text-center">
        <p className="text-xs text-gray-600">
          © 2026 Get8 Pro · {zh ? "Web3 导航、资讯与学习资源" : "Web3 navigation, news, and learning resources"}
        </p>
      </footer>
    </div>
  );
}
