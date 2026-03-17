import { useState, useEffect, useRef } from "react";
import { useCallback } from "react";
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

// 互动：模拟区块链篡改
function TamperDemo() {
  const [blocks, setBlocks] = useState([
    { id: 1, data: "Alice → Bob: 1 BTC", hash: "0x3f7a9b2c", prevHash: "0x00000000", valid: true },
    { id: 2, data: "Bob → Carol: 0.5 BTC", hash: "0x8e4d1f6a", prevHash: "0x3f7a9b2c", valid: true },
    { id: 3, data: "Carol → Dave: 0.2 BTC", hash: "0x2c9e5b7d", prevHash: "0x8e4d1f6a", valid: true },
  ]);
  const [editingBlock, setEditingBlock] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleEdit = (blockId: number) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    setEditingBlock(blockId);
    setEditValue(block.data);
  };

  const handleSave = () => {
    if (editingBlock === null) return;
    setBlocks(prev => prev.map((b, i) => {
      if (b.id === editingBlock) {
        return { ...b, data: editValue, hash: "0x" + Math.random().toString(16).slice(2, 10), valid: false };
      }
      if (b.id > editingBlock) {
        return { ...b, valid: false };
      }
      return b;
    }));
    setEditingBlock(null);
  };

  const handleReset = () => {
    setBlocks([
      { id: 1, data: "Alice → Bob: 1 BTC", hash: "0x3f7a9b2c", prevHash: "0x00000000", valid: true },
      { id: 2, data: "Bob → Carol: 0.5 BTC", hash: "0x8e4d1f6a", prevHash: "0x3f7a9b2c", valid: true },
      { id: 3, data: "Carol → Dave: 0.2 BTC", hash: "0x2c9e5b7d", prevHash: "0x8e4d1f6a", valid: true },
    ]);
    setEditingBlock(null);
  };

  const hasInvalid = blocks.some(b => !b.valid);

  return (
    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-black text-blue-400 text-base">🔗 区块链防篡改演示</h3>
          <p className="text-slate-500 text-xs mt-0.5">尝试修改任意区块的数据，看看会发生什么</p>
        </div>
        {hasInvalid && (
          <button onClick={handleReset} className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            重置
          </button>
        )}
      </div>

      <div className="space-y-3">
        {blocks.map((block, i) => (
          <div key={block.id} className={`rounded-xl border p-4 transition-all ${block.valid ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/40 bg-red-500/10 animate-pulse"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${block.valid ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                区块 #{block.id} {block.valid ? "✓ 有效" : "✗ 已损坏"}
              </span>
              {block.valid && editingBlock !== block.id && (
                <button onClick={() => handleEdit(block.id)} className="text-xs text-slate-500 hover:text-yellow-400 transition-colors">
                  ✏️ 尝试篡改
                </button>
              )}
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex gap-2">
                <span className="text-slate-500 w-16 flex-shrink-0">上一哈希</span>
                <span className="text-slate-400">{block.prevHash}</span>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-slate-500 w-16 flex-shrink-0">数据</span>
                {editingBlock === block.id ? (
                  <div className="flex gap-2 flex-1">
                    <input value={editValue} onChange={e => setEditValue(e.target.value)}
                      className="flex-1 bg-slate-800 border border-yellow-500/50 rounded px-2 py-0.5 text-yellow-300 text-xs focus:outline-none" />
                    <button onClick={handleSave} className="px-2 py-0.5 bg-yellow-500 text-black rounded text-xs font-bold">确认</button>
                  </div>
                ) : (
                  <span className={block.valid ? "text-white" : "text-red-300 line-through"}>{block.data}</span>
                )}
              </div>
              <div className="flex gap-2">
                <span className="text-slate-500 w-16 flex-shrink-0">哈希值</span>
                <span className={block.valid ? "text-blue-300" : "text-red-400"}>{block.hash}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasInvalid && (
        <div className="mt-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
          <p className="text-red-300 text-sm font-bold mb-1">🚨 链已损坏！</p>
          <p className="text-slate-400 text-xs leading-relaxed">
            修改了区块 #{blocks.find(b => !b.valid)?.id} 的数据后，其哈希值改变，导致后续所有区块的"上一哈希"对不上，整条链都失效了。
            在真实区块链中，全网节点会立即拒绝这条被篡改的链。
          </p>
        </div>
      )}
    </div>
  );
}

// 互动：共识机制模拟
function ConsensusDemo() {
  const [mechanism, setMechanism] = useState<"pow" | "pos">("pow");
  const [mining, setMining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  const simulate = useCallback(async () => {
    if (mining) return;
    setMining(true);
    setProgress(0);
    setResult(null);
    const steps = mechanism === "pow" ? 20 : 8;
    for (let i = 1; i <= steps; i++) {
      await new Promise(r => setTimeout(r, mechanism === "pow" ? 150 : 200));
      setProgress(Math.round((i / steps) * 100));
    }
    setResult(mechanism === "pow"
      ? "⛏️ 矿工找到有效哈希！消耗了大量算力，获得 6.25 BTC 区块奖励。"
      : "🎲 验证者被随机选中！质押了 32 ETH，验证区块后获得约 0.01 ETH 奖励。"
    );
    setMining(false);
  }, [mining, mechanism]);

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 overflow-hidden">
      <div className="flex border-b border-slate-700">
        <button onClick={() => { setMechanism("pow"); setProgress(0); setResult(null); }}
          className={`flex-1 py-3 text-sm font-bold transition-all ${mechanism === "pow" ? "bg-yellow-500/20 text-yellow-400 border-b-2 border-yellow-500" : "text-slate-500 hover:text-slate-300"}`}>
          ⛏️ 工作量证明 (PoW)
        </button>
        <button onClick={() => { setMechanism("pos"); setProgress(0); setResult(null); }}
          className={`flex-1 py-3 text-sm font-bold transition-all ${mechanism === "pos" ? "bg-blue-500/20 text-blue-400 border-b-2 border-blue-500" : "text-slate-500 hover:text-slate-300"}`}>
          🎲 权益证明 (PoS)
        </button>
      </div>
      <div className="p-5">
        <div className="mb-4">
          {mechanism === "pow" ? (
            <p className="text-slate-400 text-sm leading-relaxed">
              <strong className="text-yellow-400">工作量证明</strong>：矿工通过大量计算寻找满足条件的哈希值，谁先找到谁就能打包区块并获得奖励。
              比特币使用此机制，安全性极高，但能耗巨大。
            </p>
          ) : (
            <p className="text-slate-400 text-sm leading-relaxed">
              <strong className="text-blue-400">权益证明</strong>：验证者需质押一定数量的代币作为担保，系统随机选择验证者打包区块。
              以太坊 2.0 已切换至 PoS，能耗降低 99.95%。
            </p>
          )}
        </div>
        <button onClick={simulate} disabled={mining}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all mb-4 ${mining ? "bg-slate-700 text-slate-500 cursor-not-allowed" : mechanism === "pow" ? "bg-yellow-500 hover:bg-yellow-400 text-black" : "bg-blue-500 hover:bg-blue-400 text-white"}`}>
          {mining ? "处理中..." : "▶ 模拟出块过程"}
        </button>
        {(mining || progress > 0) && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{mechanism === "pow" ? "算力计算中..." : "等待验证者选择..."}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className={`h-2 rounded-full transition-all duration-200 ${mechanism === "pow" ? "bg-yellow-500" : "bg-blue-500"}`} style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
        {result && (
          <div className={`p-4 rounded-xl border ${mechanism === "pow" ? "border-yellow-500/30 bg-yellow-500/10" : "border-blue-500/30 bg-blue-500/10"}`}>
            <p className={`text-sm font-medium ${mechanism === "pow" ? "text-yellow-300" : "text-blue-300"}`}>{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 哈希演示
function HashDemo() {
  const [input, setInput] = useState("比特币区块 #800000");
  const [hash, setHash] = useState("");
  useEffect(() => {
    const mockHash = async (str: string) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    };
    mockHash(input || " ").then(setHash);
  }, [input]);
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
      <h4 className="text-sm font-bold text-slate-300 mb-3">🔐 哈希函数体验：改变一个字符，输出完全不同</h4>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">输入内容</label>
          <input value={input} onChange={e => setInput(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">SHA-256 哈希值</label>
          <div className="bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 font-mono text-xs text-blue-300 break-all">{hash || "..."}</div>
        </div>
        <p className="text-xs text-slate-500">💡 即使只改动一个字符，哈希值也会完全不同。这是区块链「不可篡改」的密码学基础。</p>
      </div>
    </div>
  );
}

export default function BlockchainBasics() {
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
            <span className="hidden rounded-full border border-blue-500/30 bg-blue-500/20 px-2.5 py-1 text-xs text-blue-400 sm:inline-flex">
              {zh ? "进阶 · 章节 02" : "Advanced · Chapter 02"}
            </span>
            <Web3ChapterNav currentChapterId="blockchain-basics" />
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12 pb-20">
        <FadeIn className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs mb-5">
            {zh ? "⛓️ 第二章：区块链技术" : "⛓️ Chapter 2: Blockchain Technology"}
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              {zh ? "区块链" : "Blockchain"}
            </span>{" "}
            {zh ? "技术基础" : "Fundamentals"}
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
            {zh
              ? "区块链是 Web3 的底层基础设施。理解它的工作原理，你就能理解为什么 Web3 是可信的。"
              : "Blockchain is the infrastructure layer of Web3. Once you understand how it works, Web3 starts to feel much less abstract."}
          </p>
        </FadeIn>

        {/* 核心概念 */}
        <FadeIn className="mb-8">
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
            <h2 className="mb-4 text-xl font-black text-blue-400">
              {zh ? "📖 区块链是什么？" : "📖 What is a blockchain?"}
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              区块链是一种<strong className="text-white">分布式账本技术</strong>。想象一本账本，不是存在银行服务器上，
              而是同时存在全球<strong className="text-blue-300">数千台电脑</strong>上。每一笔交易都被打包成「区块」，
              通过密码学连接成「链」，任何人都无法单独修改历史记录。
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: "🔒", title: "不可篡改", desc: "修改任意区块会使后续所有区块失效，全网节点会立即拒绝", color: "text-blue-400" },
                { icon: "🌐", title: "去中心化", desc: "数据分布在全球数千节点，没有单一控制中心可以关闭它", color: "text-emerald-400" },
                { icon: "🔍", title: "透明可验证", desc: "所有交易公开可查，任何人都可以在区块链浏览器上验证", color: "text-yellow-400" },
                { icon: "📜", title: "智能合约", desc: "代码自动执行，条件满足时自动触发，无需人工干预", color: "text-purple-400" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-black/20 border border-white/5">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <h5 className={`font-bold text-sm mb-1 ${item.color}`}>{item.title}</h5>
                    <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* 防篡改演示 */}
        <FadeIn className="mb-8">
          <h2 className="mb-4 text-2xl font-black text-white">
            {zh ? "🔗 为什么区块链不可篡改？" : "🔗 Why is a blockchain hard to tamper with?"}
          </h2>
          <p className="text-slate-400 mb-5 leading-relaxed text-sm">
            每个区块都包含上一个区块的哈希值，形成一条链。修改任意区块的数据，
            其哈希值就会改变，导致后续所有区块的"上一哈希"对不上，整条链失效。
          </p>
          <TamperDemo />
        </FadeIn>

        {/* 哈希演示 */}
        <FadeIn className="mb-8">
          <h2 className="mb-4 text-2xl font-black text-white">
            {zh ? "🔐 哈希函数：区块链的密码学基础" : "🔐 Hash functions: the cryptographic base"}
          </h2>
          <p className="text-slate-400 mb-5 text-sm leading-relaxed">
            哈希函数将任意长度的数据转换为固定长度的字符串。输入稍有变化，输出就会完全不同。
            这是区块链不可篡改性的密码学基础。
          </p>
          <HashDemo />
        </FadeIn>

        {/* 共识机制 */}
        <FadeIn className="mb-8">
          <h2 className="mb-4 text-2xl font-black text-white">
            {zh ? "🤝 共识机制：如何达成全网一致？" : "🤝 Consensus: how does the network agree?"}
          </h2>
          <p className="text-slate-400 mb-5 text-sm leading-relaxed">
            在没有中央机构的情况下，数千个节点如何就"哪条链是正确的"达成一致？
            这就是共识机制要解决的问题。
          </p>
          <ConsensusDemo />
        </FadeIn>

        {/* Layer 1 vs Layer 2 */}
        <FadeIn className="mb-8">
          <h2 className="mb-5 text-2xl font-black text-white">
            {zh ? "🏗️ Layer 1 vs Layer 2：扩容之路" : "🏗️ Layer 1 vs Layer 2: the scaling path"}
          </h2>
          <div className="rounded-2xl border border-slate-700 overflow-hidden">
            <div className="bg-slate-800/50 px-5 py-4 border-b border-slate-700">
              <p className="text-slate-400 text-sm">以太坊每秒只能处理约 15 笔交易（TPS），而 Visa 可以处理 24,000+ TPS。Layer 2 是解决这个问题的关键。</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/30">
                    {["", "Layer 1（主链）", "Layer 2（扩容层）"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["代表", "比特币、以太坊、Solana", "Arbitrum、Optimism、Base、zkSync"],
                    ["TPS", "7-65,000", "2,000-100,000+"],
                    ["Gas 费", "较高（$1-50）", "极低（$0.001-0.1）"],
                    ["安全性", "最高（主链保障）", "继承主链安全性"],
                    ["适合场景", "大额转账、长期持有", "高频交易、DeFi、游戏"],
                  ].map(([dim, l1, l2], i) => (
                    <tr key={i} className={`border-b border-slate-800 ${i % 2 === 0 ? "bg-slate-800/20" : ""}`}>
                      <td className="px-4 py-3 text-slate-400 font-medium text-xs">{dim}</td>
                      <td className="px-4 py-3 text-slate-300 text-xs">{l1}</td>
                      <td className="px-4 py-3 text-emerald-300 text-xs">{l2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </FadeIn>

        {/* 智能合约 */}
        <FadeIn className="mb-8">
          <h2 className="mb-5 text-2xl font-black text-white">
            {zh ? "📜 智能合约：代码即法律" : "📜 Smart contracts: code as the rulebook"}
          </h2>
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6">
            <p className="text-slate-300 leading-relaxed mb-5">
              智能合约是部署在区块链上的自动执行程序。一旦部署，任何人（包括开发者）都无法修改。
              当预设条件满足时，合约自动执行，无需任何中间人。
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: "自动售货机类比", desc: "投入代币 → 选择商品 → 自动出货。智能合约就是这样：满足条件 → 自动执行，无需店员（中间人）。", icon: "🏪" },
                { title: "DeFi 借贷合约", desc: "存入抵押品 → 合约自动计算可借额度 → 到期未还款 → 合约自动清算抵押品。全程无需人工干预。", icon: "🏦" },
                { title: "NFT 版税合约", desc: "艺术家设置 10% 版税，每次 NFT 转手，合约自动将 10% 转给艺术家，永久有效，无法被平台修改。", icon: "🎨" },
                { title: "DAO 投票合约", desc: "提案达到投票数量 → 合约自动执行提案内容（如转移资金）。社区决策无需信任任何个人。", icon: "🏛️" },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-black/20 border border-white/5">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <h5 className="font-bold text-purple-300 text-sm mb-1">{item.title}</h5>
                  <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* 下一章 */}
        <FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/web3-guide/wallet-keys" className="tap-target block">
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 hover:bg-violet-500/10 transition-colors">
                <div className="mb-1 text-xs text-slate-500">{zh ? "下一章" : "Next chapter"}</div>
                <h3 className="text-base font-black text-white">
                  {zh ? "🔐 钱包与私钥" : "🔐 Wallets and private keys"}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {zh ? "了解如何安全管理你的 Web3 资产" : "Learn how to manage Web3 assets safely"}
                </p>
              </div>
            </Link>
            <Link href="/web3-guide/defi-deep" className="tap-target block">
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5 hover:bg-yellow-500/10 transition-colors">
                <div className="mb-1 text-xs text-slate-500">{zh ? "跳至" : "Jump to"}</div>
                <h3 className="text-base font-black text-white">
                  {zh ? "💰 DeFi 深度解析" : "💰 Deep dive into DeFi"}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {zh ? "去中心化金融的完整使用指南" : "A practical guide to decentralized finance"}
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
