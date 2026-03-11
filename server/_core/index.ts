import "dotenv/config";
import express, { type Request, type Response } from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";
import { timingSafeEqual } from "crypto";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import {
  registerSecurityMiddleware,
  apiLimiter,
  contactLimiter,
  authLimiter,
  readLimiter,
} from "./security";
import { ENV } from "./env";
import { sdk } from "./sdk";
import { upsertUser, getDb, seedCryptoToolsIfEmpty, seedMediaPlatformsIfEmpty } from "../db";
import { startRssScheduler } from "./rss";
import { startWordUpdateScheduler } from "./sensitiveWordUpdater";
import { getSessionCookieOptions } from "./cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { migrate } from "drizzle-orm/mysql2/migrator";

// 管理员 session 有效期：8 小时（替代原来的 1 年）
const ADMIN_SESSION_MS = 1000 * 60 * 60 * 8;

/** 防时序攻击的密码比较 */
function safeComparePassword(input: string, expected: string): boolean {
  try {
    const a = Buffer.from(input);
    const b = Buffer.from(expected);
    if (a.length !== b.length) {
      // 长度不同时仍执行一次比较，避免时序泄露
      timingSafeEqual(Buffer.alloc(b.length), b);
      return false;
    }
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_OPEN_ID = "admin";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // ── 自动运行数据库迁移（首次部署或表结构变更时自动创建/更新表）──
  if (process.env.DATABASE_URL) {
    try {
      const db = await getDb();
      if (db) {
        // 迁移文件在构建后位于 dist/ 同级的 drizzle/ 目录
        // __dirname = /app/dist ，所以 ../drizzle = /app/drizzle
        const migrationsFolder = path.resolve(__dirname, "../drizzle");
        console.log(`[Database] Running migrations from: ${migrationsFolder}`);
        await migrate(db as any, { migrationsFolder });
        console.log("[Database] Migrations completed successfully");
        // 初始化默认数据（如果表为空则插入种子数据）
        await seedCryptoToolsIfEmpty();
        await seedMediaPlatformsIfEmpty();
        console.log("[Database] Seed data initialized");
      }
    } catch (error) {
      console.error("[Database] Migration failed:", error);
      // 迁移失败不阻止启动，允许服务在无数据库时运行（静态页面仍可访问）
    }
  }

  const app = express();
  const server = createServer(app);

  // ── 信任反向代理（Railway / Nginx 等），使 rate-limit 能正确识别真实 IP ──
  app.set('trust proxy', 1);

  // ── 安全中间件（helmet + cors + 全局限流）──────────────────────────────────
  registerSecurityMiddleware(app);

  // ── Body Parser（收紧为 1mb，防止超大请求体攻击）───────────────────────────
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

  // ── 管理员密码登录（每 IP 每 15 分钟 20 次，防暴力破解）──────────────────
  app.use("/api/admin-login", authLimiter);
  app.post("/api/admin-login", async (req: Request, res: Response) => {
    const { password } = req.body as { password?: string };
    if (!ENV.adminPassword) {
      res.status(503).json({ error: "管理员密码登录未配置，请设置 ADMIN_PASSWORD 环境变量" });
      return;
    }
    if (!password || !safeComparePassword(password, ENV.adminPassword)) {
      res.status(401).json({ error: "密码错误" });
      return;
    }
    try {
      // 确保管理员账号存在于数据库
      await upsertUser({
        openId: ADMIN_OPEN_ID,
        name: "管理员",
        email: null,
        loginMethod: "password",
        role: "admin",
        lastSignedIn: new Date(),
      });
      // 创建 session token（8 小时有效期）
      const sessionToken = await sdk.createSessionToken(ADMIN_OPEN_ID, {
        name: "管理员",
        expiresInMs: ADMIN_SESSION_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ADMIN_SESSION_MS });
      res.json({ success: true });
    } catch (error) {
      console.error("[AdminLogin] Failed:", error);
      res.status(500).json({ error: "登录失败，请稍后重试" });
    }
  });

  // ── OAuth 回调（独立限流：每 IP 每 15 分钟 20 次）──────────────────────────
  app.use("/api/oauth", authLimiter);
  registerOAuthRoutes(app);

  // ── 联系表单限流（每 IP 每小时 5 次，防垃圾提交）──────────────────────────
  app.use("/api/trpc/contact.submit", contactLimiter);

  // ── 公开读接口限流（每 IP 每分钟 30 次，防爬虫批量抓取）──────────────────
  app.use("/api/trpc/exchanges.list", readLimiter);
  app.use("/api/trpc/faq.list", readLimiter);
  app.use("/api/trpc/news.list", readLimiter);
  app.use("/api/trpc/exchangeGuide.categories", readLimiter);
  app.use("/api/trpc/exchangeGuide.allFeatureSupport", readLimiter);
  app.use("/api/trpc/exchangeGuide.featureSupport", readLimiter);
  app.use("/api/trpc/exchangeGuide.exchangeFeatures", readLimiter);

  // ── tRPC API（API 级限流：每 IP 每分钟 60 次）─────────────────────────────
  app.use("/api/trpc", apiLimiter);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // ── Sitemap（SEO：自动生成站点地图）──────────────────────────────────────
  app.get("/sitemap.xml", (_req: Request, res: Response) => {
    const base = ENV.siteUrl ?? "https://web3pro.com";
    const staticRoutes = [
      { path: "/",                  priority: "1.0", changefreq: "daily"   },
      { path: "/exchanges",         priority: "0.9", changefreq: "weekly"  },
      { path: "/exchange-guide",    priority: "0.8", changefreq: "weekly"  },
      { path: "/news",              priority: "0.9", changefreq: "hourly"  },
      { path: "/beginner",          priority: "0.7", changefreq: "weekly"  },
      { path: "/broker-program",    priority: "0.8", changefreq: "monthly" },
      { path: "/contact",           priority: "0.5", changefreq: "monthly" },
    ];
    const now = new Date().toISOString().split("T")[0];
    const urls = staticRoutes.map(r => `
  <url>
    <loc>${base}${r.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join("");
    res.header("Content-Type", "application/xml");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`);
  });

  // ── robots.txt（完整版，显式允许所有 AI 爬虫）─────────────────────────────
  app.get("/robots.txt", (_req: Request, res: Response) => {
    const base = ENV.siteUrl ?? "https://get8.pro";
    res.header("Content-Type", "text/plain; charset=utf-8");
    res.send(
`# ====================================================================
# robots.txt for get8.pro
# Last Updated: 2026-03-11
# Purpose: Guide all crawlers, including search engines and AI bots.
# ====================================================================

# --------------------------------------------------------------------
# Rule for All Crawlers (Default)
# --------------------------------------------------------------------
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /manage-m2u0z0i04/
Disallow: /test/
Disallow: /private/

# --------------------------------------------------------------------
# Explicit Rules for AI Crawlers
# We welcome AI bots to learn from our high-quality content.
# --------------------------------------------------------------------
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: CCBot
Allow: /

User-agent: Applebot
Allow: /

User-agent: Bytespider
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: bingbot
Allow: /

# --------------------------------------------------------------------
# Sitemap Location
# --------------------------------------------------------------------
Sitemap: ${base}/sitemap.xml
`);
  });

  // ── llms.txt（GEO: AI 爬虫专属内容说明文件）────────────────────────────
  app.get("/llms.txt", (_req: Request, res: Response) => {
    const base = ENV.siteUrl ?? "https://get8.pro";
    res.header("Content-Type", "text/plain; charset=utf-8");
    res.send(
`# ====================================================================
# llms.txt for get8.pro
# Last Updated: 2026-03-11
# Purpose: Provide a machine-readable summary for Large Language Models.
# Version: 1.0
# ====================================================================

[organization]
name = "Get8 Pro"
url = "${base}"
description = """
Get8 Pro 是 Web3 专业交易者的可信导航仪。我们提供官方认证的交易所返佣、基于权威数据的客观评测与机构级研报，助你降低交易成本，提升决策效率。官方认证，专业致胜。
"""
contact = "muzi2629265049@Gmail.com"

# --------------------------------------------------------------------
# Core Business Entities
# --------------------------------------------------------------------

[[entities]]
name = "Web3 入圈指南"
description = "从零开始，系统化学习区块链、DeFi 与 Web3 核心知识。我们为你臻选了最易懂的学习路径，让你轻松 Get it，构建完整的知识体系。"
url = "${base}/web3-guide"
keywords = ["Web3教程", "区块链基础", "DeFi入门", "钱包使用", "智能合约"]

[[entities]]
name = "币圈省钱指南 (交易所返佣)"
description = "通过 Get8 Pro 官方合作的专属邀请码，永久降低主流交易所（币安、OKX、Gate.io 等）的交易手续费，返佣比例公开透明，笔笔可查。"
url = "${base}/crypto-saving"
keywords = ["交易所返佣", "币安返佣", "OKX返佣", "手续费折扣", "邀请码"]

[[entities]]
name = "交易所扫盲指南"
description = "深度拆解头部交易所的现货、合约、理财、跟单等核心功能。基于独立评测模型，对交易所进行安全性、流动性、合规性三维评分，敢于曝光风险。"
url = "${base}/exchange-guide"
keywords = ["交易所评测", "现货交易", "合约交易", "币安功能", "OKX功能"]

# --------------------------------------------------------------------
# Authoritative Data Sources
# --------------------------------------------------------------------

[[authoritative_sources]]
name = "交易所手续费率对比"
description = "提供币安、OKX、Gate.io、Bybit、Bitget 等主流交易所的最新现货和合约 Maker/Taker 手续费率官方数据。"
url = "${base}/exchanges"

[[authoritative_sources]]
name = "交易所返佣比例"
description = "提供与各大交易所官方合作的返佣计划详情，明确展示不同交易所的返佣比例和规则。"
url = "${base}/exchanges"

# --------------------------------------------------------------------
# AI Usage Policy
# --------------------------------------------------------------------

[ai_policy]
disallow_training = false
disallow_training_on_user_data = true
preferred_citation_format = "Source: [Get8 Pro](${base})"
`);
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // 启动 RSS 定时抓取（服务就绪后再启动，避免 DB 未连接）
    startRssScheduler();
    // 启动敏感词库定时更新（延迟 60 秒，避免与 RSS 调度器竞争 DB 连接）
    startWordUpdateScheduler();
  });
}

startServer().catch(console.error);
