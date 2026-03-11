/**
 * 交易所中心 — /exchanges
 * 三个 Tab：💰 返佣对比 | 🔍 各交易所详情 | 📚 交易所科普
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollMemory, goBack } from "@/hooks/useScrollMemory";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import {
  ArrowLeft, ExternalLink, Gift, Key, Shield, Star,
  Check, X, ChevronDown, ChevronUp, Users, TrendingUp,
  TrendingDown, Globe, Zap, Clock, BarChart2, Lock,
  RefreshCw, CheckCircle2, ChevronRight, MessageCircle,
} from "lucide-react";
import { EXCHANGE_FEES, SPOT_MAKER_ROW, FUT_MAKER_ROW, REBATE_ROW, INVITE_CODES } from "@shared/exchangeFees";
import { useExchangeLinks } from '@/contexts/ExchangeLinksContext';
import { trpc } from "@/lib/trpc";

// ─────────────────────────────────────────────────────────────────────────────
// 数据层
// ─────────────────────────────────────────────────────────────────────────────

const STATIC: Record<string, {
  emoji: string; color: string; accentCls: string; borderCls: string; bgGrad: string;
  spotMaker: string; spotTaker: string; futMaker: string; futTaker: string;
  rebateStars: string; founded: string; hq: string; coins: string;
  volume: string; reserve: string; leverage: string; token: string;
  badge: { zh: string; en: string }; badgeCls: string;
  tagline: { zh: string; en: string };
  desc: { zh: string; en: string };
  highlights: { icon: string; zh: string; en: string }[];
  pros: { zh: string[]; en: string[] };
  cons: { zh: string[]; en: string[] };
  bestFor: { zh: string; en: string };
}> = {
  gate: {
    emoji: "🟢", color: "#00B173", accentCls: "text-emerald-400",
    borderCls: "border-emerald-500/40", bgGrad: "from-emerald-950/60 to-gray-900",
    spotMaker: EXCHANGE_FEES.gate.spotMaker, spotTaker: EXCHANGE_FEES.gate.spotTaker, futMaker: EXCHANGE_FEES.gate.futMaker, futTaker: EXCHANGE_FEES.gate.futTaker,
    rebateStars: "⭐⭐⭐⭐⭐", founded: "2013", hq: "开曼群岛", coins: "3,600+",
    volume: "$18.8亿", reserve: "125%", leverage: "100x", token: "GT",
    badge: { zh: "新币最多", en: "Most Altcoins" }, badgeCls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    tagline: { zh: "最多新币 · 最透明储备 · TradFi先锋", en: "Most Altcoins · Highest Transparency · TradFi Pioneer" },
    desc: {
      zh: "Gate.io 成立于 2013 年，是全球历史最悠久的主流交易所之一。全球首家承诺 100% 储备，与 Armanino LLP 合作审计，储备率高达 125%，支持 3,600+ 种加密货币。",
      en: "Gate.io (est. 2013) is one of the oldest mainstream exchanges. World's first 100% reserve commitment, audited by Armanino LLP with 125% reserve ratio, supporting 3,600+ cryptocurrencies.",
    },
    highlights: [
      { icon: "🪙", zh: "支持 3,600+ 种加密货币，远超其他主流交易所", en: "Supports 3,600+ cryptocurrencies, far more than other major exchanges" },
      { icon: "🔍", zh: "全球首家 100% 储备承诺，储备率高达 125%", en: "World's first 100% reserve commitment, reserve ratio up to 125%" },
      { icon: "🏦", zh: "支持黄金代币 (XAUt) 等传统金融资产，TradFi 友好", en: "Supports gold tokens (XAUt) and TradFi assets — unique among top exchanges" },
      { icon: "💰", zh: "返佣比例高达 60%，全行业最高", en: "Up to 60% rebate rate — highest in the industry" },
    ],
    pros: { zh: ["新币上线最快最多", "储备透明度全行业最高", "支持黄金等传统金融资产", "返佣比例高达 60%"], en: ["Fastest and most new coin listings", "Highest reserve transparency", "Supports gold and TradFi assets", "Up to 60% rebate rate"] },
    cons: { zh: ["界面相对复杂，新手需适应", "主流币流动性略低于 Binance/OKX"], en: ["Interface relatively complex for beginners", "Liquidity slightly lower than Binance/OKX"] },
    bestFor: { zh: "山寨币猎手 · TradFi 投资者 · 追求透明度的用户", en: "Altcoin hunters · TradFi investors · Transparency-focused users" },
  },
  okx: {
    emoji: "🔷", color: "#3B82F6", accentCls: "text-blue-400",
    borderCls: "border-blue-500/40", bgGrad: "from-blue-950/60 to-gray-900",
    spotMaker: EXCHANGE_FEES.okx.spotMaker, spotTaker: EXCHANGE_FEES.okx.spotTaker, futMaker: EXCHANGE_FEES.okx.futMaker, futTaker: EXCHANGE_FEES.okx.futTaker,
    rebateStars: "⭐⭐⭐⭐⭐", founded: "2017", hq: "塞舌尔/巴哈马", coins: "350+",
    volume: "$16.5亿", reserve: "105%+", leverage: "125x", token: "OKB",
    badge: { zh: "Web3 最强", en: "Best Web3" }, badgeCls: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    tagline: { zh: "Web3 门户 · 最强 DEX · 自有 Layer2", en: "Web3 Gateway · Best DEX · Own Layer2" },
    desc: {
      zh: "OKX 是全球第二大加密交易所，以强大的 Web3 生态著称。Web3 钱包支持 100+ 公链，内置 DEX 聚合器，自有 X Layer 二层网络。2025 年已在德国、波兰获得正式监管牌照，CoinGlass 综合评分 88.77。",
      en: "OKX is the world's 2nd largest exchange, renowned for its Web3 ecosystem. Web3 wallet supports 100+ chains, built-in DEX aggregator, X Layer L2. Officially regulated in Germany & Poland in 2025. CoinGlass score 88.77.",
    },
    highlights: [
      { icon: "🌐", zh: "Web3 钱包支持 100+ 公链，最强多链钱包之一", en: "Web3 wallet supports 100+ chains — one of the strongest multi-chain wallets" },
      { icon: "⚡", zh: "内置 DEX 聚合器，一键访问全链最优价格", en: "Built-in DEX aggregator for best prices across all chains" },
      { icon: "🏛️", zh: "2025 年获德国、波兰正式监管牌照，合规领先", en: "Officially regulated in Germany and Poland in 2025 — compliance leader" },
      { icon: "📊", zh: "CoinGlass 综合评分 88.77，行业第二", en: "CoinGlass composite score 88.77, industry #2" },
    ],
    pros: { zh: ["Web3 生态最完整", "现货 Maker 费率 0.08% 行业最低之一", "德国/波兰持牌合规"], en: ["Most complete Web3 ecosystem", "Spot Maker fee 0.08% — one of lowest", "Licensed in Germany/Poland"] },
    cons: { zh: ["新币上线速度不及 Gate", "部分地区访问受限"], en: ["Slower new coin listings than Gate", "Access restricted in some regions"] },
    bestFor: { zh: "Web3 探索者 · 合约交易者 · 追求低费率的用户", en: "Web3 explorers · Contract traders · Low-fee seekers" },
  },
  binance: {
    emoji: "🟡", color: "#F0B90B", accentCls: "text-yellow-400",
    borderCls: "border-yellow-500/40", bgGrad: "from-yellow-950/60 to-gray-900",
    spotMaker: EXCHANGE_FEES.binance.spotMaker, spotTaker: EXCHANGE_FEES.binance.spotTaker, futMaker: EXCHANGE_FEES.binance.futMaker, futTaker: EXCHANGE_FEES.binance.futTaker,
    rebateStars: "⭐⭐⭐⭐", founded: "2017", hq: "开曼群岛", coins: "350+",
    volume: "$40-60亿", reserve: "100%+", leverage: "125x", token: "BNB",
    badge: { zh: "流动性最强", en: "Best Liquidity" }, badgeCls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    tagline: { zh: "全球最大 · 流动性最强 · 生态最全", en: "World Largest · Best Liquidity · Full Ecosystem" },
    desc: {
      zh: "币安是全球最大的加密交易所，日均交易量超 400 亿美元，注册用户超 2.5 亿，市场份额约 40%。CoinGlass 综合评分 94.33，行业第一。BNB Chain 是全球最活跃的公链之一。",
      en: "Binance is the world's largest exchange with $40B+ daily volume, 250M+ users, ~40% market share. CoinGlass score 94.33, industry #1. BNB Chain is one of the most active blockchains.",
    },
    highlights: [
      { icon: "🏆", zh: "CoinGlass 综合评分 94.33，全球第一", en: "CoinGlass composite score 94.33, global #1" },
      { icon: "👥", zh: "注册用户超 2.5 亿，全球最大用户基础", en: "250M+ registered users, world's largest user base" },
      { icon: "💧", zh: "日均交易量 400-600 亿美元，流动性无可匹敌", en: "$40-60B daily volume, unmatched liquidity" },
      { icon: "⛓️", zh: "BNB Chain 生态：数千个 DApp，最活跃公链之一", en: "BNB Chain ecosystem: thousands of DApps, most active chain" },
    ],
    pros: { zh: ["全球最大，流动性最强", "产品线最全面", "BNB 持有者享受手续费折扣"], en: ["World largest, best liquidity", "Most comprehensive product line", "BNB holders get fee discounts"] },
    cons: { zh: ["美国用户受限", "部分监管问题", "新手界面较复杂"], en: ["US users restricted", "Some regulatory issues", "Complex interface for beginners"] },
    bestFor: { zh: "主流币交易者 · 大额交易用户 · BNB 生态参与者", en: "Major coin traders · High-volume users · BNB ecosystem participants" },
  },
  bybit: {
    emoji: "🔵", color: "#2775CA", accentCls: "text-blue-300",
    borderCls: "border-blue-400/40", bgGrad: "from-blue-950/60 to-gray-900",
    spotMaker: EXCHANGE_FEES.bybit.spotMaker, spotTaker: EXCHANGE_FEES.bybit.spotTaker, futMaker: EXCHANGE_FEES.bybit.futMaker, futTaker: EXCHANGE_FEES.bybit.futTaker,
    rebateStars: "⭐⭐⭐⭐", founded: "2018", hq: "迪拜", coins: "1,000+",
    volume: "$10亿+", reserve: "100%+", leverage: "125x", token: "BIT",
    badge: { zh: "合约专家", en: "Derivatives Expert" }, badgeCls: "bg-blue-500/20 text-blue-300 border-blue-400/30",
    tagline: { zh: "合约专家 · 每月储备审计 · 荷兰持牌", en: "Derivatives Expert · Monthly Reserve Audit · Netherlands Licensed" },
    desc: {
      zh: "Bybit 成立于 2018 年，专注衍生品交易，合约 Maker 费率仅 0.01%，全行业最低之一。与 Hacken 合作每月发布储备金证明，ETH 储备率 101%。已在荷兰获得正式监管牌照。",
      en: "Bybit (est. 2018) specializes in derivatives. Contract Maker fee only 0.01% — one of the lowest. Monthly Proof of Reserves with Hacken, ETH reserve ratio 101%. Officially licensed in the Netherlands.",
    },
    highlights: [
      { icon: "📋", zh: "Hacken 每月储备金证明审计，ETH 储备率 101%", en: "Monthly Hacken Proof of Reserves audit, ETH reserve ratio 101%" },
      { icon: "🏛️", zh: "荷兰正式监管牌照，欧洲合规运营", en: "Official Netherlands license, EU-compliant operations" },
      { icon: "💰", zh: "合约 Maker 费率 0.01%，全行业最低之一", en: "Contract Maker fee 0.01% — one of lowest in industry" },
      { icon: "📈", zh: "2025 年底市场份额 9.5%，衍生品行业第二", en: "9.5% market share end of 2025, derivatives industry #2" },
    ],
    pros: { zh: ["合约费率极低", "每月储备金证明", "荷兰持牌合规", "跟单功能完善"], en: ["Extremely low contract fees", "Monthly reserve proof", "Netherlands licensed", "Good copy trading"] },
    cons: { zh: ["现货品种少于 Gate/Binance", "2025 年 2 月遭受黑客攻击（已全额赔付）"], en: ["Fewer spot pairs than Gate/Binance", "Feb 2025 hack (fully compensated)"] },
    bestFor: { zh: "合约交易者 · 追求低费率的用户 · 欧洲用户", en: "Contract traders · Low-fee seekers · European users" },
  },
  bitget: {
    emoji: "🟣", color: "#00D4AA", accentCls: "text-teal-400",
    borderCls: "border-teal-500/40", bgGrad: "from-teal-950/60 to-gray-900",
    spotMaker: EXCHANGE_FEES.bitget.spotMaker, spotTaker: EXCHANGE_FEES.bitget.spotTaker, futMaker: EXCHANGE_FEES.bitget.futMaker, futTaker: EXCHANGE_FEES.bitget.futTaker,
    rebateStars: "⭐⭐⭐⭐", founded: "2018", hq: "塞舌尔", coins: "800+",
    volume: "$5-10亿", reserve: "150%+", leverage: "125x", token: "BGB",
    badge: { zh: "跟单第一", en: "Copy Trading #1" }, badgeCls: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    tagline: { zh: "跟单鼻祖 · 最大跟单平台 · 用户保护基金", en: "Copy Trading Pioneer · Largest Copy Platform · Protection Fund" },
    desc: {
      zh: "Bitget 成立于 2018 年，以跟单交易起家，目前已成为全球最大的跟单交易平台。800+ 专业交易员供用户跟随，一键复制。设立 $3 亿用户保护基金，储备率超过 150%，CoinGlass 评分 83.10。",
      en: "Bitget (est. 2018) started with copy trading and became the world's largest copy trading platform. 800+ pro traders to follow, one-click copy. $300M user protection fund, reserve ratio 150%+, CoinGlass score 83.10.",
    },
    highlights: [
      { icon: "🏆", zh: "全球最大跟单平台：800+ 专业交易员，一键跟单", en: "World's largest copy trading platform: 800+ pro traders, one-click copy" },
      { icon: "🛡️", zh: "$3 亿用户保护基金，行业最高保障之一", en: "$300M user protection fund, one of the highest in the industry" },
      { icon: "📊", zh: "储备率超过 150%，透明度高", en: "Reserve ratio over 150%, high transparency" },
      { icon: "🎯", zh: "CoinGlass 综合评分 83.10，行业第三", en: "CoinGlass composite score 83.10, industry #3" },
    ],
    pros: { zh: ["跟单功能全行业最强", "用户保护基金行业领先", "储备率超过 150%", "新手友好"], en: ["Best copy trading in industry", "Industry-leading protection fund", "Reserve ratio > 150%", "Beginner friendly"] },
    cons: { zh: ["主流币流动性略低于币安", "Web3 生态尚在起步阶段"], en: ["Liquidity slightly lower than Binance", "Web3 ecosystem still early"] },
    bestFor: { zh: "跟单交易者 · 追求资金安全的用户 · 新手用户", en: "Copy traders · Security-focused users · Beginners" },
  },
};

const COMPARE_MATRIX = [
  { key: "spotMaker", zh: "现货 Maker", en: "Spot Maker", vals: SPOT_MAKER_ROW, star: 1 },
  { key: "futMaker", zh: "合约 Maker", en: "Futures Maker", vals: FUT_MAKER_ROW, star: 3 },
  { key: "rebate", zh: "返佣比例", en: "Rebate Rate", vals: REBATE_ROW, star: 0 },
  { key: "reserve", zh: "储备证明", en: "PoR", vals: ["125%", "105%+", "100%+", "101%", "150%+"] },
  { key: "coins", zh: "币种数量", en: "Coins", vals: ["3,600+", "350+", "350+", "1,000+", "800+"] },
  { key: "leverage", zh: "最高杠杆", en: "Max Lev", vals: ["100x", "125x", "125x", "125x", "125x"] },
];

export default function Exchanges() {
  const { language } = useLanguage();
  const zh = language === "zh";
  const [, navigate] = useLocation();
  useScrollMemory();
  const { allLinks, getInviteCode, getRebateRate } = useExchangeLinks();

  const [tab, setTab] = useState<"rebate" | "detail" | "intro">("rebate");
  const [expanded, setExpanded] = useState<string | null>(null);

  const slugs = ["gate", "okx", "binance", "bybit", "bitget"];

  const handleTabChange = (newTab: "rebate" | "detail" | "intro") => {
    setTab(newTab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderVal = (v: string) => {
    if (v.includes("%")) return <span className="text-emerald-400 font-bold">{v}</span>;
    return <span className="text-white/60">{v}</span>;
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white selection:bg-blue-500/30">
      <ScrollToTopButton color="blue" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A0F1E]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={goBack} className="flex items-center gap-2 text-white/50 hover:text-white transition group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">{zh ? "返回" : "Back"}</span>
          </button>
          <div className="flex bg-white/5 p-1 rounded-xl">
            {[
              { id: "rebate", label: zh ? "💰 返佣对比" : "💰 Rebates" },
              { id: "detail", label: zh ? "🔍 详情" : "🔍 Details" },
              { id: "intro", label: zh ? "📚 科普" : "📚 Guide" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id as any)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tab === t.id ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-white/40 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="w-16" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {tab === "rebate" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-black mb-4">{zh ? "全网最高返佣对比" : "Highest Rebate Comparison"}</h2>
              <p className="text-white/50 max-w-2xl mx-auto">{zh ? "我们与各大交易所达成官方合作，为您提供全网最高比例的交易手续费返还。" : "Official partnership with major exchanges to provide the highest fee rebates in the industry."}</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allLinks.map((ex) => {
                const s = STATIC[ex.slug] || STATIC.gate;
                return (
                  <div key={ex.slug} className={`relative group rounded-3xl border ${s.borderCls} bg-gradient-to-br ${s.bgGrad} p-6 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50`}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{s.emoji}</span>
                        <div>
                          <h3 className="text-xl font-black capitalize">{ex.slug === "gate" ? "Gate.io" : ex.slug}</h3>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{s.founded} {zh ? "年成立" : "Founded"}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black border ${s.badgeCls}`}>
                        {zh ? s.badge.zh : s.badge.en}
                      </div>
                    </div>

                    <div className="bg-black/20 rounded-2xl p-5 mb-6 border border-white/5">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-xs text-white/40 font-bold uppercase">{zh ? "返佣比例" : "Rebate Rate"}</span>
                        <span className="text-xs text-emerald-400 font-black">{zh ? "全网最高" : "Best Rate"}</span>
                      </div>
                      <div className="text-4xl font-black text-emerald-400 mb-4">
                        {ex.rebateRate || "60%"}
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        <div>
                          <p className="text-[10px] text-white/30 font-bold uppercase mb-1">{zh ? "邀请码" : "Invite Code"}</p>
                          <p className="text-sm font-mono font-black text-white">{ex.inviteCode || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/30 font-bold uppercase mb-1">{zh ? "综合评分" : "Score"}</p>
                          <div className="flex text-yellow-400 text-xs">{s.rebateStars}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-8">
                      {(zh ? s.pros.zh : s.pros.en).slice(0, 2).map((p, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-white/60">
                          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <a href={ex.referralLink} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button className="w-full bg-white text-black hover:bg-white/90 font-black rounded-xl h-12">
                          {zh ? "立即注册" : "Register Now"}
                        </Button>
                      </a>
                      <Button variant="outline" onClick={() => { setTab("detail"); setExpanded(ex.slug); }} className="border-white/10 hover:bg-white/5 rounded-xl h-12 px-4">
                        <ChevronRight size={20} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "detail" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black mb-4">{zh ? "🔍 交易所深度解析" : "🔍 Exchange Deep Dive"}</h2>
              <p className="text-white/50">{zh ? "从合规性、费率、流动性等多个维度为您拆解" : "Detailed analysis of compliance, fees, liquidity and more"}</p>
            </div>

            <div className="space-y-6">
              {slugs.map(slug => {
                const s = STATIC[slug];
                const code = getInviteCode(slug);
                const link = allLinks.find(l => l.slug === slug)?.referralLink;

                return (
                  <section key={slug} id={slug} className={`scroll-mt-24 rounded-3xl border ${s.borderCls} bg-gradient-to-br ${s.bgGrad} overflow-hidden`}>
                    {/* Header */}
                    <div className="px-5 sm:px-7 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <span className="text-5xl">{s.emoji}</span>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-2xl font-black capitalize">{slug === "gate" ? "Gate.io" : slug}</h3>
                            <div className={`px-2 py-0.5 rounded text-[10px] font-black border ${s.badgeCls}`}>{zh ? s.badge.zh : s.badge.en}</div>
                          </div>
                          <p className="text-sm text-white/60 font-medium">{zh ? s.tagline.zh : s.tagline.en}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a href={link} target="_blank" rel="noopener noreferrer">
                          <Button className="bg-white text-black hover:bg-white/90 font-black rounded-xl">
                            {zh ? "前往注册" : "Go Register"}
                          </Button>
                        </a>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="px-5 sm:px-7 pb-6">
                      <p className="text-sm text-white/50 leading-relaxed max-w-4xl">{zh ? s.desc.zh : s.desc.en}</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="px-5 sm:px-7 pb-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        [zh ? "成立时间" : "Founded", s.founded],
                        [zh ? "日交易量" : "Volume", s.volume],
                        [zh ? "储备率" : "Reserve", s.reserve],
                        [zh ? "最高杠杆" : "Max Lev", s.leverage],
                        [zh ? "平台币" : "Token", s.token],
                      ].map(([label, val]) => (
                        <div key={label} className="bg-black/20 rounded-lg p-2 text-center">
                          <p className="text-xs text-white/30 mb-0.5">{label}</p>
                          <p className={`text-sm font-bold ${s.accentCls}`}>{val}</p>
                        </div>
                      ))}
                    </div>

                    {/* Highlights */}
                    <div className="px-5 sm:px-7 pb-4">
                      <h4 className="text-sm font-bold mb-3">{zh ? "核心亮点" : "Key Highlights"}</h4>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {s.highlights.map((h, i) => (
                          <div key={i} className="flex items-start gap-2.5 bg-black/20 rounded-lg p-3">
                            <span className="text-lg shrink-0">{h.icon}</span>
                            <p className="text-xs text-white/70 leading-relaxed">{zh ? h.zh : h.en}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pros / Cons / Best For */}
                    <div className="px-5 sm:px-7 pb-5 grid sm:grid-cols-3 gap-3">
                      <div className="bg-green-950/30 border border-green-500/20 rounded-xl p-4">
                        <h5 className="text-xs font-bold text-green-400 mb-2 flex items-center gap-1"><Check size={11} />{zh ? "优势" : "Pros"}</h5>
                        <ul className="space-y-1.5">{(zh ? s.pros.zh : s.pros.en).map((p, i) => <li key={i} className="text-xs text-white/60 flex items-start gap-1.5"><span className="text-green-400 shrink-0">+</span>{p}</li>)}</ul>
                      </div>
                      <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-4">
                        <h5 className="text-xs font-bold text-red-400 mb-2 flex items-center gap-1"><X size={11} />{zh ? "劣势" : "Cons"}</h5>
                        <ul className="space-y-1.5">{(zh ? s.cons.zh : s.cons.en).map((c, i) => <li key={i} className="text-xs text-white/60 flex items-start gap-1.5"><span className="text-red-400 shrink-0">−</span>{c}</li>)}</ul>
                      </div>
                      <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl p-4">
                        <h5 className="text-xs font-bold text-blue-400 mb-2 flex items-center gap-1"><Users size={11} />{zh ? "适合人群" : "Best For"}</h5>
                        <p className="text-xs text-white/60 leading-relaxed">{zh ? s.bestFor.zh : s.bestFor.en}</p>
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <p className="text-xs text-white/30 mb-1">{zh ? "邀请码" : "Invite Code"}</p>
                          <code className="text-sm font-mono font-bold px-2 py-0.5 rounded" style={{ background: `${s.color}22`, color: s.color }}>{code}</code>
                        </div>
                      </div>
                    </div>

                    {/* Fee detail toggle */}
                    <div className="px-5 sm:px-7 pb-5">
                      <button onClick={() => setExpanded(expanded === slug ? null : slug)}
                        className="w-full flex items-center justify-between bg-black/20 hover:bg-black/30 rounded-xl px-4 py-3 transition">
                        <span className="text-sm font-medium text-white/60">{zh ? "查看详细费率" : "View Detailed Fees"}</span>
                        {expanded === slug ? <ChevronUp size={15} className="text-white/40" /> : <ChevronDown size={15} className="text-white/40" />}
                      </button>
                      {expanded === slug && (
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[[zh ? "现货 Maker" : "Spot Maker", s.spotMaker], [zh ? "现货 Taker" : "Spot Taker", s.spotTaker], [zh ? "最高杠杆" : "Max Leverage", s.leverage], [zh ? "平台币" : "Token", s.token]].map(([label, val]) => (
                            <div key={label} className="bg-black/20 rounded-lg p-3 text-center">
                              <p className="text-xs text-white/30 mb-1">{label}</p>
                              <p className={`text-base font-bold ${s.accentCls}`}>{val}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>

            {/* Feature Matrix */}
            <section id="matrix" className="mt-10 scroll-mt-32">
              <h3 className="text-2xl font-bold mb-6 text-center">{zh ? "📊 功能对比矩阵" : "📊 Feature Comparison Matrix"}</h3>
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="text-left px-4 py-3 text-white/40 font-semibold w-28 sticky left-0 bg-[#0A0F1E]">{zh ? "功能" : "Feature"}</th>
                      {slugs.map(slug => (
                        <th key={slug} className="px-3 py-3 text-center min-w-[90px]">
                          <div className="text-xl">{STATIC[slug].emoji}</div>
                          <div className="text-xs font-bold text-white">{slug === "gate" ? "Gate.io" : slug.charAt(0).toUpperCase() + slug.slice(1)}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE_MATRIX.map((row, fi) => (
                      <tr key={row.key} className={fi % 2 === 0 ? "bg-white/[0.02]" : ""}>
                        <td className="px-4 py-3 text-white/40 text-xs font-medium sticky left-0 bg-[#0A0F1E]">{zh ? row.zh : row.en}</td>
                        {row.vals.map((v, vi) => (
                          <td key={vi} className={`px-3 py-3 text-center ${row.star === vi ? "bg-yellow-400/8" : ""}`}>
                            {row.key === "rebate" ? (
                              <span className="text-emerald-400 font-bold">{getRebateRate(slugs[vi]) || v}</span>
                            ) : renderVal(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* CTA */}
            <div className="mt-10 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 text-center">
              <Gift className="text-blue-400 mx-auto mb-3" size={26} />
              <h4 className="text-lg font-bold mb-2">{zh ? "通过邀请链接注册，立享最高 60% 返佣" : "Register via referral link, enjoy up to 60% rebate"}</h4>
              <p className="text-white/50 text-sm mb-4">{zh ? "有任何返佣疑问，请联系我们，专人为您解答" : "For any rebate questions, contact us for dedicated support"}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => handleTabChange("rebate")} className="bg-blue-500 hover:bg-blue-400 text-white font-bold">
                  <ExternalLink size={15} className="mr-2" />{zh ? "查看所有返佣链接" : "View All Referral Links"}
                </Button>
                <Button variant="outline" onClick={() => navigate("/contact")} className="border-white/10 hover:bg-white/5 text-white">
                  <MessageCircle size={15} className="mr-2" />{zh ? "联系我们" : "Contact Us"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {tab === "intro" && (
          <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">{zh ? "📚 交易所扫盲科普" : "📚 Exchange Guide"}</h2>
              <p className="text-white/50">{zh ? "从零开始，了解加密货币交易所的核心知识" : "Learn the core concepts of crypto exchanges from scratch"}</p>
            </div>

            <div className="space-y-8">
              {[
                { q: zh ? "什么是中心化交易所 (CEX)？" : "What is a CEX?", a: zh ? "中心化交易所（Centralized Exchange）是由公司运营的平台，负责托管用户的资金并撮合交易。它们通常提供更好的流动性、更丰富的功能和法币出入金支持。" : "A CEX is a platform operated by a company that custodies user funds and matches trades. They offer better liquidity, more features, and fiat support." },
                { q: zh ? "为什么一定要通过返佣链接注册？" : "Why use a rebate link?", a: zh ? "交易所会向合作伙伴支付手续费分成。通过我们的链接注册，我们会将这部分分成的大部分返还给你。这相当于你每笔交易都在打折，长期下来是一笔巨大的节省。" : "Exchanges share trading fees with partners. By using our link, we return most of that share to you, effectively giving you a permanent discount on every trade." },
                { q: zh ? "资金放在交易所安全吗？" : "Is it safe to keep funds on CEX?", a: zh ? "主流交易所（如币安、OKX）都有完善的安全机制和 100% 储备证明。但建议大额长期持有的资产存放在自己的硬件钱包中，交易所仅用于日常交易。" : "Major exchanges like Binance and OKX have robust security and 100% Proof of Reserves. However, for long-term large holdings, hardware wallets are recommended." },
              ].map((item, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                  <h4 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <span className="text-blue-400">Q:</span>{item.q}
                  </h4>
                  <p className="text-white/60 leading-relaxed text-sm">
                    <span className="text-emerald-400 font-bold mr-2">A:</span>{item.a}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">{zh ? "准备好开始交易了吗？" : "Ready to start trading?"}</h3>
              <p className="text-white/80 mb-8">{zh ? "选择一个适合你的交易所，开启你的 Web3 旅程。" : "Choose the right exchange for you and start your Web3 journey today."}</p>
              <Button onClick={() => handleTabChange("rebate")} className="bg-white text-blue-600 font-bold px-8 py-6 rounded-2xl hover:bg-white/90 transition">
                {zh ? "立即查看返佣对比" : "View Rebate Comparison"}
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-white/20 text-xs mb-4">
            {zh ? "© 2026 Get8 Pro · 官方认证返佣合作伙伴" : "© 2026 Get8 Pro · Official Certified Rebate Partner"}
          </p>
          <div className="flex justify-center gap-6">
            <a href="/contact" className="text-white/40 hover:text-white text-xs transition">{zh ? "联系我们" : "Contact"}</a>
            <a href="/exchange-guide" className="text-white/40 hover:text-white text-xs transition">{zh ? "扫盲指南" : "Guide"}</a>
            <a href="/legal" className="text-white/40 hover:text-white text-xs transition">{zh ? "免责声明" : "Legal"}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
