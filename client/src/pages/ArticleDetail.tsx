import { useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { goBack } from "@/hooks/useScrollMemory";
import { trpc } from "@/lib/trpc";
import { Markdown } from "@/components/Markdown";
import { preloadRoute } from "@/lib/routePreload";

const ARTICLE_CATEGORY_LABELS: Record<string, { zh: string; en: string; color: string }> = {
  analysis:    { zh: "市场分析", en: "Analysis",    color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  tutorial:    { zh: "使用教程", en: "Tutorial",    color: "bg-green-500/20 text-green-300 border-green-500/30" },
  news_decode: { zh: "新闻解读", en: "News Decode", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  project:     { zh: "项目介绍", en: "Project",     color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  promo:       { zh: "宣传推广", en: "Promo",       color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  report:      { zh: "行业报告", en: "Report",      color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
};

export default function ArticleDetail() {
  const { language } = useLanguage();
  const zh = language === "zh";
  const [, params] = useRoute("/article/:slug");
  const slug = params?.slug ?? "";

  const { data: article, isLoading, error } = trpc.articles.bySlug.useQuery({ slug }, { enabled: !!slug });

  // SEO meta tags
  useEffect(() => {
    if (!article) return;
    document.title = `${article.metaTitle || article.title} | Get8 Pro`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", article.metaDescription || article.excerpt || "");
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) metaKeywords.setAttribute("content", article.metaKeywords || article.tags || "");
    // Open Graph
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", article.metaTitle || article.title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", article.metaDescription || article.excerpt || "");
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && article.coverImage) ogImage.setAttribute("content", article.coverImage);
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", `https://get8.pro/article/${slug}`);
    const ogType = document.querySelector('meta[property="og:type"]');
    if (ogType) ogType.setAttribute("content", "article");
  }, [article, slug]);

  // JSON-LD structured data
  useEffect(() => {
    if (!article) return;
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": article.title,
      "description": article.excerpt || "",
      "image": article.coverImage || "",
      "datePublished": article.publishedAt || article.createdAt,
      "dateModified": article.updatedAt || article.createdAt,
      "author": { "@type": "Person", "name": article.author },
      "publisher": {
        "@type": "Organization",
        "name": "Get8 Pro",
        "url": "https://get8.pro",
        "logo": { "@type": "ImageObject", "url": "https://get8.pro/favicon.ico" }
      },
      "mainEntityOfPage": { "@type": "WebPage", "@id": `https://get8.pro/article/${slug}` },
      "keywords": article.tags || "",
      "articleSection": ARTICLE_CATEGORY_LABELS[article.category]?.zh || article.category,
    };
    let el = document.getElementById("article-schema");
    if (!el) {
      el = document.createElement("script");
      el.id = "article-schema";
      (el as HTMLScriptElement).type = "application/ld+json";
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(schema);
    return () => { document.getElementById("article-schema")?.remove(); };
  }, [article, slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0A192F 0%, #0d2137 50%, #0A192F 100%)" }}>
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "linear-gradient(135deg, #0A192F 0%, #0d2137 50%, #0A192F 100%)" }}>
        <div className="text-5xl">📄</div>
        <p className="text-gray-400">{zh ? "文章不存在或已下架" : "Article not found"}</p>
        <Link
          href="/crypto-news"
          className="tap-target text-cyan-400 hover:text-cyan-300 text-sm"
          onMouseEnter={() => preloadRoute("/crypto-news")}
          onTouchStart={() => preloadRoute("/crypto-news")}
        >
          ← {zh ? "返回资讯中心" : "Back to News Hub"}
        </Link>
      </div>
    );
  }

  const catInfo = ARTICLE_CATEGORY_LABELS[article.category] ?? ARTICLE_CATEGORY_LABELS.analysis;
  const catLabel = zh ? catInfo.zh : catInfo.en;
  const tags = article.tags ? article.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0A192F 0%, #0d2137 50%, #0A192F 100%)" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-cyan-500/20 backdrop-blur-md" style={{ background: "rgba(10,25,47,0.92)" }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-cyan-400 transition-colors">
            <ArrowLeft size={15} />
            <span>{zh ? "返回资讯" : "Back"}</span>
          </button>
          <Link
            href="/crypto-news"
            className="tap-target text-xs text-gray-500 hover:text-cyan-400 transition-colors"
            onMouseEnter={() => preloadRoute("/crypto-news")}
            onTouchStart={() => preloadRoute("/crypto-news")}
          >
            📡 {zh ? "资讯中心" : "News Hub"}
          </Link>
        </div>
      </header>

      {/* Article */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Cover image */}
        {article.coverImage && (
          <div className="rounded-2xl overflow-hidden mb-6 h-48 sm:h-64">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${catInfo.color}`}>{catLabel}</span>

          {tags.map((tag: string) => (
            <span key={tag} className="text-xs text-gray-500 bg-gray-700/40 px-2 py-0.5 rounded-full">{tag}</span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug mb-3">
          {article.title}
        </h1>

        {/* Author & date */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-6 pb-4 border-b border-gray-700/50">
          <span>✍️ {article.author}</span>
          {article.publishedAt && (
            <span>📅 {new Date(article.publishedAt).toLocaleDateString(zh ? "zh-CN" : "en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
          )}
          <span>👁 {article.viewCount ?? 0} {zh ? "次阅读" : "views"}</span>
        </div>

        {/* Excerpt */}
        {article.excerpt && (
          <div className="mb-6 p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
            <p className="text-sm text-gray-300 leading-relaxed italic">{article.excerpt}</p>
          </div>
        )}

        {/* Content — Markdown 渲染，正确处理 AI 生成的 ** 加粗、## 标题等语法 */}
        <div className="prose prose-invert prose-sm sm:prose-base max-w-none
            prose-headings:text-white prose-headings:font-bold
            prose-h2:text-lg prose-h2:border-b prose-h2:border-gray-700 prose-h2:pb-2 prose-h2:mb-4
            prose-h3:text-base prose-h3:text-cyan-300
            prose-p:text-gray-300 prose-p:leading-relaxed
            prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white
            prose-code:text-cyan-300 prose-code:bg-gray-800 prose-code:px-1 prose-code:rounded
            prose-blockquote:border-l-cyan-500 prose-blockquote:text-gray-400
            prose-ul:text-gray-300 prose-ol:text-gray-300
            prose-li:marker:text-cyan-500
            prose-table:text-gray-300
            prose-th:text-white prose-th:bg-gray-800
            prose-td:border-gray-700">
          <Markdown>{article.content || ""}</Markdown>
        </div>

        {/* Tags footer */}
        {tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-700/50">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">{zh ? "标签：" : "Tags:"}</span>
              {tags.map((tag: string) => (
                <span key={tag} className="text-xs text-cyan-400 bg-cyan-900/20 px-3 py-1 rounded-full border border-cyan-500/20 hover:border-cyan-500/50 transition-colors cursor-pointer">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 p-6 rounded-2xl border border-gray-700 bg-gray-800/30 text-center">
          <h4 className="text-gray-200 font-bold mb-2">{zh ? "探索更多 Web3 资源" : "Explore More Web3 Resources"}</h4>
          <p className="text-xs text-gray-500 mb-4">
            {zh ? "查看专业交易所对比、工具推荐，助您在 Web3 世界中游刃有余。" : "Check out exchange comparisons and tool recommendations for your Web3 journey."}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/exchanges"
              className="tap-target inline-block rounded-lg bg-yellow-500 px-5 py-2 text-sm font-bold text-gray-900 transition-colors hover:bg-yellow-400"
              onMouseEnter={() => preloadRoute("/exchanges")}
              onTouchStart={() => preloadRoute("/exchanges")}
            >
              {zh ? "交易所对比" : "Exchanges"}
            </Link>
            <Link
              href="/crypto-news"
              className="tap-target inline-block rounded-lg border border-cyan-500/40 px-5 py-2 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/10"
              onMouseEnter={() => preloadRoute("/crypto-news")}
              onTouchStart={() => preloadRoute("/crypto-news")}
            >
              {zh ? "更多资讯" : "More News"}
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-4 py-8 border-t border-gray-800/50">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-4">
          <Link href="/about" className="tap-target text-xs text-gray-500 hover:text-cyan-400 transition-colors" onMouseEnter={() => preloadRoute("/about")} onTouchStart={() => preloadRoute("/about")}>{zh ? "关于我们" : "About Us"}</Link>
          <Link href="/exchanges" className="tap-target text-xs text-gray-500 hover:text-cyan-400 transition-colors" onMouseEnter={() => preloadRoute("/exchanges")} onTouchStart={() => preloadRoute("/exchanges")}>{zh ? "交易所对比" : "Exchanges"}</Link>
          <Link href="/articles" className="tap-target text-xs text-gray-500 hover:text-cyan-400 transition-colors" onMouseEnter={() => preloadRoute("/articles")} onTouchStart={() => preloadRoute("/articles")}>{zh ? "文章中心" : "Articles"}</Link>
          <Link href="/contact" className="tap-target text-xs text-gray-500 hover:text-cyan-400 transition-colors" onMouseEnter={() => preloadRoute("/contact")} onTouchStart={() => preloadRoute("/contact")}>{zh ? "联系我们" : "Contact"}</Link>
        </div>
        <p className="text-xs text-gray-600 text-center">
          © 2026 Get8 Pro · {zh ? "专业 Web3 导航与资讯" : "Professional Web3 Navigator & News"}
        </p>
      </footer>
    </div>
  );
}
