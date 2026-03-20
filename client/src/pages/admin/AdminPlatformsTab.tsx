import { useMemo, useState } from "react";
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
  autoPublish: boolean | null;
  autoPublishNews: boolean | null;
  sensitiveStandard: string | null;
};

type Capability = {
  platform: string;
  displayName: string;
  deliveryMode: "direct" | "assisted" | "planned";
  supportsArticle: boolean;
  supportsNews: boolean;
  supportsConnectionTest: boolean;
  summaryZh: string;
  summaryEn: string;
};

const PLATFORM_META: Record<
  string,
  {
    icon: string;
    category: "cn" | "intl" | "tool";
    labelZh: string;
    labelEn: string;
    apiGuideUrl?: string;
  }
> = {
  telegram: { icon: "✈️", category: "intl", labelZh: "即时通讯", labelEn: "Messaging", apiGuideUrl: "https://core.telegram.org/bots#how-do-i-create-a-bot" },
  wechat: { icon: "💬", category: "cn", labelZh: "中文社交", labelEn: "CN Social", apiGuideUrl: "https://mp.weixin.qq.com/" },
  weibo: { icon: "🌐", category: "cn", labelZh: "中文社交", labelEn: "CN Social", apiGuideUrl: "https://open.weibo.com/development/" },
  douyin: { icon: "🎵", category: "cn", labelZh: "中文社交", labelEn: "CN Social", apiGuideUrl: "https://open.douyin.com/" },
  twitter: { icon: "🐦", category: "intl", labelZh: "国际社交", labelEn: "Intl Social", apiGuideUrl: "https://developer.twitter.com/en/portal/dashboard" },
  discord: { icon: "🎮", category: "intl", labelZh: "社区平台", labelEn: "Community", apiGuideUrl: "https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks" },
  slack: { icon: "💼", category: "tool", labelZh: "协作工具", labelEn: "Collaboration", apiGuideUrl: "https://api.slack.com/messaging/webhooks" },
  reddit: { icon: "🤖", category: "intl", labelZh: "社区平台", labelEn: "Community", apiGuideUrl: "https://www.reddit.com/prefs/apps" },
  line: { icon: "💚", category: "intl", labelZh: "即时通讯", labelEn: "Messaging", apiGuideUrl: "https://developers.line.biz/en/docs/messaging-api/" },
  instagram: { icon: "📸", category: "intl", labelZh: "国际社交", labelEn: "Intl Social", apiGuideUrl: "https://developers.facebook.com/docs/instagram-api" },
  facebook: { icon: "👥", category: "intl", labelZh: "国际社交", labelEn: "Intl Social", apiGuideUrl: "https://developers.facebook.com/docs/pages-api" },
  notion: { icon: "📝", category: "tool", labelZh: "协作工具", labelEn: "Collaboration", apiGuideUrl: "https://developers.notion.com/docs/getting-started" },
};

const BADGE_META = {
  direct: {
    color: "bg-green-900/60 text-green-300 border border-green-700/40",
    zh: "直连可用",
    en: "Direct",
  },
  assisted: {
    color: "bg-yellow-900/40 text-yellow-300 border border-yellow-700/30",
    zh: "半自动",
    en: "Assisted",
  },
  planned: {
    color: "bg-slate-700/60 text-slate-400 border border-slate-600/30",
    zh: "规划中",
    en: "Planned",
  },
} as const;

export function PlatformsTab({ zh }: { zh: boolean }) {
  const listQuery = trpc.platforms.list.useQuery();
  const capabilitiesQuery = trpc.platforms.capabilities.useQuery();

  const updateMutation = trpc.platforms.update.useMutation({
    onSuccess: () => {
      toast.success(zh ? "已保存" : "Saved");
      listQuery.refetch();
      setEditing(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const testMutation = trpc.platforms.test.useMutation({
    onSuccess: (data) => toast.success(data.message),
    onError: (error) => toast.error(error.message),
  });

  const [editing, setEditing] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<"all" | "cn" | "intl" | "tool">("all");
  const [editForm, setEditForm] = useState<Partial<Platform>>({});

  const platforms = (listQuery.data ?? []) as Platform[];
  const capabilities = (capabilitiesQuery.data ?? []) as Capability[];
  const capabilityMap = useMemo(() => new Map(capabilities.map((item) => [item.platform, item])), [capabilities]);

  const filtered = filterCategory === "all"
    ? platforms
    : platforms.filter((platform) => (PLATFORM_META[platform.platform]?.category ?? "intl") === filterCategory);

  const categoryTabs: Array<{ id: "all" | "cn" | "intl" | "tool"; label: string }> = [
    { id: "all", label: zh ? "全部平台" : "All" },
    { id: "intl", label: zh ? "国际平台" : "International" },
    { id: "cn", label: zh ? "中文平台" : "Chinese" },
    { id: "tool", label: zh ? "协作工具" : "Tools" },
  ];

  const startEdit = (platform: Platform) => {
    setEditing(platform.id);
    setEditForm({
      isEnabled: platform.isEnabled ?? false,
      apiKey: platform.apiKey ?? "",
      apiSecret: platform.apiSecret ?? "",
      channelId: platform.channelId ?? "",
      autoPublish: platform.autoPublish ?? false,
      autoPublishNews: platform.autoPublishNews ?? false,
      sensitiveStandard: platform.sensitiveStandard ?? "general",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-bold text-white">{zh ? "媒体平台推送管理" : "Media Platforms"}</h2>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className={`px-2 py-0.5 rounded ${BADGE_META.direct.color}`}>{zh ? BADGE_META.direct.zh : BADGE_META.direct.en}</span>
          <span className={`px-2 py-0.5 rounded ${BADGE_META.assisted.color}`}>{zh ? BADGE_META.assisted.zh : BADGE_META.assisted.en}</span>
          <span className={`px-2 py-0.5 rounded ${BADGE_META.planned.color}`}>{zh ? BADGE_META.planned.zh : BADGE_META.planned.en}</span>
        </div>
      </div>

      <div className="bg-cyan-900/20 border border-cyan-700/30 rounded-xl p-4 text-sm text-cyan-200 leading-relaxed">
        {zh
          ? "这里现在按真实能力展示：Telegram / Discord / Slack / Notion 可以直连；Medium / Mirror / Reddit / 知乎这类平台建议先在文章页生成外发稿；规划中的平台只保留配置位。"
          : "Platforms are now shown by real capability: Telegram / Discord / Slack / Notion support direct publishing, while assisted destinations should use draft packages from the article screen first."}
      </div>

      <div className="flex gap-2 flex-wrap">
        {categoryTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterCategory(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterCategory === tab.id
                ? "bg-cyan-600 text-white"
                : "bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {listQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((platform) => {
            const meta = PLATFORM_META[platform.platform];
            const capability = capabilityMap.get(platform.platform);
            const mode = capability?.deliveryMode ?? "planned";
            const isEditing = editing === platform.id;

            return (
              <div key={platform.id} className="bg-slate-800/40 border border-slate-700/40 rounded-xl overflow-hidden">
                <div className="flex items-start gap-4 p-4">
                  <div className="text-3xl shrink-0">{meta?.icon ?? platform.icon ?? "📡"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-semibold">{platform.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${BADGE_META[mode].color}`}>
                        {zh ? BADGE_META[mode].zh : BADGE_META[mode].en}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${platform.isEnabled ? "bg-green-900/60 text-green-300" : "bg-slate-700 text-slate-500"}`}>
                        {platform.isEnabled ? (zh ? "已启用" : "Enabled") : (zh ? "已禁用" : "Disabled")}
                      </span>
                      {platform.autoPublish && (
                        <span className="text-xs bg-cyan-900/40 text-cyan-300 px-2 py-0.5 rounded">
                          {zh ? "自动推文章" : "Auto article"}
                        </span>
                      )}
                      {platform.autoPublishNews && (
                        <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded">
                          {zh ? "自动推快讯" : "Auto news"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      {capability ? (zh ? capability.summaryZh : capability.summaryEn) : (zh ? "暂无平台说明。" : "No platform note.")}
                    </p>
                    {meta?.apiGuideUrl && (
                      <a
                        href={meta.apiGuideUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-1.5 text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                      >
                        {zh ? "查看官方接入文档" : "Open official setup guide"}
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => testMutation.mutate({ platform: platform.platform })}
                      disabled={testMutation.isPending || !platform.isEnabled}
                      className="admin-btn-ghost text-xs disabled:opacity-40"
                    >
                      {zh ? "测试" : "Test"}
                    </button>
                    <button
                      onClick={() => (isEditing ? setEditing(null) : startEdit(platform))}
                      className="admin-btn-primary text-xs"
                    >
                      {isEditing ? (zh ? "收起" : "Collapse") : (zh ? "配置" : "Configure")}
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <div className="border-t border-slate-700/40 p-5 bg-slate-900/30 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-300">API Key / Token</label>
                        <input
                          type="password"
                          className="admin-input w-full text-sm"
                          value={editForm.apiKey ?? ""}
                          onChange={(event) => setEditForm((current) => ({ ...current, apiKey: event.target.value }))}
                          placeholder={zh ? "按平台填写 Token / Key" : "Enter API key / token"}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-300">API Secret</label>
                        <input
                          type="password"
                          className="admin-input w-full text-sm"
                          value={editForm.apiSecret ?? ""}
                          onChange={(event) => setEditForm((current) => ({ ...current, apiSecret: event.target.value }))}
                          placeholder={zh ? "需要时再填写" : "Fill when required"}
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="block text-xs font-medium text-slate-300">
                          {zh ? "频道 / 数据库 / Webhook / 账号 ID" : "Channel / database / webhook / account ID"}
                        </label>
                        <input
                          className="admin-input w-full text-sm"
                          value={editForm.channelId ?? ""}
                          onChange={(event) => setEditForm((current) => ({ ...current, channelId: event.target.value }))}
                          placeholder={zh ? "根据平台填写频道 ID、Database ID 或 Webhook URL" : "Fill the channel ID, database ID, or webhook URL"}
                        />
                      </div>
                    </div>

                    <div className="flex gap-6 flex-wrap pt-1 border-t border-slate-700/30">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.isEnabled ?? false}
                          onChange={(event) => setEditForm((current) => ({ ...current, isEnabled: event.target.checked }))}
                          className="w-4 h-4 accent-cyan-500"
                        />
                        <span className="text-sm text-slate-300">{zh ? "启用平台" : "Enable platform"}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.autoPublish ?? false}
                          onChange={(event) => setEditForm((current) => ({ ...current, autoPublish: event.target.checked }))}
                          className="w-4 h-4 accent-cyan-500"
                        />
                        <span className="text-sm text-slate-300">{zh ? "自动推文章" : "Auto article push"}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.autoPublishNews ?? false}
                          onChange={(event) => setEditForm((current) => ({ ...current, autoPublishNews: event.target.checked }))}
                          className="w-4 h-4 accent-cyan-500"
                        />
                        <span className="text-sm text-slate-300">{zh ? "自动推快讯" : "Auto flash-news push"}</span>
                      </label>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-300">{zh ? "合规审查标准" : "Compliance standard"}</label>
                      <select
                        className="admin-input w-full text-sm"
                        value={editForm.sensitiveStandard ?? "general"}
                        onChange={(event) => setEditForm((current) => ({ ...current, sensitiveStandard: event.target.value }))}
                      >
                        <option value="general">{zh ? "通用" : "General"}</option>
                        <option value="wechat">WeChat</option>
                        <option value="weibo">Weibo</option>
                        <option value="douyin">Douyin</option>
                        <option value="international">{zh ? "国际平台" : "International"}</option>
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          updateMutation.mutate({
                            id: platform.id,
                            isEnabled: editForm.isEnabled ?? undefined,
                            apiKey: editForm.apiKey ?? null,
                            apiSecret: editForm.apiSecret ?? null,
                            channelId: editForm.channelId ?? null,
                            autoPublish: editForm.autoPublish ?? undefined,
                            autoPublishNews: editForm.autoPublishNews ?? undefined,
                            sensitiveStandard: editForm.sensitiveStandard ?? undefined,
                          })
                        }
                        disabled={updateMutation.isPending}
                        className="admin-btn-primary"
                      >
                        {zh ? "保存配置" : "Save config"}
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
        </div>
      )}
    </div>
  );
}
