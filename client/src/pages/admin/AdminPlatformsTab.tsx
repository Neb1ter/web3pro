import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Platform = {
  id: number;
  platform: string;
  displayName: string;
  isEnabled: boolean | null;
  apiKey: string | null;
  apiSecret: string | null;
  channelId: string | null;
  extraConfig: string | null;
  autoPublish: boolean | null;
  autoPublishNews: boolean | null;
  sensitiveStandard: string | null;
};

const PLATFORM_ICONS: Record<string, string> = {
  telegram: "✈️",
  wechat: "💬",
  weibo: "🌐",
  twitter: "🐦",
  douyin: "🎵",
};

const PLATFORM_STATUS_NOTES: Record<string, { zh: string; en: string }> = {
  telegram: { zh: "✅ 已支持推送", en: "✅ Push supported" },
  wechat: { zh: "🔧 开发中（需 DeepSeek API）", en: "🔧 In development" },
  weibo: { zh: "🔧 开发中", en: "🔧 In development" },
  twitter: { zh: "🔧 开发中", en: "🔧 In development" },
  douyin: { zh: "🔧 开发中", en: "🔧 In development" },
};

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

  const platforms = (listQuery.data ?? []) as Platform[];

  const startEdit = (p: Platform) => {
    setEditing(p.id);
    setEditForm({
      isEnabled: p.isEnabled ?? false,
      apiKey: p.apiKey ?? "",
      apiSecret: p.apiSecret ?? "",
      channelId: p.channelId ?? "",
      autoPublish: p.autoPublish ?? false,
      autoPublishNews: p.autoPublishNews ?? false,
      sensitiveStandard: p.sensitiveStandard ?? "all",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{zh ? "📡 媒体平台推送管理" : "📡 Media Platforms"}</h2>
      </div>

      {/* Info banner */}
      <div className="bg-cyan-900/20 border border-cyan-700/30 rounded-xl p-4 text-sm text-cyan-300">
        {zh
          ? "💡 配置各平台的 API Key 后，可将文章和快讯自动推送到对应平台。Telegram 已支持，其他平台接入 DeepSeek API 后完善。"
          : "💡 Configure API keys to auto-push articles and news to each platform. Telegram is supported; others will be enabled after DeepSeek API integration."}
      </div>

      {listQuery.isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {platforms.map(p => (
            <div key={p.id} className="bg-slate-800/40 border border-slate-700/40 rounded-xl overflow-hidden">
              {/* Platform header */}
              <div className="flex items-center gap-4 p-4">
                <div className="text-3xl">{PLATFORM_ICONS[p.platform] ?? "📱"}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold">{p.displayName}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${p.isEnabled ? "bg-green-900/60 text-green-300" : "bg-slate-700 text-slate-400"}`}>
                      {p.isEnabled ? (zh ? "已启用" : "Enabled") : (zh ? "已禁用" : "Disabled")}
                    </span>
                    {p.autoPublish && <span className="text-xs bg-cyan-900/40 text-cyan-300 px-2 py-0.5 rounded">{zh ? "自动推送文章" : "Auto-publish articles"}</span>}
                    {p.autoPublishNews && <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded">{zh ? "自动推送快讯" : "Auto-push news"}</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {PLATFORM_STATUS_NOTES[p.platform]?.[zh ? "zh" : "en"] ?? ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => testMutation.mutate({ platform: p.platform })}
                    disabled={testMutation.isPending}
                    className="admin-btn-ghost text-xs"
                  >
                    {zh ? "🔌 测试连接" : "🔌 Test"}
                  </button>
                  <button onClick={() => editing === p.id ? setEditing(null) : startEdit(p)} className="admin-btn-primary text-xs">
                    {editing === p.id ? (zh ? "收起" : "Collapse") : (zh ? "配置" : "Configure")}
                  </button>
                </div>
              </div>

              {/* Edit form */}
              {editing === p.id && (
                <div className="border-t border-slate-700/40 p-4 bg-slate-900/30 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        {p.platform === "telegram" ? "Bot Token (API Key)" : "API Key / Access Token"}
                      </label>
                      <input
                        type="password"
                        className="admin-input w-full text-sm"
                        value={editForm.apiKey ?? ""}
                        onChange={e => setEditForm(f => ({ ...f, apiKey: e.target.value }))}
                        placeholder={p.platform === "telegram" ? "8708899187:AAF..." : "sk-..."}
                      />
                    </div>
                    {p.platform !== "telegram" && (
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">API Secret / App Secret</label>
                        <input
                          type="password"
                          className="admin-input w-full text-sm"
                          value={editForm.apiSecret ?? ""}
                          onChange={e => setEditForm(f => ({ ...f, apiSecret: e.target.value }))}
                          placeholder="App Secret..."
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        {p.platform === "telegram" ? "Channel ID / Username" : "Channel / Account ID"}
                      </label>
                      <input
                        className="admin-input w-full text-sm"
                        value={editForm.channelId ?? ""}
                        onChange={e => setEditForm(f => ({ ...f, channelId: e.target.value }))}
                        placeholder={p.platform === "telegram" ? "@get8pro 或 -100xxxxxxxx" : "Channel ID..."}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">{zh ? "合规标准" : "Compliance Standard"}</label>
                      <select className="admin-input w-full text-sm" value={editForm.sensitiveStandard ?? "all"} onChange={e => setEditForm(f => ({ ...f, sensitiveStandard: e.target.value }))}>
                        <option value="all">{zh ? "通用标准" : "General"}</option>
                        <option value="wechat">{zh ? "微信标准" : "WeChat Standard"}</option>
                        <option value="weibo">{zh ? "微博标准" : "Weibo Standard"}</option>
                        <option value="douyin">{zh ? "抖音标准" : "Douyin Standard"}</option>
                        <option value="international">{zh ? "国际标准" : "International"}</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-6 flex-wrap">
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

                  <div className="flex gap-2">
                    <button
                      onClick={() => updateMutation.mutate({ id: p.id, isEnabled: editForm.isEnabled ?? undefined, apiKey: editForm.apiKey, apiSecret: editForm.apiSecret, channelId: editForm.channelId, extraConfig: editForm.extraConfig ?? undefined, autoPublish: editForm.autoPublish ?? undefined, autoPublishNews: editForm.autoPublishNews ?? undefined, sensitiveStandard: editForm.sensitiveStandard ?? undefined })}
                      disabled={updateMutation.isPending}
                      className="admin-btn-primary"
                    >
                      {updateMutation.isPending ? (zh ? "保存中..." : "Saving...") : (zh ? "💾 保存配置" : "💾 Save")}
                    </button>
                    <button onClick={() => setEditing(null)} className="admin-btn-ghost">{zh ? "取消" : "Cancel"}</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
