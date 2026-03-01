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

type AiGenerateResult = {
  generated: {
    title: string;
    content: string;
    excerpt?: string;
    tags?: string;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
  };
  sensitiveResult: {
    isClean: boolean;
    flaggedWords: Array<{ word: string; positions: number[]; severity: string; replacement?: string | null }>;
  };
  saved: boolean;
  slug?: string;
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
  const aiGenMutation = trpc.articles.aiGenerate.useMutation({
    onSuccess: (data) => {
      const count = data.sensitiveResult.flaggedWords.length;
      toast.success(zh ? `AI 生成成功！发现 ${count} 个敏感词` : `Generated! ${count} sensitive words`);
      if (data.saved) listQuery.refetch();
      setAiResult(data as AiGenerateResult);
    },
    onError: (e) => toast.error(e.message),
  });
  const rewriteMutation = trpc.articles.rewriteCompliance.useMutation({
    onSuccess: (data) => {
      toast.success(data.isClean
        ? (zh ? "改写完成，内容合规" : "Rewritten, clean")
        : (zh ? `改写完成，仍有 ${data.flaggedCount} 个敏感词` : `Rewritten, ${data.flaggedCount} remaining`));
      listQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
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
  const [showAiForm, setShowAiForm] = useState(false);
  const [aiForm, setAiForm] = useState({
    topic: "", category: "analysis", perspective: "neutral" as const,
    targetAudience: "beginner" as const, contentStyle: "formal" as const,
    wordCount: 800, autoSave: true, keywords: [] as string[],
  });
  const [aiResult, setAiResult] = useState<AiGenerateResult | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
          <button
            onClick={() => setShowAiForm(!showAiForm)}
            className="admin-btn-primary text-sm"
          >
            {zh ? "🤖 AI 生成文章" : "🤖 AI Generate"}
          </button>
          <a
            href="/admin/article/new"
            className="admin-btn-ghost text-sm"
          >
            {zh ? "✏️ 手动创建" : "✏️ Manual Create"}
          </a>
        </div>
      </div>

      {/* AI Generate Form */}
      {showAiForm && (
        <div className="bg-slate-800/60 border border-cyan-700/40 rounded-xl p-5 space-y-4">
          <h3 className="text-cyan-300 font-semibold">{zh ? "🤖 AI 文章生成配置" : "🤖 AI Article Generator"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">{zh ? "文章主题 / 关键词" : "Topic / Keywords"}</label>
              <input
                className="admin-input w-full"
                placeholder={zh ? "例：比特币减半对市场的影响分析" : "e.g. Bitcoin halving market impact analysis"}
                value={aiForm.topic}
                onChange={e => setAiForm(f => ({ ...f, topic: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{zh ? "文章分类" : "Category"}</label>
              <select className="admin-input w-full" value={aiForm.category} onChange={e => setAiForm(f => ({ ...f, category: e.target.value }))}>
                {Object.entries(CATEGORY_LABELS.zh).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{zh ? "观点角度" : "Perspective"}</label>
              <select className="admin-input w-full" value={aiForm.perspective} onChange={e => setAiForm(f => ({ ...f, perspective: e.target.value as typeof aiForm.perspective }))}>
                <option value="neutral">{zh ? "中立客观" : "Neutral"}</option>
                <option value="bullish">{zh ? "看多/乐观" : "Bullish"}</option>
                <option value="bearish">{zh ? "看空/谨慎" : "Bearish"}</option>
                <option value="educational">{zh ? "科普教育" : "Educational"}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{zh ? "目标受众" : "Target Audience"}</label>
              <select className="admin-input w-full" value={aiForm.targetAudience} onChange={e => setAiForm(f => ({ ...f, targetAudience: e.target.value as typeof aiForm.targetAudience }))}>
                <option value="beginner">{zh ? "新手入门" : "Beginner"}</option>
                <option value="intermediate">{zh ? "进阶用户" : "Intermediate"}</option>
                <option value="professional">{zh ? "专业投资者" : "Professional"}</option>
                <option value="institutional">{zh ? "机构用户" : "Institutional"}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{zh ? "内容风格" : "Content Style"}</label>
              <select className="admin-input w-full" value={aiForm.contentStyle} onChange={e => setAiForm(f => ({ ...f, contentStyle: e.target.value as typeof aiForm.contentStyle }))}>
                <option value="formal">{zh ? "严肃分析" : "Formal"}</option>
                <option value="casual">{zh ? "轻松科普" : "Casual"}</option>
                <option value="marketing">{zh ? "营销推广" : "Marketing"}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{zh ? "目标字数" : "Word Count"}</label>
              <input
                type="number" min={300} max={3000} step={100}
                className="admin-input w-full"
                value={aiForm.wordCount}
                onChange={e => setAiForm(f => ({ ...f, wordCount: Number(e.target.value) }))}
              />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox" id="autoSave"
                checked={aiForm.autoSave}
                onChange={e => setAiForm(f => ({ ...f, autoSave: e.target.checked }))}
                className="w-4 h-4 accent-cyan-500"
              />
              <label htmlFor="autoSave" className="text-sm text-slate-300">
                {zh ? "生成后自动保存到草稿" : "Auto-save as draft"}
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => aiGenMutation.mutate(aiForm)}
              disabled={!aiForm.topic || aiGenMutation.isPending}
              className="admin-btn-primary"
            >
              {aiGenMutation.isPending ? (zh ? "生成中..." : "Generating...") : (zh ? "🚀 开始生成" : "🚀 Generate")}
            </button>
            <button onClick={() => setShowAiForm(false)} className="admin-btn-ghost">
              {zh ? "取消" : "Cancel"}
            </button>
          </div>

          {/* AI Result Preview */}
          {aiResult && (
            <div className="mt-4 bg-slate-900/60 border border-slate-600/40 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-semibold">{zh ? "生成结果预览" : "Generated Preview"}</h4>
                <span className={`text-xs px-2 py-0.5 rounded ${aiResult.sensitiveResult.isClean ? "bg-green-900/60 text-green-300" : "bg-red-900/60 text-red-300"}`}>
                  {aiResult.sensitiveResult.isClean ? (zh ? "✅ 合规" : "✅ Clean") : (zh ? `⚠️ ${aiResult.sensitiveResult.flaggedWords.length} 个敏感词` : `⚠️ ${aiResult.sensitiveResult.flaggedWords.length} sensitive`)}
                </span>
              </div>
              <p className="text-cyan-300 font-medium">{aiResult.generated.title}</p>
              <p className="text-slate-400 text-sm line-clamp-3">{aiResult.generated.excerpt}</p>
              {!aiResult.sensitiveResult.isClean && (
                <div className="bg-red-900/20 border border-red-700/30 rounded p-3">
                  <p className="text-red-300 text-xs font-medium mb-2">{zh ? "发现敏感词：" : "Sensitive words found:"}</p>
                  <div className="flex flex-wrap gap-1">
                    {aiResult.sensitiveResult.flaggedWords.map((w, i) => (
                      <span key={i} className="text-xs bg-red-900/40 text-red-300 px-2 py-0.5 rounded border border-red-700/30">
                        {w.word} ({w.severity})
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {aiResult.saved && aiResult.slug && (
                <p className="text-green-400 text-sm">
                  {zh ? "✅ 已保存为草稿" : "✅ Saved as draft"} — <a href={`/article/${aiResult.slug}`} target="_blank" className="underline hover:text-green-300">/article/{aiResult.slug}</a>
                </p>
              )}
            </div>
          )}
        </div>
      )}

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
                    {a.sensitiveStatus === "flagged" && <span className="text-xs text-red-400 bg-red-900/30 px-2 py-0.5 rounded">⚠️ 敏感词</span>}
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
                      {a.sensitiveWords && a.sensitiveWords !== "[]" && (
                        <div className="col-span-2 md:col-span-3">
                          <span className="text-red-400">{zh ? "敏感词:" : "Sensitive:"}</span>
                          <span className="text-red-300 ml-1">{JSON.parse(a.sensitiveWords).map((w: { word: string }) => w.word).join(", ")}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 flex-wrap pt-1">
                    {a.sensitiveStatus === "flagged" && (
                      <button
                        onClick={() => rewriteMutation.mutate({ id: a.id })}
                        disabled={rewriteMutation.isPending}
                        className="admin-btn-primary text-xs"
                      >
                        {rewriteMutation.isPending ? (zh ? "改写中..." : "Rewriting...") : (zh ? "🔄 AI 合规改写" : "🔄 AI Rewrite")}
                      </button>
                    )}
                    {(a.status === "approved" || a.status === "published") && (
                      <button
                        onClick={() => publishMutation.mutate({ id: a.id, platforms: ["telegram"] })}
                        disabled={publishMutation.isPending}
                        className="admin-btn-primary text-xs"
                      >
                        {zh ? "📡 推送 Telegram" : "📡 Push Telegram"}
                      </button>
                    )}
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
