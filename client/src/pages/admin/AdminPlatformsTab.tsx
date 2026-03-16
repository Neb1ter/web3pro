import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Platform = {
  id: number;
  platform: string;
  name: string;
  icon: string;
  isEnabled: boolean | null;
  apiKey: string | null;
  apiSecret: string | null;
  channelId: string | null;
  extraConfig: string | null;
  autoPublish: boolean | null;
  autoPublishNews: boolean | null;
  sensitiveStandard: string | null;
};

// ─── 每个平台的详细配置说明 ────────────────────────────────────────────────────
// 新增平台时只需在此对象中追加一条记录即可，无需修改其他代码。
const PLATFORM_META: Record<string, {
  icon: string;
  category: "cn" | "intl" | "tool";
  categoryLabel: { zh: string; en: string };
  status: "live" | "dev" | "planned";
  statusNote: { zh: string; en: string };
  description: { zh: string; en: string };
  apiGuideUrl: string;
  apiGuideLabel: { zh: string; en: string };
  fields: {
    apiKey:     { label: { zh: string; en: string }; placeholder: string; hint: { zh: string; en: string } };
    apiSecret?: { label: { zh: string; en: string }; placeholder: string; hint: { zh: string; en: string } };
    channelId:  { label: { zh: string; en: string }; placeholder: string; hint: { zh: string; en: string } };
  };
}> = {
  // ── 已完整实现 ────────────────────────────────────────────────────────────
  telegram: {
    icon: "✈️",
    category: "intl",
    categoryLabel: { zh: "即时通讯", en: "Messaging" },
    status: "live",
    statusNote: { zh: "✅ 已支持推送文章和快讯", en: "✅ Article & news push supported" },
    description: {
      zh: "通过 Telegram Bot 向频道推送文章和快讯。需先在 @BotFather 创建 Bot，再将 Bot 添加为频道管理员。",
      en: "Push articles and news to a Telegram channel via Bot. Create a Bot via @BotFather first, then add it as a channel admin.",
    },
    apiGuideUrl: "https://core.telegram.org/bots#how-do-i-create-a-bot",
    apiGuideLabel: { zh: "创建 Bot 教程 →", en: "Create Bot Guide →" },
    fields: {
      apiKey: {
        label: { zh: "Bot Token", en: "Bot Token" },
        placeholder: "8708899187:AAF-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        hint: { zh: "在 @BotFather 发送 /newbot 后获得，格式：数字:字母串", en: "Obtained from @BotFather via /newbot command" },
      },
      channelId: {
        label: { zh: "频道 ID / 用户名", en: "Channel ID / Username" },
        placeholder: "@get8pro 或 -1001234567890",
        hint: { zh: "公开频道填 @用户名，私密频道填 -100 开头的数字 ID（可通过 @userinfobot 获取）", en: "Public: @username, Private: numeric ID starting with -100" },
      },
    },
  },

  // ── 中文社交媒体 ──────────────────────────────────────────────────────────
  wechat: {
    icon: "💬",
    category: "cn",
    categoryLabel: { zh: "中文社交", en: "CN Social" },
    status: "dev",
    statusNote: { zh: "🔧 开发中，配置后可快速接入", en: "🔧 In development, ready to integrate" },
    description: {
      zh: "通过微信公众号图文消息 API 发布文章。需在微信公众平台开通「服务号」并申请接口权限，个人订阅号不支持 API 推送。",
      en: "Publish articles via WeChat Official Account API. Requires a verified Service Account (订阅号 does not support API push).",
    },
    apiGuideUrl: "https://mp.weixin.qq.com/",
    apiGuideLabel: { zh: "微信公众平台 →", en: "WeChat MP Platform →" },
    fields: {
      apiKey: {
        label: { zh: "AppID", en: "AppID" },
        placeholder: "wx1234567890abcdef",
        hint: { zh: "在公众平台「开发 → 基本配置」页面获取", en: "Found in MP Platform → Development → Basic Config" },
      },
      apiSecret: {
        label: { zh: "AppSecret", en: "AppSecret" },
        placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        hint: { zh: "与 AppID 在同一页面，点击「重置」生成，注意保密", en: "Same page as AppID, click Reset to generate, keep secret" },
      },
      channelId: {
        label: { zh: "公众号原始 ID（可选）", en: "Official Account ID (optional)" },
        placeholder: "gh_xxxxxxxxxxxxxxxx",
        hint: { zh: "用于区分多公众号场景，单账号可不填", en: "For multi-account scenarios, optional for single account" },
      },
    },
  },

  weibo: {
    icon: "🌐",
    category: "cn",
    categoryLabel: { zh: "中文社交", en: "CN Social" },
    status: "dev",
    statusNote: { zh: "🔧 开发中，配置后可快速接入", en: "🔧 In development, ready to integrate" },
    description: {
      zh: "通过微博开放平台 API 发布微博内容。需在微博开放平台创建应用并申请「写入权限」，审核周期约 7-14 天。",
      en: "Post to Weibo via Open Platform API. Create an app on Weibo Open Platform and apply for write permission (7-14 day review).",
    },
    apiGuideUrl: "https://open.weibo.com/development/",
    apiGuideLabel: { zh: "微博开放平台 →", en: "Weibo Open Platform →" },
    fields: {
      apiKey: {
        label: { zh: "Access Token", en: "Access Token" },
        placeholder: "2.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        hint: { zh: "通过 OAuth 2.0 授权流程获取，有效期 5 年", en: "Obtained via OAuth 2.0 flow, valid for 5 years" },
      },
      channelId: {
        label: { zh: "微博 UID（可选）", en: "Weibo UID (optional)" },
        placeholder: "1234567890",
        hint: { zh: "账号的数字 ID，可在个人主页 URL 中找到", en: "Numeric account ID found in profile URL" },
      },
    },
  },

  douyin: {
    icon: "🎵",
    category: "cn",
    categoryLabel: { zh: "中文社交", en: "CN Social" },
    status: "dev",
    statusNote: { zh: "🔧 开发中，配置后可快速接入", en: "🔧 In development, ready to integrate" },
    description: {
      zh: "通过抖音开放平台发布视频/图文内容。需在开放平台创建应用，抖音对文字内容推送限制较多，建议搭配图片使用。",
      en: "Publish content via Douyin Open Platform. Text-only posts have restrictions; pairing with images is recommended.",
    },
    apiGuideUrl: "https://open.douyin.com/",
    apiGuideLabel: { zh: "抖音开放平台 →", en: "Douyin Open Platform →" },
    fields: {
      apiKey: {
        label: { zh: "Client Key", en: "Client Key" },
        placeholder: "awxxxxxxxxxxxxxxxxxxxxxxxx",
        hint: { zh: "在开放平台「应用管理」中获取", en: "Found in Open Platform → App Management" },
      },
      apiSecret: {
        label: { zh: "Client Secret", en: "Client Secret" },
        placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        hint: { zh: "与 Client Key 在同一页面，注意保密", en: "Same page as Client Key, keep secret" },
      },
      channelId: {
        label: { zh: "Open ID（可选）", en: "Open ID (optional)" },
        placeholder: "_000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        hint: { zh: "用户授权后获得的唯一标识，用于指定发布账号", en: "Unique ID obtained after user authorization" },
      },
    },
  },

  // ── 国际社交媒体 ──────────────────────────────────────────────────────────
  twitter: {
    icon: "🐦",
    category: "intl",
    categoryLabel: { zh: "国际社交", en: "Intl Social" },
    status: "dev",
    statusNote: { zh: "🔧 开发中，配置后可快速接入", en: "🔧 In development, ready to integrate" },
    description: {
      zh: "通过 Twitter API v2 发推文。需在 developer.twitter.com 创建项目并申请「Elevated」权限，免费版每月限 1500 条推文。",
      en: "Post tweets via Twitter API v2. Create a project on developer.twitter.com and apply for Elevated access (free tier: 1500 tweets/month).",
    },
    apiGuideUrl: "https://developer.twitter.com/en/portal/dashboard",
    apiGuideLabel: { zh: "Twitter 开发者平台 →", en: "Twitter Developer Portal →" },
    fields: {
      apiKey: {
        label: { zh: "API Key (Consumer Key)", en: "API Key (Consumer Key)" },
        placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        hint: { zh: "在开发者平台「Keys and Tokens」页面获取", en: "Found in Developer Portal → Keys and Tokens" },
      },
      apiSecret: {
        label: { zh: "API Secret (Consumer Secret)", en: "API Secret (Consumer Secret)" },
        placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        hint: { zh: "与 API Key 在同一页面，用于 OAuth 1.0a 签名", en: "Same page as API Key, used for OAuth 1.0a signing" },
      },
      channelId: {
        label: { zh: "Access Token（可选）", en: "Access Token (optional)" },
        placeholder: "1234567890-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        hint: { zh: "用于代表特定账号发推，填入 Access Token（非 Bearer Token）", en: "To post as a specific account, use Access Token (not Bearer Token)" },
      },
    },
  },

  discord: {
    icon: "🎮",
    category: "intl",
    categoryLabel: { zh: "社区平台", en: "Community" },
    status: "dev",
    statusNote: { zh: "🔧 开发中，配置后可快速接入", en: "🔧 In development, ready to integrate" },
    description: {
      zh: "通过 Discord Webhook 向服务器频道推送消息。在 Discord 频道设置中创建 Webhook，无需 Bot 审核，配置最简单。",
      en: "Push messages to a Discord server channel via Webhook. Create a Webhook in channel settings — no Bot review needed, simplest setup.",
    },
    apiGuideUrl: "https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks",
    apiGuideLabel: { zh: "Webhook 创建教程 →", en: "Webhook Setup Guide →" },
    fields: {
      apiKey: {
        label: { zh: "Webhook URL（填入 API Key 字段）", en: "Webhook URL (put in API Key field)" },
        placeholder: "https://discord.com/api/webhooks/1234567890/xxxxxxxxxxxxxxxxxxxxxxxx",
        hint: { zh: "频道设置 → 整合 → Webhook → 新建 Webhook → 复制 URL", en: "Channel Settings → Integrations → Webhooks → New Webhook → Copy URL" },
      },
      channelId: {
        label: { zh: "频道 ID（可选，用于标识）", en: "Channel ID (optional, for reference)" },
        placeholder: "1234567890123456789",
        hint: { zh: "在 Discord 开发者模式下右键频道可复制 ID，仅用于记录，推送使用 Webhook URL", en: "Right-click channel in Developer Mode to copy ID, for reference only" },
      },
    },
  },

  slack: {
    icon: "💼",
    category: "tool",
    categoryLabel: { zh: "协作工具", en: "Collaboration" },
    status: "dev",
    statusNote: { zh: "🔧 开发中，配置后可快速接入", en: "🔧 In development, ready to integrate" },
    description: {
      zh: "通过 Slack Incoming Webhook 向工作区频道推送消息，适合团队内部通知。在 Slack App 管理页面创建 Incoming Webhook。",
      en: "Push messages to a Slack workspace channel via Incoming Webhook, ideal for internal team notifications.",
    },
    apiGuideUrl: "https://api.slack.com/messaging/webhooks",
    apiGuideLabel: { zh: "Slack Webhook 文档 →", en: "Slack Webhook Docs →" },
    fields: {
      apiKey: {
        label: { zh: "Webhook URL（填入 API Key 字段）", en: "Webhook URL (put in API Key field)" },
        placeholder: "（在 Slack App 设置页面生成 Webhook URL 后粘贴到此处）",
        hint: { zh: "在 Slack App 设置 → Incoming Webhooks 中生成", en: "Generated in Slack App Settings → Incoming Webhooks" },
      },
      channelId: {
        label: { zh: "频道名称（可选）", en: "Channel Name (optional)" },
        placeholder: "#general",
        hint: { zh: "Webhook 已绑定频道，此字段仅用于记录", en: "Webhook is already bound to a channel, this field is for reference only" },
      },
    },
  },

  reddit: {
    icon: "🤖",
    category: "intl",
    categoryLabel: { zh: "社区平台", en: "Community" },
    status: "dev",
    statusNote: { zh: "🔧 开发中，配置后可快速接入", en: "🔧 In development, ready to integrate" },
    description: {
      zh: "通过 Reddit API 向指定 subreddit 发帖。需在 reddit.com/prefs/apps 创建应用（选 script 类型），适合发布加密货币相关讨论。",
      en: "Post to a subreddit via Reddit API. Create a 'script' type app at reddit.com/prefs/apps. Good for crypto community discussions.",
    },
    apiGuideUrl: "https://www.reddit.com/prefs/apps",
    apiGuideLabel: { zh: "创建 Reddit App →", en: "Create Reddit App →" },
    fields: {
      apiKey: {
        label: { zh: "Client ID", en: "Client ID" },
        placeholder: "xxxxxxxxxxxxxxxxxxxxxx",
        hint: { zh: "在 reddit.com/prefs/apps 创建应用后，显示在应用名称下方的短字符串", en: "Short string shown below the app name after creating at reddit.com/prefs/apps" },
      },
      apiSecret: {
        label: { zh: "Client Secret", en: "Client Secret" },
        placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        hint: { zh: "与 Client ID 在同一页面，点击「edit」后可见", en: "Same page as Client ID, visible after clicking 'edit'" },
      },
      channelId: {
        label: { zh: "目标 Subreddit", en: "Target Subreddit" },
        placeholder: "r/CryptoCurrency",
        hint: { zh: "填写目标社区名称，如 r/CryptoCurrency 或 r/Bitcoin", en: "Target community name, e.g. r/CryptoCurrency or r/Bitcoin" },
      },
    },
  },

  line: {
    icon: "💚",
    category: "intl",
    categoryLabel: { zh: "即时通讯", en: "Messaging" },
    status: "dev",
    statusNote: { zh: "🔧 开发中，配置后可快速接入", en: "🔧 In development, ready to integrate" },
    description: {
      zh: "通过 LINE Messaging API 向 LINE 官方账号的好友群发消息，适合日本、台湾、东南亚市场。需在 LINE Developers 创建 Messaging API Channel。",
      en: "Broadcast messages to LINE Official Account followers via Messaging API. Ideal for Japan, Taiwan, and Southeast Asian markets.",
    },
    apiGuideUrl: "https://developers.line.biz/en/docs/messaging-api/",
    apiGuideLabel: { zh: "LINE Messaging API 文档 →", en: "LINE Messaging API Docs →" },
    fields: {
      apiKey: {
        label: { zh: "Channel Access Token", en: "Channel Access Token" },
        placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        hint: { zh: "在 LINE Developers Console → Channel → Messaging API 页面生成长期 Token", en: "Generate a long-lived token in LINE Developers Console → Channel → Messaging API" },
      },
      channelId: {
        label: { zh: "Channel ID（可选）", en: "Channel ID (optional)" },
        placeholder: "1234567890",
        hint: { zh: "Channel 的数字 ID，在 Console 首页可见，仅用于记录", en: "Numeric Channel ID visible on Console homepage, for reference only" },
      },
    },
  },

  instagram: {
    icon: "📸",
    category: "intl",
    categoryLabel: { zh: "国际社交", en: "Intl Social" },
    status: "dev",
    statusNote: { zh: "🔧 开发中，注意：仅支持图文帖子", en: "🔧 In development, note: image posts only" },
    description: {
      zh: "通过 Meta Graph API 发布 Instagram 帖子。注意：Instagram API 仅支持图片/视频帖子，纯文字内容需搭配图片。需要 Facebook 商业账号关联。",
      en: "Publish Instagram posts via Meta Graph API. Note: API only supports image/video posts; text-only content requires an image. Requires linked Facebook Business account.",
    },
    apiGuideUrl: "https://developers.facebook.com/docs/instagram-api",
    apiGuideLabel: { zh: "Instagram Graph API 文档 →", en: "Instagram Graph API Docs →" },
    fields: {
      apiKey: {
        label: { zh: "Access Token", en: "Access Token" },
        placeholder: "EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        hint: { zh: "在 Meta Business Suite 或 Graph API Explorer 获取长期 Token（60天有效，需定期刷新）", en: "Get a long-lived token from Meta Business Suite or Graph API Explorer (valid 60 days, needs refresh)" },
      },
      channelId: {
        label: { zh: "Instagram Business Account ID", en: "Instagram Business Account ID" },
        placeholder: "17841400000000000",
        hint: { zh: "在 Graph API Explorer 调用 /me?fields=instagram_business_account 获取", en: "Get via Graph API Explorer: /me?fields=instagram_business_account" },
      },
    },
  },

  facebook: {
    icon: "👍",
    category: "intl",
    categoryLabel: { zh: "国际社交", en: "Intl Social" },
    status: "dev",
    statusNote: { zh: "🔧 开发中，配置后可快速接入", en: "🔧 In development, ready to integrate" },
    description: {
      zh: "通过 Meta Graph API 向 Facebook 主页发布帖子。需要 Facebook 主页管理员权限，申请 pages_manage_posts 权限后可自动发帖。",
      en: "Publish posts to a Facebook Page via Meta Graph API. Requires Page admin access and the pages_manage_posts permission.",
    },
    apiGuideUrl: "https://developers.facebook.com/docs/pages-api",
    apiGuideLabel: { zh: "Facebook Pages API 文档 →", en: "Facebook Pages API Docs →" },
    fields: {
      apiKey: {
        label: { zh: "Page Access Token", en: "Page Access Token" },
        placeholder: "EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        hint: { zh: "在 Graph API Explorer 选择对应主页后获取，注意区分「用户 Token」和「主页 Token」", en: "Get from Graph API Explorer by selecting the target Page; note the difference between User Token and Page Token" },
      },
      channelId: {
        label: { zh: "Facebook Page ID", en: "Facebook Page ID" },
        placeholder: "123456789012345",
        hint: { zh: "在主页「关于」页面或 Graph API Explorer 调用 /me 获取", en: "Found on Page's About section or via /me in Graph API Explorer" },
      },
    },
  },

  notion: {
    icon: "📝",
    category: "tool",
    categoryLabel: { zh: "协作工具", en: "Collaboration" },
    status: "dev",
    statusNote: { zh: "🔧 开发中，适合归档和内容管理", en: "🔧 In development, ideal for archiving & content management" },
    description: {
      zh: "通过 Notion API 将文章自动归档到 Notion 数据库，适合内容团队管理和审阅。需在 notion.so/my-integrations 创建 Integration 并共享目标数据库。",
      en: "Auto-archive articles to a Notion database via Notion API. Ideal for content team management and review. Create an Integration at notion.so/my-integrations and share the target database.",
    },
    apiGuideUrl: "https://developers.notion.com/docs/getting-started",
    apiGuideLabel: { zh: "Notion API 入门文档 →", en: "Notion API Getting Started →" },
    fields: {
      apiKey: {
        label: { zh: "Integration Token (Internal)", en: "Integration Token (Internal)" },
        placeholder: "secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        hint: { zh: "在 notion.so/my-integrations 创建 Internal Integration 后获取，以 secret_ 开头", en: "Obtained after creating an Internal Integration at notion.so/my-integrations, starts with secret_" },
      },
      channelId: {
        label: { zh: "Database ID", en: "Database ID" },
        placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        hint: { zh: "打开目标数据库页面，URL 中 notion.so/ 后的 32 位字符串即为 Database ID，需先在数据库中共享给 Integration", en: "32-char string after notion.so/ in the database URL; must share the database with your Integration first" },
      },
    },
  },
};

// ─── 状态颜色映射 ──────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  live:    "bg-green-900/60 text-green-300 border border-green-700/40",
  dev:     "bg-yellow-900/40 text-yellow-300 border border-yellow-700/30",
  planned: "bg-slate-700/60 text-slate-400 border border-slate-600/30",
};

const CATEGORY_COLORS = {
  cn:   "bg-red-900/30 text-red-300",
  intl: "bg-blue-900/30 text-blue-300",
  tool: "bg-purple-900/30 text-purple-300",
};

// ─── 组件 ──────────────────────────────────────────────────────────────────────
export function PlatformsTab({ zh }: { zh: boolean }) {
  const listQuery = trpc.platforms.list.useQuery();
  const updateMutation = trpc.platforms.update.useMutation({
    onSuccess: () => { toast.success(zh ? "已保存" : "Saved"); listQuery.refetch(); setEditing(null); },
    onError: (e) => toast.error(e.message),
  });
  const testMutation = trpc.platforms.test.useMutation({
    onSuccess: (data) => toast.success(data.message),
    onError: (e) => toast.error(e.message),
  });

  const [editing, setEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Platform>>({});
  const [filterCategory, setFilterCategory] = useState<"all" | "cn" | "intl" | "tool">("all");

  const platforms = (listQuery.data ?? []) as Platform[];
  const filtered = filterCategory === "all"
    ? platforms
    : platforms.filter(p => (PLATFORM_META[p.platform]?.category ?? "intl") === filterCategory);

  const startEdit = (p: Platform) => {
    setEditing(p.id);
    setEditForm({
      isEnabled: p.isEnabled ?? false,
      apiKey: p.apiKey ?? "",
      apiSecret: p.apiSecret ?? "",
      channelId: p.channelId ?? "",
      autoPublish: p.autoPublish ?? false,
      autoPublishNews: p.autoPublishNews ?? false,
      sensitiveStandard: p.sensitiveStandard ?? "general",
    });
  };

  const categoryTabs: { id: "all" | "cn" | "intl" | "tool"; label: string }[] = [
    { id: "all",  label: zh ? "全部平台" : "All" },
    { id: "intl", label: zh ? "国际平台" : "International" },
    { id: "cn",   label: zh ? "中文平台" : "Chinese" },
    { id: "tool", label: zh ? "协作工具" : "Collaboration" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-white">{zh ? "📡 媒体平台推送管理" : "📡 Media Platforms"}</h2>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className={`px-2 py-0.5 rounded ${STATUS_COLORS.live}`}>{zh ? "已支持" : "Live"}</span>
          <span className={`px-2 py-0.5 rounded ${STATUS_COLORS.dev}`}>{zh ? "开发中" : "Dev"}</span>
          <span className={`px-2 py-0.5 rounded ${STATUS_COLORS.planned}`}>{zh ? "规划中" : "Planned"}</span>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-cyan-900/20 border border-cyan-700/30 rounded-xl p-4 text-sm text-cyan-300 leading-relaxed">
        {zh
          ? "💡 配置各平台的 API Key 后，可将文章和快讯自动推送到对应平台。Telegram 已完整支持；其他平台已预置占位实现，配置 API Key 后可快速接入。新增平台只需在 publish.ts 中注册一个实现类。"
          : "💡 Configure API keys to auto-push articles and news to each platform. Telegram is fully supported; others have stub implementations ready for quick integration. To add a new platform, register one class in publish.ts."}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {categoryTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setFilterCategory(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterCategory === t.id
                ? "bg-cyan-600 text-white"
                : "bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60"
            }`}
          >
            {t.label}
            {t.id !== "all" && (
              <span className="ml-1.5 text-xs opacity-60">
                ({platforms.filter(p => (PLATFORM_META[p.platform]?.category ?? "intl") === t.id).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {listQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(p => {
            const meta = PLATFORM_META[p.platform];
            const fields = meta?.fields;
            const isEditing = editing === p.id;

            return (
              <div key={p.id} className="bg-slate-800/40 border border-slate-700/40 rounded-xl overflow-hidden">
                {/* Platform header */}
                <div className="flex items-start gap-4 p-4">
                  <div className="text-3xl mt-0.5 shrink-0">{meta?.icon ?? p.icon ?? "📱"}</div>
                  <div className="flex-1 min-w-0">
                    {/* Name row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-semibold">{p.name}</h3>
                      {/* Status badge */}
                      <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[meta?.status ?? "planned"]}`}>
                        {meta?.statusNote?.[zh ? "zh" : "en"] ?? (zh ? "规划中" : "Planned")}
                      </span>
                      {/* Category badge */}
                      {meta && (
                        <span className={`text-xs px-2 py-0.5 rounded ${CATEGORY_COLORS[meta.category]}`}>
                          {meta.categoryLabel[zh ? "zh" : "en"]}
                        </span>
                      )}
                      {/* Enabled badge */}
                      <span className={`text-xs px-2 py-0.5 rounded ${p.isEnabled ? "bg-green-900/60 text-green-300" : "bg-slate-700 text-slate-500"}`}>
                        {p.isEnabled ? (zh ? "已启用" : "Enabled") : (zh ? "已禁用" : "Disabled")}
                      </span>
                      {p.autoPublish && (
                        <span className="text-xs bg-cyan-900/40 text-cyan-300 px-2 py-0.5 rounded">
                          {zh ? "自动推文章" : "Auto-article"}
                        </span>
                      )}
                      {p.autoPublishNews && (
                        <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded">
                          {zh ? "自动推快讯" : "Auto-news"}
                        </span>
                      )}
                    </div>
                    {/* Description */}
                    {meta?.description && (
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        {meta.description[zh ? "zh" : "en"]}
                      </p>
                    )}
                    {/* API guide link */}
                    {meta?.apiGuideUrl && (
                      <a
                        href={meta.apiGuideUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-1.5 text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                      >
                        {meta.apiGuideLabel[zh ? "zh" : "en"]}
                      </a>
                    )}
                  </div>
                  {/* Action buttons */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => testMutation.mutate({ platform: p.platform })}
                      disabled={testMutation.isPending || !p.isEnabled}
                      title={!p.isEnabled ? (zh ? "请先启用平台" : "Enable platform first") : ""}
                      className="admin-btn-ghost text-xs disabled:opacity-40"
                    >
                      {zh ? "🔌 测试" : "🔌 Test"}
                    </button>
                    <button
                      onClick={() => isEditing ? setEditing(null) : startEdit(p)}
                      className="admin-btn-primary text-xs"
                    >
                      {isEditing ? (zh ? "收起" : "Collapse") : (zh ? "配置" : "Configure")}
                    </button>
                  </div>
                </div>

                {/* Edit form */}
                {isEditing && (
                  <div className="border-t border-slate-700/40 p-5 bg-slate-900/30 space-y-5">
                    {/* API Key field */}
                    {fields && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* API Key */}
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-slate-300">
                            {fields.apiKey.label[zh ? "zh" : "en"]}
                          </label>
                          <input
                            type="password"
                            className="admin-input w-full text-sm"
                            value={editForm.apiKey ?? ""}
                            onChange={e => setEditForm(f => ({ ...f, apiKey: e.target.value }))}
                            placeholder={fields.apiKey.placeholder}
                          />
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {fields.apiKey.hint[zh ? "zh" : "en"]}
                          </p>
                        </div>

                        {/* API Secret (if applicable) */}
                        {fields.apiSecret ? (
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-slate-300">
                              {fields.apiSecret.label[zh ? "zh" : "en"]}
                            </label>
                            <input
                              type="password"
                              className="admin-input w-full text-sm"
                              value={editForm.apiSecret ?? ""}
                              onChange={e => setEditForm(f => ({ ...f, apiSecret: e.target.value }))}
                              placeholder={fields.apiSecret.placeholder}
                            />
                            <p className="text-xs text-slate-500 leading-relaxed">
                              {fields.apiSecret.hint[zh ? "zh" : "en"]}
                            </p>
                          </div>
                        ) : (
                          <div /> /* placeholder for grid alignment */
                        )}

                        {/* Channel ID */}
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-slate-300">
                            {fields.channelId.label[zh ? "zh" : "en"]}
                          </label>
                          <input
                            className="admin-input w-full text-sm"
                            value={editForm.channelId ?? ""}
                            onChange={e => setEditForm(f => ({ ...f, channelId: e.target.value }))}
                            placeholder={fields.channelId.placeholder}
                          />
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {fields.channelId.hint[zh ? "zh" : "en"]}
                          </p>
                        </div>

                        {/* Sensitive standard */}
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-slate-300">
                            {zh ? "合规审核标准" : "Compliance Standard"}
                          </label>
                          <select
                            className="admin-input w-full text-sm"
                            value={editForm.sensitiveStandard ?? "general"}
                            onChange={e => setEditForm(f => ({ ...f, sensitiveStandard: e.target.value }))}
                          >
                            <option value="general">{zh ? "通用标准（默认）" : "General (default)"}</option>
                            <option value="wechat">{zh ? "微信标准（最严格）" : "WeChat (strictest)"}</option>
                            <option value="weibo">{zh ? "微博标准" : "Weibo Standard"}</option>
                            <option value="douyin">{zh ? "抖音标准" : "Douyin Standard"}</option>
                            <option value="international">{zh ? "国际标准（最宽松）" : "International (most lenient)"}</option>
                          </select>
                          <p className="text-xs text-slate-500">
                            {zh
                              ? "决定推送前使用哪套敏感词库过滤内容，中文平台建议选对应标准"
                              : "Determines which sensitive word filter is applied before pushing; match to the platform's region"}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Toggles */}
                    <div className="flex gap-6 flex-wrap pt-1 border-t border-slate-700/30">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.isEnabled ?? false}
                          onChange={e => setEditForm(f => ({ ...f, isEnabled: e.target.checked }))}
                          className="w-4 h-4 accent-cyan-500"
                        />
                        <span className="text-sm text-slate-300">{zh ? "启用此平台" : "Enable platform"}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.autoPublish ?? false}
                          onChange={e => setEditForm(f => ({ ...f, autoPublish: e.target.checked }))}
                          className="w-4 h-4 accent-cyan-500"
                        />
                        <span className="text-sm text-slate-300">{zh ? "文章发布时自动推送" : "Auto-push on article publish"}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.autoPublishNews ?? false}
                          onChange={e => setEditForm(f => ({ ...f, autoPublishNews: e.target.checked }))}
                          className="w-4 h-4 accent-cyan-500"
                        />
                        <span className="text-sm text-slate-300">{zh ? "新快讯自动推送" : "Auto-push new flash news"}</span>
                      </label>
                    </div>

                    {/* Save / Cancel */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateMutation.mutate({
                          id: p.id,
                          isEnabled: editForm.isEnabled ?? undefined,
                          apiKey: editForm.apiKey ?? null,
                          apiSecret: editForm.apiSecret ?? null,
                          channelId: editForm.channelId ?? null,
                          autoPublish: editForm.autoPublish ?? undefined,
                          autoPublishNews: editForm.autoPublishNews ?? undefined,
                          sensitiveStandard: editForm.sensitiveStandard ?? undefined,
                        })}
                        disabled={updateMutation.isPending}
                        className="admin-btn-primary"
                      >
                        {updateMutation.isPending ? (zh ? "保存中..." : "Saving...") : (zh ? "💾 保存配置" : "💾 Save")}
                      </button>
                      <button onClick={() => setEditing(null)} className="admin-btn-ghost">
                        {zh ? "取消" : "Cancel"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center text-slate-500 py-8">
              {zh ? "该分类下暂无平台" : "No platforms in this category"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
