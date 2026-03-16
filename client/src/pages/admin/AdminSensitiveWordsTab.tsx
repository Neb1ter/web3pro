import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type UpdateLog = {
  id: number;
  source: string;
  sourceName: string;
  addedCount: number;
  skippedCount: number;
  status: string;
  errorMessage: string | null;
  isManual: boolean | null;
  createdAt: string;
};

type WordSource = {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  url: string | null;
};

const STATUS_LOG_COLORS: Record<string, string> = {
  success: "bg-green-900/60 text-green-300",
  failed:  "bg-red-900/60 text-red-300",
  partial: "bg-yellow-900/60 text-yellow-300",
};

type SensitiveWord = {
  id: number;
  word: string;
  platforms: string;
  severity: string;
  replacement: string | null;
  category: string;
  isActive: boolean | null;
};

const SEVERITY_COLORS: Record<string, string> = {
  block: "bg-red-900/60 text-red-300",
  warn: "bg-yellow-900/60 text-yellow-300",
  replace: "bg-blue-900/60 text-blue-300",
};

export function SensitiveWordsTab({ zh }: { zh: boolean }) {
  const listQuery = trpc.sensitiveWords.list.useQuery();
  const addMutation = trpc.sensitiveWords.add.useMutation({
    onSuccess: () => { toast.success(zh ? "已添加" : "Added"); listQuery.refetch(); setShowAdd(false); setAddForm({ word: "", platforms: "all", severity: "warn" as "warn" | "block" | "replace", replacement: "", category: "custom" }); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.sensitiveWords.update.useMutation({
    onSuccess: () => { toast.success(zh ? "已更新" : "Updated"); listQuery.refetch(); setEditing(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.sensitiveWords.delete.useMutation({
    onSuccess: () => { toast.success(zh ? "已删除" : "Deleted"); listQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<{ word: string; platforms: string; severity: "warn" | "block" | "replace"; replacement: string; category: string }>({ word: "", platforms: "all", severity: "warn", replacement: "", category: "custom" });
  const [editing, setEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<SensitiveWord>>({});
  const [filterCategory, setFilterCategory] = useState("all");
  const [checkText, setCheckText] = useState("");

  const checkSensitiveMutation = trpc.articles.checkSensitive.useMutation({
    onSuccess: (data) => {
      if (data.isClean) {
        toast.success(zh ? "✅ 内容合规，无敏感词" : "✅ Content is clean");
      } else {
        toast.warning(zh ? `⚠️ 发现 ${data.flaggedWords.length} 个敏感词` : `⚠️ Found ${data.flaggedWords.length} sensitive words`);
      }
      setCheckResult(data);
    },
  });
  const [checkResult, setCheckResult] = useState<{ isClean: boolean; flaggedWords: Array<{ word: string; positions: number[]; severity: string; replacement?: string | null }> } | null>(null);

  // ── 词库自动更新 ──────────────────────────────────────────────────────────
  const [showUpdatePanel, setShowUpdatePanel] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [updateResult, setUpdateResult] = useState<{ totalAdded: number; totalSkipped: number; successCount: number; failedCount: number; results: Array<{ source: string; sourceName: string; added: number; skipped: number; status: string; error?: string }> } | null>(null);

  const logsQuery = trpc.wordUpdate.logs.useQuery(undefined, { enabled: showUpdatePanel });
  const sourcesQuery = trpc.wordUpdate.sources.useQuery(undefined, { enabled: showUpdatePanel });
  const runUpdateMutation = trpc.wordUpdate.run.useMutation({
    onSuccess: (data) => {
      setUpdateResult(data);
      toast.success(zh ? `词库更新完成：新增 ${data.totalAdded} 个词条` : `Update done: +${data.totalAdded} words`);
      listQuery.refetch();
      logsQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleSource = (id: string) => {
    setSelectedSources(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const words = (listQuery.data ?? []) as SensitiveWord[];
  const categories = ["all", ...Array.from(new Set(words.map(w => w.category)))];
  const filtered = filterCategory === "all" ? words : words.filter(w => w.category === filterCategory);

  const startEdit = (w: SensitiveWord) => {
    setEditing(w.id);
    setEditForm({ word: w.word, platforms: w.platforms, severity: w.severity, replacement: w.replacement ?? "", category: w.category, isActive: w.isActive ?? true });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-white">{zh ? "🔍 敏感词库管理" : "🔍 Sensitive Words"}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUpdatePanel(!showUpdatePanel)}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-all ${
              showUpdatePanel
                ? "border-cyan-500 bg-cyan-900/40 text-cyan-200"
                : "border-slate-600 bg-slate-700/40 text-slate-300 hover:border-slate-500"
            }`}
          >
            {zh ? "🔄 自动更新词库" : "🔄 Auto Update"}
          </button>
          <button onClick={() => setShowAdd(!showAdd)} className="admin-btn-primary text-sm">
            {zh ? "+ 添加敏感词" : "+ Add Word"}
          </button>
        </div>
      </div>

      {/* ── 词库自动更新面板 ─────────────────────────────────────────────── */}
      {showUpdatePanel && (
        <div className="space-y-4">
          {/* 来源选择 */}
          <div className="bg-slate-800/60 border border-cyan-700/30 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-cyan-300 font-semibold text-sm">{zh ? "📦 词库来源" : "📦 Word Sources"}</h3>
              <span className="text-xs text-slate-500">
                {zh ? "选择要更新的来源（不选则更新所有启用来源）" : "Select sources to update (empty = all enabled)"}
              </span>
            </div>
            {sourcesQuery.isLoading ? (
              <div className="flex gap-2 items-center text-slate-400 text-sm">
                <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                {zh ? "加载来源列表..." : "Loading sources..."}
              </div>
            ) : (
              <div className="space-y-2">
                {(sourcesQuery.data ?? [] as WordSource[]).map((s: WordSource) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`src-${s.id}`}
                      checked={selectedSources.includes(s.id)}
                      onChange={() => toggleSource(s.id)}
                      className="accent-cyan-500"
                    />
                    <label htmlFor={`src-${s.id}`} className="flex items-center gap-2 cursor-pointer">
                      <span className="text-white text-sm">{s.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        s.type === "ai" ? "bg-purple-900/60 text-purple-300" :
                        s.type === "github" ? "bg-blue-900/60 text-blue-300" :
                        "bg-slate-700 text-slate-400"
                      }`}>{s.type}</span>
                      {!s.enabled && <span className="text-xs text-yellow-500">{zh ? "已禁用" : "disabled"}</span>}
                      {s.url && <span className="text-xs text-slate-500 truncate max-w-xs">{s.url}</span>}
                    </label>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3 items-center pt-1">
              <button
                onClick={() => {
                  setUpdateResult(null);
                  runUpdateMutation.mutate({ sourceIds: selectedSources.length > 0 ? selectedSources : undefined });
                }}
                disabled={runUpdateMutation.isPending}
                className="admin-btn-primary text-sm"
              >
                {runUpdateMutation.isPending
                  ? (zh ? "更新中..." : "Updating...")
                  : (zh
                    ? selectedSources.length > 0 ? `🚀 更新选中来源 (${selectedSources.length})` : "🚀 更新所有启用来源"
                    : selectedSources.length > 0 ? `🚀 Update Selected (${selectedSources.length})` : "🚀 Update All Enabled"
                  )}
              </button>
              {selectedSources.length > 0 && (
                <button onClick={() => setSelectedSources([])} className="text-xs text-slate-400 hover:text-white">
                  {zh ? "清除选择" : "Clear"}
                </button>
              )}
            </div>

            {/* 本次更新结果 */}
            {updateResult && (
              <div className="mt-3 bg-slate-900/60 rounded-lg p-4 space-y-3">
                <div className="flex gap-4 flex-wrap">
                  <span className="text-sm text-green-300">+{updateResult.totalAdded} {zh ? "新增" : "added"}</span>
                  <span className="text-sm text-slate-400">{updateResult.totalSkipped} {zh ? "跳过" : "skipped"}</span>
                  <span className="text-sm text-green-300">{updateResult.successCount} {zh ? "成功" : "success"}</span>
                  {updateResult.failedCount > 0 && (
                    <span className="text-sm text-red-300">{updateResult.failedCount} {zh ? "失败" : "failed"}</span>
                  )}
                </div>
                <div className="space-y-1">
                  {updateResult.results.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={`px-1.5 py-0.5 rounded ${STATUS_LOG_COLORS[r.status] ?? "bg-slate-700 text-slate-300"}`}>{r.status}</span>
                      <span className="text-slate-300">{r.sourceName}</span>
                      <span className="text-green-400">+{r.added}</span>
                      <span className="text-slate-500">{zh ? "跳过" : "skip"} {r.skipped}</span>
                      {r.error && <span className="text-red-400 truncate max-w-xs">{r.error}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 更新日志 */}
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 space-y-3">
            <h3 className="text-slate-300 font-medium text-sm">{zh ? "📋 更新日志" : "📋 Update Logs"}</h3>
            {logsQuery.isLoading ? (
              <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (logsQuery.data ?? []).length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">{zh ? "暂无更新记录" : "No update logs yet"}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 text-left">
                      <th className="py-2 px-2">{zh ? "时间" : "Time"}</th>
                      <th className="py-2 px-2">{zh ? "来源" : "Source"}</th>
                      <th className="py-2 px-2">{zh ? "新增" : "Added"}</th>
                      <th className="py-2 px-2">{zh ? "跳过" : "Skipped"}</th>
                      <th className="py-2 px-2">{zh ? "状态" : "Status"}</th>
                      <th className="py-2 px-2">{zh ? "触发方式" : "Trigger"}</th>
                      <th className="py-2 px-2">{zh ? "备注" : "Note"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(logsQuery.data as UpdateLog[]).map((log) => (
                      <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                        <td className="py-2 px-2 text-slate-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString(zh ? "zh-CN" : "en-US", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-2 px-2 text-white">{log.sourceName}</td>
                        <td className="py-2 px-2 text-green-400 font-medium">+{log.addedCount}</td>
                        <td className="py-2 px-2 text-slate-400">{log.skippedCount}</td>
                        <td className="py-2 px-2">
                          <span className={`px-1.5 py-0.5 rounded ${STATUS_LOG_COLORS[log.status] ?? "bg-slate-700 text-slate-300"}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          <span className={`px-1.5 py-0.5 rounded ${log.isManual ? "bg-purple-900/60 text-purple-300" : "bg-slate-700 text-slate-400"}`}>
                            {log.isManual ? (zh ? "手动" : "manual") : (zh ? "自动" : "auto")}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-red-400 max-w-xs truncate">{log.errorMessage ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="bg-slate-800/60 border border-cyan-700/40 rounded-xl p-5 space-y-4">
          <h3 className="text-cyan-300 font-semibold">{zh ? "添加敏感词" : "Add Sensitive Word"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">{zh ? "敏感词" : "Word"}</label>
              <input className="admin-input w-full" value={addForm.word} onChange={e => setAddForm(f => ({ ...f, word: e.target.value }))} placeholder={zh ? "输入敏感词..." : "Enter word..."} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{zh ? "适用平台" : "Platforms"}</label>
              <select className="admin-input w-full" value={addForm.platforms} onChange={e => setAddForm(f => ({ ...f, platforms: e.target.value }))}>
                <option value="all">{zh ? "全部平台" : "All Platforms"}</option>
                <option value="wechat">{zh ? "微信公众号" : "WeChat"}</option>
                <option value="weibo">{zh ? "微博" : "Weibo"}</option>
                <option value="douyin">{zh ? "抖音" : "Douyin"}</option>
                <option value="telegram">Telegram</option>
                <option value="twitter">Twitter/X</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{zh ? "处理方式" : "Severity"}</label>
              <select className="admin-input w-full" value={addForm.severity} onChange={e => setAddForm(f => ({ ...f, severity: e.target.value as "warn" | "block" | "replace" }))}>
                <option value="warn">{zh ? "警告（标记）" : "Warn (flag)"}</option>
                <option value="block">{zh ? "阻止（禁止发布）" : "Block (prevent publish)"}</option>
                <option value="replace">{zh ? "替换（自动替换）" : "Replace (auto-replace)"}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{zh ? "替换词（仅替换模式）" : "Replacement (replace mode only)"}</label>
              <input className="admin-input w-full" value={addForm.replacement} onChange={e => setAddForm(f => ({ ...f, replacement: e.target.value }))} placeholder={zh ? "替换为..." : "Replace with..."} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{zh ? "分类" : "Category"}</label>
              <select className="admin-input w-full" value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}>
                <option value="custom">{zh ? "自定义" : "Custom"}</option>
                <option value="political">{zh ? "政治敏感" : "Political"}</option>
                <option value="financial">{zh ? "金融监管" : "Financial"}</option>
                <option value="violence">{zh ? "暴力违禁" : "Violence"}</option>
                <option value="adult">{zh ? "成人内容" : "Adult"}</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => addMutation.mutate(addForm)} disabled={!addForm.word || addMutation.isPending} className="admin-btn-primary">
              {addMutation.isPending ? (zh ? "添加中..." : "Adding...") : (zh ? "确认添加" : "Add")}
            </button>
            <button onClick={() => setShowAdd(false)} className="admin-btn-ghost">{zh ? "取消" : "Cancel"}</button>
          </div>
        </div>
      )}

      {/* Content check tool */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 space-y-3">
        <h3 className="text-slate-300 font-medium text-sm">{zh ? "🔎 内容合规检测工具" : "🔎 Content Compliance Check"}</h3>
        <textarea
          className="admin-input w-full text-sm"
          rows={4}
          placeholder={zh ? "粘贴要检测的内容..." : "Paste content to check..."}
          value={checkText}
          onChange={e => setCheckText(e.target.value)}
        />
        <div className="flex gap-2 items-center">
          <button
            onClick={() => { setCheckResult(null); checkSensitiveMutation.mutate({ content: checkText }); }}
            disabled={!checkText || checkSensitiveMutation.isPending}
            className="admin-btn-primary text-sm"
          >
            {checkSensitiveMutation.isPending ? (zh ? "检测中..." : "Checking...") : (zh ? "🔍 开始检测" : "🔍 Check")}
          </button>
          {checkResult && (
            <span className={`text-sm px-3 py-1 rounded ${checkResult.isClean ? "bg-green-900/60 text-green-300" : "bg-red-900/60 text-red-300"}`}>
              {checkResult.isClean ? (zh ? "✅ 合规" : "✅ Clean") : (zh ? `⚠️ ${checkResult.flaggedWords.length} 个敏感词` : `⚠️ ${checkResult.flaggedWords.length} found`)}
            </span>
          )}
        </div>
        {checkResult && !checkResult.isClean && (
          <div className="flex flex-wrap gap-2">
            {checkResult.flaggedWords.map((w, i) => (
              <span key={i} className={`text-xs px-2 py-1 rounded border ${SEVERITY_COLORS[w.severity] ?? "bg-slate-700 text-slate-300"} border-current/30`}>
                "{w.word}" — {w.severity}{w.replacement ? ` → "${w.replacement}"` : ""}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setFilterCategory(c)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all ${filterCategory === c ? "bg-cyan-600 text-white" : "bg-slate-700/60 text-slate-400 hover:text-white"}`}
          >
            {c === "all" ? (zh ? "全部" : "All") : c}
          </button>
        ))}
      </div>

      {/* Words table */}
      {listQuery.isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-left">
                <th className="py-3 px-3">{zh ? "敏感词" : "Word"}</th>
                <th className="py-3 px-3">{zh ? "平台" : "Platform"}</th>
                <th className="py-3 px-3">{zh ? "处理方式" : "Severity"}</th>
                <th className="py-3 px-3">{zh ? "替换词" : "Replacement"}</th>
                <th className="py-3 px-3">{zh ? "分类" : "Category"}</th>
                <th className="py-3 px-3">{zh ? "状态" : "Status"}</th>
                <th className="py-3 px-3">{zh ? "操作" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(w => (
                <tr key={w.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                  {editing === w.id ? (
                    <>
                      <td className="py-2 px-3"><input className="admin-input w-full text-xs" value={editForm.word ?? ""} onChange={e => setEditForm(f => ({ ...f, word: e.target.value }))} /></td>
                      <td className="py-2 px-3">
                        <select className="admin-input text-xs" value={editForm.platforms ?? "all"} onChange={e => setEditForm(f => ({ ...f, platforms: e.target.value }))}>
                          <option value="all">all</option>
                          <option value="wechat">wechat</option>
                          <option value="weibo">weibo</option>
                          <option value="douyin">douyin</option>
                          <option value="telegram">telegram</option>
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <select className="admin-input text-xs" value={editForm.severity ?? "warn"} onChange={e => setEditForm(f => ({ ...f, severity: e.target.value }))}>
                          <option value="warn">warn</option>
                          <option value="block">block</option>
                          <option value="replace">replace</option>
                        </select>
                      </td>
                      <td className="py-2 px-3"><input className="admin-input w-full text-xs" value={editForm.replacement ?? ""} onChange={e => setEditForm(f => ({ ...f, replacement: e.target.value }))} /></td>
                      <td className="py-2 px-3"><input className="admin-input w-full text-xs" value={editForm.category ?? ""} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} /></td>
                      <td className="py-2 px-3">
                        <input type="checkbox" checked={editForm.isActive ?? true} onChange={e => setEditForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-cyan-500" />
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-1">
                          <button onClick={() => updateMutation.mutate({ id: w.id, word: editForm.word, platforms: editForm.platforms, severity: editForm.severity as "warn" | "block" | "replace" | undefined, replacement: editForm.replacement, category: editForm.category, isActive: editForm.isActive ?? undefined })} className="admin-btn-primary text-xs">{zh ? "保存" : "Save"}</button>
                          <button onClick={() => setEditing(null)} className="admin-btn-ghost text-xs">{zh ? "取消" : "Cancel"}</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 px-3 text-white font-medium">{w.word}</td>
                      <td className="py-2 px-3 text-slate-400">{w.platforms}</td>
                      <td className="py-2 px-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${SEVERITY_COLORS[w.severity] ?? "bg-slate-700 text-slate-300"}`}>{w.severity}</span>
                      </td>
                      <td className="py-2 px-3 text-slate-400">{w.replacement ?? "-"}</td>
                      <td className="py-2 px-3 text-slate-400">{w.category}</td>
                      <td className="py-2 px-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${w.isActive ? "bg-green-900/60 text-green-300" : "bg-slate-700 text-slate-500"}`}>
                          {w.isActive ? (zh ? "启用" : "Active") : (zh ? "禁用" : "Inactive")}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(w)} className="admin-btn-primary text-xs">{zh ? "编辑" : "Edit"}</button>
                          <button onClick={() => { if (confirm(zh ? "确认删除？" : "Confirm?")) deleteMutation.mutate({ id: w.id }); }} className="admin-btn-danger text-xs">{zh ? "删除" : "Del"}</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-slate-500">{zh ? "暂无数据" : "No data"}</div>
          )}
        </div>
      )}
    </div>
  );
}
