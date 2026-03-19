import type { Language } from "@/lib/i18n";

type LocalizedSeo = {
  zh: string;
  en: string;
};

type SeoEntry = {
  title: LocalizedSeo;
  description: LocalizedSeo;
  keywords: LocalizedSeo;
};

const BASE_TITLE = {
  zh: "Get8 Pro | Web3 指南、交易所信息与学习资源",
  en: "Get8 Pro | Web3 Guides, Exchange Information & Learning Resources",
} as const;

const BASE_DESCRIPTION = {
  zh: "Get8 Pro 整理 Web3 入门内容、交易所信息、KYC 流程说明、风险提示与实用工具，帮助用户更系统地了解相关主题。",
  en: "Get8 Pro organizes Web3 learning resources, exchange information, KYC guidance, risk disclosures, and practical tools for users exploring the space.",
} as const;

const BASE_KEYWORDS = {
  zh: "Web3导航,交易所对比,KYC流程,加密货币教程,Web3入门,币圈工具,风险提示,交易所指南",
  en: "web3 navigation,exchange comparison,kyc guide,crypto education,web3 onboarding,crypto tools,risk disclosure,exchange guide",
} as const;

export const SEO_BY_PATH: Record<string, SeoEntry> = {
  "/": {
    title: BASE_TITLE,
    description: BASE_DESCRIPTION,
    keywords: BASE_KEYWORDS,
  },
  "/portal": {
    title: BASE_TITLE,
    description: BASE_DESCRIPTION,
    keywords: BASE_KEYWORDS,
  },
  "/crypto-saving": {
    title: {
      zh: "交易所返佣与手续费指南 | Get8 Pro",
      en: "Crypto Rebate & Fee Guide | Get8 Pro",
    },
    description: {
      zh: "查看默认返佣规则、交易所下载入口、手续费差异和老用户限制，更快找到适合自己的省手续费路径。",
      en: "Compare exchange rebates, fee differences, download paths, and existing-account limits to reduce trading costs more clearly.",
    },
    keywords: {
      zh: "交易所返佣,手续费指南,返佣规则,老用户返佣,交易成本优化,币圈省手续费",
      en: "crypto rebate,exchange fee guide,rebate rules,existing account rebate,trading cost optimization,fee saving",
    },
  },
  "/exchanges": {
    title: {
      zh: "交易所对比 | Get8 Pro",
      en: "Exchange Comparison | Get8 Pro",
    },
    description: {
      zh: "对比主流交易所的手续费、流动性、安全性、KYC 要求与功能覆盖，帮助你更快完成选择。",
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
      zh: "交易所下载指南 | Get8 Pro",
      en: "Exchange Download Guide | Get8 Pro",
    },
    description: {
      zh: "整理主流交易所下载入口、安装说明、地区限制提示和首次注册注意事项。",
      en: "Find official exchange download links, installation guidance, regional notes, and first-time registration tips.",
    },
    keywords: {
      zh: "交易所下载,交易所安装,官方app下载,币安下载,OKX下载,Gate下载,Bybit下载,Bitget下载",
      en: "exchange download,crypto app install,official exchange app,binance download,okx download,gate download,bybit download,bitget download",
    },
  },
  "/beginner": {
    title: {
      zh: "新手入门指南 | Get8 Pro",
      en: "Beginner Guide | Get8 Pro",
    },
    description: {
      zh: "用更清楚的顺序理解加密货币基础、交易概念、风险边界和第一次操作前该知道的事。",
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
      zh: "追踪加密快讯、市场更新、交易所公告和政策变化，帮助你更快理解发生了什么。",
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
      zh: "浏览交易所评测、返佣说明、Web3 教程和深度解读文章，获取更完整的背景与方法。",
      en: "Browse in-depth articles, exchange reviews, rebate explanations, and Web3 tutorials.",
    },
    keywords: {
      zh: "深度文章,交易所评测,返佣说明,Web3教程,币圈长文,加密分析",
      en: "crypto articles,exchange reviews,rebate guide,web3 tutorials,crypto analysis,in-depth articles",
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
      zh: "Web3教程,Web3学习路线,钱包私钥,KYC流程,区块链基础,Web3新手",
      en: "web3 guide,web3 learning path,wallet and private keys,kyc flow,blockchain basics,web3 beginner",
    },
  },
  "/web3-guide/what-is-web3": {
    title: {
      zh: "什么是 Web3 | Get8 Pro",
      en: "What Is Web3 | Get8 Pro",
    },
    description: {
      zh: "理解 Web3 的基本概念、使用场景和它与传统互联网的区别。",
      en: "Understand the basics of Web3, common use cases, and how it differs from traditional internet services.",
    },
    keywords: {
      zh: "什么是Web3,Web3概念,Web3入门,去中心化互联网,Web3基础",
      en: "what is web3,web3 basics,web3 introduction,decentralized internet,web3 concepts",
    },
  },
  "/web3-guide/blockchain-basics": {
    title: {
      zh: "区块链基础 | Get8 Pro",
      en: "Blockchain Basics | Get8 Pro",
    },
    description: {
      zh: "弄清区块链、链上数据、地址、Gas 和共识等基础概念。",
      en: "Learn the basics of blockchains, on-chain data, addresses, gas, and consensus.",
    },
    keywords: {
      zh: "区块链基础,链上数据,钱包地址,Gas费,共识机制,区块链教程",
      en: "blockchain basics,on-chain data,wallet address,gas fee,consensus,blockchain tutorial",
    },
  },
  "/web3-guide/wallet-keys": {
    title: {
      zh: "钱包与私钥 | Get8 Pro",
      en: "Wallets & Private Keys | Get8 Pro",
    },
    description: {
      zh: "了解钱包、助记词、私钥和常见安全风险，建立更稳的资产管理习惯。",
      en: "Understand wallets, seed phrases, private keys, and common security risks.",
    },
    keywords: {
      zh: "钱包私钥,助记词,钱包安全,私钥管理,Web3钱包,加密安全",
      en: "wallet private keys,seed phrase,wallet security,private key management,web3 wallet,crypto security",
    },
  },
  "/web3-guide/defi-deep": {
    title: {
      zh: "DeFi 进阶理解 | Get8 Pro",
      en: "DeFi Deep Dive | Get8 Pro",
    },
    description: {
      zh: "进一步理解 DeFi 的核心逻辑、收益来源、风险边界和新手误区。",
      en: "Go deeper into DeFi, including yield logic, risk boundaries, and beginner pitfalls.",
    },
    keywords: {
      zh: "DeFi教程,DeFi风险,收益来源,链上金融,DeFi进阶",
      en: "defi guide,defi risks,yield strategies,on-chain finance,defi deep dive",
    },
  },
  "/web3-guide/investment-gateway": {
    title: {
      zh: "投资方式入门 | Get8 Pro",
      en: "Investment Gateway | Get8 Pro",
    },
    description: {
      zh: "了解现货、定投、合约、杠杆等不同路径的差异，先看懂再决定。",
      en: "Compare spot, DCA, futures, and leverage paths so you can decide with more context.",
    },
    keywords: {
      zh: "投资方式入门,现货合约区别,定投,杠杆风险,交易方式对比",
      en: "investment gateway,spot vs futures,dca,leverage risk,trading path comparison",
    },
  },
  "/web3-guide/economic-opportunity": {
    title: {
      zh: "Web3 机会与风险 | Get8 Pro",
      en: "Economic Opportunity | Get8 Pro",
    },
    description: {
      zh: "从机会、门槛和风险三方面看待 Web3，不把单一收益叙事当作全部答案。",
      en: "Look at Web3 through opportunity, friction, and risk instead of hype alone.",
    },
    keywords: {
      zh: "Web3机会,Web3风险,加密机会,链上机会,风险边界",
      en: "web3 opportunities,web3 risks,crypto opportunities,on-chain opportunities,risk boundaries",
    },
  },
  "/web3-guide/kyc-flow": {
    title: {
      zh: "KYC 实名流程 | Get8 Pro",
      en: "KYC Verification Guide | Get8 Pro",
    },
    description: {
      zh: "了解 KYC 所需资料、提交流程、审核逻辑和常见退回原因，减少第一次认证时的阻力。",
      en: "Learn the KYC process, required documents, review logic, and common rejection reasons.",
    },
    keywords: {
      zh: "KYC流程,实名认证,交易所KYC,身份认证,审核退回原因,KYC准备",
      en: "kyc guide,identity verification,exchange kyc,kyc process,review rejection reasons,kyc preparation",
    },
  },
  "/contact": {
    title: {
      zh: "联系 Get8 Pro",
      en: "Contact Get8 Pro",
    },
    description: {
      zh: "联系 Get8 Pro 咨询返佣、平台开户、合作和内容修正等问题。",
      en: "Contact Get8 Pro for rebate questions, platform onboarding, cooperation, and corrections.",
    },
    keywords: {
      zh: "联系Get8 Pro,返佣咨询,合作联系,平台咨询,内容纠错",
      en: "contact get8 pro,rebate support,cooperation inquiry,platform support,content correction",
    },
  },
  "/about": {
    title: {
      zh: "关于 Get8 Pro",
      en: "About Get8 Pro",
    },
    description: {
      zh: "了解 Get8 Pro 的站点定位、合作说明、内容方法和为什么这样设计浏览路径。",
      en: "Learn about Get8 Pro, its site mission, partnership disclosures, and content methodology.",
    },
    keywords: {
      zh: "关于Get8 Pro,站点介绍,合作说明,内容方法,Web3导航站",
      en: "about get8 pro,site mission,partnership disclosure,editorial method,web3 navigation site",
    },
  },
  "/standards": {
    title: {
      zh: "编辑原则与透明度 | Get8 Pro",
      en: "Editorial Standards & Transparency | Get8 Pro",
    },
    description: {
      zh: "查看 Get8 Pro 如何核对信息、披露合作关系、处理风险提示和内容修正。",
      en: "Review how Get8 Pro verifies information, discloses partnerships, handles risks, and processes corrections.",
    },
    keywords: {
      zh: "编辑原则,透明度,合作披露,风险披露,内容修正,站点可信度",
      en: "editorial standards,transparency,partnership disclosure,risk disclosure,corrections,site trust",
    },
  },
  "/tools": {
    title: {
      zh: "币圈工具合集 | Get8 Pro",
      en: "Crypto Tools Directory | Get8 Pro",
    },
    description: {
      zh: "按场景查看行情、链上、安全和研究工具，并区分哪些工具可直连、哪些可能需要额外网络环境。",
      en: "Browse market, on-chain, security, and research tools, with clearer notes on direct access and network requirements.",
    },
    keywords: {
      zh: "币圈工具,链上工具,行情工具,研究工具,安全工具,无需VPN工具",
      en: "crypto tools,on-chain tools,market tools,research tools,security tools,no vpn crypto tools",
    },
  },
  "/web3-quiz": {
    title: {
      zh: "Web3 学习测评 | Get8 Pro",
      en: "Web3 Quiz | Get8 Pro",
    },
    description: {
      zh: "通过简单测评判断你更适合哪条学习路径，再进入更合理的下一步。",
      en: "Take a quick quiz to get a more suitable Web3 learning path.",
    },
    keywords: {
      zh: "Web3测评,学习路径,新手评测,Web3路线推荐",
      en: "web3 quiz,learning path,beginner assessment,web3 path recommendation",
    },
  },
  "/learning-path": {
    title: {
      zh: "学习路径推荐 | Get8 Pro",
      en: "Learning Path | Get8 Pro",
    },
    description: {
      zh: "根据你的情况生成更适合的新手、进阶或交易路径。",
      en: "Get a tailored beginner, intermediate, or trading-oriented learning path.",
    },
    keywords: {
      zh: "学习路径,Web3路线,新手路线,交易学习路径",
      en: "learning path,web3 roadmap,beginner roadmap,trading learning path",
    },
  },
  "/learning-complete": {
    title: {
      zh: "学习完成 | Get8 Pro",
      en: "Learning Complete | Get8 Pro",
    },
    description: {
      zh: "查看下一步行动建议，继续进入工具、文章、模拟器或交易所对比。",
      en: "See what to do next after your learning flow and continue into tools, articles, sims, or exchange comparisons.",
    },
    keywords: {
      zh: "学习完成,下一步行动,Web3下一步,学习总结",
      en: "learning complete,next step,web3 next actions,learning summary",
    },
  },
  "/legal": {
    title: {
      zh: "法律与风险披露 | Get8 Pro",
      en: "Legal & Risk Disclosures | Get8 Pro",
    },
    description: {
      zh: "查看 Get8 Pro 的法律说明、隐私信息、合作披露与风险提示。",
      en: "Read the legal notices, privacy information, partnership disclosures, and risk statements for Get8 Pro.",
    },
    keywords: {
      zh: "法律说明,风险披露,隐私政策,合作披露,免责声明",
      en: "legal notice,risk disclosure,privacy policy,partnership disclosure,disclaimer",
    },
  },
};

const PREFIX_DEFAULTS: Array<{ prefix: string; entry: SeoEntry }> = [
  {
    prefix: "/exchange/",
    entry: {
      title: {
        zh: "交易所详情页 | Get8 Pro",
        en: "Exchange Detail | Get8 Pro",
      },
      description: {
        zh: "查看交易所的手续费、返佣、KYC、下载入口和常见问题。",
        en: "Review exchange fees, rebates, KYC notes, download links, and FAQs.",
      },
      keywords: {
        zh: "交易所详情,手续费,返佣,下载入口,KYC说明,交易所FAQ",
        en: "exchange detail,fees,rebate,download links,kyc notes,exchange faq",
      },
    },
  },
  {
    prefix: "/exchange-guide/",
    entry: SEO_BY_PATH["/exchange-guide"],
  },
  {
    prefix: "/article/",
    entry: {
      title: {
        zh: "深度文章 | Get8 Pro",
        en: "Article | Get8 Pro",
      },
      description: {
        zh: "浏览与交易所、返佣、Web3 教程和市场解读相关的深度内容。",
        en: "Read in-depth content about exchanges, rebates, Web3 tutorials, and market interpretation.",
      },
      keywords: {
        zh: "深度文章,交易所文章,返佣文章,Web3文章,市场解读",
        en: "article,exchange article,rebate article,web3 article,market interpretation",
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
    prefix: "/admin/",
    entry: {
      title: {
        zh: "后台管理 | Get8 Pro",
        en: "Admin | Get8 Pro",
      },
      description: {
        zh: "Get8 Pro 后台管理页面。",
        en: "Get8 Pro admin interface.",
      },
      keywords: {
        zh: "后台管理,管理页面",
        en: "admin,dashboard",
      },
    },
  },
];

SEO_BY_PATH["/crypto-saving"] = {
  title: {
    zh: "交易成本与返佣指南 | Get8 Pro",
    en: "Trading Cost & Rebate Guide | Get8 Pro",
  },
  description: {
    zh: "整理交易所费用差异、默认 20% 返佣规则、下载路径与老账户限制，帮助你更清楚地理解和评估交易成本。",
    en: "Review exchange fee differences, default 20% rebate rules, download paths, and existing-account limits with clearer context.",
  },
  keywords: {
    zh: "交易成本指南,返佣规则,交易所费用说明,老账户限制,交易成本优化,平台费用对比",
    en: "trading cost guide,rebate rules,exchange fee guide,existing account limits,trading cost optimization,platform fee comparison",
  },
};

SEO_BY_PATH["/ui-demos"] = {
  title: {
    zh: "UI 风格提案预览 | Get8 Pro",
    en: "UI Direction Preview | Get8 Pro",
  },
  description: {
    zh: "查看 Get8 Pro 的 3 套界面风格提案，比较专业感、可信度与高意图路径设计。",
    en: "Preview three interface directions for Get8 Pro across professional tone, trust signals, and high-intent user paths.",
  },
  keywords: {
    zh: "Get8 Pro UI提案,Web3网站改版,交易所导航设计,界面预览,风格方案",
    en: "get8 pro ui proposal,web3 website redesign,exchange navigation design,interface preview,design directions",
  },
};

export function getSiteKeywords(language: Language) {
  return BASE_KEYWORDS[language];
}

export function getSeoForPath(path: string, language: Language) {
  const exact = SEO_BY_PATH[path];
  if (exact) {
    return {
      title: exact.title[language],
      description: exact.description[language],
      keywords: exact.keywords[language],
    };
  }

  const matchedPrefix = PREFIX_DEFAULTS.find((item) => path.startsWith(item.prefix));
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

SEO_BY_PATH["/crypto-saving"] = {
  title: {
    zh: "交易成本优化指南 | Get8 Pro",
    en: "Trading Cost Optimization Guide | Get8 Pro",
  },
  description: {
    zh: "整理默认 20% 规则、老账户限制、支持平台与下载路径，帮助用户更清晰地理解和评估交易成本。",
    en: "Review the default 20% rule, existing-account limits, supported exchanges, and download routes with clearer trading-cost context.",
  },
  keywords: {
    zh: "交易成本优化指南,返佣规则,交易所费用说明,老账户限制,交易成本优化,平台费用对比",
    en: "trading cost optimization guide,rebate rules,exchange fee guide,existing account limits,trading cost optimization,platform fee comparison",
  },
};

SEO_BY_PATH["/portal-classic"] = {
  title: {
    zh: "经典版首页对照 | Get8 Pro",
    en: "Classic Homepage Comparison | Get8 Pro",
  },
  description: {
    zh: "查看 Get8 Pro 经典版首页，用于与研究型新版首页进行结构和视觉对照。",
    en: "View the classic Get8 Pro homepage for comparison against the newer research-led version.",
  },
  keywords: {
    zh: "经典版首页,首页对照,Get8 Pro 旧版首页,页面改版对照",
    en: "classic homepage,homepage comparison,get8 pro legacy homepage,redesign comparison",
  },
};

SEO_BY_PATH["/portal-research"] = {
  title: {
    zh: "研究型首页预览 | Get8 Pro",
    en: "Research Homepage Preview | Get8 Pro",
  },
  description: {
    zh: "查看 Get8 Pro 的研究型首页预览方案，用于对照首页信息结构和视觉方向。",
    en: "Preview the research-led homepage concept for Get8 Pro and compare structure and visual direction.",
  },
  keywords: {
    zh: "研究型首页预览,首页预览方案,首页改版预览,Get8 Pro 研究型首页",
    en: "research homepage preview,homepage concept,homepage redesign preview,get8 pro research homepage",
  },
};

SEO_BY_PATH["/crypto-saving-classic"] = {
  title: {
    zh: "经典版交易成本页对照 | Get8 Pro",
    en: "Classic Trading Cost Page Comparison | Get8 Pro",
  },
  description: {
    zh: "查看 Get8 Pro 经典版交易成本页面，用于与新版交易成本优化指南进行对照。",
    en: "View the classic Get8 Pro trading-cost page for comparison against the newer optimization guide.",
  },
  keywords: {
    zh: "经典版交易成本页,交易成本页对照,页面改版对照,返佣页面旧版",
    en: "classic trading cost page,guide comparison,page redesign comparison,legacy rebate page",
  },
};
