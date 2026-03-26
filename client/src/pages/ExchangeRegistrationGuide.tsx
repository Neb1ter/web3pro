import { useEffect } from "react";
import { Link, useLocation, useRoute } from "wouter";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  Globe,
  ImagePlus,
  Shield,
  Smartphone,
} from "lucide-react";
import { SeoManager } from "@/components/SeoManager";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { goBack, useScrollMemory } from "@/hooks/useScrollMemory";
import { INVITE_CODES, type ExchangeSlug } from "@shared/exchangeFees";

type GuideLink = {
  labelZh: string;
  labelEn: string;
  noteZh: string;
  noteEn: string;
  href: string;
};

type GuideData = {
  name: string;
  nameEn: string;
  badgeZh: string;
  badgeEn: string;
  color: string;
  introZh: string;
  introEn: string;
  downloadLinks: GuideLink[];
  stepsZh: string[];
  stepsEn: string[];
  fieldTipsZh: string[];
  fieldTipsEn: string[];
  blockersZh: string[];
  blockersEn: string[];
};

const GUIDE_DATA: Record<ExchangeSlug, GuideData> = {
  gate: {
    name: "Gate.io",
    nameEn: "Gate.io",
    badgeZh: "官方注册教学",
    badgeEn: "Official sign-up guide",
    color: "#00B173",
    introZh:
      "这一页专门讲 Gate.io 官网注册、邀请码填写和官方下载入口。你后面把官网截图补进来后，用户就能一边看图一边操作。",
    introEn:
      "This page explains Gate.io official registration, referral-code entry, and official download routes so users can follow your screenshots step by step.",
    downloadLinks: [
      {
        labelZh: "前往官方注册链接",
        labelEn: "Official sign-up link",
        noteZh: "优先从这里进入，邀请码通常会自动带入。",
        noteEn: "Start here first. The referral code is usually prefilled.",
        href: INVITE_CODES.gate.referralLink,
      },
      {
        labelZh: "官网 App 下载页",
        labelEn: "Official download page",
        noteZh: "适合先确认手机端和桌面端官方入口。",
        noteEn: "Use this to confirm the official mobile and desktop entries.",
        href: "https://www.gate.com/mobileapp",
      },
      {
        labelZh: "App Store",
        labelEn: "App Store",
        noteZh: "下载前记得核对官方图标和开发者信息。",
        noteEn: "Verify the official icon and developer details before downloading.",
        href: "https://apps.apple.com/app/gate-io/id1294998195",
      },
    ],
    stepsZh: [
      "先点击官方注册链接，确认浏览器地址属于 Gate 官方域名。",
      "在注册表单里填写邮箱或手机号、设置密码，然后找到邀请码 / Referral code 字段。",
      "如果邀请码没有自动带入，请手动填写 getitpro，再继续验证码和后续 KYC。",
      "完成注册后再去下载 App，登录时再次确认账户已绑定邀请码对应权益。",
    ],
    stepsEn: [
      "Open the official sign-up link and confirm the domain belongs to Gate.",
      "Fill in your email or phone number, create a password, and locate the referral field.",
      "If the code is not prefilled, enter getitpro manually before verification and KYC.",
      "After registration, download the app and confirm the account is tied to the expected benefits.",
    ],
    fieldTipsZh: [
      "邀请码通常显示为 Invite code、Referral code 或 推荐码。",
      "如果你是从官网链接跳进去，邀请码多数会自动出现。",
      "如果切换到 App 里继续注册，记得再检查一遍邀请码是否还在。",
    ],
    fieldTipsEn: [
      "The field may be labeled Invite code, Referral code, or similar wording.",
      "When entering through the official link, the code is often prefilled.",
      "If you continue registration inside the app, verify the code again.",
    ],
    blockersZh: [
      "如果页面打开很慢，先确认自己没有进入第三方镜像站。",
      "如果验证码收不到，先检查邮箱垃圾箱、短信拦截或区号填写。",
      "开始 KYC 之前先准备证件和稳定光线，减少退回次数。",
    ],
    blockersEn: [
      "If the page loads slowly, confirm you are not on a third-party mirror.",
      "If verification codes do not arrive, check spam folders and SMS filters.",
      "Prepare your ID and stable lighting before starting KYC.",
    ],
  },
  okx: {
    name: "OKX",
    nameEn: "OKX",
    badgeZh: "官网开户注册指引",
    badgeEn: "Official account-opening guide",
    color: "#E8EEF7",
    introZh:
      "这一页把 OKX 官网注册、邀请码确认和官方下载入口拆成一条顺路流程，方便新用户按步骤完成。",
    introEn:
      "This page turns OKX registration, referral confirmation, and official download into one clean sequence for new users.",
    downloadLinks: [
      {
        labelZh: "前往官方注册链接",
        labelEn: "Official sign-up link",
        noteZh: "优先使用官方 join 链接进入注册页。",
        noteEn: "Use the official join link first.",
        href: INVITE_CODES.okx.referralLink,
      },
      {
        labelZh: "官网下载页",
        labelEn: "Official download page",
        noteZh: "查看 App、APK 和桌面端官方入口。",
        noteEn: "Check the official app, APK, and desktop entries.",
        href: "https://www.okx.com/download",
      },
      {
        labelZh: "App Store",
        labelEn: "App Store",
        noteZh: "部分地区可能需要海外 Apple ID。",
        noteEn: "Some regions may require a foreign Apple ID.",
        href: "https://apps.apple.com/app/okx/id1327268470",
      },
    ],
    stepsZh: [
      "先从 OKX 官方 join 链接进入注册页，不要从搜索广告页乱跳。",
      "填写邮箱或手机号并设置密码，然后留意邀请码 / Referral code 是否已带入。",
      "如未带入，请手动填写 getitpro，再继续验证码和 KYC。",
      "下载 App 后首次登录，再检查账号资料页里的推荐关系或活动权益。",
    ],
    stepsEn: [
      "Start from the official OKX join link instead of a random ad result.",
      "Fill in your email or phone number, then check whether the referral field is already filled.",
      "If it is blank, enter getitpro manually before verification and KYC.",
      "After downloading the app, check the account profile and benefits again on first login.",
    ],
    fieldTipsZh: [
      "邀请码字段有时默认收起，需要先点开 Referral code。",
      "OKX 注册完成后通常无法补录邀请码。",
      "iOS 用户如果 App Store 找不到 OKX，优先看官网下载页说明。",
    ],
    fieldTipsEn: [
      "The referral field may be collapsed by default and needs to be expanded.",
      "OKX usually does not allow adding a code after registration.",
      "If OKX is missing from your App Store, check the official download page first.",
    ],
    blockersZh: [
      "如果 App Store 没有 OKX，不要下载来路不明的安装包。",
      "切到 App 继续注册时，邀请码字段可能需要重新确认。",
      "完成基础验证后再做 KYC，流程会更顺。",
    ],
    blockersEn: [
      "If OKX is missing from the App Store, avoid unknown APK sources.",
      "When switching into the app, re-check the referral field.",
      "Complete basic verification first, then continue with KYC.",
    ],
  },
  binance: {
    name: "币安",
    nameEn: "Binance",
    badgeZh: "官方开户链接教学",
    badgeEn: "Official registration walkthrough",
    color: "#F0B90B",
    introZh:
      "这一页的重点是让用户从 Binance 官方域名进入注册页，并在提交前确认邀请码 getitpro 已经带入。",
    introEn:
      "This page focuses on starting from Binance's official domain and confirming that getitpro is present before submitting the form.",
    downloadLinks: [
      {
        labelZh: "前往官方注册链接",
        labelEn: "Official sign-up link",
        noteZh: "优先从官方注册链接进入，避免搜索结果里的广告页。",
        noteEn: "Start from the official sign-up link instead of an ad result.",
        href: INVITE_CODES.binance.referralLink,
      },
      {
        labelZh: "官网下载页",
        labelEn: "Official download page",
        noteZh: "查看 App、APK 和桌面端入口。",
        noteEn: "Check app, APK, and desktop entries.",
        href: "https://www.binance.com/download",
      },
      {
        labelZh: "App Store",
        labelEn: "App Store",
        noteZh: "部分地区需要切换海外 Apple ID。",
        noteEn: "Some regions require a foreign Apple ID.",
        href: "https://apps.apple.com/app/binance-buy-bitcoin-crypto/id1436799971",
      },
    ],
    stepsZh: [
      "直接点击官方注册链接进入，确认域名属于 Binance 官方。",
      "填写邮箱或手机号和密码后，先别急着提交，先检查推荐码字段。",
      "如果邀请码没有自动出现，请手动填入 getitpro。",
      "完成验证码和基础验证后，再根据地区情况下载官方 App。",
    ],
    stepsEn: [
      "Open the official sign-up link and confirm the domain belongs to Binance.",
      "After entering your email or phone number and password, pause and verify the referral field.",
      "If the code is missing, enter getitpro manually.",
      "Finish verification first, then download the official app for your region.",
    ],
    fieldTipsZh: [
      "邀请码字段可能叫 Referral ID、Referral code 或推荐码。",
      "有些页面会默认隐藏该字段，需要先展开。",
      "切换到 App 内注册时，邀请码可能不会自动同步。",
    ],
    fieldTipsEn: [
      "The field may appear as Referral ID, Referral code, or similar wording.",
      "Some pages hide the field by default and require expansion.",
      "If you continue inside the app, the code may not sync automatically.",
    ],
    blockersZh: [
      "不要从搜索广告或短链进入，以免丢邀请码或进入非官方页。",
      "验证码收不到时优先检查邮箱垃圾箱和短信拦截。",
      "部分地区访问 App Store 或官网时需要稳定网络环境。",
    ],
    blockersEn: [
      "Avoid ad results or short links that may lose the referral context.",
      "If codes do not arrive, check spam folders and message filters first.",
      "Some regions need a stable network environment to access the site or store.",
    ],
  },
  bybit: {
    name: "Bybit",
    nameEn: "Bybit",
    badgeZh: "官网注册与下载说明",
    badgeEn: "Official sign-up and download guide",
    color: "#F7931A",
    introZh:
      "这一页把 Bybit 的下载入口、注册表单和邀请码填写点拆开讲，后面挂官网截图会很清楚。",
    introEn:
      "This page separates Bybit's download entry, registration form, and referral-code field so your later screenshots can be followed clearly.",
    downloadLinks: [
      {
        labelZh: "前往官方注册链接",
        labelEn: "Official sign-up link",
        noteZh: "优先使用官方开户链接进入注册页。",
        noteEn: "Use the official sign-up link first.",
        href: INVITE_CODES.bybit.referralLink,
      },
      {
        labelZh: "官网下载页",
        labelEn: "Official download page",
        noteZh: "查看 App、网页和桌面端入口。",
        noteEn: "Check app, web, and desktop entries.",
        href: "https://www.bybit.com/download",
      },
      {
        labelZh: "App Store",
        labelEn: "App Store",
        noteZh: "下载前核对官方图标与开发者信息。",
        noteEn: "Verify the official icon and developer details before downloading.",
        href: "https://apps.apple.com/app/bybit-buy-crypto-bitcoin/id1488296980",
      },
    ],
    stepsZh: [
      "先点官方注册链接，确认你已经进入 Bybit 官方域名。",
      "注册时选择邮箱或手机号，填完密码后留意邀请码字段。",
      "如未带入，请手动填写 getitpro，再继续验证码和 KYC。",
      "下载 App 后重新登录，检查账户权益或活动页是否正常。",
    ],
    stepsEn: [
      "Open the official sign-up link and confirm you are on Bybit's official domain.",
      "Choose phone or email registration, then look for the referral field after setting the password.",
      "If it is blank, enter getitpro manually before verification and KYC.",
      "After installing the app, log in again and confirm the expected benefits or campaign status.",
    ],
    fieldTipsZh: [
      "邀请码字段有时默认隐藏，要先点开 Referral code。",
      "Bybit 注册完成后一般不能补录邀请码。",
      "如果你先装 App 再注册，也要再核对一次邀请码。",
    ],
    fieldTipsEn: [
      "The referral field may be hidden by default and needs expansion.",
      "Bybit generally does not allow adding the code after registration.",
      "If you install the app first, check the code again inside the app.",
    ],
    blockersZh: [
      "如果注册页看起来异常，重新从官方开户链接进入。",
      "下载 App 前要核对开发者和应用图标，避免假冒。",
      "KYC 前先准备证件与稳定光线，减少退回。",
    ],
    blockersEn: [
      "If the sign-up page looks broken, reopen the official sign-up link.",
      "Verify the app icon and developer details before installing.",
      "Prepare your ID and stable lighting before starting KYC.",
    ],
  },
  bitget: {
    name: "Bitget",
    nameEn: "Bitget",
    badgeZh: "官方开户注册教学",
    badgeEn: "Official registration guide",
    color: "#00E7F0",
    introZh:
      "这一页把 Bitget 官网注册、下载和邀请码确认整理成一条操作线，方便用户按图操作。",
    introEn:
      "This page arranges Bitget registration, download, and referral confirmation into one practical path users can follow visually.",
    downloadLinks: [
      {
        labelZh: "前往官方注册链接",
        labelEn: "Official sign-up link",
        noteZh: "优先从官方注册链接进入。",
        noteEn: "Use the official sign-up link first.",
        href: INVITE_CODES.bitget.referralLink,
      },
      {
        labelZh: "官网下载页",
        labelEn: "Official download page",
        noteZh: "查看 App 与桌面端官方入口。",
        noteEn: "Check the official app and desktop entries.",
        href: "https://www.bitget.com/download",
      },
      {
        labelZh: "App Store",
        labelEn: "App Store",
        noteZh: "下载前核对官方开发者信息。",
        noteEn: "Verify the official developer information before downloading.",
        href: "https://apps.apple.com/app/bitget-buy-bitcoin-crypto/id1619678672",
      },
    ],
    stepsZh: [
      "先点击官方注册链接，确认地址属于 Bitget 官网。",
      "填写邮箱或手机号并设置密码，再找邀请码 / 推荐码字段。",
      "如未带入 getitpro，请手动填写后再继续验证和 KYC。",
      "安装 App 后再次登录，检查账户活动或邀请权益是否正常。",
    ],
    stepsEn: [
      "Open the official sign-up link and confirm the address belongs to Bitget.",
      "Enter your email or phone number, create a password, and locate the referral field.",
      "If getitpro is missing, enter it manually before verification and KYC.",
      "After installing the app, log in again and confirm the account benefits or campaign status.",
    ],
    fieldTipsZh: [
      "邀请码字段可能叫 Invite code、Referral code 或推荐码。",
      "浏览器自动翻译页面时，要先核对字段位置再提交。",
      "老账户通常无法补录邀请码，所以首次注册时一定要检查。",
    ],
    fieldTipsEn: [
      "The field may be labeled Invite code, Referral code, or similar wording.",
      "If your browser auto-translates the page, verify the field placement before submitting.",
      "Existing accounts usually cannot add a code later, so check carefully on first registration.",
    ],
    blockersZh: [
      "如果官网打开缓慢，先确认不是第三方镜像站。",
      "下载 App 时要核对官方开发者和图标，避免误装。",
      "注册完成后再做 KYC，会更容易跟着截图流程走。",
    ],
    blockersEn: [
      "If the official site feels slow, confirm you are not on a mirror page.",
      "Verify the official icon and developer before installing the app.",
      "It is usually easier to follow the flow if KYC starts after registration.",
    ],
  },
};

const SCREENSHOT_SLOTS = {
  zh: [
    {
      title: "官网注册入口截图",
      desc: "建议放开户链接进入后的第一屏，明确告诉用户这是官方入口。",
    },
    {
      title: "邀请码填写截图",
      desc: "重点标出 Referral code / 推荐码 字段和 getitpro。",
    },
    {
      title: "官方下载入口截图",
      desc: "展示官网 App、APK 或桌面端下载入口位置。",
    },
  ],
  en: [
    {
      title: "Official sign-up entry",
      desc: "Use the first screen after opening the official sign-up link.",
    },
    {
      title: "Referral code field",
      desc: "Highlight the referral field and the getitpro code clearly.",
    },
    {
      title: "Official download entry",
      desc: "Show where the app, APK, or desktop download starts from the official page.",
    },
  ],
};

export default function ExchangeRegistrationGuide() {
  useScrollMemory();
  const { language } = useLanguage();
  const zh = language === "zh";
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/exchange-registration/:slug");
  const slug = (params?.slug ?? "gate") as ExchangeSlug;
  const guide = GUIDE_DATA[slug];

  useEffect(() => {
    if (!match || !guide) {
      navigate("/exchange-download");
    }
  }, [guide, match, navigate]);

  if (!match || !guide) {
    return null;
  }

  const screenshots = SCREENSHOT_SLOTS[zh ? "zh" : "en"];
  const title = zh
    ? `${guide.name} 注册与下载教学 | Get8 Pro`
    : `${guide.nameEn} Sign-up & Download Guide | Get8 Pro`;
  const description = zh
    ? `${guide.name} 官方注册、下载与邀请码填写教学。如邀请码未自动带入，请手动填写 getitpro。`
    : `${guide.nameEn} official sign-up, download, and referral-code guide. If the code is not prefilled, enter getitpro manually.`;

  return (
    <>
      <SeoManager
        title={title}
        description={description}
        path={`/exchange-registration/${slug}`}
        keywords={
          zh
            ? `${guide.name}注册教学,${guide.name}邀请码,getitpro,交易所下载教学`
            : `${guide.nameEn} sign-up guide,${guide.nameEn} referral code,getitpro,exchange download guide`
        }
      />

      <div className="min-h-screen bg-[#06101d] text-white">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#06101d]/90 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <button
              type="button"
              onClick={() => goBack()}
              className="tap-target flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              {zh ? "返回" : "Back"}
            </button>
            <div className="text-sm font-semibold text-slate-300">
              {zh ? `${guide.name} 教学页` : `${guide.nameEn} Guide`}
            </div>
            <Link href={`/exchange/${slug}`} className="tap-target text-sm text-slate-400 transition hover:text-white">
              {zh ? "交易所详情" : "Detail"}
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
          <section
            className="overflow-hidden rounded-[32px] border border-white/10 px-6 py-8 sm:px-8 lg:px-10"
            style={{
              background: `radial-gradient(circle at top right, ${guide.color}22, transparent 40%), linear-gradient(180deg, rgba(9,18,32,0.96), rgba(5,10,20,0.98))`,
            }}
          >
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/12 px-3 py-1 text-xs font-semibold text-slate-300">
                  <Shield className="h-4 w-4" style={{ color: guide.color }} />
                  <span>{zh ? guide.badgeZh : guide.badgeEn}</span>
                </div>
                <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">
                  {zh ? `${guide.name} 官方注册与下载教学` : `${guide.nameEn} Official Sign-up & Download Guide`}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                  {zh ? guide.introZh : guide.introEn}
                </p>
                <div className="mt-6 max-w-2xl rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-slate-300">
                  {zh
                    ? "邀请码通常会自动带入；如未带入，请手动填写 getitpro 后再提交注册表单。"
                    : "The referral code is usually prefilled; if not, manually enter getitpro before submitting the form."}
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={INVITE_CODES[slug].referralLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black text-black transition hover:scale-[1.01]"
                    style={{ background: guide.color }}
                  >
                    {zh ? "前往官方注册链接" : "Open Official Sign-up Link"}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <Link
                    href="/exchange-download"
                    className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    {zh ? "回到下载总览" : "Back to download hub"}
                  </Link>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Invite code</p>
                    <h2 className="mt-2 text-3xl font-black text-white">getitpro</h2>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <CheckCircle2 className="h-6 w-6" style={{ color: guide.color }} />
                  </div>
                </div>
                <div className="space-y-3 text-sm leading-7 text-slate-300">
                  {(zh ? guide.fieldTipsZh : guide.fieldTipsEn).map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 py-10 sm:grid-cols-2 xl:grid-cols-3">
            {guide.downloadLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-[26px] border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-white">{zh ? item.labelZh : item.labelEn}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{zh ? item.noteZh : item.noteEn}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-slate-300">
                    {item.labelEn.includes("Store") ? <Smartphone className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
                  </div>
                </div>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: guide.color }}>
                  {zh ? "打开官方入口" : "Open official entry"}
                  <ExternalLink className="h-4 w-4" />
                </div>
              </a>
            ))}
          </section>

          <section className="grid gap-8 py-2 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                {zh ? "注册步骤" : "Registration flow"}
              </p>
              <h2 className="mt-3 text-3xl font-black text-white">
                {zh ? "一条线讲清楚怎么注册" : "One straight path through registration"}
              </h2>
              <div className="mt-6 space-y-4">
                {(zh ? guide.stepsZh : guide.stepsEn).map((step, index) => (
                  <div key={step} className="flex items-start gap-4 rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-black"
                      style={{ background: guide.color }}
                    >
                      {index + 1}
                    </div>
                    <p className="text-sm leading-7 text-slate-200">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-dashed border-white/15 bg-black/20 p-6">
              <div className="flex items-center gap-3 text-slate-300">
                <ImagePlus className="h-5 w-5" />
                <p className="text-sm font-semibold">
                  {zh ? "官方截图预留区" : "Reserved area for official screenshots"}
                </p>
              </div>
              <div className="mt-6 grid gap-4">
                {screenshots.map((slot) => (
                  <div key={slot.title} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                    <h3 className="text-base font-black text-white">{slot.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-400">{slot.desc}</p>
                    <div className="mt-5 flex h-36 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 text-center text-sm leading-7 text-slate-500">
                      {zh ? "把官网截图放在这里\n用户就能跟着截图操作" : "Place the official screenshot here\nso users can follow along visually"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-12">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              {zh ? "常见卡点" : "Common blockers"}
            </p>
            <h2 className="mt-3 text-3xl font-black text-white">
              {zh ? "把容易出错的地方提前说明" : "Call out the most common blockers first"}
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {(zh ? guide.blockersZh : guide.blockersEn).map((item) => (
                <div key={item} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <CheckCircle2 className="h-5 w-5" style={{ color: guide.color }} />
                  <p className="mt-4 text-sm leading-7 text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-white/[0.03] px-6 py-7 sm:px-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-semibold text-slate-300">{zh ? "最后一步" : "Final step"}</p>
                <h2 className="mt-2 text-3xl font-black text-white">
                  {zh ? `前往 ${guide.name} 官方注册链接` : `Open ${guide.nameEn} Official Sign-up Link`}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                  {zh
                    ? "邀请码通常会自动带入；如未带入，请手动填写 getitpro 再提交注册表单。"
                    : "The referral code is usually prefilled; if not, manually enter getitpro before submitting the form."}
                </p>
              </div>
              <a
                href={INVITE_CODES[slug].referralLink}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black text-black transition hover:scale-[1.01]"
                style={{ background: guide.color }}
              >
                {zh ? "前往官方注册链接" : "Open Official Sign-up Link"}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </section>
        </main>

        <ScrollToTopButton color="cyan" />
      </div>
    </>
  );
}
