import {
  Activity,
  ArrowLeft,
  Bot,
  Cable,
  ExternalLink,
  Gauge,
  Layers,
  Route as RouteIcon,
  Server,
  ShieldCheck,
} from "lucide-react";
import { Link } from "wouter";
import { SeoManager } from "@/components/SeoManager";
import { useLanguage } from "@/contexts/LanguageContext";
import { goBack, useScrollMemory } from "@/hooks/useScrollMemory";
import { trpc } from "@/lib/trpc";

const MODULES = {
  zh: [
    {
      title: "业务接入层",
      desc: "把注册、返佣、内容分发和用户运营拆成可复用能力，减少重复配置和重复操作。",
      icon: Layers,
    },
    {
      title: "自动化执行层",
      desc: "支持定时任务、规则触发和手动兜底，让高频动作可以稳定跑通并留下执行记录。",
      icon: Bot,
    },
    {
      title: "数据与风控层",
      desc: "统一沉淀日志、状态和失败原因，方便排障、复盘与合规披露。",
      icon: ShieldCheck,
    },
  ],
  en: [
    {
      title: "Business Integration",
      desc: "Split registration, rebates, distribution, and user operations into reusable modules.",
      icon: Layers,
    },
    {
      title: "Automation Runtime",
      desc: "Support scheduled jobs, rule-based triggers, and manual fallback with traceable execution.",
      icon: Bot,
    },
    {
      title: "Data & Risk Layer",
      desc: "Unify logs, status, and failure reasons for faster debugging, review, and disclosure.",
      icon: ShieldCheck,
    },
  ],
} as const;

const FLOWS = {
  zh: [
    { title: "输入", detail: "用户访问 -> 场景识别", icon: RouteIcon },
    { title: "处理", detail: "规则匹配 -> 自动任务分发", icon: Cable },
    { title: "输出", detail: "页面响应 + 后台可观测日志", icon: Gauge },
  ],
  en: [
    { title: "Input", detail: "User visit -> Scenario detection", icon: RouteIcon },
    { title: "Process", detail: "Rule matching -> Automated dispatch", icon: Cable },
    { title: "Output", detail: "Page response + backend observability logs", icon: Gauge },
  ],
} as const;

function formatDate(dateIso: string | null | undefined, language: "zh" | "en") {
  if (!dateIso) return language === "zh" ? "未设置" : "Not set";

  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) {
    return language === "zh" ? "格式异常" : "Invalid";
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
        title: "Codex Business",
        subtitle: "第六板块",
        lead:
          "这个板块用于承载自动化业务能力：把高频运营动作整理成标准化流程，让执行更快、更稳、也更方便排查。",
        structureTitle: "能力结构",
        flowTitle: "执行流程",
        deployTitle: "部署与运行状态",
        deployDesc:
          "这里会实时读取后端状态，方便你确认当前服务是否在线、版本是否同步，以及服务器侧部署有没有真正生效。",
        statusLabel: "服务状态",
        statusOnline: "服务在线",
        statusOffline: "服务关闭",
        mode: "运行模式",
        version: "当前版本",
        operator: "维护主体",
        lastUpdated: "最近更新",
        serverTime: "服务时间",
        consoleTitle: "业务控制台",
        consoleDesc:
          "控制台应用会单独部署在服务器，再通过 get8.pro 同域入口代理访问。这样用户从主站点进去时可以直接使用，不需要切域名。",
        openConsole: "进入业务控制台",
        usageTitle: "接下来怎么用",
        usage:
          "后续你可以继续把媒体后台、任务系统、渠道分发和质保兑换逻辑都接到这里。该页面本身仍然保持懒加载，仅在访问时加载，不影响首页首屏速度。",
        loading: "正在获取后端状态...",
        loadFailed: "后端状态获取失败，已降级显示静态内容。",
        back: "返回",
        home: "首页",
      }
    : {
        title: "Codex Business",
        subtitle: "Module 6",
        lead:
          "This module hosts automation-centric capabilities so repeated operations can run as standardized and observable workflows.",
        structureTitle: "Capability Structure",
        flowTitle: "Execution Flow",
        deployTitle: "Deployment & Runtime",
        deployDesc:
          "This area reads live backend status so you can verify whether the service is online and properly synced after deployment.",
        statusLabel: "Service Status",
        statusOnline: "Online",
        statusOffline: "Disabled",
        mode: "Mode",
        version: "Version",
        operator: "Operator",
        lastUpdated: "Last Update",
        serverTime: "Server Time",
        consoleTitle: "Business Console",
        consoleDesc:
          "The console app is deployed as a separate service and exposed through a same-domain entry under get8.pro for direct access.",
        openConsole: "Open Business Console",
        usageTitle: "How To Use",
        usage:
          "You can keep integrating your media backend, task engine, distribution workflows, and redemption flows here. This route remains lazy-loaded so it does not slow down the homepage.",
        loading: "Fetching backend status...",
        loadFailed: "Failed to fetch backend status. Static content is still available.",
        back: "Back",
        home: "Home",
      };

  return (
    <div className="min-h-screen bg-[#07142A] text-white">
      <SeoManager
        title={zh ? "Codex Business 第六板块 | Get8 Pro" : "Codex Business Module 6 | Get8 Pro"}
        description={
          zh
            ? "Get8 Pro 第六板块：自动化业务能力中心，覆盖流程编排、任务执行、运行状态可观测与同域控制台访问。"
            : "Get8 Pro Module 6: automation business hub covering orchestration, task execution, observability, and same-domain console access."
        }
        path="/codex-business"
      />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#081a30]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
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

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(12,32,62,0.95),rgba(7,20,42,0.92))] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.28)] md:p-8">
          <div className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">
            {copy.subtitle}
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight md:text-5xl">{copy.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">{copy.lead}</p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-black text-white">{copy.structureTitle}</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {MODULES[zh ? "zh" : "en"].map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-cyan-400/35 hover:bg-white/[0.06]"
                >
                  <div className="mb-4 inline-flex rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-2">
                    <Icon className="h-5 w-5 text-cyan-300" />
                  </div>
                  <h3 className="text-lg font-black text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{item.desc}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-10 rounded-[26px] border border-white/10 bg-[#0A1D39]/85 p-6 md:p-7">
          <h2 className="text-2xl font-black text-white">{copy.flowTitle}</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {FLOWS[zh ? "zh" : "en"].map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-2xl border border-white/10 bg-[#08162C] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-black text-cyan-300">
                      {index + 1}
                    </span>
                    <Icon className="h-4 w-4 text-cyan-300" />
                  </div>
                  <div className="text-sm font-black text-white">{step.title}</div>
                  <div className="mt-1 text-sm text-slate-300">{step.detail}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
          <article className="rounded-[26px] border border-cyan-400/25 bg-cyan-400/[0.05] p-6 md:p-7">
            <h2 className="inline-flex items-center gap-2 text-2xl font-black text-white">
              <Server className="h-6 w-6 text-cyan-300" />
              {copy.deployTitle}
            </h2>
            <p className="mt-3 text-sm leading-8 text-slate-200">{copy.deployDesc}</p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-[#08162C] p-4">
              {overviewQuery.isLoading ? (
                <p className="text-sm text-slate-300">{copy.loading}</p>
              ) : overviewQuery.isError ? (
                <p className="text-sm text-rose-300">{copy.loadFailed}</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="mb-1 inline-flex items-center gap-2 text-xs text-slate-400">
                      <Activity className="h-3.5 w-3.5" />
                      {copy.statusLabel}
                    </div>
                    <div
                      className={`text-sm font-black ${
                        data?.enabled ? "text-emerald-300" : "text-rose-300"
                      }`}
                    >
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
                    <div className="text-sm font-black text-white">
                      {formatDate(data?.lastUpdatedAt, zh ? "zh" : "en")}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="mb-1 text-xs text-slate-400">{copy.serverTime}</div>
                    <div className="text-sm font-black text-white">
                      {formatDate(data?.serverTime, zh ? "zh" : "en")}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </article>

          <article className="rounded-[26px] border border-emerald-400/20 bg-emerald-400/[0.05] p-6 md:p-7">
            <h2 className="text-2xl font-black text-white">{copy.consoleTitle}</h2>
            <p className="mt-3 text-sm leading-8 text-slate-200">{copy.consoleDesc}</p>

            <a
              href="/codex-business/app/"
              className="tap-target mt-5 inline-flex items-center gap-2 rounded-2xl border border-cyan-300/40 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-200 transition hover:border-cyan-200 hover:bg-cyan-400/15 hover:text-white"
            >
              {copy.openConsole}
              <ExternalLink className="h-4 w-4" />
            </a>
          </article>
        </section>

        <section className="mt-8 rounded-[26px] border border-emerald-400/20 bg-emerald-400/[0.05] p-6 md:p-7">
          <h2 className="text-2xl font-black text-white">{copy.usageTitle}</h2>
          <p className="mt-3 text-sm leading-8 text-slate-200">{copy.usage}</p>
        </section>
      </main>
    </div>
  );
}
