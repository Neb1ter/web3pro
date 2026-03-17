import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { useScrollMemory, goBack } from "@/hooks/useScrollMemory";
import { trpc } from "@/lib/trpc";
import { preloadRoute } from "@/lib/routePreload";

// ─── Types ────────────────────────────────────────────────────────────────────
type NewsView = "flash" | "articles";

const NEWS_CATEGORY_LABELS: Record<string, { zh: string; en: string; color: string }> = {
  market:   { zh: "行情",   en: "Market",   color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  policy:   { zh: "政策",   en: "Policy",   color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  exchange: { zh: "交易所", en: "Exchange", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  defi:     { zh: "DeFi",   en: "DeFi",     color: "bg-green-500/20 text-green-300 border-green-500/30" },
  nft:      { zh: "NFT",    en: "NFT",      color: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
  other:    { zh: "其他",   en: "Other",    color: "bg-gray-500/20 text-gray-300 border-gray-500/30" },
};

const ARTICLE_CATEGORY_LABELS: Record<string, { zh: string; en: string; color: string }> = {
  analysis:    { zh: "市场分析", en: "Analysis",    color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  tutorial:    { zh: "使用教程", en: "Tutorial",    color: "bg-green-500/20 text-green-300 border-green-500/30" },
  news_decode: { zh: "新闻解读", en: "News Decode", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  project:     { zh: "项目介绍", en: "Project",     color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  promo:       { zh: "宣传推广", en: "Promo",       color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  report:      { zh: "行业报告", en: "Report",      color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
};

const FLASH_FILTERS = ["all", "market", "policy", "exchange", "defi", "other"] as const;
type FlashFilter = typeof FLASH_FILTERS[number];

function formatTime(date: Date | string, lang: string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (lang === "zh") {
    if (diffMin < 1) return "刚刚";
    if (diffMin < 60) return `${diffMin} 分钟前`;
    if (diffHr < 24) return `${diffHr} 小时前`;
    if (diffDay < 7) return `${diffDay} 天前`;
    return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  } else {
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

function formatDate(date: Date | string, lang: string): string {
  const d = new Date(date);
  if (lang === "zh") return d.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

// ─── Flash News (实时快讯) ─────────────────────────────────────────────────────
function FlashNewsPanel({ zh, language }: { zh: boolean; language: string }) {
  const [activeFilter, setActiveFilter] = useState<FlashFilter>("all");
  const { data: newsItems = [], isLoading, isError } = trpc.news.list.useQuery({ limit: 100 });

  const filtered = activeFilter === "all" ? newsItems : newsItems.filter(n => n.category === activeFilter);

  const grouped: Record<string, typeof newsItems> = {};
  for (const item of filtered) {
    const dateKey = formatDate(item.publishedAt, language);
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(item);
  }
  const dateGroups = Object.entries(grouped);

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {FLASH_FILTERS.map(cat => {
          const label = cat === "all"
            ? (zh ? "全部" : "All")
            : (zh ? NEWS_CATEGORY_LABELS[cat]?.zh : NEWS_CATEGORY_LABELS[cat]?.en) ?? cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                activeFilter === cat
                  ? "bg-yellow-500 text-gray-900 border-yellow-500"
                  : "bg-transparent text-gray-400 border-gray-600 hover:border-yellow-500/50 hover:text-yellow-400"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="px-3 py-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 flex items-start gap-2">
        <span className="text-yellow-400 text-sm mt-0.5 flex-shrink-0">⚠️</span>
        <p className="text-xs text-gray-400 leading-relaxed">
          {zh
            ? "资讯来源于多家专业媒体，仅供参考，不构成投资建议。"
            : "News from professional media. For reference only, not investment advice."}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-3 bg-gray-700 rounded w-24 mb-2" />
              <div className="h-14 bg-gray-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-sm">{zh ? "资讯加载失败，请刷新重试" : "Failed to load news, please refresh"}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-sm">{zh ? "暂无相关资讯" : "No news found"}</p>
          <p className="text-xs mt-1 text-gray-600">{zh ? "RSS 抓取每 30 分钟更新一次" : "RSS updates every 30 minutes"}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {dateGroups.map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-yellow-500/30" />
                <span className="text-xs font-semibold text-yellow-500/80 px-2 py-0.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 flex-shrink-0">
                  {dateLabel}
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-yellow-500/30" />
              </div>
              <div className="relative pl-5 space-y-3">
                <div className="absolute left-1.5 top-2 bottom-2 w-px bg-gradient-to-b from-yellow-500/40 via-yellow-500/20 to-transparent" />
                {items.map(item => {
                  const catInfo = NEWS_CATEGORY_LABELS[item.category] ?? NEWS_CATEGORY_LABELS.other;
                  const catLabel = zh ? catInfo.zh : catInfo.en;
                  return (
                    <div key={item.id} className="relative group">
                      <div className={`absolute -left-5 top-3 w-2.5 h-2.5 rounded-full border-2 transition-transform group-hover:scale-125 ${
                        item.isPinned
                          ? "bg-yellow-400 border-yellow-400 shadow-[0_0_8px_rgba(255,215,0,0.6)]"
                          : "bg-gray-700 border-yellow-500/50 group-hover:bg-yellow-500/60"
                      }`} />
                      <div className={`rounded-xl border transition-all duration-200 group-hover:border-yellow-500/40 group-hover:shadow-[0_0_20px_rgba(255,215,0,0.06)] ${
                        item.isPinned ? "border-yellow-500/40 bg-yellow-500/5" : "border-gray-700/60 bg-gray-800/40"
                      }`}>
                        <div className="p-3 sm:p-3.5">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${catInfo.color}`}>{catLabel}</span>
                            {item.isPinned && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">📌</span>}
                            <span className="text-xs text-gray-500 ml-auto">{formatTime(item.publishedAt, language)}</span>
                          </div>
                          <h3 className="text-sm font-semibold text-gray-100 leading-snug mb-1 group-hover:text-yellow-300 transition-colors">
                            {item.title}
                          </h3>
                          {item.summary && (
                            <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{item.summary}</p>
                          )}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700/50">
                            <span className="text-xs text-gray-500">📰 {item.source ?? (zh ? "加密新闻" : "Crypto News")}</span>
                            {item.url && (
                              <a href={item.url} target="_blank" rel="noopener noreferrer"
                                className="text-xs font-bold text-yellow-500 hover:text-yellow-400 transition-colors flex items-center gap-1">
                                {zh ? "原文" : "Read"} ↗
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

// ─── Articles Panel (深度文章) ─────────────────────────────────────────────────
function ArticlesPanel({ zh }: { zh: boolean }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const { data: articles = [], isLoading } = trpc.articles.list.useQuery({ limit: 20, offset: 0 });

  const categories = ["all", ...Object.keys(ARTICLE_CATEGORY_LABELS)];
  const filtered = activeCategory === "all" ? articles : articles.filter((a: { category: string }) => a.category === activeCategory);

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map(cat => {
          const label = cat === "all"
            ? (zh ? "全部" : "All")
            : (zh ? ARTICLE_CATEGORY_LABELS[cat]?.zh : ARTICLE_CATEGORY_LABELS[cat]?.en) ?? cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                activeCategory === cat
                  ? "bg-cyan-500 text-gray-900 border-cyan-500"
                  : "bg-transparent text-gray-400 border-gray-600 hover:border-cyan-500/50 hover:text-cyan-400"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse h-28 bg-gray-800 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-sm">{zh ? "暂无文章" : "No articles yet"}</p>
          <p className="text-xs mt-1 text-gray-600">{zh ? "专业深度文章即将发布" : "Professional articles coming soon"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((article: {
            id: number; slug: string; title: string; excerpt?: string | null;
            category: string; author: string; viewCount?: number | null;
            publishedAt?: string | null; isAiGenerated?: boolean | null;
            coverImage?: string | null; tags?: string | null;
          }, index: number) => {
            const catInfo = ARTICLE_CATEGORY_LABELS[article.category] ?? ARTICLE_CATEGORY_LABELS.analysis;
            const catLabel = zh ? catInfo.zh : catInfo.en;
            const tags = article.tags ? article.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
            return (
              <Link key={article.id} href={`/article/${article.slug}`} className="tap-target block">
                <div className="group rounded-xl border border-gray-700/60 bg-gray-800/40 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.06)] transition-all duration-200 overflow-hidden">
                  {article.coverImage && (
                    <div className="h-36 overflow-hidden">
                      <img
                        src={article.coverImage}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading={index < 2 ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={index === 0 ? "high" : "auto"}
                        sizes="(max-width: 768px) 100vw, 480px"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${catInfo.color}`}>{catLabel}</span>
                      {article.isAiGenerated && <span className="text-xs text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded-full border border-purple-500/30">🤖 AI</span>}
                      {tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs text-gray-500 bg-gray-700/40 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-100 leading-snug mb-1.5 group-hover:text-cyan-300 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-2">{article.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>✍️ {article.author}</span>
                      <div className="flex items-center gap-3">
                        <span>👁 {article.viewCount ?? 0}</span>
                        {article.publishedAt && <span>{formatTime(article.publishedAt, zh ? "zh" : "en")}</span>}
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CryptoNews() {
  const { language } = useLanguage();
  const zh = language === "zh";
  useScrollMemory();
  const [activeView, setActiveView] = useState<NewsView>("flash");

  // SEO meta tags
  useEffect(() => {
    document.title = zh ? "币圈资讯中心 - 实时快讯与深度文章 | Get8 Pro" : "Crypto News Hub - Flash News & In-Depth Articles | Get8 Pro";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", zh
        ? "Get8 Pro 币圈资讯中心：汇聚多家专业媒体实时快讯，提供市场分析、新闻解读、DeFi教程等深度文章，助您掌握 Web3 最新动态。"
        : "Get8 Pro Crypto News Hub: Real-time flash news from top media, plus in-depth analysis, DeFi tutorials, and Web3 insights.");
    }
    // Open Graph
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", zh ? "币圈资讯中心 | Get8 Pro" : "Crypto News Hub | Get8 Pro");
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", zh ? "实时快讯 + 深度文章，掌握 Web3 最新动态" : "Flash news + in-depth articles for Web3");
  }, [zh]);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0A192F 0%, #0d2137 50%, #0A192F 100%)" }}>
      {/* SEO structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": zh ? "币圈资讯中心 - Get8 Pro" : "Crypto News Hub - Get8 Pro",
        "description": zh ? "汇聚多家专业媒体实时快讯，提供市场分析、新闻解读等深度文章" : "Real-time crypto news and in-depth articles",
        "url": "https://get8.pro/crypto-news",
        "publisher": { "@type": "Organization", "name": "Get8 Pro", "url": "https://get8.pro" }
      })}} />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-yellow-500/20 backdrop-blur-md" style={{ background: "rgba(10,25,47,0.92)" }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-yellow-400 transition-colors">
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">{zh ? "返回" : "Back"}</span>
          </button>
          <h1 className="text-base sm:text-lg font-bold text-yellow-400 flex items-center gap-2">
            <span>📡</span>
            <span>{zh ? "币圈资讯中心" : "Crypto News Hub"}</span>
          </h1>
          <div className="text-xs text-gray-500 hidden sm:block">
            {zh ? "实时快讯 · 深度文章" : "Flash News · Articles"}
          </div>
        </div>

        {/* View switcher */}
        <div className="max-w-5xl mx-auto px-4 pb-2 flex gap-1">
          <button
            onClick={() => setActiveView("flash")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeView === "flash"
                ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            ⚡ {zh ? "实时快讯" : "Flash News"}
          </button>
          <button
            onClick={() => setActiveView("articles")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeView === "articles"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            📖 {zh ? "深度文章" : "Articles"}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {activeView === "flash" ? (
          <FlashNewsPanel zh={zh} language={language} />
        ) : (
          <ArticlesPanel zh={zh} />
        )}

        {/* Bottom CTA */}
        <div className="mt-12 p-6 rounded-2xl border border-gray-700 bg-gray-800/30 text-center">
          <h4 className="text-gray-200 font-bold mb-2">{zh ? "想要更低的手续费？" : "Want lower fees?"}</h4>
          <p className="text-xs text-gray-500 mb-4">
            {zh ? "使用我们的邀请码注册交易所，享受永久手续费返佣。" : "Register with our referral codes for lifetime fee rebates."}
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

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-8 border-t border-gray-800/50 text-center">
        <p className="text-xs text-gray-600">
          © 2026 Get8 Pro · {zh ? "专业 Web3 导航与资讯" : "Professional Web3 Navigator & News"}
        </p>
      </footer>
    </div>
  );
}
