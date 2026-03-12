import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Article = {
  id: number;
  title: string;
  slug: string;
  category: string;
  status: string;
  author: string;
  isAiGenerated: boolean | null;
  sensitiveStatus: string | null;
  sensitiveWords: string | null;
  isPinned: boolean | null;
  isActive: boolean | null;
  viewCount: number | null;
  publishedAt: string | null;
  updatedAt: string | null;
  excerpt?: string | null;
  content?: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  tags?: string | null;
  perspective?: string | null;
  targetAudience?: string | null;
  contentStyle?: string | null;
  reviewNotes?: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-700 text-slate-300",
  pending_review: "bg-yellow-900/60 text-yellow-300",
  approved: "bg-green-900/60 text-green-300",
  published: "bg-cyan-900/60 text-cyan-300",
  rejected: "bg-red-900/60 text-red-300",
};
const STATUS_LABELS: Record<string, Record<string, string>> = {
  zh: { draft: "草稿", pending_review: "待审核", approved: "已通过", published: "已发布", rejected: "已拒绝" },
  en: { draft: "Draft", pending_review: "Pending", approved: "Approved", published: "Published", rejected: "Rejected" },
};
const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  zh: { analysis: "市场分析", tutorial: "使用教程", news_decode: "新闻解读", project: "项目介绍", promo: "宣传推广", report: "行业报告" },
  en: { analysis: "Analysis", tutorial: "Tutorial", news_decode: "News Decode", project: "Project", promo: "Promo", report: "Report" },
};

const MEDIA_AUTO_URL = "https://media-auto-production.up.railway.app";

export function ArticlesTab({ zh }: { zh: boolean }) {
  const lang = zh ? "zh" : "en";
  const listQuery = trpc.articles.listAll.useQuery({ limit: 50, offset: 0 });
  const deleteMutation = trpc.articles.delete.useMutation({
    onSuccess: () => { toast.success(zh ? "已删除" : "Deleted"); listQuery.refetch(); },
    onError: () => toast.error(zh ? "删除失败" : "Delete failed"),
  });
  const updateMutation = trpc.articles.update.useMutation({
    onSuccess: () => { toast.success(zh ? "已更新" : "Updated"); listQuery.refetch(); setEditing(null); },
    onError: () => toast.error(zh ? "更新失败" : "Update failed"),
  });
  const publishMutation = trpc.articles.publish.useMutation({
    onSuccess: (data) => {
      const ok = data.results.filter((r: { status: string }) => r.status === "success").length;
      toast.success(zh ? `推送完成：${ok}/${data.results.length} 个平台成功` : `Published: ${ok}/${data.results.length} platforms`);
    },
    onError: (e) => toast.error(e.message),
  });

  const [editing, setEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Article>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [publishPanelId, setPublishPanelId] = useState<number | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["telegram"]);

  const ALL_PLATFORMS = [
    { id: "telegram", label: "Telegram", icon: "✈️", ready: true },
    { id: "wechat",   label: "微信公众号", icon: "💬", ready: false },
    { id: "weibo",    label: "微博",       icon: "🌐", ready: false },
    { id: "twitter",  label: "Twitter/X",  icon: "🐦", ready: false },
    { id: "douyin",   label: "抖音",       icon: "🎵", ready: false },
  ];

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const articles = (listQuery.data ?? []) as Article[];

  const startEdit = (a: Article) => {
    setEditing(a.id);
    setEditForm({ title: a.title, status: a.status, reviewNotes: a.reviewNotes ?? "" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-white">{zh ? "✍️ 文章管理" : "✍️ Articles"}</h2>
        <div className="flex gap-2">
          {/* AI 创作跳转按钮 */}
          <a
            href={MEDIA_AUTO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn-primary text-sm flex items-center gap-1.5"
          >
            🤖 {zh ? "AI 创作平台" : "AI Creator"}
            <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <a
            href="/admin/article/new"
            className="admin-btn-ghost text-sm"
          >
            {zh ? "✏️ 手动创建" : "✏️ Manual Create"}
          </a>
        </div>
      </div>

      {/* AI 创作提示横幅 */}
      <div className="bg-cyan-900/20 border border-cyan-700/30 rounded-xl p-4 flex items-center gap-3">
        <span className="text-2xl">🤖</span>
        <div className="flex-1">
          <p className="text-cyan-300 font-medium text-sm">
            {zh ? "使用 AI 创作平台生成文章" : "Use AI Creator to generate articles"}
          </p>
          <p className="text-slate-400 text-xs mt-0.5">
            {zh
              ? "点击上方「AI 创作平台」按钮，在自媒体运营自动化平台中生成文章后，手动复制内容到此处创建文章。"
              : "Click \"AI Creator\" above to generate articles on the media automation platform, then paste the content here."}
          </p>
        </div>
        <a
          href={MEDIA_AUTO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="admin-btn-primary text-xs flex-shrink-0"
        >
          {zh ? "前往创作 →" : "Go Create →"}
        </a>
      </div>

      {/* Article List */}
      {listQuery.isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 text-slate-500">{zh ? "暂无文章，点击上方按钮创建" : "No articles yet"}</div>
      ) : (
        <div className="space-y-3">
          {articles.map(a => (
            <div key={a.id} className="bg-slate-800/40 border border-slate-700/40 rounded-xl overflow-hidden">
              {/* Article row */}
              <div className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[a.status] ?? "bg-slate-700 text-slate-300"}`}>
                      {STATUS_LABELS[lang][a.status] ?? a.status}
                    </span>
                    <span className="text-xs text-slate-500 bg-slate-700/40 px-2 py-0.5 rounded">
                      {CATEGORY_LABELS[lang][a.category] ?? a.category}
                    </span>
                    {a.isAiGenerated && <span className="text-xs text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded">🤖 AI</span>}
                    {a.isPinned && <span className="text-xs text-yellow-400 bg-yellow-900/30 px-2 py-0.5 rounded">📌</span>}
                  </div>
                  <p className="text-white font-medium text-sm truncate">{a.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{a.author} · {a.viewCount ?? 0} {zh ? "次阅读" : "views"} · {a.updatedAt ? new Date(a.updatedAt).toLocaleDateString("zh-CN") : "-"}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                    className="admin-btn-ghost text-xs"
                  >
                    {expandedId === a.id ? (zh ? "收起" : "Collapse") : (zh ? "展开" : "Expand")}
                  </button>
                  <a href={`/article/${a.slug}`} target="_blank" className="admin-btn-ghost text-xs">
                    {zh ? "预览" : "Preview"}
                  </a>
                  <button onClick={() => startEdit(a)} className="admin-btn-primary text-xs">
                    {zh ? "编辑" : "Edit"}
                  </button>
                  <button
                    onClick={() => { if (confirm(zh ? "确认删除？" : "Confirm delete?")) deleteMutation.mutate({ id: a.id }); }}
                    className="admin-btn-danger text-xs"
                  >
                    {zh ? "删除" : "Del"}
                  </button>
                </div>
              </div>

              {/* Expanded detail */}
              {expandedId === a.id && (
                <div className="border-t border-slate-700/40 p-4 space-y-3 bg-slate-900/30">
                  {/* Inline edit form */}
                  {editing === a.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">{zh ? "标题" : "Title"}</label>
                        <input className="admin-input w-full" value={editForm.title ?? ""} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">{zh ? "状态" : "Status"}</label>
                        <select className="admin-input w-full" value={editForm.status ?? a.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                          {Object.entries(STATUS_LABELS.zh).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">{zh ? "审核备注" : "Review Notes"}</label>
                        <textarea className="admin-input w-full" rows={2} value={editForm.reviewNotes ?? ""} onChange={e => setEditForm(f => ({ ...f, reviewNotes: e.target.value }))} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => updateMutation.mutate({ id: a.id, title: editForm.title, status: editForm.status as "draft" | "pending_review" | "approved" | "published" | "rejected" | undefined, reviewNotes: editForm.reviewNotes })} disabled={updateMutation.isPending} className="admin-btn-primary text-xs">
                          {zh ? "保存" : "Save"}
                        </button>
                        <button onClick={() => setEditing(null)} className="admin-btn-ghost text-xs">{zh ? "取消" : "Cancel"}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-400">
                      <div><span className="text-slate-500">Slug:</span> <span className="text-slate-300">{a.slug}</span></div>
                      <div><span className="text-slate-500">{zh ? "观点:" : "Perspective:"}</span> <span className="text-slate-300">{a.perspective ?? "-"}</span></div>
                      <div><span className="text-slate-500">{zh ? "受众:" : "Audience:"}</span> <span className="text-slate-300">{a.targetAudience ?? "-"}</span></div>
                      {a.metaTitle && <div className="col-span-2 md:col-span-3"><span className="text-slate-500">Meta Title:</span> <span className="text-slate-300">{a.metaTitle}</span></div>}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 flex-wrap pt-1">
                    {(a.status === "approved" || a.status === "published") && (
                      <button
                        onClick={() => setPublishPanelId(publishPanelId === a.id ? null : a.id)}
                        className="admin-btn-primary text-xs"
                      >
                        {zh ? "📡 推送到平台" : "📡 Push to Platform"}
                      </button>
                    )}
                  </div>

                  {/* 多平台推送面板 */}
                  {publishPanelId === a.id && (
                    <div className="mt-3 bg-slate-800/60 border border-cyan-700/30 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-cyan-300">
                          {zh ? "📡 选择推送平台" : "📡 Select Platforms"}
                        </span>
                        <button onClick={() => setPublishPanelId(null)} className="text-slate-500 hover:text-white text-xs">✕</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {ALL_PLATFORMS.map(p => (
                          <button
                            key={p.id}
                            onClick={() => togglePlatform(p.id)}
                            title={p.ready ? undefined : (zh ? "开发中，配置 API Key 后可用" : "In development, configure API Key to enable")}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                              selectedPlatforms.includes(p.id)
                                ? "border-cyan-500 bg-cyan-900/40 text-cyan-200"
                                : "border-slate-600 bg-slate-700/40 text-slate-400 hover:border-slate-500"
                            } ${!p.ready ? "opacity-50 cursor-not-allowed" : ""}`}
                            disabled={!p.ready}
                          >
                            {p.icon} {p.label}
                            {!p.ready && <span className="text-yellow-500 text-[10px] ml-1">{zh ? "开发中" : "WIP"}</span>}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            if (selectedPlatforms.length === 0) {
                              toast.warning(zh ? "请至少选择一个平台" : "Select at least one platform");
                              return;
                            }
                            publishMutation.mutate({ id: a.id, platforms: selectedPlatforms });
                            setPublishPanelId(null);
                          }}
                          disabled={publishMutation.isPending || selectedPlatforms.length === 0}
                          className="admin-btn-primary text-xs"
                        >
                          {publishMutation.isPending
                            ? (zh ? "推送中..." : "Pushing...")
                            : (zh ? `确认推送 (${selectedPlatforms.length} 个平台)` : `Push (${selectedPlatforms.length} platforms)`)}
                        </button>
                        <span className="text-xs text-slate-500">
                          {zh ? "已选：" : "Selected: "}{selectedPlatforms.join(", ") || (zh ? "无" : "none")}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
