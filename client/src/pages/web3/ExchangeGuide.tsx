import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import Web3ChapterNav from "@/components/Web3ChapterNav";
import { useScrollMemory } from '@/hooks/useScrollMemory';
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { useLanguage } from "@/contexts/LanguageContext";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(24px)", transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

// 互动：投资方式选择器
function InvestmentPathSelector() {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<string | null>(null);

  const questions = [
    { q: "你是否有 Web3 投资经验？", options: ["完全没有", "了解一些", "比较熟悉"] },
    { q: "你主要想做什么？", options: ["买入持有主流币", "参与 DeFi 赚收益", "链上高频交易"] },
    { q: "你能接受多高的技术门槛？", options: ["越简单越好", "可以学习", "不怕复杂"] },
  ];

  const getResult = (ans: Record<number, string>) => {
    if (ans[0] === "完全没有" || ans[2] === "越简单越好") return "cex";
    if (ans[1] === "参与 DeFi 赚收益" || ans[1] === "链上高频交易") return "defi";
    return "cex";
  };

  const handleAnswer = (qIdx: number, opt: string) => {
    const newAnswers = { ...answers, [qIdx]: opt };
    setAnswers(newAnswers);
    if (Object.keys(newAnswers).length === questions.length) {
      setResult(getResult(newAnswers));
    }
  };

  const results: Record<string, { title: string; desc: string; steps: string[]; color: string; border: string; bg: string }> = {
    cex: {
      title: "🏦 推荐：从中心化交易所开始",
      desc: "对于你的情况，从 CEX（中心化交易所）开始是最佳选择。操作简单、支持法币入金、有客服支持，是进入 Web3 世界最安全的第一步。",
      steps: ["选择一家合规交易所（币安/OKX/Bybit）", "完成实名认证（KYC）", "通过银行卡/支付宝购买 USDT", "买入 BTC 或 ETH 开始体验", "熟悉后再探索 DeFi"],
      color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/5",
    },
    defi: {
      title: "⚡ 推荐：直接探索 DeFi",
      desc: "你已有一定基础，可以直接探索 DeFi。建议先在 CEX 购买 ETH，然后转入 MetaMask 钱包，连接 Uniswap 等 DEX 开始体验。",
      steps: ["在 CEX 购买 ETH", "安装 MetaMask 钱包", "将 ETH 转入 MetaMask", "访问 app.uniswap.org 连接钱包", "开始在 DeFi 协议中操作"],
      color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/5",
    },
  };

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700/60">
        <h3 className="font-black text-white text-sm">🎯 找到最适合你的入门路径</h3>
        <p className="text-slate-500 text-xs mt-0.5">回答 3 个问题，获得个性化建议</p>
      </div>
      <div className="p-5">
        {!result ? (
          <div className="space-y-5">
            {questions.map((q, qIdx) => (
              <div key={qIdx}>
                <p className="text-white text-sm font-bold mb-3">{qIdx + 1}. {q.q}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {q.options.map(opt => (
                    <button key={opt} onClick={() => handleAnswer(qIdx, opt)}
                      className={`py-2.5 px-3 rounded-xl text-sm transition-all border ${answers[qIdx] === opt ? "border-emerald-500 bg-emerald-500/20 text-emerald-300" : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:text-white"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div className={`rounded-xl border ${results[result].border} ${results[result].bg} p-5 mb-4`}>
              <h4 className={`font-black text-base mb-2 ${results[result].color}`}>{results[result].title}</h4>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">{results[result].desc}</p>
              <div>
                <div className="text-xs font-bold text-slate-400 mb-2">📋 建议步骤</div>
                <ol className="space-y-1.5">
                  {results[result].steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${results[result].color} bg-white/10`}>{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <button onClick={() => { setAnswers({}); setResult(null); }} className="text-xs text-slate-500 hover:text-white transition-colors">
              重新选择 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExchangeGuideDeep() {
  useScrollMemory();
  const { language } = useLanguage();
  const zh = language === "zh";
  const [mounted, setMounted] = useState(false);
  const [expandedExchange, setExpandedExchange] = useState<number | null>(null);
  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const exchanges = [
    {
      name: "币安 Binance", icon: "🟡", rank: "#1", desc: "全球最大交易所，日交易量超 200 亿美元，支持 350+ 交易对",
      pros: ["最高流动性", "最多交易对", "完善的学习资源（币安学院）", "支持多种法币入金"],
      cons: ["部分地区受限", "功能复杂，新手需要学习"],
      features: ["现货交易", "合约交易", "理财产品", "NFT 市场", "Web3 钱包"],
      color: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/5",
    },
    {
      name: "OKX", icon: "🔵", rank: "#2", desc: "全球顶级交易所，以 Web3 钱包和链上功能著称",
      pros: ["优秀的 Web3 钱包", "支持多链", "中文界面友好", "合约功能强大"],
      cons: ["部分高级功能复杂", "客服响应有时较慢"],
      features: ["现货交易", "合约交易", "Web3 钱包", "DEX 聚合", "链上 DeFi"],
      color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/5",
    },
    {
      name: "Bybit", icon: "🟠", rank: "#3", desc: "以合约交易著称，近年来现货和 Web3 生态以及Tradfi快速扩张",
      pros: ["合约交易体验极佳", "手续费较低", "新手教程完善", "返佣比例高"],
      cons: ["现货交易对相对较少", "部分功能仍在完善"],
      features: ["现货交易", "合约交易", "理财产品", "Launchpad", "NFT 市场"],
      color: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/5",
    },
  ];

  return (
    <div className="min-h-screen bg-[#050D1A] text-white" style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.6s ease" }}>
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#050D1A]/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            {zh ? "返回上一页" : "Back"}
          </button>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-teal-500/30 bg-teal-500/20 px-2.5 py-1 text-xs text-teal-400 sm:inline-flex">
              {zh ? "?? ? ? 08 ?" : "Hands-on ? Chapter 08"}
            </span>
            <Web3ChapterNav currentChapterId="exchange-guide" />
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12 pb-20">
        <FadeIn className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs mb-5">
            {zh ? "?? ?????????" : "?? Chapter 8: Exchange starter guide"}
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              {zh ? "交易所" : "Exchange"}
            </span>{" "}
            {zh ? "入门指南" : "starter guide"}
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
            {zh
              ? "了解了 Web3 的世界，现在是时候迈出第一步了。中心化交易所是大多数人进入 Web3 的最佳起点——安全、简单、支持法币。"
              : "Once you understand the Web3 landscape, it is time to take the first practical step. For most people, centralized exchanges are still the safest and simplest entry point."}
          </p>
        </FadeIn>

        {/* 为什么从 CEX 开始 */}
        <FadeIn className="mb-8">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
            <h2 className="text-xl font-black text-emerald-400 mb-4">🌉 交易所：连接传统金融与 Web3 的桥梁</h2>
            <p className="text-slate-300 leading-relaxed mb-5">
              学习了区块链、DeFi、钱包之后，你可能会问：我该从哪里开始？对于大多数新手来说，
              <strong className="text-white">中心化交易所（CEX）是最佳起点</strong>。
              它就像 Web3 世界的「入口大门」——你可以用人民币/美元直接购买加密货币，
              然后再根据自己的需求决定是否进入 DeFi 的深水区。
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: "💴", title: "法币直接入金", desc: "支持银行卡、支付宝、微信支付，无需先有加密货币" },
                { icon: "🛡️", title: "资产有保障", desc: "大型交易所设有风险储备金，提供一定程度的资产保护" },
                { icon: "📞", title: "有客服支持", desc: "遇到问题可以联系客服，不像 DeFi 出了问题无人帮助" },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-black/20 border border-white/5">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <h5 className="font-bold text-white text-sm mb-1">{item.title}</h5>
                  <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* 个性化路径选择 */}
        <FadeIn className="mb-8">
          <h2 className="mb-4 text-2xl font-black text-white">
            {zh ? "🎯 找到你的入门路径" : "🎯 Find your onboarding path"}
          </h2>
          <InvestmentPathSelector />
        </FadeIn>

        {/* 主流交易所介绍 */}
        <FadeIn className="mb-8">
          <h2 className="mb-5 text-2xl font-black text-white">
            {zh ? "🏆 主流交易所对比" : "🏆 Compare major exchanges"}
          </h2>
          <div className="space-y-4">
            {exchanges.map((ex, i) => (
              <div
                key={i}
                role="button"
                tabIndex={0}
                aria-expanded={expandedExchange === i}
                onClick={() => setExpandedExchange(expandedExchange === i ? null : i)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setExpandedExchange(expandedExchange === i ? null : i);
                  }
                }}
                className={`tap-target rounded-2xl border ${ex.border} ${ex.bg} p-5 cursor-pointer transition-all hover:scale-[1.005]`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{ex.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`font-black text-base ${ex.color}`}>{ex.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-400">{ex.rank} 全球</span>
                      </div>
                      <p className="text-slate-400 text-xs">{ex.desc}</p>
                    </div>
                  </div>
                  <span className="text-slate-500 text-xs">{expandedExchange === i ? "▲" : "▼"}</span>
                </div>
                {expandedExchange === i && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-xs font-bold text-emerald-400 mb-2">✅ 优势</div>
                        <ul className="space-y-1">{ex.pros.map(p => <li key={p} className="text-slate-300 text-xs flex items-start gap-1.5"><span className="text-emerald-400">+</span>{p}</li>)}</ul>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-yellow-400 mb-2">⚠️ 注意</div>
                        <ul className="space-y-1">{ex.cons.map(c => <li key={c} className="text-slate-300 text-xs flex items-start gap-1.5"><span className="text-yellow-400">-</span>{c}</li>)}</ul>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-400 mb-2">🔧 主要功能</div>
                      <div className="flex flex-wrap gap-2">
                        {ex.features.map(f => <span key={f} className={`text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 ${ex.color}`}>{f}</span>)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </FadeIn>

        {/* 注册步骤 */}
        <FadeIn className="mb-8">
          <h2 className="mb-5 text-2xl font-black text-white">
            {zh ? "📋 注册交易所：完整步骤" : "📋 Exchange registration: full workflow"}
          </h2>
          <div className="space-y-3">
            {[
              { step: "01", title: "选择交易所并下载官方 App", desc: "通过官方网站或应用商店下载，谨防钓鱼网站。", icon: "📱", color: "text-blue-400", border: "border-blue-500/30" },
              { step: "02", title: "注册账号", desc: "使用邮箱注册，设置强密码（12位以上，包含大小写字母、数字、符号）。建议使用专用邮箱。", icon: "📧", color: "text-purple-400", border: "border-purple-500/30" },
              { step: "03", title: "开启两步验证（2FA）", desc: "下载 Google Authenticator，绑定到账号。这是保护账号安全的关键步骤，不要跳过。", icon: "🔐", color: "text-yellow-400", border: "border-yellow-500/30" },
              { step: "04", title: "完成实名认证（KYC）", desc: "上传身份证正反面和自拍，通常 1-24 小时审核完成。完成后才能使用法币入金功能。", icon: "🪪", color: "text-emerald-400", border: "border-emerald-500/30" },
              { step: "05", title: "法币入金购买 USDT", desc: "选择 C2C/P2P 交易，用支付宝/微信/银行卡购买 USDT（稳定币）。建议首次小额测试（100-500元）。", icon: "💴", color: "text-orange-400", border: "border-orange-500/30" },
              { step: "06", title: "购买你的第一个加密货币", desc: "用 USDT 购买 BTC 或 ETH。建议从小额开始，先熟悉操作，再逐步增加投入。", icon: "₿", color: "text-yellow-400", border: "border-yellow-500/30" },
            ].map((item, i) => (
              <div key={i} className={`flex items-start gap-4 p-4 rounded-xl border ${item.border} bg-black/10`}>
                <div className={`text-2xl font-black ${item.color} opacity-40 flex-shrink-0 w-10 text-center leading-none`}>{item.step}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span>{item.icon}</span>
                    <h5 className={`font-bold text-sm ${item.color}`}>{item.title}</h5>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Link href="/web3-guide/kyc-flow" className="tap-target rounded-xl border border-cyan-500/40 px-4 py-2 text-sm font-bold text-cyan-400 transition-all hover:bg-cyan-500/10">
              {zh ? "🪪 单独查看 KYC 实名流程 →" : "🪪 Open the KYC walkthrough →"}
            </Link>
          </div>
        </FadeIn>

        {/* 自然引流 CTA */}
        <FadeIn className="mb-8">
          <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-orange-500/5 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="text-4xl">🎁</span>
              <div>
                <h3 className="mb-2 text-xl font-black text-white">
                  {zh ? "通过合作链接注册，享受手续费返佣" : "Register through partner links and save on fees"}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  你已经了解了 Web3 的完整知识体系——从区块链原理到 DeFi 玩法，从钱包安全到交易所选择。
                  现在，如果你决定迈出第一步，通过我们的合作伙伴链接注册可以享受<strong className="text-yellow-300">永久的手续费返佣</strong>，
                  让每一笔交易都更划算。
                </p>
                <Link href="/crypto-saving" className="bg-yellow-500 hover:bg-yellow-400 text-black font-black px-6 py-3 rounded-xl transition-all hover:scale-105 text-sm">
                    {zh ? "查看合作伙伴邀请链接 →" : "View partner links →"}
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* 底部导航 */}
        <FadeIn>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/web3-guide" className="flex-1">
              <div className="rounded-2xl border border-slate-700 bg-slate-800/30 p-5 hover:bg-slate-800/50 transition-colors text-center">
                <div className="mb-1 text-xs text-slate-500">{zh ? "返回" : "Back"}</div>
                <h3 className="text-base font-black text-white">
                  {zh ? "📖 Web3 入圈指南" : "📖 Web3 guide"}
                </h3>
              </div>
            </Link>
            <Link href="/crypto-saving" className="flex-1">
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5 hover:bg-yellow-500/10 transition-colors text-center">
                <div className="mb-1 text-xs text-slate-500">{zh ? "前往" : "Open"}</div>
                <h3 className="text-base font-black text-white">
                  {zh ? "💰 币圈省钱指南" : "💰 Crypto saving guide"}
                </h3>
              </div>
            </Link>
          </div>
        </FadeIn>
      </div>
      {/* 右下角回到顶部按钮 */}
      <ScrollToTopButton color="emerald" />
    </div>
  );
}
