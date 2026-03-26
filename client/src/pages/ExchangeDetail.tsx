import { Link, useRoute } from "wouter";
import { ArrowLeft, CheckCircle2, Download, ExternalLink, Globe, Shield, TrendingUp, Users } from "lucide-react";
import { SeoManager } from "@/components/SeoManager";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { TrustSignalsCard } from "@/components/TrustSignalsCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { useExchangeLinks } from "@/contexts/ExchangeLinksContext";
import { goBack, useScrollMemory } from "@/hooks/useScrollMemory";
import { preloadRoute } from "@/lib/routePreload";
import { TRUST_LAST_REVIEWED } from "@/lib/trust";
import { EXCHANGE_FEES, INVITE_CODES, type ExchangeSlug } from "@shared/exchangeFees";

type ExchangeMeta = {
  name: string;
  color: string;
  logo: string;
  founded: string;
  hqZh: string;
  hqEn: string;
  coins: string;
  users: string;
  badgeZh: string;
  badgeEn: string;
  summaryZh: string;
  summaryEn: string;
  bestForZh: string;
  bestForEn: string;
  strengthsZh: string[];
  strengthsEn: string[];
  cautionsZh: string[];
  cautionsEn: string[];
  officialDownload: string;
  faqs: Array<{
    qZh: string;
    qEn: string;
    aZh: string;
    aEn: string;
  }>;
};

const EXCHANGE_META: Record<ExchangeSlug, ExchangeMeta> = {
  gate: {
    name: "Gate.io",
    color: "#00B173",
    logo: "🟢",
    founded: "2013",
    hqZh: "开曼群岛",
    hqEn: "Cayman Islands",
    coins: "3,600+",
    users: "1,400万+",
    badgeZh: "上币覆盖广",
    badgeEn: "Wide token coverage",
    summaryZh: "Gate.io 更适合想看更多新币、同时重视返佣和多样交易品类的用户。",
    summaryEn: "Gate.io is well suited to users who want broad token coverage, stronger rebate value, and more product variety.",
    bestForZh: "适合更早接触新币、做多品类交易，或长期重视手续费返还的用户。",
    bestForEn: "Best for users who want earlier exposure to listed tokens, more product choice, and stronger fee rebates over time.",
    strengthsZh: ["上币覆盖广", "返佣比例高", "现货、合约、理财品类完整"],
    strengthsEn: ["Broad token coverage", "Higher rebate ratio", "Strong spot, futures, and earn product mix"],
    cautionsZh: ["页面信息较多，首次使用建议慢一点看", "邀请码一般不能在注册后补填"],
    cautionsEn: ["The interface can feel dense for first-time users", "Referral codes usually cannot be added after registration"],
    officialDownload: "https://www.gate.com/mobileapp",
    faqs: [
      {
        qZh: "Gate.io 适合什么样的用户？",
        qEn: "Who is Gate.io suitable for?",
        aZh: "如果你比较看重新币覆盖和多品类交易，Gate.io 通常更合适。",
        aEn: "Gate.io is a good fit if you value broader market coverage and earlier exposure to listed tokens.",
      },
      {
        qZh: "邀请码没带入怎么办？",
        qEn: "What if the invite code is missing?",
        aZh: "直接在 Referral code 或 Invite code 栏手动填写 getitpro。",
        aEn: "Enter getitpro manually in the Referral code or Invite code field.",
      },
      {
        qZh: "注册后还能补填邀请码吗？",
        qEn: "Can the code be added after registration?",
        aZh: "通常不行，所以建议提交前先检查一次。",
        aEn: "Usually not, so it is best to verify the code before submitting.",
      },
    ],
  },
  okx: {
    name: "OKX",
    color: "#7EA7FF",
    logo: "🔵",
    founded: "2017",
    hqZh: "塞舌尔 / 巴哈马",
    hqEn: "Seychelles / Bahamas",
    coins: "350+",
    users: "5,000万+",
    badgeZh: "Web3 生态完整",
    badgeEn: "Strong Web3 ecosystem",
    summaryZh: "OKX 更适合想把交易、钱包和 Web3 入口放在一起管理的用户。",
    summaryEn: "OKX is better suited to users who want trading, wallet access, and Web3 entry points in one place.",
    bestForZh: "适合想兼顾中心化交易和链上使用场景的用户。",
    bestForEn: "Best for users who want both exchange trading and on-chain wallet access in the same ecosystem.",
    strengthsZh: ["Web3 钱包与交易所衔接顺畅", "主流币交易深度稳定", "官方客户端下载路径清晰"],
    strengthsEn: ["Strong wallet-to-exchange workflow", "Stable liquidity on major pairs", "Clear official download routes"],
    cautionsZh: ["部分地区 App 下载路径会有限制", "邀请码通常不能在注册后补填"],
    cautionsEn: ["App download routes may vary by region", "Referral codes usually cannot be added after registration"],
    officialDownload: "https://www.okx.com/download",
    faqs: [
      {
        qZh: "OKX 更适合哪类用户？",
        qEn: "What type of user is OKX best for?",
        aZh: "如果你除了交易，还打算使用钱包或链上入口，OKX 会更顺手。",
        aEn: "OKX is a strong choice if you also plan to use wallet and Web3 features alongside exchange trading.",
      },
      {
        qZh: "官网注册时邀请码在哪填？",
        qEn: "Where do I enter the invite code on the official sign-up page?",
        aZh: "在注册表单里的 Referral code 区域填写 getitpro。",
        aEn: "Enter getitpro in the referral code section on the sign-up form.",
      },
      {
        qZh: "如果 App Store 搜不到怎么办？",
        qEn: "What if the app does not appear in my App Store?",
        aZh: "优先参考 OKX 官方下载页说明，再决定是否切换地区商店。",
        aEn: "Check the official OKX download page first, then decide whether a region switch is needed.",
      },
    ],
  },
  binance: {
    name: "Binance",
    color: "#F0B90B",
    logo: "🟡",
    founded: "2017",
    hqZh: "开曼群岛",
    hqEn: "Cayman Islands",
    coins: "350+",
    users: "2.5亿+",
    badgeZh: "流动性强",
    badgeEn: "Deep liquidity",
    summaryZh: "Binance 更适合更在意主流币深度、成交效率和大平台稳定性的用户。",
    summaryEn: "Binance is a strong fit for users who care about liquidity, execution quality, and major-market depth.",
    bestForZh: "适合主流币交易频率较高、对深度和滑点更敏感的用户。",
    bestForEn: "Best for users trading major pairs frequently and paying close attention to depth and slippage.",
    strengthsZh: ["主流币流动性强", "品牌认知高", "客户端下载入口清晰"],
    strengthsEn: ["Strong liquidity on major pairs", "High brand recognition", "Straightforward official download routes"],
    cautionsZh: ["不同地区的合规与下载路径可能不同", "邀请码栏有时默认折叠"],
    cautionsEn: ["Regional availability and download routes may differ", "The referral field may be collapsed by default"],
    officialDownload: "https://www.binance.com/download",
    faqs: [
      {
        qZh: "Binance 适合什么情况？",
        qEn: "When is Binance a good choice?",
        aZh: "如果你主要交易主流币，而且更看重深度和成交效率，Binance 通常更合适。",
        aEn: "Binance is often a good choice if you mainly trade major pairs and care about liquidity and execution quality.",
      },
      {
        qZh: "邀请码要手动填吗？",
        qEn: "Do I need to enter the code manually?",
        aZh: "走合作链接时通常会自动带入；如果没有，就手动填 getitpro。",
        aEn: "The code is usually prefilled on the partner link. If not, enter getitpro manually.",
      },
      {
        qZh: "为什么我看不到邀请码栏？",
        qEn: "Why can’t I see the referral field?",
        aZh: "它有时会默认折叠，展开 Referral ID 或邀请码区域即可。",
        aEn: "It may be collapsed by default. Expand the Referral ID or referral code area.",
      },
    ],
  },
  bybit: {
    name: "Bybit",
    color: "#6EA8FF",
    logo: "🔷",
    founded: "2018",
    hqZh: "迪拜",
    hqEn: "Dubai",
    coins: "1,000+",
    users: "3,000万+",
    badgeZh: "合约体验突出",
    badgeEn: "Strong derivatives use case",
    summaryZh: "Bybit 更适合更关注合约、低 Maker 费率和跟单功能的用户。",
    summaryEn: "Bybit is a strong fit for users focused on derivatives, lower maker fees, and copy trading tools.",
    bestForZh: "适合更关注合约体验、费率与跟单场景的用户。",
    bestForEn: "Best for users who care more about derivatives, fees, and copy trading workflows.",
    strengthsZh: ["合约场景成熟", "Maker 费率低", "跟单功能辨识度高"],
    strengthsEn: ["Mature derivatives flow", "Low maker fees", "Recognizable copy trading features"],
    cautionsZh: ["部分地区访问与下载路径有差异", "老账户通常不能补填邀请码"],
    cautionsEn: ["Access and download routes vary by region", "Existing accounts usually cannot add the code later"],
    officialDownload: "https://www.bybit.com/download",
    faqs: [
      {
        qZh: "Bybit 更适合谁？",
        qEn: "Who is Bybit better for?",
        aZh: "如果你更关注合约交易和跟单功能，Bybit 会更匹配。",
        aEn: "Bybit is often a better fit if you focus on derivatives and copy trading.",
      },
      {
        qZh: "邀请码没显示怎么办？",
        qEn: "What if the invite code is not shown?",
        aZh: "进入原生官网注册页后，在邀请码区域手动填写 getitpro。",
        aEn: "On the native sign-up page, enter getitpro manually in the referral field.",
      },
      {
        qZh: "注册后还能改邀请码吗？",
        qEn: "Can the code be changed after registration?",
        aZh: "通常不行，所以第一次提交前最好确认一次。",
        aEn: "Usually not, so it is best to verify it before the first submission.",
      },
    ],
  },
  bitget: {
    name: "Bitget",
    color: "#9C6CFF",
    logo: "🟣",
    founded: "2018",
    hqZh: "塞舌尔",
    hqEn: "Seychelles",
    coins: "800+",
    users: "2,500万+",
    badgeZh: "跟单功能突出",
    badgeEn: "Strong copy trading",
    summaryZh: "Bitget 更适合关心跟单、简洁中文界面和长期返佣效率的用户。",
    summaryEn: "Bitget is a strong fit for users who value copy trading, a simpler interface, and long-term rebate efficiency.",
    bestForZh: "适合想用中文界面更快上手，并关注跟单或返佣效率的用户。",
    bestForEn: "Best for users who want a simpler flow, copy trading access, and stronger rebate efficiency.",
    strengthsZh: ["中文界面更容易上手", "跟单功能成熟", "返佣与活动入口较清楚"],
    strengthsEn: ["Cleaner Chinese interface", "Mature copy trading tools", "Clear rebate and campaign entry points"],
    cautionsZh: ["主流币深度略低于 Binance", "旧账户通常无法补填邀请码"],
    cautionsEn: ["Liquidity can be lower than Binance on some pairs", "Existing accounts usually cannot add the code later"],
    officialDownload: "https://www.bitget.com/download",
    faqs: [
      {
        qZh: "Bitget 更适合什么用户？",
        qEn: "Who is Bitget suitable for?",
        aZh: "如果你更看重中文界面、跟单体验和简单上手路径，Bitget 会更合适。",
        aEn: "Bitget is a good fit if you want a simpler UI, copy trading access, and a smoother onboarding flow.",
      },
      {
        qZh: "官网注册时邀请码怎么填？",
        qEn: "How do I enter the invite code on the official page?",
        aZh: "打开官网注册页后，找到 Invite code 或 Referral code 区域，手动填写 getitpro。",
        aEn: "Open the official sign-up page and enter getitpro in the Invite code or Referral code field.",
      },
      {
        qZh: "先下载 App 还是先注册？",
        qEn: "Should I download the app or register first?",
        aZh: "建议先在官网确认邀请码，再决定是否切到 App 完成后续步骤。",
        aEn: "It is better to confirm the invite code on the official web form first, then continue in the app if needed.",
      },
    ],
  },
};

const EXCHANGE_ORDER: ExchangeSlug[] = ["gate", "okx", "binance", "bybit", "bitget"];

export default function ExchangeDetail() {
  useScrollMemory();
  const { language } = useLanguage();
  const zh = language === "zh";
  const { getReferralLink, getInviteCode, getRebateRate } = useExchangeLinks();
  const [, params] = useRoute("/exchange/:slug");
  const rawSlug = (params?.slug ?? "gate") as ExchangeSlug;
  const slug = EXCHANGE_ORDER.includes(rawSlug) ? rawSlug : "gate";
  const meta = EXCHANGE_META[slug];
  const fee = EXCHANGE_FEES[slug];
  const inviteCode = getInviteCode(slug) || INVITE_CODES[slug].inviteCode;
  const referralLink = getReferralLink(slug);
  const rebateRate = getRebateRate(slug) || INVITE_CODES[slug].rebateRate;

  const sources = zh
    ? [
        { label: `${meta.name} 官方帮助中心`, href: meta.officialDownload },
        { label: `${meta.name} 官方下载页`, href: meta.officialDownload },
        { label: `${meta.name} 官方注册链接`, href: referralLink },
      ]
    : [
        { label: `${meta.name} official help`, href: meta.officialDownload },
        { label: `${meta.name} official download`, href: meta.officialDownload },
        { label: `${meta.name} official sign-up`, href: referralLink },
      ];

  return (
    <div className="min-h-screen bg-[#081a30] text-white">
      <SeoManager
        title={zh ? `${meta.name} 交易所说明 | Get8 Pro` : `${meta.name} Exchange Guide | Get8 Pro`}
        description={zh ? meta.summaryZh : meta.summaryEn}
        path={`/exchange/${slug}`}
      />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#081a30]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <button type="button" onClick={() => goBack()} className="tap-target inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            {zh ? "返回" : "Back"}
          </button>
          <div className="text-sm font-semibold text-slate-300">
            {zh ? `${meta.name} 交易所说明` : `${meta.name} Exchange Guide`}
          </div>
          <Link
            href="/exchanges"
            className="tap-target text-sm text-slate-400 transition hover:text-white"
            onMouseEnter={() => preloadRoute("/exchanges")}
            onTouchStart={() => preloadRoute("/exchanges")}
          >
            {zh ? "交易所总览" : "All exchanges"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <section className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_32%),linear-gradient(180deg,rgba(9,18,32,0.96),rgba(5,10,20,0.98))] px-6 py-8 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 px-3 py-1 text-xs font-semibold text-slate-300">
                <span>{meta.logo}</span>
                <span>{zh ? meta.badgeZh : meta.badgeEn}</span>
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
                {meta.name}
              </h1>
              <p className="mt-4 text-base leading-8 text-slate-300">
                {zh ? meta.summaryZh : meta.summaryEn}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                {zh ? meta.bestForZh : meta.bestForEn}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-[320px]">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">{zh ? "成立时间" : "Founded"}</div>
                <div className="mt-2 text-lg font-bold text-white">{meta.founded}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">{zh ? "总部" : "HQ"}</div>
                <div className="mt-2 text-lg font-bold text-white">{zh ? meta.hqZh : meta.hqEn}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">{zh ? "支持币种" : "Coins"}</div>
                <div className="mt-2 text-lg font-bold text-white">{meta.coins}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">{zh ? "用户规模" : "Users"}</div>
                <div className="mt-2 text-lg font-bold text-white">{meta.users}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          <a
            href={referralLink}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-target rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6 transition hover:border-emerald-400/40 hover:bg-emerald-500/15"
          >
            <div className="mb-4 flex items-center gap-3">
              <Shield className="h-5 w-5 text-emerald-300" />
              <div className="text-sm font-semibold text-emerald-200">{zh ? "官方注册链接" : "Official sign-up link"}</div>
            </div>
            <div className="text-xl font-black text-white">{zh ? "前往官方注册链接" : "Open official sign-up"}</div>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {zh
                ? `邀请码已自动带入；如未带入请填写 ${inviteCode}。`
                : `The invite code should be prefilled. If not, enter ${inviteCode} manually.`}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200">
              <ExternalLink className="h-4 w-4" />
              {zh ? `默认返佣 ${rebateRate}` : `Default rebate ${rebateRate}`}
            </div>
          </a>

          <Link
            href={`/exchange-download?exchange=${slug}&mode=partner#registration-guide`}
            className="tap-target rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-6 transition hover:border-cyan-400/40 hover:bg-cyan-500/15"
            onMouseEnter={() => preloadRoute(`/exchange-download?exchange=${slug}&mode=partner#registration-guide`)}
            onTouchStart={() => preloadRoute(`/exchange-download?exchange=${slug}&mode=partner#registration-guide`)}
          >
            <div className="mb-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-cyan-300" />
              <div className="text-sm font-semibold text-cyan-200">{zh ? "注册与邀请码教学" : "Registration tutorial"}</div>
            </div>
            <div className="text-xl font-black text-white">{zh ? "查看完整教学" : "Open full tutorial"}</div>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {zh
                ? "在一个页面里看完官网登录、邀请码填写、下载路径和截图说明。"
                : "See the official sign-up flow, invite code steps, download path, and screenshot guide in one page."}
            </p>
          </Link>

          <a
            href={meta.officialDownload}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-target rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20 hover:bg-white/10"
          >
            <div className="mb-4 flex items-center gap-3">
              <Download className="h-5 w-5 text-slate-300" />
              <div className="text-sm font-semibold text-slate-200">{zh ? "官方客户端下载" : "Official download"}</div>
            </div>
            <div className="text-xl font-black text-white">{zh ? "打开官方下载页" : "Open official download page"}</div>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {zh
                ? "如果你更习惯先安装 App 或桌面端，可以直接从这里去官方入口。"
                : "If you prefer installing the app or desktop client first, use the official download page here."}
            </p>
          </a>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-amber-300" />
              <div className="text-sm font-semibold text-slate-200">{zh ? "费率与返佣" : "Fees & rebate"}</div>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between"><span>{zh ? "现货 Maker" : "Spot Maker"}</span><span className="font-bold text-white">{fee.spotMaker}</span></div>
              <div className="flex items-center justify-between"><span>{zh ? "现货 Taker" : "Spot Taker"}</span><span className="font-bold text-white">{fee.spotTaker}</span></div>
              <div className="flex items-center justify-between"><span>{zh ? "合约 Maker" : "Futures Maker"}</span><span className="font-bold text-white">{fee.futMaker}</span></div>
              <div className="flex items-center justify-between"><span>{zh ? "合约 Taker" : "Futures Taker"}</span><span className="font-bold text-white">{fee.futTaker}</span></div>
              <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-200">
                {zh ? `默认返佣比例：${rebateRate}` : `Default rebate rate: ${rebateRate}`}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center gap-3">
              <Users className="h-5 w-5 text-cyan-300" />
              <div className="text-sm font-semibold text-slate-200">{zh ? "更适合谁" : "Best fit"}</div>
            </div>
            <p className="text-sm leading-7 text-slate-300">{zh ? meta.bestForZh : meta.bestForEn}</p>
            <div className="mt-5 space-y-2">
              {(zh ? meta.strengthsZh : meta.strengthsEn).map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center gap-3">
              <Globe className="h-5 w-5 text-rose-300" />
              <div className="text-sm font-semibold text-slate-200">{zh ? "使用提醒" : "Cautions"}</div>
            </div>
            <div className="space-y-3 text-sm leading-7 text-slate-300">
              {(zh ? meta.cautionsZh : meta.cautionsEn).map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-[#081423] px-4 py-3">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-black text-white">{zh ? "常见问题" : "FAQ"}</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {meta.faqs.map((faq) => (
              <div key={faq.qZh} className="rounded-2xl border border-white/10 bg-[#081423] p-5">
                <h3 className="text-base font-bold text-white">{zh ? faq.qZh : faq.qEn}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{zh ? faq.aZh : faq.aEn}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8">
          <TrustSignalsCard
            zh={zh}
            title={zh ? "作者、审核与披露" : "Authorship, Review & Disclosure"}
            summary={
              zh
                ? "这一页把官方入口、费用、邀请码提示和披露信息放在一起，方便你在跳转前先判断信息是否清楚。"
                : "This page keeps the official links, fee overview, invite-code notes, and disclosures together before you continue."
            }
            author={zh ? "Get8 Pro 编辑团队" : "Get8 Pro Editorial Team"}
            reviewer={zh ? "Get8 Pro 内容审核" : "Get8 Pro Editorial Review"}
            updatedAt={TRUST_LAST_REVIEWED}
            sources={sources}
            disclosure={
              zh
                ? `Get8 Pro 可能从官方合作邀请计划获得收益，但不会替代风险提示；邀请码为 ${inviteCode}，默认返佣 ${rebateRate}，老账户是否可绑定以平台规则为准。`
                : `Get8 Pro may receive revenue through official partner programs, but that does not replace risk disclosures. The invite code is ${inviteCode}, the default rebate is ${rebateRate}, and existing-account eligibility depends on platform rules.`}
          />
        </div>
      </main>

      <ScrollToTopButton color="cyan" />
    </div>
  );
}
