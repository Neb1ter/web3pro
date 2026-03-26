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

      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <section className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_32%),linear-gradient(180deg,rgba(9,18,32,0.96),rgba(5,10,20,0.98))] px-6 py-8 sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 px-3 py-1 text-xs font-semibold text-slate-300">
              <Shield className="h-4 w-4 text-cyan-300" />
              <span>{zh ? "\u4e00\u9875\u5b8c\u6210\u4ea4\u6613\u6240\u9009\u62e9\u3001\u6ce8\u518c\u548c\u4e0b\u8f7d" : "Choose the exchange, register, and download in one page"}</span>
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
              {zh ? "\u5b98\u7f51\u6ce8\u518c\u4e0e\u4e0b\u8f7d\u6559\u7a0b" : "Official registration and download tutorial"}
            </h1>
            <p className="mt-4 text-base leading-8 text-slate-300 sm:text-lg">
              {zh
                ? "\u5148\u9009\u4ea4\u6613\u6240\uff0c\u518d\u9009\u4f60\u60f3\u8d70\u7684\u6ce8\u518c\u8def\u5f84\u3002\u5982\u679c\u60f3\u76f4\u63a5\u8d70\u6211\u4eec\u63d0\u4f9b\u7684\u5b98\u65b9\u5408\u4f5c\u94fe\u63a5\uff0c\u53ef\u4ee5\u9009\u62e9\u5408\u4f5c\u8def\u5f84\uff1b\u5982\u679c\u53ea\u60f3\u4ece\u5b98\u7f51\u539f\u751f\u9875\u9762\u6ce8\u518c\uff0c\u5219\u9009\u62e9\u5b98\u7f51\u624b\u52a8\u8def\u5f84\u3002"
                : "Choose an exchange first, then decide whether you want to use the official partner link we provide or the exchange's native registration page with manual code entry."}
            </p>
          </div>
        </section>

        <section className="pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{zh ? "\u7b2c\u4e00\u6b65" : "Step 1"}</p>
          <h2 className="mt-2 text-2xl font-black text-white">{zh ? "\u9009\u62e9\u4ea4\u6613\u6240" : "Choose the exchange"}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {(Object.keys(EXCHANGES) as ExchangeSlug[]).map((slug) => {
              const item = EXCHANGES[slug];
              const active = slug === exchange;
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => setExchange(slug)}
                  className={`tap-target rounded-[26px] border p-5 text-left transition ${active ? "border-white/40 bg-white/[0.08]" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"}`}
                >
                  <div className="h-10 w-10 rounded-full" style={{ background: `radial-gradient(circle at 30% 30%, ${item.accent}, rgba(255,255,255,0.08))` }} />
                  <h3 className="mt-6 text-xl font-black text-white">{item.name}</h3>
                  <div className="mt-3 inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-300">
                    {zh ? `\u9ed8\u8ba4\u8fd4\u4f63 ${rebateRate}` : `Default rebate ${rebateRate}`}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section id="registration-guide" className="pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{zh ? "\u7b2c\u4e8c\u6b65" : "Step 2"}</p>
          <h2 className="mt-2 text-2xl font-black text-white">{zh ? "\u9009\u62e9\u6ce8\u518c\u8def\u5f84" : "Choose the registration path"}</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {([
              { key: "partner", titleZh: "\u4f7f\u7528\u6211\u4eec\u63d0\u4f9b\u7684\u5b98\u65b9\u5408\u4f5c\u94fe\u63a5", titleEn: "Use the official partner link we provide" },
              { key: "official", titleZh: "\u4ece\u5b98\u7f51\u539f\u751f\u9875\u9762\u6ce8\u518c", titleEn: "Use the native official registration page" },
            ] as const).map((item) => {
              const active = item.key === mode;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setMode(item.key)}
                  className={`tap-target rounded-[28px] border p-6 text-left transition ${active ? "border-white/40 bg-white/[0.08]" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"}`}
                >
                  <p className="text-sm font-black text-white">{zh ? item.titleZh : item.titleEn}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {zh
                      ? mode === item.key && item.key === "partner"
                        ? "\u9002\u5408\u60f3\u76f4\u63a5\u4f7f\u7528\u6211\u4eec\u63d0\u4f9b\u7684\u5b98\u65b9\u5408\u4f5c\u94fe\u63a5\u8fdb\u5165\u6ce8\u518c\u9875\u7684\u7528\u6237\u3002"
                        : item.key === "partner"
                          ? "\u8fd9\u6761\u8def\u5f84\u4f1a\u4f18\u5148\u4f7f\u7528\u6211\u4eec\u63d0\u4f9b\u7684\u5b98\u65b9\u5408\u4f5c\u94fe\u63a5\u3002"
                          : "\u8fd9\u6761\u8def\u5f84\u4f1a\u76f4\u63a5\u6253\u5f00\u4ea4\u6613\u6240\u5b98\u7f51\u539f\u751f\u6ce8\u518c\u9875\u3002"
                      : item.key === "partner"
                        ? "This path uses the official partner sign-up link we provide."
                        : "This path opens the exchange's native official registration page."}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-8 pt-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{zh ? "\u7b2c\u4e09\u6b65" : "Step 3"}</p>
                <h2 className="mt-2 text-2xl font-black text-white">{zh ? "\u8ddf\u7740\u6b65\u9aa4\u5b8c\u6210\u6ce8\u518c\u4e0e\u4e0b\u8f7d" : "Follow the steps to register and download"}</h2>
              </div>
              <span className="rounded-full px-3 py-1 text-xs font-bold text-black" style={{ background: meta.accent }}>
                {meta.name}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {steps.map((step, index) => (
                <div key={step} className="flex items-start gap-4 rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-black" style={{ background: meta.accent }}>
                    {index + 1}
                  </div>
                  <p className="text-sm leading-7 text-slate-200">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-4 text-sm leading-7 text-amber-100">
              {zh ? `\u5982\u679c\u7cfb\u7edf\u6ca1\u6709\u81ea\u52a8\u5e26\u5165\uff0c\u8bf7\u624b\u52a8\u586b\u5199\u9080\u8bf7\u7801 ${inviteCode}\u3002` : `If the code is not prefilled, enter ${inviteCode} manually.`}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={primaryHref}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black text-black transition hover:scale-[1.01]"
                style={{ background: meta.accent }}
              >
                {primaryLabel}
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href={meta.officialDownload}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {zh ? "\u524d\u5f80\u5b98\u65b9\u4e0b\u8f7d\u9875" : "Open official download page"}
                <Download className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-black/20 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{zh ? "\u9080\u8bf7\u7801" : "Referral code"}</p>
              <h2 className="mt-3 text-3xl font-black text-white">{inviteCode}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {zh
                  ? "\u5982\u679c\u4f60\u8d70\u5408\u4f5c\u94fe\u63a5\uff0c\u9080\u8bf7\u7801\u5927\u591a\u4f1a\u81ea\u52a8\u5e26\u5165\u3002\u5982\u679c\u4f60\u8d70\u5b98\u7f51\u539f\u751f\u5165\u53e3\uff0c\u8bf7\u5728 Referral code \u6216 Invite code \u680f\u624b\u52a8\u586b\u5199\u3002"
                  : "If you use the partner link, the code is usually prefilled. If you use the native official page, enter it manually in the referral field."}
              </p>
            </div>

            <div className="rounded-[28px] border border-dashed border-white/15 bg-black/20 p-6">
              <div className="flex items-center gap-3 text-slate-300">
                <ImagePlus className="h-5 w-5" />
                <p className="text-sm font-semibold">{zh ? "\u5b98\u7f51\u622a\u56fe\u9884\u7559\u533a" : "Reserved area for official screenshots"}</p>
              </div>
              <div className="mt-5 grid gap-4">
                {[
                  zh ? "\u6ce8\u518c\u5165\u53e3\u9875" : "Registration entry page",
                  zh ? "\u9080\u8bf7\u7801\u586b\u5199\u4f4d\u7f6e" : "Referral field location",
                  zh ? "\u5b98\u65b9\u4e0b\u8f7d\u5165\u53e3" : "Official download entry",
                ].map((title) => (
                  <div key={title} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                    <h3 className="text-base font-black text-white">{title}</h3>
                    <div className="mt-4 flex h-28 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 text-center text-sm leading-7 text-slate-500">
                      {zh ? "\u8fd9\u91cc\u53ef\u4ee5\u653e\u5b98\u7f51\u622a\u56fe\uff0c\u5e2e\u52a9\u7528\u6237\u5bf9\u7167\u6bcf\u4e00\u6b65\u64cd\u4f5c" : "Place the official screenshot here so users can follow each step visually"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{zh ? "\u5e38\u89c1\u5361\u70b9" : "Common blockers"}</p>
          <h2 className="mt-2 text-2xl font-black text-white">{zh ? "\u5148\u628a\u6700\u5bb9\u6613\u51fa\u9519\u7684\u5730\u65b9\u8bb2\u6e05\u695a" : "Call out the most common blockers first"}</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {(zh ? meta.blockerZh : meta.blockerEn).map((item) => (
              <div key={item} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <CheckCircle2 className="h-5 w-5" style={{ color: meta.accent }} />
                <p className="mt-4 text-sm leading-7 text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <ScrollToTopButton color="cyan" />
    </div>
  );
}
