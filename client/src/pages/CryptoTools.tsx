import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, ExternalLink, Twitter, Youtube, Send, Calculator, Shield, Globe, Wifi, WifiOff } from "lucide-react";
import { goBack } from "@/hooks/useScrollMemory";
import { trpc } from "@/lib/trpc";

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

const DIRECT_TOOL_HINTS = ["aicoin", "jin10", "blockbeats", "oklink", "feixiaohao", "tokeninsight", "rootdata", "sosovalue"] as const;

function resolveToolNeedVpn(tool: {
  name: string;
  nameEn: string;
  source: string;
  url: string;
  needVpn?: boolean | null;
}) {
  if (typeof tool.needVpn === "boolean") return tool.needVpn;

  const haystack = [tool.name, tool.nameEn, tool.source, tool.url]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return !DIRECT_TOOL_HINTS.some((hint) => haystack.includes(hint));
}

// ─── 辅助组件 ─────────────────────────────────────────────────────────────────

function SocialBar({ zh }: { zh: boolean }) {
  const socials = [
    { icon: <Twitter size={18} />, label: "Twitter", url: "https://twitter.com", color: "hover:text-sky-400" },
    { icon: <Send size={18} />, label: "Telegram", url: "https://t.me", color: "hover:text-blue-400" },
    { icon: <Youtube size={18} />, label: "YouTube", url: "https://youtube.com", color: "hover:text-red-500" },
  ];
  return (
    <div className="flex justify-center gap-6 mb-10">
      {socials.map(s => (
        <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className={`flex flex-col items-center gap-1.5 text-slate-500 transition-colors ${s.color}`}>
          <div className="w-10 h-10 rounded-full bg-slate-800/40 border border-slate-700/60 flex items-center justify-center">
            {s.icon}
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider">{s.label}</span>
        </a>
      ))}
    </div>
  );
}

function GoogleAuthCard({ zh }: { zh: boolean }) {
  return (
    <div className="mb-10 p-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 flex flex-col sm:flex-row items-center gap-5">
      <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-3xl flex-shrink-0">
        🛡️
      </div>
      <div className="flex-1 text-center sm:text-left">
        <h3 className="text-lg font-bold text-white mb-1">
          {zh ? "强烈建议：开启 Google 验证器" : "Strongly Recommended: Enable Google Authenticator"}
        </h3>
        <p className="text-slate-400 text-sm leading-relaxed">
          {zh
            ? "为了您的资金安全，请务必在所有交易所开启 2FA 双重验证。Google Authenticator 是最安全、最通用的选择。"
            : "For your fund safety, please enable 2FA on all exchanges. Google Authenticator is the most secure and universal choice."}
        </p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <a href="https://apps.apple.com/app/google-authenticator/id388497605" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold hover:bg-slate-700 transition-colors">iOS</a>
        <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold hover:bg-slate-700 transition-colors">Android</a>
      </div>
    </div>
  );
}

function FeeCalculator({ zh }: { zh: boolean }) {
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("0.1");
  const fee = useMemo(() => {
    const a = parseFloat(amount) || 0;
    const r = parseFloat(rate) || 0;
    return (a * (r / 100)).toFixed(4);
  }, [amount, rate]);

  return (
    <div className="mb-12 p-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5">
      <div className="flex items-center gap-2 mb-5">
        <Calculator className="text-yellow-400" size={20} />
        <h3 className="text-lg font-bold text-white">{zh ? "交易手续费计算器" : "Trading Fee Calculator"}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">{zh ? "交易金额 (USDT)" : "Trade Amount (USDT)"}</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="1000"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-white focus:outline-none focus:border-yellow-500/50"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">{zh ? "费率 (%)" : "Fee Rate (%)"}</label>
          <select
            value={rate}
            onChange={e => setRate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-white focus:outline-none focus:border-yellow-500/50"
          >
            <option value="0.1">0.1% (标准)</option>
            <option value="0.08">0.08% (OKX Maker)</option>
            <option value="0.06">0.06% (VIP1)</option>
            <option value="0.04">0.04% (合约 Maker)</option>
            <option value="0.02">0.02% (Bitget Maker)</option>
          </select>
        </div>
        <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
          <div className="text-[10px] text-yellow-500/70 uppercase font-bold tracking-wider mb-0.5">{zh ? "预估手续费" : "Est. Fee"}</div>
          <div className="text-xl font-black text-yellow-400">{fee} <span className="text-xs">USDT</span></div>
        </div>
      </div>
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

  // 从数据库加载真实工具数据
  const { data: dbTools = [], isLoading } = trpc.tools.list.useQuery();

  const filtered = useMemo(() => {
    return dbTools.filter(t => {
      // 后端 list 接口已经过滤了 isActive: true，这里作为双重保险
      if (t.isActive === false) return false;
      
      const matchCat = activeCategory === "all" || t.category === activeCategory;
      
      const toolNeedVpn = resolveToolNeedVpn(t as typeof t & { needVpn?: boolean | null });
      const matchVpn =
        vpnFilter === "all" ? true :
        vpnFilter === "no-vpn" ? !toolNeedVpn :
        toolNeedVpn;
        
      const q = search.toLowerCase();
      const matchSearch = !q
        || (zh ? t.name : t.nameEn).toLowerCase().includes(q)
        || (zh ? t.description : t.descriptionEn).toLowerCase().includes(q)
        || t.source.toLowerCase().includes(q)
        || (t.tags || "").toLowerCase().includes(q);
      return matchCat && matchVpn && matchSearch;
    });
  }, [dbTools, activeCategory, search, vpnFilter, zh]);

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
            { key: "no-vpn", icon: <Wifi size={13} />,    zh: "🟢 直连",   en: "🟢 Direct" },
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
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-700/50" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
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
              const toolNeedVpn = resolveToolNeedVpn(tool as typeof tool & { needVpn?: boolean | null });
              
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
                          {toolNeedVpn ? (
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
            ? `共收录 ${dbTools.length} 个工具，当前显示 ${filtered.length} 个`
            : `${dbTools.length} tools total, showing ${filtered.length}`}
        </div>
      </div>
    </div>
  );
}
