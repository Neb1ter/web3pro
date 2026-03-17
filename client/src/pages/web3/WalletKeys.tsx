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

// 互动：助记词模拟
function SeedPhraseDemo() {
  const wordPool = ["apple", "bridge", "canvas", "dragon", "echo", "forest", "galaxy", "harbor", "island", "jungle", "knight", "lemon", "marble", "noble", "ocean", "palace", "quest", "river", "sunset", "tiger", "ultra", "valley", "winter", "xenon", "yellow", "zenith"];
  const [phrase, setPhrase] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [userInput, setUserInput] = useState<string[]>(Array(12).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);

  const generatePhrase = () => {
    const shuffled = [...wordPool].sort(() => Math.random() - 0.5);
    setPhrase(shuffled.slice(0, 12));
    setRevealed(false);
    setVerifying(false);
    setVerifyResult(null);
    setUserInput(Array(12).fill(""));
  };

  useEffect(() => { generatePhrase(); }, []);

  const startVerify = () => {
    setVerifying(true);
    setRevealed(false);
    setUserInput(Array(12).fill(""));
    setVerifyResult(null);
  };

  const checkPhrase = () => {
    const correct = userInput.every((w, i) => w.trim().toLowerCase() === phrase[i]);
    setVerifyResult(correct);
  };

  return (
    <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-black text-yellow-400 text-base">🌱 助记词模拟体验</h3>
          <p className="text-slate-500 text-xs mt-0.5">体验真实的助记词备份流程（仅演示，非真实钱包）</p>
        </div>
        <button onClick={generatePhrase} className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
          重新生成
        </button>
      </div>

      {!verifying ? (
        <>
          <div className="mb-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
            <p className="text-red-300 text-xs font-bold mb-1">⚠️ 重要安全提示</p>
            <p className="text-slate-400 text-xs leading-relaxed">真实助记词绝对不能截图、不能发给任何人、不能存在网络上。这里仅为演示，请勿将真实助记词输入任何网站。</p>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-300 font-bold">你的 12 个助记词</span>
              <button onClick={() => setRevealed(!revealed)} className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                {revealed ? "🙈 隐藏" : "👁️ 显示"}
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {phrase.map((word, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-black/30 border border-white/10">
                  <span className="text-slate-600 text-xs w-4 text-right flex-shrink-0">{i + 1}.</span>
                  <span className={`text-sm font-mono transition-all ${revealed ? "text-yellow-300" : "text-transparent bg-slate-700 rounded select-none"}`}>
                    {revealed ? word : "●●●●●"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {revealed && (
            <button onClick={startVerify} className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl text-sm transition-all">
              ✅ 我已记录，开始验证
            </button>
          )}
        </>
      ) : (
        <>
          <p className="text-slate-400 text-sm mb-4">请按顺序输入你的 12 个助记词：</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
            {userInput.map((val, i) => (
              <div key={i} className="flex items-center gap-1.5 p-2 rounded-lg bg-black/30 border border-white/10">
                <span className="text-slate-600 text-xs w-4 text-right flex-shrink-0">{i + 1}.</span>
                <input value={val} onChange={e => setUserInput(prev => { const n = [...prev]; n[i] = e.target.value; return n; })}
                  className="w-full bg-transparent text-white text-xs focus:outline-none font-mono" placeholder="..." />
              </div>
            ))}
          </div>
          {verifyResult === null ? (
            <div className="flex gap-3">
              <button onClick={() => setVerifying(false)} className="flex-1 py-2.5 border border-slate-600 text-slate-400 rounded-xl text-sm transition-colors hover:bg-slate-800">
                返回查看
              </button>
              <button onClick={checkPhrase} className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl text-sm transition-all">
                验证助记词
              </button>
            </div>
          ) : (
            <div className={`p-4 rounded-xl border ${verifyResult ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10"}`}>
              <p className={`font-bold text-sm ${verifyResult ? "text-emerald-400" : "text-red-400"}`}>
                {verifyResult ? "✅ 验证成功！你已正确备份了助记词。" : "❌ 验证失败，请重新检查顺序和拼写。"}
              </p>
              {verifyResult && <p className="text-slate-400 text-xs mt-2">在真实场景中，这意味着你可以随时用助记词恢复你的钱包和所有资产。</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// 互动：钱包类型选择器
function WalletTypeSelector() {
  const [selected, setSelected] = useState<number | null>(null);
  const wallets = [
    { icon: "📱", name: "热钱包（软件钱包）", examples: "MetaMask、Trust Wallet、OKX Wallet", pros: ["免费使用", "操作便捷", "支持所有 DApp"], cons: ["联网存在风险", "设备丢失风险"], suitable: "日常小额交易、DeFi 操作", risk: "中等", riskColor: "text-yellow-400", border: "border-blue-500/30", bg: "bg-blue-500/5" },
    { icon: "🔒", name: "冷钱包（硬件钱包）", examples: "Ledger、Trezor", pros: ["私钥离线存储", "最高安全级别", "防黑客攻击"], cons: ["需要购买（$50-200）", "操作稍复杂"], suitable: "大额资产长期存储", risk: "极低", riskColor: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/5" },
    { icon: "🏦", name: "交易所托管钱包", examples: "币安、OKX、Bybit 账户", pros: ["无需管理私钥", "操作最简单", "支持法币出入金"], cons: ["资产由交易所托管", "需要 KYC 实名", "交易所风险"], suitable: "新手入门、法币交易", risk: "取决于交易所", riskColor: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/5" },
    { icon: "🧠", name: "多签钱包", examples: "Safe（原 Gnosis Safe）", pros: ["多人共同管理", "防单点失败", "适合团队/DAO"], cons: ["操作复杂", "需要多人协作"], suitable: "团队资金、DAO 金库", risk: "极低", riskColor: "text-emerald-400", border: "border-purple-500/30", bg: "bg-purple-500/5" },
  ];

  return (
    <div className="space-y-3">
      {wallets.map((w, i) => (
        <div
          key={i}
          role="button"
          tabIndex={0}
          aria-expanded={selected === i}
          onClick={() => setSelected(selected === i ? null : i)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setSelected(selected === i ? null : i);
            }
          }}
          className={`tap-target rounded-xl border ${w.border} ${w.bg} p-4 cursor-pointer transition-all hover:scale-[1.01]`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{w.icon}</span>
              <div>
                <h4 className="font-bold text-white text-sm">{w.name}</h4>
                <p className="text-slate-500 text-xs">{w.examples}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${w.riskColor}`}>风险: {w.risk}</span>
              <span className="text-slate-500 text-xs">{selected === i ? "▲" : "▼"}</span>
            </div>
          </div>
          {selected === i && (
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-bold text-emerald-400 mb-2">✅ 优势</div>
                <ul className="space-y-1">{w.pros.map(p => <li key={p} className="text-slate-300 text-xs flex items-start gap-1.5"><span className="text-emerald-400 mt-0.5">+</span>{p}</li>)}</ul>
              </div>
              <div>
                <div className="text-xs font-bold text-red-400 mb-2">⚠️ 注意</div>
                <ul className="space-y-1">{w.cons.map(c => <li key={c} className="text-slate-300 text-xs flex items-start gap-1.5"><span className="text-red-400 mt-0.5">-</span>{c}</li>)}</ul>
              </div>
              <div className="sm:col-span-2 p-3 rounded-lg bg-black/20 border border-white/5">
                <span className="text-slate-500 text-xs">💡 适合：</span>
                <span className="text-slate-300 text-xs ml-1">{w.suitable}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function WalletKeys() {
  useScrollMemory();
  const { language } = useLanguage();
  const zh = language === "zh";
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  return (
    <div className="min-h-screen bg-[#050D1A] text-white" style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.6s ease" }}>
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#050D1A]/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            {zh ? "返回上一页" : "Back"}
          </button>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-violet-500/30 bg-violet-500/20 px-2.5 py-1 text-xs text-violet-400 sm:inline-flex">
              {zh ? "进阶 · 章节 03" : "Advanced · Chapter 03"}
            </span>
            <Web3ChapterNav currentChapterId="wallet-keys" />
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12 pb-20">
        <FadeIn className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs mb-5">
            {zh ? "🔐 第三章：钱包与私钥" : "🔐 Chapter 3: Wallets and Private Keys"}
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
            <span className="bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">
              {zh ? "钱包" : "Wallets"}
            </span>{" "}
            {zh ? "与私钥" : "and private keys"}
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
            {zh
              ? "在 Web3 世界，你的钱包就是你的身份和银行账户。理解私钥，是保护资产安全的第一步。"
              : "In Web3, your wallet is both your identity and your account. Understanding private keys is the first step to staying safe."}
          </p>
        </FadeIn>

        {/* 公钥私钥解释 */}
        <FadeIn className="mb-8">
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6">
            <h2 className="text-xl font-black text-violet-400 mb-4">🔑 公钥与私钥：你的数字身份</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div className="p-4 rounded-xl bg-black/20 border border-emerald-500/20">
                <div className="text-2xl mb-2">🔓</div>
                <h4 className="font-black text-emerald-400 text-sm mb-2">公钥（钱包地址）</h4>
                <p className="text-slate-400 text-xs leading-relaxed mb-3">可以公开分享，就像你的银行账号。别人可以向你的地址转账，但无法动用你的资产。</p>
                <div className="bg-black/40 rounded-lg p-2 font-mono text-xs text-emerald-300 break-all">0x742d35Cc6634C0532925a3b8D4C9B2F3e1a...</div>
              </div>
              <div className="p-4 rounded-xl bg-black/20 border border-red-500/20">
                <div className="text-2xl mb-2">🔐</div>
                <h4 className="font-black text-red-400 text-sm mb-2">私钥</h4>
                <p className="text-slate-400 text-xs leading-relaxed mb-3">绝对不能泄露，就像你的银行密码+U盾。拥有私钥就等于拥有钱包里的所有资产。</p>
                <div className="bg-black/40 rounded-lg p-2 font-mono text-xs text-red-300 break-all filter blur-sm select-none">
                  a1b2c3d4e5f6...（永远不要分享）
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-black/20 border border-yellow-500/20">
              <p className="text-yellow-300 text-sm font-bold mb-1">💡 类比理解</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                公钥 = 你家的门牌号（可以告诉别人，让他们给你寄快递）<br />
                私钥 = 你家的钥匙（绝对不能给别人，否则他们可以进你家拿走所有东西）<br />
                助记词 = 配钥匙的模板（可以复制出无数把钥匙，同样需要严格保管）
              </p>
            </div>
          </div>
        </FadeIn>

        {/* 助记词体验 */}
        <FadeIn className="mb-8">
          <h2 className="mb-4 text-2xl font-black text-white">
            {zh ? "🌱 助记词：钱包的终极备份" : "🌱 Seed phrases: the ultimate wallet backup"}
          </h2>
          <p className="text-slate-400 mb-5 text-sm leading-relaxed">
            助记词（Seed Phrase）是 12 或 24 个英文单词，可以恢复你的整个钱包。
            无论手机丢失、App 卸载，只要有助记词，你的资产就永远可以找回。
          </p>
          <SeedPhraseDemo />
        </FadeIn>

        {/* 钱包类型 */}
        <FadeIn className="mb-8">
          <h2 className="mb-5 text-2xl font-black text-white">
            {zh ? "👛 钱包类型：如何选择？" : "👛 Wallet types: how should you choose?"}
          </h2>
          <WalletTypeSelector />
        </FadeIn>

        {/* 安全最佳实践 */}
        <FadeIn className="mb-8">
          <h2 className="mb-5 text-2xl font-black text-white">
            {zh ? "🛡️ 安全最佳实践" : "🛡️ Security best practices"}
          </h2>
          <div className="space-y-3">
            {[
              { icon: "📝", title: "离线备份助记词", desc: "用纸笔抄写，存放在安全的物理位置（如保险柜）。不要截图、不要存在云端、不要发给任何人。", type: "must", label: "必须" },
              { icon: "🔒", title: "使用硬件钱包存储大额资产", desc: "超过 $1000 的资产建议使用 Ledger 或 Trezor 等硬件钱包，私钥永远不接触网络。", type: "must", label: "强烈推荐" },
              { icon: "🔍", title: "仔细检查网址", desc: "钓鱼网站会伪造 MetaMask、Uniswap 等网站。每次访问都要确认网址正确，收藏官方网址。", type: "must", label: "必须" },
              { icon: "🚫", title: "永远不要输入私钥", desc: "任何要求你输入私钥的网站或 App 都是骗局。MetaMask 等正规钱包永远不会要求你输入私钥。", type: "must", label: "必须" },
              { icon: "✅", title: "使用独立邮箱注册交易所", desc: "为加密资产账户使用专用邮箱，开启两步验证（2FA），使用 Google Authenticator 而非短信验证。", type: "recommend", label: "推荐" },
              { icon: "💰", title: "不要把所有资产放在一个地方", desc: "分散存储：部分在硬件钱包，部分在交易所，部分在 DeFi。不要把所有鸡蛋放在一个篮子里。", type: "recommend", label: "推荐" },
            ].map((item, i) => (
              <div key={i} className={`flex items-start gap-4 p-4 rounded-xl border ${item.type === "must" ? "border-red-500/20 bg-red-500/5" : "border-blue-500/20 bg-blue-500/5"}`}>
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-bold text-white text-sm">{item.title}</h5>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${item.type === "must" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>{item.label}</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* 下一章 */}
        <FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/web3-guide/defi-deep" className="tap-target block">
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5 hover:bg-yellow-500/10 transition-colors">
                <div className="mb-1 text-xs text-slate-500">{zh ? "下一章" : "Next chapter"}</div>
                <h3 className="text-base font-black text-white">
                  {zh ? "💰 DeFi 深度解析" : "💰 Deep dive into DeFi"}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {zh ? "去中心化金融的完整使用指南" : "A hands-on guide to decentralized finance"}
                </p>
              </div>
            </Link>
            <Link href="/web3-guide/exchange-guide" className="tap-target block">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 hover:bg-emerald-500/10 transition-colors">
                <div className="mb-1 text-xs text-slate-500">{zh ? "跳至" : "Jump to"}</div>
                <h3 className="text-base font-black text-white">
                  {zh ? "🏦 交易所入门指南" : "🏦 Exchange starter guide"}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {zh ? "新手最安全的 Web3 入门路径" : "The safest Web3 starting point for beginners"}
                </p>
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
