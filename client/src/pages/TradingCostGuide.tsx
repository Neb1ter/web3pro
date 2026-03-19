import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Calculator, ChevronRight, ExternalLink, FileBarChart2, Link2, ShieldCheck, WalletCards } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useExchangeLinks } from "@/contexts/ExchangeLinksContext";
import { useScrollMemory } from "@/hooks/useScrollMemory";
import { preloadRoutes } from "@/lib/routePreload";
import { TrustSignalsCard } from "@/components/TrustSignalsCard";
import { TRUST_LAST_REVIEWED } from "@/lib/trust";

const PAGE_COPY = {
  zh: {
    badge: "交易成本优化指南",
    title: "先看规则，再决定去哪里开户。",
    subtitle:
      "这一页把默认 20% 的通用规则、五家平台、老账户限制、下载路径和联系动作放在同一条阅读链里，减少重复跳页。",
    classic: "查看当前经典版页面",
    quickNav: "快速定位",
    quickItems: [
      { id: "overview", label: "总览" },
      { id: "calculator", label: "计算示例" },
      { id: "supported", label: "支持平台" },
      { id: "how-to-get", label: "获取路径" },
      { id: "action", label: "下一步" },
    ],
    facts: [
      { title: "默认返佣", value: "20%", note: "统一展示，便于快速判断" },
      { title: "支持平台", value: "5 家", note: "如果你需要别的平台，可直接联系" },
      { title: "老账户限制", value: "通常不能补绑", note: "先确认限制，再决定下一步" },
      { title: "更高额度", value: "需单独联系", note: "不默认展示更高数值，避免误导" },
    ],
    pathTitle: "三种常见进入方式",
    pathCards: [
      {
        key: "new",
        title: "我是新用户",
        desc: "先拿默认 20%，再决定是否需要更高额度或更换平台。",
        section: "how-to-get",
        badge: "新用户",
      },
      {
        key: "trader",
        title: "我已经在交易",
        desc: "直接看计算示例、支持平台和操作路径，减少犹豫成本。",
        section: "calculator",
        badge: "高意图",
      },
      {
        key: "old",
        title: "我是老账户",
        desc: "先看不能补绑的限制，再决定是否走新账户或联系处理。",
        section: "action",
        badge: "老用户",
      },
    ],
    exampleTitle: "固定示例",
    exampleDesc: "按默认 20% 计算，避免出现标题和数字不一致。",
    standardFee: "标准手续费",
    rebateAmount: "20% 返佣金额",
    actualPaid: "实际支付手续费",
    annualSavings: "按每月相同交易量计算，一年约节省",
    calcTitle: "交易成本测算器",
    calcVolume: "月交易量",
    calcRate: "手续费率",
    calcRebate: "返佣比例",
    calcMonthlyFee: "月手续费",
    calcMonthlyRebate: "月返佣",
    calcActualFee: "实际费用",
    calcYearlySaving: "年化节省",
    calcNote: "默认返佣固定为 20%。如需更高额度，以实际沟通结果为准。",
    supportedTitle: "当前支持的交易所",
    supportedDesc: "你可以先看平台，再决定是否要看下载页或总对比。",
    supportedPrimary: "官方下载与开户链接",
    supportedSecondary: "查看平台对比",
    howToGetTitle: "获取路径",
    howToGetSubtitle: "先把限制说清楚，再给出最短动作路径。",
    stepsNewTitle: "新用户怎么做",
    stepsOldTitle: "老用户怎么判断",
    newSteps: [
      "先确定你打算使用的平台，默认先看这五家支持的平台。",
      "通过下载页或开户链接进入，确保默认 20% 规则已生效。",
      "如果你需要更高额度，再联系 Get8 Pro 单独沟通。",
    ],
    oldSteps: [
      "老账户通常不能补绑返佣，这一条要先接受，不要反复试错。",
      "如果还没有重要历史资产，可以评估是否重新开新账户。",
      "如果你不确定怎么处理，直接联系，我们再按你的账户情况给建议。",
    ],
    actionTitle: "下一步建议",
    actionSubtitle: "让不同访客都能直接看到下一步，而不是自己在页面里猜。",
    actionCards: [
      { title: "先去下载页", desc: "适合新用户，直接进入官方入口与注册步骤。", href: "/exchange-download" },
      { title: "先去平台对比", desc: "适合有经验用户，直接比较功能和差异。", href: "/exchanges" },
      { title: "联系 Get8 Pro", desc: "适合需要更高额度或想处理特殊情况的人。", href: "/contact" },
    ],
    trustSummary: "这一页涉及平台、费用、限制和开户链接，所以把作者、审核、更新和披露统一放在页脚，既不打断阅读，也不会消失。",
    disclosure:
      "默认 20% 为当前公开统一规则。老账户通常不能补绑返佣，更高额度或特殊平台需单独沟通，最终以实际平台显示和沟通结果为准。",
    sources: [
      { label: "各交易所官方费用与返佣说明" },
      { label: "各平台下载页与活动公告" },
      { label: "Get8 Pro 内容复核记录" },
    ],
    backupLabel: "经典版对照",
    volumeLabel: "假设月交易量",
    openNow: "现在进入",
    openRoute: "打开入口",
  },
  en: {
    badge: "Trading Cost Optimization Guide",
    title: "Check the rules first, then decide where to open.",
    subtitle:
      "This page puts the default 20% rule, supported exchanges, existing-account limits, download routes, and next actions into one reading flow.",
    classic: "Open the classic page",
    quickNav: "Quick navigation",
    quickItems: [
      { id: "overview", label: "Overview" },
      { id: "calculator", label: "Calculator" },
      { id: "supported", label: "Exchanges" },
      { id: "how-to-get", label: "How to get it" },
      { id: "action", label: "Next action" },
    ],
    facts: [
      { title: "Default rebate", value: "20%", note: "Used as the standard starting point" },
      { title: "Supported exchanges", value: "5", note: "Contact us if you need others" },
      { title: "Existing accounts", value: "Usually cannot be retrofitted", note: "Check the limit before deciding" },
      { title: "Higher rate", value: "Contact required", note: "Not shown as a default number" },
    ],
    pathTitle: "Three common entry paths",
    pathCards: [
      {
        key: "new",
        title: "I am a new user",
        desc: "Get the default 20% first, then decide whether you need a higher rate.",
        section: "how-to-get",
        badge: "New",
      },
      {
        key: "trader",
        title: "I already trade",
        desc: "Go straight to the example, supported platforms, and action path.",
        section: "calculator",
        badge: "High intent",
      },
      {
        key: "old",
        title: "I already have an account",
        desc: "Check the limit first, then decide whether a new account or contact path makes sense.",
        section: "action",
        badge: "Existing",
      },
    ],
    exampleTitle: "Fixed example",
    exampleDesc: "The numbers below now match the default 20% rule exactly.",
    standardFee: "Standard fee",
    rebateAmount: "20% rebate amount",
    actualPaid: "Actual fee paid",
    annualSavings: "If the same volume repeats monthly, yearly savings are about",
    calcTitle: "Trading cost calculator",
    calcVolume: "Monthly volume",
    calcRate: "Fee rate",
    calcRebate: "Rebate rate",
    calcMonthlyFee: "Monthly fee",
    calcMonthlyRebate: "Monthly rebate",
    calcActualFee: "Actual fee",
    calcYearlySaving: "Yearly savings",
    calcNote: "The default rebate here is fixed at 20%. Any higher rate depends on direct communication.",
    supportedTitle: "Supported exchanges",
    supportedDesc: "You can compare the platforms first, then move into the download flow or full comparison page.",
    supportedPrimary: "Official download and invite path",
    supportedSecondary: "Compare exchanges",
    howToGetTitle: "How to get it",
    howToGetSubtitle: "State the limits first, then give the shortest next step.",
    stepsNewTitle: "For new users",
    stepsOldTitle: "For existing accounts",
    newSteps: [
      "Pick the platform you want to use from the five supported routes first.",
      "Enter through the download page or referral path and confirm the default 20% is active.",
      "If you need a higher rate, contact Get8 Pro after that.",
    ],
    oldSteps: [
      "Existing accounts usually cannot be retrofitted. Accept that limit first.",
      "If the account is still flexible, consider whether opening a new one makes more sense.",
      "If you are unsure, contact us and we can suggest the least wasteful path.",
    ],
    actionTitle: "Recommended next action",
    actionSubtitle: "Different visitors should see a direct next step instead of guessing inside a long page.",
    actionCards: [
      { title: "Go to downloads", desc: "Best for new users who want the official route first.", href: "/exchange-download" },
      { title: "Compare exchanges", desc: "Best for experienced users who want a faster decision path.", href: "/exchanges" },
      { title: "Contact Get8 Pro", desc: "Best for higher rates or edge cases.", href: "/contact" },
    ],
    trustSummary:
      "This page covers platforms, fees, limits, and referral routes, so the authorship and disclosure block is grouped near the footer to keep the reading flow cleaner.",
    disclosure:
      "The default 20% is the current public baseline. Existing accounts usually cannot be retrofitted. Higher rates or unsupported platforms require direct communication, and the final result depends on the actual platform display and confirmed discussion.",
    sources: [
      { label: "Official exchange fee and rebate pages" },
      { label: "Platform download pages and notices" },
      { label: "Get8 Pro editorial review log" },
    ],
    backupLabel: "Classic comparison",
    volumeLabel: "Monthly volume",
    openNow: "Open now",
    openRoute: "Open route",
  },
} as const;

const EXAMPLE = {
  volume: 1_000_000,
  fee: 1_000,
  rebate: 200,
  actual: 800,
  yearly: 2_400,
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function TradingCostGuide() {
  useScrollMemory();
  const { language } = useLanguage();
  const copy = language === "zh" ? PAGE_COPY.zh : PAGE_COPY.en;
  const { allLinks } = useExchangeLinks();
  const [location, navigate] = useLocation();
  const [volume, setVolume] = useState(500_000);
  const [feeRate, setFeeRate] = useState(0.1);
  const rebateRate = 20;

  const queryPath = useMemo(() => new URLSearchParams(window.location.search).get("path") ?? "", [location]);
  const hash = useMemo(() => window.location.hash.replace("#", ""), [location]);

  useEffect(() => {
    preloadRoutes([
      "/exchange-download",
      "/exchanges",
      "/contact",
      "/crypto-saving-classic",
    ]);
  }, []);

  useEffect(() => {
    const targetId =
      hash ||
      (queryPath === "trader" ? "calculator" : "") ||
      (queryPath === "old" ? "action" : "") ||
      (queryPath === "new" ? "how-to-get" : "");
    if (!targetId) return;
    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [hash, queryPath]);

  const monthlyFee = volume * (feeRate / 100);
  const monthlyRebate = monthlyFee * (rebateRate / 100);
  const actualFee = monthlyFee - monthlyRebate;
  const yearlySavings = monthlyRebate * 12;

  return (
    <div className="min-h-screen bg-[#06101d] text-white">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.1),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(6,182,212,0.08),transparent_24%)]" />

      <main className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <section id="overview" className="rounded-[32px] border border-white/10 bg-slate-950/70 px-6 py-8 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-8 sm:py-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-300">
              {copy.badge}
            </span>
            <Link href="/crypto-saving-classic" className="tap-target inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300 transition hover:border-white/20 hover:text-white">
              {copy.classic}
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_320px]">
            <div>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">{copy.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">{copy.subtitle}</p>
            </div>

            <aside className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{copy.quickNav}</p>
              <div className="mt-4 grid gap-2">
                {copy.quickItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    className="tap-target rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-left text-sm font-bold text-slate-200 transition hover:border-amber-500/25 hover:text-white"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </aside>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {copy.facts.map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{item.title}</p>
                <p className="mt-3 text-3xl font-black text-white">{item.value}</p>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">{copy.pathTitle}</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {copy.pathCards.map((item) => {
              const active = queryPath === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => document.getElementById(item.section)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className={`tap-target rounded-[28px] border p-6 text-left transition ${
                    active ? "border-amber-500/40 bg-amber-500/10" : "border-white/10 bg-slate-950/70 hover:border-white/20"
                  }`}
                >
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-slate-300">
                    {item.badge}
                  </span>
                  <h2 className="mt-4 text-2xl font-black text-white">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{item.desc}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-amber-300">
                    {copy.quickNav}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section id="calculator" className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
                <FileBarChart2 className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">{copy.exampleTitle}</p>
                <h2 className="text-2xl font-black text-white">{copy.exampleDesc}</h2>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">{copy.volumeLabel}</p>
                <p className="mt-2 text-4xl font-black text-white">{formatMoney(EXAMPLE.volume)}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">{copy.standardFee}</p>
                <p className="mt-2 text-4xl font-black text-rose-300">{formatMoney(EXAMPLE.fee)}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">{copy.rebateAmount}</p>
                <p className="mt-2 text-4xl font-black text-amber-300">{formatMoney(EXAMPLE.rebate)}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">{copy.actualPaid}</p>
                <p className="mt-2 text-4xl font-black text-emerald-300">{formatMoney(EXAMPLE.actual)}</p>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-center">
              <p className="text-sm font-bold text-amber-100">
                {copy.annualSavings} <span className="text-3xl font-black text-amber-300">{formatMoney(EXAMPLE.yearly)}</span>
              </p>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3">
                <Calculator className="h-5 w-5 text-cyan-300" />
              </div>
              <h2 className="text-2xl font-black text-white">{copy.calcTitle}</h2>
            </div>

            <div className="mt-6 space-y-6">
              <label className="block">
                <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>{copy.calcVolume}</span>
                  <span className="font-black text-white">{formatMoney(volume)}</span>
                </div>
                <input type="range" min={50_000} max={5_000_000} step={50_000} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full accent-cyan-400" />
              </label>

              <label className="block">
                <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>{copy.calcRate}</span>
                  <span className="font-black text-white">{feeRate.toFixed(2)}%</span>
                </div>
                <input type="range" min={0.02} max={0.2} step={0.01} value={feeRate} onChange={(e) => setFeeRate(Number(e.target.value))} className="w-full accent-cyan-400" />
              </label>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>{copy.calcRebate}</span>
                  <span className="font-black text-amber-300">{rebateRate}%</span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { label: copy.calcMonthlyFee, value: monthlyFee, color: "text-rose-300" },
                { label: copy.calcMonthlyRebate, value: monthlyRebate, color: "text-amber-300" },
                { label: copy.calcActualFee, value: actualFee, color: "text-emerald-300" },
                { label: copy.calcYearlySaving, value: yearlySavings, color: "text-cyan-300" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
                  <p className={`mt-2 text-2xl font-black ${item.color}`}>{formatMoney(item.value)}</p>
                </div>
              ))}
            </div>

            <p className="mt-5 text-sm leading-7 text-slate-400">{copy.calcNote}</p>
          </div>
        </section>

        <section id="supported" className="mt-10 rounded-[30px] border border-white/10 bg-slate-950/70 p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">{copy.supportedTitle}</p>
              <h2 className="mt-2 text-2xl font-black text-white">{copy.supportedDesc}</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => navigate("/exchange-download")} className="tap-target rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-200 transition hover:border-amber-500/40">
                {copy.supportedPrimary}
              </button>
              <button type="button" onClick={() => navigate("/exchanges")} className="tap-target rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:border-white/20">
                {copy.supportedSecondary}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {allLinks.map((exchange) => (
              <a
                key={exchange.slug}
                href={exchange.referralLink}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:border-cyan-500/20"
              >
                <div className="inline-flex rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                  <WalletCards className="h-5 w-5 text-cyan-300" />
                </div>
                <h3 className="mt-4 text-xl font-black capitalize text-white">{exchange.name ?? exchange.slug}</h3>
                <p className="mt-2 text-sm text-slate-400">{language === "zh" ? "默认返佣" : "Default rebate"}</p>
                <p className="mt-1 text-2xl font-black text-amber-300">{exchange.rebateRate || "20%"}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-white">
                  {copy.openRoute}
                  <ExternalLink className="h-4 w-4" />
                </span>
              </a>
            ))}
          </div>
        </section>

        <section id="how-to-get" className="mt-10 grid gap-6 xl:grid-cols-2">
          <div className="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                <Link2 className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">{copy.howToGetTitle}</p>
                <h2 className="text-2xl font-black text-white">{copy.howToGetSubtitle}</h2>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-lg font-black text-white">{copy.stepsNewTitle}</p>
              <div className="mt-4 space-y-3">
                {copy.newSteps.map((step, index) => (
                  <div key={step} className="flex gap-3 rounded-2xl border border-white/8 bg-slate-950/50 p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-black text-emerald-300">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-7 text-slate-300">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 sm:p-8">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-lg font-black text-white">{copy.stepsOldTitle}</p>
              <div className="mt-4 space-y-3">
                {copy.oldSteps.map((step, index) => (
                  <div key={step} className="flex gap-3 rounded-2xl border border-white/8 bg-slate-950/50 p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-sm font-black text-amber-300">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-7 text-slate-300">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="action" className="mt-10 rounded-[30px] border border-white/10 bg-slate-950/70 p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">{copy.actionTitle}</p>
          <h2 className="mt-2 text-2xl font-black text-white">{copy.actionSubtitle}</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {copy.actionCards.map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={() => navigate(item.href)}
                className="tap-target rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:-translate-y-1 hover:border-white/20"
              >
                <h3 className="text-xl font-black text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.desc}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-amber-300">
                  {copy.openNow}
                  <ChevronRight className="h-4 w-4" />
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[30px] border border-white/10 bg-slate-950/70 p-6 sm:p-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{copy.backupLabel}</p>
            <Link href="/crypto-saving-classic" className="tap-target inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:border-white/20">
              {copy.classic}
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
          <TrustSignalsCard
            zh={language === "zh"}
            title={language === "zh" ? "作者、审核与公开披露" : "Authorship, review, and disclosure"}
            summary={copy.trustSummary}
            author={language === "zh" ? "Get8 Pro 编辑团队" : "Get8 Pro Editorial Team"}
            reviewer={language === "zh" ? "Get8 Pro 内容复核" : "Get8 Pro Editorial Review"}
            updatedAt={TRUST_LAST_REVIEWED}
            sources={copy.sources}
            disclosure={copy.disclosure}
          />
        </section>
      </main>
    </div>
  );
}
