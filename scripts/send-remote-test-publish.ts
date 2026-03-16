import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../server/routers";

const envCandidates = [".env", ".env.production"];
for (const candidate of envCandidates) {
  const envPath = path.resolve(process.cwd(), candidate);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

const BASE_URL = process.env.SITE_URL || "https://get8.pro";

function buildSuffix(date: Date): string {
  return date.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
}

async function login(): Promise<string> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD is missing, so remote admin login cannot proceed.");
  }

  const response = await fetch(`${BASE_URL}/api/admin-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  const payload = await response.json() as { success?: boolean; error?: string };
  if (!response.ok || !payload.success) {
    throw new Error(`Admin login failed: ${payload.error || response.statusText}`);
  }

  const cookieParts =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [response.headers.get("set-cookie")].filter(Boolean) as string[];

  const cookie = cookieParts
    .map((value) => value.split(";")[0])
    .filter(Boolean)
    .join("; ");

  if (!cookie) {
    throw new Error("Admin login succeeded but no session cookie was returned.");
  }

  return cookie;
}

async function main() {
  const cookie = await login();

  const client = createTRPCProxyClient<AppRouter>({
    transformer: superjson,
    links: [
      httpBatchLink({
        url: `${BASE_URL}/api/trpc`,
        headers() {
          return { cookie };
        },
        fetch(url, options) {
          return fetch(url, {
            ...options,
            headers: {
              ...(options?.headers ?? {}),
              cookie,
            },
          });
        },
      }),
    ],
  });

  const platforms = await client.platforms.list.query();
  const telegram = platforms.find((platform) => platform.platform === "telegram");
  if (!telegram?.isEnabled) {
    throw new Error("Telegram platform is not enabled on the live server.");
  }

  const now = new Date();
  const suffix = buildSuffix(now);
  const newsTitle = `[测试快讯] Get8 Pro 远程发布测试 ${suffix}`;
  const articleTitle = `[测试文章] Get8 Pro 远程深度发布测试 ${suffix}`;
  const articleSlug = `remote-test-publish-${suffix}`;

  await client.news.create.mutate({
    title: newsTitle,
    summary: "这是一条通过线上后台 API 创建并发送的测试快讯。",
    source: "Get8 Pro Remote Test",
    url: `${BASE_URL}/crypto-news`,
    category: "other",
    isPinned: false,
    isActive: true,
    publishedAt: now.toISOString(),
  });

  const latestNews = await client.news.listAll.query({ limit: 20, offset: 0 });
  const createdNews = latestNews.find((item) => item.title === newsTitle);
  if (!createdNews) {
    throw new Error("The live server created the flash news, but it was not found in the latest list.");
  }

  const newsPublishResult = await client.news.publish.mutate({
    id: createdNews.id,
    platforms: ["telegram"],
  });

  await client.articles.create.mutate({
    title: articleTitle,
    slug: articleSlug,
    content: [
      "# 测试文章",
      "",
      "这篇文章通过线上后台 API 创建，用于验证文章发布到 Telegram 的完整链路。",
      "",
      "如果你在频道里看到它，说明文章手动发布功能当前正常。",
    ].join("\n"),
    excerpt: "这是一篇用于验证远程文章发布链路的测试文章。",
    category: "analysis",
    tags: "测试,远程发布,Telegram",
    author: "Get8 Pro Remote Test",
    status: "published",
    perspective: "educational",
    targetAudience: "beginner",
    contentStyle: "formal",
    metaTitle: articleTitle,
    metaDescription: "Get8 Pro 远程文章发布测试",
    metaKeywords: "测试,文章,Telegram",
    isPinned: false,
  });

  const latestArticles = await client.articles.listAll.query({ limit: 20, offset: 0 });
  const createdArticle = latestArticles.find((item) => item.slug === articleSlug);
  if (!createdArticle) {
    throw new Error("The live server created the article, but it was not found in the latest list.");
  }

  const articlePublishResult = await client.articles.publish.mutate({
    id: createdArticle.id,
    platforms: ["telegram"],
  });

  const publishLogs = await client.publishLogs.list.query({ limit: 10, offset: 0 });

  console.log(
    JSON.stringify(
      {
        telegram: {
          isEnabled: telegram.isEnabled,
          autoPublish: telegram.autoPublish,
          autoPublishNews: telegram.autoPublishNews,
        },
        news: {
          id: createdNews.id,
          title: createdNews.title,
          publish: newsPublishResult,
        },
        article: {
          id: createdArticle.id,
          slug: createdArticle.slug,
          title: createdArticle.title,
          publish: articlePublishResult,
        },
        latestLogs: publishLogs.slice(0, 6),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[send-remote-test-publish] failed:", error);
  process.exitCode = 1;
});
