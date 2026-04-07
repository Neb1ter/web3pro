import { Suspense, lazy, useEffect } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { goBack } from "@/hooks/useScrollMemory";
import { trpc } from "@/lib/trpc";
import { preloadRoute } from "@/lib/routePreload";
import { TrustSignalsCard } from "@/components/TrustSignalsCard";
import { TRUST_LAST_REVIEWED, getArticleSourceList } from "@/lib/trust";

const Markdown = lazy(() => import("@/components/Markdown"));

function ArticleMarkdownSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 w-10/12 rounded bg-gray-700/40" />
      <div className="h-4 w-full rounded bg-gray-700/35" />
      <div className="h-4 w-11/12 rounded bg-gray-700/35" />
      <div className="h-4 w-9/12 rounded bg-gray-700/35" />
      <div className="mt-6 h-32 rounded-2xl border border-cyan-500/10 bg-slate-900/35" />
    </div>
  );
}

const ARTICLE_CATEGORY_LABELS: Record<string, { zh: string; en: string; color: string }> = {
  analysis: { zh: "市场分析", en: "Analysis", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  tutorial: { zh: "使用教程", en: "Tutorial", color: "bg-green-500/20 text-green-300 border-green-500/30" },
  news_decode: { zh: "新闻解读", en: "News Decode", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  project: { zh: "项目介绍", en: "Project", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  promo: { zh: "活动说明", en: "Campaign", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  report: { zh: "行业报告", en: "Report", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
};

export default function ArticleDetail() {
  const { language } = useLanguage();
  const zh = language === "zh";
  const [, params] = useRoute("/article/:slug");
  const slug = params?.slug ?? "";
  const { data: article, isLoading, error } = trpc.articles.bySlug.useQuery({ slug }, { enabled: !!slug });

  useEffect(() => {
    if (!article) return;
    document.title = `${article.metaTitle || article.title} | Get8 Pro`;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", article.metaDescription || article.excerpt || "");
    document
      .querySelector('meta[name="keywords"]')
      ?.setAttribute("content", article.metaKeywords || article.tags || "");
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", article.metaTitle || article.title);
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute("content", article.metaDescription || article.excerpt || "");
    if (article.coverImage) {
      document.querySelector('meta[property="og:image"]')?.setAttribute("content", article.coverImage);
    }
    document.querySelector('meta[property="og:url"]')?.setAttribute("content", `https://get8.pro/article/${slug}`);
    document.querySelector('meta[property="og:type"]')?.setAttribute("content", "article");
  }, [article, slug]);

  useEffect(() => {
    if (!article) return;
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.excerpt || "",
      image: article.coverImage || "",
      datePublished: article.publishedAt || article.createdAt,
      dateModified: article.updatedAt || article.createdAt,
      author: { "@type": "Person", name: article.author },
      publisher: {
        "@type": "Organization",
        name: "Get8 Pro",
        url: "https://get8.pro",
        logo: { "@type": "ImageObject", url: "https://get8.pro/favicon.ico" },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": `https://get8.pro/article/${slug}` },
      keywords: article.tags || "",
      articleSection: ARTICLE_CATEGORY_LABELS[article.category]?.zh || article.category,
    };
    let el = document.getElementById("article-schema");
    if (!el) {
      el = document.createElement("script");
      el.id = "article-schema";
      (el as HTMLScriptElement).type = "application/ld+json";
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(schema);
    return () => document.getElementById("article-schema")?.remove();
  }, [article, slug]);

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "linear-gradient(135deg, #0A192F 0%, #0d2137 50%, #0A192F 100%)" }}
      >
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4"
        style={{ background: "linear-gradient(135deg, #0A192F 0%, #0d2137 50%, #0A192F 100%)" }}
      >
        <div className="text-5xl">📰</div>
        <p className="text-gray-400">{zh ? "文章不存在或已下架" : "Article not found"}</p>
        <Link
          href="/crypto-news"
          className="tap-target text-sm text-cyan-400 hover:text-cyan-300"
          onMouseEnter={() => preloadRoute("/crypto-news")}
          onTouchStart={() => preloadRoute("/crypto-news")}
        >
          {zh ? "返回资讯中心" : "Back to News Hub"}
        </Link>
      </div>
    );
  }

  const catInfo = ARTICLE_CATEGORY_LABELS[article.category] ?? ARTICLE_CATEGORY_LABELS.analysis;
  const catLabel = zh ? catInfo.zh : catInfo.en;
  const tags = article.tags ? article.tags.split(",").map((tag: string) => tag.trim()).filter(Boolean) : [];
  const articleDisclosure = zh
    ? `本文用于信息整理与学习参考${article.isAiGenerated ? "，初稿包含 AI 辅助生成并已做人工复核" : ""}，不构成投资建议；涉及费率、活动或政策时，请以对应平台的最新官方页面为准。`
    : `This page is for learning and information reference${article.isAiGenerated ? ", with AI-assisted drafting and editorial review" : ""}. It is not investment advice. Re-check the latest official page when fees, policies, or campaigns matter.`;
  const articleSources = getArticleSourceList(article.category, zh).map((label) => ({ label }));

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0A192F 0%, #0d2137 50%, #0A192F 100%)" }}>
      <header className="sticky top-0 z-40 border-b border-cyan-500/20 backdrop-blur-md" style={{ background: "rgba(10,25,47,0.92)" }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <button onClick={goBack} className="tap-target flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-cyan-400">
            <ArrowLeft size={15} />
            <span>{zh ? "返回" : "Back"}</span>
          </button>
          <Link
            href="/crypto-news"
            className="tap-target text-xs text-gray-500 transition-colors hover:text-cyan-400"
            onMouseEnter={() => preloadRoute("/crypto-news")}
            onTouchStart={() => preloadRoute("/crypto-news")}
          >
            {zh ? "资讯中心" : "News Hub"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {article.coverImage ? (
          <div className="mb-6 h-48 overflow-hidden rounded-2xl sm:h-64">
            <img
              src={article.coverImage}
              alt={article.title}
              className="h-full w-full object-cover"
              decoding="async"
              fetchPriority="high"
              sizes="(max-width: 640px) 100vw, 768px"
            />
          </div>
        ) : null}

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${catInfo.color}`}>{catLabel}</span>
          {tags.map((tag: string) => (
            <span key={tag} className="rounded-full bg-gray-700/40 px-2 py-0.5 text-xs text-gray-300">
              {tag}
            </span>
          ))}
        </div>

        <h1 className="mb-3 text-xl font-bold leading-snug text-white sm:text-2xl">{article.title}</h1>

        <div className="mb-6 flex flex-wrap items-center gap-4 border-b border-gray-700/50 pb-4 text-xs text-gray-400">
          <span>{article.author}</span>
          {article.publishedAt ? (
            <span>
              {new Date(article.publishedAt).toLocaleDateString(zh ? "zh-CN" : "en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          ) : null}
          <span>{`${article.viewCount ?? 0} ${zh ? "次阅读" : "views"}`}</span>
        </div>

        {article.excerpt ? (
          <div className="mb-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <p className="text-sm italic leading-relaxed text-gray-300">{article.excerpt}</p>
          </div>
        ) : null}

        <div
          className="prose prose-invert prose-sm max-w-none
            prose-headings:text-white prose-headings:font-bold
            prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-700 prose-h2:pb-2 prose-h2:text-lg
            prose-h3:text-base prose-h3:text-cyan-300
            prose-p:text-gray-300 prose-p:leading-relaxed
            prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white
            prose-code:rounded prose-code:bg-gray-800 prose-code:px-1 prose-code:text-cyan-300
            prose-blockquote:border-l-cyan-500 prose-blockquote:text-gray-400
            prose-ul:text-gray-300 prose-ol:text-gray-300 prose-li:marker:text-cyan-500
            prose-table:text-gray-300 prose-th:bg-gray-800 prose-th:text-white prose-td:border-gray-700
            sm:prose-base"
        >
          <Suspense fallback={<ArticleMarkdownSkeleton />}>
            <Markdown mode="static" parseIncompleteMarkdown={false}>
              {article.content || ""}
            </Markdown>
          </Suspense>
        </div>

        {tags.length > 0 ? (
          <div className="mt-8 border-t border-gray-700/50 pt-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400">{zh ? "标签：" : "Tags:"}</span>
              {tags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-full border border-cyan-500/20 bg-cyan-900/20 px-3 py-1 text-xs text-cyan-400 transition-colors hover:border-cyan-500/50"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-10 rounded-2xl border border-gray-700 bg-gray-800/30 p-6 text-center">
          <h4 className="mb-2 font-bold text-gray-200">{zh ? "继续浏览更多 Web3 内容" : "Explore more Web3 resources"}</h4>
          <p className="mb-4 text-xs text-gray-400">
            {zh ? "继续查看交易所对比、工具合集和更多资讯内容。" : "Continue with exchange comparisons, tool collections, and more news."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
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

        <div className="mt-8">
          <TrustSignalsCard
            zh={zh}
            title={zh ? "作者、审核与披露" : "Authorship, Review & Disclosure"}
            summary={
              zh
                ? "文章的作者、更新时间、来源依据和披露信息统一放在页面末尾，更适合在读完正文后做最后的可信度判断。"
                : "The author, update timing, source basis, and disclosures are grouped near the footer for a final credibility check."
            }
            author={article.author}
            reviewer={zh ? "Get8 Pro 内容审核" : "Get8 Pro Editorial Review"}
            updatedAt={article.updatedAt || article.publishedAt || article.createdAt || TRUST_LAST_REVIEWED}
            sources={articleSources}
            disclosure={articleDisclosure}
            reviewNote={article.reviewNotes}
          />
        </div>
      </main>
    </div>
  );
}
