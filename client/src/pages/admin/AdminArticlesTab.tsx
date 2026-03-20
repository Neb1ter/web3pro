import { useMemo, useState } from "react";
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
  isPinned: boolean | null;
  viewCount: number | null;
  updatedAt: string | null;
  excerpt?: string | null;
  metaTitle?: string | null;
  perspective?: string | null;
  targetAudience?: string | null;
  reviewNotes?: string | null;
};

type Capability = {
  platform: string;
  displayName: string;
  deliveryMode: "direct" | "assisted" | "planned";
  supportsArticle: boolean;
};

type DraftPackage = {
  platform: string;
  displayName: string;
  publishUrl: string;
  title: string;
  summary: string;
  body: string;
  notes: string[];
  wordCount: number;
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-700 text-slate-300",
  pending_review: "bg-yellow-900/60 text-yellow-300",
  approved: "bg-green-900/60 text-green-300",
  published: "bg-cyan-900/60 text-cyan-300",
  rejected: "bg-red-900/60 text-red-300",
};

const STATUS_LABELS: Record<string, Record<string, string>> = {
  zh: {
    draft: "草稿",
    pending_review: "待审核",
    approved: "已通过",
    published: "已发布",
    rejected: "已拒绝",
  },
  en: {
    draft: "Draft",
    pending_review: "Pending",
    approved: "Approved",
    published: "Published",
    rejected: "Rejected",
  },
};

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  zh: {
    analysis: "市场分析",
    tutorial: "使用教程",
    news_decode: "新闻解读",
    project: "项目介绍",
    promo: "推广内容",
    report: "行业报告",
  },
  en: {
    analysis: "Analysis",
    tutorial: "Tutorial",
    news_decode: "News Decode",
    project: "Project",
    promo: "Promo",
    report: "Report",
  },
};

const MEDIA_AUTO_URL = "https://media.get8.pro";

async function copyText(text: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch {
    toast.error("Copy failed");
  }
}

export function ArticlesTab({ zh }: { zh: boolean }) {
  const lang = zh ? "zh" : "en";
  const listQuery = trpc.articles.listAll.useQuery({ limit: 50, offset: 0 });
  const capabilitiesQuery = trpc.platforms.capabilities.useQuery();

  const deleteMutation = trpc.articles.delete.useMutation({
    onSuccess: () => {
      toast.success(zh ? "已删除" : "Deleted");
      listQuery.refetch();
    },
    onError: () => toast.error(zh ? "删除失败" : "Delete failed"),
  });

  const updateMutation = trpc.articles.update.useMutation({
    onSuccess: () => {
      toast.success(zh ? "已更新" : "Updated");
      listQuery.refetch();
      setEditing(null);
    },
    onError: () => toast.error(zh ? "更新失败" : "Update failed"),
  });

  const publishMutation = trpc.articles.publish.useMutation({
    onSuccess: (data) => {
      const successCount = data.results.filter((item: { status: string }) => item.status === "success").length;
      toast.success(
        zh
          ? `直连发布完成：${successCount}/${data.results.length} 个平台成功`
          : `Direct publish finished: ${successCount}/${data.results.length} succeeded`,
      );
    },
    onError: (error) => toast.error(error.message),
  });

  const draftsMutation = trpc.articles.buildDraftPackages.useMutation({
    onError: (error) => toast.error(error.message),
  });

  const [editing, setEditing] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [publishPanelId, setPublishPanelId] = useState<number | null>(null);
  const [draftPanelId, setDraftPanelId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Article>>({});
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["telegram"]);
  const [draftsByArticle, setDraftsByArticle] = useState<Record<number, DraftPackage[]>>({});

  const articles = (listQuery.data ?? []) as Article[];
  const capabilities = (capabilitiesQuery.data ?? []) as Capability[];

  const directPlatforms = useMemo(
    () =>
      capabilities.filter(
        (platform) => platform.supportsArticle && platform.deliveryMode === "direct",
      ),
    [capabilities],
  );

  const assistedPlatforms = useMemo(
    () =>
      capabilities.filter(
        (platform) => platform.supportsArticle && platform.deliveryMode === "assisted",
      ),
    [capabilities],
  );

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const startEdit = (article: Article) => {
    setEditing(article.id);
    setEditForm({
      title: article.title,
      status: article.status,
      reviewNotes: article.reviewNotes ?? "",
    });
  };

  const openDraftPanel = async (articleId: number) => {
    setDraftPanelId(articleId);
    if (!draftsByArticle[articleId]) {
      const response = await draftsMutation.mutateAsync({ id: articleId });
      setDraftsByArticle((current) => ({ ...current, [articleId]: response.drafts as DraftPackage[] }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-white">{zh ? "文章管理" : "Articles"}</h2>
        <div className="flex gap-2">
          <a
            href={MEDIA_AUTO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn-primary text-sm flex items-center gap-1.5"
          >
            {zh ? "AI 创作平台" : "AI Creator"}
          </a>
          <a
            href={MEDIA_AUTO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn-ghost text-sm"
          >
            {zh ? "打开 media 工作台" : "Open media workspace"}
          </a>
        </div>
      </div>

      <div className="bg-cyan-900/20 border border-cyan-700/30 rounded-xl p-4 text-sm leading-relaxed text-cyan-200">
        {zh
          ? "现在后台分成两条工作流：Telegram / Discord / Slack / Notion 可直连发布；Medium / Mirror / Reddit / 知乎这类平台先生成外发稿，再去对应平台手动发。这样 media.get8.pro 至少先是可闭环的，不会再出现“看着能发，实际发不出去”的错觉。"
          : "The workflow is now split in two: Telegram / Discord / Slack / Notion support direct publishing, while Medium / Mirror / Reddit / Zhihu first generate ready-to-publish draft packages for manual posting."}
      </div>

      {listQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 text-slate-500">{zh ? "暂无文章" : "No articles yet"}</div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => {
            const draftPackages = draftsByArticle[article.id] ?? [];
            return (
              <div key={article.id} className="bg-slate-800/40 border border-slate-700/40 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[article.status] ?? "bg-slate-700 text-slate-300"}`}>
                        {STATUS_LABELS[lang][article.status] ?? article.status}
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-700/40 px-2 py-0.5 rounded">
                        {CATEGORY_LABELS[lang][article.category] ?? article.category}
                      </span>
                      {article.isAiGenerated && (
                        <span className="text-xs text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded">AI</span>
                      )}
                      {article.isPinned && (
                        <span className="text-xs text-yellow-400 bg-yellow-900/30 px-2 py-0.5 rounded">Pinned</span>
                      )}
                    </div>
                    <p className="text-white font-medium text-sm truncate">{article.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {article.author} · {article.viewCount ?? 0} {zh ? "次阅读" : "views"} ·{" "}
                      {article.updatedAt ? new Date(article.updatedAt).toLocaleDateString("zh-CN") : "-"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setExpandedId(expandedId === article.id ? null : article.id)}
                      className="admin-btn-ghost text-xs"
                    >
                      {expandedId === article.id ? (zh ? "收起" : "Collapse") : (zh ? "展开" : "Expand")}
                    </button>
                    <a href={`/article/${article.slug}`} target="_blank" rel="noreferrer" className="admin-btn-ghost text-xs">
                      {zh ? "预览" : "Preview"}
                    </a>
                    <button onClick={() => startEdit(article)} className="admin-btn-primary text-xs">
                      {zh ? "编辑" : "Edit"}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(zh ? "确认删除？" : "Confirm delete?")) {
                          deleteMutation.mutate({ id: article.id });
                        }
                      }}
                      className="admin-btn-danger text-xs"
                    >
                      {zh ? "删除" : "Delete"}
                    </button>
                  </div>
                </div>

                {expandedId === article.id && (
                  <div className="border-t border-slate-700/40 p-4 space-y-4 bg-slate-900/30">
                    {editing === article.id ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">{zh ? "标题" : "Title"}</label>
                          <input
                            className="admin-input w-full"
                            value={editForm.title ?? ""}
                            onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">{zh ? "状态" : "Status"}</label>
                          <select
                            className="admin-input w-full"
                            value={editForm.status ?? article.status}
                            onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value }))}
                          >
                            {Object.entries(STATUS_LABELS.zh).map(([key, label]) => (
                              <option key={key} value={key}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">{zh ? "审核备注" : "Review Notes"}</label>
                          <textarea
                            className="admin-input w-full"
                            rows={2}
                            value={editForm.reviewNotes ?? ""}
                            onChange={(event) => setEditForm((current) => ({ ...current, reviewNotes: event.target.value }))}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              updateMutation.mutate({
                                id: article.id,
                                title: editForm.title,
                                status: editForm.status as "draft" | "pending_review" | "approved" | "published" | "rejected" | undefined,
                                reviewNotes: editForm.reviewNotes,
                              })
                            }
                            disabled={updateMutation.isPending}
                            className="admin-btn-primary text-xs"
                          >
                            {zh ? "保存" : "Save"}
                          </button>
                          <button onClick={() => setEditing(null)} className="admin-btn-ghost text-xs">
                            {zh ? "取消" : "Cancel"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-400">
                        <div><span className="text-slate-500">Slug:</span> <span className="text-slate-300">{article.slug}</span></div>
                        <div><span className="text-slate-500">{zh ? "观点:" : "Perspective:"}</span> <span className="text-slate-300">{article.perspective ?? "-"}</span></div>
                        <div><span className="text-slate-500">{zh ? "受众:" : "Audience:"}</span> <span className="text-slate-300">{article.targetAudience ?? "-"}</span></div>
                        {article.metaTitle && (
                          <div className="col-span-2 md:col-span-3">
                            <span className="text-slate-500">Meta Title:</span> <span className="text-slate-300">{article.metaTitle}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      {(article.status === "approved" || article.status === "published") && (
                        <button
                          onClick={() => {
                            setPublishPanelId(publishPanelId === article.id ? null : article.id);
                            if (publishPanelId !== article.id && directPlatforms.length > 0) {
                              setSelectedPlatforms((current) =>
                                current.length > 0
                                  ? current.filter((platform) => directPlatforms.some((item) => item.platform === platform))
                                  : [directPlatforms[0].platform],
                              );
                            }
                          }}
                          className="admin-btn-primary text-xs"
                        >
                          {zh ? "直连发布" : "Direct publish"}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (draftPanelId === article.id) {
                            setDraftPanelId(null);
                            return;
                          }
                          void openDraftPanel(article.id);
                        }}
                        className="admin-btn-ghost text-xs"
                      >
                        {zh ? "生成外发稿" : "Generate draft package"}
                      </button>
                    </div>

                    {publishPanelId === article.id && (
                      <div className="bg-slate-800/60 border border-cyan-700/30 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <span className="text-sm font-semibold text-cyan-300">
                            {zh ? "可直连平台" : "Direct publishing targets"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {zh ? "当前仅展示真正可直连的平台。" : "Only truly supported direct targets are shown here."}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {directPlatforms.map((platform) => (
                            <button
                              key={platform.platform}
                              onClick={() => togglePlatform(platform.platform)}
                              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                                selectedPlatforms.includes(platform.platform)
                                  ? "border-cyan-500 bg-cyan-900/40 text-cyan-200"
                                  : "border-slate-600 bg-slate-700/40 text-slate-400 hover:border-slate-500"
                              }`}
                            >
                              {platform.displayName}
                            </button>
                          ))}
                        </div>
                        <div className="text-xs text-slate-500">
                          {zh ? "半自动平台：" : "Assisted platforms: "}
                          {assistedPlatforms.map((platform) => platform.displayName).join(" / ") || (zh ? "无" : "none")}
                        </div>
                        <button
                          onClick={() => {
                            if (selectedPlatforms.length === 0) {
                              toast.warning(zh ? "请至少选择一个平台" : "Select at least one platform");
                              return;
                            }
                            publishMutation.mutate({ id: article.id, platforms: selectedPlatforms });
                            setPublishPanelId(null);
                          }}
                          disabled={publishMutation.isPending || selectedPlatforms.length === 0}
                          className="admin-btn-primary text-xs"
                        >
                          {publishMutation.isPending
                            ? (zh ? "发布中..." : "Publishing...")
                            : zh
                              ? `确认发布 (${selectedPlatforms.length})`
                              : `Publish (${selectedPlatforms.length})`}
                        </button>
                      </div>
                    )}

                    {draftPanelId === article.id && (
                      <div className="bg-slate-800/60 border border-amber-700/30 rounded-xl p-4 space-y-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <span className="text-sm font-semibold text-amber-300">
                            {zh ? "外发草稿包" : "External draft packages"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {zh ? "适合发到 Medium / Mirror / Reddit / 知乎等平台。" : "Ready for Medium / Mirror / Reddit / Zhihu and similar platforms."}
                          </span>
                        </div>

                        {draftsMutation.isPending && draftPanelId === article.id ? (
                          <div className="flex justify-center py-6">
                            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {draftPackages.map((draft) => (
                              <div key={draft.platform} className="rounded-xl border border-slate-700/40 bg-slate-900/60 p-4 space-y-3">
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                  <div>
                                    <h4 className="text-white font-semibold text-sm">{draft.displayName}</h4>
                                    <p className="text-xs text-slate-500">
                                      {zh ? "字数" : "Words"}: {draft.wordCount}
                                    </p>
                                  </div>
                                  <div className="flex gap-2 flex-wrap">
                                    <button
                                      onClick={() => void copyText(draft.title, zh ? "标题已复制" : "Title copied")}
                                      className="admin-btn-ghost text-xs"
                                    >
                                      {zh ? "复制标题" : "Copy title"}
                                    </button>
                                    <button
                                      onClick={() => void copyText(draft.body, zh ? "正文已复制" : "Body copied")}
                                      className="admin-btn-primary text-xs"
                                    >
                                      {zh ? "复制正文" : "Copy body"}
                                    </button>
                                    <a
                                      href={draft.publishUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="admin-btn-ghost text-xs"
                                    >
                                      {zh ? "打开平台" : "Open platform"}
                                    </a>
                                  </div>
                                </div>

                                <div className="text-xs text-slate-300 space-y-2">
                                  <div>
                                    <span className="text-slate-500">{zh ? "标题：" : "Title: "}</span>
                                    {draft.title}
                                  </div>
                                  <div>
                                    <span className="text-slate-500">{zh ? "摘要：" : "Summary: "}</span>
                                    {draft.summary}
                                  </div>
                                </div>

                                <textarea
                                  readOnly
                                  value={draft.body}
                                  rows={10}
                                  className="admin-input w-full text-xs leading-relaxed"
                                />

                                <div className="flex flex-wrap gap-2">
                                  {draft.notes.map((note) => (
                                    <span key={note} className="text-[11px] rounded-full bg-slate-800 px-2.5 py-1 text-slate-400">
                                      {note}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
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
