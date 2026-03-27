import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, ExternalLink, Globe, Shield } from "lucide-react";
import { SeoManager } from "@/components/SeoManager";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { useExchangeLinks } from "@/contexts/ExchangeLinksContext";
import { goBack, useScrollMemory } from "@/hooks/useScrollMemory";

type ExchangeSlug = "gate" | "okx" | "binance" | "bybit" | "bitget";
type FlowMode = "partner" | "official";

type ExchangeMeta = {
  name: string;
  accent: string;
  officialSignup: string;
  officialDownload: string;
  officialDomain: string;
  partnerNoteZh: string;
  partnerNoteEn: string;
  officialIntroZh: string;
  officialIntroEn: string;
};

type GuideStep = {
  titleZh: string;
  titleEn: string;
  bodyZh: string;
  bodyEn: string;
  imageTitleZh: string;
  imageTitleEn: string;
  imageHintZh: string;
  imageHintEn: string;
  imageSrc?: string;
  imageAltZh?: string;
  imageAltEn?: string;
};

const FALLBACK_INVITE = "getitpro";

const GATE_GUIDE_DEFAULTS = {
  step1: "/images/exchange-guides/gate/step-1-home.png",
  step2: "/images/exchange-guides/gate/step-2-invite.png",
  step3: "/images/exchange-guides/gate/step-3-download.png",
} as const;

const EXCHANGES: Record<ExchangeSlug, ExchangeMeta> = {
  gate: {
    name: "Gate.io",
    accent: "#00B173",
    officialSignup: "https://www.gate.com/signup",
    officialDownload: "https://www.gate.com/zh/appdownload",
    officialDomain: "gate.com",
    partnerNoteZh: "这是 Gate 官方分配的合作入口，点击后会直接进入官方域名体系内的注册流程。",
    partnerNoteEn: "This partner link stays inside Gate's official domain system and opens the official registration flow directly.",
    officialIntroZh: "如果你想从 Gate 官网原生页面手动注册，下方会按帮助中心的方式一步步告诉你在哪里点击、在哪里填写邀请码、最后去哪里下载 App。",
    officialIntroEn: "If you prefer the native official page, the guide below shows exactly where to click, where to enter the invite code, and where to download the app.",
  },
  okx: {
    name: "OKX",
    accent: "#7EA7FF",
    officialSignup: "https://www.okx.com/account/register",
    officialDownload: "https://www.okx.com/download",
    officialDomain: "okx.com",
    partnerNoteZh: "这是 OKX 官方分配的合作入口，点击后会直接进入官方注册流程。",
    partnerNoteEn: "This partner link opens OKX's official registration flow directly.",
    officialIntroZh: "如果你更想从 OKX 官网原生页面手动注册，下方会按帮助中心方式展示邀请码和下载流程。",
    officialIntroEn: "If you prefer the native OKX page, the guide below shows where to enter the invite code and continue downloading.",
  },
  binance: {
    name: "Binance",
    accent: "#F0B90B",
    officialSignup: "https://accounts.binance.com/register",
    officialDownload: "https://www.binance.com/download",
    officialDomain: "binance.com",
    partnerNoteZh: "这是 Binance 官方分配的合作入口，点击后会直接打开官方注册链接。",
    partnerNoteEn: "This partner link opens Binance's official registration page directly.",
    officialIntroZh: "如果你更想从 Binance 官网原生页面手动注册，下方会按步骤展示邀请码填写与下载方式。",
    officialIntroEn: "If you prefer the native Binance page, the guide below shows the manual registration flow.",
  },
  bybit: {
    name: "Bybit",
    accent: "#6EA8FF",
    officialSignup: "https://www.bybit.com/register",
    officialDownload: "https://www.bybit.com/download",
    officialDomain: "bybit.com",
    partnerNoteZh: "这是 Bybit 官方分配的合作入口，点击后会直接跳转到官方域名页面。",
    partnerNoteEn: "This partner link opens a Bybit page under the official domain.",
    officialIntroZh: "如果你更想从 Bybit 官网原生页面手动注册，下方会按帮助中心样式一步步展示。",
    officialIntroEn: "If you prefer the native Bybit flow, follow the help-center style steps below.",
  },
  bitget: {
    name: "Bitget",
    accent: "#9C6CFF",
    officialSignup: "https://www.bitget.com/account/register",
    officialDownload: "https://www.bitget.com/download",
    officialDomain: "bitget.com",
    partnerNoteZh: "这是 Bitget 官方分配的合作入口，点击后会直接进入官方域名下的注册流程。",
    partnerNoteEn: "This partner link opens the registration flow under Bitget's official domain.",
    officialIntroZh: "如果你更想从 Bitget 官网原生页面手动注册，下方会按步骤告诉你邀请码和下载入口。",
    officialIntroEn: "If you prefer the native Bitget page, the guide below shows where to enter the code and download the app.",
  },
};

function readQuery() {
  if (typeof window === "undefined") {
    return { exchange: "gate" as ExchangeSlug, mode: "partner" as FlowMode };
  }

  const params = new URLSearchParams(window.location.search);
  const rawExchange = params.get("exchange") || "gate";
  const rawMode = params.get("mode") || "partner";

  return {
    exchange: (["gate", "okx", "binance", "bybit", "bitget"].includes(rawExchange) ? rawExchange : "gate") as ExchangeSlug,
    mode: (rawMode === "official" ? "official" : "partner") as FlowMode,
  };
}

function ExchangeChip({
  active,
  accent,
  name,
  rebateRate,
  onClick,
}: {
  active: boolean;
  accent: string;
  name: string;
  rebateRate: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tap-target rounded-2xl border p-3 text-left transition sm:p-4 ${
        active ? "border-white/30 bg-white/10 shadow-[0_12px_28px_rgba(0,0,0,0.22)]" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
      }`}
    >
      <div className="mb-3 h-10 w-10 rounded-full shadow-[inset_0_0_24px_rgba(255,255,255,0.18)] sm:mb-4 sm:h-12 sm:w-12" style={{ background: `radial-gradient(circle at 30% 30%, ${accent}, rgba(255,255,255,0.12))` }} />
      <div className="text-lg font-black text-white sm:text-xl">{name}</div>
      <div className="mt-2 inline-flex rounded-full border border-[#FFD700]/40 bg-[#FFD700]/10 px-2.5 py-0.5 text-xs font-bold text-[#FFD700] sm:mt-3 sm:px-3 sm:py-1 sm:text-sm">
        默认返佣 {rebateRate}
      </div>
    </button>
  );
}

function ModeCard({
  active,
  title,
  body,
  badge,
  onClick,
}: {
  active: boolean;
  title: string;
  body: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tap-target w-full rounded-3xl border p-5 text-left transition ${
        active ? "border-[#8DB5FF] bg-[#152d4f] shadow-[0_18px_40px_rgba(0,0,0,0.24)]" : "border-white/12 bg-white/[0.03] hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xl font-black text-white">{title}</div>
          <p className="mt-3 text-sm leading-7 text-slate-300">{body}</p>
        </div>
        {badge ? (
          <span className="inline-flex rounded-full bg-[#7FB3FF] px-3 py-1 text-xs font-bold text-[#081a30]">
            {badge}
          </span>
        ) : null}
      </div>
    </button>
  );
}

function GuideImage({
  src,
  alt,
  title,
  hint,
}: {
  src?: string;
  alt: string;
  title: string;
  hint: string;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0B111B]">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="text-base font-black text-white">{title}</div>
        <div className="mt-1 text-sm text-slate-400">{hint}</div>
      </div>
      <div className="p-4">
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full rounded-2xl border border-white/10 bg-black object-contain"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#0E1725] px-6 text-center text-sm leading-7 text-slate-400">
            暂未上传这一张截图。你可以在后台补图后，这里会直接显示真实操作截图。
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExchangeDownload() {
  useScrollMemory();
  const { language } = useLanguage();
  const zh = language === "zh";
  const { getReferralLink, getInviteCode, getRebateRate, getGuideImages } = useExchangeLinks();
  const initial = readQuery();
  const [exchange, setExchange] = useState<ExchangeSlug>(initial.exchange);
  const [mode, setMode] = useState<FlowMode>(initial.mode);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.set("exchange", exchange);
    params.set("mode", mode);
    const hash = mode === "official" ? "#official-guide" : "#partner-link";
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}${hash}`);
  }, [exchange, mode]);

  const meta = EXCHANGES[exchange];
  const inviteCode = getInviteCode(exchange) || FALLBACK_INVITE;
  const rebateRate = getRebateRate(exchange);
  const partnerLink = getReferralLink(exchange);
  const guideImages = getGuideImages(exchange);

  const steps = useMemo<GuideStep[]>(() => {
    if (exchange === "gate") {
      return [
        {
          titleZh: "先在 Gate 官网首页点击注册",
          titleEn: "Open Gate homepage and tap Register",
          bodyZh: "先确认地址栏是 gate.com，然后点击右上角的“注册”，进入官网原生注册页。",
          bodyEn: "Confirm the domain is gate.com, then tap Register in the top-right corner.",
          imageTitleZh: "素材 1：Gate 官网首页",
          imageTitleEn: "Asset 1: Gate homepage",
          imageHintZh: "这一步重点看 gate.com 域名，以及右上角的“注册”按钮。",
          imageHintEn: "Focus on the official domain and the top-right Register button.",
          imageSrc: guideImages.step1 || GATE_GUIDE_DEFAULTS.step1,
          imageAltZh: "Gate 官网首页与注册入口",
          imageAltEn: "Gate homepage and register entry",
        },
        {
          titleZh: "在注册页手动填写邀请码",
          titleEn: "Enter the invite code on the registration page",
          bodyZh: "进入创建账号页面后，找到“邀请码”区域。如果系统没有自动带入，就手动填写 getitpro，然后再继续下一步。",
          bodyEn: "On the registration page, locate the invite field and enter getitpro if it is not already filled in.",
          imageTitleZh: "素材 2：邀请码填写 getitpro",
          imageTitleEn: "Asset 2: Invite code getitpro",
          imageHintZh: "这一张图重点看邀请码区域和 getitpro 的填写位置。",
          imageHintEn: "Highlight the invite field and the getitpro value.",
          imageSrc: guideImages.step2 || GATE_GUIDE_DEFAULTS.step2,
          imageAltZh: "Gate 注册页的邀请码输入区域",
          imageAltEn: "Gate registration page with invite code field",
        },
        {
          titleZh: "注册完成后从官方页面下载 App",
          titleEn: "Download the app from the official page",
          bodyZh: "账号创建完成后，回到 Gate 官方下载页，选择对应设备继续下载和安装 App。",
          bodyEn: "After registration, continue from Gate's official download page and choose the correct app package for your device.",
          imageTitleZh: "素材 3：Gate 官方下载页",
          imageTitleEn: "Asset 3: Gate official download page",
          imageHintZh: "这一张图告诉用户注册完成后，去哪里继续下载官方 App。",
          imageHintEn: "Show users where to continue for the official app download.",
          imageSrc: guideImages.step3 || GATE_GUIDE_DEFAULTS.step3,
          imageAltZh: "Gate 官方下载页",
          imageAltEn: "Gate official download page",
        },
      ];
    }

    return [
      {
        titleZh: `先打开 ${meta.name} 官网注册页`,
        titleEn: `Open ${meta.name}'s registration page`,
        bodyZh: `先确认你看到的是 ${meta.officialDomain} 官方域名，再进入注册表单。`,
        bodyEn: `Confirm the official domain ${meta.officialDomain} before continuing to the registration form.`,
        imageTitleZh: "步骤 1：官网注册页",
        imageTitleEn: "Step 1: Official registration page",
        imageHintZh: "这里会显示官方注册页截图。",
        imageHintEn: "The official registration page screenshot will appear here.",
        imageSrc: guideImages.step1 || undefined,
        imageAltZh: `${meta.name} 官方注册页`,
        imageAltEn: `${meta.name} official registration page`,
      },
      {
        titleZh: "找到邀请码位置并手动填写",
        titleEn: "Find the invite field and enter the code",
        bodyZh: `如果系统没有自动带入，请手动填写邀请码 ${inviteCode}，然后继续下一步。`,
        bodyEn: `If the field is not auto-filled, enter ${inviteCode} manually and continue.`,
        imageTitleZh: "步骤 2：填写邀请码",
        imageTitleEn: "Step 2: Enter the invite code",
        imageHintZh: "这里会显示邀请码填写位置截图。",
        imageHintEn: "The invite code field screenshot will appear here.",
        imageSrc: guideImages.step2 || undefined,
        imageAltZh: `${meta.name} 邀请码填写位置`,
        imageAltEn: `${meta.name} invite code field`,
      },
      {
        titleZh: "注册完成后回到官方下载页",
        titleEn: "Continue from the official download page",
        bodyZh: "完成注册后，再从官方下载入口继续安装 App。",
        bodyEn: "After registration, continue from the official download entry to install the app.",
        imageTitleZh: "步骤 3：官方下载入口",
        imageTitleEn: "Step 3: Official download entry",
        imageHintZh: "这里会显示官方下载页截图。",
        imageHintEn: "The official download page screenshot will appear here.",
        imageSrc: guideImages.step3 || undefined,
        imageAltZh: `${meta.name} 官方下载页`,
        imageAltEn: `${meta.name} official download page`,
      },
    ];
  }, [exchange, guideImages.step1, guideImages.step2, guideImages.step3, inviteCode, meta.name, meta.officialDomain]);

  const openOfficialGuide = () => {
    setMode("official");
    if (typeof window === "undefined") return;
    window.setTimeout(() => {
      document.getElementById("official-guide")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  };

  const openPartnerLink = () => {
    setMode("partner");
    if (typeof window !== "undefined") {
      window.open(partnerLink, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="min-h-screen bg-[#081a30] text-white">
      <SeoManager
        title={zh ? "交易所注册与下载教程 | Get8 Pro" : "Exchange registration and download guide | Get8 Pro"}
        description={
          zh
            ? "先选择交易所，再决定是直接使用官方合作链接，还是按官网原生页面一步步完成注册、填写邀请码和下载。"
            : "Choose an exchange first, then decide whether to open the official partner link directly or follow the native official tutorial step by step."
        }
        path="/exchange-download"
      />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#081a30]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <button type="button" onClick={() => goBack()} className="tap-target inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            {zh ? "返回" : "Back"}
          </button>
          <div className="text-sm font-semibold text-slate-300">{zh ? "交易所注册与下载教程" : "Exchange registration and download guide"}</div>
          <Link href="/" className="tap-target text-sm text-slate-400 transition hover:text-white">
            {zh ? "首页" : "Home"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,39,70,0.98),rgba(8,22,42,0.96))] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.28)] md:p-8">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">
              {zh ? "官方注册与下载流程" : "Official registration flow"}
            </div>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-white md:text-5xl">
              {zh ? "先选交易所，再决定走哪条注册路径" : "Choose the exchange, then decide the registration path"}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              {zh
                ? "如果你希望最快完成注册，可以直接打开我们的官方合作链接；如果你更想从官网原生页面手动操作，我们会像帮助中心一样一步步告诉你怎么点、怎么填邀请码、最后去哪里下载。"
                : "If you want the fastest path, open the official partner link directly. If you prefer the native official flow, follow the help-center style tutorial with screenshots."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                <Shield className="h-4 w-4 text-emerald-300" />
                {zh ? "合作链接仍在官方域名体系内" : "Partner links stay inside official domains"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-300" />
                {zh ? "官网注册路径会展示图文步骤" : "Manual path shows image-by-image steps"}
              </span>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-slate-400">{zh ? "第一步" : "Step 1"}</div>
          <div className="text-3xl font-black text-white">{zh ? "选择交易所" : "Choose the exchange"}</div>
          <p className="mt-3 max-w-3xl text-base leading-8 text-slate-300">
            {zh ? "先选定你要注册的平台。选完后，下面会直接切换成该交易所对应的注册链接和手动教程。" : "Pick the exchange first. The sections below will switch to that platform's direct link and manual guide."}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
            {(Object.keys(EXCHANGES) as ExchangeSlug[]).map((slug) => (
              <ExchangeChip
                key={slug}
                active={exchange === slug}
                accent={EXCHANGES[slug].accent}
                name={EXCHANGES[slug].name}
                rebateRate={getRebateRate(slug)}
                onClick={() => setExchange(slug)}
              />
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-slate-400">{zh ? "第二步" : "Step 2"}</div>
          <div className="text-3xl font-black text-white">{zh ? "选择注册路径" : "Choose the registration path"}</div>
          <p className="mt-3 max-w-3xl text-base leading-8 text-slate-300">
            {zh ? "如果你想直接完成注册，点击官方合作链接即可；如果你更想自己从官网一步步操作，就看下方的图文教程。" : "Use the partner link for the fastest route, or choose the native official path if you prefer to register manually step by step."}
          </p>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_1.1fr]">
            <ModeCard
              active={mode === "partner"}
              title={zh ? "使用我们的官方合作链接" : "Use our official partner link"}
              body={zh ? meta.partnerNoteZh : meta.partnerNoteEn}
              badge={zh ? "直接打开" : "Direct open"}
              onClick={openPartnerLink}
            />
            <ModeCard
              active={mode === "official"}
              title={zh ? "从官网原生页面手动注册" : "Register from the native official page"}
              body={zh ? meta.officialIntroZh : meta.officialIntroEn}
              badge={zh ? "看教程" : "Show guide"}
              onClick={openOfficialGuide}
            />
          </div>
        </section>

        <section id="partner-link" className="mt-8 rounded-[30px] border border-emerald-400/18 bg-[linear-gradient(135deg,rgba(7,33,34,0.95),rgba(8,26,48,0.96))] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.2)] md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-emerald-200">
                <Shield className="h-3.5 w-3.5" />
                {zh ? "官方合作链接" : "Official partner link"}
              </div>
              <h2 className="mt-4 text-2xl font-black text-white md:text-3xl">
                {zh ? `想省步骤的话，直接打开 ${meta.name} 的合作链接` : `Open ${meta.name}'s partner link directly`}
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-300">
                {zh ? meta.partnerNoteZh : meta.partnerNoteEn}
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-slate-200">
                  <Globe className="h-4 w-4 text-cyan-300" />
                  {zh ? `官方域名：${meta.officialDomain}` : `Official domain: ${meta.officialDomain}`}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  {zh ? "点击后直接进入注册，不需要再看三步教程" : "No step-by-step tutorial needed on this path"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={openPartnerLink}
              className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#3BA0FF] to-[#7B6CFF] px-6 py-4 text-base font-black text-white shadow-[0_18px_40px_rgba(50,110,255,0.28)] transition hover:translate-y-[-1px]"
            >
              {zh ? "立即打开官方合作注册链接" : "Open the official partner link"}
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </section>

        {mode === "official" ? (
          <section id="official-guide" className="mt-10 overflow-hidden rounded-[34px] border border-white/10 bg-[#05080F] shadow-[0_28px_70px_rgba(0,0,0,0.34)]">
            <div className="border-b border-white/10 bg-[#070B13] px-6 py-6 md:px-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-slate-300">
                {zh ? "官网手动路径" : "Official manual path"}
              </div>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                <div className="max-w-3xl">
                  <h2 className="text-2xl font-black text-white md:text-3xl">
                    {zh ? `${meta.name} 官网注册图文教程` : `${meta.name} official registration guide`}
                  </h2>
                  <p className="mt-3 text-base leading-8 text-slate-300">
                    {zh ? meta.officialIntroZh : meta.officialIntroEn}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#FFD700]/25 bg-[#FFD700]/10 px-4 py-3 text-sm font-bold text-[#FFD700]">
                  {zh ? `邀请码：${inviteCode}` : `Invite code: ${inviteCode}`}
                </div>
              </div>
            </div>

            <div className="px-6 py-6 md:px-8 md:py-8">
              <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
                {steps.map((step, index) => (
                  <div key={`${exchange}-${index}`} className="contents">
                    <div className="relative rounded-[28px] border border-white/10 bg-[#081626] p-6">
                      <div className="absolute left-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/35 bg-emerald-400/10 text-sm font-black text-emerald-300">
                        {index + 1}
                      </div>
                      {index < steps.length - 1 ? <div className="absolute left-[43px] top-16 hidden h-[calc(100%+28px)] w-px bg-white/10 lg:block" /> : null}
                      <div className="pl-14">
                        <div className="text-2xl font-black text-white">{zh ? step.titleZh : step.titleEn}</div>
                        <p className="mt-4 text-base leading-8 text-slate-300">{zh ? step.bodyZh : step.bodyEn}</p>
                        <div className="mt-5 space-y-3 text-sm text-slate-300">
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                            <span>{zh ? `当前邀请码：${inviteCode}` : `Current invite code: ${inviteCode}`}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                            <span>{zh ? "按截图位置逐步操作，不需要来回翻找。" : "Follow the screenshot one step at a time without scrolling back and forth."}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <GuideImage
                      src={step.imageSrc}
                      alt={zh ? step.imageAltZh || step.titleZh : step.imageAltEn || step.titleEn}
                      title={zh ? step.imageTitleZh : step.imageTitleEn}
                      hint={zh ? step.imageHintZh : step.imageHintEn}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <ScrollToTopButton color="cyan" />
    </div>
  );
}
