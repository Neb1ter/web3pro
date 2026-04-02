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
  zh: "Get8 Pro 提供 Web3 学习路径、交易所信息、KYC 指南、风险披露与实用工具，帮助用户更系统地理解加密市场。",
  en: "Get8 Pro provides Web3 learning paths, exchange information, KYC guidance, risk disclosures, and practical tools to help users navigate crypto with clarity.",
};

export const BASE_KEYWORDS: LocalizedSeo = {
  zh: "Web3导航,交易所对比,KYC流程,加密货币教程,Web3入门,币圈工具,风险披露,交易所指南",
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
      zh: "查看交易手续费差异、默认返佣规则、账户限制与下载入口，快速评估真实交易成本。",
      en: "Review fee differences, default rebate rules, account limitations, and download paths to assess real trading costs.",
    },
    keywords: {
      zh: "交易成本优化,返佣规则,手续费说明,平台费率对比,账户限制,加密交易费用",
      en: "trading cost optimization,rebate rules,fee guide,exchange fee comparison,account limits,crypto trading fees",
    },
  },
  "/exchanges": {
    title: {
      zh: "交易所对比 | Get8 Pro",
      en: "Exchange Comparison | Get8 Pro",
    },
    description: {
      zh: "对比主流交易所的费率、流动性、KYC 要求与功能覆盖，帮助你更快做出选择。",
      en: "Compare major exchanges by fee structure, liquidity, KYC requirements, and feature coverage.",
    },
    keywords: {
      zh: "交易所对比,币安对比,OKX对比,Gate对比,Bybit对比,Bitget对比,交易所费率",
      en: "exchange comparison,binance vs okx,gate vs bybit,bitget review,exchange fees,crypto exchange comparison",
    },
  },
  "/exchange-guide": {
    title: {
      zh: "交易所扫盲指南 | Get8 Pro",
      en: "Exchange Guide | Get8 Pro",
    },
    description: {
      zh: "快速了解交易所功能、产品差异、注册下载流程与 KYC 准备，覆盖新手常见问题。",
      en: "Understand exchange features, product differences, onboarding steps, and KYC preparation with beginner-focused guidance.",
    },
    keywords: {
      zh: "交易所教程,交易所扫盲,KYC准备,交易所下载,现货合约区别,新手交易所指南",
      en: "exchange guide,exchange tutorial,kyc preparation,exchange download,spot vs futures,beginner exchange guide",
    },
  },
  "/exchange-download": {
    title: {
      zh: "交易所注册与下载教程 | Get8 Pro",
      en: "Exchange Registration & Download Guide | Get8 Pro",
    },
    description: {
      zh: "在一个页面完成交易所选择、注册链接确认、邀请码填写和官方下载步骤查看。",
      en: "Complete exchange selection, registration path confirmation, invite-code guidance, and official app download steps in one page.",
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
      zh: "按清晰顺序学习加密货币基础、交易概念与风险边界，降低新手首次操作的不确定性。",
      en: "Learn crypto basics, trading concepts, and risk boundaries in a clear sequence.",
    },
    keywords: {
      zh: "币圈新手,加密货币入门,交易基础,风险提示,Web3新手指南",
      en: "crypto beginner,crypto basics,trading fundamentals,risk disclosure,web3 beginner guide",
    },
  },
  "/crypto-intro": {
    title: {
      zh: "加密货币入门 | Get8 Pro",
      en: "Crypto Intro | Get8 Pro",
    },
    description: {
      zh: "理解比特币、以太坊、DeFi、钱包和链上概念，建立更稳健的加密认知框架。",
      en: "Understand Bitcoin, Ethereum, DeFi, wallets, and on-chain concepts through a structured primer.",
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
      zh: "追踪市场更新、交易所公告与政策变化，集中查看加密快讯和重点动态。",
      en: "Track market updates, exchange announcements, and policy shifts in one streamlined crypto news hub.",
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
      zh: "浏览交易所评测、教程解析与深度内容，获取更完整的背景信息和操作逻辑。",
      en: "Browse exchange reviews, educational explainers, and in-depth analysis with richer context.",
    },
    keywords: {
      zh: "深度文章,交易所评测,Web3教程,加密分析,币圈长文",
      en: "crypto articles,exchange reviews,web3 tutorials,crypto analysis,in-depth articles",
    },
  },
  "/web3-guide": {
    title: {
      zh: "Web3 学习指南 | Get8 Pro",
      en: "Web3 Guide | Get8 Pro",
    },
    description: {
      zh: "从 Web3 概念、钱包、私钥到 KYC 与交易所实操，按路径逐步学习。",
      en: "Learn Web3 step by step from concepts and wallets to KYC and exchange onboarding.",
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
      zh: "按用途整理行情、链上、安全与研究工具，帮助你更快找到适合当前场景的工具。",
      en: "Discover curated tools for market tracking, on-chain analysis, security checks, and research workflows.",
    },
    keywords: {
      zh: "币圈工具,加密工具,链上工具,行情工具,安全工具,研究工具",
      en: "crypto tools,on-chain tools,market tools,security tools,research tools",
    },
  },
  "/codex-business": {
    title: {
      zh: "Codex Business 第六板块 | Get8 Pro",
      en: "Codex Business Module 6 | Get8 Pro",
    },
    description: {
      zh: "Get8 Pro 第六板块，聚焦自动化业务流程、任务执行、可观测日志与部署状态监控。",
      en: "Get8 Pro Module 6 focused on automation workflows, runtime execution, observability logs, and deployment status.",
    },
    keywords: {
      zh: "自动化业务,运营自动化,任务调度,流程编排,业务可观测,部署状态",
      en: "automation module,operations automation,task scheduling,workflow orchestration,observability,deployment status",
    },
  },
  "/about": {
    title: {
      zh: "关于 Get8 Pro | Get8 Pro",
      en: "About Get8 Pro | Get8 Pro",
    },
    description: {
      zh: "了解 Get8 Pro 的站点定位、内容边界、合作披露与信息组织方式。",
      en: "Learn about Get8 Pro's positioning, content boundaries, and disclosure standards.",
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
      zh: "提交合作咨询、使用反馈或内容勘误请求，帮助我们持续优化站点体验。",
      en: "Submit collaboration requests, feedback, or correction needs to help us improve the site.",
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
      en: "Review Get8 Pro legal notices, risk statements, and information boundaries.",
    },
    keywords: {
      zh: "法律说明,风险提示,免责声明,合规说明",
      en: "legal notice,risk disclosure,disclaimer,compliance notice",
    },
  },
  "/standards": {
    title: {
      zh: "编辑原则与透明度 | Get8 Pro",
      en: "Editorial Standards & Transparency | Get8 Pro",
    },
    description: {
      zh: "查看 Get8 Pro 如何处理来源、审核、披露与内容更新。",
      en: "See how Get8 Pro handles source validation, review flow, disclosures, and updates.",
    },
    keywords: {
      zh: "编辑原则,透明度,来源说明,审核规则",
      en: "editorial standards,transparency,source policy,review policy",
    },
  },
};

const PREFIX_DEFAULTS: Array<{ prefix: string; entry: SeoEntry }> = [
  {
    prefix: "/exchange/",
    entry: {
      title: {
        zh: "交易所详情 | Get8 Pro",
        en: "Exchange Detail | Get8 Pro",
      },
      description: {
        zh: "查看交易所费率、KYC 要求、注册链接、下载入口与常见问题说明。",
        en: "Review exchange fees, KYC requirements, registration links, download options, and FAQs.",
      },
      keywords: {
        zh: "交易所详情,手续费,邀请码,下载入口,KYC说明,交易所FAQ",
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
        zh: "浏览交易所、Web3 教程与市场解读相关文章，获取结构化内容。",
        en: "Read structured long-form content about exchanges, Web3 learning, and market interpretation.",
      },
      keywords: {
        zh: "深度文章,交易所文章,Web3文章,市场解读",
        en: "article,exchange article,web3 article,market interpretation",
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
        zh: "通过现货、合约、杠杆、期权和机器人模拟器练习交易流程。",
        en: "Practice spot, futures, margin, options, and bot strategies with interactive simulators.",
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
        zh: "逐步学习钱包、私钥、区块链、KYC 和交易所实操基础。",
        en: "Learn wallets, private keys, blockchain basics, KYC, and exchange onboarding step by step.",
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

export function detectSeoLanguage(path: string): SeoLanguage {
  const rawPath = path.toLowerCase();
  return rawPath.includes("/en") || rawPath.includes("lang=en") ? "en" : "zh";
}

