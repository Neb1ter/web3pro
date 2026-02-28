/**
 * security.ts — 统一安全中间件
 *
 * 防护层级：
 * 1. helmet         — 设置安全 HTTP 响应头（XSS、点击劫持、MIME 嗅探等）
 * 2. cors           — 限制跨域来源，只允许白名单域名
 * 3. globalLimiter  — 全局限流：每 IP 每分钟最多 120 次请求
 * 4. apiLimiter     — API 限流：每 IP 每分钟最多 60 次 API 请求
 * 5. contactLimiter — 联系表单：每 IP 每小时最多 5 次提交（防垃圾表单）
 * 6. authLimiter    — 认证接口：每 IP 每 15 分钟最多 20 次（防暴力破解）
 */

import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import type { Express, Request, Response, NextFunction } from "express";

// ─── 允许的跨域来源白名单 ───────────────────────────────────────────────────
const ALLOWED_ORIGINS: (string | RegExp)[] = [
  // 生产域名
  "https://get8.pro",
  "https://www.get8.pro",
  // Railway 部署域名（支持通配符子域）
  /^https:\/\/.*\.up\.railway\.app$/,
  // Vercel 部署域名
  /^https:\/\/.*\.vercel\.app$/,
];

// 本地开发时额外允许 localhost 和 Manus 预览域名
if (process.env.NODE_ENV !== "production") {
  ALLOWED_ORIGINS.push(
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:5173",
    // Manus 沙箱预览域名
    /^https:\/\/.*\.manus\.computer$/,
  );
}

// ─── 限流响应格式 ────────────────────────────────────────────────────────────
function rateLimitHandler(req: Request, res: Response) {
  res.status(429).json({
    error: "TOO_MANY_REQUESTS",
    message: "请求过于频繁，请稍后再试。",
    retryAfter: res.getHeader("Retry-After"),
  });
}

// ─── 全局限流：每 IP 每分钟 120 次 ──────────────────────────────────────────
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,           // 1 分钟
  max: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => req.path.startsWith("/assets/") || req.path.startsWith("/@"),
});

// ─── API 限流：每 IP 每分钟 60 次 ───────────────────────────────────────────
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,           // 1 分钟
  max: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// ─── 联系表单限流：每 IP 每小时 20 次 ────────────────────────────────────
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,      // 1 小时
  max: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "TOO_MANY_REQUESTS",
    message: "提交过于频繁，请 1 小时后再试。",
  },
  handler: rateLimitHandler,
});

// ─── 认证接口限流：每 IP 每 15 分钟 20 次 ───────────────────────────────────
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,      // 15 分钟
  max: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// ─── 注册所有安全中间件 ──────────────────────────────────────────────────────
export function registerSecurityMiddleware(app: Express) {
  // 1. Helmet — 安全 HTTP 头
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],  // Vite HMR 需要
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:", "wss:"],
          fontSrc: ["'self'", "https:", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,   // 避免影响第三方嵌入资源
    })
  );

  // 2. CORS — 跨域白名单
  app.use(
    cors({
      origin: (origin, callback) => {
        // 允许无 Origin 的请求（如服务端直接调用、curl）
        if (!origin) return callback(null, true);
        const allowed = ALLOWED_ORIGINS.some((o) =>
          typeof o === "string" ? o === origin : o.test(origin)
        );
        if (allowed) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: Origin "${origin}" not allowed`));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-trpc-source"],
    })
  );

  // 3. 全局限流
  app.use(globalLimiter);
}
