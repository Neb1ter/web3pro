/**
 * ExchangeDetail.tsx
 * 交易所独立详情页 — SEO 优化版
 * 路由: /exchange/:slug (gate | okx | binance | bybit | bitget)
 */
import { useEffect } from "react";
import { useRoute, Link } from "wouter";
import { SeoManager } from "@/components/SeoManager";
import { useLanguage } from "@/contexts/LanguageContext";
import { TrustSignalsCard } from "@/components/TrustSignalsCard";
import { preloadRoute } from "@/lib/routePreload";
import { EXCHANGE_FEES, INVITE_CODES, type ExchangeSlug } from "@shared/exchangeFees";
import { TRUST_LAST_REVIEWED } from "@/lib/trust";
import { Button } from "@/components/ui/button";
import {
  Shield, TrendingUp, Users, Star, CheckCircle2, AlertTriangle,
  ExternalLink, ArrowLeft, Download, Globe, Lock, Zap, Award
} from "lucide-react";

// ─── 交易所完整数据 ────────────────────────────────────────────────────────────
const EXCHANGE_DATA: Record<ExchangeSlug, {
  name: string;
  nameEn: string;
  emoji: string;
  color: string;
  accentCls: string;
  borderCls: string;
  bgGrad: string;
  founded: string;
  hq: string;
  hqEn: string;
  coins: string;
  volume: string;
  leverage: string;
  token: string;
  users: string;
  score: string;
  badge: { zh: string; en: string };
  tagline: { zh: string; en: string };
  desc: { zh: string; en: string };
  descLong: { zh: string; en: string };
  highlights: { icon: string; zh: string; en: string }[];
  pros: { zh: string[]; en: string[] };
  cons: { zh: string[]; en: string[] };
  bestFor: { zh: string; en: string };
  features: { icon: React.ReactNode; title: { zh: string; en: string }; desc: { zh: string; en: string } }[];
  faqs: { q: { zh: string; en: string }; a: { zh: string; en: string } }[];
  downloadLinks: { platform: string; url: string }[];
}> = {
  gate: {
    name: "Gate.io", nameEn: "Gate.io",
    emoji: "🟢", color: "#00B173", accentCls: "text-emerald-400",
    borderCls: "border-emerald-500/40", bgGrad: "from-emerald-950/60 to-gray-900",
    founded: "2013", hq: "开曼群岛", hqEn: "Cayman Islands",
    coins: "3,600+", volume: "$5亿+", leverage: "100x", token: "GT",
    users: "1,400万+", score: "87.5",
    badge: { zh: "新币最多", en: "Most Listings" },
    tagline: { zh: "新币最多 · 储备最透明 · 返佣最高60%", en: "Most Listings · Best Transparency · Up to 60% Rebate" },
    desc: {
      zh: "Gate.io 成立于 2013 年，是全球上币最多的主流交易所，支持 3,600+ 种加密货币。储备透明度全行业最高，返佣比例高达 60%，是寻找新兴代币和最高返佣的首选平台。",
      en: "Gate.io (est. 2013) lists the most cryptocurrencies among major exchanges — 3,600+ tokens. Highest reserve transparency in the industry, with up to 60% rebate rate. Best choice for new token discovery and maximum rebates.",
    },
    descLong: {
      zh: "Gate.io（芝麻开门）成立于 2013 年，是全球历史最悠久的加密货币交易所之一。凭借超过 3,600 种上币数量，Gate.io 在新兴代币发现方面遥遥领先于竞争对手。平台支持现货、合约、杠杆、理财、借贷等全系列产品，并推出了自有公链 GT Chain。\n\nGate.io 在储备透明度方面表现突出，定期发布默克尔树储备证明，用户可独立验证资产安全性。平台还支持黄金、白银等传统金融资产的代币化交易，是连接传统金融与 Web3 的重要桥梁。\n\n通过 Get8 Pro 的官方合作邀请码注册 Gate.io，可享受高达 60% 的手续费返佣——这是所有主流交易所中返佣比例最高的，长期交易可节省大量成本。",
      en: "Gate.io (est. 2013) is one of the oldest crypto exchanges globally. With 3,600+ listed tokens, it leads in new token discovery. The platform offers spot, futures, margin, earn, and lending products, plus its own GT Chain blockchain.\n\nGate.io excels in reserve transparency with regular Merkle tree proof of reserves that users can independently verify. It also supports tokenized gold, silver, and other traditional financial assets, bridging TradFi and Web3.\n\nRegister through Get8 Pro's official referral code to enjoy up to 60% fee rebate — the highest among all major exchanges, saving significant costs over time.",
    },
    highlights: [
      { icon: "🪙", zh: "3,600+ 种加密货币，新币上线最快最多", en: "3,600+ cryptocurrencies — fastest and most new listings" },
      { icon: "🔍", zh: "默克尔树储备证明，用户可独立验证资产安全", en: "Merkle tree proof of reserves — independently verifiable" },
      { icon: "💰", zh: "返佣比例高达 60%，全行业最高", en: "Up to 60% rebate rate — highest in the industry" },
      { icon: "🏅", zh: "支持黄金等传统金融资产代币化交易", en: "Supports tokenized gold and traditional financial assets" },
    ],
    pros: {
      zh: ["新币上线最快最多，适合发现早期项目", "储备透明度全行业最高", "支持黄金等传统金融资产", "返佣比例高达 60%，长期省钱效果最佳"],
      en: ["Fastest new listings — best for early project discovery", "Highest reserve transparency in industry", "Supports gold and TradFi assets", "Up to 60% rebate — best long-term savings"],
    },
    cons: {
      zh: ["界面对新手略显复杂", "部分小币流动性不足", "客服响应速度一般"],
      en: ["Interface can be complex for beginners", "Some small coins have low liquidity", "Customer support response time average"],
    },
    bestFor: { zh: "新币猎手 · 追求最高返佣的用户 · 传统金融资产投资者", en: "New token hunters · Maximum rebate seekers · TradFi asset investors" },
    features: [
      { icon: <TrendingUp className="w-5 h-5" />, title: { zh: "现货交易", en: "Spot Trading" }, desc: { zh: "支持 3,600+ 交易对，流动性充足，手续费 0.15%", en: "3,600+ trading pairs, sufficient liquidity, 0.15% fee" } },
      { icon: <Zap className="w-5 h-5" />, title: { zh: "合约交易", en: "Futures Trading" }, desc: { zh: "永续合约 Maker 0.02% / Taker 0.05%，最高 100x 杠杆", en: "Perpetual futures Maker 0.02% / Taker 0.05%, up to 100x leverage" } },
      { icon: <Shield className="w-5 h-5" />, title: { zh: "储备证明", en: "Proof of Reserves" }, desc: { zh: "默克尔树证明，用户可独立验证 100% 储备", en: "Merkle tree proof, users can independently verify 100% reserves" } },
      { icon: <Globe className="w-5 h-5" />, title: { zh: "GT Chain", en: "GT Chain" }, desc: { zh: "自有 Layer1 公链，支持 DeFi 和 NFT 生态", en: "Own Layer1 blockchain supporting DeFi and NFT ecosystem" } },
    ],
    faqs: [
      { q: { zh: "Gate.io 安全吗？", en: "Is Gate.io safe?" }, a: { zh: "Gate.io 成立超过 12 年，从未发生重大安全事故。平台定期发布默克尔树储备证明，储备率持续保持 100% 以上。同时采用冷热钱包分离、多重签名等安全措施。", en: "Gate.io has operated for 12+ years without major security incidents. Regular Merkle tree proof of reserves shows 100%+ reserve ratio. Cold/hot wallet separation and multi-signature security measures are in place." } },
      { q: { zh: "Gate.io 60% 返佣是真的吗？", en: "Is the 60% rebate real?" }, a: { zh: "是真实的。Gate.io 通过官方合作伙伴计划，将平台收取手续费的 60% 返还给通过合作伙伴链接注册的用户。这是官方合作数据，每笔返佣均可在账户中查询。", en: "Yes, it's real. Gate.io returns 60% of trading fees to users who register through official partner links. This is official partnership data — every rebate is traceable in your account." } },
      { q: { zh: "如何在 Gate.io 获得返佣？", en: "How to get rebates on Gate.io?" }, a: { zh: "通过 Get8 Pro 提供的专属邀请链接注册 Gate.io 账户，注册时填写邀请码 getitpro，即可永久享受 60% 手续费返佣。返佣自动结算，无需手动申请。", en: "Register via Get8 Pro's exclusive referral link, enter code getitpro during registration to permanently enjoy 60% fee rebate. Rebates are automatically settled — no manual application needed." } },
      { q: { zh: "Gate.io 支持哪些国家？", en: "Which countries does Gate.io support?" }, a: { zh: "Gate.io 支持全球大多数国家和地区，但美国、中国大陆等少数地区受到限制。建议使用前查阅 Gate.io 官方服务条款确认您所在地区是否支持。", en: "Gate.io supports most countries globally, but is restricted in the US, mainland China, and a few other regions. Check Gate.io's official terms of service to confirm availability in your region." } },
    ],
    downloadLinks: [
      { platform: "App Store", url: "https://apps.apple.com/app/gate-io/id1294998195" },
      { platform: "Google Play", url: "https://play.google.com/store/apps/details?id=com.gateio.gateio" },
      { platform: "官网下载", url: "https://www.gate.io/mobileapp" },
    ],
  },
  okx: {
    name: "OKX", nameEn: "OKX",
    emoji: "⚫", color: "#FFFFFF", accentCls: "text-white",
    borderCls: "border-white/30", bgGrad: "from-gray-900/80 to-gray-950",
    founded: "2017", hq: "塞舌尔/巴哈马", hqEn: "Seychelles / Bahamas",
    coins: "350+", volume: "$20亿+", leverage: "125x", token: "OKB",
    users: "5,000万+", score: "88.77",
    badge: { zh: "Web3最强", en: "Best Web3" },
    tagline: { zh: "Web3 门户 · 最强 DEX · 自有 Layer2", en: "Web3 Gateway · Best DEX · Own Layer2" },
    desc: {
      zh: "OKX 是全球第二大加密交易所，以强大的 Web3 生态著称。Web3 钱包支持 100+ 公链，内置 DEX 聚合器，自有 X Layer 二层网络。2025 年已在德国、波兰获得正式监管牌照。",
      en: "OKX is the world's 2nd largest exchange, renowned for its Web3 ecosystem. Web3 wallet supports 100+ chains, built-in DEX aggregator, X Layer L2. Officially regulated in Germany & Poland in 2025.",
    },
    descLong: {
      zh: "OKX（原 OKEx）成立于 2017 年，是全球第二大加密货币交易所，日均交易量超 200 亿美元，注册用户超 5,000 万。OKX 以其强大的 Web3 生态系统闻名，旗下 Web3 钱包支持超过 100 条公链，内置 DEX 聚合器可一键访问全链最优价格。\n\nOKX 自主研发了 X Layer（原 X1）二层网络，基于 zkEVM 技术，为开发者和用户提供低成本、高速度的链上体验。在合规方面，OKX 于 2025 年先后获得德国和波兰的正式监管牌照，是合规化进程最快的头部交易所之一。\n\nCoinGlass 综合评分 88.77，位居行业第二。通过 Get8 Pro 邀请码注册，可享受 20% 手续费永久返佣。",
      en: "OKX (formerly OKEx, est. 2017) is the world's 2nd largest exchange with $20B+ daily volume and 50M+ users. OKX is renowned for its Web3 ecosystem — the Web3 wallet supports 100+ chains with a built-in DEX aggregator for best cross-chain prices.\n\nOKX developed X Layer (formerly X1), a zkEVM Layer 2 network providing low-cost, high-speed on-chain experience. In compliance, OKX obtained official licenses in Germany and Poland in 2025, among the fastest in regulatory compliance.\n\nCoinGlass composite score 88.77, industry #2. Register via Get8 Pro referral code for 20% permanent fee rebate.",
    },
    highlights: [
      { icon: "🌐", zh: "Web3 钱包支持 100+ 公链，最强多链钱包之一", en: "Web3 wallet supports 100+ chains — one of the strongest multi-chain wallets" },
      { icon: "⚡", zh: "内置 DEX 聚合器，一键访问全链最优价格", en: "Built-in DEX aggregator for best prices across all chains" },
      { icon: "🏛️", zh: "2025 年获德国、波兰正式监管牌照，合规领先", en: "Officially regulated in Germany and Poland in 2025 — compliance leader" },
      { icon: "📊", zh: "CoinGlass 综合评分 88.77，行业第二", en: "CoinGlass composite score 88.77, industry #2" },
    ],
    pros: {
      zh: ["Web3 生态最完整，多链钱包最强", "现货 Maker 费率 0.08% 行业最低之一", "德国/波兰持牌合规，监管最规范"],
      en: ["Most complete Web3 ecosystem, strongest multi-chain wallet", "Spot Maker fee 0.08% — one of lowest", "Licensed in Germany/Poland — most regulated"],
    },
    cons: {
      zh: ["新币上线速度不及 Gate.io", "部分地区访问受限，需要 VPN"],
      en: ["Slower new coin listings than Gate.io", "Access restricted in some regions, may need VPN"],
    },
    bestFor: { zh: "Web3 探索者 · 合约交易者 · 追求低费率的用户", en: "Web3 explorers · Contract traders · Low-fee seekers" },
    features: [
      { icon: <Globe className="w-5 h-5" />, title: { zh: "Web3 钱包", en: "Web3 Wallet" }, desc: { zh: "支持 100+ 公链，内置 DEX 聚合器，一站式 Web3 入口", en: "100+ chains, built-in DEX aggregator, all-in-one Web3 gateway" } },
      { icon: <Zap className="w-5 h-5" />, title: { zh: "X Layer", en: "X Layer" }, desc: { zh: "自有 zkEVM Layer2，低 Gas 费，高 TPS", en: "Own zkEVM Layer2, low gas fees, high TPS" } },
      { icon: <TrendingUp className="w-5 h-5" />, title: { zh: "合约交易", en: "Futures Trading" }, desc: { zh: "永续合约 Maker 0.02% / Taker 0.05%，最高 125x 杠杆", en: "Perpetual futures Maker 0.02% / Taker 0.05%, up to 125x leverage" } },
      { icon: <Shield className="w-5 h-5" />, title: { zh: "合规监管", en: "Regulatory Compliance" }, desc: { zh: "德国、波兰持牌，欧洲最合规交易所之一", en: "Licensed in Germany & Poland, one of Europe's most compliant exchanges" } },
    ],
    faqs: [
      { q: { zh: "OKX 在中国大陆可以用吗？", en: "Can OKX be used in mainland China?" }, a: { zh: "OKX 在中国大陆受到限制，需要使用海外网络环境访问。App Store 中国区已下架，可切换海外 Apple ID 下载，或直接从 OKX 官网下载 APK 安装。", en: "OKX is restricted in mainland China and requires overseas network access. The China App Store version is removed; switch to an overseas Apple ID or download the APK directly from OKX's official website." } },
      { q: { zh: "OKX 的 Web3 钱包安全吗？", en: "Is OKX Web3 wallet safe?" }, a: { zh: "OKX Web3 钱包是非托管钱包，私钥由用户自己掌控，OKX 无法访问您的资产。但请务必安全备份助记词，丢失助记词将永久失去资产访问权。", en: "OKX Web3 wallet is non-custodial — private keys are controlled by users, OKX cannot access your assets. Always securely back up your seed phrase; losing it means permanent loss of access." } },
      { q: { zh: "OKX 现货手续费是多少？", en: "What are OKX spot trading fees?" }, a: { zh: "OKX 标准现货手续费：Maker 0.08%，Taker 0.10%。持有 OKB 或交易量达到 VIP 等级可享受更低费率。通过 Get8 Pro 邀请码注册还可额外获得 20% 返佣。", en: "OKX standard spot fees: Maker 0.08%, Taker 0.10%. Holding OKB or reaching VIP level unlocks lower rates. Register via Get8 Pro referral code for additional 20% rebate." } },
    ],
    downloadLinks: [
      { platform: "App Store（海外）", url: "https://apps.apple.com/app/okx/id1327268470" },
      { platform: "Google Play", url: "https://play.google.com/store/apps/details?id=com.okinc.okex.gp" },
      { platform: "官网下载", url: "https://www.okx.com/download" },
    ],
  },
  binance: {
    name: "币安", nameEn: "Binance",
    emoji: "🟡", color: "#F0B90B", accentCls: "text-yellow-400",
    borderCls: "border-yellow-500/40", bgGrad: "from-yellow-950/60 to-gray-900",
    founded: "2017", hq: "开曼群岛", hqEn: "Cayman Islands",
    coins: "350+", volume: "$400-600亿", leverage: "125x", token: "BNB",
    users: "2.5亿+", score: "94.33",
    badge: { zh: "流动性最强", en: "Best Liquidity" },
    tagline: { zh: "全球最大 · 流动性最强 · 生态最全", en: "World Largest · Best Liquidity · Full Ecosystem" },
    desc: {
      zh: "币安是全球最大的加密交易所，日均交易量超 400 亿美元，注册用户超 2.5 亿，市场份额约 40%。CoinGlass 综合评分 94.33，行业第一。BNB Chain 是全球最活跃的公链之一。",
      en: "Binance is the world's largest exchange with $40B+ daily volume, 250M+ users, ~40% market share. CoinGlass score 94.33, industry #1. BNB Chain is one of the most active blockchains.",
    },
    descLong: {
      zh: "币安（Binance）成立于 2017 年，是全球规模最大、流动性最强的加密货币交易所。日均交易量高达 400-600 亿美元，注册用户超过 2.5 亿，市场份额约占全球 40%。CoinGlass 综合评分 94.33，稳居行业第一。\n\n币安提供全面的产品线：现货、合约、期权、杠杆、理财、NFT 市场、Launchpad 等应有尽有。BNB Chain（原 BSC）是全球最活跃的公链之一，日活跃地址数长期位居前列。持有 BNB 代币可享受 25% 手续费折扣。\n\n尽管币安在美国等部分地区受到监管限制，但其在全球大多数市场仍是首选交易所。通过 Get8 Pro 邀请码注册，可享受 20% 手续费永久返佣。",
      en: "Binance (est. 2017) is the world's largest and most liquid crypto exchange. $40-60B daily volume, 250M+ users, ~40% global market share. CoinGlass composite score 94.33, consistently #1 in the industry.\n\nBinance offers a comprehensive product lineup: spot, futures, options, margin, earn, NFT marketplace, Launchpad, and more. BNB Chain (formerly BSC) is one of the most active blockchains globally. Holding BNB tokens provides 25% fee discount.\n\nDespite regulatory restrictions in the US and some regions, Binance remains the top choice in most global markets. Register via Get8 Pro referral code for 20% permanent fee rebate.",
    },
    highlights: [
      { icon: "🏆", zh: "CoinGlass 综合评分 94.33，全球第一", en: "CoinGlass composite score 94.33, global #1" },
      { icon: "👥", zh: "注册用户超 2.5 亿，全球最大用户基础", en: "250M+ registered users, world's largest user base" },
      { icon: "💧", zh: "日均交易量 400-600 亿美元，流动性无可匹敌", en: "$40-60B daily volume, unmatched liquidity" },
      { icon: "⛓️", zh: "BNB Chain 生态：数千个 DApp，最活跃公链之一", en: "BNB Chain ecosystem: thousands of DApps, most active chain" },
    ],
    pros: {
      zh: ["全球最大，流动性最强，滑点最小", "产品线最全面，一站式满足所有需求", "BNB 持有者享受 25% 手续费折扣", "Launchpad 参与新项目 IEO 机会"],
      en: ["World largest, best liquidity, minimal slippage", "Most comprehensive product line, all-in-one", "BNB holders get 25% fee discount", "Launchpad IEO opportunities for new projects"],
    },
    cons: {
      zh: ["美国用户受限，需使用 Binance.US", "部分监管问题，2023年与 DOJ 达成和解", "新手界面较复杂，功能过多"],
      en: ["US users restricted to Binance.US", "Some regulatory issues, 2023 DOJ settlement", "Complex interface for beginners, too many features"],
    },
    bestFor: { zh: "主流币交易者 · 大额交易用户 · BNB 生态参与者", en: "Major coin traders · High-volume users · BNB ecosystem participants" },
    features: [
      { icon: <Award className="w-5 h-5" />, title: { zh: "Launchpad", en: "Launchpad" }, desc: { zh: "参与新项目 IEO，持有 BNB 可优先认购", en: "Participate in new project IEOs, BNB holders get priority" } },
      { icon: <TrendingUp className="w-5 h-5" />, title: { zh: "合约交易", en: "Futures Trading" }, desc: { zh: "USDT/币本位合约，Maker 0.02% / Taker 0.04%，最高 125x", en: "USDT/coin-margined futures, Maker 0.02% / Taker 0.04%, up to 125x" } },
      { icon: <Zap className="w-5 h-5" />, title: { zh: "BNB 折扣", en: "BNB Discount" }, desc: { zh: "使用 BNB 支付手续费享受 25% 折扣", en: "Pay fees in BNB for 25% discount" } },
      { icon: <Globe className="w-5 h-5" />, title: { zh: "BNB Chain", en: "BNB Chain" }, desc: { zh: "高性能公链，数千个 DApp，低 Gas 费", en: "High-performance blockchain, thousands of DApps, low gas" } },
    ],
    faqs: [
      { q: { zh: "币安的手续费是多少？", en: "What are Binance trading fees?" }, a: { zh: "币安标准现货手续费：Maker 0.10%，Taker 0.10%。使用 BNB 支付可享受 25% 折扣（即 0.075%）。合约手续费：Maker 0.02%，Taker 0.04%。通过 Get8 Pro 邀请码注册还可额外获得 20% 返佣。", en: "Binance standard spot fees: Maker 0.10%, Taker 0.10%. Pay with BNB for 25% discount (0.075%). Futures: Maker 0.02%, Taker 0.04%. Register via Get8 Pro for additional 20% rebate." } },
      { q: { zh: "币安在中国大陆可以用吗？", en: "Can Binance be used in mainland China?" }, a: { zh: "币安在中国大陆受到限制，需要使用海外网络环境。App Store 中国区已下架，可切换海外 Apple ID 下载，或从币安官网下载 APK。", en: "Binance is restricted in mainland China and requires overseas network access. Download via overseas Apple ID or APK from Binance's official website." } },
      { q: { zh: "币安安全吗？有没有被黑过？", en: "Is Binance safe? Has it been hacked?" }, a: { zh: "币安在 2019 年曾发生一次安全事故，损失约 4,000 万美元，但币安全额赔付了受影响用户。此后币安大幅升级安全体系，目前采用 SAFU 基金（10 亿美元）、冷热钱包分离等多重安全措施。", en: "Binance had one security incident in 2019 (~$40M loss), but fully compensated affected users. Since then, Binance significantly upgraded security with SAFU fund ($1B), cold/hot wallet separation, and multiple security layers." } },
    ],
    downloadLinks: [
      { platform: "App Store（海外）", url: "https://apps.apple.com/app/binance-buy-bitcoin-crypto/id1436799971" },
      { platform: "Google Play", url: "https://play.google.com/store/apps/details?id=com.binance.dev" },
      { platform: "官网下载", url: "https://www.binance.com/download" },
    ],
  },
  bybit: {
    name: "Bybit", nameEn: "Bybit",
    emoji: "🔵", color: "#2775CA", accentCls: "text-blue-300",
    borderCls: "border-blue-400/40", bgGrad: "from-blue-950/60 to-gray-900",
    founded: "2018", hq: "迪拜", hqEn: "Dubai, UAE",
    coins: "1,000+", volume: "$10亿+", leverage: "125x", token: "BIT",
    users: "3,000万+", score: "88.5",
    badge: { zh: "合约专家", en: "Derivatives Expert" },
    tagline: { zh: "合约专家 · 每月储备审计 · 荷兰持牌", en: "Derivatives Expert · Monthly Reserve Audit · Netherlands Licensed" },
    desc: {
      zh: "Bybit 成立于 2018 年，专注衍生品交易，合约 Maker 费率仅 0.01%，全行业最低之一。与 Hacken 合作每月发布储备金证明，ETH 储备率 101%。已在荷兰获得正式监管牌照。",
      en: "Bybit (est. 2018) specializes in derivatives. Contract Maker fee only 0.01% — one of the lowest. Monthly Proof of Reserves with Hacken, ETH reserve ratio 101%. Officially licensed in the Netherlands.",
    },
    descLong: {
      zh: "Bybit 成立于 2018 年，总部位于迪拜，是全球领先的加密货币衍生品交易所。注册用户超过 3,000 万，日均交易量超过 100 亿美元，在衍生品市场份额约 9.5%，位居行业第二。\n\nBybit 以极低的合约手续费著称：Maker 仅 0.01%，是全行业最低之一。平台与 Hacken 合作，每月发布储备金证明，ETH 储备率达 101%，透明度极高。2024 年获得荷兰正式监管牌照，是欧洲合规运营的头部交易所之一。\n\nBybit 还提供复制交易（Copy Trading）功能，新手可以一键跟随专业交易者的策略。通过 Get8 Pro 邀请码注册，可享受 30% 手续费永久返佣。",
      en: "Bybit (est. 2018, Dubai) is a leading crypto derivatives exchange with 30M+ users and $10B+ daily volume, holding ~9.5% derivatives market share — industry #2.\n\nBybit is known for ultra-low contract fees: Maker only 0.01%, one of the lowest industry-wide. Monthly Proof of Reserves with Hacken shows 101% ETH reserve ratio. Licensed in the Netherlands in 2024, one of Europe's top compliant exchanges.\n\nBybit also offers Copy Trading, allowing beginners to mirror professional traders' strategies. Register via Get8 Pro referral code for 30% permanent fee rebate.",
    },
    highlights: [
      { icon: "📋", zh: "Hacken 每月储备金证明审计，ETH 储备率 101%", en: "Monthly Hacken Proof of Reserves audit, ETH reserve ratio 101%" },
      { icon: "🏛️", zh: "荷兰正式监管牌照，欧洲合规运营", en: "Official Netherlands license, EU-compliant operations" },
      { icon: "💰", zh: "合约 Maker 费率 0.01%，全行业最低之一", en: "Contract Maker fee 0.01% — one of lowest in industry" },
      { icon: "📈", zh: "2025 年底市场份额 9.5%，衍生品行业第二", en: "9.5% market share end of 2025, derivatives industry #2" },
    ],
    pros: {
      zh: ["合约 Maker 费率 0.01%，全行业最低之一", "每月 Hacken 储备金证明，透明度高", "荷兰持牌，欧洲合规", "复制交易功能，适合新手跟单"],
      en: ["Contract Maker fee 0.01% — industry lowest", "Monthly Hacken proof of reserves, high transparency", "Netherlands licensed, EU compliant", "Copy trading feature, great for beginners"],
    },
    cons: {
      zh: ["现货品种不如币安、Gate.io 丰富", "部分地区访问受限"],
      en: ["Fewer spot trading pairs than Binance/Gate.io", "Access restricted in some regions"],
    },
    bestFor: { zh: "合约交易者 · 追求低手续费的用户 · 跟单交易新手", en: "Contract traders · Low-fee seekers · Copy trading beginners" },
    features: [
      { icon: <Users className="w-5 h-5" />, title: { zh: "复制交易", en: "Copy Trading" }, desc: { zh: "一键跟随专业交易者，适合新手学习", en: "One-click follow professional traders, great for beginners" } },
      { icon: <Zap className="w-5 h-5" />, title: { zh: "合约交易", en: "Futures Trading" }, desc: { zh: "Maker 0.01% 全行业最低，最高 125x 杠杆", en: "Maker 0.01% industry lowest, up to 125x leverage" } },
      { icon: <Shield className="w-5 h-5" />, title: { zh: "储备证明", en: "Proof of Reserves" }, desc: { zh: "Hacken 每月审计，ETH 储备率 101%", en: "Monthly Hacken audit, ETH reserve ratio 101%" } },
      { icon: <Lock className="w-5 h-5" />, title: { zh: "荷兰持牌", en: "Netherlands License" }, desc: { zh: "欧洲正式监管牌照，合规运营", en: "Official European regulatory license, compliant operations" } },
    ],
    faqs: [
      { q: { zh: "Bybit 的合约手续费是多少？", en: "What are Bybit's futures fees?" }, a: { zh: "Bybit 永续合约手续费：Maker 0.01%，Taker 0.055%。这是全行业最低的 Maker 费率之一。通过 Get8 Pro 邀请码注册还可额外获得 30% 返佣。", en: "Bybit perpetual futures fees: Maker 0.01%, Taker 0.055%. This is one of the lowest Maker rates industry-wide. Register via Get8 Pro for additional 30% rebate." } },
      { q: { zh: "Bybit 复制交易怎么用？", en: "How does Bybit copy trading work?" }, a: { zh: "在 Bybit App 中找到「跟单交易」功能，选择你想跟随的交易员，设置投入金额，系统会自动按比例复制该交易员的每笔操作。适合没有时间研究市场的用户。", en: "In the Bybit app, find 'Copy Trading', select a trader to follow, set your investment amount, and the system automatically replicates their trades proportionally. Ideal for users without time to research markets." } },
    ],
    downloadLinks: [
      { platform: "App Store", url: "https://apps.apple.com/app/bybit-buy-crypto-bitcoin/id1488296980" },
      { platform: "Google Play", url: "https://play.google.com/store/apps/details?id=com.bybit.app" },
      { platform: "官网下载", url: "https://www.bybit.com/download" },
    ],
  },
  bitget: {
    name: "Bitget", nameEn: "Bitget",
    emoji: "🔷", color: "#00F0FF", accentCls: "text-cyan-400",
    borderCls: "border-cyan-400/40", bgGrad: "from-cyan-950/60 to-gray-900",
    founded: "2018", hq: "塞舌尔", hqEn: "Seychelles",
    coins: "800+", volume: "$5亿+", leverage: "125x", token: "BGB",
    users: "2,500万+", score: "85.0",
    badge: { zh: "跟单领先", en: "Copy Trade Leader" },
    tagline: { zh: "跟单领先 · 现货费率最低 · 50%返佣", en: "Copy Trade Leader · Lowest Spot Fee · 50% Rebate" },
    desc: {
      zh: "Bitget 成立于 2018 年，以跟单交易闻名全球，现货 Maker 费率仅 0.02%，全行业最低之一。支持中文界面，对中文用户友好。返佣比例高达 50%，是高频交易者的省钱利器。",
      en: "Bitget (est. 2018) is globally renowned for copy trading. Spot Maker fee only 0.02% — one of the lowest industry-wide. Chinese-friendly interface. Up to 50% rebate rate — great cost saver for high-frequency traders.",
    },
    descLong: {
      zh: "Bitget 成立于 2018 年，总部位于塞舌尔，是全球领先的加密货币交易所，注册用户超过 2,500 万。Bitget 以跨单（Copy Trading）功能闻名，是全球最大的跟单交易平台之一，拥有超过 10 万名精英交易员可供跟随。\n\nBitget 的现货 Maker 费率仅 0.02%，是全行业最低之一，对于高频交易者来说极具吸引力。平台支持完整的中文界面，对中文用户非常友好。此外，Bitget 持有多个国家和地区的合规牌照，包括美国 MSB、加拿大 MSB 等。\n\nBitget 还推出了自有公链 BGB Chain，并持续扩展 Web3 生态。通过 Get8 Pro 邀请码注册，可享受 50% 手续费永久返佣。",
      en: "Bitget (est. 2018, Seychelles) is a leading global exchange with 25M+ users. Bitget is renowned for Copy Trading — one of the world's largest copy trading platforms with 100,000+ elite traders to follow.\n\nBitget's spot Maker fee is only 0.02%, one of the lowest industry-wide, making it very attractive for high-frequency traders. The platform offers full Chinese language support. Bitget holds compliance licenses in multiple jurisdictions including US MSB and Canada MSB.\n\nBitget also launched BGB Chain and continues expanding its Web3 ecosystem. Register via Get8 Pro referral code for 50% permanent fee rebate.",
    },
    highlights: [
      { icon: "🤝", zh: "全球最大跟单平台之一，10万+ 精英交易员", en: "One of world's largest copy trading platforms, 100K+ elite traders" },
      { icon: "💸", zh: "现货 Maker 费率 0.02%，全行业最低之一", en: "Spot Maker fee 0.02% — one of lowest industry-wide" },
      { icon: "🌏", zh: "完整中文界面，对中文用户最友好", en: "Full Chinese interface, most friendly for Chinese users" },
      { icon: "🏅", zh: "美国 MSB、加拿大 MSB 等多国合规牌照", en: "US MSB, Canada MSB and other multi-jurisdiction licenses" },
    ],
    pros: {
      zh: ["现货 Maker 费率 0.02%，全行业最低之一", "跟单交易功能最完善，精英交易员最多", "中文界面最友好，适合中文用户", "50% 返佣，高频交易者省钱效果显著"],
      en: ["Spot Maker fee 0.02% — industry lowest", "Most complete copy trading, most elite traders", "Most Chinese-friendly interface", "50% rebate — significant savings for high-frequency traders"],
    },
    cons: {
      zh: ["知名度不如币安、OKX", "部分高级功能学习曲线较陡"],
      en: ["Less brand recognition than Binance/OKX", "Some advanced features have steeper learning curve"],
    },
    bestFor: { zh: "高频交易者 · 跟单交易新手 · 中文用户", en: "High-frequency traders · Copy trading beginners · Chinese users" },
    features: [
      { icon: <Users className="w-5 h-5" />, title: { zh: "跟单交易", en: "Copy Trading" }, desc: { zh: "10万+ 精英交易员，一键跟单，全球最大跟单平台之一", en: "100K+ elite traders, one-click copy, one of world's largest" } },
      { icon: <TrendingUp className="w-5 h-5" />, title: { zh: "现货交易", en: "Spot Trading" }, desc: { zh: "Maker 0.02% 全行业最低，800+ 交易对", en: "Maker 0.02% industry lowest, 800+ trading pairs" } },
      { icon: <Globe className="w-5 h-5" />, title: { zh: "BGB Chain", en: "BGB Chain" }, desc: { zh: "自有公链，支持 DeFi 和 Web3 生态", en: "Own blockchain supporting DeFi and Web3 ecosystem" } },
      { icon: <Shield className="w-5 h-5" />, title: { zh: "多国合规", en: "Multi-Jurisdiction Compliance" }, desc: { zh: "美国 MSB、加拿大 MSB 等多国牌照", en: "US MSB, Canada MSB and other licenses" } },
    ],
    faqs: [
      { q: { zh: "Bitget 的现货手续费是多少？", en: "What are Bitget's spot trading fees?" }, a: { zh: "Bitget 标准现货手续费：Maker 0.02%，Taker 0.06%。Maker 费率是全行业最低之一。通过 Get8 Pro 邀请码注册还可额外获得 50% 返佣。", en: "Bitget standard spot fees: Maker 0.02%, Taker 0.06%. Maker rate is one of the lowest industry-wide. Register via Get8 Pro for additional 50% rebate." } },
      { q: { zh: "Bitget 跟单交易怎么操作？", en: "How does Bitget copy trading work?" }, a: { zh: "在 Bitget App 中进入「跟单」页面，浏览精英交易员列表，查看其历史收益、胜率、风险评分，选择合适的交易员后设置跟单金额即可。系统自动按比例复制每笔交易。", en: "In Bitget app, go to 'Copy Trade', browse elite trader profiles showing historical returns, win rate, and risk score. Select a trader, set your copy amount, and the system automatically replicates each trade proportionally." } },
    ],
    downloadLinks: [
      { platform: "App Store", url: "https://apps.apple.com/app/bitget-buy-bitcoin-crypto/id1442778704" },
      { platform: "Google Play", url: "https://play.google.com/store/apps/details?id=com.bitget.app" },
      { platform: "官网下载", url: "https://www.bitget.com/download" },
    ],
  },
};

// ─── 主组件 ────────────────────────────────────────────────────────────────────
export default function ExchangeDetail() {
  const [, params] = useRoute("/exchange/:slug");
  const slug = (params?.slug ?? "") as ExchangeSlug;
  const { language } = useLanguage();
  const zh = language === "zh";

  const data = EXCHANGE_DATA[slug];
  const fees = EXCHANGE_FEES[slug];
  const invite = INVITE_CODES[slug];
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (slug) {
        preloadRoute("/exchange-download");
    }
  }, [slug]);

  if (!data || !fees || !invite) {
    return (
      <div className="min-h-screen bg-[#050D1A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">交易所不存在</p>
          <Link href="/exchanges" className="text-blue-400 hover:underline">返回交易所对比</Link>
        </div>
      </div>
    );
  }

  const seoTitle = zh
    ? `${data.name} 评测2026：手续费、返佣、安全性完整指南 | Get8 Pro`
    : `${data.nameEn} Review 2026: Fees, Rebates & Safety Guide | Get8 Pro`;
  const seoDesc = zh
    ? `${data.name}详细评测：${data.tagline.zh}。现货手续费${fees.spotMaker}，合约手续费${fees.futMaker}，返佣${fees.rebateRate}。通过Get8 Pro邀请码注册享受最高返佣。`
    : `${data.nameEn} detailed review: ${data.tagline.en}. Spot fee ${fees.spotMaker}, futures fee ${fees.futMaker}, rebate ${fees.rebateRate}. Register via Get8 Pro for maximum rebates.`;

  const officialLink = data.downloadLinks[data.downloadLinks.length - 1]?.url ?? data.downloadLinks[0]?.url;
  const trustSources = [
    { label: zh ? `${data.name} 官网与下载页` : `${data.nameEn} official site`, href: officialLink },
    { label: zh ? "官方费率与活动说明" : "Official fee and campaign notes" },
    { label: zh ? "公开公告与合规信息" : "Public announcements and compliance information" },
    { label: "CoinGlass / CoinGecko" },
  ];
  const trustDisclosure = zh
    ? `本页会展示 Get8 Pro 可用的公开返佣与下载入口。部分链接属于官方合作或邀请计划，我们可能因此获得收益，但费率、区域限制和活动条款仍应以 ${data.name} 最新官方页面为准。`
    : `This page may include public rebate and download routes available through Get8 Pro. Some links are part of official partner or referral programs. That can generate revenue for us, but fees, regional restrictions, and campaign terms should still be re-checked on ${data.nameEn}'s latest official pages.`;

  return (
    <>
      <SeoManager
        title={seoTitle}
        description={seoDesc}
        path={`/exchange/${slug}`}
        keywords={zh
          ? `${data.name},${data.name}手续费,${data.name}返佣,${data.name}邀请码,${data.name}评测,加密货币交易所`
          : `${data.nameEn},${data.nameEn} fees,${data.nameEn} rebate,${data.nameEn} referral code,${data.nameEn} review,crypto exchange`}
      />

      <div className="min-h-screen bg-[#050D1A] text-white">
        {/* ── 顶部导航 ── */}
        <div className="border-b border-white/10 bg-[#050D1A]/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/exchanges" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition text-sm">
              <ArrowLeft className="w-4 h-4" />
              {zh ? "交易所对比" : "Exchange Comparison"}
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-white font-semibold text-sm">{data.name}</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

          {/* ── Hero 区域 ── */}
          <div className={`rounded-2xl border ${data.borderCls} bg-gradient-to-br ${data.bgGrad} p-6 sm:p-8`}>
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
              <div className="text-5xl">{data.emoji}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className={`text-3xl font-black ${data.accentCls}`}>{data.name}</h1>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${data.accentCls} border-current bg-current/10`}>
                    {zh ? data.badge.zh : data.badge.en}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mb-3">{zh ? data.tagline.zh : data.tagline.en}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="text-slate-400">{zh ? "成立" : "Founded"}: <span className="text-white font-semibold">{data.founded}</span></span>
                  <span className="text-slate-400">{zh ? "总部" : "HQ"}: <span className="text-white font-semibold">{zh ? data.hq : data.hqEn}</span></span>
                  <span className="text-slate-400">{zh ? "用户" : "Users"}: <span className="text-white font-semibold">{data.users}</span></span>
                  <span className="text-slate-400">{zh ? "评分" : "Score"}: <span className={`font-black ${data.accentCls}`}>{data.score}</span></span>
                </div>
              </div>
            </div>

            {/* 手续费速览 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: zh ? "现货 Maker" : "Spot Maker", val: fees.spotMaker },
                { label: zh ? "现货 Taker" : "Spot Taker", val: fees.spotTaker },
                { label: zh ? "合约 Maker" : "Futures Maker", val: fees.futMaker },
                { label: zh ? "最高返佣" : "Max Rebate", val: fees.rebateRate, highlight: true },
              ].map(item => (
                <div key={item.label} className={`rounded-xl p-3 text-center ${item.highlight ? `bg-current/10 border border-current/30 ${data.accentCls}` : "bg-white/5 border border-white/10"}`}>
                  <div className={`text-xl font-black ${item.highlight ? data.accentCls : "text-white"}`}>{item.val}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>

            {/* CTA 按钮 */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className={`w-full font-black text-base py-5 bg-gradient-to-r from-current/80 to-current/60 hover:opacity-90 ${data.accentCls}`}
                style={{ background: `linear-gradient(135deg, ${data.color}33, ${data.color}22)`, border: `1px solid ${data.color}66`, color: data.color }}>
                <a href={invite.referralLink} target="_blank" rel="noopener noreferrer" className="tap-target flex-1">
                  {zh ? "前往官方注册链接" : "Open Official Sign-up Link"}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Link href={`/exchange-download?exchange=${slug}#registration-guide`} className="sm:w-auto" onMouseEnter={() => preloadRoute("/exchange-download")} onTouchStart={() => preloadRoute("/exchange-download")} onFocus={() => preloadRoute("/exchange-download")} onPointerDown={() => preloadRoute("/exchange-download")}>
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 py-5">
                  <Download className="w-4 h-4 mr-2" />
                  {zh ? "注册与下载教学" : "Sign-up Guide"}
                </Button>
              </Link>
            </div>

            {/* 邀请码 */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-400">
              <span>{zh ? "邀请码：" : "Referral Code: "}</span>
              <code className="font-mono font-black text-white bg-white/10 px-2 py-0.5 rounded">{invite.inviteCode}</code>
              <span className="text-xs">({zh ? "注册时填写" : "enter during registration"})</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              {zh ? "邀请码已自动带入；如未带入请填写 getitpro" : "Referral code is prefilled; if not, enter getitpro"}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  title: zh ? "前往官方注册链接" : "Open official sign-up link",
                  desc: zh ? "开户链接使用交易所官方域名，并会优先带入邀请码。" : "This uses the exchange's official domain and usually pre-fills the referral code.",
                  onClick: () => window.open(invite.referralLink, "_blank", "noopener,noreferrer"),
                },
                {
                  title: zh ? "查看完整注册教学" : "Open full sign-up guide",
                  desc: zh ? "带邀请码的官网注册步骤会单独讲清楚。" : "A dedicated guide covers the official sign-up flow with the referral code.",
                  onClick: () => { preloadRoute("/exchange-download"); window.location.href = `/exchange-download?exchange=${slug}#registration-guide`; },
                },
                {
                  title: zh ? "先看常见问题" : "Read the FAQ first",
                  desc: zh ? "安全、费率和地区限制都在这里。" : "Safety, fees, and region limits are here.",
                  onClick: () => scrollTo("faq"),
                },
                {
                  title: zh ? "不确定选哪家" : "Still comparing?",
                  desc: zh ? "回到总对比页再决定也可以。" : "Go back to the comparison page first.",
                  onClick: () => (window.location.href = "/exchanges"),
                },
              ].map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={item.onClick}
                  className="tap-target rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-white/20 hover:bg-white/10"
                >
                  <p className="mb-1 text-sm font-black text-white">{item.title}</p>
                  <p className="text-xs leading-6 text-slate-400">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── 详细介绍 ── */}
          <div className="hidden"><TrustSignalsCard
            zh={zh}
            title={zh ? "作者、审核与来源说明" : "Authorship, Review & Source Notes"}
            summary={zh ? "交易所页面经常会被用户直接拿来做决策，所以这里把作者、复核口径、更新时间、来源依据和合作披露集中展示。" : "Exchange pages are often used for direct decisions, so this block keeps authorship, review context, update timing, source basis, and disclosures together."}
            author={zh ? "Get8 Pro 研究团队" : "Get8 Pro Research Desk"}
            reviewer={zh ? "Get8 Pro 内容审核" : "Get8 Pro Editorial Review"}
            updatedAt={TRUST_LAST_REVIEWED}
            sources={trustSources}
            disclosure={trustDisclosure}
          /></div>

          <section id="about-exchange">
            <h2 className="text-xl font-black text-white mb-4">{zh ? `${data.name} 详细介绍` : `About ${data.nameEn}`}</h2>
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              {(zh ? data.descLong.zh : data.descLong.en).split("\n\n").map((para, i) => (
                <p key={i} className="text-slate-300 leading-relaxed mb-3 last:mb-0">{para}</p>
              ))}
            </div>
          </section>

          {/* ── 核心亮点 ── */}
          <section id="highlights">
            <h2 className="text-xl font-black text-white mb-4">{zh ? "核心亮点" : "Key Highlights"}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl border border-white/10 p-4">
                  <span className="text-2xl flex-shrink-0">{h.icon}</span>
                  <p className="text-slate-300 text-sm leading-relaxed">{zh ? h.zh : h.en}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── 主要功能 ── */}
          <section id="features">
            <h2 className="text-xl font-black text-white mb-4">{zh ? "主要功能" : "Key Features"}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.features.map((f, i) => (
                <div key={i} className={`flex items-start gap-3 rounded-xl border ${data.borderCls} bg-gradient-to-br ${data.bgGrad} p-4`}>
                  <div className={`${data.accentCls} flex-shrink-0 mt-0.5`}>{f.icon}</div>
                  <div>
                    <div className="font-bold text-white text-sm mb-1">{zh ? f.title.zh : f.title.en}</div>
                    <div className="text-slate-400 text-xs leading-relaxed">{zh ? f.desc.zh : f.desc.en}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── 优缺点 ── */}
          <section id="pros-cons">
            <h2 className="text-xl font-black text-white mb-4">{zh ? "优缺点分析" : "Pros & Cons"}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-emerald-400 text-sm">{zh ? "优点" : "Pros"}</span>
                </div>
                <ul className="space-y-2">
                  {(zh ? data.pros.zh : data.pros.en).map((p, i) => (
                    <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>{p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="font-bold text-red-400 text-sm">{zh ? "缺点" : "Cons"}</span>
                </div>
                <ul className="space-y-2">
                  {(zh ? data.cons.zh : data.cons.en).map((c, i) => (
                    <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>{c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-3 bg-white/5 border border-white/10 rounded-xl p-4 text-sm">
              <span className="text-slate-400">{zh ? "最适合：" : "Best For: "}</span>
              <span className={`font-semibold ${data.accentCls}`}>{zh ? data.bestFor.zh : data.bestFor.en}</span>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section id="faq">
            <h2 className="text-xl font-black text-white mb-4">{zh ? "常见问题" : "FAQ"}</h2>
            <div className="space-y-3">
              {data.faqs.map((faq, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="font-bold text-white text-sm mb-2">Q: {zh ? faq.q.zh : faq.q.en}</div>
                  <div className="text-slate-300 text-sm leading-relaxed">A: {zh ? faq.a.zh : faq.a.en}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── 下载链接 ── */}
          <section id="download-links">
            <h2 className="text-xl font-black text-white mb-4">{zh ? `下载 ${data.name}` : `Download ${data.nameEn}`}</h2>
            <div className="flex flex-wrap gap-3">
              {data.downloadLinks.map((dl, i) => (
                <a key={i} href={dl.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 transition text-sm text-white">
                  <Download className="w-4 h-4" />
                  {dl.platform}
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              ))}
            </div>
          </section>

          {/* ── 底部 CTA ── */}
          <div className={`rounded-2xl border ${data.borderCls} bg-gradient-to-br ${data.bgGrad} p-6 text-center`}>
            <div className="text-3xl mb-3">{data.emoji}</div>
            <h3 className="text-xl font-black text-white mb-2">
              {zh ? `前往 ${data.name} 官方注册链接` : `Open ${data.nameEn} Official Sign-up Link`}
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              {zh ? "邀请码通常会自动带入；如未带入，请手动填写 getitpro。" : "The referral code is usually prefilled; if not, manually enter getitpro."}
            </p>
            <Button asChild className="font-black px-8 py-5 text-base"
              style={{ background: `linear-gradient(135deg, ${data.color}44, ${data.color}22)`, border: `1px solid ${data.color}66`, color: data.color }}>
              <a href={invite.referralLink} target="_blank" rel="noopener noreferrer" className="tap-target">
                {zh ? "前往官方注册链接" : "Open Official Sign-up Link"}
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>

          {/* ── 相关链接 ── */}
          <div className="border-t border-white/10 pt-6">
            <p className="text-slate-500 text-xs text-center mb-3">{zh ? "相关页面" : "Related Pages"}</p>
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <Link href="/exchanges" className="text-slate-400 hover:text-white transition">
                {zh ? "交易所对比" : "Exchange Comparison"}
              </Link>
              <Link href={`/exchange-download?exchange=${slug}#registration-guide`} className="text-slate-400 hover:text-white transition" onMouseEnter={() => preloadRoute("/exchange-download")} onTouchStart={() => preloadRoute("/exchange-download")} onFocus={() => preloadRoute("/exchange-download")}>
                {zh ? "注册与下载教学" : "Sign-up Guide"}
              </Link>
              <Link href="/crypto-saving" className="text-slate-400 hover:text-white transition">
                {zh ? "交易成本指南" : "Trading Cost Guide"}
              </Link>
              <Link href="/exchange-guide" className="text-slate-400 hover:text-white transition">
                {zh ? "交易所扫盲" : "Exchange Tutorial"}
              </Link>
            </div>
          </div>

          <TrustSignalsCard
            zh={zh}
            title={zh ? "浣滆€呫€佸鏍镐笌鏉ユ簮璇存槑" : "Authorship, Review & Source Notes"}
            summary={zh ? "浜ゆ槗鎵€椤甸潰缁忓父浼氳鐢ㄦ埛鐢ㄦ潵鍋氬喅绛栵紝鎵€浠ユ妸鏉ユ簮渚濇嵁銆佹洿鏂版椂闂村拰鍚堜綔鎶湶缁熶竴鏀惧湪椤甸潰鏈熬锛屼究浜庨槄璇诲畬涓昏鍐呭鍚庡啀鍋氬垽鏂€?"
              : "Exchange pages are often used for direct decisions, so the source basis, review timing, and disclosure notes are grouped near the footer for a final check after the main content."}
            author={zh ? "Get8 Pro 鐮旂┒鍥㈤槦" : "Get8 Pro Research Desk"}
            reviewer={zh ? "Get8 Pro 鍐呭瀹℃牳" : "Get8 Pro Editorial Review"}
            updatedAt={TRUST_LAST_REVIEWED}
            sources={trustSources}
            disclosure={trustDisclosure}
          />
        </div>
      </div>
    </>
  );
}
