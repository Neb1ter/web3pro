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
    // ⚠️ modulePreload 必须设为 false！
    // 当 modulePreload 启用时，Vite/Rollup 会生成 __vitePreload 函数，
    // 并将其注入到模块图中的某个 chunk（如 vendor-markdown）并导出，
    // 导致 index.js 必须静态 import vendor-markdown（11MB），造成首屏白屏。
    // 禁用后，懒加载路由仍然正常工作，只是不会预加载相关 chunk（对首屏性能无影响）。
    modulePreload: false,
    // 使用 esbuild 最小化（比 terser 更快，体积相近）
    minify: 'esbuild',
    // Rollup 代码分割
    // ⚠️ 重要：manualChunks 策略说明：
    // 1. 不将 streamdown/mermaid/shiki/katex 强制分到独立 chunk
    //    原因：它们依赖 vendor-misc 中的包（clsx/vfile等），强制分割会造成循环依赖
    //    导致 Rollup 将 __vite__mapDeps 注入到大 chunk 并导出，造成首屏白屏
    // 2. 其他所有 node_modules 包入 vendor-misc，减少 chunk 数量（避免 400+ 个文件）
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React 核心 + scheduler（react-dom 依赖 scheduler，必须放在同一 chunk 避免循环依赖）
          // ⚠️ 必须包含 scheduler，否则 vendor-react 会 import vendor-misc 造成循环
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'vendor-react';
          }
          // ⚠️ 性能关键：将超大型库排除在 vendor-misc 之外，让它们成为独立的懒加载 chunk
          // streamdown 源码 44MB + mermaid 69MB + shiki/shikijs 是首屏加载最大瓶颈
          // 它们已通过 Markdown.tsx 和 AIChatBox.tsx 中的动态 import() 引入
          // 返回 undefined 让 Rollup 根据动态 import 自动分配 chunk
          if (
            id.includes('node_modules/streamdown') ||
            id.includes('node_modules/mermaid') ||
            id.includes('node_modules/shiki') ||
            id.includes('node_modules/@shikijs')
          ) {
            return undefined; // 交给 Rollup 自动处理，将随动态 import 形成独立 chunk
          }
          // 其他所有第三方包全部并入 vendor-misc（避免循环依赖）
          // 不再单独分割 radix-ui / trpc / tanstack，防止产生新的循环链
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
