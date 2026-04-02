const path = require("path");
const dotenv = require("dotenv");
const http = require("http");
const https = require("https");
const express = require("express");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.runtime"), override: true });

const TEAMXZ_BASE_URL = (process.env.TEAMXZ_BASE_URL || "https://teamxz.store").replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 15000);
const OPENAPI_PATH = process.env.TEAMXZ_OPENAPI_PATH || "/openapi.json";
const HEALTH_PATH = process.env.TEAMXZ_HEALTH_PATH || "/health";
const USER_AGENT = process.env.UPSTREAM_USER_AGENT || "AccessConsoleProxy/1.0";

const DEFAULT_PATHS = {
  freeSpots: ["/redeem/free-spots", "/free-spots", "/api/redeem/free-spots"],
  redeemConfirm: ["/redeem/confirm", "/redeem/redeem", "/api/redeem/confirm"],
  warrantyQuery: ["/redeem/warranty/query", "/redeem/warranty/status", "/api/redeem/warranty/query"],
  warrantyRedeem: ["/redeem/warranty/redeem", "/redeem/warranty/rejoin", "/api/redeem/warranty/redeem"]
};

const endpointCache = {
  freeSpots: [...DEFAULT_PATHS.freeSpots],
  redeemConfirm: [...DEFAULT_PATHS.redeemConfirm],
  warrantyQuery: [...DEFAULT_PATHS.warrantyQuery],
  warrantyRedeem: [...DEFAULT_PATHS.warrantyRedeem],
  discoveredAt: null
};

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function parseCandidateEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) return [...fallback];

  return unique(
    raw
      .split(",")
      .map((item) => item.trim())
      .map((item) => (item.startsWith("/") ? item : `/${item}`))
  );
}

endpointCache.redeemConfirm = parseCandidateEnv("TEAMXZ_REDEEM_CONFIRM_PATHS", DEFAULT_PATHS.redeemConfirm);
endpointCache.warrantyQuery = parseCandidateEnv("TEAMXZ_WARRANTY_QUERY_PATHS", DEFAULT_PATHS.warrantyQuery);
endpointCache.warrantyRedeem = parseCandidateEnv("TEAMXZ_WARRANTY_REDEEM_PATHS", DEFAULT_PATHS.warrantyRedeem);
endpointCache.freeSpots = parseCandidateEnv("TEAMXZ_FREE_SPOTS_PATHS", DEFAULT_PATHS.freeSpots);

function getHeaderValue(headers, name) {
  const raw = headers?.[name.toLowerCase()] ?? headers?.[name];
  if (Array.isArray(raw)) return raw.join(", ");
  return String(raw || "");
}

function requestRaw(url, init = {}) {
  const target = new URL(url);
  const transport = target.protocol === "https:" ? https : http;
  const method = String(init.method || "GET").toUpperCase();
  const body = init.body ? String(init.body) : "";
  const headers = {
    "User-Agent": USER_AGENT,
    ...(init.headers || {})
  };

  if (body && !headers["Content-Length"] && !headers["content-length"]) {
    headers["Content-Length"] = Buffer.byteLength(body);
  }

  return new Promise((resolve, reject) => {
    const req = transport.request(
      target,
      {
        method,
        headers,
        timeout: REQUEST_TIMEOUT_MS
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        res.on("end", () => {
          resolve({
            status: Number(res.statusCode || 0),
            headers: res.headers || {},
            body: Buffer.concat(chunks).toString("utf8")
          });
        });
      }
    );

    req.on("timeout", () => req.destroy(new Error("Request timeout")));
    req.on("error", reject);

    if (body) req.write(body);
    req.end();
  });
}

async function fetchJson(url, init = {}) {
  const raw = await requestRaw(url, init);
  const contentType = getHeaderValue(raw.headers, "content-type");
  const response = {
    status: raw.status,
    ok: raw.status >= 200 && raw.status < 300,
    headers: {
      get: (name) => getHeaderValue(raw.headers, name)
    }
  };

  let parsed;
  if (contentType.includes("application/json")) {
    try {
      parsed = JSON.parse(raw.body || "{}");
    } catch (_error) {
      parsed = { detail: raw.body };
    }
  } else {
    parsed = { detail: raw.body };
  }

  return { response, parsed, contentType };
}

function isHtmlLikeResponse(contentType, payload) {
  if ((contentType || "").includes("text/html")) return true;
  return typeof payload?.detail === "string" && /^\s*<!DOCTYPE/i.test(payload.detail);
}

function normalizeErrorMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;

  return payload.error || payload.detail || payload.message || payload.title || fallback;
}

function extractLandingMeta(html) {
  const source = String(html || "");
  const spotsMatch = source.match(/剩余车位[:：]\s*(\d+)/);

  return {
    remainingSpots: spotsMatch ? Number(spotsMatch[1]) : null
  };
}

function summarizePayload(operation, payload) {
  if (!payload || typeof payload !== "object") {
    return {
      operation,
      summary: payload || null
    };
  }

  const teamInfo = payload.team_info || {};
  const warrantyInfo = payload.warranty_info || {};
  const teams = Array.isArray(payload.teams) ? payload.teams : [];

  return {
    operation,
    success: payload.success,
    summary: payload.message || payload.error || payload.detail || payload.title || null,
    teamName: teamInfo.team_name || null,
    subscriptionPlan: teamInfo.subscription_plan || null,
    remainingDays: warrantyInfo.remaining_days ?? null,
    usedByEmail: warrantyInfo.used_by_email || null,
    maintenanceTitle: payload.title || null,
    maintenanceDetail: payload.detail || payload.content || null,
    maintenanceEndTime: payload.end_time || null,
    maintenanceRemainingSeconds: payload.remaining_seconds ?? null,
    freeSpotCount: teams.length,
    rawKeys: Object.keys(payload)
  };
}

async function discoverEndpoints() {
  try {
    const { response, parsed } = await fetchJson(`${TEAMXZ_BASE_URL}${OPENAPI_PATH}`);
    if (!response.ok || !parsed?.paths) return;

    const paths = Object.keys(parsed.paths);
    const aliasMap = {
      freeSpots: ["free", "spot"],
      redeemConfirm: ["confirm", "redeem"],
      warrantyQuery: ["warranty", "query"],
      warrantyRedeem: ["warranty", "redeem"]
    };

    for (const [key, aliases] of Object.entries(aliasMap)) {
      const matches = paths.filter((pathname) =>
        aliases.every((fragment) => pathname.toLowerCase().includes(fragment))
      );

      endpointCache[key] = unique([...matches, ...endpointCache[key]]);
    }

    endpointCache.discoveredAt = new Date().toISOString();
  } catch (_error) {
    // Keep the last-known candidates if discovery fails.
  }
}

async function forwardWithFallback(cacheKey, payload) {
  await discoverEndpoints();

  const candidates = endpointCache[cacheKey] || [];
  const attempts = [];

  for (const pathname of candidates) {
    try {
      const { response, parsed, contentType } = await fetchJson(`${TEAMXZ_BASE_URL}${pathname}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      attempts.push({
        pathname,
        status: response.status,
        ok: response.ok
      });

      if (isHtmlLikeResponse(contentType, parsed)) {
        continue;
      }

      if (response.ok || ![404, 405].includes(response.status)) {
        return {
          ok: response.ok,
          status: response.status,
          body: parsed,
          pathname,
          attempts
        };
      }
    } catch (error) {
      attempts.push({
        pathname,
        status: "network_error",
        ok: false,
        error: error.name || "fetch_error"
      });
    }
  }

  return {
    ok: false,
    status: 502,
    body: {
      success: false,
      error: "No working upstream endpoint was found."
    },
    pathname: null,
    attempts
  };
}

async function forwardGetWithFallback(cacheKey) {
  await discoverEndpoints();

  const candidates = endpointCache[cacheKey] || [];
  const attempts = [];

  for (const pathname of candidates) {
    try {
      const { response, parsed, contentType } = await fetchJson(`${TEAMXZ_BASE_URL}${pathname}`, {
        method: "GET"
      });

      attempts.push({
        pathname,
        status: response.status,
        ok: response.ok
      });

      if (isHtmlLikeResponse(contentType, parsed)) {
        continue;
      }

      if (response.ok || ![404, 405].includes(response.status)) {
        return {
          ok: response.ok,
          status: response.status,
          body: parsed,
          pathname,
          attempts
        };
      }
    } catch (error) {
      attempts.push({
        pathname,
        status: "network_error",
        ok: false,
        error: error.name || "fetch_error"
      });
    }
  }

  return {
    ok: false,
    status: 502,
    body: {
      success: false,
      error: "No working upstream endpoint was found."
    },
    pathname: null,
    attempts
  };
}

function buildApp() {
  const app = express();

  app.use(express.json());
  app.use(express.static(path.join(__dirname, "public")));

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validateCode(code) {
    return typeof code === "string" && code.trim().length >= 4;
  }

  app.get("/api/health", async (_req, res) => {
    let upstreamOk = false;
    let upstreamStatus = null;

    try {
      const { response } = await fetchJson(`${TEAMXZ_BASE_URL}${HEALTH_PATH}`);
      upstreamStatus = response.status;
      upstreamOk = response.ok;
    } catch (_error) {
      upstreamOk = false;
    }

    res.json({
      ok: true,
      service: "codex-business",
      upstream: TEAMXZ_BASE_URL,
      upstreamHealthPath: HEALTH_PATH,
      upstreamReachable: upstreamOk,
      upstreamStatus,
      discoveredAt: endpointCache.discoveredAt,
      endpoints: {
        freeSpots: endpointCache.freeSpots,
        redeemConfirm: endpointCache.redeemConfirm,
        warrantyQuery: endpointCache.warrantyQuery,
        warrantyRedeem: endpointCache.warrantyRedeem
      }
    });
  });

  app.get("/api/free-spots", async (_req, res) => {
    const upstream = await forwardGetWithFallback("freeSpots");
    const teams = Array.isArray(upstream.body?.teams) ? upstream.body.teams : [];

    return res.status(upstream.status).json({
      ...upstream.body,
      count: teams.length,
      proxy_meta: {
        upstream_path: upstream.pathname,
        attempts: upstream.attempts,
        normalized: summarizePayload("freeSpots", upstream.body)
      }
    });
  });

  app.get("/api/page-meta", async (_req, res) => {
    try {
      const { response, parsed } = await fetchJson(`${TEAMXZ_BASE_URL}/`);
      const html = typeof parsed?.detail === "string" ? parsed.detail : "";
      const meta = extractLandingMeta(html);

      return res.status(response.status).json({
        success: response.ok,
        remaining_spots: meta.remainingSpots,
        proxy_meta: {
          source: "/",
          extracted: meta
        }
      });
    } catch (_error) {
      return res.status(502).json({
        success: false,
        error: "无法获取上游首页信息。"
      });
    }
  });

  app.post("/api/redeem/confirm", async (req, res) => {
    const email = String(req.body?.email || "").trim();
    const code = String(req.body?.code || "").trim();
    const teamId = req.body?.team_id ?? null;

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "请输入正确的邮箱地址。"
      });
    }

    if (!validateCode(code)) {
      return res.status(400).json({
        success: false,
        error: "请输入有效的兑换码。"
      });
    }

    const upstream = await forwardWithFallback("redeemConfirm", {
      email,
      code,
      team_id: teamId
    });

    return res.status(upstream.status).json({
      ...upstream.body,
      proxy_meta: {
        upstream_path: upstream.pathname,
        attempts: upstream.attempts,
        normalized: summarizePayload("redeemConfirm", upstream.body)
      }
    });
  });

  app.post("/api/warranty/query", async (req, res) => {
    const code = String(req.body?.code || "").trim();

    if (!validateCode(code)) {
      return res.status(400).json({
        success: false,
        error: "请输入有效的兑换码。"
      });
    }

    const upstream = await forwardWithFallback("warrantyQuery", { code });

    return res.status(upstream.status).json({
      ...upstream.body,
      proxy_meta: {
        upstream_path: upstream.pathname,
        attempts: upstream.attempts,
        normalized: summarizePayload("warrantyQuery", upstream.body)
      }
    });
  });

  app.post("/api/warranty/redeem", async (req, res) => {
    const email = String(req.body?.email || "").trim();
    const code = String(req.body?.code || "").trim();

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "请输入正确的邮箱地址。"
      });
    }

    if (!validateCode(code)) {
      return res.status(400).json({
        success: false,
        error: "请输入有效的兑换码。"
      });
    }

    const upstream = await forwardWithFallback("warrantyRedeem", { email, code });

    return res.status(upstream.status).json({
      ...upstream.body,
      proxy_meta: {
        upstream_path: upstream.pathname,
        attempts: upstream.attempts,
        normalized: summarizePayload("warrantyRedeem", upstream.body)
      }
    });
  });

  app.use("/api/*", (_req, res) => {
    res.status(404).json({
      success: false,
      error: "API route not found."
    });
  });

  app.use((err, _req, res, _next) => {
    const status = Number(err.status || 500);
    const fallback = status >= 500 ? "Internal server error." : "Request failed.";
    const message = normalizeErrorMessage(err, fallback);

    res.status(status).json({
      success: false,
      error: message
    });
  });

  return app;
}

module.exports = {
  buildApp,
  TEAMXZ_BASE_URL
};
