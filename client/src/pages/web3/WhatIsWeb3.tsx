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

// 互动：Web3 特征判断测验
function Web3Quiz() {
  const questions = [
    { q: "你在微博发了一篇文章，平台可以随时删除它", answer: "web2", options: ["Web1", "Web2", "Web3"] },
    { q: "你访问一个网站，只能阅读内容，无法发表评论", answer: "web1", options: ["Web1", "Web2", "Web3"] },
    { q: "你的 NFT 存储在区块链上，没有任何人可以没收", answer: "web3", options: ["Web1", "Web2", "Web3"] },
    { q: "抖音用你的浏览数据推送广告并从中获利", answer: "web2", options: ["Web1", "Web2", "Web3"] },
    { q: "你通过智能合约借款，无需银行审批", answer: "web3", options: ["Web1", "Web2", "Web3"] },
  ];
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const handleAnswer = (opt: string) => {
    if (selected) return;
    const key = opt.toLowerCase().replace(" ", "");
    setSelected(key);
    if (key === questions[current].answer) setScore(s => s + 1);
    setTimeout(() => {
      if (current + 1 >= questions.length) setFinished(true);
      else { setCurrent(c => c + 1); setSelected(null); }
    }, 1200);
  };

  if (finished) {
    return (
      <div className="text-center p-6">
        <div className="text-5xl mb-4">{score >= 4 ? "🎉" : score >= 2 ? "👍" : "📚"}</div>
        <div className="text-2xl font-black text-white mb-2">{score} / {questions.length}</div>
        <p className="text-slate-400 mb-4">{score >= 4 ? "太棒了！你已经掌握了 Web1/2/3 的核心区别。" : score >= 2 ? "不错！继续阅读下面的内容加深理解。" : "没关系，继续阅读本页内容，你会越来越清晰的！"}</p>
        <button onClick={() => { setCurrent(0); setSelected(null); setScore(0); setFinished(false); }} className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-sm transition-all">
          再来一次
        </button>
      </div>
    );
  }

  const q = questions[current];
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-slate-500">第 {current + 1} / {questions.length} 题</span>
        <span className="text-xs text-emerald-400">得分：{score}</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-1.5 mb-5">
        <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${(current / questions.length) * 100}%` }} />
      </div>
      <p className="text-white font-bold text-base mb-5 leading-relaxed">这属于哪个互联网时代？<br /><span className="text-slate-300 font-normal">"{q.q}"</span></p>
      <div className="grid grid-cols-3 gap-3">
        {q.options.map(opt => {
          const key = opt.toLowerCase().replace(" ", "");
          const isCorrect = key === q.answer;
          const isSelected = selected === key;
          const isWrong = selected && isSelected && !isCorrect;
          return (
            <button key={opt} onClick={() => handleAnswer(opt)}
              className={`py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                selected
                  ? isCorrect ? "border-emerald-500 bg-emerald-500/20 text-emerald-300" : isWrong ? "border-red-500 bg-red-500/20 text-red-300" : "border-slate-700 bg-slate-800/30 text-slate-500"
                  : "border-slate-600 bg-slate-800/50 text-white hover:border-emerald-500/50 hover:bg-emerald-500/10"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 互动：数据所有权模拟
function DataOwnershipDemo() {
  const [scenario, setScenario] = useState<"web2" | "web3">("web2");
  const [action, setAction] = useState<string | null>(null);

  const web2Actions = [
    { label: "平台删除你的内容", icon: "🗑️", result: "你的 10 万粉丝内容瞬间消失，无能为力。", bad: true },
    { label: "平台封禁你的账号", icon: "🔒", result: "多年积累的粉丝和内容全部归零，无法取回。", bad: true },
    { label: "平台出售你的数据", icon: "💸", result: "你的浏览记录、位置信息被卖给广告商，你一分钱没拿到。", bad: true },
    { label: "平台修改服务条款", icon: "📄", result: "你只能同意或离开，没有任何谈判权。", bad: true },
  ];

  const web3Actions = [
    { label: "尝试删除你的 NFT", icon: "🛡️", result: "失败！NFT 存储在区块链上，没有任何人可以删除。", bad: false },
    { label: "尝试冻结你的钱包", icon: "🔑", result: "失败！只要你有私钥，没有任何机构可以冻结你的资产。", bad: false },
    { label: "尝试修改智能合约规则", icon: "📜", result: "失败！智能合约一旦部署，规则不可更改，代码即法律。", bad: false },
    { label: "跨平台使用你的身份", icon: "🌐", result: "成功！你的钱包地址在所有 Web3 应用中通用，无需重新注册。", bad: false },
  ];

  const actions = scenario === "web2" ? web2Actions : web3Actions;

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 overflow-hidden">
      {/* 切换 */}
      <div className="flex border-b border-slate-700">
        <button onClick={() => { setScenario("web2"); setAction(null); }}
          className={`flex-1 py-3 text-sm font-bold transition-all ${scenario === "web2" ? "bg-purple-500/20 text-purple-400 border-b-2 border-purple-500" : "text-slate-500 hover:text-slate-300"}`}>
          😰 Web2 世界
        </button>
        <button onClick={() => { setScenario("web3"); setAction(null); }}
          className={`flex-1 py-3 text-sm font-bold transition-all ${scenario === "web3" ? "bg-emerald-500/20 text-emerald-400 border-b-2 border-emerald-500" : "text-slate-500 hover:text-slate-300"}`}>
          😎 Web3 世界
        </button>
      </div>
      <div className="p-5">
        <p className="text-slate-400 text-sm mb-4">
          {scenario === "web2" ? "在 Web2 世界，平台拥有你的数据。点击看看会发生什么：" : "在 Web3 世界，你拥有自己的数据。点击看看区别："}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {actions.map((a, i) => (
            <button key={i} onClick={() => setAction(a.result)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:scale-[1.02] ${
                scenario === "web2" ? "border-red-500/30 bg-red-500/5 hover:bg-red-500/10" : "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10"
              }`}>
              <span className="text-2xl">{a.icon}</span>
              <span className={`text-sm font-medium ${scenario === "web2" ? "text-red-300" : "text-emerald-300"}`}>{a.label}</span>
            </button>
          ))}
        </div>
        {action && (
          <div className={`p-4 rounded-xl border ${scenario === "web2" ? "border-red-500/30 bg-red-500/10" : "border-emerald-500/30 bg-emerald-500/10"}`}>
            <p className={`text-sm font-medium ${scenario === "web2" ? "text-red-300" : "text-emerald-300"}`}>{action}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WhatIsWeb3() {
  useScrollMemory();
  const { language } = useLanguage();
  const zh = language === "zh";
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const timeline = [
    { year: "1991", era: "Web 1.0 诞生", desc: "Tim Berners-Lee 发明万维网，互联网进入只读时代。网页是静态的，用户只能浏览。", color: "#60A5FA" },
    { year: "2004", era: "Web 2.0 崛起", desc: "Facebook、YouTube、Twitter 相继出现，用户开始创造内容。但数据归平台所有。", color: "#A78BFA" },
    { year: "2008", era: "比特币白皮书", desc: "中本聪发布《比特币：一种点对点的电子现金系统》，区块链技术诞生。", color: "#FBBF24" },
    { year: "2015", era: "以太坊上线", desc: "Vitalik Buterin 推出以太坊，引入智能合约，Web3 应用开发成为可能。", color: "#6EE7B7" },
    { year: "2020", era: "DeFi 之夏", desc: "去中心化金融爆发，数十亿美元涌入 DeFi 协议，Web3 进入大众视野。", color: "#F97316" },
    { year: "2021", era: "NFT 元年", desc: "NFT 市场爆发，数字所有权概念深入人心，Web3 用户突破 1 亿。", color: "#EC4899" },
    { year: "2024", era: "机构入场", desc: "比特币现货 ETF 获批，贝莱德等传统金融巨头入场，Web3 走向主流。", color: "#6EE7B7" },
    { year: "未来", era: "Web3 普及", desc: "预计 2030 年 Web3 用户超 10 亿，互联网所有权将真正回归用户。", color: "#A78BFA" },
  ];

  return (
    <div className="min-h-screen bg-[#050D1A] text-white" style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.6s ease" }}>
      {/* 导航 */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#050D1A]/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            {zh ? "返回上一页" : "Back"}
          </button>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-1 text-xs text-emerald-400 sm:inline-flex">
              {zh ? "入门 · 章节 01" : "Basics · Chapter 01"}
            </span>
            <Web3ChapterNav currentChapterId="what-is-web3" />
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12 pb-20">
        {/* 标题 */}
        <FadeIn className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs mb-5">
            {zh ? "🌐 第一章：Web3 基础" : "🌐 Chapter 1: Web3 Basics"}
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
            {zh ? "什么是 " : "What is "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Web3</span>
            {zh ? "？" : "?"}
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
            {zh
              ? "互联网已经经历了三次进化。理解这三个时代的本质区别，是进入 Web3 世界的第一步。"
              : "The internet has already gone through three major eras. Understanding their core differences is the first step into Web3."}
          </p>
        </FadeIn>

        {/* 核心概念 */}
        <FadeIn className="mb-10">
          <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 p-6 sm:p-8">
            <h2 className="mb-4 text-xl font-black text-emerald-400">
              {zh ? "💡 一句话理解 Web3" : "💡 Web3 in one sentence"}
            </h2>
            <p className="text-slate-200 text-lg leading-relaxed mb-4">
              如果说 <strong className="text-blue-300">Web1</strong> 是「只能看」，<strong className="text-purple-300">Web2</strong> 是「可以发帖但数据属于平台」，
              那么 <strong className="text-emerald-300">Web3</strong> 就是「你的数据、资产、身份真正属于你自己」。
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
              {[
                zh
                  ? { era: "Web 1.0", icon: "📖", desc: "只读。你是观众，内容由网站提供，你无法互动。", color: "border-blue-500/30 bg-blue-500/5 text-blue-300" }
                  : { era: "Web 1.0", icon: "📖", desc: "Read-only. You can consume content, but you cannot participate.", color: "border-blue-500/30 bg-blue-500/5 text-blue-300" },
                zh
                  ? { era: "Web 2.0", icon: "✍️", desc: "读写。你可以创作，但平台拥有你的数据和账号。", color: "border-purple-500/30 bg-purple-500/5 text-purple-300" }
                  : { era: "Web 2.0", icon: "✍️", desc: "Read and write. You can create, but the platform still owns your account and data.", color: "border-purple-500/30 bg-purple-500/5 text-purple-300" },
                zh
                  ? { era: "Web 3.0", icon: "🔑", desc: "读写拥有。你的资产存在区块链上，完全属于你。", color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" }
                  : { era: "Web 3.0", icon: "🔑", desc: "Read, write, and own. Your assets live on-chain and stay under your control.", color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" },
              ].map((item, i) => (
                <div key={i} className={`p-4 rounded-xl border ${item.color}`}>
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className={`font-black text-sm mb-1`}>{item.era}</div>
                  <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* 互动测验 */}
        <FadeIn className="mb-10">
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700/60 flex items-center gap-3">
              <span className="text-xl">🎯</span>
              <div>
                <h3 className="text-sm font-black text-white">
                  {zh ? "互动测验：判断互联网时代" : "Interactive quiz: identify the internet era"}
                </h3>
                <p className="text-xs text-slate-500">
                  {zh ? "根据描述，判断属于哪个 Web 时代" : "Choose whether the example belongs to Web1, Web2, or Web3"}
                </p>
              </div>
            </div>
            <Web3Quiz />
          </div>
        </FadeIn>

        {/* 数据所有权互动演示 */}
        <FadeIn className="mb-10">
          <h2 className="mb-4 text-2xl font-black text-white">
            {zh ? "🔑 数据所有权：最核心的区别" : "🔑 Data ownership: the most important difference"}
          </h2>
          <p className="text-slate-400 mb-5 leading-relaxed">
            Web2 和 Web3 最根本的区别，不是技术，而是<strong className="text-white">数据所有权</strong>。
            在 Web2，你是产品；在 Web3，你是所有者。
          </p>
          <DataOwnershipDemo />
        </FadeIn>

        {/* 互联网发展时间轴 */}
        <FadeIn className="mb-10">
          <h2 className="mb-6 text-2xl font-black text-white">
            {zh ? "📅 互联网进化时间轴" : "📅 Timeline of internet evolution"}
          </h2>
          <div className="relative">
            {/* 竖线 */}
            <div className="absolute left-5 sm:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 via-emerald-500/50 to-purple-500/50" />
            <div className="space-y-6">
              {timeline.map((item, i) => (
                <div key={i} className={`flex gap-4 sm:gap-0 ${i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"}`}>
                  {/* 内容 */}
                  <div className={`flex-1 ${i % 2 === 0 ? "sm:pr-8 sm:text-right" : "sm:pl-8"} pl-10 sm:pl-0`}>
                    <div className="p-4 rounded-xl border border-white/8 bg-slate-800/40 hover:bg-slate-800/60 transition-colors">
                      <div className="font-mono text-xs mb-1" style={{ color: item.color }}>{item.year}</div>
                      <h4 className="font-black text-white text-sm mb-1">{item.era}</h4>
                      <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                  {/* 圆点 */}
                  <div className="absolute left-3.5 sm:left-1/2 sm:-translate-x-1/2 mt-4 w-3 h-3 rounded-full border-2 border-slate-900" style={{ background: item.color }} />
                  {/* 占位 */}
                  <div className="hidden sm:block flex-1" />
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Web3 的三大支柱 */}
        <FadeIn className="mb-10">
          <h2 className="mb-5 text-2xl font-black text-white">
            {zh ? "🏛️ Web3 的三大支柱" : "🏛️ The three pillars of Web3"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: "⛓️", title: "区块链", desc: "去中心化的分布式账本，所有数据公开透明、不可篡改。没有单一控制中心，全球节点共同维护。", link: "/web3-guide/blockchain-basics", linkText: "深入了解区块链 →", color: "border-blue-500/30 bg-blue-500/5" },
              { icon: "🔐", title: "加密学", desc: "公钥/私钥体系保证只有你能控制自己的资产。哈希函数确保数据完整性，数字签名验证身份。", link: "/web3-guide/wallet-keys", linkText: "了解钱包与私钥 →", color: "border-violet-500/30 bg-violet-500/5" },
              { icon: "📜", title: "智能合约", desc: "代码自动执行合约条款，无需中间人。条件满足时自动触发，规则透明公开，不受任何人干预。", link: "/web3-guide/blockchain-basics", linkText: "了解智能合约 →", color: "border-emerald-500/30 bg-emerald-500/5" },
            ].map((item, i) => (
              <div key={i} className={`p-5 rounded-xl border ${item.color}`}>
                <div className="text-3xl mb-3">{item.icon}</div>
                <h4 className="font-black text-white mb-2">{item.title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">{item.desc}</p>
                <Link href={item.link} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">{item.linkText}</Link>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Web3 的应用场景 */}
        <FadeIn className="mb-10">
          <h2 className="mb-5 text-2xl font-black text-white">
            {zh ? "🌍 Web3 正在改变哪些领域？" : "🌍 Which fields is Web3 changing?"}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { icon: "💰", title: "去中心化金融", desc: "DeFi 协议提供借贷、交易、理财服务，无需银行" },
              { icon: "🎨", title: "数字艺术 NFT", desc: "艺术家直接向全球买家出售作品，无需画廊中介" },
              { icon: "🎮", title: "链游 GameFi", desc: "游戏内资产真正属于玩家，可在市场自由交易" },
              { icon: "🏛️", title: "去中心化自治", desc: "DAO 让社区成员共同决策，代币即投票权" },
              { icon: "🌐", title: "去中心化存储", desc: "IPFS、Arweave 让数据永久存储，无法被删除" },
              { icon: "🆔", title: "数字身份", desc: "自主主权身份，无需依赖 Google/微信登录" },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl border border-white/8 bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                <div className="text-2xl mb-2">{item.icon}</div>
                <h5 className="font-bold text-white text-xs mb-1">{item.title}</h5>
                <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* 下一章导航 */}
        <FadeIn>
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="mb-1 text-xs text-slate-500">{zh ? "下一章" : "Next chapter"}</div>
              <h3 className="text-lg font-black text-white">
                {zh ? "⛓️ 区块链技术基础" : "⛓️ Blockchain foundations"}
              </h3>
              <p className="text-sm text-slate-400">
                {zh ? "深入了解支撑 Web3 的底层技术原理" : "Understand the technology that makes Web3 possible"}
              </p>
            </div>
            <Link href="/web3-guide/blockchain-basics" className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition-all whitespace-nowrap">
                {zh ? "继续学习 →" : "Continue →"}
            </Link>
          </div>
        </FadeIn>
      </div>
      {/* 右下角回到顶部按钮 */}
      <ScrollToTopButton color="emerald" />
    </div>
  );
}
