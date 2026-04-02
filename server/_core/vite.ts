import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";
import { BASE_DESCRIPTION, BASE_KEYWORDS, BASE_TITLE, detectSeoLanguage, getSeoForPath, normalizeSeoPath } from "../../shared/seoMeta";

const SEO_PLACEHOLDERS = {
  title: "__PAGE_TITLE__",
  description: "__PAGE_DESCRIPTION__",
  keywords: "__PAGE_KEYWORDS__",
  canonicalUrl: "__CANONICAL_URL__",
} as const;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function resolveCanonicalUrl(pathname: string) {
  const normalizedPath = normalizeSeoPath(pathname);
  return `https://get8.pro${normalizedPath === "/" ? "/" : normalizedPath}`;
}

function resolveRequestPath(url: string) {
  try {
    return new URL(url, "https://get8.pro").pathname;
  } catch {
    return "/";
  }
}

function getAcceptLanguage(header: string | string[] | undefined): string | undefined {
  if (typeof header === "string") return header;
  if (Array.isArray(header)) return header[0];
  return undefined;
}

function injectSeoTemplate(template: string, url: string, acceptLanguageHeader?: string | null) {
  const pathname = resolveRequestPath(url);
  const language = detectSeoLanguage(acceptLanguageHeader ?? "");
  const meta = getSeoForPath(pathname, language);
  const canonicalUrl = resolveCanonicalUrl(pathname);
  const htmlLang = language === "zh" ? "zh-CN" : "en";

  return template
    .replaceAll(SEO_PLACEHOLDERS.title, escapeHtml(meta.title || BASE_TITLE[language]))
    .replaceAll(SEO_PLACEHOLDERS.description, escapeHtml(meta.description || BASE_DESCRIPTION[language]))
    .replaceAll(SEO_PLACEHOLDERS.keywords, escapeHtml(meta.keywords || BASE_KEYWORDS[language]))
    .replaceAll(SEO_PLACEHOLDERS.canonicalUrl, canonicalUrl)
    .replace(/<html lang="[^"]*">/i, `<html lang="${htmlLang}">`)
    .replace(/<meta property="og:locale" content="[^"]*" \/>/i, `<meta property="og:locale" content="${language === "zh" ? "zh_CN" : "en_US"}" />`);
}

export async function setupVite(app: Express, server: Server) {
  const vite = await (async () => {
    const { nanoid } = await import("nanoid");
    const { createServer: createViteServer } = await import("vite");

    const instance = await createViteServer({
      configFile: path.resolve(import.meta.dirname, "../../vite.config.ts"),
      server: {
        middlewareMode: true as const,
        hmr: { server },
        allowedHosts: true as const,
      },
      appType: "custom",
    });

    app.use(instance.middlewares);
    app.use("*", async (req, res, next) => {
      try {
        const clientTemplate = path.resolve(import.meta.dirname, "../..", "client", "index.html");
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
        template = injectSeoTemplate(template, req.originalUrl, getAcceptLanguage(req.headers["accept-language"]));
        const page = await instance.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (error) {
        instance.ssrFixStacktrace(error as Error);
        next(error);
      }
    });

    return instance;
  })();

  return vite;
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    console.error(`Could not find the build directory: ${distPath}, make sure to build the client first`);
    console.error(`Expected Vite build output at: ${distPath}`);
  } else {
    console.log(`[Static] Serving static files from: ${distPath}`);
  }

  app.use(
    "/assets",
    express.static(path.join(distPath, "assets"), {
      maxAge: "1y",
      immutable: true,
      etag: false,
    }),
  );

  app.use(
    express.static(distPath, {
      maxAge: "1d",
      etag: true,
      index: false,
    }),
  );

  const indexPath = path.resolve(distPath, "index.html");
  const noCache = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };

  const loadTemplate = async () => fs.promises.readFile(indexPath, "utf-8");

  app.get("/index.html", async (req, res, next) => {
    try {
      const template = await loadTemplate();
      res
        .set(noCache)
        .type("html")
        .send(injectSeoTemplate(template, req.originalUrl, getAcceptLanguage(req.headers["accept-language"])));
    } catch (error) {
      next(error);
    }
  });

  app.use("*", async (req, res, next) => {
    try {
      const template = await loadTemplate();
      res
        .set(noCache)
        .type("html")
        .send(injectSeoTemplate(template, req.originalUrl, getAcceptLanguage(req.headers["accept-language"])));
    } catch (error) {
      next(error);
    }
  });
}
