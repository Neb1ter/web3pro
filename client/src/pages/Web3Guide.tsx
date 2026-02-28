import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useScrollMemory } from '@/hooks/useScrollMemory';
import { useExchangeLinks } from '@/contexts/ExchangeLinksContext';

// ============================================================
// 动画组件
// ============================================================
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div 
      className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ============================================================
// 侧边栏章节导航
// ============================================================
const SECTIONS = [
  { id: "intro", title: "什么是 Web3？", icon: "🌐" },
  { id: "wallet", title: "第一步：准备钱包", icon: "🔐" },
  { id: "exchange", title: "第二步：选择交易所", icon: "🏦" },
  { id: "security", title: "第三步：安全准则", icon: "🛡️" },
  { id: "next", title: "进阶：DeFi 与链上", icon: "🚀" },
];

function FloatChapterMenu({ activeId }: { activeId: string }) {
  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden xl:block">
      <div className="flex flex-col gap-2 p-2 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-slate-800/50">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`
              group relative flex items-center gap-3 p-3 rounded-xl transition-all
              ${activeId === s.id ? "bg-emerald-500/20 text-emerald-400" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"}
            `}
          >
            <span className="text-xl">{s.icon}</span>
            <span className="text-sm font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity absolute left-full ml-4 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 pointer-events-none">
              {s.title}
            </span>
            {activeId === s.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-full" />
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 回到顶部按钮
// ============================================================
function ScrollToTopButton({ color = "emerald" }: { color?: "emerald" | "blue" | "yellow" }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const toggleVisible = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", toggleVisible);
    return () => window.removeEventListener("scroll", toggleVisible);
  }, []);

  const colors = {
    emerald: "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20",
    blue: "bg-blue-500 hover:bg-blue-400 shadow-blue-500/20",
    yellow: "bg-yellow-500 hover:bg-yellow-400 shadow-yellow-500/20",
  };

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`
        fixed bottom-8 right-8 z-50 p-4 rounded-2xl text-white shadow-2xl transition-all duration-300
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}
        ${colors[color]}
      `}
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}

export default function Web3Guide() {
  useScrollMemory();
  const [activeSection, setActiveSection] = useState("intro");
  
  // 使用全局 ExchangeLinksContext 获取数据
  const { allLinks, loading } = useExchangeLinks();
  
  // 过滤出主要的交易所（如 gate, okx, binance, bybit）
  const mainExchanges = useMemo(() => {
    const priority = ['gate', 'okx', 'binance', 'bybit'];
    return allLinks
      .filter(ex => priority.includes(ex.slug))
      .sort((a, b) => priority.indexOf(a.slug) - priority.indexOf(b.slug));
  }, [allLinks]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { threshold: 0.3 }
    );

    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
    <div className="min-h-screen bg-[#050D1A] text-slate-200 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 顶部进度条 */}
      <div className="fixed top-0 left-0 w-full h-1 z-50 bg-slate-900">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-150"
          style={{ width: `${(SECTIONS.findIndex(s => s.id === activeSection) + 1) / SECTIONS.length * 100}%` }}
        />
      </div>

      {/* Hero 区域 */}
      <div className="relative pt-24 pb-16 px-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] -z-10" />
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              WEB3 ONBOARDING GUIDE
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-white mb-6 tracking-tight">
              Web3 <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">入圈指南</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
              拒绝噪音，回归基本面。我们为你构建机构级的 Web3 知识体系，从零开始，像专业人士一样思考与决策。
            </p>
          </FadeIn>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-24">
        {/* 0. 什么是 Web3 */}
        <section id="intro" className="scroll-mt-32 mb-24">
          <FadeIn>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-2xl border border-emerald-500/30">🌐</div>
              <h2 className="text-3xl font-black text-white">什么是 Web3？</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              {[
                { title: "Web 1.0", subtitle: "Read (只读)", desc: "门户网站时代，用户被动接收信息（如新浪、搜狐）。", color: "slate" },
                { title: "Web 2.0", subtitle: "Read-Write (可读写)", desc: "社交媒体时代，用户创造内容，但数据归平台所有（如微信、抖音）。", color: "blue" },
                { title: "Web 3.0", subtitle: "Read-Write-Own (可拥有)", desc: "价值互联网时代，用户真正拥有自己的数据和资产。", color: "emerald" },
              ].map((item, i) => (
                <div key={i} className={`p-6 rounded-2xl border ${item.color === 'emerald' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 bg-slate-900/50'}`}>
                  <div className={`text-xs font-bold mb-2 ${item.color === 'emerald' ? 'text-emerald-400' : 'text-slate-500'}`}>{item.subtitle}</div>
                  <h3 className="text-xl font-black text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="prose prose-invert max-w-none">
              <p className="text-slate-300 leading-relaxed">
                简单来说，Web3 是基于<strong>区块链技术</strong>的下一代互联网。它的核心精神是<strong>去中心化</strong>。在 Web3 世界里，你不再需要信任大型科技公司来托管你的资产或身份，而是通过数学算法和加密技术来保障你的权利。
              </p>
            </div>
          </FadeIn>
        </section>

        {/* 1. 准备钱包 */}
        <section id="wallet" className="scroll-mt-32 mb-24">
          <FadeIn>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-2xl border border-blue-500/30">🔐</div>
              <h2 className="text-3xl font-black text-white">第一步：准备你的数字钱包</h2>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 mb-8">
              <p className="text-slate-300 mb-6">
                钱包是进入 Web3 的「通行证」。它不存储你的钱（钱在区块链上），而是存储你的<strong>私钥</strong>（控制权）。
              </p>
              <div className="space-y-6">
                {[
                  { title: "热钱包 (软件钱包)", desc: "安装在手机或浏览器插件中，方便交易。推荐：MetaMask, OKX Wallet。", icon: "📱" },
                  { title: "冷钱包 (硬件钱包)", desc: "离线存储私钥，最安全。推荐：Ledger, OneKey。", icon: "🧊" },
                ].map((w, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="text-2xl">{w.icon}</div>
                    <div>
                      <h4 className="font-bold text-white mb-1">{w.title}</h4>
                      <p className="text-sm text-slate-400">{w.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/20 p-6">
              <h4 className="text-yellow-500 font-bold mb-2 flex items-center gap-2">
                ⚠️ 铁律：助记词就是一切
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                钱包会生成 12 或 24 个单词（助记词）。<strong>谁拥有助记词，谁就拥有钱包里的所有资产。</strong> 永远不要截图、不要发到微信、不要存入云盘。请用纸笔抄写，存放在安全的地方。
              </p>
            </div>
          </FadeIn>
        </section>

        {/* 2. 选择交易所 */}
        <section id="exchange" className="scroll-mt-32 mb-24">
          <FadeIn>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-2xl border border-yellow-500/30">🏦</div>
              <h2 className="text-3xl font-black text-white">第二步：选择合规交易所</h2>
            </div>
            <p className="text-slate-300 mb-8">
              对于新手，通过<strong>中心化交易所 (CEX)</strong> 买入第一笔 USDT 是最简单的方式。
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {!loading ? (
                mainExchanges.map((ex) => (
                  <div key={ex.slug} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-yellow-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-black text-white capitalize">{ex.slug === 'gate' ? 'Gate.io' : ex.slug}</h3>
                      <span className="text-xs px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 font-bold">推荐</span>
                    </div>
                    <p className="text-sm text-slate-400 mb-6">
                      使用邀请码 <span className="text-white font-mono">{ex.inviteCode}</span> 注册，可享 <span className="text-emerald-400 font-bold">{ex.rebateRate}</span> 手续费返佣。
                    </p>
                    <a 
                      href={ex.referralLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block w-full py-3 rounded-xl bg-slate-800 group-hover:bg-yellow-500 group-hover:text-black text-center font-bold transition-all"
                    >
                      立即注册
                    </a>
                  </div>
                ))
              ) : (
                // Loading UI
                [1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 animate-pulse">
                    <div className="h-6 w-24 bg-slate-800 rounded mb-4"></div>
                    <div className="h-4 w-full bg-slate-800 rounded mb-6"></div>
                    <div className="h-12 w-full bg-slate-800 rounded"></div>
                  </div>
                ))
              )}
            </div>
          </FadeIn>
        </section>

        {/* 3. 安全准则 */}
        <section id="security" className="scroll-mt-32 mb-24">
          <FadeIn>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-2xl border border-red-500/30">🛡️</div>
              <h2 className="text-3xl font-black text-white">第三步：Web3 安全铁律</h2>
            </div>
            <div className="space-y-4">
              {[
                { t: "不要相信任何私聊", d: "在 Discord、Telegram 或推特上主动私聊你的「官方客服」或「美女」100% 是骗子。" },
                { t: "检查 URL 域名", d: "永远通过官方渠道或可靠导航进入网站，警惕钓鱼网站（如 binnance.com）。" },
                { t: "小额尝试", d: "第一次转账、第一次交互，先用 5-10 刀的小额资金测试，确认成功后再大额操作。" },
                { t: "授权管理", d: "不要随意连接钱包到陌生网站，定期使用 Revoke.cash 检查并取消不明授权。" },
              ].map((item, i) => (
                <div key={i} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/30 flex gap-4">
                  <div className="text-red-500 font-black">0{i+1}</div>
                  <div>
                    <h4 className="font-bold text-white mb-1">{item.t}</h4>
                    <p className="text-sm text-slate-400">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </section>

        {/* 4. 进阶 */}
        <section id="next" className="scroll-mt-32 mb-24">
          <FadeIn>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-2xl border border-purple-500/30">🚀</div>
              <h2 className="text-3xl font-black text-white">进阶：探索 DeFi 与链上世界</h2>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/10 p-8">
              <p className="text-slate-300 mb-6 leading-relaxed">
                当你熟悉了交易所和钱包，就可以开始探索真正的 Web3 应用了：
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  "去中心化交易所 (DEX): Uniswap, PancakeSwap",
                  "借贷协议: Aave, Compound",
                  "链上数据分析: Dune, Nansen",
                  "NFT 市场: OpenSea, Blur",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </section>

        {/* 底部 CTA */}
        <FadeIn>
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-10 text-center">
            <h3 className="text-2xl font-black text-white mb-4">准备好开启你的 Web3 之旅了吗？</h3>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">
              通过我们的专业导航，避开陷阱，降低成本，像 Pro 一样交易。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/exchanges" className="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black transition-all">
                查看交易所对比
              </Link>
              <Link href="/tools" className="px-8 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all">
                探索币圈工具
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>

      <ScrollToTopButton />
      <FloatChapterMenu activeId={activeSection} />
    </div>
    </>
  );
}
