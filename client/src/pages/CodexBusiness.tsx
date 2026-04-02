import { ArrowLeft, Bot, Cable, Gauge, Layers, Route as RouteIcon, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { SeoManager } from "@/components/SeoManager";
import { useLanguage } from "@/contexts/LanguageContext";
import { goBack, useScrollMemory } from "@/hooks/useScrollMemory";

const MODULES = {
  zh: [
    {
      title: "业务接入层",
      desc: "把注册、返佣、内容分发、用户运营拆成可复用的业务模块，减少重复操作。",
      icon: Layers,
    },
    {
      title: "自动化执行层",
      desc: "支持定时任务、规则触发和手动兜底，确保任务稳定落地，异常可追踪。",
      icon: Bot,
    },
    {
      title: "数据与风控层",
      desc: "统一记录执行日志、状态与失败原因，便于排障、复盘和合规披露。",
      icon: ShieldCheck,
    },
  ],
  en: [
    {
      title: "Business Integration",
      desc: "Split registration, rebates, content distribution, and operations into reusable modules.",
      icon: Layers,
    },
    {
      title: "Automation Runtime",
      desc: "Support scheduler jobs, rule-triggered flows, and manual fallback with traceability.",
      icon: Bot,
    },
    {
      title: "Data & Risk Layer",
      desc: "Unify logs, statuses, and failures for faster debugging, review, and compliance disclosure.",
      icon: ShieldCheck,
    },
  ],
} as const;

const FLOWS = {
  zh: [
    { title: "输入", detail: "用户访问 → 场景识别", icon: RouteIcon },
    { title: "处理", detail: "规则匹配 → 自动任务分发", icon: Cable },
    { title: "输出", detail: "页面响应 + 后台日志沉淀", icon: Gauge },
  ],
  en: [
    { title: "Input", detail: "Visit event -> Scenario detection", icon: RouteIcon },
    { title: "Process", detail: "Rule matching -> Automated dispatch", icon: Cable },
    { title: "Output", detail: "Response + backend observability", icon: Gauge },
  ],
} as const;

export default function CodexBusiness() {
  useScrollMemory();
  const { language } = useLanguage();
  const zh = language === "zh";
  const copy = zh
    ? {
        title: "Codex Business",
        subtitle: "第六板块",
        lead:
          "这个板块用于承载自动化业务能力：把高频运营动作整理为标准化流程，让执行更快、更稳、更可审计。",
        sectionA: "能力结构",
        sectionB: "执行流程",
        sectionC: "使用方式",
        usage:
          "建议把它作为“运营自动化中心”，后续可继续接入你现有媒体站、后台任务和渠道分发逻辑。当前页面已经独立路由懒加载，不会拖慢首页首屏。",
        back: "返回",
        home: "首页",
      }
    : {
        title: "Codex Business",
        subtitle: "Module 6",
        lead:
          "This module hosts automation-centric business capabilities so repeated operations can run as standardized, observable workflows.",
        sectionA: "Capability Structure",
        sectionB: "Execution Flow",
        sectionC: "How To Use",
        usage:
          "Use this as your operations-automation hub. You can keep integrating media workflows, backend jobs, and channel delivery. This route is lazy-loaded and does not increase homepage first paint cost.",
        back: "Back",
        home: "Home",
      };

  return (
    <div className="min-h-screen bg-[#07142A] text-white">
      <SeoManager
        title={zh ? "Codex Business | Get8 Pro" : "Codex Business | Get8 Pro"}
        description={
          zh
            ? "Get8 Pro 第六板块：自动化业务模块，覆盖流程编排、任务执行、日志可观测与风控沉淀。"
            : "Get8 Pro Module 6: automation business capabilities for orchestration, execution, observability, and risk tracking."
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
          <h2 className="text-2xl font-black text-white">{copy.sectionA}</h2>
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
          <h2 className="text-2xl font-black text-white">{copy.sectionB}</h2>
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

        <section className="mt-8 rounded-[26px] border border-emerald-400/20 bg-emerald-400/[0.05] p-6 md:p-7">
          <h2 className="text-2xl font-black text-white">{copy.sectionC}</h2>
          <p className="mt-3 text-sm leading-8 text-slate-200">{copy.usage}</p>
        </section>
      </main>
    </div>
  );
}

