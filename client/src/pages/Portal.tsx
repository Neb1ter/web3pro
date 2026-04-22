import { useEffect, useMemo, useState } from "react";
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
  Users,
  Wrench,
} from "lucide-react";
import { useScrollMemory } from "@/hooks/useScrollMemory";
import { useLanguage } from "@/contexts/LanguageContext";
import { preloadRoute, scheduleIdle } from "@/lib/routePreload";

type LanguageKey = "zh" | "en";

type NavItem = {
  label: string;
  href: string;
};

type MetricItem = {
  value: string;
  label: string;
};

type ExchangeItem = {
  name: string;
  note: string;
  href: string;
  accent: string;
};

type FeaturePanel = {
  eyebrow: string;
  title: string;
  bullets: string[];
  href: string;
  cta: string;
  kind: "rebate" | "learn";
};

type StepItem = {
  index: string;
  title: string;
  description: string;
  href: string;
};

type ContentCard = {
  category: string;
  title: string;
  href: string;
  accent: "lime" | "amber" | "cyan" | "violet";
};

type AssuranceItem = {
  title: string;
  description: string;
  icon: "shield" | "globe" | "users" | "tools";
};

type FooterColumn = {
  title: string;
  links: NavItem[];
};

type Copy = {
  brandSubline: string;
  nav: NavItem[];
  heroBadge: string;
  heroTitleA: string;
  heroTitleB: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  heroDescription: string;
  heroPoints: string[];
  primaryCta: string;
  secondaryCta: string;
  primaryHref: string;
  secondaryHref: string;
  metrics: MetricItem[];
  exchangesTitle: string;
  exchangesCta: string;
  exchanges: ExchangeItem[];
  panels: FeaturePanel[];
  stepsTitle: string;
  stepsCta: string;
  steps: StepItem[];
  contentTitle: string;
  contentCta: string;
  contentCards: ContentCard[];
  assurances: AssuranceItem[];
  joinTitle: string;
  joinDescription: string;
  joinPrimary: string;
  joinSecondary: string;
  footerNote: string;
  footerLegal: string;
  footerColumns: FooterColumn[];
  languageToggle: string;
};

const COPY: Record<LanguageKey, Copy> = {
  zh: {
    brandSubline: "REBATE & WEB3 HUB",
    nav: [
      { label: "首页", href: "/" },
      { label: "交易所返佣", href: "/crypto-saving" },
      { label: "Web3 科普", href: "/web3-guide" },
      { label: "工具", href: "/tools" },
      { label: "快讯", href: "/crypto-news" },
      { label: "关于我们", href: "/about" },
    ],
    heroBadge: "研究型交易导航",
    heroTitleA: "更聪明交易",
    heroTitleB: "更高返佣",
    heroTitleAccent: "探索 Web3",
    heroSubtitle: "官方合作交易所入口与 Web3 学习中心",
    heroDescription: "把返佣路径、交易所选择、Web3 学习和实用工具整理成一张更清楚的首页。",
    heroPoints: ["官方注册链接", "返佣规则透明", "双语内容", "移动端优先"],
    primaryCta: "注册领取返佣",
    secondaryCta: "探索 Web3 世界",
    primaryHref: "/crypto-saving",
    secondaryHref: "/web3-guide",
    metrics: [
      { value: "5", label: "合作交易所" },
      { value: "7", label: "学习主线" },
      { value: "12+", label: "工具精选" },
      { value: "双语", label: "中英内容" },
      { value: "6", label: "模拟器" },
    ],
    exchangesTitle: "合作交易所",
    exchangesCta: "查看全部交易所",
    exchanges: [
      { name: "OKX", note: "交易 + Web3", href: "/exchange/okx", accent: "white" },
      { name: "Binance", note: "主流深度", href: "/exchange/binance", accent: "amber" },
      { name: "Bybit", note: "合约工具", href: "/exchange/bybit", accent: "amber" },
      { name: "Gate.io", note: "返佣优先", href: "/exchange/gate", accent: "emerald" },
      { name: "Bitget", note: "跟单入口", href: "/exchange/bitget", accent: "cyan" },
    ],
    panels: [
      {
        eyebrow: "交易所返佣",
        title: "把返佣规则、下载入口和适用限制放在同一页",
        bullets: ["默认 20% 返佣", "官方入口优先", "老用户限制先说明"],
        href: "/crypto-saving",
        cta: "查看返佣攻略",
        kind: "rebate",
      },
      {
        eyebrow: "Web3 科普",
        title: "用一条更顺的学习线，先补基础再进入交易",
        bullets: ["区块链基础", "KYC 流程", "钱包与私钥"],
        href: "/web3-guide",
        cta: "开始学习",
        kind: "learn",
      },
    ],
    stepsTitle: "新手开始 · 三步进入",
    stepsCta: "查看详细教程",
    steps: [
      { index: "1", title: "先做测评", description: "先判断你适合从学习、返佣还是交易所下载开始。", href: "/web3-quiz" },
      { index: "2", title: "选择交易所账户", description: "根据你的需求选择平台，再进入官方合作或官网教程。", href: "/exchange-download" },
      { index: "3", title: "开始返佣或学习路径", description: "拿到返佣入口，或继续走 Web3 学习主线。", href: "/crypto-saving" },
    ],
    contentTitle: "精选内容",
    contentCta: "查看全部内容",
    contentCards: [
      { category: "新手入门", title: "第一次注册交易所前，先看哪三件事？", href: "/exchange-download", accent: "lime" },
      { category: "DeFi", title: "从 DeFi 到链上工具，先学什么更顺？", href: "/web3-guide/defi-deep", accent: "amber" },
      { category: "市场动态", title: "快讯和深度文章怎么配合看？", href: "/crypto-news", accent: "cyan" },
      { category: "工具教程", title: "图表、链上和研究工具从哪里开始？", href: "/tools", accent: "violet" },
    ],
    assurances: [
      { title: "安全导向", description: "关键限制先说清，再给入口。", icon: "shield" },
      { title: "规则透明", description: "返佣、绑定与风险提示前置展示。", icon: "tools" },
      { title: "覆盖主流场景", description: "学习、返佣、下载和快讯按优先级整理。", icon: "globe" },
      { title: "双语浏览", description: "中英文切换下维持一致结构。", icon: "users" },
    ],
    joinTitle: "立即加入 Get8 Pro",
    joinDescription: "从测评开始，再进入返佣或 Web3 学习路径。",
    joinPrimary: "开始 2 分钟测评",
    joinSecondary: "查看交易成本与返佣",
    footerNote: "Get8 Pro 首先是一个帮助你判断和进入正确页面的交易导航站。",
    footerLegal: "内容仅供参考，不构成投资建议。交易与投资均有风险，请结合自身情况谨慎判断。",
    footerColumns: [
      {
        title: "平台",
        links: [
          { label: "交易所返佣", href: "/crypto-saving" },
          { label: "Web3 科普", href: "/web3-guide" },
          { label: "工具", href: "/tools" },
          { label: "快讯", href: "/crypto-news" },
        ],
      },
      {
        title: "支持",
        links: [
          { label: "帮助中心", href: "/contact" },
          { label: "联系我们", href: "/contact" },
          { label: "编辑原则", href: "/standards" },
          { label: "法律与披露", href: "/legal" },
        ],
      },
      {
        title: "关于",
        links: [
          { label: "关于我们", href: "/about" },
          { label: "交易所下载", href: "/exchange-download" },
          { label: "交易所对比", href: "/exchanges" },
          { label: "第六板块", href: "/codex-business" },
        ],
      },
    ],
    languageToggle: "EN",
  },
  en: {
    brandSubline: "REBATE & WEB3 HUB",
    nav: [
      { label: "Home", href: "/" },
      { label: "Rebates", href: "/crypto-saving" },
      { label: "Web3 Guide", href: "/web3-guide" },
      { label: "Tools", href: "/tools" },
      { label: "News", href: "/crypto-news" },
      { label: "About", href: "/about" },
    ],
    heroBadge: "Research-led Trading Navigation",
    heroTitleA: "Trade Smarter",
    heroTitleB: "Earn More Rebate",
    heroTitleAccent: "Explore Web3",
    heroSubtitle: "Official exchange entries and a clearer Web3 learning hub",
    heroDescription: "One homepage for rebate paths, exchange choices, Web3 learning, and practical crypto tools.",
    heroPoints: ["Official registration links", "Transparent rebate rules", "Bilingual content", "Mobile-first layout"],
    primaryCta: "Claim rebate path",
    secondaryCta: "Explore Web3",
    primaryHref: "/crypto-saving",
    secondaryHref: "/web3-guide",
    metrics: [
      { value: "5", label: "Partner exchanges" },
      { value: "7", label: "Learning chapters" },
      { value: "12+", label: "Tools" },
      { value: "Bilingual", label: "ZH & EN" },
      { value: "6", label: "Simulators" },
    ],
    exchangesTitle: "Partner Exchanges",
    exchangesCta: "See all exchanges",
    exchanges: [
      { name: "OKX", note: "Trading + Web3", href: "/exchange/okx", accent: "white" },
      { name: "Binance", note: "Major liquidity", href: "/exchange/binance", accent: "amber" },
      { name: "Bybit", note: "Derivatives tools", href: "/exchange/bybit", accent: "amber" },
      { name: "Gate.io", note: "Rebate-first", href: "/exchange/gate", accent: "emerald" },
      { name: "Bitget", note: "Copy trading", href: "/exchange/bitget", accent: "cyan" },
    ],
    panels: [
      {
        eyebrow: "Exchange Rebates",
        title: "Keep rebate rules, download entries, and account limits in one place",
        bullets: ["Default 20% rebate", "Official links first", "Existing-account limits upfront"],
        href: "/crypto-saving",
        cta: "Open rebate guide",
        kind: "rebate",
      },
      {
        eyebrow: "Web3 Learning",
        title: "A cleaner sequence that teaches fundamentals before trading",
        bullets: ["Blockchain basics", "KYC flow", "Wallets and keys"],
        href: "/web3-guide",
        cta: "Start learning",
        kind: "learn",
      },
    ],
    stepsTitle: "Getting Started · Three Steps",
    stepsCta: "See the full guide",
    steps: [
      { index: "1", title: "Take the quiz", description: "See whether you should begin with learning, rebates, or exchange setup.", href: "/web3-quiz" },
      { index: "2", title: "Choose an exchange", description: "Pick the platform that fits you, then enter the official partner or manual guide.", href: "/exchange-download" },
      { index: "3", title: "Start the right path", description: "Move into the rebate flow or continue along the Web3 learning track.", href: "/crypto-saving" },
    ],
    contentTitle: "Featured Content",
    contentCta: "See all content",
    contentCards: [
      { category: "Beginner", title: "What should you check before opening an exchange account?", href: "/exchange-download", accent: "lime" },
      { category: "DeFi", title: "What should you learn first before using DeFi tools?", href: "/web3-guide/defi-deep", accent: "amber" },
      { category: "Market", title: "How should quick news and deep articles work together?", href: "/crypto-news", accent: "cyan" },
      { category: "Tools", title: "Where should you start with charts and research tools?", href: "/tools", accent: "violet" },
    ],
    assurances: [
      { title: "Security-first", description: "Limits and cautions appear before action links.", icon: "shield" },
      { title: "Transparent rules", description: "Rebates, binding, and risk notes stay visible.", icon: "tools" },
      { title: "Built for real flows", description: "Learning, rebates, setup, and updates are ordered clearly.", icon: "globe" },
      { title: "Bilingual reading", description: "Chinese and English follow the same structure.", icon: "users" },
    ],
    joinTitle: "Join Get8 Pro",
    joinDescription: "Start with the quiz, then move into rebates or the Web3 learning path.",
    joinPrimary: "Take the 2-minute quiz",
    joinSecondary: "View trading cost & rebate guide",
    footerNote: "Get8 Pro is designed to help you judge, choose, and enter the right page faster.",
    footerLegal: "Content is for reference only and does not constitute investment advice. Please act carefully and at your own risk.",
    footerColumns: [
      {
        title: "Platform",
        links: [
          { label: "Rebate Guide", href: "/crypto-saving" },
          { label: "Web3 Guide", href: "/web3-guide" },
          { label: "Tools", href: "/tools" },
          { label: "News", href: "/crypto-news" },
        ],
      },
      {
        title: "Support",
        links: [
          { label: "Help", href: "/contact" },
          { label: "Contact", href: "/contact" },
          { label: "Standards", href: "/standards" },
          { label: "Legal", href: "/legal" },
        ],
      },
      {
        title: "About",
        links: [
          { label: "About", href: "/about" },
          { label: "Exchange Download", href: "/exchange-download" },
          { label: "Exchange Compare", href: "/exchanges" },
          { label: "Module Six", href: "/codex-business" },
        ],
      },
    ],
    languageToggle: "中文",
  },
};

const EXCHANGE_ACCENTS: Record<string, string> = {
  white: "bg-white",
  amber: "bg-[#f7c62f]",
  emerald: "bg-[#87ff2a]",
  cyan: "bg-[#4ef4d1]",
};

const CONTENT_ACCENTS: Record<ContentCard["accent"], string> = {
  lime: "from-[#cbff22]/25 to-transparent",
  amber: "from-[#f7c62f]/22 to-transparent",
  cyan: "from-[#42d8ff]/20 to-transparent",
  violet: "from-[#8b5cf6]/24 to-transparent",
};

function prefetchProps(href: string) {
  return {
    onMouseEnter: () => preloadRoute(href),
    onTouchStart: () => preloadRoute(href),
  };
}

function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <div
      className={`grid grid-cols-2 grid-rows-3 gap-[10%] rounded-[10px] border border-[#cbff22]/18 bg-[#0e1218] p-[12%] shadow-[0_0_30px_rgba(203,255,34,0.12)] ${className}`}
      aria-hidden="true"
    >
      {[0, 1, 2, 3, 4, 5].map((cell) => (
        <span
          key={cell}
          className={`rounded-[3px] ${cell === 2 || cell === 3 ? "bg-[#cbff22]" : "bg-[#cbff22]/70"}`}
        />
      ))}
    </div>
  );
}

function SectionLead({
  title,
  actionLabel,
  actionHref,
}: {
  title: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 sm:mb-5">
      <h2 className="text-[1.55rem] font-semibold tracking-tight text-white sm:text-[1.85rem]">{title}</h2>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="hidden items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-[#cbff22] sm:inline-flex"
          {...prefetchProps(actionHref)}
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function HeroVisual() {
  const miniBlocks = [
    { left: "10%", top: "18%", delay: "0s" },
    { left: "24%", top: "68%", delay: "1.4s" },
    { left: "73%", top: "16%", delay: "0.8s" },
    { left: "84%", top: "52%", delay: "1.7s" },
    { left: "63%", top: "78%", delay: "0.5s" },
  ];

  return (
    <div className="relative h-[320px] overflow-hidden rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_center,rgba(203,255,34,0.07),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)] sm:h-[380px] lg:h-[430px]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] opacity-35" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(203,255,34,0.14),transparent_36%)]" />

      {miniBlocks.map((block, index) => (
        <div
          key={`${block.left}-${block.top}`}
          className="absolute h-10 w-10 rounded-[10px] border border-white/10 bg-[linear-gradient(180deg,#171b22_0%,#0c0f13_100%)] shadow-[0_18px_30px_rgba(0,0,0,0.35)]"
          style={{
            left: block.left,
            top: block.top,
            animation: `heroFloat 5.8s ease-in-out ${block.delay} infinite`,
            transform: `rotate(${index % 2 === 0 ? 8 : -10}deg)`,
          }}
        >
          <div className="absolute inset-2 rounded-[6px] border border-[#cbff22]/25 bg-[#cbff22]/10" />
        </div>
      ))}

      <div className="absolute left-1/2 top-1/2 h-[216px] w-[216px] -translate-x-1/2 -translate-y-1/2 rounded-[38px] border border-white/12 bg-[linear-gradient(180deg,#181d24_0%,#0b0f14_100%)] shadow-[0_35px_80px_rgba(0,0,0,0.55)] sm:h-[250px] sm:w-[250px] lg:h-[286px] lg:w-[286px]">
        <div className="absolute inset-5 rounded-[28px] border border-[#cbff22]/18 bg-[radial-gradient(circle_at_top,rgba(203,255,34,0.18),transparent_48%),linear-gradient(180deg,#12171d_0%,#090c10_100%)]" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[54%] text-[7rem] font-black leading-none text-[#cbff22] drop-shadow-[0_0_30px_rgba(203,255,34,0.22)] sm:text-[8.5rem] lg:text-[10rem]">
          8
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 h-10 w-[74%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(203,255,34,0.18),transparent_70%)] blur-2xl" />
    </div>
  );
}

function ExchangeRail({ title, actionLabel, items }: { title: string; actionLabel: string; items: ExchangeItem[] }) {
  return (
    <section className="mt-8 rounded-[26px] border border-white/8 bg-[#0a0d12] p-4 sm:mt-10 sm:p-5 lg:p-6">
      <SectionLead title={title} actionLabel={actionLabel} actionHref="/exchanges" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="group rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,#11151b_0%,#0b0e13_100%)] px-4 py-4 transition-all duration-300 hover:border-white/14 hover:-translate-y-0.5"
            {...prefetchProps(item.href)}
          >
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${EXCHANGE_ACCENTS[item.accent]}`} />
              <span className="text-lg font-semibold tracking-wide text-white">{item.name}</span>
            </div>
            <p className="mt-3 text-sm text-slate-400">{item.note}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function FeaturePanels({ panels }: { panels: FeaturePanel[] }) {
  return (
    <section className="mt-8 grid gap-4 lg:grid-cols-2">
      {panels.map((panel) => (
        <Link
          key={panel.href}
          href={panel.href}
          className="group relative overflow-hidden rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,#0f1319_0%,#090c10_100%)] p-5 transition-all duration-300 hover:border-white/14 hover:-translate-y-0.5 sm:p-6"
          {...prefetchProps(panel.href)}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(203,255,34,0.14),transparent_34%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_220px]">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-[#cbff22]">{panel.eyebrow}</div>
              <h3 className="mt-3 max-w-[18ch] text-[1.55rem] font-semibold leading-tight text-white sm:text-[1.85rem]">
                {panel.title}
              </h3>
              <ul className="mt-5 space-y-2 text-sm text-slate-300">
                {panel.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#cbff22]" />
                    {bullet}
                  </li>
                ))}
              </ul>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#cbff22]">
                {panel.cta}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </div>

            <div className="hidden overflow-hidden rounded-[22px] border border-white/8 bg-[#0b0f14] lg:block">
              {panel.kind === "rebate" ? (
                <div className="relative h-full">
                  <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(180deg,transparent_0%,rgba(203,255,34,0.08)_100%)]" />
                  <div className="absolute bottom-6 left-8 right-8 flex items-end justify-between gap-3">
                    {[42, 66, 98, 124].map((height, index) => (
                      <div key={height} className="flex flex-col items-center gap-2">
                        <div
                          className="w-8 rounded-t-[12px] bg-[linear-gradient(180deg,#cbff22_0%,#7db400_100%)] shadow-[0_0_25px_rgba(203,255,34,0.18)]"
                          style={{ height }}
                        />
                        <span className="text-[10px] text-slate-500">{index + 1}</span>
                      </div>
                    ))}
                  </div>
                  <div className="absolute right-8 top-8 flex h-16 w-16 items-center justify-center rounded-[18px] border border-[#cbff22]/20 bg-[#cbff22]/10 text-[#cbff22]">
                    <Sparkles className="h-8 w-8" />
                  </div>
                </div>
              ) : (
                <div className="relative h-full bg-[radial-gradient(circle_at_center,rgba(203,255,34,0.12),transparent_45%)]">
                  {["DeFi", "Wallet", "NFT", "KYC"].map((word, index) => (
                    <div
                      key={word}
                      className="absolute flex h-16 w-16 items-center justify-center rounded-[18px] border border-white/10 bg-[#11161d] text-[11px] font-medium text-slate-300 shadow-[0_16px_30px_rgba(0,0,0,0.35)]"
                      style={{
                        left: ["16%", "58%", "24%", "64%"][index],
                        top: ["16%", "28%", "60%", "66%"][index],
                        transform: `rotate(${index % 2 === 0 ? -8 : 8}deg)`,
                      }}
                    >
                      {word}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </section>
  );
}

function StepsSection({ title, actionLabel, steps }: { title: string; actionLabel: string; steps: StepItem[] }) {
  return (
    <section className="mt-10">
      <SectionLead title={title} actionLabel={actionLabel} actionHref="/exchange-download" />
      <div className="grid gap-3 lg:grid-cols-3">
        {steps.map((step) => (
          <Link
            key={step.title}
            href={step.href}
            className="group rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,#0f1319_0%,#090c10_100%)] px-5 py-5 transition-all duration-300 hover:border-white/14 hover:-translate-y-0.5"
            {...prefetchProps(step.href)}
          >
            <div className="flex items-start gap-4">
              <div className="text-[2.4rem] font-black leading-none text-[#cbff22]">{step.index}</div>
              <div>
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-400">{step.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ContentShowcase({
  title,
  actionLabel,
  cards,
}: {
  title: string;
  actionLabel: string;
  cards: ContentCard[];
}) {
  return (
    <section className="mt-10">
      <SectionLead title={title} actionLabel={actionLabel} actionHref="/articles" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => (
          <Link
            key={card.title}
            href={card.href}
            className="group relative overflow-hidden rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,#0f1319_0%,#090c10_100%)] p-4 transition-all duration-300 hover:border-white/14 hover:-translate-y-0.5"
            {...prefetchProps(card.href)}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${CONTENT_ACCENTS[card.accent]} opacity-100`} />
            <div className="absolute right-4 top-4 h-16 w-16 rounded-full bg-white/[0.03] blur-2xl" />
            <div className="relative flex h-full min-h-[190px] flex-col justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{card.category}</div>
                <div className="mt-5 flex h-20 items-center justify-center rounded-[18px] border border-white/8 bg-[#12161d]/88 text-[2rem] font-black text-white/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  {["↗", "◎", "₿", "NFT"][index]}
                </div>
              </div>
              <div className="mt-5">
                <h3 className="text-base font-semibold leading-7 text-white">{card.title}</h3>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#cbff22]">
                  查看内容
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function AssuranceRow({ items }: { items: AssuranceItem[] }) {
  return (
    <section className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.title} className="rounded-[20px] border border-white/8 bg-[#0b0f14] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#cbff22]/18 bg-[#cbff22]/8 text-[#cbff22]">
              {item.icon === "shield" ? <ShieldCheck className="h-5 w-5" /> : null}
              {item.icon === "globe" ? <Globe className="h-5 w-5" /> : null}
              {item.icon === "users" ? <Users className="h-5 w-5" /> : null}
              {item.icon === "tools" ? <Wrench className="h-5 w-5" /> : null}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{item.title}</div>
              <div className="mt-1 text-sm text-slate-400">{item.description}</div>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

function JoinBand({
  title,
  description,
  primary,
  secondary,
  primaryHref,
  secondaryHref,
}: {
  title: string;
  description: string;
  primary: string;
  secondary: string;
  primaryHref: string;
  secondaryHref: string;
}) {
  return (
    <section className="mt-8 overflow-hidden rounded-[26px] border border-[#cbff22]/14 bg-[linear-gradient(90deg,#0c0f14_0%,#11161c_55%,#0d1015_100%)]">
      <div className="grid gap-5 px-5 py-5 sm:px-6 sm:py-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-[#cbff22]/18 bg-[#cbff22]/10 text-[#cbff22]">
            <BrandMark className="h-10 w-10 border-none bg-transparent p-0 shadow-none" />
          </div>
          <div>
            <h2 className="text-[1.4rem] font-semibold tracking-tight text-white sm:text-[1.6rem]">{title}</h2>
            <p className="mt-2 text-sm leading-7 text-slate-400">{description}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            href={primaryHref}
            className="inline-flex min-h-[48px] items-center justify-center rounded-[14px] bg-[#cbff22] px-5 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5"
            {...prefetchProps(primaryHref)}
          >
            {primary}
          </Link>
          <Link
            href={secondaryHref}
            className="inline-flex min-h-[48px] items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.02] px-5 text-sm font-semibold text-white transition-colors hover:border-white/18"
            {...prefetchProps(secondaryHref)}
          >
            {secondary}
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer({ copy }: { copy: Copy }) {
  return (
    <footer className="mt-10 rounded-[26px] border border-white/8 bg-[#080b10] px-5 py-6 sm:px-6 sm:py-8">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div>
              <div className="text-lg font-semibold text-white">Get8.Pro</div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{copy.brandSubline}</div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-300">{copy.footerNote}</p>
          <p className="mt-4 text-xs leading-6 text-slate-500">{copy.footerLegal}</p>
        </div>

        {copy.footerColumns.map((column) => (
          <div key={column.title}>
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{column.title}</div>
            <div className="mt-4 space-y-3">
              {column.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-slate-300 transition-colors hover:text-[#cbff22]"
                  {...prefetchProps(link.href)}
                >
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
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-[-180px] h-[560px] bg-[radial-gradient(circle_at_top,rgba(203,255,34,0.18),transparent_46%)]" />
      <div className="pointer-events-none absolute left-[-120px] top-[240px] h-[360px] w-[360px] rounded-full bg-[#cbff22]/7 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-120px] top-[120px] h-[360px] w-[360px] rounded-full bg-[#42d8ff]/6 blur-[130px]" />
    </>
  );
}

export default function Portal() {
  useScrollMemory();
  const { language, setLanguage } = useLanguage();
  const lang = (language === "en" ? "en" : "zh") as LanguageKey;
  const copy = useMemo(() => COPY[lang], [lang]);
  const [showAmbient, setShowAmbient] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobileViewport = window.matchMedia("(max-width: 900px)").matches;
    if (!reducedMotion && !mobileViewport) {
      return scheduleIdle(() => setShowAmbient(true), 1200);
    }
    return undefined;
  }, []);

  useEffect(
    () =>
      scheduleIdle(() => {
        ["/crypto-saving", "/web3-guide", "/exchange-download", "/crypto-news", "/tools"].forEach(preloadRoute);
      }, 2200),
    [],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05070b] text-white">
      <style>
        {`
          @keyframes heroFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
        `}
      </style>

      {showAmbient ? <AmbientBackground /> : null}

      <main className="relative z-10 mx-auto max-w-[1440px] px-4 pb-20 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,#090b10_0%,#06080c_100%)] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="border-b border-white/8 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-3" {...prefetchProps("/")}>
                <BrandMark />
                <div>
                  <div className="text-lg font-semibold text-white">Get8.Pro</div>
                  <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{copy.brandSubline}</div>
                </div>
              </Link>

              <nav className="hidden items-center gap-6 lg:flex">
                {copy.nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm text-slate-300 transition-colors hover:text-white"
                    {...prefetchProps(item.href)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLanguage(lang === "zh" ? "en" : "zh")}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3.5 text-xs font-medium text-slate-300 transition-colors hover:border-white/18 hover:text-white"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {copy.languageToggle}
                </button>
                <Link
                  href={copy.primaryHref}
                  className="hidden h-10 items-center rounded-full bg-[#cbff22] px-4 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5 sm:inline-flex"
                  {...prefetchProps(copy.primaryHref)}
                >
                  {copy.primaryCta}
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-12">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#cbff22]/18 bg-[#cbff22]/8 px-3.5 py-1.5 text-xs font-medium text-[#cbff22]">
                <span className="h-2 w-2 rounded-full bg-[#cbff22]" />
                {copy.heroBadge}
              </div>

              <h1 className="mt-6 text-[2.8rem] font-black leading-[0.95] tracking-tight text-white sm:text-[4.3rem] lg:text-[5.6rem]">
                <span className="block">{copy.heroTitleA}</span>
                <span className="block">{copy.heroTitleB}</span>
                <span className="mt-1 block text-[#cbff22]">{copy.heroTitleAccent}</span>
              </h1>

              <p className="mt-4 text-lg font-medium text-slate-200 sm:text-xl">{copy.heroSubtitle}</p>
              <p className="mt-3 max-w-[40rem] text-sm leading-7 text-slate-400 sm:text-base sm:leading-8">
                {copy.heroDescription}
              </p>

              <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {copy.heroPoints.map((point, index) => (
                  <div key={point} className="flex items-center gap-3 rounded-[16px] border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-slate-200">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-[12px] ${
                        index % 2 === 0 ? "bg-[#cbff22]/12 text-[#cbff22]" : "bg-white/[0.04] text-slate-200"
                      }`}
                    >
                      {index === 0 ? <Sparkles className="h-4 w-4" /> : null}
                      {index === 1 ? <ShieldCheck className="h-4 w-4" /> : null}
                      {index === 2 ? <Globe className="h-4 w-4" /> : null}
                      {index === 3 ? <Compass className="h-4 w-4" /> : null}
                    </span>
                    {point}
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={copy.primaryHref}
                  className="inline-flex min-h-[50px] items-center justify-center rounded-[16px] bg-[#cbff22] px-5 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5"
                  {...prefetchProps(copy.primaryHref)}
                >
                  {copy.primaryCta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href={copy.secondaryHref}
                  className="inline-flex min-h-[50px] items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.02] px-5 text-sm font-semibold text-white transition-colors hover:border-white/18"
                  {...prefetchProps(copy.secondaryHref)}
                >
                  {copy.secondaryCta}
                </Link>
              </div>
            </div>

            <HeroVisual />
          </div>

          <div className="grid border-t border-white/8 bg-white/[0.02] sm:grid-cols-2 xl:grid-cols-5">
            {copy.metrics.map((metric) => (
              <div key={metric.label} className="border-b border-white/8 px-4 py-4 last:border-b-0 sm:border-r sm:last:border-r-0 xl:border-b-0 xl:px-5">
                <div className="text-[1.25rem] font-semibold text-white sm:text-[1.45rem]">{metric.value}</div>
                <div className="mt-1 text-sm text-slate-400">{metric.label}</div>
              </div>
            ))}
          </div>
        </section>

        <ExchangeRail title={copy.exchangesTitle} actionLabel={copy.exchangesCta} items={copy.exchanges} />
        <FeaturePanels panels={copy.panels} />
        <StepsSection title={copy.stepsTitle} actionLabel={copy.stepsCta} steps={copy.steps} />
        <ContentShowcase title={copy.contentTitle} actionLabel={copy.contentCta} cards={copy.contentCards} />
        <AssuranceRow items={copy.assurances} />
        <JoinBand
          title={copy.joinTitle}
          description={copy.joinDescription}
          primary={copy.joinPrimary}
          secondary={copy.joinSecondary}
          primaryHref="/web3-quiz"
          secondaryHref="/crypto-saving"
        />
        <Footer copy={copy} />
      </main>
    </div>
  );
}
