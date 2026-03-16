import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { desc, eq } from "drizzle-orm";
import { articles, cryptoNews, mediaPlatforms } from "../drizzle/schema";
import { getDb } from "../server/db";
import { publishContent } from "../server/_core/publish";

const envCandidates = [".env", ".env.production"];
for (const candidate of envCandidates) {
  const envPath = path.resolve(process.cwd(), candidate);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

function buildSlugSuffix(date: Date): string {
  return date.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
}

async function main() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database is not available. Check DATABASE_URL and server env.");
  }

  const enabledTelegramPlatforms = await db
    .select({
      platform: mediaPlatforms.platform,
      name: mediaPlatforms.name,
      isEnabled: mediaPlatforms.isEnabled,
      autoPublish: mediaPlatforms.autoPublish,
      autoPublishNews: mediaPlatforms.autoPublishNews,
    })
    .from(mediaPlatforms)
    .where(eq(mediaPlatforms.platform, "telegram"));

  const readyPlatforms = enabledTelegramPlatforms
    .filter((platform) => platform.isEnabled)
    .map((platform) => platform.platform);

  if (readyPlatforms.length === 0) {
    throw new Error("Telegram platform is not enabled, so there is nowhere safe to send a live test.");
  }

  const now = new Date();
  const suffix = buildSlugSuffix(now);

  const newsTitle = `[测试快讯] Get8 Pro 推送链路测试 ${suffix}`;
  const articleTitle = `[测试文章] Get8 Pro 深度内容推送测试 ${suffix}`;
  const articleSlug = `test-publish-${suffix}`;

  await db.insert(cryptoNews).values({
    title: newsTitle,
    summary: "这是一条用于校验后台实时快讯入库与 Telegram 推送链路的测试消息。",
    source: "Get8 Pro Test",
    url: "https://get8.pro/crypto-news",
    category: "other",
    isPinned: false,
    isActive: true,
    publishedAt: now,
  });

  const [news] = await db
    .select({
      id: cryptoNews.id,
      title: cryptoNews.title,
      url: cryptoNews.url,
      source: cryptoNews.source,
    })
    .from(cryptoNews)
    .where(eq(cryptoNews.title, newsTitle))
    .orderBy(desc(cryptoNews.id))
    .limit(1);

  if (!news) {
    throw new Error("Test flash news was not found after insert.");
  }

  await db.insert(articles).values({
    title: articleTitle,
    slug: articleSlug,
    content: [
      "# 测试文章",
      "",
      "这篇文章用于验证后台深度文章创建、入库和 Telegram 发布链路。",
      "",
      "如果你在频道里看到这条消息，说明文章推送功能当前可用。",
    ].join("\n"),
    excerpt: "用于验证深度文章创建与 Telegram 推送链路的测试内容。",
    category: "analysis",
    tags: "测试,推送,Telegram",
    author: "Get8 Pro Test",
    status: "published",
    perspective: "educational",
    targetAudience: "beginner",
    contentStyle: "formal",
    isAiGenerated: false,
    sensitiveStatus: "clean",
    metaTitle: articleTitle,
    metaDescription: "Get8 Pro 后台文章推送测试",
    metaKeywords: "测试,推送,Telegram",
    isPinned: false,
    isActive: true,
    publishedAt: now,
  });

  const [article] = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
    })
    .from(articles)
    .where(eq(articles.slug, articleSlug))
    .orderBy(desc(articles.id))
    .limit(1);

  if (!article) {
    throw new Error("Test article was not found after insert.");
  }

  const newsResults = await publishContent(
    {
      type: "news",
      id: news.id,
      title: news.title,
      url: news.url,
      source: news.source,
    },
    readyPlatforms
  );

  const articleResults = await publishContent(
    {
      type: "article",
      id: article.id,
      title: article.title,
      excerpt: article.excerpt,
      url: `https://get8.pro/article/${article.slug}`,
    },
    readyPlatforms
  );

  console.log(
    JSON.stringify(
      {
        platforms: enabledTelegramPlatforms,
        news: { id: news.id, title: news.title, results: newsResults },
        article: { id: article.id, slug: article.slug, title: article.title, results: articleResults },
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[send-test-publish] failed:", error);
  process.exitCode = 1;
});
