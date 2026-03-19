import { Link } from "wouter";
import { BookOpen, Compass, FileSearch, ShieldCheck, Sparkles, Newspaper, Blocks, ExternalLink, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollMemory } from "@/hooks/useScrollMemory";
import { preloadRoute, preloadRoutes } from "@/lib/routePreload";
import { useEffect } from "react";

const COPY = {
  zh: {
    badge: "研究型 Web3 导航首页",
    title: "先理解，再行动。",
    subtitle:
      "Get8 Pro 把 Web3 学习、交易所信息、交易成本说明、工具与快讯整理成更适合检索和判断的路径。",
    compareCurrent: "查看当前经典版首页",
    compareGuide: "查看当前经典版交易成本页",
    methodologyTitle: "阅读逻辑",
    methodology: [
      "先给结论，再给背景，减少来回跳页。",
      "把新手、老用户、已有交易经验用户分开处理。",
      "把来源、更新时间、披露信息放在阅读链条后半段，不抢正文，但始终可见。",
    ],
    pathsTitle: "你现在更像哪一种访客",
    paths: [
      {
        title: "我是新手，想要一条学习路径",
        desc: "从测评、Web3 基础、KYC 到交易所下载，按更稳的顺序进入。",
        href: "/web3-quiz",
        label: "先做测评",
        accent: "cyan",
        icon: Compass,
      },
      {
        title: "我已经在交易，只想优化交易成本",
        desc: "直接看默认 20% 规则、五家平台、老账户限制和下一步动作。",
        href: "/crypto-saving?path=trader#action",
        label: "看交易成本优化指南",
        accent: "amber",
        icon: Sparkles,
      },
      {
        title: "我是老用户，想确认还能不能处理返佣",
        desc: "先看限制，再看替代路径和联系入口，避免走冤枉路。",
        href: "/crypto-saving?path=old#how-to-get",
        label: "看老用户路径",
        accent: "emerald",
        icon: ShieldCheck,
      },
    ],
    modulesTitle: "核心内容模块",
    modules: [
      {
        title: "Web3 学习指南",
        desc: "把概念、区块链、钱包、KYC 和交易所操作串成一条完整路径。",
        href: "/web3-guide",
        icon: BookOpen,
      },
      {
        title: "交易成本优化指南",
        desc: "聚焦默认 20% 规则、老账户限制、平台差异与下载路径。",
        href: "/crypto-saving",
        icon: Sparkles,
      },
      {
        title: "交易所信息与功能导航",
        desc: "按功能场景了解现货、合约、杠杆、跟单、理财等差异。",
        href: "/exchange-guide",
        icon: Blocks,
      },
      {
        title: "币圈工具合集",
        desc: "把价格、链上、安全和研究工具按场景归类。",
        href: "/tools",
        icon: FileSearch,
      },
      {
        title: "加密快讯与文章",
        desc: "查看快讯、长文与研究性内容，补充市场背景。",
        href: "/crypto-news",
        icon: Newspaper,
      },
    ],
    backupTitle: "对照与备份",
    backupDesc: "你可以随时对照目前的经典版页面，方便比较改版前后的信息结构与视觉层次。",
    backupHome: "打开经典版首页",
    backupGuide: "打开经典版交易成本页",
  },
  en: {
    badge: "Research-led Web3 homepage",
    title: "Understand first, act second.",
    subtitle:
      "Get8 Pro organizes Web3 learning, exchange information, trading-cost guidance, tools, and news into a clearer path for decision-making.",
    compareCurrent: "Open classic homepage",
    compareGuide: "Open classic trading-cost page",
    methodologyTitle: "Reading logic",
    methodology: [
      "Lead with conclusions, then provide context.",
      "Separate new users, active traders, and existing-account visitors.",
      "Keep sources, review dates, and disclosures visible without pushing them above the main content.",
    ],
    pathsTitle: "Which visitor are you today?",
    paths: [
      {
        title: "I am new and need a learning path",
        desc: "Start with the quiz, then move through basics, KYC, and exchange onboarding.",
        href: "/web3-quiz",
        label: "Take the quiz",
        accent: "cyan",
        icon: Compass,
      },
      {
        title: "I already trade and want to lower costs",
        desc: "Go straight to the default 20% rule, supported exchanges, account limits, and next actions.",
        href: "/crypto-saving?path=trader#action",
        label: "Open the guide",
        accent: "amber",
        icon: Sparkles,
      },
      {
        title: "I already have an account",
        desc: "Check the limit first, then see the fallback route and contact option.",
        href: "/crypto-saving?path=old#how-to-get",
        label: "See existing-account path",
        accent: "emerald",
        icon: ShieldCheck,
      },
    ],
    modulesTitle: "Core modules",
    modules: [
      {
        title: "Web3 learning guide",
        desc: "A full path from concepts and wallets to KYC and exchange setup.",
        href: "/web3-guide",
        icon: BookOpen,
      },
      {
        title: "Trading Cost Optimization Guide",
        desc: "Focus on the default 20% rule, existing-account limits, platform differences, and download routes.",
        href: "/crypto-saving",
        icon: Sparkles,
      },
      {
        title: "Exchange navigation",
        desc: "Understand spot, futures, margin, copy trading, and product differences by scenario.",
        href: "/exchange-guide",
        icon: Blocks,
      },
      {
        title: "Crypto tools directory",
        desc: "Organized tools for market data, on-chain analysis, security, and research.",
        href: "/tools",
        icon: FileSearch,
      },
      {
        title: "News and articles",
        desc: "Use live updates and deeper articles to add market context.",
        href: "/crypto-news",
        icon: Newspaper,
      },
    ],
    backupTitle: "Backup and comparison",
    backupDesc: "You can compare the redesign with the current classic pages at any time.",
    backupHome: "Open classic homepage",
    backupGuide: "Open classic guide",
  },
} as const;

const accentStyles = {
  cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
  amber: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
} as const;

export default function PortalResearch() {
  useScrollMemory();
  const { language } = useLanguage();
  const copy = language === "zh" ? COPY.zh : COPY.en;

  useEffect(() => {
    preloadRoutes([
      "/web3-quiz",
      "/crypto-saving",
      "/web3-guide",
      "/exchange-guide",
      "/tools",
      "/crypto-news",
      "/portal-classic",
      "/crypto-saving-classic",
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-[#06101d] text-white">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.1),transparent_24%)]" />

      <main className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <section className="rounded-[32px] border border-white/10 bg-slate-950/70 px-6 py-8 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-8 sm:py-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
              {copy.badge}
            </span>
            <Link href="/portal-classic" className="tap-target inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300 transition hover:border-white/20 hover:text-white">
              {copy.compareCurrent}
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <Link href="/crypto-saving-classic" className="tap-target inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300 transition hover:border-white/20 hover:text-white">
              {copy.compareGuide}
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_320px] lg:items-start">
            <div>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">{copy.title}</h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">{copy.subtitle}</p>
            </div>

            <aside className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{copy.methodologyTitle}</p>
              <div className="mt-4 space-y-3">
                {copy.methodology.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/8 bg-slate-950/50 p-4 text-sm leading-7 text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">{copy.pathsTitle}</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {copy.paths.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="tap-target block rounded-[28px] border border-white/10 bg-slate-950/70 p-6 transition hover:-translate-y-1 hover:border-white/20"
                  onMouseEnter={() => preloadRoute(item.href.split("?")[0])}
                  onTouchStart={() => preloadRoute(item.href.split("?")[0])}
                >
                  <div className={`inline-flex rounded-2xl border px-3 py-3 ${accentStyles[item.accent]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-5 text-2xl font-black text-white">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{item.desc}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-white">
                    {item.label}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-12 rounded-[30px] border border-white/10 bg-slate-950/70 p-6 sm:p-8">
          <h2 className="text-2xl font-black text-white sm:text-3xl">{copy.modulesTitle}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {copy.modules.map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.href}
                  href={module.href}
                  className="tap-target rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-500/20 hover:bg-white/[0.07]"
                  onMouseEnter={() => preloadRoute(module.href)}
                  onTouchStart={() => preloadRoute(module.href)}
                >
                  <div className="inline-flex rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                    <Icon className="h-5 w-5 text-cyan-300" />
                  </div>
                  <h3 className="mt-4 text-lg font-black text-white">{module.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-400">{module.desc}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-12 rounded-[30px] border border-amber-500/15 bg-[linear-gradient(180deg,rgba(250,204,21,0.06),rgba(15,23,42,0.55))] p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">{copy.backupTitle}</p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{copy.backupDesc}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/portal-classic" className="tap-target inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:border-white/20">
              {copy.backupHome}
              <ExternalLink className="h-4 w-4" />
            </Link>
            <Link href="/crypto-saving-classic" className="tap-target inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:border-white/20">
              {copy.backupGuide}
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
