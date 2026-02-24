import { useState, useEffect, useRef } from "react";

// ─── 自定义 Hook：进入视口时触发动画 ───────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── 数字递增动画 ──────────────────────────────────────────────────────────
function CountUp({ end, suffix = "", duration = 1800 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView();
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── 淡入上移动画包装器 ────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── OKX 风格几何 X 动画背景 ──────────────────────────────────────────────
function HeroGeometry() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ animation: "spin-slow 20s linear infinite" }}
      >
        <svg width="520" height="520" viewBox="0 0 520 520" fill="none" opacity="0.07">
          <rect x="220" y="0" width="80" height="520" rx="8" fill="white" transform="rotate(45 260 260)" />
          <rect x="220" y="0" width="80" height="520" rx="8" fill="white" transform="rotate(-45 260 260)" />
        </svg>
      </div>
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(201,242,49,0.06) 0%, transparent 70%)", animation: "float 6s ease-in-out infinite" }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(201,242,49,0.04) 0%, transparent 70%)", animation: "float 8s ease-in-out infinite reverse" }} />
    </div>
  );
}

// ─── 数据 ──────────────────────────────────────────────────────────────────
const advantages = [
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18" stroke="#C9F231" strokeWidth="1.5" />
        <path d="M20 10v4M20 26v4M10 20h4M26 20h4" stroke="#C9F231" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="20" cy="20" r="5" stroke="#C9F231" strokeWidth="1.5" />
      </svg>
    ),
    title: "高额的佣金奖励机制",
    desc: "返佣比例高达 50%，不限新老用户，支持节点叠加，享受更高总返佣。",
    link: "查看规则",
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="4" y="8" width="32" height="24" rx="3" stroke="#C9F231" strokeWidth="1.5" />
        <path d="M4 14h32M14 14v18" stroke="#C9F231" strokeWidth="1.5" />
        <circle cx="9" cy="11" r="1.5" fill="#C9F231" />
        <circle cx="14" cy="11" r="1.5" fill="#C9F231" />
      </svg>
    ),
    title: "专属 API 集成",
    desc: "经纪商专属 API 功能为您的业务拓展提供更多便利，平均延迟低至 3ms。",
    link: "查看文档",
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M20 4L6 10v10c0 8.28 5.92 16.02 14 18 8.08-1.98 14-9.72 14-18V10L20 4z" stroke="#C9F231" strokeWidth="1.5" />
        <path d="M14 20l4 4 8-8" stroke="#C9F231" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "更安全的用户接入方案",
    desc: "Fast API + 第三方 IP 白名单，更便捷的 API 接入方式，安全可靠的平台绑定方案。",
    link: "查看文档",
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="16" stroke="#C9F231" strokeWidth="1.5" />
        <path d="M20 12v8l5 3" stroke="#C9F231" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 20h4M28 20h4M20 8v4M20 28v4" stroke="#C9F231" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      </svg>
    ),
    title: "灵活的佣金管理机制",
    desc: "联合经纪商，灵活分配佣金比例，二级渠道返佣，更方便的佣金管理方案。",
    link: "查看文档",
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M20 6a14 14 0 100 28A14 14 0 0020 6z" stroke="#C9F231" strokeWidth="1.5" />
        <path d="M20 14v6l4 4" stroke="#C9F231" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 20h2M30 20h2M20 8v2M20 30v2" stroke="#C9F231" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
    title: "24/7 专属技术支持",
    desc: "欧易为经纪商客户提供全天候专属技术支持，提供定制化的解决方案。",
    link: "联系我们",
  },
];

const brokerTypes = [
  {
    type: "API 经纪商",
    desc: "集成 API 促成经纪商平台与用户之间更加高效的对接，提供丰富的经纪商功能",
    tags: ["聚合交易平台", "资产管理平台", "量化交易平台", "交易策略提供方"],
    cta: "查看文档",
    ctaSecondary: "立即申请",
  },
  {
    type: "OAuth 经纪商",
    desc: "OAuth 模式一键授权登录，构建与用户更安全、更便捷的对接方式",
    tags: ["交易所", "交易机器人", "跟单平台", "聚合交易平台"],
    cta: "查看文档",
    ctaSecondary: "立即申请",
  },
];

const partners = [
  { name: "CoinTech2u", type: "API", desc: "全球最先进、最智能的交易系统之一，由著名区块链工程师和金融交易员开发，提供独家 AI 策略。", tags: ["衍生品"] },
  { name: "AICoin", type: "API/OAuth", desc: "世界领先的数据市场工具，为您提供流畅且全面的 K 线数据，全方位支持您的大单交易、价格预警、云利策略和自研交易。", tags: ["现货", "衍生品"] },
  { name: "BitFrog", type: "OAuth", desc: "集交易、自动化跟单、实盘记账、行情预警于一体的社交交易平台。", tags: ["现货", "衍生品"] },
  { name: "3Commas", type: "API", desc: "全球领先的加密货币自动化交易机器人平台，支持多交易所策略管理。", tags: ["现货", "衍生品"] },
];

const updates = [
  { title: "联合经纪商：更高效的佣金管理模式", desc: "「联合经纪商」为经纪商渠道提供了更多的自由度及管理模式方案，帮助其业务更好地进行拓展", date: "2023/07/28" },
  { title: "Fast API 上线", desc: "为 API key 绑定过程提供额外的安全保障，简化您的经纪商关联流程", date: "2023/01/05" },
  { title: "第三方 App IP 白名单上线", desc: "支持客户的 API key 绑定经纪商设置的服务器 IP，降低您的使用风险", date: "2023/01/05" },
];

const faqs = [
  { q: "经纪商平台可以支持什么功能？", a: "经纪商平台支持 API 接入与 OAuth 授权两种模式，提供高额返佣、专属 API、IP 白名单、联合经纪商等功能，全面满足聚合平台、量化工具、跟单平台等多种业务场景。" },
  { q: "目前节点业务中的 API 类型客户能不能申请？", a: "可以。现有节点业务的 API 类型客户可以申请升级为经纪商，享受更高的返佣比例和更丰富的功能支持，具体请联系商务团队确认资质。" },
  { q: "经纪商平台是否区分新老用户？", a: "不区分。无论被邀请用户是新注册还是已有账户，只要通过经纪商渠道绑定，其后续交易均可计入返佣，最大化您的收益来源。" },
];

// ─── 主组件 ────────────────────────────────────────────────────────────────
export default function BrokerProgram() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", type: "", telegram: "" });
  const [submitted, setSubmitted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setSubmitted(true); };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* ── 顶部导航栏 ─────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 transition-all duration-300"
        style={{ background: scrolled ? "rgba(0,0,0,0.9)" : "transparent", backdropFilter: scrolled ? "blur(12px)" : "none", borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "none" }}
      >
        <div className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M4 4l20 20M24 4L4 24" stroke="#C9F231" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="font-bold text-lg tracking-tight">经纪商计划</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          <a href="#types" className="hover:text-white transition-colors">经纪商类型</a>
          <a href="#advantages" className="hover:text-white transition-colors">核心优势</a>
          <a href="#partners" className="hover:text-white transition-colors">合作伙伴</a>
          <a href="#faq" className="hover:text-white transition-colors">常见问题</a>
        </div>
        <a href="#apply" className="bg-[#C9F231] hover:bg-[#d4f54a] text-black text-sm font-bold px-5 py-2 rounded-full transition-all duration-200">
          立即申请
        </a>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden bg-black">
        <HeroGeometry />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div
            className="inline-flex items-center gap-2 border border-white/15 rounded-full px-4 py-1.5 text-xs text-gray-400 mb-8"
            style={{ animation: "fade-in 0.8s ease forwards" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9F231]" style={{ animation: "pulse 2s infinite" }} />
            全球顶级加密货币经纪商合作平台
          </div>
          <h1
            className="text-5xl md:text-7xl font-bold leading-tight mb-6 tracking-tight"
            style={{ animation: "fade-up 0.9s ease 0.1s both" }}
          >
            经纪商计划
          </h1>
          <p
            className="text-gray-400 text-lg md:text-xl mb-4 tracking-wide"
            style={{ animation: "fade-up 0.9s ease 0.2s both" }}
          >
            一流市场深度 &nbsp;·&nbsp; 灵活费率加点 &nbsp;·&nbsp; 高额返佣比例
          </p>
          <div
            className="flex flex-wrap gap-4 justify-center mt-10"
            style={{ animation: "fade-up 0.9s ease 0.35s both" }}
          >
            <a href="#types" className="border border-white/25 hover:border-white/50 text-white px-8 py-3.5 rounded-full text-sm font-medium transition-all duration-200 hover:bg-white/5">
              查看规则
            </a>
            <a href="#apply" className="bg-[#C9F231] hover:bg-[#d4f54a] text-black px-8 py-3.5 rounded-full text-sm font-bold transition-all duration-200 shadow-lg shadow-[#C9F231]/20 hover:shadow-[#C9F231]/40 hover:scale-105">
              立即申请
            </a>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40" style={{ animation: "bounce 2s infinite" }}>
          <span className="text-xs text-gray-500">向下滚动</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M4 9l4 4 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </section>

      {/* ── 数据统计 ───────────────────────────────────────────────────── */}
      <section className="bg-[#0a0a0a] border-y border-white/5 py-14 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { end: 180, suffix: "亿+", label: "24H 交易量（美元）" },
            { end: 1400, suffix: "万+", label: "全球注册用户" },
            { end: 50, suffix: "%", label: "最高返佣比例" },
            { end: 3, suffix: "ms", label: "平均 API 延迟" },
          ].map((s, i) => (
            <FadeUp key={s.label} delay={i * 100}>
              <div className="text-3xl md:text-4xl font-bold text-[#C9F231]">
                <CountUp end={s.end} suffix={s.suffix} />
              </div>
              <div className="text-gray-500 text-sm mt-1">{s.label}</div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── 经纪商类型 ─────────────────────────────────────────────────── */}
      <section id="types" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <FadeUp>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-3">选择您的经纪商类型</h2>
              <p className="text-gray-500">两种接入方式，满足不同平台需求</p>
            </div>
          </FadeUp>
          <div className="grid md:grid-cols-2 gap-6">
            {brokerTypes.map((bt, i) => (
              <FadeUp key={bt.type} delay={i * 120}>
                <div className="border border-gray-200 rounded-2xl p-8 hover:border-black/30 hover:shadow-xl transition-all duration-300 group bg-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 2l10 10M12 2L2 12" stroke="#C9F231" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-black">{bt.type}</h3>
                  </div>
                  <p className="text-gray-500 text-sm mb-6 leading-relaxed">{bt.desc}</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {bt.tags.map((tag) => (
                      <span key={tag} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#C9F231" strokeWidth="1.5" /><path d="M4 6l1.5 1.5L8 4" stroke="#C9F231" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <a href="#apply" className="text-sm text-gray-500 hover:text-black border border-gray-200 hover:border-black px-4 py-2 rounded-full transition-all duration-200">{bt.cta}</a>
                    <a href="#apply" className="text-sm font-bold text-black bg-[#C9F231] hover:bg-[#d4f54a] px-5 py-2 rounded-full transition-all duration-200">{bt.ctaSecondary}</a>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── 核心优势 ───────────────────────────────────────────────────── */}
      <section id="advantages" className="py-24 px-6 bg-black">
        <div className="max-w-6xl mx-auto">
          <FadeUp>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">为什么选择我们</h2>
              <p className="text-gray-500">全方位的支持体系，助力您的经纪商业务快速成长</p>
            </div>
          </FadeUp>
          <div className="grid md:grid-cols-5 gap-5">
            {advantages.map((a, i) => (
              <FadeUp key={a.title} delay={i * 80}>
                <div className="bg-[#0d0d0d] border border-white/5 rounded-2xl p-6 hover:border-[#C9F231]/20 hover:-translate-y-1 transition-all duration-300 group h-full flex flex-col">
                  <div className="mb-4 group-hover:scale-110 transition-transform duration-300">{a.icon}</div>
                  <h3 className="font-bold text-sm mb-2 leading-snug">{a.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed flex-1">{a.desc}</p>
                  <a href="#apply" className="mt-4 text-xs text-[#C9F231] hover:underline flex items-center gap-1 group-hover:gap-2 transition-all duration-200">
                    {a.link}
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5h6M5 2l3 3-3 3" stroke="#C9F231" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </a>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── 合作伙伴 ───────────────────────────────────────────────────── */}
      <section id="partners" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <FadeUp>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-3">合作伙伴</h2>
              <p className="text-gray-500">来自全球的优质经纪商合作伙伴</p>
            </div>
          </FadeUp>
          <FadeUp delay={100}>
            <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0">
                {partners.map((p, i) => (
                  <div
                    key={p.name}
                    className={`p-8 transition-all duration-300 hover:bg-gray-50 ${i % 2 === 0 ? "border-r border-gray-100" : ""} ${i < 2 ? "border-b border-gray-100" : ""}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M2 2l12 12M14 2L2 14" stroke="#C9F231" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-black">{p.name}</span>
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{p.type}</span>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed mb-3">{p.desc}</p>
                        <div className="flex gap-2">
                          {p.tags.map((tag) => (
                            <span key={tag} className="flex items-center gap-1 text-xs text-gray-400">
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="#C9F231" strokeWidth="1.2" /><path d="M3 5l1.5 1.5L7 3.5" stroke="#C9F231" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── 最新动态 ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto">
          <FadeUp>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">最新动态</h2>
              <p className="text-gray-500">持续迭代，为您提供更好的经纪商体验</p>
            </div>
          </FadeUp>
          <div className="grid md:grid-cols-3 gap-6">
            {updates.map((u, i) => (
              <FadeUp key={u.title} delay={i * 100}>
                <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden hover:border-white/15 hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
                  <div className="h-40 bg-[#0d0d0d] flex items-center justify-center border-b border-white/5 relative overflow-hidden">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                      <rect x="10" y="10" width="60" height="60" rx="8" stroke="white" strokeWidth="1.5" />
                      <path d="M20 20l40 40M60 20L20 60" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0" style={{ background: "radial-gradient(circle at center, rgba(201,242,49,0.05) 0%, transparent 70%)" }} />
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-sm mb-2 leading-snug group-hover:text-[#C9F231] transition-colors duration-200">{u.title}</h3>
                    <p className="text-gray-500 text-xs leading-relaxed mb-4">{u.desc}</p>
                    <span className="text-xs text-gray-600">{u.date}</span>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
          <FadeUp delay={300}>
            <div className="text-center mt-10">
              <a href="#" className="border border-white/15 hover:border-white/30 text-sm text-gray-400 hover:text-white px-6 py-2.5 rounded-full transition-all duration-200">
                查看更多
              </a>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <FadeUp>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-3">常见问题</h2>
            </div>
          </FadeUp>
          <div className="divide-y divide-gray-100">
            {faqs.map((faq, i) => (
              <FadeUp key={i} delay={i * 80}>
                <div>
                  <button
                    className="w-full text-left py-5 flex justify-between items-center text-black hover:text-gray-600 transition-colors duration-200"
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  >
                    <span className="font-medium pr-6 text-sm md:text-base">{faq.q}</span>
                    <span className={`text-2xl font-light flex-shrink-0 transition-transform duration-300 ${activeFaq === i ? "rotate-45" : ""}`}>+</span>
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{ maxHeight: activeFaq === i ? "200px" : "0", opacity: activeFaq === i ? 1 : 0 }}
                  >
                    <p className="text-gray-500 text-sm leading-relaxed pb-5">{faq.a}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── 申请表单 ───────────────────────────────────────────────────── */}
      <section id="apply" className="py-24 px-6 bg-black relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-[#C9F231]/10 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(201,242,49,0.04) 0%, transparent 70%)" }} />
        </div>
        <div className="max-w-lg mx-auto relative z-10">
          <FadeUp>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">立即申请成为经纪商</h2>
              <p className="text-gray-500 text-sm">商务团队将在 1-3 个工作日内与您联系</p>
            </div>
          </FadeUp>
          <FadeUp delay={100}>
            {submitted ? (
              <div className="border border-[#C9F231]/20 rounded-2xl p-12 text-center bg-[#0d0d0d]">
                <div className="w-16 h-16 rounded-full bg-[#C9F231]/10 flex items-center justify-center mx-auto mb-4">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M6 14l5 5 11-11" stroke="#C9F231" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-2">申请已提交！</h3>
                <p className="text-gray-500 text-sm">我们的商务团队将在 1-3 个工作日内通过邮件或 Telegram 与您联系。</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  { label: "姓名", key: "name", type: "text", placeholder: "请输入您的姓名", required: true },
                  { label: "邮箱", key: "email", type: "email", placeholder: "请输入您的邮箱", required: true },
                  { label: "Telegram 账号", key: "telegram", type: "text", placeholder: "请输入您的 Telegram 账号（选填）", required: false },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs text-gray-500 mb-1.5">{field.label}{field.required && " *"}</label>
                    <input
                      type={field.type}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={(form as any)[field.key]}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-[#C9F231]/40 transition-colors duration-200"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">身份类型 *</label>
                  <select
                    required
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C9F231]/40 transition-colors duration-200"
                    style={{ color: form.type ? "white" : "#555" }}
                  >
                    <option value="" disabled>请选择您的身份</option>
                    <option value="kol">KOL / 博主 / 内容创作者</option>
                    <option value="community">社区运营者</option>
                    <option value="platform">量化/聚合/跟单平台</option>
                    <option value="media">媒体平台</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#C9F231] hover:bg-[#d4f54a] text-black font-bold py-4 rounded-full transition-all duration-200 shadow-lg shadow-[#C9F231]/20 hover:shadow-[#C9F231]/40 hover:scale-[1.02] text-sm mt-2"
                >
                  立即申请
                </button>
                <p className="text-center text-xs text-gray-700">提交即表示您同意我们的服务条款与隐私政策</p>
              </form>
            )}
          </FadeUp>
        </div>
      </section>

      {/* ── 底部 ───────────────────────────────────────────────────────── */}
      <footer className="bg-black border-t border-white/5 py-8 px-6 text-center">
        <p className="text-gray-600 text-xs">
          如有疑问，请联系我们的商务团队：
          <a href="https://t.me/gatetoweb3" className="text-[#C9F231] hover:underline ml-1">@gatetoweb3</a>
        </p>
      </footer>

      {/* ── 全局动画样式 ────────────────────────────────────────────────── */}
      <style>{`
        @keyframes spin-slow { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-up { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(8px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
