import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

const BASE_URL = "https://get8.pro";

// ============================================================
// FAQ data for structured data injection
// ============================================================
const FAQ_DATA = {
  zh: [
    { q: "什么是交易所返佣？", a: "返佣是交易所为吸引新用户提供的激励机制。通过专属邀请码注册后，交易所自动将每笔交易手续费的一部分返还到用户账户，是真实可提取的资产。Get8 Pro默认返佣比例为20%。" },
    { q: "返佣的资金从哪里来？安全吗？", a: "返佣资金100%来自交易所本身的手续费收入，是交易所为获客主动让利的营销成本，不涉及任何额外费用或风险。这是三方共赢模型：交易所获得活跃用户，用户享受费用折扣，邀请人获得推广奖励。" },
    { q: "老账户可以补绑返佣吗？", a: "大多数交易所的老账户无法补绑邀请码。如果需要返佣优惠，通常需要使用新邮箱注册新账户。具体可通过联系页面咨询个性化方案。" },
    { q: "Get8 Pro支持哪些交易所？", a: "目前支持5家主流交易所：Gate.io、OKX（欧易）、Binance（币安）、Bybit、Bitget。所有交易所均通过官方合作渠道提供注册链接。" },
    { q: "Web3新手应该从哪里开始？", a: "建议从2分钟Web3测评开始，系统会根据知识水平推荐合适的学习路径。完全零基础的用户可以从Web3入圈指南的第1章'什么是Web3'开始。" },
    { q: "KYC实名认证需要什么材料？", a: "通常需要有效身份证件（身份证或护照）、自拍照片，部分交易所需要地址证明。具体要求因交易所而异，KYC流程页面有详细的分平台指南。" },
  ],
  en: [
    { q: "What is exchange rebate?", a: "A rebate is an incentive mechanism provided by exchanges to attract new users. When you register with a referral code, the exchange automatically returns a portion of your trading fees to your account — this is real, withdrawable money. Get8 Pro offers a default 20% rebate." },
    { q: "Where does rebate money come from? Is it safe?", a: "Rebate funds come 100% from the exchange's own fee revenue — it's marketing spend that exchanges willingly give up to acquire users. This is a win-win-win model: exchanges get active users, users enjoy fee discounts, and referrers earn promotion rewards." },
    { q: "Can existing accounts add a rebate code?", a: "Most exchanges do not allow existing accounts to retroactively bind referral codes. If you need a rebate, you typically need to register a new account with a different email. Contact us for personalized options." },
    { q: "Which exchanges does Get8 Pro support?", a: "Currently 5 major exchanges: Gate.io, OKX, Binance, Bybit, and Bitget. All registration links are provided through official partnership channels." },
    { q: "Where should Web3 beginners start?", a: "Start with the 2-minute Web3 quiz to get a personalized learning path recommendation. Complete beginners can start from Chapter 1 'What is Web3' in the Web3 Onboarding Guide." },
    { q: "What documents are needed for KYC?", a: "Typically a valid ID (national ID or passport), a selfie photo, and in some cases proof of address. Requirements vary by exchange — our KYC flow page has detailed per-platform guides." },
  ],
};

// ============================================================
// HowTo data for exchange registration
// ============================================================
const HOWTO_DATA = {
  zh: {
    name: "如何注册交易所并获得返佣",
    description: "通过Get8 Pro的官方合作渠道注册交易所，自动获得默认20%交易手续费返佣。",
    steps: [
      { name: "选择交易所", text: "在Get8 Pro的交易所下载页面（/exchange-download）选择适合你的交易所平台。推荐Gate.io、OKX、Binance、Bybit、Bitget。" },
      { name: "使用专属链接注册", text: "点击Get8 Pro提供的官方注册链接，系统会自动绑定返佣邀请码。确保从Get8 Pro跳转，不要手动修改URL。" },
      { name: "完成KYC实名认证", text: "按交易所要求上传身份证件完成KYC，通常需要身份证或护照的正反面照片和一张自拍。" },
      { name: "开始交易并自动获得返佣", text: "注册完成后进行任意交易，手续费的20%会自动返还到你的账户余额中。无需额外操作，终身有效。" },
    ],
  },
  en: {
    name: "How to Register on an Exchange and Get Rebates",
    description: "Register through Get8 Pro's official partner links to automatically receive a default 20% trading fee rebate.",
    steps: [
      { name: "Choose an Exchange", text: "Visit the Exchange Download page (/exchange-download) to select your preferred platform: Gate.io, OKX, Binance, Bybit, or Bitget." },
      { name: "Register via Partner Link", text: "Click the official registration link on Get8 Pro. The system will automatically bind the rebate referral code. Always use the link from Get8 Pro." },
      { name: "Complete KYC Verification", text: "Upload your ID documents as required. Typically you need front/back photos of your ID or passport and a selfie." },
      { name: "Trade and Auto-Receive Rebates", text: "After registration, 20% of your trading fees will automatically be returned to your account balance. No extra steps needed — lifetime validity." },
    ],
  },
};

// ============================================================
// Build schema objects
// ============================================================

function buildOrganizationSchema(isZh: boolean) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Get8 Pro",
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: isZh
      ? "Get8 Pro 是一个面向 Web3 学习、交易所信息整理、KYC 说明和工具导航的内容网站。"
      : "Get8 Pro is a content website focused on Web3 learning, exchange information, KYC guidance, and tool navigation.",
    email: "contact@get8.pro",
    contactPoint: {
      "@type": "ContactPoint",
      email: "contact@get8.pro",
      contactType: "customer support",
      availableLanguage: ["Chinese", "English"],
    },
    areaServed: "Global",
    knowsAbout: [
      "Web3 education",
      "exchange comparison",
      "KYC onboarding",
      "crypto tools",
      "risk disclosures",
    ],
  };
}

function buildWebsiteSchema(isZh: boolean) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: BASE_URL,
    name: "Get8 Pro",
    description: isZh
      ? "提供 Web3 指南、交易所信息、KYC 流程、工具导航和加密资讯内容。"
      : "Provides Web3 guides, exchange information, KYC workflows, tool navigation, and crypto news content.",
    inLanguage: [isZh ? "zh-CN" : "en", isZh ? "en" : "zh-CN"],
    publisher: {
      "@type": "Organization",
      name: "Get8 Pro",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

function buildCollectionPageSchema(isZh: boolean) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: isZh ? "Get8 Pro 导航与内容中心" : "Get8 Pro guides and navigation hub",
    url: BASE_URL,
    description: isZh
      ? "聚合 Web3 指南、交易所信息、KYC 流程、工具与风险提示。"
      : "A hub for Web3 education, exchange information, KYC guidance, tools, and risk disclosures.",
    isPartOf: {
      "@type": "WebSite",
      name: "Get8 Pro",
      url: BASE_URL,
    },
    about: [
      "Web3 onboarding",
      "exchange comparisons",
      "crypto tools",
      "risk notices",
    ],
  };
}

function buildAboutPageSchema(isZh: boolean) {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: isZh ? "关于 Get8 Pro" : "About Get8 Pro",
    url: `${BASE_URL}/about`,
    description: isZh
      ? "介绍站点定位、合作披露、信息整理方法和风险说明。"
      : "Explains site purpose, partnership disclosures, information organization, and risk notes.",
    isPartOf: {
      "@type": "WebSite",
      name: "Get8 Pro",
      url: BASE_URL,
    },
  };
}

function buildFAQSchema(isZh: boolean) {
  const faqItems = isZh ? FAQ_DATA.zh : FAQ_DATA.en;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

function buildHowToSchema(isZh: boolean) {
  const data = isZh ? HOWTO_DATA.zh : HOWTO_DATA.en;
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: data.name,
    description: data.description,
    step: data.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

function buildArticleSchema(isZh: boolean, path: string) {
  const titles: Record<string, { zh: string; en: string }> = {
    "/crypto-saving": {
      zh: "交易成本优化指南 — 交易所返佣完整攻略",
      en: "Trading Cost Optimization Guide — Complete Exchange Rebate Strategy",
    },
    "/web3-guide": {
      zh: "Web3 入圈指南 — 7 章系统化学习路径",
      en: "Web3 Onboarding Guide — 7-Chapter Learning Path",
    },
    "/exchange-guide": {
      zh: "交易所扫盲指南 — 5 家平台深度对比",
      en: "Exchange Tutorial — 5-Platform Deep Comparison",
    },
  };

  const titleData = titles[path];
  if (!titleData) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: isZh ? titleData.zh : titleData.en,
    url: `${BASE_URL}${path}`,
    author: {
      "@type": "Organization",
      name: "Get8 Pro Editorial Team",
    },
    publisher: {
      "@type": "Organization",
      name: "Get8 Pro",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo.png`,
      },
    },
    datePublished: "2025-01-01",
    dateModified: "2026-04-10",
    inLanguage: isZh ? "zh-CN" : "en",
  };
}

// ============================================================
// SchemaManager Component
// Uses direct DOM manipulation to avoid react-helmet-async race conditions.
// Each route switch cleans up old schema and injects route-specific schema.
// ============================================================

export function SchemaManager() {
  const { language } = useLanguage();
  const [location] = useLocation();
  const isZh = language === "zh";
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create or find our schema container in the document head
    let container = document.getElementById("get8-schema-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "get8-schema-container";
      document.head.appendChild(container);
    }
    containerRef.current = container as HTMLDivElement;

    return () => {
      // Cleanup on unmount
      if (containerRef.current && containerRef.current.parentNode) {
        containerRef.current.parentNode.removeChild(containerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous schemas
    container.innerHTML = "";

    // Always inject: Organization + WebSite
    const schemas: object[] = [
      buildOrganizationSchema(isZh),
      buildWebsiteSchema(isZh),
    ];

    // Route-specific schemas
    const normalizedPath = location === "/portal" ? "/" : location;

    if (normalizedPath === "/") {
      schemas.push(buildCollectionPageSchema(isZh));
    }

    if (normalizedPath === "/about") {
      schemas.push(buildAboutPageSchema(isZh));
    }

    // FAQ Schema — inject on main content pages
    if (
      normalizedPath === "/" ||
      normalizedPath === "/crypto-saving" ||
      normalizedPath === "/exchange-guide" ||
      normalizedPath === "/exchange-download"
    ) {
      schemas.push(buildFAQSchema(isZh));
    }

    // HowTo Schema — inject on download/registration pages
    if (
      normalizedPath === "/exchange-download" ||
      normalizedPath.startsWith("/exchange-registration/")
    ) {
      schemas.push(buildHowToSchema(isZh));
    }

    // Article Schema — inject on major content pages
    const articleSchema = buildArticleSchema(isZh, normalizedPath);
    if (articleSchema) {
      schemas.push(articleSchema);
    }

    // Inject all schemas as script tags
    schemas.forEach((schema) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schema);
      container.appendChild(script);
    });
  }, [location, isZh]);

  // This component renders nothing visible
  return null;
}
