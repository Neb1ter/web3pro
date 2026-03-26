import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  ImagePlus,
  Lock,
  Shield,
  Smartphone,
} from "lucide-react";
import { SeoManager } from "@/components/SeoManager";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { useExchangeLinks } from "@/contexts/ExchangeLinksContext";
import { goBack, useScrollMemory } from "@/hooks/useScrollMemory";

type ExchangeSlug = "gate" | "okx" | "binance" | "bybit" | "bitget";
type FlowMode = "partner" | "official";

type StepSet = {
  zh: string[];
  en: string[];
};

type TutorialData = {
  slug: ExchangeSlug;
  name: string;
  nameEn: string;
  emoji: string;
  accent: string;
  rebate: string;
  officialSignup: string;
  officialDownload: string;
  appStore?: string;
  partnerSummary: { zh: string; en: string };
  officialSummary: { zh: string; en: string };
  partnerSteps: StepSet;
  officialSteps: StepSet;
  blockers: StepSet;
};

const GUIDE_DATA: Record<ExchangeSlug, TutorialData> = {
  gate: {
    slug: "gate",
    name: "Gate.io",
    nameEn: "Gate.io",
    emoji: "🟢",
    accent: "#00B173",
    rebate: "60%",
    officialSignup: "https://www.gate.com/signup",
    officialDownload: "https://www.gate.com/mobileapp",
    appStore: "https://apps.apple.com/app/gate-io/id1294998195",
    partnerSummary: {
      zh: "适合想直接从我们提供的官方合作链接完成注册的用户，邀请码通常会自动带入。",
      en: "Best for users who want to register through the official partner link we provide. The referral code is usually prefilled.",
    },
    officialSummary: {
      zh: "适合只想从官网原生注册入口进入的用户，进入后手动填写邀请码 getitpro 即可。",
      en: "Best for users who prefer the native official sign-up page and want to enter getitpro manually.",
    },
    partnerSteps: {
      zh: [
        "点击“官方合作注册链接”，确认地址属于 Gate 官方域名。",
        "进入注册页后先看邀请码栏，通常会自动带入 getitpro。",
        "如果邀请码没有自动出现，再手动填写 getitpro，然后继续完成注册与 KYC。",
        "注册完成后再去下载 App，并核对账户权益是否正常显示。",
      ],
      en: [
        "Open the official partner sign-up link and confirm the page belongs to Gate's official domain.",
        "Check the referral field first. getitpro is usually prefilled.",
        "If the code is missing, enter getitpro manually before finishing registration and KYC.",
        "Download the app after the account is created and verify the expected benefits.",
      ],
    },
    officialSteps: {
      zh: [
        "点击“官网注册链接”，直接进入 Gate 官方注册入口。",
        "填写邮箱或手机号后，展开邀请码或 Referral code 栏。",
        "手动填写 getitpro，再继续验证码与 KYC 流程。",
        "注册完成后，从下方官方下载入口安装 App。",
      ],
      en: [
        "Open the official Gate sign-up page directly.",
        "After entering your email or phone number, expand the referral code field.",
        "Enter getitpro manually, then continue with verification and KYC.",
        "Install the app from the official download entry after the account is created.",
      ],
    },
    blockers: {
      zh: [
        "如果页面很慢，先确认你打开的是 Gate 官方域名，而不是镜像站。",
        "邀请码通常无法在注册完成后补录，所以提交前一定要检查一遍。",
        "开始 KYC 前先准备身份证件和稳定光线，能减少退回次数。",
      ],
      en: [
        "If the page is slow, make sure you are on Gate's official domain and not a mirror.",
        "The referral code usually cannot be added after registration, so double-check before submitting.",
        "Prepare your ID and stable lighting before starting KYC to reduce rejections.",
      ],
    },
  },
  okx: {
    slug: "okx",
    name: "OKX",
    nameEn: "OKX",
    emoji: "🔷",
    accent: "#7EA7FF",
    rebate: "20%",
    officialSignup: "https://www.okx.com/account/register",
    officialDownload: "https://www.okx.com/download",
    appStore: "https://apps.apple.com/app/okx/id1327268470",
    partnerSummary: {
      zh: "适合想直接使用我们提供的官方合作开户链接的用户，邀请码通常已自动带入。",
      en: "Best for users who want to start from the official partner link we provide, where the code is usually prefilled.",
    },
    officialSummary: {
      zh: "适合只走 OKX 官网原生注册入口的用户，进入后手动填写邀请码 getitpro。",
      en: "Best for users who want the native OKX sign-up page and prefer to enter getitpro manually.",
    },
    partnerSteps: {
      zh: [
        "点击“官方合作注册链接”，确认当前页面属于 OKX 官方域名。",
        "进入注册页后先检查 Referral code 是否已经带入。",
        "如果邀请码为空，手动填写 getitpro，再继续注册。",
        "注册成功后再从官方下载页安装 App 或桌面端。",
      ],
      en: [
        "Open the official partner sign-up link and confirm the page belongs to OKX.",
        "Check whether the referral code field is already filled.",
        "If the field is empty, enter getitpro manually before continuing.",
        "Install the app or desktop client from the official download page after registration.",
      ],
    },
    officialSteps: {
      zh: [
        "点击“官网注册链接”，直接进入 OKX 官方注册入口。",
        "填写邮箱或手机号后，展开 Referral code 区域。",
        "手动填写 getitpro，再继续验证码和身份认证。",
        "如果 App Store 搜不到 OKX，优先查看官网下载页说明。",
      ],
      en: [
        "Open the official OKX sign-up page directly.",
        "After entering your email or phone number, expand the referral area.",
        "Enter getitpro manually, then continue with verification and identity checks.",
        "If OKX is missing from your App Store, check the official download page first.",
      ],
    },
    blockers: {
      zh: [
        "OKX 部分地区的 App Store 入口有限制，优先参考官网下载页。",
        "邀请码一般不能在注册后补填，所以一定要在创建账户前检查。",
        "如果你切到 App 内继续注册，邀请码栏要重新确认一次。",
      ],
      en: [
        "The App Store entry is limited in some regions, so check the official download page first.",
        "The referral code usually cannot be added after registration, so verify it before creating the account.",
        "If you continue in the app, re-check the referral field once more.",
      ],
    },
  },
  binance: {
    slug: "binance",
    name: "Binance",
    nameEn: "Binance",
    emoji: "🟡",
    accent: "#F0B90B",
    rebate: "20%",
    officialSignup: "https://accounts.binance.com/register",
    officialDownload: "https://www.binance.com/download",
    appStore: "https://apps.apple.com/app/binance-buy-bitcoin-crypto/id1436799971",
    partnerSummary: {
      zh: "适合想直接从官方合作链接注册的用户，邀请码通常已经被带入。",
      en: "Best for users who want to register through the official partner link, where the code is usually carried over automatically.",
    },
    officialSummary: {
      zh: "适合只想从 Binance 官网原生入口注册的用户，进入后手动填入 getitpro。",
      en: "Best for users who want Binance's native sign-up page and prefer to enter getitpro manually.",
    },
    partnerSteps: {
      zh: [
        "点击“官方合作注册链接”，确认当前页面属于 Binance 官方域名。",
        "在提交前先看 Referral ID 或 Referral code 栏位。",
        "如果邀请码没有自动带入，请手动填写 getitpro。",
        "完成注册与基础认证后，再安装官方 App。",
      ],
      en: [
        "Open the official partner sign-up link and confirm the page belongs to Binance.",
        "Before submitting, check the Referral ID or Referral code field.",
        "If the code is missing, enter getitpro manually.",
        "Finish registration and the basic checks first, then install the official app.",
      ],
    },
    officialSteps: {
      zh: [
        "点击“官网注册链接”，直接进入 Binance 官方注册入口。",
        "填写手机号或邮箱与密码后，展开邀请码区域。",
        "手动填写 getitpro，再继续验证码与 KYC。",
        "如果 App Store 没有 Binance，优先参考官网下载页。",
      ],
      en: [
        "Open the official Binance sign-up page directly.",
        "After entering your phone number or email and password, expand the referral section.",
        "Enter getitpro manually, then continue with verification and KYC.",
        "If Binance is missing from your App Store, use the official download page first.",
      ],
    },
    blockers: {
      zh: [
        "不要从广告页或不熟悉的短链进入，避免邀请码丢失。",
        "邀请码栏有时默认折叠，提交前一定要展开确认。",
        "部分地区下载入口有限制，优先以官网说明为准。",
      ],
      en: [
        "Avoid ad pages or unfamiliar short links so the referral code is not lost.",
        "The referral field may be collapsed by default, so expand it before submitting.",
        "Some regions have restricted download access, so follow the official instructions first.",
      ],
    },
  },
  bybit: {
    slug: "bybit",
    name: "Bybit",
    nameEn: "Bybit",
    emoji: "🔵",
    accent: "#6EA8FF",
    rebate: "30%",
    officialSignup: "https://www.bybit.com/register",
    officialDownload: "https://www.bybit.com/download",
    appStore: "https://apps.apple.com/app/bybit-buy-crypto-bitcoin/id1488296980",
    partnerSummary: {
      zh: "适合想直接走我们提供的官方合作链接完成注册的用户，邀请码大多会自动带入。",
      en: "Best for users who want to register through the official partner link we provide, where the code is usually prefilled.",
    },
    officialSummary: {
      zh: "适合只想从 Bybit 官网入口注册的用户，进入后手动填写邀请码 getitpro。",
      en: "Best for users who prefer the native Bybit sign-up page and want to enter getitpro manually.",
    },
    partnerSteps: {
      zh: [
        "点击“官方合作注册链接”，确认页面属于 Bybit 官方域名。",
        "注册时先检查邀请码或 Referral code 栏位是否带入。",
        "如果邀请码为空，手动填写 getitpro 再继续。",
        "完成注册后从官网或商店安装官方 App。",
      ],
      en: [
        "Open the official partner sign-up link and confirm it belongs to Bybit.",
        "Check whether the referral field is already filled before you continue.",
        "If the field is blank, enter getitpro manually.",
        "Install the official app from the website or store after the account is ready.",
      ],
    },
    officialSteps: {
      zh: [
        "点击“官网注册链接”，直接进入 Bybit 官方注册入口。",
        "填写邮箱或手机号后，展开邀请码区域。",
        "手动填写 getitpro，再继续验证码和 KYC。",
        "注册完成后再对照我们提供的截图检查每一步是否一致。",
      ],
      en: [
        "Open the official Bybit sign-up page directly.",
        "After entering your email or phone number, expand the referral section.",
        "Enter getitpro manually, then continue with verification and KYC.",
        "Compare each step with the tutorial screenshots after registration.",
      ],
    },
    blockers: {
      zh: [
        "Bybit 注册完成后通常不能补录邀请码，所以一定要在创建账户前确认。",
        "如果你先下 App 再注册，邀请码栏也要再检查一遍。",
        "下载前先核对开发者信息，避免装到仿冒 App。",
      ],
      en: [
        "Bybit usually does not allow adding the code after registration, so check before creating the account.",
        "If you install the app first, re-check the referral field there too.",
        "Verify the developer information before downloading to avoid fake apps.",
      ],
    },
  },
  bitget: {
    slug: "bitget",
    name: "Bitget",
    nameEn: "Bitget",
    emoji: "🟣",
    accent: "#9C6CFF",
    rebate: "50%",
    officialSignup: "https://www.bitget.com/account/register",
    officialDownload: "https://www.bitget.com/download",
    appStore: "https://apps.apple.com/app/bitget-buy-bitcoin-crypto/id1619678672",
    partnerSummary: {
      zh: "适合想直接从官方合作链接进入注册页的用户，邀请码通常会自动带入。",
      en: "Best for users who want to enter from the official partner sign-up link, where the code is usually prefilled.",
    },
    officialSummary: {
      zh: "适合从 Bitget 官网原生入口注册的用户，进入后手动填写邀请码 getitpro。",
      en: "Best for users who prefer Bitget's native sign-up page and want to type getitpro manually.",
    },
    partnerSteps: {
      zh: [
        "点击“官方合作注册链接”，确认页面属于 Bitget 官方域名。",
        "进入注册页后先看 Referral code 或 Invite code 是否已经带入。",
        "如果邀请码为空，手动填写 getitpro 再继续。",
        "完成注册后，再安装官方 App 并检查权益状态。",
      ],
      en: [
        "Open the official partner sign-up link and confirm it belongs to Bitget.",
        "Check whether the Referral code or Invite code field is already filled.",
        "If the field is blank, enter getitpro manually.",
        "Install the official app after registration and verify the expected benefits.",
      ],
    },
    officialSteps: {
      zh: [
        "点击“官网注册链接”，直接进入 Bitget 官方注册入口。",
        "填写邮箱或手机号后，展开邀请码或 Referral code 区域。",
        "手动填写 getitpro，再继续验证码与 KYC。",
        "完成注册后按官方下载页选择 App 或桌面端。",
      ],
      en: [
        "Open the official Bitget sign-up page directly.",
        "After entering your email or phone number, expand the referral section.",
        "Enter getitpro manually, then continue with verification and KYC.",
        "Use the official download page afterward to choose the app or desktop client.",
      ],
    },
    blockers: {
      zh: [
        "Bitget 老账户通常无法补填邀请码，所以第一次注册时一定要确认。",
        "如果页面加载慢，先核对是否进入了官方域名。",
        "下载官方 App 前先核对图标和开发者信息。",
      ],
      en: [
        "Existing Bitget accounts usually cannot add the code later, so verify it on first registration.",
        "If the page loads slowly, confirm you are on the official domain.",
        "Verify the icon and developer details before downloading the official app.",
      ],
    },
  },
};

const COMMON_NOTES = {
  zh: [
    {
      icon: <Shield className="h-5 w-5 text-emerald-400" />,
      title: "只使用官方域名和官方商店",
      desc: "注册和下载都优先使用官方域名、官方下载页或官方商店入口，不要从陌生短链和镜像页进入。",
    },
    {
      icon: <Lock className="h-5 w-5 text-blue-400" />,
      title: "邀请码要在注册前确认",
      desc: "大多数平台在注册完成后都不能补录邀请码，所以一定要在提交表单前确认 getitpro 是否已经带入或填写完成。",
    },
    {
      icon: <Smartphone className="h-5 w-5 text-purple-400" />,
      title: "下载前核对图标和开发者",
      desc: "如果你是从 App Store 或其他应用商店进入，先看图标和开发者信息，避免误下非官方应用。",
    },
    {
      icon: <AlertTriangle className="h-5 w-5 text-amber-400" />,
      title: "KYC 前先准备资料",
      desc: "身份证件、稳定光线和网络环境提前准备好，会明显减少 KYC 退回或中断。",
    },
  ],
  en: [
    {
      icon: <Shield className="h-5 w-5 text-emerald-400" />,
      title: "Use official domains and official stores only",
      desc: "Always use official domains, official download pages, or official app stores instead of unfamiliar short links or mirrors.",
    },
    {
      icon: <Lock className="h-5 w-5 text-blue-400" />,
      title: "Confirm the referral code before registration",
      desc: "Most platforms do not allow adding the code after registration, so verify that getitpro is present before submitting the form.",
    },
    {
      icon: <Smartphone className="h-5 w-5 text-purple-400" />,
      title: "Check the icon and developer before downloading",
      desc: "If you are using an app store, confirm the icon and developer details before installing the app.",
    },
    {
      icon: <AlertTriangle className="h-5 w-5 text-amber-400" />,
      title: "Prepare for KYC in advance",
      desc: "Prepare your ID, stable lighting, and a reliable network before starting KYC to reduce rejections or interruptions.",
    },
  ],
};

const SCREENSHOT_HINTS = {
  zh: ["官网注册入口截图", "邀请码填写位置截图", "官方下载入口截图"],
  en: ["Official sign-up entry screenshot", "Referral code field screenshot", "Official download entry screenshot"],
};

function isExchangeSlug(value: string | null): value is ExchangeSlug {
  return value === "gate" || value === "okx" || value === "binance" || value === "bybit" || value === "bitget";
}

export default function ExchangeDownload() {
  useScrollMemory();
  const { language } = useLanguage();
  const zh = language === "zh";
  const { allLinks } = useExchangeLinks();

  const initialExchange = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("exchange");
    return isExchangeSlug(value) ? value : "gate";
  }, []);

  const initialMode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("mode") === "official" ? "official" : "partner";
  }, []);

  const [activeExchange, setActiveExchange] = useState<ExchangeSlug>(initialExchange);
  const [mode, setMode] = useState<FlowMode>(initialMode);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("exchange", activeExchange);
    params.set("mode", mode);
    const nextUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }, [activeExchange, mode]);

  const tutorial = GUIDE_DATA[activeExchange];
  const dynamicLink = allLinks.find((item) => item.slug === activeExchange);
  const notes = COMMON_NOTES[zh ? "zh" : "en"];
  const screenshotHints = SCREENSHOT_HINTS[zh ? "zh" : "en"];
  const steps = mode === "partner" ? tutorial.partnerSteps : tutorial.officialSteps;
  const primaryHref = mode === "partner" ? dynamicLink?.referralLink ?? tutorial.officialSignup : tutorial.officialSignup;
  const primaryLabel = zh
    ? mode === "partner"
      ? "前往官方合作注册链接"
      : "前往官网注册链接"
    : mode === "partner"
      ? "Open Official Partner Link"
      : "Open Official Sign-up Link";
  const primaryHelper = zh
    ? mode === "partner"
      ? "邀请码通常已自动带入；如未带入请填写 getitpro。"
      : "进入官网注册页后，请在邀请码栏手动填写 getitpro。"
    : mode === "partner"
      ? "The referral code is usually prefilled; if not, enter getitpro manually."
      : "After opening the official page, enter getitpro manually in the referral field.";

  return (
    <div className="min-h-screen bg-[#081322] text-white">
      <SeoManager
        title={zh ? "交易所注册与下载教学 | Get8 Pro" : "Exchange Registration & Download Guide | Get8 Pro"}
        description={
          zh
            ? "在一个页面内完成交易所选择、注册链接选择、邀请码填写说明与官方下载教学。"
            : "Choose an exchange, choose a registration path, and follow the official sign-up and download tutorial in one place."
        }
        path="/exchange-download"
        keywords={
          zh
            ? "交易所注册教学,交易所下载教学,邀请码填写,getitpro,官网注册链接,官方合作链接"
            : "exchange registration guide,exchange download guide,referral code,getitpro,official sign-up link,partner link"
        }
      />
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#081322]/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <button
            type="button"
            onClick={() => goBack()}
            className="tap-target inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {zh ? "返回" : "Back"}
          </button>
          <div className="inline-flex items-center gap-2 text-sm font-black text-white">
            <Download className="h-4 w-4 text-cyan-300" />
            {zh ? "交易所注册与下载教学" : "Exchange Registration & Download Guide"}
          </div>
          <Link href="/exchanges" className="tap-target text-sm text-slate-400 transition hover:text-white">
            {zh ? "交易所对比" : "Exchanges"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <section className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_35%),linear-gradient(180deg,rgba(8,19,34,0.98),rgba(4,12,24,0.98))] px-6 py-8 sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">
              <CheckCircle2 className="h-4 w-4" />
              {zh ? "一个页面讲清楚注册、邀请码和下载流程" : "One page for registration, referral, and download"}
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              {zh ? "先选交易所，再选注册方式" : "Choose the exchange first, then choose the registration path"}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              {zh
                ? "这个页面会把五家交易所的注册、邀请码填写和官方下载入口整合到一起。你可以直接走我们提供的官方合作链接；如果你只想用官网原生入口，也可以手动填写邀请码 getitpro，我们会把教学步骤整理清楚。"
                : "This page brings the sign-up path, referral-code instructions, and official download entries for all five exchanges into one place. You can use our official partner links, or you can use the native official sign-up pages and type getitpro manually."}
            </p>
          </div>
        </section>

        <section className="pt-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                {zh ? "第一步" : "Step 1"}
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                {zh ? "选择你要注册的交易所" : "Choose the exchange you want to register"}
              </h2>
            </div>
            <div className="text-xs text-slate-400">
              {zh ? "默认邀请码：getitpro" : "Default code: getitpro"}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {allLinks.map((item) => {
              const exchange = GUIDE_DATA[item.slug as ExchangeSlug];
              const selected = item.slug === activeExchange;
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => setActiveExchange(item.slug as ExchangeSlug)}
                  className={`rounded-[24px] border px-4 py-5 text-left transition ${selected ? "border-cyan-400/45 bg-cyan-400/10" : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-3xl">{exchange.emoji}</p>
                      <h3 className="mt-3 text-lg font-black text-white">{exchange.name}</h3>
                    </div>
                    <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-xs font-bold text-amber-300">
                      {zh ? `返佣 ${item.rebateRate}` : `${item.rebateRate} rebate`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section id="registration-guide" className="pt-8">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
              {zh ? "第二步" : "Step 2"}
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              {zh ? `选择 ${tutorial.name} 的注册方式` : `Choose the registration path for ${tutorial.nameEn}`}
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("partner")}
              className={`rounded-[28px] border p-6 text-left transition ${mode === "partner" ? "border-cyan-400/45 bg-cyan-400/10" : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"}`}
            >
              <div className="mb-4 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">
                {zh ? "官方合作链接" : "Official partner link"}
              </div>
              <h3 className="text-2xl font-black text-white">
                {zh ? "直接走我们提供的官方合作链接" : "Use our official partner sign-up link"}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {zh ? tutorial.partnerSummary.zh : tutorial.partnerSummary.en}
              </p>
              <div className="mt-4 text-xs font-semibold text-slate-400">
                {zh ? "更适合想快速完成注册的用户" : "Best for users who want the shortest route"}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("official")}
              className={`rounded-[28px] border p-6 text-left transition ${mode === "official" ? "border-cyan-400/45 bg-cyan-400/10" : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"}`}
            >
              <div className="mb-4 inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold text-slate-200">
                {zh ? "官网原生入口" : "Native official sign-up"}
              </div>
              <h3 className="text-2xl font-black text-white">
                {zh ? "只用官网注册链接，手动填写邀请码" : "Use the official sign-up page and enter the code manually"}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {zh ? tutorial.officialSummary.zh : tutorial.officialSummary.en}
              </p>
              <div className="mt-4 text-xs font-semibold text-slate-400">
                {zh ? "更适合只想使用官网原生流程的用户" : "Best for users who prefer the native official flow"}
              </div>
            </button>
          </div>
        </section>

        <section className="grid gap-8 pt-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                  {zh ? "第三步" : "Step 3"}
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  {zh ? "跟着步骤完成注册与下载" : "Follow the steps to register and download"}
                </h2>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-bold text-black"
                style={{ background: tutorial.accent }}
              >
                {mode === "partner" ? (zh ? "合作链接模式" : "Partner mode") : (zh ? "官网手动模式" : "Manual mode")}
              </span>
            </div>

            <div className="space-y-4">
              {(zh ? steps.zh : steps.en).map((step, index) => (
                <div key={step} className="flex items-start gap-4 rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-black"
                    style={{ background: tutorial.accent }}
                  >
                    {index + 1}
                  </div>
                  <p className="text-sm leading-7 text-slate-200">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-4 text-sm leading-7 text-amber-100">
              {primaryHelper}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={primaryHref}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black text-black transition hover:scale-[1.01]"
                style={{ background: tutorial.accent }}
              >
                {primaryLabel}
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href={tutorial.officialDownload}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {zh ? "前往官方下载页" : "Open official download page"}
                <Download className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-3 text-xs leading-6 text-slate-400">
              {zh ? `当前交易所：${tutorial.name} · 默认返佣 ${tutorial.rebate}` : `Current exchange: ${tutorial.nameEn} · Default rebate ${tutorial.rebate}`}
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <Link
                href={`/exchange/${activeExchange}`}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-300 transition hover:bg-white/[0.06]"
              >
                {zh ? "查看交易所详情页" : "View exchange detail"}
              </Link>
              <a
                href={tutorial.appStore ?? tutorial.officialDownload}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-300 transition hover:bg-white/[0.06]"
              >
                {zh ? "查看 App Store 入口" : "View app store entry"}
              </a>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-black/20 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                {zh ? "邀请码说明" : "Referral code note"}
              </p>
              <h2 className="mt-3 text-3xl font-black text-white">getitpro</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {zh
                  ? "如果你通过我们提供的官方合作链接进入，邀请码大多会自动带入。如果你选择官网原生注册入口，请在邀请码、Referral code 或 Invite code 栏手动填写 getitpro。"
                  : "If you use the official partner link we provide, the code is usually prefilled. If you use the native official sign-up page, enter getitpro manually in the referral field."}
              </p>
            </div>

            <div className="rounded-[28px] border border-dashed border-white/15 bg-black/20 p-6">
              <div className="flex items-center gap-3 text-slate-300">
                <ImagePlus className="h-5 w-5" />
                <p className="text-sm font-semibold">
                  {zh ? "官网截图预留区" : "Reserved area for official screenshots"}
                </p>
              </div>
              <div className="mt-5 grid gap-4">
                {screenshotHints.map((title) => (
                  <div key={title} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                    <h3 className="text-base font-black text-white">{title}</h3>
                    <div className="mt-4 flex h-32 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 text-center text-sm leading-7 text-slate-500">
                      {zh ? "这里可以放官网截图，帮助用户对照完成每一步操作" : "Place the official screenshot here so users can follow each step visually"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
            {zh ? "常见卡点" : "Common blockers"}
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            {zh ? "先把最容易出错的地方讲清楚" : "Call out the most common blockers first"}
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {(zh ? tutorial.blockers.zh : tutorial.blockers.en).map((item) => (
              <div key={item} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <CheckCircle2 className="h-5 w-5" style={{ color: tutorial.accent }} />
                <p className="mt-4 text-sm leading-7 text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
            {zh ? "通用提醒" : "General notes"}
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            {zh ? "注册前建议先看完这几条" : "Read these notes before you register"}
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {notes.map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="shrink-0">{item.icon}</div>
                <div>
                  <h3 className="text-sm font-black text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="pt-8">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] px-6 py-7 sm:px-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-semibold text-slate-300">{zh ? "最后一步" : "Final step"}</p>
                <h2 className="mt-2 text-3xl font-black text-white">
                  {zh ? `进入 ${tutorial.name} 的官方入口` : `Open the official entry for ${tutorial.nameEn}`}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                  {primaryHelper}
                </p>
              </div>
              <a
                href={primaryHref}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black text-black transition hover:scale-[1.01]"
                style={{ background: tutorial.accent }}
              >
                {primaryLabel}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <ScrollToTopButton color="cyan" />
    </div>
  );
}
