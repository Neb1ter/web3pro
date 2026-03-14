import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";

// setupVite 仅在开发环境使用，生产环境不会调用此函数
// 通过动态导入避免 Vite 插件被 esbuild 打包进生产构建
export async function setupVite(app: Express, server: Server) {
  // 延迟导入，esbuild 不会静态分析动态 import() 的路径
  const vite = await (async () => {
    const { nanoid } = await import("nanoid");
    const { createServer: createViteServer } = await import("vite");

    const serverOptions = {
      middlewareMode: true as const,
      hmr: { server },
      allowedHosts: true as const,
    };

    const instance = await createViteServer({
      configFile: path.resolve(import.meta.dirname, "../../vite.config.ts"),
      server: serverOptions,
      appType: "custom",
    });

    app.use(instance.middlewares);
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const clientTemplate = path.resolve(
          import.meta.dirname,
          "../..",
          "client",
          "index.html"
        );
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`
        );
        const page = await instance.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        instance.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    return instance;
  })();

  return vite;
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
    immutable: true,
    etag: false,
  }));

  // ── 其他静态文件（favicon、robots.txt 等）缓存 1 天 ──────────────────────
  app.use(express.static(distPath, {
    maxAge: '1d',
    etag: true,
    index: false,
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
