/**
 * ArticleList.tsx
 * 文章列表页 — SEO 优化版
 * 路由: /articles
 */
import { useState } from "react";
import { Link } from "wouter";
import { SeoManager } from "@/components/SeoManager";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { BookOpen, TrendingUp, Shield, Lightbulb, Clock, Eye, ChevronRight, Search } from "lucide-react";

const CATEGORY_MAP: Record<string, { zh: string; en: string; icon: React.ReactNode; color: string }> = {
  analysis:      { zh: "市场分析", en: "Analysis",       icon: <TrendingUp className="w-3.5 h-3.5" />, color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  tutorial:      { zh: "使用教程", en: "Tutorial",       icon: <BookOpen className="w-3.5 h-3.5" />,   color: "bg-green-500/20 text-green-300 border-green-500/30" },
  news_decode:   { zh: "新闻解读", en: "News Decode",    icon: <Lightbulb className="w-3.5 h-3.5" />,  color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  project:       { zh: "项目介绍", en: "Project",        icon: <Shield className="w-3.5 h-3.5" />,     color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  exchange_guide:{ zh: "交易所指南", en: "Exchange Guide",icon: <Shield className="w-3.5 h-3.5" />,   color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  rebate_guide:  { zh: "返佣攻略", en: "Rebate Guide",   icon: <TrendingUp className="w-3.5 h-3.5" />, color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  beginner:      { zh: "新手入门", en: "Beginner",       icon: <BookOpen className="w-3.5 h-3.5" />,   color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  education:     { zh: "知识科普", en: "Education",      icon: <Lightbulb className="w-3.5 h-3.5" />,  color: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
  report:        { zh: "行业报告", en: "Report",         icon: <TrendingUp className="w-3.5 h-3.5" />, color: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
};

const ALL_CATEGORIES = [
  { key: "all", zh: "全部", en: "All" },
  { key: "exchange_guide", zh: "交易所指南", en: "Exchange Guide" },
  { key: "rebate_guide", zh: "返佣攻略", en: "Rebate Guide" },
  { key: "beginner", zh: "新手入门", en: "Beginner" },
  { key: "education", zh: "知识科普", en: "Education" },
  { key: "tutorial", zh: "使用教程", en: "Tutorial" },
  { key: "analysis", zh: "市场分析", en: "Analysis" },
];

function formatDate(dateStr: string | Date | null | undefined) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function estimateReadTime(content: string) {
  const words = content.length / 2; // 中文每字约 2 字符
  const minutes = Math.ceil(words / 400);
  return Math.max(3, minutes);
}

export default function ArticleList() {
  const { language } = useLanguage();
  const zh = language === "zh";
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = trpc.articles.list.useQuery({
    limit: 50,
  });

  const articles = Array.isArray(data) ? data : [];

  // 过滤
  const filtered = articles.filter(a => {
    const matchCat = activeCategory === "all" || a.category === activeCategory;
    const matchSearch = !searchQuery || 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.excerpt ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.tags ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>
      <SeoManager
        title={zh ? "加密货币深度文章 — 交易所评测、返佣攻略、Web3教程 | Get8 Pro" : "Crypto Deep Dive Articles — Exchange Reviews, Rebate Guides, Web3 Tutorials | Get8 Pro"}
        description={zh
          ? "Get8 Pro 专业内容中心：交易所手续费对比、返佣攻略、合约交易教程、Web3入门指南。由专业团队撰写，数据真实可靠。"
          : "Get8 Pro professional content hub: exchange fee comparisons, rebate guides, futures trading tutorials, Web3 beginner guides. Written by professionals with verified data."}
        path="/articles"
        keywords={zh
          ? "加密货币文章,交易所评测,返佣攻略,合约教程,Web3入门,币圈知识"
          : "crypto articles,exchange review,rebate guide,futures tutorial,Web3 beginner,crypto knowledge"}
      />

      <div className="min-h-screen bg-[#050D1A] text-white">
        {/* ── 顶部导航 ── */}
        <div className="border-b border-white/10 bg-[#050D1A]/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3 text-sm">
            <Link href="/" className="text-slate-400 hover:text-white transition">Get8 Pro</Link>
            <span className="text-slate-600">/</span>
            <span className="text-white font-semibold">{zh ? "文章中心" : "Articles"}</span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10">
          {/* ── Hero ── */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-medium mb-4">
              <BookOpen className="w-3.5 h-3.5" />
              {zh ? "专业内容中心" : "Professional Content Hub"}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
              {zh ? "加密货币深度文章" : "Crypto Deep Dive Articles"}
            </h1>
            <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
              {zh
                ? "交易所评测、返佣攻略、合约教程、Web3入门——由专业团队撰写，数据真实可靠。"
                : "Exchange reviews, rebate guides, futures tutorials, Web3 beginner content — written by professionals with verified data."}
            </p>
          </div>

          {/* ── 搜索框 ── */}
          <div className="relative mb-6 max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={zh ? "搜索文章..." : "Search articles..."}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition"
            />
          </div>

          {/* ── 分类过滤 ── */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {ALL_CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  activeCategory === cat.key
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                    : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                {zh ? cat.zh : cat.en}
              </button>
            ))}
          </div>

          {/* ── 文章列表 ── */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 animate-pulse">
                  <div className="h-4 bg-white/10 rounded mb-3 w-3/4" />
                  <div className="h-3 bg-white/10 rounded mb-2" />
                  <div className="h-3 bg-white/10 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{zh ? "暂无文章" : "No articles found"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(article => {
                const catInfo = CATEGORY_MAP[article.category] ?? CATEGORY_MAP.analysis;
                const readTime = estimateReadTime(article.content);
                return (
                  <Link key={article.id} href={`/article/${article.slug}`} className="tap-target block h-full">
                    <article className="group bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/8 hover:border-white/20 transition h-full flex flex-col">
                      {/* 分类标签 */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${catInfo.color}`}>
                          {catInfo.icon}
                          {zh ? catInfo.zh : catInfo.en}
                        </span>
                        {article.isPinned && (
                          <span className="text-xs text-yellow-400 border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                            {zh ? "置顶" : "Pinned"}
                          </span>
                        )}
                      </div>

                      {/* 标题 */}
                      <h2 className="font-bold text-white text-sm leading-snug mb-2 group-hover:text-blue-300 transition line-clamp-2 flex-1">
                        {article.title}
                      </h2>

                      {/* 摘要 */}
                      {article.excerpt && (
                        <p className="text-slate-400 text-xs leading-relaxed mb-3 line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}

                      {/* 底部信息 */}
                      <div className="flex items-center justify-between text-xs text-slate-500 mt-auto pt-3 border-t border-white/5">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {readTime}{zh ? "分钟" : "min"}
                          </span>
                          {article.viewCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {article.viewCount}
                            </span>
                          )}
                        </div>
                        <span>{formatDate(article.publishedAt ?? article.createdAt)}</span>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}

          {/* ── 底部导航 ── */}
          <div className="mt-12 border-t border-white/10 pt-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/exchanges" className="tap-target block">
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition">
                  <div>
                    <div className="font-semibold text-white text-sm">{zh ? "交易所对比" : "Exchange Comparison"}</div>
                    <div className="text-xs text-slate-400">{zh ? "5大交易所费率对比" : "5 major exchange fee comparison"}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </Link>
              <Link href="/crypto-saving" className="tap-target block">
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition">
                  <div>
                    <div className="font-semibold text-white text-sm">{zh ? "返佣指南" : "Rebate Guide"}</div>
                    <div className="text-xs text-slate-400">{zh ? "最高60%手续费返佣" : "Up to 60% fee rebate"}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </Link>
              <Link href="/web3-guide" className="tap-target block">
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition">
                  <div>
                    <div className="font-semibold text-white text-sm">{zh ? "Web3 教程" : "Web3 Guide"}</div>
                    <div className="text-xs text-slate-400">{zh ? "从零入门 Web3 世界" : "Start your Web3 journey"}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
