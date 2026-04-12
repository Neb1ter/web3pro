
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BookOpenText,
  Bot,
  Compass,
  Download,
  Globe,
  Newspaper,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Wrench,
} from "lucide-react";
import { useScrollMemory } from "@/hooks/useScrollMemory";
import { useLanguage } from "@/contexts/LanguageContext";
import { preloadRoute, scheduleIdle } from "@/lib/routePreload";

const OnboardingPrompt = lazy(() => import("@/components/OnboardingPrompt"));

type LanguageKey = "zh" | "en";

type LinkItem = {
  label: string;
  href: string;
};

type PathCard = {
  title: string;
  description: string;
  href: string;
  cta: string;
  tone: string;
  icon: "compass" | "sparkles" | "shield";
};

type ModuleCard = {
  title: string;
  subtitle: string;
  description: string;
  href: string;
  cta: string;
  stat: string;
  note: string;
  icon: "guide" | "rebate" | "exchange" | "tools" | "news" | "automation";
  preload?: boolean;
};

type Copy = {
  badge: string;
  titleLineOne: string;
  titleHighlight: string;
  subtitle: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  primaryHref: string;
  secondaryHref: string;
  proofPoints: string[];
  credibilityItems: { title: string; description: string }[];
  pathsTitle: string;
  pathsDescription: string;
  paths: PathCard[];
  modulesTitle: string;
  modulesDescription: string;
  modules: ModuleCard[];
  footerTagline: string;
  footerLegal: string;
  footerColumns: { title: string; links: LinkItem[] }[];
  languageToggle: string;
};

const COPY: Record<LanguageKey, Copy> = {
  zh: {
    badge: "研究型交易导航",
    titleLineOne: "Get8 Pro",
    titleHighlight: "把路径讲清，把判断做稳。",
    subtitle: "官方入口、可信来源、交易决策与学习路径，集中在一个更克制的首页。",
    description:
      "首页不再堆满入口和说明，而是先帮你确认这是什么站、为什么值得继续看、你现在最该从哪里开始。返佣、交易所、学习内容和实时快讯都按优先级排好。",
    primaryCta: "开始 2 分钟测评",
    secondaryCta: "直接查看交易成本与返佣",
    primaryHref: "/web3-quiz",
    secondaryHref: "/crypto-saving?path=trader#action",
    proofPoints: ["官方合作入口", "公开来源数据", "返佣规则透明"],
    credibilityItems: [
      { title: "来源可查", description: "优先官方注册页、公告与帮助中心" },
      { title: "规则透明", description: "返佣、限制与风险提示前置说明" },
      { title: "路径清晰", description: "新手、老用户、交易用户分开进入" },
    ],
    pathsTitle: "先选你的路径",
    pathsDescription: "三种常见需求，一步进入对应页面。",
    paths: [
      {
        title: "我是第一次接触币圈",
        description: "先做测评，再按 Web3 基础、KYC、交易所下载这条线慢慢走，最不容易走偏。",
        href: "/web3-quiz",
        cta: "先做 2 分钟测评",
        tone: "cyan",
        icon: "compass",
      },
      {
        title: "我已经会交易，只想省手续费",
        description: "先确认返佣规则、合作交易所和下载路径，把最直接的成本优化入口先拿到手。",
        href: "/crypto-saving?path=trader#action",
        cta: "直接看返佣路径",
        tone: "amber",
        icon: "sparkles",
      },
      {
        title: "我是老用户，想知道还能不能绑定",
        description: "先看老账户限制，再决定是否换新入口或联系人工获取更合适的方案。",
        href: "/crypto-saving?path=old#how-to-get",
        cta: "先看老用户方案",
        tone: "emerald",
        icon: "shield",
      },
    ],
    modulesTitle: "主要入口",
    modulesDescription: "保留最常用的入口，其他说明进入页面后再展开。",
    modules: [
      {
        title: "交易成本与返佣指南",
        subtitle: "核心动作入口",
        description:
          "默认返佣比例、适用限制、合作交易所入口、下载路径和实际节省逻辑都集中在这里，是大多数用户最先需要的主入口。",
        href: "/crypto-saving",
        cta: "进入主入口",
        stat: "默认 20%",
        note: "官方合作返佣",
        icon: "rebate",
      },
      {
        title: "Web3 入圈指南",
        subtitle: "学习骨架",
        description: "从概念、钱包、KYC 到投资方式，用更干净的结构帮新手建立顺序感。",
        href: "/web3-guide",
        cta: "查看学习路径",
        stat: "7 章主线",
        note: "新手优先",
        icon: "guide",
      },
      {
        title: "交易所扫盲指南",
        subtitle: "决策辅助",
        description: "把平台差异、安全性、功能和适用场景讲明白，帮你缩短筛选时间。",
        href: "/exchange-guide",
        cta: "开始筛选平台",
        stat: "5 家平台",
        note: "独立评测逻辑",
        icon: "exchange",
      },
      {
        title: "币圈工具合集",
        subtitle: "效率工具",
        description: "把图表、链上数据、DeFi、税务和研究工具按用途归类，减少到处找工具的成本。",
        href: "/tools",
        cta: "查看工具清单",
        stat: "12+ 工具",
        note: "持续更新",
        icon: "tools",
      },
      {
        title: "加密快讯",
        subtitle: "实时动态",
        description: "聚合市场、交易所、政策和链上动态，把真正值得看的变化更快整理给你。",
        href: "/crypto-news",
        cta: "查看最新快讯",
        stat: "30 分钟更新",
        note: "多源聚合",
        icon: "news",
      },
      {
        title: "Codex Business 自动化中心",
        subtitle: "第六板块",
        description: "把媒体运营、任务调度、兑换与质保等业务入口收进同一套系统，首页只保留轻入口。",
        href: "/codex-business",
        cta: "进入第六板块",
        stat: "按需加载",
        note: "仅访问时加载",
        icon: "automation",
        preload: false,
      },
    ],
    footerTagline: "Get8 Pro 旨在把学习、判断与执行入口整理得更清晰。",
    footerLegal: "内容仅供参考，不构成投资建议。交易与投资均有风险，请结合自身情况谨慎判断。",
    footerColumns: [
      {
        title: "核心入口",
        links: [
          { label: "Web3 入圈指南", href: "/web3-guide" },
          { label: "交易成本与返佣指南", href: "/crypto-saving" },
          { label: "交易所扫盲指南", href: "/exchange-guide" },
          { label: "KYC 实名流程", href: "/web3-guide/kyc-flow" },
        ],
      },
      {
        title: "工具与信息",
        links: [
          { label: "交易所下载", href: "/exchange-download" },
          { label: "币圈工具合集", href: "/tools" },
          { label: "加密快讯", href: "/crypto-news" },
          { label: "交易所对比", href: "/exchanges" },
        ],
      },
      {
        title: "支持与说明",
        links: [
          { label: "关于我们", href: "/about" },
          { label: "编辑原则", href: "/standards" },
          { label: "联系我们", href: "/contact" },
          { label: "法律与披露", href: "/legal" },
        ],
      },
    ],
    languageToggle: "EN",
  },
  en: {
    badge: "Research-led Trading Navigation",
    titleLineOne: "Get8 Pro",
    titleHighlight: "Clearer paths. More reliable decisions.",
    subtitle: "Official entry links, trusted sources, trading decisions, and learning paths in one homepage.",
    description:
      "Instead of turning the homepage into a noisy traffic page, we shape it like a research terminal. First identify where you should start, then surface rebates, exchanges, learning modules, and market updates in the right order.",
    primaryCta: "Take the 2-minute quiz",
    secondaryCta: "View trading cost and rebate guide",
    primaryHref: "/web3-quiz",
    secondaryHref: "/crypto-saving?path=trader#action",
    proofPoints: ["Official partner entry", "Public sources", "Transparent rebate rules"],
    credibilityItems: [
      { title: "Verifiable sources", description: "Official pages, notices, and help centers first" },
      { title: "Clear rules", description: "Rebates, limits, and risk notes stay visible" },
      { title: "Short paths", description: "New users, traders, and existing users split early" },
    ],
    pathsTitle: "Choose your path",
    pathsDescription: "Three common needs, each with a direct next step.",
    paths: [
      {
        title: "I'm new to crypto",
        description: "Start with the quiz, then move through Web3 basics, KYC, and exchange setup without getting lost.",
        href: "/web3-quiz",
        cta: "Take the 2-minute quiz",
        tone: "cyan",
        icon: "compass",
      },
      {
        title: "I already trade and want lower fees",
        description: "Review rebate rules, supported exchanges, and the setup path first to lock in the cost-saving entry.",
        href: "/crypto-saving?path=trader#action",
        cta: "Go to the rebate path",
        tone: "amber",
        icon: "sparkles",
      },
      {
        title: "I already have an account",
        description: "See the restrictions for existing users first, then move to the next workable setup path.",
        href: "/crypto-saving?path=old#how-to-get",
        cta: "See existing-user options",
        tone: "emerald",
        icon: "shield",
      },
    ],
    modulesTitle: "Primary entries",
    modulesDescription: "Keep the homepage focused; detailed explanations continue inside each page.",
    modules: [
      {
        title: "Trading Cost & Rebate Guide",
        subtitle: "Primary action",
        description:
          "Default rebate rules, eligibility limits, supported exchange entries, download paths, and actual cost-saving logic are all gathered here.",
        href: "/crypto-saving",
        cta: "Open primary entry",
        stat: "Default 20%",
        note: "Official rebate path",
        icon: "rebate",
      },
      {
        title: "Web3 Onboarding Guide",
        subtitle: "Learning backbone",
        description: "A cleaner sequence covering concepts, wallets, KYC, and investment basics for first-time users.",
        href: "/web3-guide",
        cta: "View learning path",
        stat: "7 chapters",
        note: "Beginner-first",
        icon: "guide",
      },
      {
        title: "Exchange Tutorial",
        subtitle: "Decision support",
        description: "Compare platform differences, safety, functions, and fit with less guesswork and less marketing noise.",
        href: "/exchange-guide",
        cta: "Start evaluating",
        stat: "5 platforms",
        note: "Independent review logic",
        icon: "exchange",
      },
      {
        title: "Crypto Tools Hub",
        subtitle: "Utility layer",
        description: "A reorganized toolkit for charts, on-chain data, DeFi workflows, tax support, and research efficiency.",
        href: "/tools",
        cta: "Browse tools",
        stat: "12+ tools",
        note: "Continuously updated",
        icon: "tools",
      },
      {
        title: "Crypto News",
        subtitle: "Live updates",
        description: "Structured news aggregation covering market changes, exchanges, policy, and on-chain developments.",
        href: "/crypto-news",
        cta: "See latest news",
        stat: "Every 30 min",
        note: "Multi-source feed",
        icon: "news",
      },
      {
        title: "Codex Business Automation Hub",
        subtitle: "Sixth module",
        description: "Business operations, scheduling, redemption, and warranty flows are grouped into one system with on-demand loading.",
        href: "/codex-business",
        cta: "Open module six",
        stat: "On demand",
        note: "Loads on visit",
        icon: "automation",
        preload: false,
      },
    ],
    footerTagline: "Get8 Pro is built to make learning, judging, and acting easier to navigate.",
    footerLegal: "Content is for reference only and does not constitute investment advice. Please make decisions carefully and at your own risk.",
    footerColumns: [
      {
        title: "Core entries",
        links: [
          { label: "Web3 Guide", href: "/web3-guide" },
          { label: "Trading Cost & Rebate Guide", href: "/crypto-saving" },
          { label: "Exchange Tutorial", href: "/exchange-guide" },
          { label: "KYC Flow", href: "/web3-guide/kyc-flow" },
        ],
      },
      {
        title: "Tools & Information",
        links: [
          { label: "Exchange Download", href: "/exchange-download" },
          { label: "Crypto Tools", href: "/tools" },
          { label: "Crypto News", href: "/crypto-news" },
          { label: "Exchange Compare", href: "/exchanges" },
        ],
      },
      {
        title: "Support",
        links: [
          { label: "About", href: "/about" },
          { label: "Standards", href: "/standards" },
          { label: "Contact", href: "/contact" },
          { label: "Legal", href: "/legal" },
        ],
      },
    ],
    languageToggle: "中文",
  },
};

const toneClasses = {
  cyan: {
    border: "border-cyan-400/18",
    marker: "bg-cyan-300",
    text: "text-cyan-300",
    glow: "from-cyan-500/12 via-cyan-400/6 to-transparent",
  },
  amber: {
    border: "border-amber-400/18",
    marker: "bg-amber-300",
    text: "text-amber-300",
    glow: "from-amber-500/12 via-amber-400/6 to-transparent",
  },
  emerald: {
    border: "border-emerald-400/18",
    marker: "bg-emerald-300",
    text: "text-emerald-300",
    glow: "from-emerald-500/12 via-emerald-400/6 to-transparent",
  },
} as const;

function getIcon(name: ModuleCard["icon"] | PathCard["icon"]) {
  switch (name) {
    case "compass":
      return <Compass className="h-4 w-4" />;
    case "sparkles":
      return <Sparkles className="h-4 w-4" />;
    case "shield":
      return <ShieldCheck className="h-4 w-4" />;
    case "guide":
      return <BookOpenText className="h-5 w-5" />;
    case "rebate":
      return <Sparkles className="h-5 w-5" />;
    case "exchange":
      return <Download className="h-5 w-5" />;
    case "tools":
      return <Wrench className="h-5 w-5" />;
    case "news":
      return <Newspaper className="h-5 w-5" />;
    case "automation":
      return <Bot className="h-5 w-5" />;
    default:
      return <Globe className="h-5 w-5" />;
  }
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6 max-w-3xl sm:mb-8">
      <h2 className="text-[1.95rem] font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
      <p className="mt-2.5 text-sm leading-7 text-slate-400 sm:mt-3 sm:text-base">{description}</p>
    </div>
  );
}

// ============================================================
// Live Crypto Ticker — BTC/ETH prices from CoinGecko
// ============================================================
type TickerData = { btcPrice: number; btcChange: number; ethPrice: number; ethChange: number } | null;

function useCryptoTicker() {
  const [data, setData] = useState<TickerData>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const controller = new AbortController();
    fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true",
      { signal: controller.signal }
    )
      .then((res) => res.json())
      .then((json) => {
        if (json.bitcoin && json.ethereum) {
          setData({
            btcPrice: json.bitcoin.usd,
            btcChange: json.bitcoin.usd_24h_change ?? 0,
            ethPrice: json.ethereum.usd,
            ethChange: json.ethereum.usd_24h_change ?? 0,
          });
        }
      })
      .catch(() => {
        // Silently fail — ticker is decorative
      });

    return () => controller.abort();
  }, []);

  return data;
}

function LiveCryptoTicker({ lang }: { lang: LanguageKey }) {
  const data = useCryptoTicker();
  if (!data) return null;

  const fmt = (n: number) =>
    n >= 1000 ? `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : `$${n.toFixed(2)}`;
  const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

  const coins = [
    { symbol: "BTC", emoji: "🟡", price: data.btcPrice, change: data.btcChange },
    { symbol: "ETH", emoji: "🔷", price: data.ethPrice, change: data.ethChange },
  ];

  return (
    <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-3 sm:mt-7">
      {coins.map((c) => (
        <div
          key={c.symbol}
          className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm sm:text-sm"
        >
          <span>{c.emoji}</span>
          <span className="text-white">{c.symbol}</span>
          <span className="text-slate-300">{fmt(c.price)}</span>
          <span className={`inline-flex items-center gap-0.5 ${c.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {c.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {pct(c.change)}
          </span>
        </div>
      ))}
      <span className="text-[10px] text-slate-600">{lang === "zh" ? "CoinGecko 实时" : "CoinGecko live"}</span>
    </div>
  );
}

// ============================================================
// Stats Strip — Social proof numbers
// ============================================================
function StatsStrip({ lang }: { lang: LanguageKey }) {
  const stats = lang === "zh"
    ? [
        { value: "5", label: "家合作交易所" },
        { value: "12+", label: "实用工具" },
        { value: "7", label: "章学习路径" },
        { value: "6", label: "个交易模拟器" },
        { value: "双语", label: "中英文内容" },
      ]
    : [
        { value: "5", label: "Partner Exchanges" },
        { value: "12+", label: "Crypto Tools" },
        { value: "7", label: "Learning Chapters" },
        { value: "6", label: "Trading Simulators" },
        { value: "Bilingual", label: "ZH & EN Content" },
      ];

  return (
    <section className="mt-8 sm:mt-10">
      <div className="flex overflow-x-auto hide-scrollbar flex-nowrap items-center justify-start sm:justify-center gap-x-6 gap-y-3 sm:gap-x-8 px-4 sm:px-0 sm:flex-wrap pb-2 sm:pb-0 scroll-smooth snap-x -mx-4 sm:mx-0">
        {stats.map((s) => (
          <div key={s.label} className="flex shrink-0 snap-center items-center gap-2 text-center">
            <span className="text-lg font-bold text-cyan-300 sm:text-xl">{s.value}</span>
            <span className="text-xs text-slate-400 sm:text-sm">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// Exchange Trust Strip — Partner exchange logos/names
// ============================================================
function ExchangeTrustStrip({ lang }: { lang: LanguageKey }) {
  const exchanges = [
    { name: "Gate.io", color: "#00D084" },
    { name: "OKX", color: "#FFFFFF" },
    { name: "Binance", color: "#F3BA2F" },
    { name: "Bybit", color: "#F7A600" },
    { name: "Bitget", color: "#00C9B7" },
  ];

  return (
    <section className="mt-6 sm:mt-8 overflow-hidden">
      <p className="mb-3 text-center text-[11px] uppercase tracking-[0.3em] text-slate-500">
        {lang === "zh" ? "官方合作交易所" : "Official Partner Exchanges"}
      </p>
      <div className="flex overflow-x-auto hide-scrollbar flex-nowrap items-center justify-start sm:justify-center gap-4 sm:gap-6 px-4 sm:px-0 sm:flex-wrap pb-2 sm:pb-0 scroll-smooth snap-x -mx-4 sm:mx-0">
        {exchanges.map((ex) => (
          <div
            key={ex.name}
            className="flex shrink-0 snap-center items-center gap-2 rounded-full border border-white/6 bg-white/[0.02] px-4 py-2"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: ex.color }}
            />
            <span className="text-xs font-semibold text-slate-300 sm:text-sm">{ex.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
function PathSelector({ copy }: { copy: Copy }) {
  return (
    <section className="mt-12 sm:mt-16 lg:mt-18">
      <SectionHeader title={copy.pathsTitle} description={copy.pathsDescription} />
      <div className="flex overflow-x-auto hide-scrollbar snap-x gap-3.5 px-4 sm:px-0 sm:grid sm:grid-cols-3 lg:gap-4 pb-2 sm:pb-0 -mx-4 sm:mx-0">
        {copy.paths.map((item) => {
          const tone = toneClasses[item.tone as keyof typeof toneClasses];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative overflow-hidden shrink-0 w-[85%] sm:w-auto snap-center rounded-[20px] sm:rounded-[28px] border ${tone.border} bg-[#071525]/85 px-5 py-4 sm:px-6 sm:py-6 transition-all duration-300 hover:border-white/18 hover:bg-[#091b2f]`}
              onMouseEnter={() => preloadRoute(item.href)}
              onTouchStart={() => preloadRoute(item.href)}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tone.glow} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
              <div className="relative flex h-full flex-col">
                <div className="mb-3 sm:mb-5 flex items-center gap-3">
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[14px] sm:rounded-2xl border ${tone.border} bg-white/[0.03] ${tone.text} sm:h-10 sm:w-10`}>
                    {getIcon(item.icon)}
                  </div>
                  <div className={`h-px flex-1 ${tone.marker} opacity-25`} />
                </div>
                <h3 className="max-w-[15ch] text-[1.25rem] font-semibold leading-tight text-white sm:text-xl">{item.title}</h3>
                <p className="mt-2.5 hidden sm:flex flex-1 text-[13px] leading-6 text-slate-350 sm:mt-3 sm:text-[15px] sm:leading-7">
                  {item.description}
                </p>
                <div className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold ${tone.text} sm:mt-6`}>
                  <span>{item.cta}</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function CredibilityStrip({ copy }: { copy: Copy }) {
  return (
    <section className="mt-10 border-y border-white/8 py-5 sm:mt-12 sm:py-6 overflow-hidden">
      <div className="flex overflow-x-auto hide-scrollbar snap-x px-4 sm:px-0 -mx-4 sm:mx-0 gap-5 sm:grid sm:gap-4 md:grid-cols-3">
        {copy.credibilityItems.map((item) => (
          <div key={item.title} className="flex gap-3 shrink-0 w-[80%] sm:w-auto snap-center md:border-l md:border-white/8 md:pl-5 first:md:border-l-0 first:md:pl-0">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
            <div>
              <h2 className="text-sm font-semibold text-white">{item.title}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-400">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ModuleGrid({ copy }: { copy: Copy }) {
  const [primary, secondaryA, secondaryB, ...rest] = copy.modules;

  return (
    <section className="mt-16 sm:mt-20 lg:mt-24">
      <SectionHeader title={copy.modulesTitle} description={copy.modulesDescription} />
      <div className="grid gap-3 sm:gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <ModuleSurface module={primary} kind="primary" />
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-5">
          <ModuleSurface module={secondaryA} kind="secondary" />
          <ModuleSurface module={secondaryB} kind="secondary" />
        </div>
      </div>
      <div className="mt-3 sm:mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {rest.map((module) => (
          <ModuleSurface key={module.href} module={module} kind="compact" />
        ))}
      </div>
    </section>
  );
}

function ModuleSurface({ module, kind }: { module: ModuleCard; kind: "primary" | "secondary" | "compact" }) {
  const isCompact = kind === "compact";
  const isPrimary = kind === "primary";

  // Live status indicators for specific modules
  const liveIndicator = module.icon === "news"
    ? { show: true, color: "bg-emerald-400", text: "text-emerald-400" }
    : module.icon === "rebate"
    ? { show: true, color: "bg-amber-400", text: "text-amber-300" }
    : null;

  return (
    <Link
      href={module.href}
      className={`group relative overflow-hidden rounded-[20px] sm:rounded-[32px] border border-white/8 bg-[#071525]/82 transition-all duration-300 hover:border-white/14 hover:bg-[#091a2d] ${
        isCompact ? "px-4 py-4 sm:px-5 sm:py-5" : "px-4 py-4 sm:px-7 sm:py-7"
      }`}
      onMouseEnter={() => {
        if (module.preload !== false) preloadRoute(module.href);
      }}
      onTouchStart={() => {
        if (module.preload !== false) preloadRoute(module.href);
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.14),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_34%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      {/* Live status indicator */}
      {liveIndicator?.show && (
        <div className={`absolute right-3 top-3 sm:right-5 sm:top-5 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium ${liveIndicator.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${liveIndicator.color} animate-pulse`} />
          <span className="hidden sm:inline">{module.icon === "news" ? "Live" : "Active"}</span>
        </div>
      )}
      <div className="relative">
        <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-[14px] sm:rounded-2xl border border-white/10 bg-white/[0.03] text-cyan-300">
              {getIcon(module.icon)}
            </div>
            <div>
              <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-slate-500">{module.subtitle}</div>
              <h3 className={`${isPrimary ? "mt-1 sm:mt-3 text-[1.4rem] sm:text-[2rem]" : "mt-1 sm:mt-2 text-[1.15rem] sm:text-2xl"} font-semibold tracking-tight text-white line-clamp-2`}>
                {module.title}
              </h3>
            </div>
          </div>
          <div className="hidden sm:block rounded-full border border-amber-400/16 bg-amber-400/8 px-3 py-1 text-xs font-medium text-amber-300">
            {module.stat}
          </div>
        </div>

        <div className={`mt-3 sm:mt-5 hidden sm:grid ${isPrimary ? "items-start gap-8 lg:grid-cols-[1fr_220px]" : "gap-5"}`}>
          <div>
            <p className={`max-w-[46rem] text-slate-350 ${isCompact ? "text-sm leading-7" : "text-[15px] leading-7 sm:text-base sm:leading-8"}`}>
              {module.description}
            </p>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 sm:mt-6">
              <span>{module.cta}</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </div>
          <div className={`${isPrimary ? "border-l border-white/8 pl-6" : ""}`}>
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Signal</div>
            <div className="mt-2 text-sm leading-7 text-slate-300">{module.note}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function Footer({ copy }: { copy: Copy }) {
  return (
    <footer className="mt-18 border-t border-white/8 pb-14 pt-10 sm:mt-24">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <div className="text-[11px] uppercase tracking-[0.34em] text-slate-500">Get8 Pro</div>
          <p className="mt-4 text-sm leading-7 text-slate-350">{copy.footerTagline}</p>
          <p className="mt-4 text-xs leading-6 text-slate-500">{copy.footerLegal}</p>
        </div>
        {copy.footerColumns.map((column) => (
          <div key={column.title}>
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{column.title}</div>
            <div className="mt-4 space-y-3">
              {column.links.map((link) => (
                <Link key={link.href} href={link.href} className="block text-sm text-slate-350 transition-colors hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}

function AmbientBackground() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(56,189,248,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.08) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-[-140px] h-[520px] bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.28),transparent_55%)]" />
      <div className="pointer-events-none absolute left-[-120px] top-[280px] h-[360px] w-[360px] rounded-full bg-cyan-500/8 blur-[100px]" />
      <div className="pointer-events-none absolute right-[-90px] top-[140px] h-[320px] w-[320px] rounded-full bg-emerald-400/7 blur-[110px]" />
    </>
  );
}

export default function Portal() {
  useScrollMemory();
  const { language, setLanguage } = useLanguage();
  const lang = (language === "en" ? "en" : "zh") as LanguageKey;
  const copy = useMemo(() => COPY[lang], [lang]);
  const [showAmbient, setShowAmbient] = useState(false);
  const [showOnboardingPrompt, setShowOnboardingPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobileViewport = window.matchMedia("(max-width: 768px)").matches;

    if (!reducedMotion && !mobileViewport) {
      return scheduleIdle(() => setShowAmbient(true), 1200);
    }

    setShowAmbient(false);
    return undefined;
  }, []);

  useEffect(() => scheduleIdle(() => setShowOnboardingPrompt(true), 1800), []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04101d] text-white">
      {showAmbient ? <AmbientBackground /> : null}
      {showOnboardingPrompt ? (
        <Suspense fallback={null}>
          <OnboardingPrompt lang={lang} />
        </Suspense>
      ) : null}

      <div className="fixed right-4 top-4 z-50">
        <button
          type="button"
          onClick={() => setLanguage(lang === "zh" ? "en" : "zh")}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#09192b]/88 px-3.5 py-2 text-xs font-medium text-slate-300 backdrop-blur-md transition-colors hover:border-white/18 hover:text-white"
        >
          <Globe className="h-3.5 w-3.5" />
          {copy.languageToggle}
        </button>
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pb-18 sm:pt-16 lg:px-8 lg:pt-20">
        <section className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/18 bg-amber-400/8 px-3.5 py-1.5 text-xs font-medium text-amber-300 sm:px-4 sm:py-2 sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            {copy.badge}
          </div>

          <h1 className="mt-6 text-balance text-[2.5rem] font-semibold leading-[0.95] tracking-tight text-white sm:mt-8 sm:text-[4.4rem] lg:text-[6.05rem]">
            {copy.titleLineOne}
          </h1>
          <p className="mx-auto mt-4 max-w-4xl text-balance text-[1.8rem] font-medium leading-tight text-slate-200 sm:mt-5 sm:text-3xl lg:text-[2.7rem]">
            <span className="bg-[linear-gradient(90deg,#f8fafc_0%,#67e8f9_28%,#fbbf24_65%,#f8fafc_100%)] bg-clip-text text-transparent">
              {copy.titleHighlight}
            </span>
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-balance text-base leading-7 text-slate-350 sm:mt-5 sm:text-xl sm:leading-8">
            {copy.subtitle}
          </p>
          <p className="mx-auto mt-5 hidden max-w-3xl text-sm leading-7 text-slate-450 sm:block sm:mt-6 sm:text-base sm:leading-8">
            {copy.description}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row">
            <Link
              href={copy.primaryHref}
              className="group/cta relative inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition-all hover:bg-cyan-200 sm:min-h-[50px] sm:px-6"
              onMouseEnter={() => preloadRoute(copy.primaryHref)}
              onTouchStart={() => preloadRoute(copy.primaryHref)}
            >
              {/* Animated glow ring */}
              <span className="pointer-events-none absolute inset-0 rounded-full" style={{ boxShadow: '0 0 20px rgba(103,232,249,0.35), 0 0 40px rgba(103,232,249,0.15)', animation: 'ctaPulse 2.5s ease-in-out infinite' }} />
              {copy.primaryCta}
              <ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5" />
            </Link>
            <Link
              href={copy.secondaryHref}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white transition-all hover:border-white/18 hover:bg-white/[0.06] sm:min-h-[50px] sm:px-6"
              onMouseEnter={() => preloadRoute(copy.secondaryHref)}
              onTouchStart={() => preloadRoute(copy.secondaryHref)}
            >
              {copy.secondaryCta}
            </Link>
          </div>

          <div className="mx-auto mt-7 flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-400 sm:mt-8">
            {copy.proofPoints.map((item) => (
              <div
                key={item}
                className="inline-flex items-center gap-2"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/80" />
                {item}
              </div>
            ))}
          </div>

          {/* Live Crypto Price Ticker */}
          <LiveCryptoTicker lang={lang} />
        </section>

        {/* Social Proof Stats */}
        <StatsStrip lang={lang} />

        {/* Exchange Trust Strip */}
        <ExchangeTrustStrip lang={lang} />

        <CredibilityStrip copy={copy} />
        <PathSelector copy={copy} />
        <ModuleGrid copy={copy} />
        <Footer copy={copy} />
      </main>
    </div>
  );
}
