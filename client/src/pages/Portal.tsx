import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BookOpenText,
  Bot,
  Compass,
  Download,
  FileCheck2,
  Globe,
  Newspaper,
  ShieldCheck,
  Sparkles,
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
  trustTitle: string;
  trustDescription: string;
  trustItems: { title: string; description: string }[];
  pathsTitle: string;
  pathsDescription: string;
  paths: PathCard[];
  modulesTitle: string;
  modulesDescription: string;
  modules: ModuleCard[];
  methodTitle: string;
  methodDescription: string;
  methodItems: { title: string; description: string }[];
  footerTagline: string;
  footerLegal: string;
  footerColumns: { title: string; links: LinkItem[] }[];
  languageToggle: string;
};

const COPY: Record<LanguageKey, Copy> = {
  zh: {
    badge: "研究型交易导航",
    titleLineOne: "Get8 Pro",
    titleHighlight: "让路径更清楚，让判断更可靠。",
    subtitle: "官方入口、可信来源、交易决策与学习路径，整合在同一个首页。",
    description:
      "我们不把首页做成噪声堆叠的流量页，而是把它整理成一个更像专业研究终端的入口。先帮你判断该从哪里开始，再把返佣、交易所、学习内容和实时信息按优先级排清楚。",
    primaryCta: "开始 2 分钟测评",
    secondaryCta: "直接查看交易成本与返佣",
    primaryHref: "/web3-quiz",
    secondaryHref: "/crypto-saving?path=trader#action",
    proofPoints: ["官方合作入口", "公开来源数据", "返佣规则透明", "移动端优先浏览"],
    trustTitle: "先建立信任，再引导动作",
    trustDescription:
      "首页应该先回答“这个站值不值得继续看”，而不是急着把所有模块一次性推给用户。这里把来源、方法和路径先说清楚。",
    trustItems: [
      {
        title: "官方合作与公开路径",
        description: "注册链接、返佣说明与下载路径都尽量采用可验证的官方来源，不把关键步骤藏起来。",
      },
      {
        title: "研究视角先于营销话术",
        description: "重点模块先讲判断依据、适用人群和限制条件，帮助用户快速做出可信决策。",
      },
      {
        title: "首页只承担导航，不承担全部内容",
        description: "复杂内容继续留在对应页面深入展开，首页只保留最有价值的入口与证据。",
      },
    ],
    pathsTitle: "按你的情况进入",
    pathsDescription:
      "不同用户的目标不一样。首页不再让所有入口同等说话，而是先把最短决策路径摆在前面。",
    paths: [
      {
        title: "我是第一次接触币圈",
        description: "先做测评，再按 Web3 基础、KYC、交易所下载这条线慢慢走，最不容易迷路。",
        href: "/web3-quiz",
        cta: "先做 2 分钟测评",
        tone: "cyan",
        icon: "compass",
      },
      {
        title: "我已经会交易，只想省手续费",
        description: "先确认返佣规则、合作交易所与下载路径，把默认 20% 的成本优化入口先拿到手。",
        href: "/crypto-saving?path=trader#action",
        cta: "直接看返佣路径",
        tone: "amber",
        icon: "sparkles",
      },
      {
        title: "我是老用户，想知道还能不能绑定",
        description: "先把老账户限制讲清楚，再给你新的开户方案和联络路径，避免走弯路。",
        href: "/crypto-saving?path=old#how-to-get",
        cta: "先看老用户方案",
        tone: "emerald",
        icon: "shield",
      },
    ],
    modulesTitle: "六个核心入口，按优先级排好",
    modulesDescription:
      "不再把所有模块做成同级目录。先把最能产生判断与转化的入口放在前面，其余模块做辅助支撑。",
    modules: [
      {
        title: "交易成本与返佣指南",
        subtitle: "核心动作入口",
        description:
          "默认返佣比例、适用限制、交易所合作入口、下载路径与实际节省逻辑都集中在这里，是大多数用户最先需要的主入口。",
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
        description: "把平台差异、安全性、功能和使用场景讲明白，帮助你缩短选择时间。",
        href: "/exchange-guide",
        cta: "开始筛选平台",
        stat: "5 家平台",
        note: "独立评测逻辑",
        icon: "exchange",
      },
      {
        title: "币圈工具合集",
        subtitle: "效率工具",
        description: "把图表、链上数据、DeFi、税务等工具按用途重新归类，不再靠零散收藏记忆。",
        href: "/tools",
        cta: "查看工具清单",
        stat: "12+ 工具",
        note: "持续更新",
        icon: "tools",
      },
      {
        title: "加密快讯",
        subtitle: "实时动态",
        description: "聚合重点行业动态，把市场、平台、政策和链上变化更清楚地分类给你。",
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
    methodTitle: "Get8 Pro 的方法，不靠堆叠卡片来显得专业",
    methodDescription:
      "更有质感的首页，不是做更多模块，而是让用户先看到主命题、再看到证据、最后才进入目录。首页应该像一个清楚的研究入口，而不是功能堆栈。",
    methodItems: [
      {
        title: "一屏只说一个主命题",
        description: "首屏先讲你是谁、为什么可信、最该从哪开始，而不是把所有入口同时推到用户面前。",
      },
      {
        title: "用层级取代大面积卡片",
        description: "更多使用区块、分割线和留白，让主入口和辅助入口的权重自然分开。",
      },
      {
        title: "让导航更像专业终端",
        description: "保留深色交易氛围，但减少噪声，提升可扫描性，让首页更像研究工具而不是营销落地页。",
      },
    ],
    footerTagline: "Get8 Pro 旨在把学习、判断与执行入口整理得更清楚。",
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
    proofPoints: ["Official partner entry", "Public source-based data", "Transparent rebate rules", "Mobile-first reading"],
    trustTitle: "Build trust first, then guide action",
    trustDescription:
      "A strong homepage should answer whether the site is worth trusting before pushing every module at once. This section brings source quality, method, and path design forward.",
    trustItems: [
      {
        title: "Official partner paths",
        description: "Registration links, rebates, and download flows are aligned with verifiable official sources whenever possible.",
      },
      {
        title: "Research before marketing",
        description: "Core modules explain fit, limits, and decision value before asking users to click deeper.",
      },
      {
        title: "Homepage as a navigator",
        description: "Complex content stays in deeper pages. The homepage keeps only the highest-value entry points and evidence.",
      },
    ],
    pathsTitle: "Start from your situation",
    pathsDescription:
      "Different visitors want different outcomes. The homepage should shorten that decision path instead of making every entry fight for attention.",
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
    modulesTitle: "Six entry points, ordered by priority",
    modulesDescription:
      "The homepage no longer treats every module as the same level. The highest-value paths come first, while the rest support the broader experience.",
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
    methodTitle: "A more credible homepage needs less visual noise",
    methodDescription:
      "A higher-quality homepage does not rely on more cards. It leads with the main thesis, supports it with evidence, and only then opens the directory of modules.",
    methodItems: [
      {
        title: "One idea per viewport",
        description: "The first screen should explain who you are, why the site is credible, and where to begin.",
      },
      {
        title: "Use hierarchy instead of chrome",
        description: "Lean on sections, dividers, and spacing so major and minor entries stop competing with each other.",
      },
      {
        title: "Make navigation feel terminal-like",
        description: "Keep the dark trading atmosphere, but reduce noise and improve scan rhythm so it feels more like a research product.",
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

function PathSelector({ copy }: { copy: Copy }) {
  return (
    <section className="mt-14 sm:mt-20">
      <SectionHeader title={copy.pathsTitle} description={copy.pathsDescription} />
      <div className="grid gap-4 lg:grid-cols-3">
        {copy.paths.map((item) => {
          const tone = toneClasses[item.tone as keyof typeof toneClasses];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative overflow-hidden rounded-[28px] border ${tone.border} bg-[#071525]/85 px-6 py-6 transition-all duration-300 hover:border-white/18 hover:bg-[#091b2f]`}
              onMouseEnter={() => preloadRoute(item.href)}
              onTouchStart={() => preloadRoute(item.href)}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tone.glow} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
              <div className="relative flex h-full flex-col">
                <div className="mb-5 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${tone.border} bg-white/[0.03] ${tone.text}`}>
                    {getIcon(item.icon)}
                  </div>
                  <div className={`h-px flex-1 ${tone.marker} opacity-25`} />
                </div>
                <h3 className="max-w-[16ch] text-xl font-semibold leading-tight text-white">{item.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-slate-350 sm:text-[15px]">{item.description}</p>
                <div className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold ${tone.text}`}>
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

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-8 max-w-3xl">
      <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-400 sm:text-base">{description}</p>
    </div>
  );
}

function ModuleGrid({ copy }: { copy: Copy }) {
  const [primary, secondaryA, secondaryB, ...rest] = copy.modules;

  return (
    <section className="mt-18 sm:mt-24">
      <SectionHeader title={copy.modulesTitle} description={copy.modulesDescription} />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <ModuleSurface module={primary} kind="primary" />
        <div className="grid gap-5">
          <ModuleSurface module={secondaryA} kind="secondary" />
          <ModuleSurface module={secondaryB} kind="secondary" />
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
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

  return (
    <Link
      href={module.href}
      className={`group relative overflow-hidden rounded-[32px] border border-white/8 bg-[#071525]/82 transition-all duration-300 hover:border-white/14 hover:bg-[#091a2d] ${
        isCompact ? "px-5 py-5" : "px-6 py-6 sm:px-7 sm:py-7"
      }`}
      onMouseEnter={() => {
        if (module.preload !== false) preloadRoute(module.href);
      }}
      onTouchStart={() => {
        if (module.preload !== false) preloadRoute(module.href);
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.14),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_34%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-cyan-300">
              {getIcon(module.icon)}
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{module.subtitle}</div>
              <h3 className={`${isPrimary ? "mt-3 text-3xl sm:text-[2rem]" : "mt-2 text-2xl"} font-semibold tracking-tight text-white`}>
                {module.title}
              </h3>
            </div>
          </div>
          <div className="rounded-full border border-amber-400/16 bg-amber-400/8 px-3 py-1 text-xs font-medium text-amber-300">
            {module.stat}
          </div>
        </div>

        <div className={`mt-5 grid ${isPrimary ? "gap-10 lg:grid-cols-[1fr_220px]" : "gap-5"} items-start`}>
          <div>
            <p className={`text-slate-350 ${isCompact ? "text-sm leading-7" : "text-[15px] leading-8 sm:text-base"} max-w-[46rem]`}>
              {module.description}
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">
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

function MethodSection({ copy }: { copy: Copy }) {
  return (
    <section className="mt-18 sm:mt-24">
      <div className="rounded-[36px] border border-white/8 bg-[#071322]/82 px-6 py-8 sm:px-8 sm:py-10">
        <SectionHeader title={copy.methodTitle} description={copy.methodDescription} />
        <div className="grid gap-6 md:grid-cols-3">
          {copy.methodItems.map((item) => (
            <div key={item.title} className="border-t border-white/10 pt-5">
              <div className="mb-3 flex items-center gap-3">
                <FileCheck2 className="h-4 w-4 text-cyan-300" />
                <h3 className="text-lg font-medium text-white">{item.title}</h3>
              </div>
              <p className="text-sm leading-7 text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer({ copy }: { copy: Copy }) {
  return (
    <footer className="mt-20 border-t border-white/8 pb-14 pt-10 sm:mt-24">
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
      <div className="pointer-events-none absolute inset-0 opacity-[0.22]" style={{ backgroundImage: "linear-gradient(rgba(56,189,248,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.08) 1px, transparent 1px)", backgroundSize: "56px 56px" }} />
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

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pb-18 sm:pt-20 lg:px-8 lg:pt-24">
        <section className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/18 bg-amber-400/8 px-4 py-2 text-sm font-medium text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            {copy.badge}
          </div>

          <h1 className="mt-8 text-balance text-[3rem] font-semibold leading-[0.95] tracking-tight text-white sm:text-[4.75rem] lg:text-[6.25rem]">
            {copy.titleLineOne}
          </h1>
          <p className="mx-auto mt-5 max-w-4xl text-balance text-2xl font-medium leading-tight text-slate-200 sm:text-3xl lg:text-[2.75rem]">
            <span className="bg-[linear-gradient(90deg,#f8fafc_0%,#67e8f9_28%,#fbbf24_65%,#f8fafc_100%)] bg-clip-text text-transparent">
              {copy.titleHighlight}
            </span>
          </p>
          <p className="mx-auto mt-5 max-w-3xl text-balance text-lg leading-8 text-slate-350 sm:text-xl">
            {copy.subtitle}
          </p>
          <p className="mx-auto mt-6 max-w-3xl text-sm leading-8 text-slate-450 sm:text-base">
            {copy.description}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={copy.primaryHref}
              className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition-all hover:bg-cyan-200"
              onMouseEnter={() => preloadRoute(copy.primaryHref)}
              onTouchStart={() => preloadRoute(copy.primaryHref)}
            >
              {copy.primaryCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={copy.secondaryHref}
              className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white transition-all hover:border-white/18 hover:bg-white/[0.06]"
              onMouseEnter={() => preloadRoute(copy.secondaryHref)}
              onTouchStart={() => preloadRoute(copy.secondaryHref)}
            >
              {copy.secondaryCta}
            </Link>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {copy.proofPoints.map((item) => (
              <div
                key={item}
                className="flex min-h-[52px] items-center justify-center rounded-full border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 sm:mt-20">
          <div className="grid gap-6 rounded-[36px] border border-white/8 bg-[#061321]/88 px-6 py-8 sm:px-8 sm:py-9 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Trust Layer</div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">{copy.trustTitle}</h2>
              <p className="mt-4 text-sm leading-8 text-slate-400 sm:text-base">{copy.trustDescription}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {copy.trustItems.map((item) => (
                <div key={item.title} className="border-l border-white/10 pl-4">
                  <h3 className="text-base font-medium text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <PathSelector copy={copy} />
        <ModuleGrid copy={copy} />
        <MethodSection copy={copy} />
        <Footer copy={copy} />
      </main>
    </div>
  );
}
