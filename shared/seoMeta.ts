export type SeoLanguage = "zh" | "en";

type LocalizedSeo = Record<SeoLanguage, string>;

type SeoEntry = {
  title: LocalizedSeo;
  description: LocalizedSeo;
  keywords: LocalizedSeo;
};

export const BASE_TITLE: LocalizedSeo = {
  zh: "Get8 Pro | Web3 指南、交易所信息与学习资源",
  en: "Get8 Pro | Web3 Guides, Exchange Information & Learning Resources",
};

export const BASE_DESCRIPTION: LocalizedSeo = {
  zh: "Get8 Pro 整理 Web3 学习资源、交易所信息、KYC 指南、风险提示与实用工具，帮助用户更系统地了解相关主题。",
  en: "Get8 Pro organizes Web3 learning resources, exchange information, KYC guidance, risk disclosures, and practical tools for users exploring the space.",
};

export const BASE_KEYWORDS: LocalizedSeo = {
  zh: "Web3导航,交易所对比,KYC流程,加密货币教程,Web3入门,币圈工具,风险提示,交易所指南",
  en: "web3 navigation,exchange comparison,kyc guide,crypto education,web3 onboarding,crypto tools,risk disclosure,exchange guide",
};

const SEO_BY_PATH: Record<string, SeoEntry> = {
  "/": {
    title: BASE_TITLE,
    description: BASE_DESCRIPTION,
    keywords: BASE_KEYWORDS,
  },
  "/crypto-saving": {
    title: {
      zh: "交易成本优化指南 | Get8 Pro",
      en: "Trading Cost Optimization Guide | Get8 Pro",
    },
    description: {
      zh: "查看交易所费用差异、默认 20% 邀请规则、下载路径和老账户限制，更清楚地评估交易成本。",
      en: "Review exchange fee differences, default 20% invite rules, download paths, and existing-account limits with clearer context.",
    },
    keywords: {
      zh: "交易成本优化,返佣规则,交易所费用说明,老账户限制,平台费用对比,手续费指南",
      en: "trading cost optimization,invite rules,exchange fee guide,existing account limits,platform fee comparison,fee guide",
    },
  },
  "/exchanges": {
    title: {
      zh: "交易所对比 | Get8 Pro",
      en: "Exchange Comparison | Get8 Pro",
    },
    description: {
      zh: "对比主流交易所的费用、流动性、安全性、KYC 要求与功能覆盖，帮助用户更快完成选择。",
      en: "Compare major exchanges across fees, liquidity, security, KYC requirements, and feature coverage.",
    },
    keywords: {
      zh: "交易所对比,币安对比,OKX对比,Gate对比,Bybit对比,Bitget对比,交易所手续费",
      en: "exchange comparison,binance vs okx,gate vs bybit,bitget review,exchange fees,crypto exchange comparison",
    },
  },
  "/exchange-guide": {
    title: {
      zh: "交易所扫盲指南 | Get8 Pro",
      en: "Exchange Guide | Get8 Pro",
    },
    description: {
      zh: "快速了解交易所功能、产品差异、下载流程、KYC 准备与新手常见问题。",
      en: "Learn exchange features, product differences, download paths, KYC preparation, and common beginner questions.",
    },
    keywords: {
      zh: "交易所扫盲,交易所教程,KYC准备,交易所下载,现货合约区别,新手交易所指南",
      en: "exchange guide,exchange tutorial,kyc preparation,exchange download,spot vs futures,beginner exchange guide",
    },
  },
  "/exchange-download": {
    title: {
      zh: "交易所注册与下载教程 | Get8 Pro",
      en: "Exchange Registration & Download Guide | Get8 Pro",
    },
    description: {
      zh: "在一个页面内完成交易所选择、注册链接确认、邀请码填写和官方下载流程查看。",
      en: "Choose an exchange, confirm the registration path, verify the invite code, and follow the official download flow in one place.",
    },
    keywords: {
      zh: "交易所下载,交易所注册,官方注册链接,邀请码填写,币安下载,OKX下载,Gate下载,Bybit下载,Bitget下载",
      en: "exchange download,exchange registration,official sign-up link,invite code guide,binance download,okx download,gate download,bybit download,bitget download",
    },
  },
  "/beginner": {
    title: {
      zh: "新手入门指南 | Get8 Pro",
      en: "Beginner Guide | Get8 Pro",
    },
    description: {
      zh: "用更清晰的顺序理解加密货币基础、交易概念、风险边界和第一次操作前需要知道的内容。",
      en: "Learn crypto basics, trading concepts, risk boundaries, and what to know before your first action.",
    },
    keywords: {
      zh: "币圈新手,加密货币入门,交易基础,风险提示,第一次买币,Web3新手指南",
      en: "crypto beginner,crypto basics,trading fundamentals,risk disclosure,first crypto purchase,web3 beginner guide",
    },
  },
  "/crypto-intro": {
    title: {
      zh: "加密货币入门 | Get8 Pro",
      en: "Crypto Intro | Get8 Pro",
    },
    description: {
      zh: "理解比特币、以太坊、DeFi、钱包和链上概念，建立更稳的加密认知框架。",
      en: "Understand Bitcoin, Ethereum, DeFi, wallets, and on-chain concepts with a clearer mental model.",
    },
    keywords: {
      zh: "加密货币入门,比特币教程,以太坊教程,DeFi入门,钱包基础,链上知识",
      en: "crypto intro,bitcoin guide,ethereum guide,defi basics,wallet basics,on-chain education",
    },
  },
  "/crypto-news": {
    title: {
      zh: "加密快讯中心 | Get8 Pro",
      en: "Crypto News Hub | Get8 Pro",
    },
    description: {
      zh: "追踪加密快讯、市场更新、交易所公告和政策变化，帮助用户更快了解正在发生的内容。",
      en: "Track crypto news, market updates, exchange announcements, and policy changes in one place.",
    },
    keywords: {
      zh: "加密快讯,币圈新闻,市场动态,交易所公告,政策消息,加密资讯",
      en: "crypto news,market updates,exchange announcements,policy news,crypto headlines,crypto updates",
    },
  },
  "/articles": {
    title: {
      zh: "深度文章中心 | Get8 Pro",
      en: "Articles | Get8 Pro",
    },
    description: {
      zh: "浏览交易所评测、邀请说明、Web3 教程和深度解读文章，获取更完整的背景与方法。",
      en: "Browse in-depth articles, exchange reviews, invite explanations, and Web3 tutorials.",
    },
    keywords: {
      zh: "深度文章,交易所评测,邀请说明,Web3教程,币圈长文,加密分析",
      en: "crypto articles,exchange reviews,invite guide,web3 tutorials,crypto analysis,in-depth articles",
    },
  },
  "/web3-guide": {
    title: {
      zh: "Web3 学习指南 | Get8 Pro",
      en: "Web3 Guide | Get8 Pro",
    },
    description: {
      zh: "从 Web3 概念、区块链、钱包、KYC 到交易所实操，按更适合新手的路径逐步学习。",
      en: "Learn Web3 step by step, from concepts and wallets to KYC and exchange onboarding.",
    },
    keywords: {
      zh: "Web3教程,Web3学习路径,钱包私钥,KYC流程,区块链基础,Web3新手",
      en: "web3 guide,web3 learning path,wallet and private keys,kyc flow,blockchain basics,web3 beginner",
    },
  },
  "/tools": {
    title: {
      zh: "币圈工具合集 | Get8 Pro",
      en: "Crypto Tools | Get8 Pro",
    },
    description: {
      zh: "按用途整理加密行情、链上、安全、数据与研究工具，帮助用户更快找到合适的工具。",
      en: "Browse curated crypto tools for market data, on-chain analysis, security, and research by use case.",
    },
    keywords: {
      zh: "币圈工具,加密工具,链上工具,行情工具,安全工具,研究工具",
      en: "crypto tools,on-chain tools,market tools,security tools,research tools",
    },
  },
  "/about": {
    title: {
      zh: "关于 Get8 Pro | Get8 Pro",
      en: "About Get8 Pro | Get8 Pro",
    },
    description: {
      zh: "了解 Get8 Pro 的站点定位、信息边界、合作披露和内容整理方式。",
      en: "Learn about Get8 Pro, including its scope, disclosures, and approach to organizing information.",
    },
    keywords: {
      zh: "关于Get8 Pro,站点说明,合作披露,内容原则",
      en: "about get8 pro,site overview,disclosures,editorial principles",
    },
  },
  "/contact": {
    title: {
      zh: "联系我们 | Get8 Pro",
      en: "Contact | Get8 Pro",
    },
    description: {
      zh: "通过联系页面提交合作、反馈或内容勘误需求，帮助 Get8 Pro 持续完善。",
      en: "Use the contact page for feedback, collaboration requests, or content corrections.",
    },
    keywords: {
      zh: "联系Get8 Pro,反馈,合作,内容勘误",
      en: "contact get8 pro,feedback,collaboration,correction request",
    },
  },
  "/legal": {
    title: {
      zh: "法律与风险说明 | Get8 Pro",
      en: "Legal & Risk Notice | Get8 Pro",
    },
    description: {
      zh: "查看 Get8 Pro 的法律说明、风险提示与信息使用边界。",
      en: "Read Get8 Pro's legal notes, risk disclosures, and information boundaries.",
    },
    keywords: {
      zh: "法律说明,风险提示,免责声明",
      en: "legal notice,risk disclosure,disclaimer",
    },
  },
  "/standards": {
    title: {
      zh: "编辑原则与透明度 | Get8 Pro",
      en: "Editorial Standards & Transparency | Get8 Pro",
    },
    description: {
      zh: "查看 Get8 Pro 如何处理来源、审核、披露和内容更新。",
      en: "See how Get8 Pro handles sourcing, review, disclosure, and content updates.",
    },
    keywords: {
      zh: "编辑原则,透明度,来源说明,审核说明",
      en: "editorial standards,transparency,source notes,review policy",
    },
  },
};

const PREFIX_DEFAULTS: Array<{ prefix: string; entry: SeoEntry }> = [
  {
    prefix: "/exchange/",
    entry: {
      title: {
        zh: "交易所说明 | Get8 Pro",
        en: "Exchange Detail | Get8 Pro",
      },
      description: {
        zh: "查看交易所费用、邀请规则、KYC、下载入口和常见问题。",
        en: "Review exchange fees, invite notes, KYC guidance, download links, and FAQs.",
      },
      keywords: {
        zh: "交易所说明,手续费,邀请规则,下载入口,KYC说明,交易所FAQ",
        en: "exchange detail,fees,invite notes,download links,kyc notes,exchange faq",
      },
    },
  },
  {
    prefix: "/article/",
    entry: {
      title: {
        zh: "深度文章 | Get8 Pro",
        en: "Article | Get8 Pro",
      },
      description: {
        zh: "浏览与交易所、邀请规则、Web3 教程和市场解读相关的深度内容。",
        en: "Read in-depth content about exchanges, invite rules, Web3 tutorials, and market interpretation.",
      },
      keywords: {
        zh: "深度文章,交易所文章,邀请文章,Web3文章,市场解读",
        en: "article,exchange article,invite article,web3 article,market interpretation",
      },
    },
  },
  {
    prefix: "/sim/",
    entry: {
      title: {
        zh: "模拟交易游戏 | Get8 Pro",
        en: "Trading Simulators | Get8 Pro",
      },
      description: {
        zh: "通过模拟器练习现货、合约、杠杆、期权和机器人策略，更安全地熟悉交易界面。",
        en: "Practice spot, futures, margin, options, and bot strategies with trading simulators.",
      },
      keywords: {
        zh: "模拟交易,现货模拟,合约模拟,期权模拟,交易练习,交易游戏",
        en: "trading simulator,spot sim,futures sim,options sim,trading practice,trading game",
      },
    },
  },
  {
    prefix: "/web3-guide/",
    entry: {
      title: {
        zh: "Web3 教程 | Get8 Pro",
        en: "Web3 Tutorial | Get8 Pro",
      },
      description: {
        zh: "逐步学习钱包、私钥、区块链、KYC 和交易所相关基础知识。",
        en: "Learn wallets, private keys, blockchain, KYC, and exchange onboarding step by step.",
      },
      keywords: {
        zh: "Web3教程,钱包教程,私钥安全,KYC教程,区块链基础",
        en: "web3 tutorial,wallet guide,private key safety,kyc guide,blockchain basics",
      },
    },
  },
];

export function normalizeSeoPath(path: string) {
  const pathname = path.split("?")[0].split("#")[0] || "/";
  if (pathname === "/portal") return "/";
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function getSeoForPath(path: string, language: SeoLanguage) {
  const normalizedPath = normalizeSeoPath(path);
  const exact = SEO_BY_PATH[normalizedPath];
  if (exact) {
    return {
      title: exact.title[language],
      description: exact.description[language],
      keywords: exact.keywords[language],
    };
  }

  const matchedPrefix = PREFIX_DEFAULTS.find((item) => normalizedPath.startsWith(item.prefix));
  if (matchedPrefix) {
    return {
      title: matchedPrefix.entry.title[language],
      description: matchedPrefix.entry.description[language],
      keywords: matchedPrefix.entry.keywords[language],
    };
  }

  return {
    title: BASE_TITLE[language],
    description: BASE_DESCRIPTION[language],
    keywords: BASE_KEYWORDS[language],
  };
}

export function getSiteKeywords(language: SeoLanguage) {
  return BASE_KEYWORDS[language];
}

export function detectSeoLanguage(acceptLanguageHeader?: string | null): SeoLanguage {
  const header = acceptLanguageHeader?.toLowerCase() ?? "";
  if (header.includes("zh")) return "zh";
  if (header.includes("en")) return "en";
  return "zh";
}
