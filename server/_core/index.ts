import "dotenv/config";
import express, { type Request, type Response } from "express";
import { createServer } from "http";
import net from "net";
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
} from "./security";
import { ENV } from "./env";
import { sdk } from "./sdk";
import { upsertUser } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

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
  const app = express();
  const server = createServer(app);

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
    if (!password || password !== ENV.adminPassword) {
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
      // 创建 session token
      const sessionToken = await sdk.createSessionToken(ADMIN_OPEN_ID, {
        name: "管理员",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
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

  // ── tRPC API（API 级限流：每 IP 每分钟 60 次）─────────────────────────────
  app.use("/api/trpc", apiLimiter);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

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
  });
}

startServer().catch(console.error);
