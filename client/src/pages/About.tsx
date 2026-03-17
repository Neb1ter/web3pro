/**
 * About.tsx
 * 关于我们页面 — E-E-A-T 核心
 * 路由: /about
 * 目的: 建立网站权威性、可信度，提升 Google E-E-A-T 评分
 */
import { SeoManager } from "@/components/SeoManager";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import {
  Shield, Users, TrendingUp, Globe, CheckCircle2, Award,
  Mail, MessageSquare, ExternalLink, Star, Target, Eye
} from "lucide-react";

const MILESTONES = [
  { year: "2023", zh: "Get8 Pro 正式上线，专注于加密货币交易所返佣信息整合", en: "Get8 Pro officially launched, focusing on crypto exchange rebate information" },
  { year: "2024", zh: "与币安、OKX、Gate.io 等主流交易所建立官方合作关系", en: "Established official partnerships with Binance, OKX, Gate.io and other major exchanges" },
  { year: "2025", zh: "推出 Web3 教育内容体系，覆盖区块链基础、DeFi、钱包安全等核心知识", en: "Launched Web3 education content covering blockchain basics, DeFi, wallet security" },
  { year: "2026", zh: "上线模拟交易、加密快讯、工具合集，成为 Web3 交易者一站式导航平台", en: "Launched simulated trading, crypto news, tools hub — becoming a one-stop Web3 navigator" },
];

const PRINCIPLES = [
  {
    icon: <Shield className="w-6 h-6" />,
    title: { zh: "独立客观", en: "Independent & Objective" },
    desc: { zh: "我们的评测结果不受返佣比例影响。返佣高的交易所不会获得更高评分，我们始终以用户利益为优先。", en: "Our reviews are not influenced by rebate rates. Higher rebates don't mean higher scores — user interests always come first." },
  },
  {
    icon: <Eye className="w-6 h-6" />,
    title: { zh: "数据透明", en: "Data Transparency" },
    desc: { zh: "所有手续费率、返佣比例均来自交易所官方公告，我们会定期核实并更新，确保信息的准确性。", en: "All fee rates and rebate percentages come from official exchange announcements. We regularly verify and update to ensure accuracy." },
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: { zh: "用户优先", en: "User First" },
    desc: { zh: "我们的目标是帮助用户降低交易成本、提升决策效率，而不是单纯追求推广收益。", en: "Our goal is to help users reduce trading costs and improve decision-making efficiency, not just maximize referral revenue." },
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: { zh: "专业深度", en: "Professional Depth" },
    desc: { zh: "我们的内容由具有多年加密货币从业经验的团队创作，力求专业、准确、对新手友好。", en: "Our content is created by a team with years of crypto industry experience, striving to be professional, accurate, and beginner-friendly." },
  },
];

const PARTNERSHIPS = [
  { name: "Gate.io", desc: { zh: "官方合作伙伴 · 60% 返佣", en: "Official Partner · 60% Rebate" }, emoji: "🟢", href: "/exchange/gate" },
  { name: "OKX", desc: { zh: "官方合作伙伴 · 20% 返佣", en: "Official Partner · 20% Rebate" }, emoji: "⚫", href: "/exchange/okx" },
  { name: "Binance", desc: { zh: "官方合作伙伴 · 20% 返佣", en: "Official Partner · 20% Rebate" }, emoji: "🟡", href: "/exchange/binance" },
  { name: "Bybit", desc: { zh: "官方合作伙伴 · 30% 返佣", en: "Official Partner · 30% Rebate" }, emoji: "🔵", href: "/exchange/bybit" },
  { name: "Bitget", desc: { zh: "官方合作伙伴 · 50% 返佣", en: "Official Partner · 50% Rebate" }, emoji: "🔷", href: "/exchange/bitget" },
];

const STATS = [
  { val: "5+", label: { zh: "官方合作交易所", en: "Official Partner Exchanges" } },
  { val: "永久", label: { zh: "透明化永久返佣", en: "Lifetime Transparent Rebate" } },
  { val: "3,600+", label: { zh: "覆盖加密货币种类", en: "Cryptocurrencies Covered" } },
  { val: "24/7", label: { zh: "实时行情与快讯", en: "Real-time News & Prices" } },
];

export default function About() {
  const { language } = useLanguage();
  const zh = language === "zh";

  return (
    <>
      <SeoManager
        title={zh ? "关于 Get8 Pro — Web3 专业交易者的可信导航仪" : "About Get8 Pro — The Trusted Navigator for Web3 Professionals"}
        description={zh
          ? "Get8 Pro 是专注于加密货币交易所返佣、Web3 教育和工具的专业平台。了解我们的使命、团队背景、合作交易所和内容原则。"
          : "Get8 Pro is a professional platform focused on crypto exchange rebates, Web3 education, and tools. Learn about our mission, team background, partner exchanges, and content principles."}
        path="/about"
        keywords={zh
          ? "Get8 Pro,关于我们,加密货币平台,交易所返佣,Web3教育,团队介绍"
          : "Get8 Pro,about us,crypto platform,exchange rebates,Web3 education,team"}
      />

      <div className="min-h-screen bg-[#050D1A] text-white">
        {/* ── 顶部导航 ── */}
        <div className="border-b border-white/10 bg-[#050D1A]/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3 text-sm">
            <Link href="/" className="text-slate-400 hover:text-white transition">Get8 Pro</Link>
            <span className="text-slate-600">/</span>
            <span className="text-white font-semibold">{zh ? "关于我们" : "About Us"}</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">

          {/* ── Hero ── */}
          <section className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-medium mb-6">
              <Shield className="w-3.5 h-3.5" />
              {zh ? "官方认证 · 专业致胜" : "Officially Verified · Professionally Vetted"}
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
              {zh ? "关于 " : "About "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Get8 Pro</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
              {zh
                ? "我们是 Web3 专业交易者的可信导航仪。消除信息不对称，助你降低交易成本，提升决策效率。"
                : "We are the trusted navigator for Web3 professionals. Eliminating information asymmetry to help you reduce trading costs and improve decision-making efficiency."}
            </p>
          </section>

          {/* ── 数据统计 ── */}
          <section>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {STATS.map((s, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                  <div className="text-3xl font-black text-white mb-1">{s.val}</div>
                  <div className="text-slate-400 text-xs">{zh ? s.label.zh : s.label.en}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── 我们的使命 ── */}
          <section>
            <h2 className="text-2xl font-black text-white mb-6">{zh ? "我们的使命" : "Our Mission"}</h2>
            <div className="bg-gradient-to-br from-blue-950/40 to-gray-900 border border-blue-500/30 rounded-2xl p-6 sm:p-8">
              <p className="text-slate-300 text-lg leading-relaxed mb-4">
                {zh
                  ? "加密货币市场存在严重的信息不对称。普通用户往往不知道：同一家交易所，通过不同渠道注册，手续费可能相差 20%-60%；不同交易所之间，合约手续费可能相差 5 倍以上。"
                  : "The crypto market suffers from severe information asymmetry. Most users don't know: registering at the same exchange through different channels can result in 20-60% fee differences; contract fees between exchanges can differ by 5x or more."}
              </p>
              <p className="text-slate-300 text-lg leading-relaxed mb-4">
                {zh
                  ? "Get8 Pro 的使命是：整合官方认证的返佣信息，提供基于真实数据的交易所评测，帮助每一位用户做出更明智的决策，用更少的成本参与 Web3 世界。"
                  : "Get8 Pro's mission is to aggregate officially verified rebate information, provide exchange reviews based on real data, and help every user make smarter decisions to participate in Web3 with lower costs."}
              </p>
              <p className="text-slate-300 text-lg leading-relaxed">
                {zh
                  ? "我们不是中间商，不赚差价。我们是信息整合者，将交易所的官方合作返佣直接传递给用户，确保每一分返佣都真实可查。"
                  : "We are not middlemen taking a cut. We are information aggregators, passing official exchange partnership rebates directly to users, ensuring every rebate is real and traceable."}
              </p>
            </div>
          </section>

          {/* ── 内容原则 ── */}
          <section>
            <h2 className="text-2xl font-black text-white mb-6">{zh ? "内容原则" : "Content Principles"}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PRINCIPLES.map((p, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-blue-400">{p.icon}</div>
                    <h3 className="font-bold text-white">{zh ? p.title.zh : p.title.en}</h3>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{zh ? p.desc.zh : p.desc.en}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── 团队背景 ── */}
          <section>
            <h2 className="text-2xl font-black text-white mb-6">{zh ? "团队背景" : "Team Background"}</h2>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                  G8
                </div>
                <div>
                  <h3 className="font-black text-white text-lg mb-1">Get8 Pro {zh ? "编辑团队" : "Editorial Team"}</h3>
                  <p className="text-slate-400 text-sm">{zh ? "加密货币从业者 · Web3 研究员 · 独立评测人" : "Crypto Industry Practitioners · Web3 Researchers · Independent Reviewers"}</p>
                </div>
              </div>
              <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
                <p>
                  {zh
                    ? "Get8 Pro 团队由多位具有丰富加密货币从业经验的专业人士组成，包括曾在头部交易所工作的行业从业者、独立的 Web3 研究员，以及专注于加密货币领域的内容创作者。"
                    : "The Get8 Pro team consists of professionals with extensive crypto industry experience, including former employees of top exchanges, independent Web3 researchers, and content creators focused on the crypto space."}
                </p>
                <p>
                  {zh
                    ? "我们的团队成员平均拥有 4 年以上的加密货币交易经验，深度参与过 DeFi、NFT、Layer2 等多个 Web3 赛道，对各大交易所的产品特性、手续费结构、安全记录有深入了解。"
                    : "Our team members average 4+ years of crypto trading experience, with deep involvement in DeFi, NFT, Layer2, and other Web3 sectors. We have in-depth knowledge of major exchanges' product features, fee structures, and security records."}
                </p>
                <p>
                  {zh
                    ? "我们选择保持相对匿名，以确保评测的独立性不受个人品牌利益影响。我们的权威性来自于内容质量和数据准确性，而非个人知名度。"
                    : "We choose to remain relatively anonymous to ensure our reviews' independence is not influenced by personal brand interests. Our authority comes from content quality and data accuracy, not personal fame."}
                </p>
              </div>
            </div>
          </section>

          {/* ── 官方合作交易所 ── */}
          <section>
            <h2 className="text-2xl font-black text-white mb-2">{zh ? "官方合作交易所" : "Official Partner Exchanges"}</h2>
            <p className="text-slate-400 text-sm mb-6">
              {zh
                ? "以下交易所均为 Get8 Pro 的官方合作伙伴。所有返佣比例均来自官方合作协议，真实透明，每笔返佣均可在账户中追溯核查。"
                : "The following exchanges are all official partners of Get8 Pro. All rebate rates come from official partnership agreements — real, transparent, and traceable in your account."}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PARTNERSHIPS.map((p, i) => (
                <Link key={i} href={p.href} className="tap-target block">
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-white/20 transition">
                    <span className="text-2xl">{p.emoji}</span>
                    <div>
                      <div className="font-bold text-white">{p.name}</div>
                      <div className="text-xs text-slate-400">{zh ? p.desc.zh : p.desc.en}</div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* ── 发展历程 ── */}
          <section>
            <h2 className="text-2xl font-black text-white mb-6">{zh ? "发展历程" : "Our Journey"}</h2>
            <div className="space-y-4">
              {MILESTONES.map((m, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-black text-xs flex-shrink-0">
                      {m.year}
                    </div>
                    {i < MILESTONES.length - 1 && <div className="w-px flex-1 bg-white/10 mt-2" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-slate-300 text-sm leading-relaxed pt-2">{zh ? m.zh : m.en}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── 免责声明 ── */}
          <section>
            <h2 className="text-2xl font-black text-white mb-4">{zh ? "重要声明" : "Important Disclaimer"}</h2>
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-5 space-y-3 text-sm text-slate-300 leading-relaxed">
              <p>
                {zh
                  ? "⚠️ Get8 Pro 提供的所有内容仅供参考，不构成任何投资建议。加密货币市场风险极高，价格波动剧烈，您可能损失全部投入资金。"
                  : "⚠️ All content provided by Get8 Pro is for reference only and does not constitute investment advice. Cryptocurrency markets are extremely high-risk with severe price volatility — you may lose all invested funds."}
              </p>
              <p>
                {zh
                  ? "Get8 Pro 通过交易所官方合作伙伴计划获得返佣收益。这不影响我们评测的客观性，但您应了解我们与所评测的交易所存在商业合作关系。"
                  : "Get8 Pro earns rebate revenue through official exchange partner programs. This does not affect our review objectivity, but you should know we have commercial relationships with the exchanges we review."}
              </p>
              <p>
                {zh
                  ? "所有手续费率和返佣比例均以交易所官方公告为准，可能随时变化。请在注册前核实最新信息。"
                  : "All fee rates and rebate percentages are subject to official exchange announcements and may change at any time. Please verify the latest information before registering."}
              </p>
            </div>
          </section>

          {/* ── 联系我们 ── */}
          <section>
            <h2 className="text-2xl font-black text-white mb-6">{zh ? "联系我们" : "Contact Us"}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a href="mailto:contact@get8.pro"
                className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition">
                <Mail className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="font-semibold text-white text-sm">{zh ? "邮件联系" : "Email"}</div>
                  <div className="text-slate-400 text-xs">contact@get8.pro</div>
                </div>
              </a>
              <Link href="/contact" className="tap-target block">
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-white text-sm">{zh ? "在线联系表单" : "Online Contact Form"}</div>
                    <div className="text-slate-400 text-xs">{zh ? "提交返佣申请或咨询" : "Submit rebate application or inquiry"}</div>
                  </div>
                </div>
              </Link>
            </div>
          </section>

          {/* ── 底部导航 ── */}
          <div className="border-t border-white/10 pt-6">
            <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-400">
              <Link href="/exchanges" className="hover:text-white transition">{zh ? "交易所对比" : "Exchange Comparison"}</Link>
              <Link href="/crypto-saving" className="hover:text-white transition">{zh ? "返佣指南" : "Rebate Guide"}</Link>
              <Link href="/web3-guide" className="hover:text-white transition">{zh ? "Web3 教程" : "Web3 Guide"}</Link>
              <Link href="/legal" className="hover:text-white transition">{zh ? "法律声明" : "Legal"}</Link>
              <Link href="/contact" className="hover:text-white transition">{zh ? "联系我们" : "Contact"}</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
