import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, ExternalLink, Twitter, Youtube, Send, Calculator, Shield, Globe, Wifi, WifiOff } from "lucide-react";
import { goBack } from "@/hooks/useScrollMemory";

// ─── 分类定义 ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "all",       zhLabel: "全部",       enLabel: "All" },
  { key: "news",      zhLabel: "资讯新闻",   enLabel: "News" },
  { key: "price",     zhLabel: "行情价格",   enLabel: "Price" },
  { key: "chart",     zhLabel: "图表分析",   enLabel: "Charts" },
  { key: "onchain",   zhLabel: "链上数据",   enLabel: "On-Chain" },
  { key: "defi",      zhLabel: "DeFi",       enLabel: "DeFi" },
  { key: "security",  zhLabel: "安全工具",   enLabel: "Security" },
  { key: "social",    zhLabel: "社区社交",   enLabel: "Social" },
  { key: "calculator",zhLabel: "计算工具",   enLabel: "Calculator" },
  { key: "nft",       zhLabel: "NFT",        enLabel: "NFT" },
  { key: "tax",       zhLabel: "税务合规",   enLabel: "Tax" },
  { key: "general",   zhLabel: "综合工具",   enLabel: "General" },
];

const DIFFICULTY_LABELS: Record<string, { zh: string; en: string; color: string }> = {
  beginner:     { zh: "新手",   en: "Beginner",     color: "bg-green-500/20 text-green-400 border-green-500/30" },
  intermediate: { zh: "进阶",   en: "Intermediate", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  advanced:     { zh: "高级",   en: "Advanced",     color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

// ─── 工具数据 ─────────────────────────────────────────────────────────────────
// needVpn: true = 国内需要VPN, false = 国内可直接访问
const DEFAULT_TOOLS = [
  // ── 资讯新闻 ──
  {
    id: 2, icon: "📡",
    name: "律动 BlockBeats",           nameEn: "BlockBeats",
    description: "国内领先的加密货币媒体，提供深度行业报道、项目分析和市场快讯，是币圈人必读的中文媒体",
    descriptionEn: "China's leading crypto media with in-depth industry reports, project analysis, and market news — essential reading for Chinese crypto community",
    category: "news", source: "BlockBeats", url: "https://www.theblockbeats.info",
    tags: "资讯,深度,华语", difficulty: "beginner", needVpn: false, sortOrder: 2, isActive: true,
  },
  {
    id: 3, icon: "⚡",
    name: "金十数据",                   nameEn: "Jinshi Data",
    description: "实时财经快讯平台，提供加密货币、外汇、大宗商品等全球市场的秒级资讯推送，适合关注宏观行情的投资者",
    descriptionEn: "Real-time financial news platform with second-level updates on crypto, forex, and commodities — ideal for macro-focused investors",
    category: "news", source: "金十数据", url: "https://www.jin10.com",
    tags: "快讯,宏观,实时", difficulty: "beginner", needVpn: false, sortOrder: 3, isActive: true,
  },
  {
    id: 4, icon: "🌐",
    name: "CoinDesk 新闻",             nameEn: "CoinDesk",
    description: "全球最权威的加密货币英文媒体，提供行业深度报道、政策解读和市场分析",
    descriptionEn: "World's most authoritative English crypto media with in-depth industry coverage, policy analysis, and market insights",
    category: "news", source: "CoinDesk", url: "https://www.coindesk.com",
    tags: "英文,深度,权威", difficulty: "intermediate", needVpn: true, sortOrder: 4, isActive: true,
  },
  // ── 行情价格 ──
  {
    id: 5, icon: "🦎",
    name: "CoinGecko 行情",            nameEn: "CoinGecko",
    description: "全球最大加密货币数据平台，实时价格、市值、交易量，支持数千种代币",
    descriptionEn: "World's largest crypto data platform with real-time prices, market cap, and volume for thousands of tokens",
    category: "price", source: "CoinGecko", url: "https://www.coingecko.com",
    tags: "价格,市值,新手", difficulty: "beginner", needVpn: true, sortOrder: 5, isActive: true,
  },
  {
    id: 6, icon: "📊",
    name: "CoinMarketCap",             nameEn: "CoinMarketCap",
    description: "加密货币市场数据权威平台，提供价格、排名、DeFi、NFT 等全方位数据",
    descriptionEn: "Leading crypto market data platform with prices, rankings, DeFi and NFT data",
    category: "price", source: "CoinMarketCap", url: "https://coinmarketcap.com",
    tags: "价格,排名,新手", difficulty: "beginner", needVpn: true, sortOrder: 6, isActive: true,
  },
  {
    id: 7, icon: "📉",
    name: "Coinglass 合约数据",        nameEn: "Coinglass",
    description: "专注合约市场的数据平台，提供爆仓数据、多空比、资金费率、持仓量等衍生品核心指标",
    descriptionEn: "Derivatives-focused data platform with liquidation data, long/short ratio, funding rates, and open interest",
    category: "price", source: "Coinglass", url: "https://www.coinglass.com",
    tags: "合约,爆仓,资金费率", difficulty: "intermediate", needVpn: false, sortOrder: 7, isActive: true,
  },
  {
    id: 8, icon: "😱",
    name: "恐贪指数",                   nameEn: "Fear & Greed Index",
    description: "比特币市场情绪指数，0-100 分衡量市场恐惧与贪婪程度，辅助判断市场顶底",
    descriptionEn: "Bitcoin market sentiment index from 0-100 measuring fear and greed to help identify market tops and bottoms",
    category: "price", source: "Alternative.me", url: "https://alternative.me/crypto/fear-and-greed-index/",
    tags: "情绪,市场,新手", difficulty: "beginner", needVpn: true, sortOrder: 8, isActive: true,
  },
  // ── 图表分析 ──
  {
    id: 9, icon: "📈",
    name: "TradingView 图表",          nameEn: "TradingView",
    description: "专业 K 线图表工具，支持技术指标、画线工具，是交易者必备的图表分析平台",
    descriptionEn: "Professional charting tool with technical indicators and drawing tools, essential for traders",
    category: "chart", source: "TradingView", url: "https://www.tradingview.com",
    tags: "K线,技术分析,进阶", difficulty: "intermediate", needVpn: true, sortOrder: 9, isActive: true,
  },
  // ── 链上数据 ──
  {
    id: 10, icon: "🔍",
    name: "Etherscan 区块浏览器",      nameEn: "Etherscan",
    description: "以太坊区块链浏览器，查询交易记录、钱包余额、智能合约，链上数据透明可查",
    descriptionEn: "Ethereum blockchain explorer to check transactions, wallet balances, and smart contracts",
    category: "onchain", source: "Etherscan", url: "https://etherscan.io",
    tags: "链上,以太坊,新手", difficulty: "beginner", needVpn: true, sortOrder: 10, isActive: true,
  },
  {
    id: 11, icon: "🔎",
    name: "BscScan 区块浏览器",        nameEn: "BscScan",
    description: "币安智能链（BSC）区块浏览器，查询 BNB Chain 上的交易、合约和代币信息",
    descriptionEn: "BNB Chain block explorer for transactions, contracts, and token information on BSC",
    category: "onchain", source: "BscScan", url: "https://bscscan.com",
    tags: "链上,BSC,新手", difficulty: "beginner", needVpn: true, sortOrder: 11, isActive: true,
  },
  {
    id: 12, icon: "🦙",
    name: "DeFiLlama TVL 追踪",        nameEn: "DeFiLlama",
    description: "追踪所有 DeFi 协议的 TVL（总锁仓量），了解 DeFi 生态资金流向和协议排名",
    descriptionEn: "Track TVL across all DeFi protocols to understand capital flows and protocol rankings",
    category: "defi", source: "DeFiLlama", url: "https://defillama.com",
    tags: "DeFi,TVL,进阶", difficulty: "intermediate", needVpn: true, sortOrder: 12, isActive: true,
  },
  {
    id: 13, icon: "🔮",
    name: "Dune Analytics 数据分析",   nameEn: "Dune Analytics",
    description: "链上数据查询和可视化平台，可自定义 SQL 查询区块链数据，适合深度研究者",
    descriptionEn: "On-chain data query and visualization platform with custom SQL queries for blockchain data",
    category: "onchain", source: "Dune Analytics", url: "https://dune.com",
    tags: "链上,数据分析,高级", difficulty: "advanced", needVpn: true, sortOrder: 13, isActive: true,
  },
  {
    id: 14, icon: "🧠",
    name: "Nansen 智能钱包追踪",       nameEn: "Nansen",
    description: "追踪聪明钱包（Smart Money）的链上行为，发现早期机会和市场趋势",
    descriptionEn: "Track smart money on-chain behavior to discover early opportunities and market trends",
    category: "onchain", source: "Nansen", url: "https://www.nansen.ai",
    tags: "聪明钱包,链上,高级", difficulty: "advanced", needVpn: true, sortOrder: 14, isActive: true,
  },
  {
    id: 15, icon: "🔬",
    name: "Glassnode 链上指标",        nameEn: "Glassnode",
    description: "专业链上数据分析平台，提供比特币/以太坊持仓分布、矿工行为等高级指标",
    descriptionEn: "Professional on-chain analytics with BTC/ETH holder distribution, miner behavior, and advanced metrics",
    category: "onchain", source: "Glassnode", url: "https://glassnode.com",
    tags: "链上,比特币,高级", difficulty: "advanced", needVpn: true, sortOrder: 15, isActive: true,
  },
  // ── DeFi ──
  {
    id: 16, icon: "⛽",
    name: "ETH Gas 费用追踪",          nameEn: "ETH Gas Tracker",
    description: "实时追踪以太坊 Gas 费用，选择最优时机发送交易，节省手续费",
    descriptionEn: "Real-time Ethereum gas fee tracker to choose optimal timing for transactions and save on fees",
    category: "defi", source: "Etherscan", url: "https://etherscan.io/gastracker",
    tags: "Gas,以太坊,新手", difficulty: "beginner", needVpn: true, sortOrder: 16, isActive: true,
  },
  {
    id: 17, icon: "🦄",
    name: "Uniswap 去中心化交易",      nameEn: "Uniswap",
    description: "以太坊最大去中心化交易所，直接用钱包兑换代币，无需注册，支持数千种 ERC-20 代币",
    descriptionEn: "Ethereum's largest DEX for swapping tokens directly from your wallet, no registration needed",
    category: "defi", source: "Uniswap", url: "https://app.uniswap.org",
    tags: "DEX,DeFi,进阶", difficulty: "intermediate", needVpn: true, sortOrder: 17, isActive: true,
  },
  // ── 安全工具 ──
  {
    id: 18, icon: "🦊",
    name: "MetaMask 钱包",             nameEn: "MetaMask",
    description: "最流行的以太坊浏览器插件钱包，支持 EVM 兼容链，是进入 DeFi/NFT 世界的必备工具",
    descriptionEn: "Most popular Ethereum browser wallet supporting EVM-compatible chains, essential for DeFi and NFT",
    category: "security", source: "MetaMask", url: "https://metamask.io",
    tags: "钱包,安全,新手", difficulty: "beginner", needVpn: true, sortOrder: 18, isActive: true,
  },
  {
    id: 19, icon: "🛡️",
    name: "Revoke.cash 授权管理",      nameEn: "Revoke.cash",
    description: "检查并撤销钱包对智能合约的代币授权，防止因过度授权导致资产被盗",
    descriptionEn: "Check and revoke token approvals to smart contracts, protecting assets from over-approval exploits",
    category: "security", source: "Revoke.cash", url: "https://revoke.cash",
    tags: "安全,授权,进阶", difficulty: "intermediate", needVpn: true, sortOrder: 19, isActive: true,
  },
  // ── 社区社交 ──
  {
    id: 20, icon: "🐦",
    name: "X (Twitter) 币圈社区",      nameEn: "X (Twitter) Crypto",
    description: "全球币圈最活跃的社交平台，关注项目方、KOL 和交易所官方账号，第一时间获取市场动态",
    descriptionEn: "The most active global crypto social platform — follow projects, KOLs, and exchanges for real-time market updates",
    category: "social", source: "X (Twitter)", url: "https://x.com/search?q=%23crypto",
    tags: "社交,KOL,动态", difficulty: "beginner", needVpn: true, sortOrder: 20, isActive: true,
  },
  {
    id: 21, icon: "✈️",
    name: "Telegram 币圈群组",         nameEn: "Telegram Crypto Groups",
    description: "币圈项目方和社区最常用的即时通讯工具，大多数项目的官方公告和社区讨论都在 Telegram",
    descriptionEn: "The most popular messaging tool for crypto projects and communities — most official announcements and community discussions happen here",
    category: "social", source: "Telegram", url: "https://telegram.org",
    tags: "社交,社区,公告", difficulty: "beginner", needVpn: true, sortOrder: 21, isActive: true,
  },
  {
    id: 22, icon: "▶️",
    name: "YouTube 币圈频道",          nameEn: "YouTube Crypto Channels",
    description: "观看币圈教程、项目分析和市场解读视频，适合新手系统学习加密货币知识",
    descriptionEn: "Watch crypto tutorials, project analysis, and market commentary videos — great for beginners to systematically learn about crypto",
    category: "social", source: "YouTube", url: "https://www.youtube.com/results?search_query=crypto+tutorial",
    tags: "视频,教程,学习", difficulty: "beginner", needVpn: true, sortOrder: 22, isActive: true,
  },
  // ── 综合工具 ──
  {
    id: 23, icon: "📋",
    name: "Messari 研究报告",          nameEn: "Messari",
    description: "加密货币研究和数据平台，提供项目分析报告、代币经济学研究，适合深度投研",
    descriptionEn: "Crypto research and data platform with project analysis, tokenomics research for deep investment research",
    category: "general", source: "Messari", url: "https://messari.io",
    tags: "研究,报告,进阶", difficulty: "intermediate", needVpn: true, sortOrder: 23, isActive: true,
  },
  {
    id: 24, icon: "⚖️",
    name: "CryptoCompare 对比",        nameEn: "CryptoCompare",
    description: "多维度加密货币对比平台，支持交易所、钱包、矿池等产品的详细评测与对比",
    descriptionEn: "Multi-dimensional crypto comparison platform for exchanges, wallets, mining pools with detailed reviews",
    category: "general", source: "CryptoCompare", url: "https://www.cryptocompare.com",
    tags: "对比,评测,新手", difficulty: "beginner", needVpn: true, sortOrder: 24, isActive: true,
  },
  // ── NFT ──
  {
    id: 25, icon: "🖼️",
    name: "NFT Floor Price 追踪",      nameEn: "NFTGo",
    description: "实时追踪主流 NFT 系列的地板价、交易量和持有者分布，快速把握 NFT 市场动态",
    descriptionEn: "Real-time tracking of floor prices, volume, and holder distribution for major NFT collections",
    category: "nft", source: "NFTGo", url: "https://nftgo.io",
    tags: "NFT,地板价,进阶", difficulty: "intermediate", needVpn: true, sortOrder: 25, isActive: true,
  },
  // ── 税务合规 ──
  {
    id: 26, icon: "🧾",
    name: "Koinly 税务计算",           nameEn: "Koinly",
    description: "加密货币税务计算工具，自动整合交易记录，生成合规税务报告",
    descriptionEn: "Crypto tax calculator that automatically aggregates trading records and generates compliant tax reports",
    category: "tax", source: "Koinly", url: "https://koinly.io",
    tags: "税务,合规,进阶", difficulty: "intermediate", needVpn: true, sortOrder: 26, isActive: true,
  },
];

// ─── 手续费计算器组件 ────────────────────────────────────────────────────────
function FeeCalculator({ zh }: { zh: boolean }) {
  const [amount, setAmount] = useState("");
  const [feeRate, setFeeRate] = useState("0.1");
  const [leverage, setLeverage] = useState("1");

  const numAmount = parseFloat(amount) || 0;
  const numFee = parseFloat(feeRate) || 0;
  const numLev = parseFloat(leverage) || 1;

  const positionSize = numAmount * numLev;
  const openFee = positionSize * (numFee / 100);
  const closeFee = positionSize * (numFee / 100);
  const totalFee = openFee + closeFee;
  const breakEvenPct = numAmount > 0 ? (totalFee / numAmount) * 100 : 0;

  return (
    <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-5 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Calculator size={18} className="text-yellow-400" />
        <h3 className="font-bold text-yellow-400 text-base">
          {zh ? "手续费计算器" : "Fee Calculator"}
        </h3>
        <span className="text-xs text-slate-500 ml-1">
          {zh ? "（开仓 + 平仓双边）" : "(Open + Close, both sides)"}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">{zh ? "本金 (USDT)" : "Principal (USDT)"}</label>
          <input
            type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="1000"
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:border-yellow-500"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">{zh ? "手续费率 (%)" : "Fee Rate (%)"}</label>
          <input
            type="number" value={feeRate} onChange={e => setFeeRate(e.target.value)}
            placeholder="0.1" step="0.01"
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:border-yellow-500"
          />
          <p className="text-xs text-slate-600 mt-1">{zh ? "OKX/Binance Maker≈0.02%, Taker≈0.05%" : "OKX/Binance Maker≈0.02%, Taker≈0.05%"}</p>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">{zh ? "杠杆倍数" : "Leverage"}</label>
          <input
            type="number" value={leverage} onChange={e => setLeverage(e.target.value)}
            placeholder="1" min="1" max="125"
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:border-yellow-500"
          />
        </div>
      </div>
      {numAmount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: zh ? "仓位大小" : "Position Size", value: `${positionSize.toFixed(2)} USDT`, color: "text-white" },
            { label: zh ? "开仓手续费" : "Open Fee",    value: `${openFee.toFixed(4)} USDT`,      color: "text-orange-400" },
            { label: zh ? "平仓手续费" : "Close Fee",   value: `${closeFee.toFixed(4)} USDT`,     color: "text-orange-400" },
            { label: zh ? "双边总费用" : "Total Fees",  value: `${totalFee.toFixed(4)} USDT`,     color: "text-red-400" },
          ].map(item => (
            <div key={item.label} className="bg-slate-800/60 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">{item.label}</p>
              <p className={`font-bold text-sm ${item.color}`}>{item.value}</p>
            </div>
          ))}
          <div className="col-span-2 sm:col-span-4 bg-slate-800/40 rounded-xl p-3 text-center border border-slate-700/40">
            <p className="text-xs text-slate-500 mb-1">
              {zh ? "盈亏平衡涨幅（需涨超此幅度才开始盈利）" : "Break-even move needed to start profiting"}
            </p>
            <p className="font-bold text-yellow-400 text-lg">{breakEvenPct.toFixed(4)}%</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 谷歌验证器提示卡 ────────────────────────────────────────────────────────
function GoogleAuthCard({ zh }: { zh: boolean }) {
  return (
    <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 mb-8">
      <div className="flex items-start gap-3">
        <div className="text-3xl flex-shrink-0">🔐</div>
        <div className="flex-1">
          <h3 className="font-bold text-blue-300 text-base mb-1">
            {zh ? "Google 验证器（交易所二次验证必备）" : "Google Authenticator (Required for 2FA)"}
          </h3>
          <p className="text-slate-400 text-sm mb-3 leading-relaxed">
            {zh
              ? "几乎所有主流交易所（OKX、Binance、Bybit 等）都要求开启「谷歌验证器」进行二次验证（2FA），用于保护账户安全。每次登录或提币时需要输入验证器中的 6 位动态码。强烈建议所有用户在注册交易所后立即绑定。"
              : "Almost all major exchanges (OKX, Binance, Bybit, etc.) require Google Authenticator for two-factor authentication (2FA) to protect your account. You'll need the 6-digit code when logging in or withdrawing funds. We strongly recommend binding it immediately after registration."}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://apps.apple.com/app/google-authenticator/id388497605"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-sm font-medium transition-all"
            >
              <span>🍎</span>
              <span>{zh ? "iOS 下载" : "Download iOS"}</span>
              <ExternalLink size={12} className="text-slate-400" />
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-sm font-medium transition-all"
            >
              <span>🤖</span>
              <span>{zh ? "Android 下载" : "Download Android"}</span>
              <ExternalLink size={12} className="text-slate-400" />
            </a>
            <a
              href="https://support.google.com/accounts/answer/1066447"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 text-sm font-medium transition-all"
            >
              <span>📖</span>
              <span>{zh ? "使用教程" : "Setup Guide"}</span>
              <ExternalLink size={12} />
            </a>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            {zh
              ? "⚠️ 绑定后请务必保存好备份码（Recovery Codes），手机丢失时可用于恢复账户"
              : "⚠️ After binding, save your Recovery Codes — they're needed if you lose your phone"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── 社交媒体入口 ────────────────────────────────────────────────────────────
function SocialBar({ zh }: { zh: boolean }) {
  const socials = [
    { icon: <Twitter size={16} />, label: "X / Twitter", url: "https://x.com/search?q=%23crypto", color: "hover:border-sky-400/60 hover:text-sky-400" },
    { icon: <Send size={16} />,    label: "Telegram",    url: "https://telegram.org",              color: "hover:border-blue-400/60 hover:text-blue-400" },
    { icon: <Youtube size={16} />, label: "YouTube",     url: "https://www.youtube.com/results?search_query=crypto+tutorial", color: "hover:border-red-400/60 hover:text-red-400" },
  ];
  return (
    <div className="flex flex-wrap gap-3 mb-8 justify-center">
      {socials.map(s => (
        <a
          key={s.label}
          href={s.url}
          target="_blank" rel="noopener noreferrer"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700/60 bg-slate-800/40 text-slate-400 text-sm font-medium transition-all ${s.color}`}
        >
          {s.icon}
          <span>{s.label}</span>
          <span className="text-xs text-slate-600">{zh ? "需VPN" : "VPN req."}</span>
        </a>
      ))}
    </div>
  );
}

// ─── 主页面 ──────────────────────────────────────────────────────────────────
export default function CryptoTools() {
  const { language, setLanguage } = useLanguage();
  const zh = language === "zh";
  const [, navigate] = useLocation();

  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [vpnFilter, setVpnFilter] = useState<"all" | "no-vpn" | "vpn">("all");

  const filtered = useMemo(() => {
    return DEFAULT_TOOLS.filter(t => {
      if (!t.isActive) return false;
      const matchCat = activeCategory === "all" || t.category === activeCategory;
      const matchVpn =
        vpnFilter === "all" ? true :
        vpnFilter === "no-vpn" ? !t.needVpn :
        t.needVpn;
      const q = search.toLowerCase();
      const matchSearch = !q
        || (zh ? t.name : t.nameEn).toLowerCase().includes(q)
        || (zh ? t.description : t.descriptionEn).toLowerCase().includes(q)
        || t.source.toLowerCase().includes(q)
        || (t.tags || "").toLowerCase().includes(q);
      return matchCat && matchVpn && matchSearch;
    });
  }, [activeCategory, search, vpnFilter, zh]);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* ── 顶部导航栏 ── */}
      <div className="border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* 返回按钮 */}
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-yellow-400 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">{zh ? "返回上一页" : "Back"}</span>
          </button>

          {/* Logo */}
          <button onClick={() => navigate("/")} className="text-lg font-black text-white tracking-tight">
            Web3<span className="text-yellow-400">{zh ? "导航" : "Nav"}</span>
          </button>

          {/* 语言切换 */}
          <button
            onClick={() => setLanguage(zh ? "en" : "zh")}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-slate-600 text-slate-400 hover:border-yellow-500/60 hover:text-yellow-400 transition-all"
          >
            {zh ? "EN" : "中文"}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* ── 标题区 ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-sm mb-4">
            <span>🛠️</span>
            <span>{zh ? "精选工具合集" : "Curated Tool Collection"}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
            {zh ? "币圈工具合集" : "Crypto Tools Hub"}
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            {zh
              ? "精选新手到专业交易者都能用到的加密货币工具，标注来源、VPN 需求与功能，一键直达"
              : "Curated crypto tools for beginners to pro traders — with source, VPN requirements, and direct links"}
          </p>
        </div>

        {/* ── 社交媒体入口 ── */}
        <SocialBar zh={zh} />

        {/* ── 谷歌验证器提示 ── */}
        <GoogleAuthCard zh={zh} />

        {/* ── 手续费计算器 ── */}
        <FeeCalculator zh={zh} />

        {/* ── 搜索框 ── */}
        <div className="mb-5">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={zh ? "搜索工具名称、来源、标签..." : "Search tools, sources, tags..."}
            className="w-full max-w-md mx-auto block px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/60 text-sm"
          />
        </div>

        {/* ── VPN 筛选 ── */}
        <div className="flex justify-center gap-2 mb-5">
          {[
            { key: "all",    icon: <Globe size={13} />,   zh: "全部",      en: "All" },
            { key: "no-vpn", icon: <Wifi size={13} />,    zh: "🟢 无需VPN", en: "🟢 No VPN" },
            { key: "vpn",    icon: <WifiOff size={13} />, zh: "🔒 需要VPN", en: "🔒 Needs VPN" },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setVpnFilter(opt.key as typeof vpnFilter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                vpnFilter === opt.key
                  ? "bg-yellow-500 text-black border-yellow-500"
                  : "bg-slate-800/60 text-slate-400 border-slate-700/60 hover:border-yellow-500/40"
              }`}
            >
              {opt.icon}
              {zh ? opt.zh : opt.en}
            </button>
          ))}
        </div>

        {/* ── 分类 Tabs ── */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                activeCategory === cat.key
                  ? "bg-yellow-500 text-black border-yellow-500"
                  : "bg-slate-800/60 text-slate-400 border-slate-700/60 hover:border-yellow-500/40 hover:text-yellow-400"
              }`}
            >
              {zh ? cat.zhLabel : cat.enLabel}
            </button>
          ))}
        </div>

        {/* ── 工具卡片网格 ── */}
        {filtered.length === 0 ? (
          <div className="text-center text-slate-500 py-20">
            <div className="text-4xl mb-3">🔍</div>
            <p>{zh ? "没有找到匹配的工具" : "No tools found"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(tool => {
              const diff = DIFFICULTY_LABELS[tool.difficulty] ?? DIFFICULTY_LABELS.beginner;
              const tags = tool.tags ? tool.tags.split(",").filter(Boolean) : [];
              const catLabel = CATEGORIES.find(c => c.key === tool.category);
              return (
                <div
                  key={tool.id}
                  className="group relative rounded-2xl border border-slate-700/50 bg-slate-800/40 hover:border-yellow-500/40 hover:bg-slate-800/70 transition-all duration-200 overflow-hidden flex flex-col"
                >
                  <div className="p-5 flex-1 flex flex-col">
                    {/* Icon + Name + VPN badge */}
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-3xl flex-shrink-0">{tool.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-white text-base leading-tight">
                            {zh ? tool.name : tool.nameEn}
                          </h3>
                          {/* VPN 标注 */}
                          {tool.needVpn ? (
                            <span className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-medium">
                              🔒 {zh ? "需VPN" : "VPN"}
                            </span>
                          ) : (
                            <span className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-medium">
                              🟢 {zh ? "可直连" : "Direct"}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {zh ? "来源：" : "Source: "}<span className="text-slate-400">{tool.source}</span>
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-1 line-clamp-3">
                      {zh ? tool.description : tool.descriptionEn}
                    </p>

                    {/* Tags */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {tags.slice(0, 4).map(tag => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400 border border-slate-600/40">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${diff.color}`}>
                        {zh ? diff.zh : diff.en}
                      </span>
                      {catLabel && (
                        <span className="text-xs text-slate-500 bg-slate-700/40 px-2.5 py-1 rounded-full border border-slate-600/30">
                          {zh ? catLabel.zhLabel : catLabel.enLabel}
                        </span>
                      )}
                    </div>

                    {/* CTA */}
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-center py-2.5 px-4 rounded-xl bg-yellow-500/10 hover:bg-yellow-500 border border-yellow-500/30 hover:border-yellow-500 text-yellow-400 hover:text-black font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <span>{zh ? "前往使用" : "Open Tool"}</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── 底部统计 ── */}
        <div className="text-center mt-10 text-slate-600 text-sm">
          {zh
            ? `共收录 ${DEFAULT_TOOLS.length} 个工具，当前显示 ${filtered.length} 个 · 🟢 ${DEFAULT_TOOLS.filter(t => !t.needVpn).length} 个无需VPN`
            : `${DEFAULT_TOOLS.length} tools total, showing ${filtered.length} · 🟢 ${DEFAULT_TOOLS.filter(t => !t.needVpn).length} accessible without VPN`}
        </div>
      </div>
    </div>
  );
}
