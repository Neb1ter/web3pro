import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import viteCompression from "vite-plugin-compression";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

// =============================================================================
// Manus Debug Collector - Vite Plugin
// Writes browser logs directly to files, trimmed when exceeding size limit
// =============================================================================

const PROJECT_ROOT = import.meta.dirname;
const LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
const MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024; // 1MB per log file
const TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6); // Trim to 60% to avoid constant re-trimming

type LogSource = "browserConsole" | "networkRequests" | "sessionReplay";

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function trimLogFile(logPath: string, maxSize: number) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }

    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines: string[] = [];
    let keptBytes = 0;

    // Keep newest lines (from end) that fit within 60% of maxSize
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}\n`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }

    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
    /* ignore trim errors */
  }
}

function writeToLogFile(source: LogSource, entries: unknown[]) {
  if (entries.length === 0) return;

  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);

  // Format entries with timestamps
  const lines = entries.map((entry) => {
    const ts = new Date().toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });

  // Append to log file
  fs.appendFileSync(logPath, `${lines.join("\n")}\n`, "utf-8");

  // Trim if exceeds max size
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}

/**
 * Vite plugin to collect browser debug logs
 * - POST /__manus__/logs: Browser sends logs, written directly to files
 * - Files: browserConsole.log, networkRequests.log, sessionReplay.log
 * - Auto-trimmed when exceeding 1MB (keeps newest entries)
 */
function vitePluginManusDebugCollector(): Plugin {
  return {
    name: "manus-debug-collector",

    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true,
            },
            injectTo: "head",
          },
        ],
      };
    },

    configureServer(server: ViteDevServer) {
      // POST /__manus__/logs: Browser sends logs (written directly to files)
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }

        const handlePayload = (payload: any) => {
          // Write logs directly to files
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };

        const reqBody = (req as { body?: unknown }).body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    },
  };
}

// vitePluginManusRuntime 仅在开发环境使用，生产构建时排除以避免双重 React 实例冲突
const isDev = process.env.NODE_ENV !== 'production';
const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  ...(isDev ? [vitePluginManusRuntime()] : []),
  vitePluginManusDebugCollector(),
  // 生产环境启用 Gzip 压缩，减少传输体积约 60-70%
  ...(!isDev ? [
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // 仅压缩 > 1KB 的文件
      deleteOriginFile: false,
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false,
    }),
  ] : []),
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 提高 chunk 警告阈值
    chunkSizeWarningLimit: 600,
    // 启用 modulepreload polyfill
    modulePreload: {
      polyfill: true,
    },
    // 使用 esbuild 最小化（比 terser 更快，体积相近）
    minify: 'esbuild',
    // Rollup 代码分割：将大型第三方库拆分为独立 chunk，利用浏览器缓存
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React 核心 — 几乎不变，长期缓存
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          // Radix UI 组件库
          if (id.includes('node_modules/@radix-ui/')) {
            return 'vendor-radix';
          }
          // 图表库（recharts 较大）
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'vendor-charts';
          }
          // tRPC + React Query
          if (id.includes('node_modules/@trpc/') || id.includes('node_modules/@tanstack/')) {
            return 'vendor-trpc';
          }
          // lucide 图标库
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          // ❗ 核心修复：streamdown 及其巨型依赖（mermaid + shiki + katex）单独拆分
          // 这些库合计 > 12MB，仅在文章详情页使用，不应影响其他页面
          // 注意：pnpm 虚拟存储路径格式为 .pnpm/mermaid@x.x.x/node_modules/mermaid
          // 所以使用更宽泛的关键词匹配，而不是精确路径匹配
          if (
            id.includes('/streamdown') ||
            id.includes('/@streamdown') ||
            id.includes('/mermaid') ||
            id.includes('/@mermaid-js') ||
            id.includes('/shiki') ||
            id.includes('/@shikijs') ||
            id.includes('/katex') ||
            id.includes('/unified') ||
            id.includes('/remark') ||
            id.includes('/rehype') ||
            id.includes('/hast') ||
            id.includes('/marked') ||
            id.includes('/micromark') ||
            id.includes('/mdast') ||
            id.includes('/unist')
          ) {
            return 'vendor-markdown';
          }
          // AI SDK（仅在 AI 对话功能使用）
          if (
            id.includes('/node_modules/ai/') ||
            id.includes('/@ai-sdk/')
          ) {
            return 'vendor-ai';
          }
          // 其他第三方库（体积小，合并即可）
          if (id.includes('node_modules/')) {
            return 'vendor-misc';
          }
        },
        // 静态资源文件名加 hash，确保更新后缓存失效
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
