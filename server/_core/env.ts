import "./loadEnv";

function normalizeEnvString(value: string | undefined): string {
  if (!value) return "";

  const trimmed = value.trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

if (process.env.NODE_ENV === "production") {
  const required = ["JWT_SECRET", "DATABASE_URL"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`[ENV] Missing required environment variables: ${missing.join(", ")}`);
  }
}

export const ENV = {
  appId: normalizeEnvString(process.env.VITE_APP_ID),
  cookieSecret: normalizeEnvString(process.env.JWT_SECRET),
  databaseUrl: normalizeEnvString(process.env.DATABASE_URL),
  oAuthServerUrl: normalizeEnvString(process.env.OAUTH_SERVER_URL),
  ownerOpenId: normalizeEnvString(process.env.OWNER_OPEN_ID),
  adminPassword: normalizeEnvString(process.env.ADMIN_PASSWORD),
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: normalizeEnvString(process.env.BUILT_IN_FORGE_API_URL),
  forgeApiKey: normalizeEnvString(process.env.BUILT_IN_FORGE_API_KEY),
  siteUrl: normalizeEnvString(process.env.SITE_URL) || "https://get8.pro",
  telegramBotToken: normalizeEnvString(process.env.TELEGRAM_BOT_TOKEN),
  telegramChannelId: normalizeEnvString(process.env.TELEGRAM_CHANNEL_ID),
  rssEnabled: process.env.RSS_ENABLED !== "false",
  wordUpdateIntervalHours: parseInt(process.env.WORD_UPDATE_INTERVAL_HOURS ?? "24", 10),
  deepseekApiKey: normalizeEnvString(process.env.DEEPSEEK_API_KEY),
  deepseekApiUrl: normalizeEnvString(process.env.DEEPSEEK_API_URL) || "https://api.deepseek.com/v1",
  qwenApiKey: normalizeEnvString(process.env.QWEN_API_KEY),
  qwenApiUrl:
    normalizeEnvString(process.env.QWEN_API_URL) ||
    "https://dashscope.aliyuncs.com/compatible-mode/v1",
};
