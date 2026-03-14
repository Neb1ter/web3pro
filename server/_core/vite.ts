import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
    console.error(`Expected Vite build output at: ${distPath}`);
  } else {
    console.log(`[Static] Serving static files from: ${distPath}`);
  }

  // ── 带 hash 的 JS/CSS 资源：长期缓存 1 年（内容变更时 hash 自动更新）──────
  // 注意：Cloudflare 已提供 Gzip 压缩，无需在 Node.js 层再做压缩
  app.use('/assets', express.static(path.join(distPath, 'assets'), {
    maxAge: '1y',
    immutable: true,   // 告知浏览器文件内容永不改变
    etag: false,       // hash 已保证唯一性，无需 ETag
  }));

  // ── 其他静态文件（favicon、robots.txt 等）缓存 1 天 ──────────────────────
  app.use(express.static(distPath, {
    maxAge: '1d',
    etag: true,
    index: false,      // 不自动返回 index.html，由下方路由处理
  }));

  // ── index.html：禁用缓存，确保 SPA 路由始终获取最新版本 ──────────────────
  const indexPath = path.resolve(distPath, 'index.html');
  const noCache = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  app.get('/index.html', (_req, res) => {
    res.set(noCache).sendFile(indexPath);
  });

  // SPA 路由 fallback
  app.use('*', (_req, res) => {
    res.set(noCache).sendFile(indexPath);
  });
}
