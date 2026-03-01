import { useState } from "react";
import { trpc } from "@/lib/trpc";

type PublishLog = {
  id: number;
  articleId: number | null;
  platform: string;
  status: string;
  errorMessage: string | null;
  publishedUrl: string | null;
  createdAt: string | null;
  article?: { title: string; slug: string } | null;
};

const STATUS_COLORS: Record<string, string> = {
  success: "bg-green-900/60 text-green-300",
  failed: "bg-red-900/60 text-red-300",
  pending: "bg-yellow-900/60 text-yellow-300",
  skipped: "bg-slate-700 text-slate-400",
};

const PLATFORM_ICONS: Record<string, string> = {
  telegram: "✈️",
  wechat: "💬",
  weibo: "🌐",
  twitter: "🐦",
  douyin: "🎵",
};

export function PublishLogsTab({ zh }: { zh: boolean }) {
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const listQuery = trpc.publishLogs.list.useQuery({ platform: filterPlatform === "all" ? undefined : filterPlatform, status: filterStatus === "all" ? undefined : filterStatus, limit: 100 });

  const logs = (listQuery.data ?? []) as PublishLog[];

  const platforms = ["all", "telegram", "wechat", "weibo", "twitter", "douyin"];
  const statuses = ["all", "success", "failed", "pending", "skipped"];

  const successCount = logs.filter(l => l.status === "success").length;
  const failedCount = logs.filter(l => l.status === "failed").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{zh ? "📋 推送日志" : "📋 Publish Logs"}</h2>
        <button onClick={() => listQuery.refetch()} className="admin-btn-ghost text-sm">
          {zh ? "🔄 刷新" : "🔄 Refresh"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{logs.length}</div>
          <div className="text-xs text-slate-400 mt-1">{zh ? "总推送次数" : "Total Pushes"}</div>
        </div>
        <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-300">{successCount}</div>
          <div className="text-xs text-slate-400 mt-1">{zh ? "成功" : "Success"}</div>
        </div>
        <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-300">{failedCount}</div>
          <div className="text-xs text-slate-400 mt-1">{zh ? "失败" : "Failed"}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex gap-1">
          <span className="text-xs text-slate-500 self-center mr-1">{zh ? "平台:" : "Platform:"}</span>
          {platforms.map(p => (
            <button key={p} onClick={() => setFilterPlatform(p)} className={`text-xs px-2 py-1 rounded transition-all ${filterPlatform === p ? "bg-cyan-600 text-white" : "bg-slate-700/60 text-slate-400 hover:text-white"}`}>
              {p === "all" ? (zh ? "全部" : "All") : `${PLATFORM_ICONS[p] ?? ""}${p}`}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <span className="text-xs text-slate-500 self-center mr-1">{zh ? "状态:" : "Status:"}</span>
          {statuses.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`text-xs px-2 py-1 rounded transition-all ${filterStatus === s ? "bg-cyan-600 text-white" : "bg-slate-700/60 text-slate-400 hover:text-white"}`}>
              {s === "all" ? (zh ? "全部" : "All") : s}
            </button>
          ))}
        </div>
      </div>

      {/* Logs table */}
      {listQuery.isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-slate-500">{zh ? "暂无推送记录" : "No push logs yet"}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-left">
                <th className="py-3 px-3">{zh ? "时间" : "Time"}</th>
                <th className="py-3 px-3">{zh ? "文章" : "Article"}</th>
                <th className="py-3 px-3">{zh ? "平台" : "Platform"}</th>
                <th className="py-3 px-3">{zh ? "状态" : "Status"}</th>
                <th className="py-3 px-3">{zh ? "详情" : "Details"}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                  <td className="py-2 px-3 text-slate-400 text-xs whitespace-nowrap">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString("zh-CN") : "-"}
                  </td>
                  <td className="py-2 px-3 max-w-xs">
                    {log.article ? (
                      <a href={`/article/${log.article.slug}`} target="_blank" className="text-cyan-400 hover:text-cyan-300 text-xs truncate block">
                        {log.article.title}
                      </a>
                    ) : (
                      <span className="text-slate-500 text-xs">ID: {log.articleId ?? "-"}</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <span className="text-sm">{PLATFORM_ICONS[log.platform] ?? "📱"} {log.platform}</span>
                  </td>
                  <td className="py-2 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[log.status] ?? "bg-slate-700 text-slate-300"}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-xs">
                    {log.publishedUrl ? (
                      <a href={log.publishedUrl} target="_blank" className="text-cyan-400 hover:underline">{zh ? "查看" : "View"}</a>
                    ) : log.errorMessage ? (
                      <span className="text-red-400 truncate max-w-xs block" title={log.errorMessage}>{log.errorMessage}</span>
                    ) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
