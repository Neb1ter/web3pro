import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useScrollMemory } from '@/hooks/useScrollMemory';
import OnboardingPrompt from "@/components/OnboardingPrompt";
import { useLanguage } from "@/contexts/LanguageContext";

// ============================================================
// 多语言文案
// ============================================================
const LANG = {
  zh: {
    badge: "Web3 专业交易者的可信导航仪",
    h1a: "Get it, ",
    h1b: "Get Pro.",
    h1c: "",
    h1sub: "Web3 交易者的晋升之路",
    desc: "消除信息不对称，重建行业信任链。我们通过官方合作返佣与权威数据分析，降低交易成本，提升决策效率。在 Get8 Pro，像专业交易者一样思考、决策、盈利。",
    stat1v: "5", stat1u: "大板块", stat1l: "内容模块",
    stat2v: "5+", stat2u: "家交易所", stat2l: "合作平台",
    stat3v: "永久", stat3u: "个性化返佣", stat3l: "终身有效",
    bannerLabel: "合作平台",
    sectionTitle: "选择你的学习路径",
    sectionSub: "五大核心板块，覆盖从入门到实操的完整旅程",
    comingSoonBadge: "即将推出",
    comingSoonTitle: "更多板块正在建设中",
    lockLabel: "敬请期待",
    footerCopy: "© 2026 Get8 Pro · 官方认证，专业致胜。",
    footerDisclaimer: "内容仅供参考，不构成投资建议。投资有风险，入市需谨慎。",
    contactUs: "联系我们",
    langBtn: "EN",
    modules: [
      {
        badge: "NEW",
        subtitle: "WEB3 ONBOARDING",
        title: "Web3 入圈指南",
        description: "拒绝噪音，回归基本面。我们聚合官方文档与链上数据，为你构建机构级的 Web3 知识体系。从宏观经济到赛道分析，像专业人士一样思考，做出理性决策。",
        tags: ["区块链基础", "DeFi 入门", "投资路径", "CEX vs DEX"],
        cta: "开始探索 Web3 →",
        stats: [{ label: "核心概念", value: "12+" }, { label: "投资方式", value: "4种" }, { label: "适合人群", value: "零基础" }],
      },
      {
        badge: "HOT",
        subtitle: "CRYPTO SAVING GUIDE",
        title: "币圈省钱指南",
        description: "每一笔返佣，都来自交易所官方合作协议。返佣比例公开、结算记录可查。在 Get8 Pro，信任无需猜测，成本清晰可见。",
        tags: ["邀请码返佣", "手续费对比", "交易所评测", "新手注册"],
        cta: "查看省钱攻略 →",
        stats: [{ label: "合作交易所", value: "5家" }, { label: "永久返佣", value: "个性化" }, { label: "已服务用户", value: "持续增长" }],
      },
      {
        badge: "GUIDE",
        subtitle: "EXCHANGE TUTORIAL",
        title: "交易所扫盲指南",
        description: "基于独立评测模型，我们对各大交易所进行安全性、流动性、合规性三维评分。不因佣金高低改变评分，敢于曝光风险，助你安全交易。",
        tags: ["现货交易", "合约入门", "理财产品", "跟单交易", "交易所对比"],
        cta: "开始扫盲 →",
        stats: [{ label: "功能板块", value: "13个" }, { label: "覆盖交易所", value: "5家" }, { label: "互动测验", value: "全程" }],
      },
      {
        badge: "TOOLS",
        subtitle: "CRYPTO TOOLS HUB",
        title: "币圈工具合集",
        description: "精选新手到专业交易者都能用到的加密货币工具，标注工具来源与功能，涵盖行情查询、图表分析、链上数据、DeFi、税务等多个层面。",
        tags: ["行情查询", "链上数据", "DeFi 工具", "图表分析", "税务工具"],
        cta: "查看工具合集 →",
        stats: [{ label: "工具数量", value: "12+" }, { label: "适合人群", value: "全级别" }, { label: "持续更新", value: "实时" }],
      },
      {
        badge: "LIVE",
        subtitle: "CRYPTO NEWS",
        title: "加密快讯",
        description: "实时聚合律动BlockBeats、深潮TechFlow等权威媒体快讯，自动分类行情、政策、交易所、DeFi 等板块，第一时间掌握市场动态，不错过任何重要信号。",
        tags: ["实时快讯", "行情动态", "政策监管", "交易所公告", "DeFi 资讯"],
        cta: "查看最新快讯 →",
        stats: [{ label: "更新频率", value: "30分钟" }, { label: "快讯来源", value: "3家" }, { label: "分类标签", value: "6种" }],
      },
    ],
    comingSoon: [
      { icon: "📊", title: "量化策略指南", desc: "自动化交易策略与量化工具介绍" },
      { icon: "🔐", title: "Web3 安全手册", desc: "钱包安全、防骗指南与资产保护" },
      { icon: "🌐", title: "NFT 与元宇宙", desc: "数字资产、NFT 投资与元宇宙入门" },
    ],
    footer: {
      tagline: "Get8 Pro: 官方认证，专业致胜。",
      columns: [
        { title: "学习与指南", links: [{ label: "Web3 入圈指南", href: "/web3-guide" }, { label: "币圈省钱指南", href: "/crypto-saving" }, { label: "交易所扫盲", href: "/exchange-guide" }, { label: "下载交易所", href: "/exchange-download" }, { label: "知识测评", href: "/web3-quiz" }] },
        { title: "交易与工具", links: [{ label: "交易所对比", href: "/exchanges" }, { label: "币圈工具合集", href: "/tools" }, { label: "现货模拟", href: "/sim/spot" }, { label: "合约模拟", href: "/sim/futures" }, { label: "杠杆模拟", href: "/sim/margin" }] },
        { title: "支持与关于", links: [{ label: "联系我们", href: "/contact" }, { label: "新手入门", href: "/beginner" }, { label: "加密货币科普", href: "/crypto-intro" }, { label: "加密快讯", href: "/crypto-news" }] },
        { title: "法律与合规", links: [{ label: "免责声明", href: "/legal#disclaimer" }, { label: "风险提示", href: "/legal#risk" }] },
      ],
      copyright: "© 2026 Get8 Pro",
      disclaimer: "内容仅供参考，不构成投资建议。投资有风险，入市需谨慎。",
    },
  },
  en: {
    badge: "The Trusted Navigator for Web3 Professionals",
    h1a: "Get it, ",
    h1b: "Get Pro.",
    h1c: "",
    h1sub: "From Trader. To Pro.",
    desc: "Eliminating information asymmetry. Rebuilding industry trust. We provide officially-partnered rebates and authority-backed data analysis to lower your trading costs and sharpen your decisions.",
    stat1v: "5", stat1u: "Modules", stat1l: "Content Areas",
    stat2v: "5+", stat2u: "Exchanges", stat2l: "Partners",
    stat3v: "Lifetime", stat3u: "Personalized Rebates", stat3l: "Forever Valid",
    bannerLabel: "Partners",
    sectionTitle: "Choose Your Learning Path",
    sectionSub: "Five core modules covering the complete journey from beginner to trader",
    comingSoonBadge: "Coming Soon",
    comingSoonTitle: "More Modules Under Construction",
    lockLabel: "Stay Tuned",
    footerCopy: "© 2026 Get8 Pro · Officially Verified, Professionally Vetted.",
    footerDisclaimer: "Content is for reference only and does not constitute investment advice. Invest responsibly.",
    contactUs: "Contact Us",
    langBtn: "中文",
    modules: [
      {
        badge: "NEW",
        subtitle: "WEB3 ONBOARDING",
        title: "Web3 Onboarding Guide",
        description: "Cut through the noise. We aggregate official documentation and on-chain data to build an institutional-grade Web3 knowledge base — from macro economics to sector analysis, think like a pro.",
        tags: ["Blockchain Basics", "DeFi Intro", "Investment Paths", "CEX vs DEX"],
        cta: "Start Exploring Web3 →",
        stats: [{ label: "Core Concepts", value: "12+" }, { label: "Invest Methods", value: "4" }, { label: "For", value: "Beginners" }],
      },
      {
        badge: "HOT",
        subtitle: "CRYPTO SAVING GUIDE",
        title: "Crypto Saving Guide",
        description: "Every rebate is sourced from official exchange partnership agreements. Rebate rates are public, settlement records are verifiable. At Get8 Pro, trust is not assumed — it's proven.",
        tags: ["Referral Rebates", "Fee Comparison", "Exchange Reviews", "Beginner Sign-up"],
        cta: "View Saving Tips →",
        stats: [{ label: "Partner Exchanges", value: "5+" }, { label: "Lifetime Rebates", value: "Custom" }, { label: "Users Served", value: "Growing" }],
      },
      {
        badge: "GUIDE",
        subtitle: "EXCHANGE TUTORIAL",
        title: "Exchange Tutorial",
        description: "Built on an independent review model, we score exchanges across three dimensions: security, liquidity, and compliance. We don't change ratings for higher commissions — we expose risks.",
        tags: ["Spot Trading", "Futures Basics", "Earn Products", "Copy Trading", "Exchange Compare"],
        cta: "Start Learning →",
        stats: [{ label: "Feature Modules", value: "13" }, { label: "Exchanges", value: "5" }, { label: "Quizzes", value: "All" }],
      },
      {
        badge: "TOOLS",
        subtitle: "CRYPTO TOOLS HUB",
        title: "Crypto Tools Hub",
        description: "Curated crypto tools for beginners to pro traders — with source labels and function descriptions. Covers price data, charts, on-chain analytics, DeFi, tax tools, and more.",
        tags: ["Price Data", "On-Chain", "DeFi Tools", "Chart Analysis", "Tax Tools"],
        cta: "View Tools Hub →",
        stats: [{ label: "Tools", value: "12+" }, { label: "For", value: "All Levels" }, { label: "Updated", value: "Live" }],
      },
      {
        badge: "LIVE",
        subtitle: "CRYPTO NEWS",
        title: "Crypto News Feed",
        description: "Real-time aggregation from BlockBeats, TechFlow and other authoritative sources. Auto-categorized into market, policy, exchange, and DeFi — never miss a signal that matters.",
        tags: ["Live News", "Market Updates", "Policy Watch", "Exchange Alerts", "DeFi News"],
        cta: "View Latest News →",
        stats: [{ label: "Update Cycle", value: "30 min" }, { label: "Sources", value: "3" }, { label: "Categories", value: "6" }],
      },
    ],
    comingSoon: [
      { icon: "📊", title: "Quant Strategy Guide", desc: "Automated trading strategies and quant tools" },
      { icon: "🔐", title: "Web3 Security Manual", desc: "Wallet safety, scam prevention, and asset protection" },
      { icon: "🌐", title: "NFT & Metaverse", desc: "Digital assets, NFT investing, and metaverse intro" },
    ],
    footer: {
      tagline: "Get8 Pro: Officially Verified, Professionally Vetted.",
      columns: [
        { title: "Learn & Guide", links: [{ label: "Web3 Guide", href: "/web3-guide" }, { label: "Crypto Saving", href: "/crypto-saving" }, { label: "Exchange Tutorial", href: "/exchange-guide" }, { label: "Download Exchange", href: "/exchange-download" }, { label: "Knowledge Quiz", href: "/web3-quiz" }] },
        { title: "Trade & Tools", links: [{ label: "Exchange Compare", href: "/exchanges" }, { label: "Crypto Tools Hub", href: "/tools" }, { label: "Spot Sim", href: "/sim/spot" }, { label: "Futures Sim", href: "/sim/futures" }, { label: "Margin Sim", href: "/sim/margin" }] },
        { title: "Support & About", links: [{ label: "Contact Us", href: "/contact" }, { label: "Beginner Guide", href: "/beginner" }, { label: "Crypto Intro", href: "/crypto-intro" }, { label: "Crypto News", href: "/crypto-news" }] },
        { title: "Legal", links: [{ label: "Disclaimer", href: "/legal#disclaimer" }, { label: "Risk Notice", href: "/legal#risk" }] },
      ],
      copyright: "© 2026 Get8 Pro",
      disclaimer: "Content is for reference only and does not constitute investment advice. Invest responsibly.",
    },
  },
};

// ============================================================
// 交易所 / DEX 文字数据（纯文字跑马灯，无假 Logo）
// ============================================================
const PLATFORM_LOGOS = [
  { name: "Binance", tag: "CEX" },
  { name: "OKX", tag: "CEX" },
  { name: "Bybit", tag: "CEX" },
  { name: "Gate.io", tag: "CEX" },
  { name: "Bitget", tag: "CEX" },
  { name: "HTX", tag: "CEX" },
  { name: "Uniswap", tag: "DEX" },
  { name: "dYdX", tag: "DEX" },
  { name: "PancakeSwap", tag: "DEX" },
  { name: "Curve", tag: "DEX" },
  { name: "Aave", tag: "DeFi" },
  { name: "1inch", tag: "DEX" },
];

const ALL_LOGOS = [...PLATFORM_LOGOS, ...PLATFORM_LOGOS];

// ============================================================
// 背景动画
// ============================================================
function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const particles: { x: number; y: number; r: number; vx: number; vy: number; opacity: number }[] = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.5 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }
    let raf: number;
    const render = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(100, 150, 255, 0.05)";
      const step = 60;
      ctx.beginPath();
      for (let x = 0; x < w; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y < h; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.strokeStyle = "rgba(100, 150, 255, 0.03)";
      ctx.stroke();
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(render);
    };
    render();
    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" />;
}

function LogoMarquee({ label }: { label: string }) {
  return (
    <div className="relative py-8 border-y border-white/5 bg-white/[0.01] overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#050D1A] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#050D1A] to-transparent z-10" />
      <div className="flex items-center gap-4 mb-4 px-8">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{label}</span>
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
      </div>
      <div className="flex whitespace-nowrap animate-marquee">
        {ALL_LOGOS.map((logo, i) => (
          <div key={i} className="inline-flex items-center gap-2 mx-8 group">
            <span className="text-xl font-black text-slate-400 group-hover:text-white transition-colors tracking-tighter">
              {logo.name}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-600 font-bold border border-white/5">
              {logo.tag}
            </span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </div>
  );
}

function QuizBanner({ lang }: { lang: string }) {
  const zh = lang === "zh";
  return (
    <div className="mb-8">
      <Link href="/web3-quiz">
        <div className="group mx-auto max-w-xl rounded-2xl border border-cyan-500/15 p-4 flex items-center gap-4 cursor-pointer hover:border-cyan-500/35 transition-all"
          style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.04), rgba(139,92,246,0.02))" }}>
          <span className="text-3xl shrink-0" style={{ animation: "float 3s ease-in-out infinite" }}>🧭</span>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
              {zh ? "不知道从何开始？让我了解你" : "Not sure where to start? Let us know you"}
            </h4>
            <p className="text-xs text-slate-500">{zh ? "2 分钟测评，获取专属学习路径" : "2-min quiz for a personalized path"}</p>
          </div>
          <svg className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

const moduleColors = [
  {
    accentColor: "from-emerald-500/20 to-teal-500/10",
    borderColor: "border-emerald-500/30 hover:border-emerald-400/60",
    titleColor: "text-emerald-400",
    badgeColor: "bg-emerald-500",
    ctaColor: "bg-emerald-500 hover:bg-emerald-400",
    href: "/web3-guide",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="28" stroke="#6EE7B7" strokeWidth="2" opacity="0.3"/>
        <circle cx="32" cy="32" r="18" stroke="#6EE7B7" strokeWidth="2" opacity="0.5"/>
        <circle cx="32" cy="32" r="8" fill="#6EE7B7" opacity="0.8"/>
        <path d="M32 4 L32 60 M4 32 L60 32" stroke="#6EE7B7" strokeWidth="1.5" opacity="0.4"/>
        <path d="M12 12 L52 52 M52 12 L12 52" stroke="#6EE7B7" strokeWidth="1" opacity="0.25"/>
        <circle cx="32" cy="4" r="3" fill="#6EE7B7"/>
        <circle cx="32" cy="60" r="3" fill="#6EE7B7"/>
        <circle cx="4" cy="32" r="3" fill="#6EE7B7"/>
        <circle cx="60" cy="32" r="3" fill="#6EE7B7"/>
      </svg>
    ),
  },
  {
    accentColor: "from-yellow-500/20 to-amber-500/10",
    borderColor: "border-yellow-500/30 hover:border-yellow-400/60",
    titleColor: "text-yellow-400",
    badgeColor: "bg-yellow-500",
    ctaColor: "bg-yellow-500 hover:bg-yellow-400 text-black",
    href: "/crypto-saving",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="28" stroke="#FFD700" strokeWidth="2" opacity="0.3"/>
        <path d="M32 14 L36 26 L50 26 L39 34 L43 46 L32 38 L21 46 L25 34 L14 26 L28 26 Z" fill="#FFD700" opacity="0.8"/>
        <circle cx="32" cy="32" r="6" fill="#0A192F"/>
        <text x="32" y="36" textAnchor="middle" fill="#FFD700" fontSize="8" fontWeight="bold">$</text>
      </svg>
    ),
  },
  {
    accentColor: "from-blue-500/20 to-indigo-500/10",
    borderColor: "border-blue-500/30 hover:border-blue-400/60",
    titleColor: "text-blue-400",
    badgeColor: "bg-blue-500",
    ctaColor: "bg-blue-500 hover:bg-blue-400 text-white",
    href: "/exchange-guide",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="16" width="48" height="32" rx="4" stroke="#60A5FA" strokeWidth="2" opacity="0.4"/>
        <rect x="14" y="22" width="10" height="10" rx="2" fill="#60A5FA" opacity="0.7"/>
        <rect x="28" y="22" width="18" height="3" rx="1.5" fill="#60A5FA" opacity="0.5"/>
        <rect x="28" y="28" width="12" height="3" rx="1.5" fill="#60A5FA" opacity="0.3"/>
        <rect x="14" y="36" width="36" height="3" rx="1.5" fill="#60A5FA" opacity="0.4"/>
        <rect x="14" y="42" width="24" height="3" rx="1.5" fill="#60A5FA" opacity="0.3"/>
        <circle cx="52" cy="48" r="8" fill="#1E3A5F" stroke="#60A5FA" strokeWidth="1.5"/>
        <path d="M49 48 L55 48 M52 45 L52 51" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    accentColor: "from-purple-500/20 to-violet-500/10",
    borderColor: "border-purple-500/30 hover:border-purple-400/60",
    titleColor: "text-purple-400",
    badgeColor: "bg-purple-500",
    ctaColor: "bg-purple-500 hover:bg-purple-400 text-white",
    href: "/tools",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="28" stroke="#A78BFA" strokeWidth="2" opacity="0.3"/>
        <rect x="18" y="20" width="12" height="12" rx="3" fill="#A78BFA" opacity="0.7"/>
        <rect x="34" y="20" width="12" height="12" rx="3" fill="#A78BFA" opacity="0.5"/>
        <rect x="18" y="36" width="12" height="12" rx="3" fill="#A78BFA" opacity="0.5"/>
        <rect x="34" y="36" width="12" height="12" rx="3" fill="#A78BFA" opacity="0.7"/>
        <circle cx="24" cy="26" r="3" fill="#0A192F"/>
        <circle cx="40" cy="26" r="3" fill="#0A192F"/>
        <circle cx="24" cy="42" r="3" fill="#0A192F"/>
        <circle cx="40" cy="42" r="3" fill="#0A192F"/>
      </svg>
    ),
  },
  {
    accentColor: "from-cyan-500/20 to-blue-500/10",
    borderColor: "border-cyan-500/30 hover:border-cyan-400/60",
    titleColor: "text-cyan-400",
    badgeColor: "bg-cyan-500",
    ctaColor: "bg-cyan-500 hover:bg-cyan-400 text-black",
    href: "/crypto-news",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="28" stroke="#67E8F9" strokeWidth="2" opacity="0.3"/>
        <rect x="14" y="18" width="36" height="5" rx="2.5" fill="#67E8F9" opacity="0.8"/>
        <rect x="14" y="27" width="28" height="4" rx="2" fill="#67E8F9" opacity="0.5"/>
        <rect x="14" y="35" width="32" height="4" rx="2" fill="#67E8F9" opacity="0.4"/>
        <rect x="14" y="43" width="20" height="4" rx="2" fill="#67E8F9" opacity="0.3"/>
        <circle cx="50" cy="46" r="6" fill="#67E8F9" opacity="0.9"/>
        <path d="M48 46 L50 48 L53 44" stroke="#0A192F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export default function Portal() {
  useScrollMemory();
  const [mounted, setMounted] = useState(false);
  const { language: lang, setLanguage: setLang } = useLanguage();
  const t = LANG[lang as "zh" | "en"] ?? LANG["zh"];

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#050D1A] text-white relative overflow-hidden">
      <OnboardingPrompt lang={lang} />
      <AnimatedBackground />

      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-600/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setLang(lang === "zh" ? "en" : "zh")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-600/60 bg-slate-900/80 backdrop-blur-sm text-slate-300 hover:text-white hover:border-slate-400 transition-all text-xs font-medium"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          {t.langBtn}
        </button>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-16 pb-10 sm:pt-24 sm:pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            {t.badge}
          </div>

          <style>{`
            @keyframes gradientShift {
              0%   { background-position: 0% 50%; }
              50%  { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            .animated-gradient {
              background: linear-gradient(270deg, #a78bfa, #60a5fa, #34d399, #fbbf24, #f472b6, #a78bfa);
              background-size: 300% 300%;
              animation: gradientShift 6s ease infinite;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            .subtitle-gradient {
              background: linear-gradient(135deg, #94a3b8 0%, #cbd5e1 50%, #94a3b8 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
          `}</style>
          <h1 className="mb-4 leading-tight tracking-tight">
            <div className="text-4xl sm:text-5xl lg:text-7xl font-black">
              <span className="text-white">{t.h1a}</span>
              <span className="animated-gradient">{t.h1b}</span>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-semibold mt-3 subtitle-gradient tracking-wide">
              {t.h1sub}
            </div>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.desc}
          </p>

          <div className="flex flex-wrap justify-center gap-6 sm:gap-12 mb-10">
            {[
              { value: t.stat1v, unit: t.stat1u, label: t.stat1l },
              { value: t.stat2v, unit: t.stat2u, label: t.stat2l },
              { value: t.stat3v, unit: t.stat3u, label: t.stat3l },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl sm:text-4xl font-black text-yellow-400">
                  {stat.value}
                  <span className="text-lg text-yellow-300/70 ml-1">{stat.unit}</span>
                </div>
                <div className="text-slate-500 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <QuizBanner lang={lang} />
        <LogoMarquee label={t.bannerLabel} />

        <div className="pb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">{t.sectionTitle}</h2>
            <p className="text-slate-400">{t.sectionSub}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {t.modules.map((mod, index) => {
              const colors = moduleColors[index];
              return (
                <Link key={index} href={colors.href}>
                  <div
                    className={`
                      group relative rounded-2xl border ${colors.borderColor}
                      bg-gradient-to-br ${colors.accentColor}
                      backdrop-blur-sm overflow-hidden
                      transition-all duration-300 cursor-pointer
                      hover:scale-[1.02] hover:shadow-2xl
                      ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
                    `}
                    style={{
                      transitionDelay: `${index * 100}ms`,
                      background: "rgba(10, 25, 47, 0.7)",
                    }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${colors.accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    <div className="relative p-6 sm:p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-16 h-16 sm:w-20 sm:h-20">{colors.icon}</div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`${colors.badgeColor} text-black text-xs font-black px-3 py-1 rounded-full`}>
                            {mod.badge}
                          </span>
                          <span className="text-slate-500 text-xs font-mono tracking-widest">{mod.subtitle}</span>
                        </div>
                      </div>
                      <h3 className={`text-2xl sm:text-3xl font-black ${colors.titleColor} mb-3`}>{mod.title}</h3>
                      <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">{mod.description}</p>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {mod.tags.map((tag) => (
                          <span key={tag} className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-6 p-4 rounded-xl bg-black/20 border border-white/5">
                        {mod.stats.map((stat, i) => (
                          <div key={i} className="text-center">
                            <div className={`text-lg font-black ${colors.titleColor}`}>{stat.value}</div>
                            <div className="text-slate-500 text-xs mt-0.5">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                      <button className={`w-full ${colors.ctaColor} font-bold py-3 px-6 rounded-xl transition-all duration-200 text-sm sm:text-base group-hover:shadow-lg`}>
                        {mod.cta}
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <footer className="border-t border-slate-800/80 bg-slate-900/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-10">
              <div className="col-span-2 sm:col-span-3 lg:col-span-2">
                <Link href="/" className="inline-flex items-center gap-2 mb-4">
                  <span className="text-2xl font-black text-white tracking-tight">
                    Web3<span className="text-yellow-400">导航</span>
                  </span>
                </Link>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                  {t.footer.tagline}
                </p>
              </div>
              {t.footer.columns.map((col, i) => (
                <div key={i}>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                    {col.title}
                  </h4>
                  <ul className="space-y-3">
                    {col.links.map((link, j) => (
                      <li key={j}>
                        <Link href={link.href}>
                          <span className="text-sm text-slate-400 hover:text-yellow-400 transition-colors cursor-pointer">
                            {link.label}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-slate-500 text-sm">
                <a
                  href="/manage-m2u0z0i04"
                  style={{ color: 'inherit', textDecoration: 'none', cursor: 'default' }}
                >©</a>{t.footer.copyright.replace('©', '')}
              </p>
              <p id="disclaimer" className="text-slate-600 text-xs max-w-xl text-center sm:text-right">
                {t.footer.disclaimer}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
