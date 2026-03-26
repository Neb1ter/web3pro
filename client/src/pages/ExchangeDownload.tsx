import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, Download, ExternalLink, ImagePlus, Shield } from "lucide-react";
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
  blockerZh: string[];
  blockerEn: string[];
};

const FALLBACK_INVITE = "getitpro";

const EXCHANGES: Record<ExchangeSlug, ExchangeMeta> = {
  gate: {
    name: "Gate.io",
    accent: "#00B173",
    officialSignup: "https://www.gate.com/signup",
    officialDownload: "https://www.gate.com/mobileapp",
    blockerZh: [
      "\u8bf7\u5148\u786e\u8ba4\u4f60\u6253\u5f00\u7684\u662f Gate \u5b98\u65b9\u57df\u540d\u3002",
      "\u63d0\u4ea4\u524d\u518d\u68c0\u67e5\u4e00\u904d Referral code \u662f\u5426\u5df2\u5e26\u5165\u3002",
      "\u5f00\u59cb KYC \u524d\u5148\u51c6\u5907\u8bc1\u4ef6\u548c\u7a33\u5b9a\u5149\u7ebf\u3002",
    ],
    blockerEn: [
      "Confirm that you are on Gate's official domain first.",
      "Double-check the referral field before you submit the form.",
      "Prepare your ID and stable lighting before starting KYC.",
    ],
  },
  okx: {
    name: "OKX",
    accent: "#7EA7FF",
    officialSignup: "https://www.okx.com/account/register",
    officialDownload: "https://www.okx.com/download",
    blockerZh: [
      "\u90e8\u5206\u5730\u533a\u7684 App Store \u5165\u53e3\u53d7\u9650\uff0c\u4f18\u5148\u53c2\u8003 OKX \u5b98\u7f51\u4e0b\u8f7d\u9875\u3002",
      "\u9080\u8bf7\u7801\u4e00\u822c\u4e0d\u80fd\u5728\u6ce8\u518c\u540e\u8865\u586b\u3002",
      "\u5982\u679c\u5207\u5230 App \u5185\u7ee7\u7eed\u6ce8\u518c\uff0c\u8bf7\u91cd\u65b0\u68c0\u67e5 Referral code\u3002",
    ],
    blockerEn: [
      "In some regions the App Store entry is limited, so use the official OKX download page first.",
      "The referral code usually cannot be added after registration.",
      "If you continue in the app, re-check the referral code there.",
    ],
  },
  binance: {
    name: "Binance",
    accent: "#F0B90B",
    officialSignup: "https://accounts.binance.com/register",
    officialDownload: "https://www.binance.com/download",
    blockerZh: [
      "\u4e0d\u8981\u4ece\u5e7f\u544a\u9875\u6216\u77ed\u94fe\u5165\u53e3\u8df3\u8f6c\uff0c\u907f\u514d\u4e22\u6389\u9080\u8bf7\u7801\u3002",
      "\u9080\u8bf7\u7801\u680f\u6709\u65f6\u9ed8\u8ba4\u6298\u53e0\uff0c\u63d0\u4ea4\u524d\u9700\u8981\u624b\u52a8\u5c55\u5f00\u786e\u8ba4\u3002",
      "\u90e8\u5206\u5730\u533a\u4e0b\u8f7d\u5165\u53e3\u53d7\u9650\uff0c\u4ee5\u5b98\u7f51\u8bf4\u660e\u4e3a\u51c6\u3002",
    ],
    blockerEn: [
      "Avoid ad pages or short links so the referral context is not lost.",
      "The referral field may be collapsed by default.",
      "In some regions, app access is limited and the official page should be treated as the source of truth.",
    ],
  },
  bybit: {
    name: "Bybit",
    accent: "#6EA8FF",
    officialSignup: "https://www.bybit.com/register",
    officialDownload: "https://www.bybit.com/download",
    blockerZh: [
      "\u6ce8\u518c\u5b8c\u6210\u540e\u901a\u5e38\u4e0d\u80fd\u8865\u5f55\u9080\u8bf7\u7801\uff0c\u6240\u4ee5\u521b\u5efa\u8d26\u6237\u524d\u8981\u5148\u68c0\u67e5\u3002",
      "\u5982\u679c\u5148\u5728 App \u5185\u7ee7\u7eed\u6ce8\u518c\uff0c\u8bf7\u518d\u786e\u8ba4\u4e00\u6b21\u9080\u8bf7\u7801\u3002",
      "\u4e0b\u8f7d\u524d\u8bf7\u6838\u5bf9\u5b98\u65b9\u56fe\u6807\u548c\u5f00\u53d1\u8005\u4fe1\u606f\u3002",
    ],
    blockerEn: [
      "The code usually cannot be added after registration, so verify it before creating the account.",
      "If you continue in the app, re-check the referral field there too.",
      "Verify the official icon and developer information before downloading.",
    ],
  },
  bitget: {
    name: "Bitget",
    accent: "#9C6CFF",
    officialSignup: "https://www.bitget.com/account/register",
    officialDownload: "https://www.bitget.com/download",
    blockerZh: [
      "\u4e0d\u8981\u4ece\u6765\u8def\u4e0d\u660e\u7684\u955c\u50cf\u7ad9\u4e0b\u8f7d\u3002",
      "\u6d4f\u89c8\u5668\u81ea\u52a8\u7ffb\u8bd1\u65f6\uff0c\u8bf7\u5148\u786e\u8ba4 Invite code \u6216 Referral code \u5b57\u6bb5\u4f4d\u7f6e\u6ca1\u53d8\u3002",
      "\u65e7\u8d26\u6237\u901a\u5e38\u65e0\u6cd5\u8865\u5f55\u9080\u8bf7\u7801\uff0c\u9996\u6b21\u6ce8\u518c\u9700\u8981\u68c0\u67e5\u6e05\u695a\u3002",
    ],
    blockerEn: [
      "Do not download from unofficial mirrors.",
      "If the browser auto-translates the page, verify the referral field position first.",
      "Existing accounts usually cannot add the code later, so check carefully on first registration.",
    ],
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

export default function ExchangeDownload() {
  useScrollMemory();
  const { language } = useLanguage();
  const zh = language === "zh";
  const { getReferralLink, getInviteCode, getRebateRate } = useExchangeLinks();
  const initial = readQuery();
  const [exchange, setExchange] = useState<ExchangeSlug>(initial.exchange);
  const [mode, setMode] = useState<FlowMode>(initial.mode);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.set("exchange", exchange);
    params.set("mode", mode);
    const hash = window.location.hash || "#registration-guide";
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}${hash}`);
  }, [exchange, mode]);

  const meta = EXCHANGES[exchange];
  const inviteCode = getInviteCode(exchange) || FALLBACK_INVITE;
  const rebateRate = getRebateRate(exchange);
  const partnerLink = getReferralLink(exchange);
  const primaryHref = mode === "partner" ? partnerLink : meta.officialSignup;
  const primaryLabel =
    zh
      ? mode === "partner"
        ? "\u524d\u5f80\u5b98\u65b9\u5408\u4f5c\u94fe\u63a5"
        : "\u524d\u5f80\u5b98\u7f51\u6ce8\u518c\u94fe\u63a5"
      : mode === "partner"
        ? "Open official partner sign-up link"
        : "Open official registration link";

  const steps = useMemo(
    () =>
      zh
        ? mode === "partner"
          ? [
              `\u70b9\u51fb ${meta.name} \u7684\u5b98\u65b9\u5408\u4f5c\u94fe\u63a5\uff0c\u5148\u786e\u8ba4\u5f53\u524d\u9875\u9762\u5c5e\u4e8e\u4ea4\u6613\u6240\u5b98\u65b9\u57df\u540d\u3002`,
              "\u5728\u6ce8\u518c\u8868\u5355\u91cc\u5148\u68c0\u67e5 Referral code / Invite code \u680f\u4f4d\u3002",
              `\u5982\u679c\u7cfb\u7edf\u6ca1\u6709\u81ea\u52a8\u5e26\u5165\uff0c\u624b\u52a8\u586b\u5199 ${inviteCode}\u3002`,
              "\u5b8c\u6210\u6ce8\u518c\u540e\uff0c\u518d\u4ece\u5b98\u65b9\u4e0b\u8f7d\u9875\u5b89\u88c5 App \u6216\u684c\u9762\u7aef\u3002",
            ]
          : [
              `\u70b9\u51fb ${meta.name} \u7684\u5b98\u7f51\u6ce8\u518c\u94fe\u63a5\uff0c\u76f4\u63a5\u8fdb\u5165\u539f\u751f\u6ce8\u518c\u5165\u53e3\u3002`,
              "\u586b\u5199\u90ae\u7bb1\u6216\u624b\u673a\u53f7\u540e\uff0c\u5c55\u5f00 Referral code / Invite code \u533a\u57df\u3002",
              `\u624b\u52a8\u586b\u5199 ${inviteCode}\uff0c\u518d\u7ee7\u7eed\u9a8c\u8bc1\u7801\u548c KYC \u6d41\u7a0b\u3002`,
              "\u5b8c\u6210\u6ce8\u518c\u540e\uff0c\u518d\u4ece\u4e0b\u65b9\u5b98\u65b9\u4e0b\u8f7d\u9875\u8fdb\u5165\u5bf9\u5e94\u5e94\u7528\u3002",
            ]
        : mode === "partner"
          ? [
              `Open the official partner sign-up link for ${meta.name} and confirm the page belongs to the exchange's official domain.`,
              "Check the Referral code or Invite code field before submitting the form.",
              `If the code is not prefilled, enter ${inviteCode} manually.`,
              "Finish registration first, then install the app from the official download page.",
            ]
          : [
              `Open ${meta.name}'s native official registration page directly.`,
              "After entering your email or phone number, expand the referral field.",
              `Enter ${inviteCode} manually, then continue with verification and KYC.`,
              "Complete registration first, then download the app from the official page.",
            ],
    [inviteCode, meta.name, mode, zh],
  );

  const pathCards = [
    {
      key: "partner" as const,
      title: zh ? "\u4f7f\u7528\u6211\u4eec\u63d0\u4f9b\u7684\u5b98\u65b9\u5408\u4f5c\u94fe\u63a5" : "Use the official partner link we provide",
      body: zh
        ? "\u9002\u5408\u60f3\u76f4\u63a5\u8fdb\u5165\u5e26\u9080\u8bf7\u4fe1\u606f\u7684\u5b98\u65b9\u6ce8\u518c\u9875\u3002"
        : "Best when you want the official sign-up page with referral context already attached.",
    },
    {
      key: "official" as const,
      title: zh ? "\u4ece\u5b98\u7f51\u539f\u751f\u9875\u9762\u6ce8\u518c" : "Use the native official registration page",
      body: zh
        ? "\u9002\u5408\u60f3\u5148\u8d70\u5b98\u7f51\u539f\u751f\u6ce8\u518c\u9875\uff0c\u518d\u624b\u52a8\u586b\u9080\u8bf7\u7801\u7684\u7528\u6237\u3002"
        : "Best when you prefer the exchange's native sign-up page and want to enter the code manually.",
    },
  ];

  const screenshotTitles = zh
    ? ["\u6ce8\u518c\u5165\u53e3\u9875", "\u9080\u8bf7\u7801\u586b\u5199\u4f4d\u7f6e", "\u5b98\u65b9\u4e0b\u8f7d\u5165\u53e3"]
    : ["Registration entry", "Referral field", "Official download page"];

  return (
    <div className="min-h-screen bg-[#081a30] text-white">
      <SeoManager
        title={zh ? "\u4ea4\u6613\u6240\u6ce8\u518c\u4e0e\u4e0b\u8f7d\u6559\u7a0b | Get8 Pro" : "Exchange registration and download guide | Get8 Pro"}
        description={
          zh
            ? "\u5728\u4e00\u4e2a\u9875\u9762\u5b8c\u6210\u4ea4\u6613\u6240\u9009\u62e9\u3001\u6ce8\u518c\u8def\u5f84\u9009\u62e9\u3001\u9080\u8bf7\u7801\u586b\u5199\u4e0e\u5b98\u65b9\u4e0b\u8f7d\u6559\u7a0b\u3002"
            : "Choose an exchange, select a registration path, confirm the invite code, and follow the official download tutorial in one place."
        }
        path="/exchange-download"
      />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#081a30]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <button type="button" onClick={() => goBack()} className="tap-target inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            {zh ? "\u8fd4\u56de" : "Back"}
          </button>
          <div className="text-sm font-semibold text-slate-300">
            {zh ? "\u4ea4\u6613\u6240\u6ce8\u518c\u4e0e\u4e0b\u8f7d\u6559\u7a0b" : "Exchange registration and download guide"}
          </div>
          <Link href="/" className="tap-target text-sm text-slate-400 transition hover:text-white">
            {zh ? "\u9996\u9875" : "Home"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-5 sm:py-8">
        <section className="rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_30%),linear-gradient(180deg,rgba(9,18,32,0.96),rgba(5,10,20,0.98))] px-5 py-5 sm:px-7 sm:py-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 px-3 py-1 text-[11px] font-semibold text-slate-300">
            <Shield className="h-4 w-4 text-cyan-300" />
            <span>{zh ? "\u628a\u9009\u62e9\u3001\u6ce8\u518c\u548c\u4e0b\u8f7d\u653e\u5230\u4e00\u6761\u8def\u5f84\u91cc" : "Keep choosing, signing up, and downloading in one flow"}</span>
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
            {zh ? "\u4ea4\u6613\u6240\u5b98\u7f51\u6ce8\u518c\u4e0e\u4e0b\u8f7d\u6559\u7a0b" : "Official exchange registration and download guide"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            {zh
              ? "\u79fb\u52a8\u7aef\u5148\u505a\u4e24\u4e2a\u51b3\u5b9a\u5c31\u591f\uff1a\u9009\u4ea4\u6613\u6240\uff0c\u9009\u8def\u5f84\u3002\u4e0b\u9762\u7684\u6b65\u9aa4\u3001\u9080\u8bf7\u7801\u548c\u4e0b\u8f7d\u5165\u53e3\u4f1a\u8ddf\u7740\u4f60\u5f53\u524d\u7684\u9009\u62e9\u4e00\u8d77\u66f4\u65b0\u3002"
              : "On mobile, you only need to decide two things first: which exchange and which path. The steps, code, and download links below will update together."}
          </p>
        </section>

        <section id="registration-guide" className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{zh ? "\u7b2c\u4e00\u6b65" : "Step 1"}</p>
              <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">{zh ? "\u5148\u9009\u4ea4\u6613\u6240" : "Choose the exchange first"}</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {(Object.keys(EXCHANGES) as ExchangeSlug[]).map((slug) => {
                  const item = EXCHANGES[slug];
                  const active = slug === exchange;
                  return (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => setExchange(slug)}
                      className={`tap-target rounded-[20px] border px-4 py-4 text-left transition ${active ? "border-white/40 bg-white/[0.09] shadow-[0_12px_36px_rgba(15,23,42,0.22)]" : "border-white/10 bg-black/15 hover:bg-white/[0.05]"}`}
                    >
                      <div className="h-8 w-8 rounded-full" style={{ background: `radial-gradient(circle at 30% 30%, ${item.accent}, rgba(255,255,255,0.08))` }} />
                      <h3 className="mt-4 text-[1.15rem] font-black leading-none text-white">{item.name}</h3>
                      <div className="mt-3 inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2.5 py-1 text-[10px] font-bold text-yellow-300">
                        {zh ? `\u9ed8\u8ba4\u8fd4\u4f63 ${rebateRate}` : `Default rebate ${rebateRate}`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{zh ? "\u7b2c\u4e8c\u6b65" : "Step 2"}</p>
              <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">{zh ? "\u518d\u9009\u6ce8\u518c\u8def\u5f84" : "Then choose the registration path"}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {pathCards.map((item) => {
                  const active = item.key === mode;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setMode(item.key)}
                      className={`tap-target rounded-[20px] border px-4 py-4 text-left transition ${active ? "border-white/40 bg-white/[0.09]" : "border-white/10 bg-black/15 hover:bg-white/[0.05]"}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-black text-white">{item.title}</p>
                          <p className="mt-2 text-[13px] leading-6 text-slate-300">{item.body}</p>
                        </div>
                        {active ? (
                          <span className="mt-1 shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold text-black" style={{ background: meta.accent }}>
                            {zh ? "\u5f53\u524d\u8def\u5f84" : "Current"}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.15))] p-4 sm:p-6">
          <div className="flex flex-col gap-4 rounded-[22px] border border-white/10 bg-black/20 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-slate-200">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.accent }} />
                {meta.name}
              </div>
              <div className="inline-flex rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-200">
                {mode === "partner"
                  ? zh
                    ? "\u5b98\u65b9\u5408\u4f5c\u8def\u5f84"
                    : "Official partner path"
                  : zh
                    ? "\u5b98\u7f51\u624b\u52a8\u8def\u5f84"
                    : "Official manual path"}
              </div>
              <div className="inline-flex rounded-full border border-yellow-400/25 bg-yellow-400/10 px-3 py-1.5 text-xs font-semibold text-yellow-200">
                {zh ? `\u9080\u8bf7\u7801 ${inviteCode}` : `Code ${inviteCode}`}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href={primaryHref}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black text-black transition hover:scale-[1.01]"
                style={{ background: meta.accent }}
              >
                {primaryLabel}
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href={meta.officialDownload}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {zh ? "\u524d\u5f80\u5b98\u65b9\u4e0b\u8f7d\u9875" : "Open official download page"}
                <Download className="h-4 w-4" />
              </a>
            </div>

            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-4 text-sm leading-7 text-amber-100">
              {zh
                ? mode === "partner"
                  ? `\u5982\u679c\u94fe\u63a5\u8df3\u8f6c\u540e\u6ca1\u6709\u81ea\u52a8\u5e26\u5165\uff0c\u8bf7\u624b\u52a8\u586b\u5199 ${inviteCode}\u3002`
                  : `\u8d70\u5b98\u7f51\u624b\u52a8\u8def\u5f84\u65f6\uff0c\u8bf7\u5728 Referral code \u6216 Invite code \u680f\u586b\u5199 ${inviteCode}\u3002`
                : mode === "partner"
                  ? `If the partner page does not prefill the code, enter ${inviteCode} manually.`
                  : `On the official manual path, enter ${inviteCode} in the referral field.`}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{zh ? "\u7b2c\u4e09\u6b65" : "Step 3"}</p>
              <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">{zh ? "\u6309\u8fd9\u4e2a\u987a\u5e8f\u5b8c\u6210" : "Follow this order"}</h2>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step} className="flex items-start gap-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black text-black" style={{ background: meta.accent }}>
                    {index + 1}
                  </div>
                  <p className="pt-0.5 text-sm leading-7 text-slate-200">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{zh ? "\u6559\u7a0b\u7d20\u6750" : "Tutorial assets"}</p>
              <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">{zh ? "\u7559\u7ed9\u5b98\u7f51\u622a\u56fe\u7684\u4f4d\u7f6e" : "Reserved places for official screenshots"}</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {screenshotTitles.map((title, index) => (
                <div key={title} className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-4">
                  <div className="flex items-center gap-3 text-slate-200">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-xs font-black text-white">
                      {index + 1}
                    </div>
                    <h3 className="text-sm font-black text-white">{title}</h3>
                  </div>
                  <div className="mt-3 flex items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-slate-400">
                    <ImagePlus className="h-4 w-4 shrink-0" />
                    <span>{zh ? "\u8fd9\u91cc\u53ef\u4ee5\u653e\u5b98\u7f51\u622a\u56fe\uff0c\u8ba9\u7528\u6237\u4e0d\u7528\u5728\u4e0a\u4e0b\u5185\u5bb9\u4e4b\u95f4\u6765\u56de\u5bf9\u7167\u3002" : "Place an official screenshot here so users can confirm the step visually without scrolling back."}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{zh ? "\u5e38\u89c1\u5361\u70b9" : "Common blockers"}</p>
              <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">{zh ? "\u6700\u597d\u5148\u770b\u8fd9\u4e09\u6761" : "Read these three notes first"}</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {(zh ? meta.blockerZh : meta.blockerEn).map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: meta.accent }} />
                  <p className="text-sm leading-7 text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <ScrollToTopButton color="cyan" />
    </div>
  );
}
