import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

const DEMOS = {
  zh: [
    {
      id: "signal",
      badge: "方向 A",
      name: "Signal Deck",
      title: "更像专业交易工作台",
      summary: "把入口压缩成信号面板、决策卡片和重点数据，减少“营销页感”，更偏工具站。",
      accent: "from-cyan-400/30 to-blue-500/10",
      border: "border-cyan-400/30",
      glow: "shadow-cyan-950/40",
      chips: ["快速分流", "数据优先", "更像终端"],
    },
    {
      id: "atlas",
      badge: "方向 B",
      name: "Atlas Editorial",
      title: "更像研究型导航站",
      summary: "强化文章感、来源感和可信度，适合把交易所、KYC、文章和快讯都做得更像研究资料库。",
      accent: "from-emerald-400/25 to-teal-500/10",
      border: "border-emerald-400/25",
      glow: "shadow-emerald-950/30",
      chips: ["可信度强", "阅读体验稳", "适合 SEO / GEO"],
    },
    {
      id: "orbit",
      badge: "方向 C",
      name: "Orbit Flow",
      title: "更像分人群的产品化入口",
      summary: "突出新手、交易者、老用户三条路径，让高意图用户一眼知道该去哪里。",
      accent: "from-amber-400/30 to-yellow-500/10",
      border: "border-amber-400/30",
      glow: "shadow-amber-950/40",
      chips: ["转化更直接", "路径更清晰", "移动端更友好"],
    },
  ],
  en: [
    {
      id: "signal",
      badge: "Option A",
      name: "Signal Deck",
      title: "Feels more like a professional trading desk",
      summary: "Compress the top area into signal cards, decision panels, and priority data blocks so it feels less like a landing page and more like a tool.",
      accent: "from-cyan-400/30 to-blue-500/10",
      border: "border-cyan-400/30",
      glow: "shadow-cyan-950/40",
      chips: ["Fast routing", "Data first", "Tool-like"],
    },
    {
      id: "atlas",
      badge: "Option B",
      name: "Atlas Editorial",
      title: "Feels more like a research navigation site",
      summary: "Push trust, sourcing, and editorial structure forward so exchanges, KYC, articles, and news all feel like a curated research library.",
      accent: "from-emerald-400/25 to-teal-500/10",
      border: "border-emerald-400/25",
      glow: "shadow-emerald-950/30",
      chips: ["Trust-first", "Calmer reading", "Good for SEO / GEO"],
    },
    {
      id: "orbit",
      badge: "Option C",
      name: "Orbit Flow",
      title: "Feels more like a product with user-specific paths",
      summary: "Make beginner, trader, and existing-user routes obvious so high-intent visitors know where to go immediately.",
      accent: "from-amber-400/30 to-yellow-500/10",
      border: "border-amber-400/30",
      glow: "shadow-amber-950/40",
      chips: ["More direct conversion", "Clearer paths", "Better on mobile"],
    },
  ],
} as const;

function DemoShell({
  title,
  subtitle,
  accent,
  border,
  glow,
  eyebrow,
  children,
}: {
  title: string;
  subtitle: string;
  accent: string;
  border: string;
  glow: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`overflow-hidden rounded-[28px] border bg-[#07111f]/85 ${border} ${glow} shadow-2xl backdrop-blur-xl`}
    >
      <div className={`border-b border-white/6 bg-gradient-to-r ${accent} px-6 py-6`}>
        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-300">{eyebrow}</p>
        <h2 className="text-2xl font-black text-white sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">{subtitle}</p>
      </div>
      <div className="p-6 sm:p-8">{children}</div>
    </section>
  );
}

export default function UiDemos() {
  const { language } = useLanguage();
  const zh = language === "zh";
  const demos = DEMOS[zh ? "zh" : "en"];

  return (
    <div className="min-h-screen bg-[#050D1A] text-white">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(251,191,36,0.12),transparent_26%),linear-gradient(180deg,#050D1A_0%,#07111f_100%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
              {zh ? "UI 方向预览" : "UI Direction Preview"}
            </p>
            <h1 className="text-3xl font-black text-white sm:text-5xl">
              {zh ? "给 Get8 Pro 的 3 套界面提案" : "3 interface directions for Get8 Pro"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
              {zh
                ? "这页不会改动你正式线上结构，只是把更成熟的风格方向先做成可看的 demo。你挑中其中一套后，我们再把它落到首页、返佣页和导览页。"
                : "This page does not replace the live interface yet. It shows three more mature directions first, then we can roll your chosen one into the homepage, cost guide, and guide pages."}
            </p>
          </div>
          <Link
            href="/"
            className="tap-target inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/30 hover:text-white"
          >
            {zh ? "返回主页" : "Back to portal"}
          </Link>
        </div>

        <div className="mb-10 grid gap-4 md:grid-cols-3">
          {demos.map((demo) => (
            <div key={demo.id} className={`rounded-3xl border bg-white/[0.03] p-5 ${demo.border}`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className={`rounded-full bg-gradient-to-r px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white ${demo.accent}`}>
                  {demo.badge}
                </span>
                <span className="text-xs font-semibold text-slate-500">{demo.name}</span>
              </div>
              <h2 className="mb-2 text-lg font-black text-white">{demo.title}</h2>
              <p className="mb-4 text-sm leading-7 text-slate-400">{demo.summary}</p>
              <div className="flex flex-wrap gap-2">
                {demo.chips.map((chip) => (
                  <span key={chip} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-8">
          <DemoShell
            eyebrow="Signal Deck"
            title={zh ? "A. 信号面板式首页" : "A. Signal-panel homepage"}
            subtitle={
              zh
                ? "保留深色 Web3 气质，但把首页顶部改成更强的决策面板。用户一进来先看路径、费用、可信度，再往下看具体内容。"
                : "Keep the dark Web3 mood, but make the hero feel like a decision console. Visitors see path, cost, and trust cues before the long content starts."
            }
            accent="from-cyan-400/20 to-blue-500/10"
            border="border-cyan-400/25"
            glow="shadow-cyan-950/30"
          >
            <div className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr]">
              <div className="rounded-3xl border border-cyan-400/15 bg-[#081423] p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">{zh ? "今日入口" : "Primary entry"}</p>
                    <h3 className="mt-2 text-2xl font-black text-white">{zh ? "先按你当前身份进入" : "Start from your current user state"}</h3>
                  </div>
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-right">
                    <p className="text-[11px] text-cyan-200">{zh ? "默认返佣" : "Default rebate"}</p>
                    <p className="text-2xl font-black text-white">20%</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    zh ? "我是新用户" : "New user",
                    zh ? "我已在交易" : "Active trader",
                    zh ? "我是老账户" : "Existing account",
                  ].map((label, index) => (
                    <div key={label} className={`rounded-2xl border p-4 ${index === 1 ? "border-cyan-400/30 bg-cyan-500/10" : "border-white/8 bg-white/[0.03]"}`}>
                      <p className="text-sm font-black text-white">{label}</p>
                      <p className="mt-2 text-xs leading-6 text-slate-400">
                        {zh ? "进来就给明确下一步，不先堆很长解释。" : "Show the next move immediately instead of long copy first."}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{zh ? "可信度模块" : "Trust layer"}</p>
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl border border-white/8 bg-[#091729] p-4 text-sm text-slate-200">{zh ? "作者 / 审核 / 更新时间" : "Author / Review / Updated"}</div>
                    <div className="rounded-2xl border border-white/8 bg-[#091729] p-4 text-sm text-slate-200">{zh ? "来源与披露放到页脚统一看" : "Sources and disclosures grouped near footer"}</div>
                  </div>
                </div>
                <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">{zh ? "适合页面" : "Best fit"}</p>
                  <p className="mt-3 text-sm leading-7 text-amber-50">
                    {zh ? "首页、返佣页、交易所详情页。" : "Homepage, cost guide, and exchange detail pages."}
                  </p>
                </div>
              </div>
            </div>
          </DemoShell>

          <DemoShell
            eyebrow="Atlas Editorial"
            title={zh ? "B. 研究型内容首页" : "B. Research-style content homepage"}
            subtitle={
              zh
                ? "把专业感和可信度往前提，但不做得像传统媒体。更适合你想强化 SEO、GEO 和 AI 可信判断。"
                : "Push professional tone and trust signals forward without turning the site into a traditional media layout. This direction is strongest for SEO, GEO, and AI trust judgments."
            }
            accent="from-emerald-400/15 to-teal-500/10"
            border="border-emerald-400/25"
            glow="shadow-emerald-950/25"
          >
            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">{zh ? "编辑层级" : "Editorial layer"}</p>
                <h3 className="mt-3 text-2xl font-black text-white">{zh ? "先给结论，再给证据，再给入口" : "Conclusion first, evidence second, action third"}</h3>
                <div className="mt-5 space-y-3">
                  {[
                    zh ? "顶部先写清：新用户默认 20%，老账户通常不能补绑。" : "Top line clearly states: new users default to 20%, existing accounts usually cannot be retrofitted.",
                    zh ? "中间再给交易所、KYC、文章与工具入口。" : "Then show routes into exchanges, KYC, articles, and tools.",
                    zh ? "最后统一放来源、审核、披露和更新时间。" : "Finish with source notes, review info, disclosure, and update time.",
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/8 bg-[#091729] px-4 py-3 text-sm leading-7 text-slate-300">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-emerald-400/15 bg-[#081423] p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">{zh ? "页面样式" : "Page style"}</p>
                    <h3 className="mt-2 text-2xl font-black text-white">{zh ? "更克制的标题，更强的结构感" : "More restraint in headlines, stronger structure"}</h3>
                  </div>
                  <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-200">
                    {zh ? "推荐用于整站" : "Best site-wide fit"}
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <p className="text-xs text-slate-500">{zh ? "栏目页" : "Section page"}</p>
                    <p className="mt-2 text-lg font-black text-white">{zh ? "交易所信息与路径" : "Exchange information & paths"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <p className="text-xs text-slate-500">{zh ? "说明页" : "Reference page"}</p>
                    <p className="mt-2 text-lg font-black text-white">{zh ? "KYC / 费用 / 限制" : "KYC / fees / restrictions"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 md:col-span-2">
                    <p className="text-xs text-slate-500">{zh ? "视觉关键词" : "Visual keywords"}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      {zh ? "深海蓝、青绿色点亮、细网格背景、窄而稳的标题、更多留白。" : "Deep navy, teal highlights, subtle grid texture, tighter headings, and more negative space."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </DemoShell>

          <DemoShell
            eyebrow="Orbit Flow"
            title={zh ? "C. 高意图转化入口" : "C. High-intent conversion flow"}
            subtitle={
              zh
                ? "如果你更重视留存和转化，可以把首页做得像产品导航，而不是信息长页。"
                : "If retention and conversion matter most, the homepage can behave more like a product router than a long information page."
            }
            accent="from-amber-400/15 to-yellow-500/10"
            border="border-amber-400/25"
            glow="shadow-amber-950/30"
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-3xl border border-white/8 bg-[#081423] p-6">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">{zh ? "入口设计" : "Entry design"}</p>
                <div className="mt-5 space-y-3">
                  {[
                    zh ? "新手：先测评，再学 Web3，再做 KYC。" : "Beginner: quiz first, then Web3 basics, then KYC.",
                    zh ? "交易者：先看默认 20%，再看五家下载入口。" : "Trader: see the default 20% first, then jump to the five exchange routes.",
                    zh ? "老用户：直接落到限制说明和联系方案。" : "Existing user: land directly on the limit explanation and contact path.",
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-amber-400/15 bg-amber-500/10 px-4 py-4 text-sm leading-7 text-amber-50">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{zh ? "移动端重点" : "Mobile emphasis"}</p>
                <h3 className="mt-3 text-2xl font-black text-white">{zh ? "更短的首屏，更稳的点按" : "Shorter first screen, steadier taps"}</h3>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-[#091729] p-4 text-sm leading-7 text-slate-300">
                    {zh ? "首屏只留最重要的 3 个入口和一个可信提示。" : "Keep only the top 3 actions and one trust cue above the fold."}
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-[#091729] p-4 text-sm leading-7 text-slate-300">
                    {zh ? "所有说明性大卡片都沉到页脚或二屏。" : "Move large explanatory trust cards to the footer or lower sections."}
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-[#091729] p-4 text-sm leading-7 text-slate-300 sm:col-span-2">
                    {zh ? "你后续对客户说“进页面先点哪一块”会更容易，因为每类人只有一条主路。" : "This makes it easier to tell users exactly where to tap, because each visitor type gets one obvious main route."}
                  </div>
                </div>
              </div>
            </div>
          </DemoShell>
        </div>
      </div>
    </div>
  );
}
