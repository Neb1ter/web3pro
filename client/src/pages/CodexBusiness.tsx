import {
  Activity,
  ArrowLeft,
  ExternalLink,
  MonitorPlay,
  Server,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import { SeoManager } from "@/components/SeoManager";
import { useLanguage } from "@/contexts/LanguageContext";
import { goBack, useScrollMemory } from "@/hooks/useScrollMemory";
import { trpc } from "@/lib/trpc";

function formatDate(dateIso: string | null | undefined, language: "zh" | "en") {
  if (!dateIso) return language === "zh" ? "未设置" : "Not set";

  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) {
    return language === "zh" ? "时间格式异常" : "Invalid time";
  }

  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function CodexBusiness() {
  useScrollMemory();
  const { language } = useLanguage();
  const zh = language === "zh";

  const overviewQuery = trpc.codexBusiness.overview.useQuery(undefined, {
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const data = overviewQuery.data;

  const copy = zh
    ? {
        title: "Codex Business 自动化中心",
        subtitle: "第六板块",
        lead:
          "这里是第六板块的真实业务入口，不是静态展示页。用户可以在 get8.pro 内直接完成兑换、质保查询和质保重兑，前后端路由与主站保持同域对齐。",
        statusTitle: "运行状态",
        statusDesc:
          "这里会读取第六板块的实时部署信息，用来确认当前模块是否已经挂载在主站进程内，以及最近一次版本更新时间是否正常。",
        statusLabel: "当前状态",
        statusOnline: "已启用",
        statusOffline: "未启用",
        mode: "运行模式",
        version: "当前版本",
        operator: "维护主体",
        lastUpdated: "最近更新时间",
        serverTime: "服务时间",
        quickTitle: "业务入口说明",
        quickDesc:
          "下方嵌入的是实际控制台。只要这里能正常加载，就说明同域挂载、业务接口和前端资源都已经对齐。",
        quickPoints: [
          "兑换、质保查询、质保重兑统一在一个界面完成",
          "只在访问第六板块时才加载控制台资源，不拖慢首页",
          "由主站直接挂载，不再依赖额外代理链路",
        ],
        openConsole: "单独打开控制台",
        embedTitle: "同域业务控制台",
        embedDesc:
          "如果下方控制台可以正常显示，就说明 Codex Business 已经作为 get8.pro 的同域子应用运行，而不是失联的外部页面。",
        loading: "正在获取运行状态...",
        loadFailed: "运行状态读取失败，但你仍然可以尝试直接打开下方控制台。",
        back: "返回",
        home: "首页",
        sameDomainTitle: "同域访问",
        sameDomainDesc: "用户停留在 get8.pro 内即可完成操作，不需要跳转到其他域名。",
        lazyTitle: "按访问加载",
        lazyDesc: "只有打开第六板块时才加载控制台资源，不会拖慢首页。",
        mountedTitle: "主站内挂载",
        mountedDesc: "第六板块直接挂在主站进程里，避免独立代理失联导致页面失效。",
      }
    : {
        title: "Codex Business Automation Hub",
        subtitle: "Module 6",
        lead:
          "This is the live business entry for Module 6 inside get8.pro. Users can redeem, query warranty, and submit warranty reissues without leaving the main site.",
        statusTitle: "Runtime Status",
        statusDesc:
          "This panel reads the live deployment state to confirm the module is mounted inside the main site process and updated correctly.",
        statusLabel: "Current Status",
        statusOnline: "Enabled",
        statusOffline: "Disabled",
        mode: "Mode",
        version: "Version",
        operator: "Operator",
        lastUpdated: "Last Updated",
        serverTime: "Server Time",
        quickTitle: "Business Entry Notes",
        quickDesc:
          "The embedded console below is the real module. If it loads, the frontend assets, backend handlers, and same-domain routing are aligned.",
        quickPoints: [
          "Redeem, warranty query, and warranty reissue stay in one flow",
          "Loads only when this module is opened",
          "Mounted directly inside the main site instead of relying on an extra proxy chain",
        ],
        openConsole: "Open Console",
        embedTitle: "Same-Domain Business Console",
        embedDesc:
          "If the console below renders correctly, Codex Business is running as a same-domain child app inside get8.pro.",
        loading: "Fetching runtime status...",
        loadFailed: "Runtime status failed to load, but you can still try the console below.",
        back: "Back",
        home: "Home",
        sameDomainTitle: "Same-Domain Access",
        sameDomainDesc: "Users stay inside get8.pro for the full workflow.",
        lazyTitle: "Visit-Only Loading",
        lazyDesc: "Console resources load only when this module is opened.",
        mountedTitle: "Mounted In Main App",
        mountedDesc: "The console is mounted inside the main app instead of relying on a fragile extra proxy layer.",
      };

  return (
    <div className="min-h-screen bg-[#07142A] text-white">
      <SeoManager
        title={zh ? "Codex Business 自动化中心 | Get8 Pro" : "Codex Business Automation Hub | Get8 Pro"}
        description={
          zh
            ? "Get8 Pro 第六板块：同域运行的 Codex Business 控制台，可直接完成兑换、质保查询与质保重兑。"
            : "Get8 Pro Module 6: a same-domain Codex Business console for redeem, warranty query, and warranty reissue workflows."
        }
        path="/codex-business"
      />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#081a30]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <button
            type="button"
            onClick={() => goBack()}
            className="tap-target inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {copy.back}
          </button>
          <div className="text-sm font-semibold text-slate-300">{copy.title}</div>
          <Link href="/" className="tap-target text-sm text-slate-400 transition hover:text-white">
            {copy.home}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(12,32,62,0.95),rgba(7,20,42,0.92))] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.28)] md:p-8">
          <div className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">
            {copy.subtitle}
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight md:text-5xl">{copy.title}</h1>
          <p className="mt-4 max-w-4xl text-base leading-8 text-slate-300 md:text-lg">{copy.lead}</p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-2 inline-flex rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-2">
                <ShieldCheck className="h-5 w-5 text-cyan-300" />
              </div>
              <div className="text-sm font-black text-white">{copy.sameDomainTitle}</div>
              <div className="mt-1 text-sm text-slate-300">{copy.sameDomainDesc}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-2 inline-flex rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-2">
                <Zap className="h-5 w-5 text-cyan-300" />
              </div>
              <div className="text-sm font-black text-white">{copy.lazyTitle}</div>
              <div className="mt-1 text-sm text-slate-300">{copy.lazyDesc}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-2 inline-flex rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-2">
                <Server className="h-5 w-5 text-cyan-300" />
              </div>
              <div className="text-sm font-black text-white">{copy.mountedTitle}</div>
              <div className="mt-1 text-sm text-slate-300">{copy.mountedDesc}</div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <article className="rounded-[26px] border border-cyan-400/25 bg-cyan-400/[0.05] p-6 md:p-7">
            <h2 className="inline-flex items-center gap-2 text-2xl font-black text-white">
              <Activity className="h-6 w-6 text-cyan-300" />
              {copy.statusTitle}
            </h2>
            <p className="mt-3 text-sm leading-8 text-slate-200">{copy.statusDesc}</p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-[#08162C] p-4">
              {overviewQuery.isLoading ? (
                <p className="text-sm text-slate-300">{copy.loading}</p>
              ) : overviewQuery.isError ? (
                <p className="text-sm text-rose-300">{copy.loadFailed}</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="mb-1 text-xs text-slate-400">{copy.statusLabel}</div>
                    <div className={`text-sm font-black ${data?.enabled ? "text-emerald-300" : "text-rose-300"}`}>
                      {data?.enabled ? copy.statusOnline : copy.statusOffline}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="mb-1 text-xs text-slate-400">{copy.mode}</div>
                    <div className="text-sm font-black text-white">{data?.mode ?? "--"}</div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="mb-1 text-xs text-slate-400">{copy.version}</div>
                    <div className="text-sm font-black text-white">{data?.version ?? "--"}</div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="mb-1 text-xs text-slate-400">{copy.operator}</div>
                    <div className="text-sm font-black text-white">{data?.operator ?? "--"}</div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="mb-1 text-xs text-slate-400">{copy.lastUpdated}</div>
                    <div className="text-sm font-black text-white">{formatDate(data?.lastUpdatedAt, zh ? "zh" : "en")}</div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="mb-1 text-xs text-slate-400">{copy.serverTime}</div>
                    <div className="text-sm font-black text-white">{formatDate(data?.serverTime, zh ? "zh" : "en")}</div>
                  </div>
                </div>
              )}
            </div>
          </article>

          <article className="rounded-[26px] border border-emerald-400/20 bg-emerald-400/[0.05] p-6 md:p-7">
            <h2 className="inline-flex items-center gap-2 text-2xl font-black text-white">
              <MonitorPlay className="h-6 w-6 text-emerald-300" />
              {copy.quickTitle}
            </h2>
            <p className="mt-3 text-sm leading-8 text-slate-200">{copy.quickDesc}</p>

            <ul className="mt-5 space-y-3">
              {copy.quickPoints.map((point) => (
                <li
                  key={point}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-slate-200"
                >
                  {point}
                </li>
              ))}
            </ul>

            <a
              href="/codex-business/app/"
              className="tap-target mt-6 inline-flex items-center gap-2 rounded-2xl border border-cyan-300/40 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-200 transition hover:border-cyan-200 hover:bg-cyan-400/15 hover:text-white"
            >
              {copy.openConsole}
              <ExternalLink className="h-4 w-4" />
            </a>
          </article>
        </section>

        <section className="mt-8 rounded-[30px] border border-white/10 bg-[rgba(7,18,34,0.9)] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.25)] md:p-6">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">{copy.embedTitle}</h2>
              <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-300">{copy.embedDesc}</p>
            </div>
            <a
              href="/codex-business/app/"
              className="tap-target inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/50 hover:text-white"
            >
              {copy.openConsole}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#061020]">
            <iframe
              title={copy.embedTitle}
              src="/codex-business/app/"
              loading="lazy"
              className="block h-[1280px] w-full border-0 bg-[#061020] md:h-[1180px]"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
