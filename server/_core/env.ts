// 启动时校验必填环境变量，缺失则立即报错
if (process.env.NODE_ENV === "production") {
  const required = ["JWT_SECRET", "DATABASE_URL"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`[ENV] Missing required environment variables: ${missing.join(", ")}`);
  }
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  siteUrl: process.env.SITE_URL || "https://get8.pro",
  // Telegram Bot 推送（可选）
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramChannelId: process.env.TELEGRAM_CHANNEL_ID ?? "",
  // RSS 抓取开关（默认开启）
  rssEnabled: process.env.RSS_ENABLED !== "false",
  // 敏感词库自动更新间隔（小时，默认 24 小时）
  // 可通过环境变量 WORD_UPDATE_INTERVAL_HOURS 调整，设为 0 可禁用自动更新
  wordUpdateIntervalHours: parseInt(process.env.WORD_UPDATE_INTERVAL_HOURS ?? "24", 10),
  // DeepSeek AI（文章生成、翻译）
  deepseekApiKey: process.env.DEEPSEEK_API_KEY ?? "",
  deepseekApiUrl: process.env.DEEPSEEK_API_URL ?? "https://api.deepseek.com/v1",
  // 通义千问（阿里云百炼）内容审核
  qwenApiKey: process.env.QWEN_API_KEY ?? "",
  qwenApiUrl: process.env.QWEN_API_URL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1",
};
