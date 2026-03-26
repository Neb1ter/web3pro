/**
 * ExchangeDownload.tsx
 * 新手下载交易所 + 三步快速上手 次级页面
 * 路由: /exchange-download
 * 从 /crypto-saving 点击「新手不知道怎么下载？」入口进入
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useExchangeLinks } from '@/contexts/ExchangeLinksContext';
import { useScrollMemory, goBack } from "@/hooks/useScrollMemory";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Download, CheckCircle2, Shield, Gift,
  Smartphone, Globe, Zap, AlertTriangle, ExternalLink,
  ChevronRight, Star, Users, Lock
} from "lucide-react";

const EXCHANGE_META: Record<string, {
  emoji: string;
  color: string;
  borderColor: string;
  platform: string[];
  highlight: string;
  tip: { zh: string; en: string };
  steps: { zh: string[]; en: string[] };
}> = {
  gate: {
    emoji: "🟢",
    color: "from-emerald-900/60 to-slate-900",
    borderColor: "border-emerald-500/30",
    platform: ["iOS", "Android", "Web"],
    highlight: "储备金率 125%，全球首家 100% 储备承诺",
    tip: {
      zh: "Gate.io 在 App Store 搜索「Gate.io」即可找到，注意认准官方图标。",
      en: "Search 'Gate.io' on App Store or Google Play. Make sure to download the official app."
    },
    steps: {
      zh: ["进入 App Store / Google Play，搜索「Gate.io」", "点击安装，打开 App 后点「注册」", "填写手机号或邮箱，输入邀请码，完成 KYC 实名认证"],
      en: ["Search 'Gate.io' on App Store / Google Play", "Install the app, tap 'Register'", "Enter phone/email, input referral code, complete KYC verification"]
    }
  },
  okx: {
    emoji: "🔷",
    color: "from-blue-900/60 to-slate-900",
    borderColor: "border-blue-500/30",
    platform: ["iOS", "Android", "Web", "Desktop"],
    highlight: "德国/波兰正式监管牌照，CoinGlass 评分 88.77",
    tip: {
      zh: "OKX 在中国区 App Store 下架，需切换海外 Apple ID 或使用 APK 安装包。",
      en: "OKX may not be available in some regions on App Store. Use a foreign Apple ID or download the APK directly."
    },
    steps: {
      zh: ["访问 okx.com 官网，点击「下载 App」", "iOS 用户需使用海外 Apple ID，Android 用户可直接下载 APK", "注册账号，填写邀请码，完成身份验证"],
      en: ["Visit okx.com, click 'Download App'", "iOS users may need a foreign Apple ID; Android users can download APK directly", "Register, enter referral code, complete identity verification"]
    }
  },
  binance: {
    emoji: "🟡",
    color: "from-yellow-900/60 to-slate-900",
    borderColor: "border-yellow-500/30",
    platform: ["iOS", "Android", "Web", "Desktop"],
    highlight: "全球最大，2.5 亿+ 注册用户，市场份额约 40%",
    tip: {
      zh: "币安在中国区 App Store 下架，需切换海外 Apple ID。Android 用户可访问 binance.com 下载 APK。",
      en: "Binance may not be available in some regions. Android users can download the APK from binance.com."
    },
    steps: {
      zh: ["访问 binance.com，点击「下载」", "iOS 用户切换海外 Apple ID 后搜索「Binance」，Android 用户下载 APK", "注册账号，在邀请码栏填写专属码，完成 KYC"],
      en: ["Visit binance.com, click 'Download'", "iOS: use a foreign Apple ID; Android: download APK from the website", "Register, enter referral code in the invitation field, complete KYC"]
    }
  },
  bybit: {
    emoji: "🔵",
    color: "from-orange-900/60 to-slate-900",
    borderColor: "border-orange-500/30",
    platform: ["iOS", "Android", "Web"],
    highlight: "荷兰持牌，Hacken 每月储备金证明审计",
    tip: {
      zh: "Bybit 在 App Store 可直接搜索「Bybit」下载，部分地区需要海外账号。",
      en: "Search 'Bybit' on App Store or Google Play. Some regions may require a foreign account."
    },
    steps: {
      zh: ["App Store / Google Play 搜索「Bybit」", "安装后点「注册」，选择手机号或邮箱注册", "填写邀请码，完成邮箱/手机验证和 KYC 实名"],
      en: ["Search 'Bybit' on App Store / Google Play", "Tap 'Register', choose phone or email", "Enter referral code, complete email/phone verification and KYC"]
    }
  },
  bitget: {
    emoji: "🟣",
    color: "from-teal-900/60 to-slate-900",
    borderColor: "border-teal-500/30",
    platform: ["iOS", "Android", "Web"],
    highlight: "CoinGlass 综合评分 83.10，跟单交易领先平台",
    tip: {
      zh: "Bitget 在 App Store 可直接搜索「Bitget」下载，支持中文界面。",
      en: "Search 'Bitget' on App Store or Google Play. Chinese interface is supported."
    },
    steps: {
      zh: ["App Store / Google Play 搜索「Bitget」", "安装后点「注册」，填写手机号或邮箱", "输入邀请码，完成验证和 KYC 实名认证"],
      en: ["Search 'Bitget' on App Store / Google Play", "Tap 'Register', enter phone or email", "Enter referral code, complete verification and KYC"]
    }
  }
};

const COMMON_TIPS = {
  zh: [
    { icon: <Shield className="w-5 h-5 text-emerald-400" />, title: "只从官网下载", desc: "务必通过交易所官网或官方 App Store 下载，避免钓鱼网站和假冒 App。" },
    { icon: <Lock className="w-5 h-5 text-blue-400" />, title: "注册时填写邀请码", desc: "注册完成后无法补填邀请码，请在注册页面的「邀请码/推荐码」栏填写，确保享有返佣权益。" },
    { icon: <AlertTriangle className="w-5 h-5 text-amber-400" />, title: "KYC 实名认证", desc: "大多数交易所需要身份证/护照照片进行实名认证，这是合规要求，信息由交易所加密保存。" },
    { icon: <Smartphone className="w-5 h-5 text-purple-400" />, title: "iOS 海外账号", desc: "若 App Store 找不到，需切换至香港/美国区 Apple ID。可在网上购买或自行注册海外 Apple ID。" },
    { icon: <Globe className="w-5 h-5 text-cyan-400" />, title: "网络访问", desc: "部分地区需要使用 VPN 才能访问交易所官网和 App，建议提前准备好稳定的网络工具。" },
    { icon: <Star className="w-5 h-5 text-yellow-400" />, title: "新手建议从小额开始", desc: "首次入金建议从小额（如 100 USDT）开始，熟悉平台操作后再逐步增加资金。" },
  ],
  en: [
    { icon: <Shield className="w-5 h-5 text-emerald-400" />, title: "Download from official sources only", desc: "Always download from the official website or App Store. Avoid phishing sites and fake apps." },
    { icon: <Lock className="w-5 h-5 text-blue-400" />, title: "Enter referral code during registration", desc: "Referral codes cannot be added after registration. Enter it in the 'Referral Code' field during sign-up to ensure rebate benefits." },
    { icon: <AlertTriangle className="w-5 h-5 text-amber-400" />, title: "KYC identity verification", desc: "Most exchanges require ID/passport photos for KYC. This is a compliance requirement; your information is encrypted and stored securely." },
    { icon: <Smartphone className="w-5 h-5 text-purple-400" />, title: "iOS foreign account", desc: "If the app is not available in your region's App Store, switch to a Hong Kong/US Apple ID." },
    { icon: <Globe className="w-5 h-5 text-cyan-400" />, title: "Network access", desc: "Some regions may require a VPN to access exchange websites and apps. Prepare a stable VPN tool in advance." },
    { icon: <Star className="w-5 h-5 text-yellow-400" />, title: "Start small as a beginner", desc: "For your first deposit, start with a small amount (e.g., 100 USDT) to get familiar with the platform before increasing funds." },
  ]
};

export default function ExchangeDownload() {
  useScrollMemory();
  const { language } = useLanguage();
  const zh = language === "zh";
  const [, navigate] = useLocation();
  const [activeExchange, setActiveExchange] = useState("gate");
  const { allLinks: exchangeLinksData } = useExchangeLinks();

  const meta = EXCHANGE_META[activeExchange];
  const exchangeData = exchangeLinksData.find(e => e.slug === activeExchange);
  const tips = COMMON_TIPS[zh ? "zh" : "en"];

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(180deg, #0A192F 0%, #0d1f35 100%)' }}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-amber-500/15 backdrop-blur-sm" style={{ background: 'rgba(10,25,47,0.95)' }}>
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <button
            onClick={() => goBack()}
            className="flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{zh ? "返回" : "Back"}</span>
          </button>
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-amber-400" />
            <span className="font-black text-sm text-white">
              {zh ? "交易所下载指南" : "Exchange Download Guide"}
            </span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* ── Hero ── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4 border"
            style={{ background: 'rgba(255,215,0,0.08)', borderColor: 'rgba(255,215,0,0.25)', color: '#FFD700' }}>
            <span className="animate-pulse">●</span>
            {zh ? "新手专属下载指南" : "Beginner Download Guide"}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
            {zh ? "三步完成交易所注册" : "3 Steps to Register an Exchange"}
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-xl mx-auto">
            {zh
              ? "从下载 App 到填写邀请码，全程图文说明，5 分钟完成注册，立即享受返佣福利。"
              : "From downloading the app to entering the referral code — step-by-step guide, complete registration in 5 minutes and start earning rebates."}
          </p>
          <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-left text-sm leading-6 text-amber-100">
            <p className="font-bold text-amber-300">
              {zh ? '新用户默认 20% 返佣，想要更高额度请直接联系我。' : 'New users start with a default 20% rebate. Contact me if you need a higher rate.'}
            </p>
            <p className="mt-2">
              {zh ? '老账户通常无法补绑返佣；目前优先支持 5 家交易所，如果你需要其他平台，也可以直接联系我。' : 'Existing accounts usually cannot be retrofitted. We currently support 5 exchanges, and you can contact me if you need another platform.'}
            </p>
          </div>
        </div>

        {/* ── Exchange Selector ── */}
        <div className="mb-8">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
            {zh ? "选择你想下载的交易所" : "Choose an exchange to download"}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(EXCHANGE_META).map(([slug, m]) => {
              const exData = exchangeLinksData.find(e => e.slug === slug);
              return (
                <button
                  key={slug}
                  onClick={() => setActiveExchange(slug)}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                    activeExchange === slug
                      ? `bg-gradient-to-b ${m.color} ${m.borderColor} scale-105 shadow-lg`
                      : "border-white/10 hover:border-white/25 hover:bg-white/3"
                  }`}
                >
                  <span className="text-3xl">{m.emoji}</span>
                  <span className="text-xs font-black text-white capitalize">{slug === "gate" ? "Gate.io" : slug.charAt(0).toUpperCase() + slug.slice(1)}</span>
                  {exData?.rebateRate && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,215,0,0.12)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.2)' }}>
                      {zh ? `返佣 ${exData.rebateRate}` : `${exData.rebateRate} rebate`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Selected Exchange Detail ── */}
        {meta && (
          <div className={`rounded-2xl border ${meta.borderColor} bg-gradient-to-br ${meta.color} p-6 mb-8`}>
            <div className="flex items-start gap-4 mb-6">
              <span className="text-5xl">{meta.emoji}</span>
              <div className="flex-1">
                <h2 className="text-xl font-black text-white mb-1 capitalize">
                  {activeExchange === "gate" ? "Gate.io" : activeExchange.charAt(0).toUpperCase() + activeExchange.slice(1)}
                </h2>
                <p className="text-slate-400 text-sm mb-2">{meta.highlight}</p>
                <div className="flex flex-wrap gap-2">
                  {meta.platform.map(p => (
                    <span key={p} className="text-xs bg-white/10 border border-white/15 text-slate-300 px-2 py-0.5 rounded-full">{p}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* 三步骤 */}
            <div className="space-y-4 mb-6">
              <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">
                {zh ? "下载 & 注册步骤" : "Download & Registration Steps"}
              </h3>
              {(zh ? meta.steps.zh : meta.steps.en).map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm font-black text-black"
                    style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)' }}>
                    {i + 1}
                  </div>
                  <p className="text-slate-200 text-sm leading-relaxed pt-0.5">{step}</p>
                </div>
              ))}
            </div>

            {/* 小贴士 */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-amber-200 text-sm leading-relaxed">
                  {zh ? meta.tip.zh : meta.tip.en}
                </p>
              </div>
            </div>

            {/* 下载按钮 */}
            {exchangeData?.referralLink && (
              <a
                href={exchangeData.referralLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-black text-black text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', boxShadow: '0 4px 20px rgba(255,215,0,0.3)' }}
              >
                <Download className="w-5 h-5" />
                {zh ? "前往官方注册链接" : "Open Official Sign-up Link"}
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {exchangeData?.referralLink && (
              <p className="mt-3 text-center text-xs leading-relaxed text-slate-400">
                {zh ? "邀请码已自动带入；如未带入请填写 getitpro" : "Referral code is prefilled; if not, enter getitpro"}
              </p>
            )}
            <Link href={`/exchange-registration/${activeExchange}`} className="mt-4 block">
              <button
                type="button"
                className="tap-target w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {zh ? "查看完整注册与下载教学" : "View Full Sign-up Guide"}
              </button>
            </Link>
          </div>
        )}

        {/* ── 通用注意事项 ── */}
        <div className="mb-10">
          <h2 className="text-lg font-black text-white mb-4">
            {zh ? "📋 注册前必读" : "📋 Must Read Before Registering"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/3 p-4">
                <div className="shrink-0 mt-0.5">{tip.icon}</div>
                <div>
                  <h3 className="text-sm font-black text-white mb-1">{tip.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 邀请码汇总 ── */}
        <div className="rounded-2xl border border-amber-500/25 p-6 mb-10" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.05) 0%, rgba(10,25,47,0.8) 100%)' }}>
          <h2 className="text-lg font-black text-white mb-1">
            {zh ? "🎁 专属邀请码汇总" : "🎁 Exclusive Referral Codes"}
          </h2>
          <p className="text-slate-400 text-sm mb-5">
            {zh ? "注册时填写以下邀请码，享受终身手续费返佣。" : "Enter these referral codes during registration to enjoy lifetime fee rebates."}
          </p>
          <div className="space-y-3">
            {exchangeLinksData.map((ex) => (
              <div key={ex.slug} className="flex items-center justify-between gap-4 rounded-xl border border-white/8 bg-white/3 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{EXCHANGE_META[ex.slug]?.emoji ?? "💱"}</span>
                  <div>
                    <span className="font-black text-white text-sm">{ex.name}</span>
                    {ex.rebateRate && (
                      <span className="ml-2 text-xs font-bold" style={{ color: '#FFD700' }}>返佣 {ex.rebateRate}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {ex.inviteCode && (
                    <code className="text-xs font-mono bg-white/8 border border-white/15 text-amber-300 px-2.5 py-1 rounded-lg">
                      {ex.inviteCode}
                    </code>
                  )}
                  {ex.referralLink && (
                    <a
                      href={ex.referralLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      {zh ? "官方注册链接" : "Official Sign-up Link"}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 完成后去哪里 ── */}
        <div className="rounded-2xl border border-white/10 bg-white/3 p-6 mb-10">
          <h2 className="text-lg font-black text-white mb-4">
            {zh ? "✅ 注册完成后，下一步做什么？" : "✅ After registration, what's next?"}
          </h2>
          <div className="space-y-3">
            {(zh ? [
              { icon: <Gift className="w-5 h-5 text-amber-400" />, title: "确认返佣已激活", desc: "登录账号后，在「个人中心 → 返佣」或「邀请返佣」页面确认返佣状态已激活。", action: "前往返佣说明", href: "/crypto-saving" },
              { icon: <Zap className="w-5 h-5 text-blue-400" />, title: "了解交易所功能", desc: "不熟悉现货/合约/杠杆？前往交易所扫盲指南，从零了解每个功能。", action: "查看功能指南", href: "/exchange-guide" },
              { icon: <Users className="w-5 h-5 text-emerald-400" />, title: "有疑问？看新手问答", desc: "注册遇到问题？返佣没有到账？前往新手问答页面查找解答。", action: "新手问答", href: "/beginner" },
            ] : [
              { icon: <Gift className="w-5 h-5 text-amber-400" />, title: "Confirm rebate is activated", desc: "After logging in, go to 'Profile → Rebates' or 'Referral Rebates' to confirm your rebate status is active.", action: "Trading Cost Guide", href: "/crypto-saving" },
              { icon: <Zap className="w-5 h-5 text-blue-400" />, title: "Learn exchange features", desc: "Not familiar with spot/futures/margin? Visit the Exchange Guide to learn each feature from scratch.", action: "Feature Guide", href: "/exchange-guide" },
              { icon: <Users className="w-5 h-5 text-emerald-400" />, title: "Have questions? Check FAQ", desc: "Having trouble registering? Rebate not credited? Visit our FAQ page for answers.", action: "FAQ", href: "/beginner" },
            ]).map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/3 p-4">
                <div className="shrink-0 mt-0.5">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-white mb-1">{item.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed mb-2">{item.desc}</p>
                  <button
                    onClick={() => navigate(item.href)}
                    className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    {item.action}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 底部 CTA ── */}
        <div className="rounded-2xl border border-amber-500/25 p-8 text-center" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.06) 0%, rgba(10,25,47,0.9) 100%)' }}>
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-xl font-black text-white mb-2">
            {zh ? "准备好了吗？" : "Ready to get started?"}
          </h3>
          <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
            {zh
              ? "选择一家交易所，通过专属链接注册，立即开始享受永久返佣福利。"
              : "Choose an exchange, register via our exclusive link, and start enjoying lifetime rebate benefits."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="font-black hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#0A192F' }}
              onClick={() => navigate("/exchanges")}
            >
              <Zap className="mr-2 w-5 h-5" />
              {zh ? "查看全部返佣链接" : "View All Rebate Links"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 font-bold"
              onClick={() => navigate("/crypto-saving")}
            >
              {zh ? "返回交易成本指南" : "Back to Trading Cost Guide"}
            </Button>
          </div>
        </div>
      </div>

      <ScrollToTopButton color="yellow" />
    </div>
  );
}
