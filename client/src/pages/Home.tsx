/**
 * Home.tsx — /crypto-saving
 * 币圈省钱指南：自然阅读顺序返佣科普长页面
 * 章节顺序：Hero → 什么是返佣 → 返佣来源 → 机制揭秘 → 安全合规 → 实战案例（含计算器）→ 全场景覆盖 → 新老用户如何获得 → 总结与行动
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'wouter';
import { WelcomeGuide } from '@/components/WelcomeGuide';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/i18n';
import { useExchangeLinks } from '@/contexts/ExchangeLinksContext';
import {
  TrendingUp, Shield, CheckCircle2, Users, Gift, Zap,
  ChevronDown, BookOpen, Calculator, ChevronRight,
  Lock, Globe, AlertTriangle, ExternalLink, Menu, X, MessageSquare,
} from 'lucide-react';
import { useScrollMemory } from '@/hooks/useScrollMemory';
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { TrustSignalsCard } from "@/components/TrustSignalsCard";
import { TRUST_LAST_REVIEWED } from "@/lib/trust";

// ─── 交易所 emoji 映射 ────────────────────────────────────────────────────────
const EXCHANGE_META: Record<string, { emoji: string; color: string }> = {
  gate:    { emoji: '🟢', color: 'from-emerald-900 to-gray-900' },
  okx:     { emoji: '🔷', color: 'from-gray-800 to-gray-900' },
  binance: { emoji: '🟡', color: 'from-yellow-900 to-gray-900' },
  bybit:   { emoji: '🔵', color: 'from-orange-900 to-gray-900' },
  bitget:  { emoji: '🟣', color: 'from-teal-900 to-gray-900' },
};

// ─── 章节定义 ─────────────────────────────────────────────────────────────────
const CHAPTERS = [
  { id: 'what-is-rebate',  icon: '💡', zh: '什么是返佣',    en: 'What is Rebate'      },
  { id: 'rebate-source',   icon: '🏦', zh: '返佣来源',      en: 'Rebate Source'       },
  { id: 'mechanism',       icon: '⚙️', zh: '机制揭秘',      en: 'How It Works'        },
  { id: 'security',        icon: '🛡️', zh: '安全合规',      en: 'Safety & Compliance' },
  { id: 'case-study',      icon: '📊', zh: '实战案例',      en: 'Case Study'          },
  { id: 'scenarios',       icon: '🌐', zh: '全场景覆盖',    en: 'All Scenarios'       },
  { id: 'how-to-get',      icon: '🎁', zh: '如何获得返佣',  en: 'How to Get Rebates'  },
  { id: 'action',          icon: '🚀', zh: '总结与行动',    en: 'Summary & Action'    },
];

// ─── 浮动章节菜单（可拖拽） ───────────────────────────────────────────────────
const CASE_STUDY_MONTHLY_VOLUME = 1_000_000;
const CASE_STUDY_STANDARD_FEE = 1_000;
const CASE_STUDY_REBATE_RATE = 0.2;
const CASE_STUDY_REBATE = CASE_STUDY_STANDARD_FEE * CASE_STUDY_REBATE_RATE;
const CASE_STUDY_ACTUAL_FEE = CASE_STUDY_STANDARD_FEE - CASE_STUDY_REBATE;
const CASE_STUDY_YEARLY_SAVINGS = CASE_STUDY_REBATE * 12;

function FloatChapterMenu({ activeId, zh }: { activeId: string; zh: boolean }) {
  const [open, setOpen] = useState(false);
  const active = CHAPTERS.find(c => c.id === activeId) ?? CHAPTERS[0];

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setOpen(false);
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
      <div
        className="fixed left-4 z-50"
        style={{
          bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {/* 展开的菜单面板 */}
        {open && (
          <div
            className="mb-3 rounded-2xl border border-amber-500/25 overflow-hidden"
            style={{
              background: 'rgba(10,25,47,0.92)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,215,0,0.08)',
              width: '220px',
              pointerEvents: 'auto',
              touchAction: 'manipulation',
            }}
          >
            <div className="px-4 py-3 border-b border-amber-500/15">
              <p className="text-xs font-black text-amber-400 uppercase tracking-widest">
                {zh ? '章节导航' : 'Chapters'}
              </p>
            </div>
            <div className="py-2">
              {CHAPTERS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => scrollTo(c.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${
                    c.id === activeId
                      ? 'bg-amber-500/12 text-amber-300'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-base shrink-0 w-6 text-center">{c.icon}</span>
                  <span className="text-sm font-semibold truncate">{zh ? c.zh : c.en}</span>
                  {c.id === activeId && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* 触发按钮 */}
        <div style={{ pointerEvents: 'auto' }}>
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-2.5 rounded-2xl border border-amber-500/30 px-3.5 py-2.5 transition-all hover:border-amber-500/60"
            style={{
              background: 'rgba(10,25,47,0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 12px rgba(255,215,0,0.08)',
              pointerEvents: 'auto',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
            title={zh ? '点击展开章节导航' : 'Open chapter navigation'}
          >
            <span className="text-lg">{active.icon}</span>
            <div className="hidden sm:block">
              <p className="text-xs font-black text-amber-400 leading-none mb-0.5">
                {zh ? active.zh : active.en}
              </p>
              <p className="text-[10px] text-slate-500 leading-none">
                {zh ? '点击切换章节' : 'Tap to switch'}
              </p>
            </div>
            <span className="text-slate-500">
              {open ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}

// ─── 手续费计算器 ─────────────────────────────────────────────────────────────
function FeeCalculator({ zh }: { zh: boolean }) {
  const [volume, setVolume] = useState(100000);
  const [feeRate, setFeeRate] = useState(0.1);
  const [rebateRate, setRebateRate] = useState(20);

  const fee = volume * (feeRate / 100);
  const rebate = fee * (rebateRate / 100);
  const actual = fee - rebate;
  const yearly = rebate * 12;

  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n.toFixed(0)}`;

  return (
    <div className="rounded-2xl border border-amber-500/25 p-6" style={{ background: 'rgba(10,25,47,0.7)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
      <div className="flex items-center gap-2 mb-5">
        <Calculator className="w-5 h-5 text-amber-400" />
        <h3 className="text-base font-black text-white">
          {zh ? '手续费 & 返佣计算器' : 'Fee & Rebate Calculator'}
        </h3>
      </div>

      <div className="space-y-5 mb-6">
        {/* 月交易量 */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              {zh ? '月交易量' : 'Monthly Volume'}
            </label>
            <span className="text-sm font-black text-white">${volume.toLocaleString()}</span>
          </div>
          <input
            type="range" min={10000} max={10000000} step={10000}
            value={volume}
            onChange={e => setVolume(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#FFD700' }}
          />
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>$10K</span><span>$1M</span><span>$10M</span>
          </div>
        </div>

        {/* 手续费率 */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              {zh ? '手续费率' : 'Fee Rate'}
            </label>
            <span className="text-sm font-black text-white">{feeRate}%</span>
          </div>
          <input
            type="range" min={0.02} max={0.2} step={0.01}
            value={feeRate}
            onChange={e => setFeeRate(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#FFD700' }}
          />
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>0.02%</span><span>0.1%</span><span>0.2%</span>
          </div>
        </div>

        {/* 返佣比例 */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              {zh ? '返佣比例' : 'Rebate Rate'}
            </label>
            <span className="text-sm font-black" style={{ color: '#FFD700' }}>{rebateRate}%</span>
          </div>
          <input
            type="range" min={20} max={50} step={5}
            value={rebateRate}
            onChange={e => setRebateRate(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#FFD700' }}
          />
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>20%</span><span>35%</span><span>50%</span>
          </div>
        </div>
      </div>

      {/* 结果展示 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: zh ? '月手续费' : 'Monthly Fee',   value: fmt(fee),    color: '#f87171' },
          { label: zh ? '月返佣额' : 'Monthly Rebate', value: fmt(rebate), color: '#FFD700' },
          { label: zh ? '实付手续费' : 'Actual Fee',  value: fmt(actual), color: '#4ade80' },
          { label: zh ? '年省金额' : 'Annual Savings', value: fmt(yearly), color: '#a78bfa' },
        ].map((item, i) => (
          <div key={i} className="rounded-xl bg-white/4 border border-white/8 p-3 text-center">
            <p className="text-xs text-slate-500 mb-1.5 leading-tight">{item.label}</p>
            <p className="text-xl font-black" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-slate-600 mt-4">
        {zh ? '* 仅供参考，实际费率以交易所为准' : '* For reference only. Actual rates may vary.'}
      </p>
    </div>
  );
}

export default function Home() {
  useScrollMemory();
  const { language, setLanguage } = useLanguage();
  const [, navigate] = useLocation();
  const texts = translations[language as keyof typeof translations];
  const zh = language === 'zh';

  const { allLinks: exchangeLinksData } = useExchangeLinks();

  const [showGuide, setShowGuide] = useState(() => {
    try { return !localStorage.getItem('crypto_guide_seen'); } catch { return true; }
  });
  const [selectedGuideType, setSelectedGuideType] = useState<'new' | 'old' | null>(null);
  const initialRouteHandledRef = useRef(false);
  const initialHashJumpDoneRef = useRef(false);

  // 滚动感知：当前章节
  const [activeChapter, setActiveChapter] = useState(CHAPTERS[0].id);
  const rebateTrustSources = zh
    ? [
        { label: '各交易所官方费率与返佣页面' },
        { label: '各交易所下载页与活动公告' },
        { label: 'CoinGecko 2025 年报' },
        { label: 'CoinGlass 市场数据' },
      ]
    : [
        { label: 'Official exchange fee and rebate pages' },
        { label: 'Official exchange download pages and campaign notes' },
        { label: 'CoinGecko 2025 annual report' },
        { label: 'CoinGlass market data' },
      ];
  const rebateDisclosure = zh
    ? '返佣说明以当前公开规则为准。Get8 Pro 可能从官方合作或邀请计划获得收益，但这不会替代风险提示，也不代表老账户一定能补绑；默认 20% 与更高额度方案请以实际平台显示和沟通结果为准。'
    : 'Rebate notes follow the current public rules. Get8 Pro may earn from official partner or referral programs, but that does not replace risk disclosures and does not mean existing accounts can always be retrofitted. Treat the default 20% and any higher-rate arrangement as subject to actual platform display and direct confirmation.';

  useEffect(() => {
    let ticking = false;
    const handler = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        let current = CHAPTERS[0].id;
        for (const c of CHAPTERS) {
          const el = document.getElementById(c.id);
          if (el && el.getBoundingClientRect().top <= 120) current = c.id;
        }
        setActiveChapter(current);
        ticking = false;
      });
    };
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    if (initialRouteHandledRef.current || typeof window === 'undefined') return;
    initialRouteHandledRef.current = true;

    const url = new URL(window.location.href);
    const pathHint = url.searchParams.get('path');
    const hash = url.hash.replace('#', '');

    if (!pathHint && !hash) return;

    setShowGuide(false);
    try { localStorage.setItem('crypto_guide_seen', '1'); } catch {}

    if (pathHint === 'old') {
      setSelectedGuideType('old');
      return;
    }

    if (pathHint === 'new' || pathHint === 'trader') {
      setSelectedGuideType('new');
    }
  }, []);

  useEffect(() => {
    if (initialHashJumpDoneRef.current || showGuide || typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const pathHint = url.searchParams.get('path');
    const hash = url.hash.replace('#', '');
    const targetId = hash || (pathHint === 'old' || pathHint === 'new' || pathHint === 'trader' ? 'how-to-get' : '');

    if (!targetId) return;

    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      initialHashJumpDoneRef.current = true;
    }, 180);

    return () => window.clearTimeout(timer);
  }, [showGuide]);

  const handleGuideSelection = (type: 'new' | 'old') => {
    setSelectedGuideType(type);
    setShowGuide(false);
    try { localStorage.setItem('crypto_guide_seen', '1'); } catch {}
    const targetId = 'how-to-get';
    setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleGuideClose = () => {
    setShowGuide(false);
    try { localStorage.setItem('crypto_guide_seen', '1'); } catch {}
  };

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(180deg, #0a192f 0%, #0d1f35 100%)' }}>
      {/* Welcome Guide Modal */}
      {showGuide && (
        <WelcomeGuide
          onClose={handleGuideClose}
          onSelectNewUser={() => handleGuideSelection('new')}
          onSelectOldUser={() => handleGuideSelection('old')}
        />
      )}

      {/* ── 顶部导航 ── */}
      <nav className="sticky top-0 z-50 border-b backdrop-blur-sm" style={{ background: 'rgba(10,25,47,0.95)', borderColor: 'rgba(255,215,0,0.12)' }}>
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* 返回主页按钮：移动端 + 桌面端均显示 */}
            <Link href="/" className="tap-target flex items-center gap-1.5 text-slate-400 hover:text-amber-400 transition-colors text-sm shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">{zh ? '返回主页' : 'Home'}</span>
            </Link>
            <div className="w-px h-4 bg-border shrink-0" />
            {/* 桌面端：显示页面标题；移动端：显示当前章节标题（滚动感知） */}
            <div className="min-w-0 overflow-hidden">
              <span className="hidden sm:block text-sm font-bold text-amber-400 truncate">{texts.nav.title}</span>
              {/* 移动端章节标题：滚动感知，滑入动画 */}
              <div className="sm:hidden overflow-hidden h-5 flex items-center min-w-0">
                <span
                  key={activeChapter}
                  className="text-xs font-bold truncate"
                  style={{
                    color: '#FFD700',
                    display: 'block',
                    animation: 'slideInFromBottom 0.25s ease forwards',
                  }}
                >
                  {(() => {
                    const cur = CHAPTERS.find(c => c.id === activeChapter);
                    return cur ? `${cur.icon} ${zh ? cur.zh : cur.en}` : texts.nav.title;
                  })()}
                </span>
              </div>
            </div>
          </div>
          {/* 桌面端章节快捷导航 */}
          <div className="hidden lg:flex items-center gap-5">
            {CHAPTERS.slice(0, 5).map(c => (
              <button
                key={c.id}
                onClick={() => document.getElementById(c.id)?.scrollIntoView({ behavior: 'smooth' })}
                className={`text-xs font-semibold transition ${activeChapter === c.id ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'}`}
              >
                {zh ? c.zh : c.en}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setLanguage('zh')} className={`px-3 py-1 rounded text-sm font-medium transition ${language === 'zh' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-500 hover:text-amber-400'}`}>中文</button>
            <button onClick={() => setLanguage('en')} className={`px-3 py-1 rounded text-sm font-medium transition ${language === 'en' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-500 hover:text-amber-400'}`}>EN</button>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 sm:py-32 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(255,215,0,0.07) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(255,165,0,0.04) 0%, transparent 70%)' }} />
        </div>
        <div className="container mx-auto relative max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {texts.hero.badge}
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white mb-5 leading-tight tracking-tight">
            {texts.hero.title}
          </h1>
          <p className="text-xl sm:text-2xl font-bold mb-4" style={{ color: '#FFD700', textShadow: '0 0 30px rgba(255,215,0,0.25)' }}>
            {texts.hero.subtitle}
          </p>
          <p className="text-slate-400 text-base sm:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            {texts.hero.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              className="inline-flex min-h-12 items-center justify-center rounded-xl px-8 text-base font-black shadow-lg transition-all hover:scale-105 sm:text-lg"
              style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#0A192F', boxShadow: '0 4px 20px rgba(255,215,0,0.35)' }}
              onClick={() => document.getElementById('what-is-rebate')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {texts.hero.startBtn}
            </button>
            <button
              type="button"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-amber-500/50 px-8 text-base font-bold text-amber-400 transition-colors hover:bg-amber-500/10 sm:text-lg"
              onClick={() => navigate('/exchange-download')}
            >
              {zh ? '新手不知道怎么下载？' : 'How to Download an Exchange?'}
            </button>
          </div>
          <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-left">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <div className="space-y-2 text-sm leading-6 text-amber-100">
                <p className="font-bold text-amber-300">
                  {zh ? '先说清楚规则：新用户默认 20% 返佣。' : 'Important first: new users start with a default 20% rebate.'}
                </p>
                <p>
                  {zh ? '老账户通常没法补绑返佣；如果你需要更高额度，或者五家交易所里没有你想要的平台，直接联系我。' : 'Existing accounts usually cannot be retrofitted. Contact me if you need a higher rate or a different exchange.'}
                </p>
              </div>
            </div>
          </div>
          {true ? <div className="mx-auto mt-8 max-w-4xl text-left">
            <TrustSignalsCard
              zh={zh}
              title={zh ? "作者、审核与返佣披露" : "Authorship, Review & Rebate Disclosure"}
              summary={zh ? "这页涉及交易所、费率和合作入口，所以把作者、更新时间、来源依据和披露规则提前展示，方便你先判断可信度再继续往下看。" : "This page touches exchanges, fee rules, and partner routes, so we surface authorship, update timing, source basis, and disclosures early before the reader continues."}
              author={zh ? "Get8 Pro 编辑团队" : "Get8 Pro Editorial Team"}
              reviewer={zh ? "Get8 Pro 内容审核" : "Get8 Pro Editorial Review"}
              updatedAt={TRUST_LAST_REVIEWED}
              sources={rebateTrustSources}
              disclosure={rebateDisclosure}
            />
          </div> : null}
          <div className="mt-14 animate-bounce">
            <ChevronDown className="text-amber-400/60 mx-auto" size={28} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §1 什么是返佣
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="what-is-rebate" className="py-20 px-4" style={{ background: 'linear-gradient(180deg, rgba(23,42,69,0.4) 0%, rgba(10,25,47,0.8) 100%)' }}>
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">💡</span>
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
              {zh ? '第一章' : 'Chapter 1'}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            {zh ? '什么是返佣？' : 'What is a Rebate?'}
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8">
            {zh
              ? '返佣（Rebate）是交易所为了吸引新用户而提供的激励机制。当你通过专属邀请码注册时，交易所会自动将你每笔交易手续费的一部分返还到你的账户——这笔钱是真实的、可提取的资产，不是积分或优惠券。'
              : 'A rebate is an incentive mechanism provided by exchanges to attract new users. When you register with a referral code, the exchange automatically returns a portion of your trading fees to your account — this is real, withdrawable money, not points or coupons.'}
          </p>

          {/* 三个核心特点 */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {(zh ? [
              { icon: <Gift className="w-5 h-5" />, title: '自动返还', desc: '每笔交易手续费的一部分自动打入账户，无需手动申请。' },
              { icon: <Zap className="w-5 h-5" />, title: '终身有效', desc: '只要账户存在，返佣就持续生效，不会过期。' },
              { icon: <TrendingUp className="w-5 h-5" />, title: '无风险收益', desc: '省下的手续费是纯利润，不受市场涨跌影响。' },
            ] : [
              { icon: <Gift className="w-5 h-5" />, title: 'Auto Return', desc: 'A portion of each trade fee is automatically credited to your account.' },
              { icon: <Zap className="w-5 h-5" />, title: 'Lifetime Valid', desc: 'Rebates remain active as long as your account exists.' },
              { icon: <TrendingUp className="w-5 h-5" />, title: 'Risk-Free Profit', desc: 'Saved fees are pure profit, unaffected by market movements.' },
            ]).map((item, i) => (
              <div key={i} className="rounded-2xl border border-amber-500/15 bg-white/3 p-5 hover:border-amber-500/30 transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(255,215,0,0.1)', color: '#FFD700' }}>
                  {item.icon}
                </div>
                <h3 className="text-sm font-black text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* 一句话总结 */}
          <div className="rounded-2xl border border-amber-500/25 p-5" style={{ background: 'rgba(255,215,0,0.04)' }}>
            <p className="text-amber-300 font-bold text-sm sm:text-base leading-relaxed">
              {zh
                ? '💬 简单来说：不填邀请码 = 每笔交易损失 20%–60% 的返佣。这笔钱本来就属于你，只是你不知道而已。'
                : '💬 Simply put: not using a referral code = losing 20%–60% rebate on every trade. This money was always yours — you just didn\'t know it.'}
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §2 返佣来源
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="rebate-source" className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🏦</span>
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
              {zh ? '第二章' : 'Chapter 2'}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            {zh ? '返佣从哪里来？' : 'Where Does the Rebate Come From?'}
          </h2>
          <p className="text-slate-400 text-base leading-relaxed mb-10">
            {zh
              ? '很多人担心"返佣是不是骗局"。事实上，返佣资金 100% 来自交易所本身的手续费收入，是交易所为了获客主动让利的营销成本。'
              : 'Many people worry that "rebates are a scam." In fact, rebate funds come 100% from the exchange\'s own fee revenue — it\'s marketing spend that exchanges willingly give up to acquire users.'}
          </p>

          {/* 资金流向图 */}
          <div className="rounded-2xl border border-white/10 bg-white/3 p-6 mb-8">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-5">
              {zh ? '资金流向' : 'Money Flow'}
            </h3>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {(zh ? [
                { label: '你的每笔交易', sub: '产生手续费', color: 'border-slate-500/40 bg-slate-800/40', textColor: 'text-slate-300' },
                { label: '→', sub: '', color: '', textColor: 'text-amber-400 text-2xl font-black' },
                { label: '交易所收取', sub: '0.1% 手续费', color: 'border-red-500/30 bg-red-900/20', textColor: 'text-red-300' },
                { label: '→', sub: '', color: '', textColor: 'text-amber-400 text-2xl font-black' },
                { label: '60% 返还给你', sub: '直接入账', color: 'border-amber-500/40 bg-amber-900/20', textColor: 'text-amber-300' },
              ] : [
                { label: 'Your Trade', sub: 'Generates fee', color: 'border-slate-500/40 bg-slate-800/40', textColor: 'text-slate-300' },
                { label: '→', sub: '', color: '', textColor: 'text-amber-400 text-2xl font-black' },
                { label: 'Exchange Takes', sub: '0.1% fee', color: 'border-red-500/30 bg-red-900/20', textColor: 'text-red-300' },
                { label: '→', sub: '', color: '', textColor: 'text-amber-400 text-2xl font-black' },
                { label: '60% Returned', sub: 'To your account', color: 'border-amber-500/40 bg-amber-900/20', textColor: 'text-amber-300' },
              ]).map((item, i) => (
                item.label === '→'
                  ? <div key={i} className={`${item.textColor} hidden sm:block`}>{item.label}</div>
                  : <div key={i} className={`flex-1 rounded-xl border ${item.color} p-4 text-center`}>
                      <p className={`text-sm font-black ${item.textColor}`}>{item.label}</p>
                      <p className="text-xs text-slate-500 mt-1">{item.sub}</p>
                    </div>
              ))}
            </div>
          </div>

          {/* 三方共赢 */}
          <h3 className="text-lg font-black text-white mb-4">{zh ? '三方共赢模型' : 'Win-Win-Win Model'}</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {(zh ? [
              { icon: '🏢', who: '交易所', benefit: '获得活跃用户，提升交易流动性和市场深度' },
              { icon: '👤', who: '你（用户）', benefit: '享受手续费折扣，每笔交易都在为你积累无风险收益' },
              { icon: '🤝', who: '邀请人', benefit: '获得推广奖励，实现低成本用户增长' },
            ] : [
              { icon: '🏢', who: 'Exchange', benefit: 'Gains active users, improves liquidity and market depth' },
              { icon: '👤', who: 'You (User)', benefit: 'Enjoy fee discounts, accumulate risk-free returns on every trade' },
              { icon: '🤝', who: 'Referrer', benefit: 'Earns promotion rewards, achieves low-cost user growth' },
            ]).map((item, i) => (
              <div key={i} className="rounded-2xl border border-white/8 bg-white/3 p-5 text-center">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h4 className="text-sm font-black text-white mb-2">{item.who}</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{item.benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §3 机制揭秘
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="mechanism" className="py-20 px-4" style={{ background: 'linear-gradient(180deg, rgba(23,42,69,0.4) 0%, rgba(10,25,47,0.8) 100%)' }}>
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">⚙️</span>
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
              {zh ? '第三章' : 'Chapter 3'}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            {texts.mechanism.title}
          </h2>
          <p className="text-slate-400 text-base leading-relaxed mb-10">{texts.mechanism.subtitle}</p>

          <div className="space-y-4">
            {[
              { icon: <Users className="w-6 h-6" />, step: '01', title: texts.mechanism.demand.title, desc: texts.mechanism.demand.desc },
              { icon: <Gift className="w-6 h-6" />, step: '02', title: texts.mechanism.incentive.title, desc: texts.mechanism.incentive.desc },
              { icon: <TrendingUp className="w-6 h-6" />, step: '03', title: texts.mechanism.winwin.title, desc: texts.mechanism.winwin.desc },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 rounded-2xl border border-amber-500/12 bg-white/3 p-5 hover:border-amber-500/25 transition-all">
                <div className="relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.08))', border: '1px solid rgba(255,215,0,0.3)', color: '#FFD700' }}>
                  {item.icon}
                  <span className="absolute -top-2 -right-2 text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center" style={{ background: '#FFD700', color: '#0A192F' }}>{item.step}</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 核心洞察 */}
          <div className="mt-10 rounded-2xl border border-amber-500/20 p-6" style={{ background: 'rgba(255,215,0,0.03)' }}>
            <h3 className="text-lg font-black mb-4" style={{ color: '#FFD700' }}>
              {texts.insight.title} — {texts.insight.subtitle}
            </h3>
            <div className="space-y-4">
              {[
                { title: texts.insight.cost.title, desc: texts.insight.cost.desc },
                { title: texts.insight.reduce.title, desc: texts.insight.reduce.desc },
                { title: texts.insight.profit.title, desc: texts.insight.profit.desc },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#FFD700' }} />
                  <div>
                    <span className="text-sm font-black text-white">{item.title}：</span>
                    <span className="text-slate-400 text-sm leading-relaxed">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §4 安全合规
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="security" className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🛡️</span>
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
              {zh ? '第四章' : 'Chapter 4'}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            {texts.security.title}
          </h2>
          <p className="text-slate-400 text-base leading-relaxed mb-10">{texts.security.subtitle}</p>

          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { icon: <CheckCircle2 className="w-5 h-5" />, title: texts.security.official, desc: texts.security.officialDesc },
              { icon: <Shield className="w-5 h-5" />, title: texts.security.settlement, desc: texts.security.settlementDesc },
              { icon: <Lock className="w-5 h-5" />, title: texts.security.security1, desc: texts.security.security1Desc },
              { icon: <Globe className="w-5 h-5" />, title: texts.security.standard, desc: texts.security.standardDesc },
            ].map((item, i) => (
              <div key={i} className="group bg-white/3 p-6 rounded-2xl border border-amber-500/12 hover:border-amber-500/28 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)', color: '#FFD700' }}>
                    {item.icon}
                  </div>
                  <h3 className="text-sm font-black text-white">{item.title}</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* 官方背书 */}
          <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-900/10 p-5">
            <h3 className="text-sm font-black text-emerald-400 mb-3">
              {zh ? '✅ 权威数据背书' : '✅ Authority Data'}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[
                { val: '7亿+', label: zh ? '全球持币用户' : 'Global Users' },
                { val: '$86.2T', label: zh ? '2025年交易量' : '2025 Volume' },
                { val: '50+', label: zh ? '国家持牌运营' : 'Licensed Countries' },
                { val: '100%+', label: zh ? '主流交易所储备率' : 'Reserve Ratio' },
              ].map((item, i) => (
                <div key={i} className="rounded-xl bg-white/4 border border-white/8 p-3">
                  <p className="text-lg font-black text-white">{item.val}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-3 text-center">
              {zh ? '数据来源：CoinGecko 2025年报、CoinGlass、各交易所官方公告' : 'Sources: CoinGecko 2025 Annual Report, CoinGlass, official exchange announcements'}
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §5 实战案例 + 计算器
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="case-study" className="py-20 px-4" style={{ background: 'linear-gradient(180deg, rgba(23,42,69,0.4) 0%, rgba(10,25,47,0.8) 100%)' }}>
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">📊</span>
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
              {zh ? '第五章' : 'Chapter 5'}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            {texts.caseStudy.title}
          </h2>
          <p className="text-slate-400 text-base leading-relaxed mb-8">{texts.caseStudy.subtitle}</p>

          {/* 静态案例 */}
          <div className="rounded-2xl border p-6 mb-8" style={{ borderColor: 'rgba(255,215,0,0.25)', background: 'rgba(10,25,47,0.6)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-6">
              {[
                { label: texts.caseStudy.monthlyVolume, value: `$${CASE_STUDY_MONTHLY_VOLUME.toLocaleString()}`, color: '#ffffff' },
                { label: texts.caseStudy.standardFee, value: `$${CASE_STUDY_STANDARD_FEE.toLocaleString()}`, color: '#f87171' },
                { label: texts.caseStudy.rebateAmount, value: `$${CASE_STUDY_REBATE.toLocaleString()}`, color: '#FFD700' },
                { label: texts.caseStudy.actualFee, value: `$${CASE_STUDY_ACTUAL_FEE.toLocaleString()}`, color: '#4ade80' },
              ].map((item, i) => (
                <div key={i} className="rounded-xl bg-white/4 border border-white/8 p-4">
                  <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider leading-tight">{item.label}</p>
                  <p className="text-2xl font-black" style={{ color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>
            <div className="text-center border-t pt-5" style={{ borderColor: 'rgba(255,215,0,0.12)' }}>
              <p className="hidden text-lg font-black mb-1" style={{ color: '#FFD700' }}>
                {texts.caseStudy.summary} <span className="text-2xl">$600</span>，{texts.caseStudy.yearly} <span className="text-2xl">$7,200</span>
              </p>
              <p className="text-lg font-black mb-1" style={{ color: '#FFD700' }}>
                {texts.caseStudy.summary} <span className="text-2xl">${CASE_STUDY_REBATE.toLocaleString()}</span> / {texts.caseStudy.yearly} <span className="text-2xl">${CASE_STUDY_YEARLY_SAVINGS.toLocaleString()}</span>
              </p>
              <p className="text-slate-400 text-sm">{texts.caseStudy.profit}</p>
            </div>
          </div>

          {/* 交互计算器 */}
          <FeeCalculator zh={zh} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §6 全场景覆盖
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="scenarios" className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🌐</span>
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
              {zh ? '第六章' : 'Chapter 6'}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            {texts.scenarios.title}
          </h2>
          <p className="text-slate-400 text-base leading-relaxed mb-10">{texts.scenarios.subtitle}</p>

          <div className="grid sm:grid-cols-2 gap-5 mb-8">
            {[
              { title: texts.scenarios.spot, icon: '📈', points: [texts.scenarios.spotPoint1, texts.scenarios.spotPoint2, texts.scenarios.spotPoint3] },
              { title: texts.scenarios.futures, icon: '⚡', points: [texts.scenarios.futuresPoint1, texts.scenarios.futuresPoint2, texts.scenarios.futuresPoint3] },
            ].map((card, ci) => (
              <div key={ci} className="bg-white/3 p-6 rounded-2xl border border-amber-500/12 hover:border-amber-500/28 transition-all">
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-2xl">{card.icon}</span>
                  <h3 className="text-base font-black" style={{ color: '#FFD700' }}>{card.title}</h3>
                </div>
                {card.points.map((p, i) => (
                  <div key={i} className="flex items-start gap-2.5 mb-3 last:mb-0">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#FFD700' }} />
                    <p className="text-slate-300 text-sm leading-relaxed">{p}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-amber-500/20 p-4 text-center" style={{ background: 'rgba(255,215,0,0.04)' }}>
            <p className="font-bold text-sm sm:text-base" style={{ color: '#FFD700' }}>{texts.scenarios.note}</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §7 如何获得返佣（新老用户）
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="how-to-get" className="py-20 px-4" style={{ background: 'linear-gradient(180deg, rgba(23,42,69,0.4) 0%, rgba(10,25,47,0.8) 100%)' }}>
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🎁</span>
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
              {zh ? '第七章' : 'Chapter 7'}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            {texts.comparison.title}
          </h2>
          <p className="text-slate-400 text-base leading-relaxed mb-10">{texts.comparison.subtitle}</p>

          <div className="grid sm:grid-cols-2 gap-5 mb-10">
            {/* 新用户 */}
            <div className="bg-white/3 p-6 rounded-2xl border" style={{ borderColor: selectedGuideType === 'new' ? 'rgba(255,215,0,0.55)' : 'rgba(255,215,0,0.35)', boxShadow: '0 4px 24px rgba(255,215,0,0.06)' }}>
              <div className="text-3xl mb-3">👤</div>
              <h3 className="text-lg font-black mb-5" style={{ color: '#FFD700' }}>{texts.comparison.newUser}</h3>
              {[texts.comparison.step1New, texts.comparison.step2New, texts.comparison.step3New].map((step, i) => (
                <div key={i} className="flex items-start gap-3 mb-4 last:mb-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black shrink-0 mt-0.5" style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#0A192F' }}>{i + 1}</div>
                  <p className="text-slate-300 text-sm leading-relaxed">{step}</p>
                </div>
              ))}
              <button
                onClick={() => navigate('/exchange-download')}
                className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#0A192F' }}
              >
                {zh ? '立即下载交易所 →' : 'Download Exchange Now →'}
              </button>
            </div>

            {/* 老用户 */}
            <div className="bg-white/3 p-6 rounded-2xl border" style={{ borderColor: selectedGuideType === 'old' ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.1)' }}>
              <div className="text-3xl mb-3">👥</div>
              <h3 className="text-lg font-black text-slate-300 mb-5">{texts.comparison.oldUser}</h3>
              {[texts.comparison.step1Old, texts.comparison.step2Old, texts.comparison.step3Old].map((step, i) => (
                <div key={i} className="flex items-start gap-3 mb-4 last:mb-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5" style={{ background: 'rgba(255,215,0,0.12)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.25)' }}>{i + 1}</div>
                  <p className="text-slate-400 text-sm leading-relaxed">{step}</p>
                </div>
              ))}
              <button
                onClick={() => navigate('/contact')}
                className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition-all"
              >
                {zh ? '联系我们配置返佣 →' : 'Contact Us to Configure →'}
              </button>
            </div>
          </div>

          {/* 交易所下载区 */}
          <div className="rounded-2xl border border-amber-500/20 p-6" style={{ background: 'rgba(10,25,47,0.6)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-black text-white">
                {texts.exchangeDownload.title}
              </h3>
              <button
                onClick={() => navigate('/exchange-download')}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
              >
                {zh ? '新手下载指南' : 'Beginner Guide'}
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
              {(exchangeLinksData ?? []).map((ex) => {
                const meta = EXCHANGE_META[ex.slug] ?? { emoji: '💱', color: 'from-gray-800 to-gray-900' };
                return (
                  <a
                    key={ex.slug}
                    href={ex.referralLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group relative bg-gradient-to-b ${meta.color} border border-amber-500/12 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-amber-500/45 transition-all hover:-translate-y-0.5`}
                  >
                    <div className="text-3xl group-hover:scale-110 transition-transform">{meta.emoji}</div>
                    <span className="text-xs font-black text-white capitalize">{ex.name}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,215,0,0.12)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.2)' }}>
                      {zh ? '默认 20%' : 'Default 20%'}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: '#FFA500' }}>
                      {texts.exchangeDownload.download} ↗
                    </span>
                  </a>
                );
              })}
            </div>
            <p className="text-center text-xs text-slate-600">{texts.exchangeDownload.official}</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §8 总结与行动
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="action" className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🚀</span>
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
              {zh ? '第八章' : 'Chapter 8'}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            {texts.summary.title}
          </h2>
          <p className="text-slate-400 text-base leading-relaxed mb-10">{texts.summary.subtitle}</p>

          {/* 三个核心结论 */}
          <div className="space-y-4 mb-10">
            {[
              { title: texts.summary.point1, sub: texts.summary.point1Sub },
              { title: texts.summary.point2, sub: texts.summary.point2Sub },
              { title: texts.summary.point3, sub: texts.summary.point3Sub },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 bg-white/3 rounded-2xl p-5 border border-amber-500/10 hover:border-amber-500/22 transition-all">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(255,215,0,0.12)', color: '#FFD700' }}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white mb-1">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 两步行动 */}
          <div className="rounded-2xl p-6 mb-10" style={{ borderTop: '3px solid #FFD700', background: 'rgba(10,25,47,0.6)', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
            <div className="grid sm:grid-cols-2 gap-6 text-center">
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#FFD700' }}>{texts.summary.step1}</p>
                <p className="text-lg font-black text-white">{texts.summary.step1Title}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#FFD700' }}>{texts.summary.step2}</p>
                <p className="text-lg font-black text-white">{texts.summary.step2Title}</p>
              </div>
            </div>
          </div>

          {/* CTA 按钮组 */}
          <p className="text-base text-slate-400 italic mb-8 text-center">{texts.summary.cta}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-xl px-6 py-3 font-black transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#0A192F', boxShadow: '0 4px 20px rgba(255,215,0,0.3)' }}
              onClick={() => navigate('/contact')}
              type="button"
            >
              {texts.summary.contactBtn}
            </button>
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-amber-500/40 px-6 py-3 font-bold text-amber-400 transition-colors hover:bg-amber-500/10"
              onClick={() => navigate('/exchanges')}
              type="button"
            >
              {zh ? '查看交易所返佣对比' : 'View Exchange Rebate Comparison'}
            </button>
          </div>
          {/* Discord 社群入口 */}
          <div className="flex justify-center mb-10">
            <a
              href="https://discord.gg/wgvetpH6Un"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl px-6 py-3.5 font-black text-white hover:scale-105 transition-all"
              style={{
                background: 'linear-gradient(135deg, #5865F2, #7289DA)',
                boxShadow: '0 4px 20px rgba(88,101,242,0.4)',
              }}
            >
              <MessageSquare className="w-5 h-5" />
              <span>{zh ? '加入 Discord 社群 · 免费获取 Alpha 情报' : 'Join Discord Community · Free Alpha Signals'}</span>
              <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">{zh ? 'VIP 专属' : 'VIP Only'}</span>
            </a>
          </div>

          {/* 相关页面推荐 */}
          <div className="grid sm:grid-cols-3 gap-4">
            {(zh ? [
              { icon: '📱', title: '下载交易所', desc: '新手下载 + 三步注册指南', href: '/exchange-download' },
              { icon: '📖', title: '交易所扫盲', desc: '现货/合约/杠杆功能详解', href: '/exchange-guide' },
              { icon: '🌐', title: 'Web3 入圈', desc: '区块链/钱包/DeFi 基础', href: '/web3-guide' },
            ] : [
              { icon: '📱', title: 'Download Guide', desc: 'Beginner download + 3-step registration', href: '/exchange-download' },
              { icon: '📖', title: 'Exchange Guide', desc: 'Spot/Futures/Margin explained', href: '/exchange-guide' },
              { icon: '🌐', title: 'Web3 Guide', desc: 'Blockchain/Wallet/DeFi basics', href: '/web3-guide' },
            ]).map((item, i) => (
              <button
                key={i}
                onClick={() => navigate(item.href)}
                className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/3 p-4 text-left hover:border-amber-500/25 hover:bg-white/5 transition-all group"
              >
                <span className="text-2xl shrink-0">{item.icon}</span>
                <div>
                  <h4 className="text-sm font-black text-white mb-1 group-hover:text-amber-400 transition-colors">{item.title}</h4>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <section className="px-4 pb-10 bg-background">
        <div className="container mx-auto max-w-3xl">
          <TrustSignalsCard
            zh={zh}
            title={zh ? "\u4f5c\u8005\u3001\u5ba1\u6838\u4e0e\u8fd4\u4f63\u62ab\u9732" : "Authorship, Review & Rebate Disclosure"}
            summary={zh ? "\u8fd9\u9875\u6d89\u53ca\u4ea4\u6613\u6240\u3001\u8d39\u7387\u4fe1\u606f\u3001\u4e0b\u8f7d\u5165\u53e3\u548c\u5408\u4f5c\u62ab\u9732\uff0c\u6240\u4ee5\u628a\u8fd9\u4e9b\u4fe1\u606f\u653e\u5728\u9875\u9762\u672b\u5c3e\uff0c\u65b9\u4fbf\u4f60\u5728\u770b\u5b8c\u4e3b\u4f53\u5185\u5bb9\u540e\u518d\u7edf\u4e00\u6838\u5bf9\u3002"
              : "This page covers exchanges, fee rules, download routes, and partner disclosures, so the trust notes are grouped near the footer for a cleaner reading flow."}
            author={zh ? "Get8 Pro \u7f16\u8f91\u56e2\u961f" : "Get8 Pro Editorial Team"}
            reviewer={zh ? "Get8 Pro \u5185\u5bb9\u5ba1\u6838" : "Get8 Pro Editorial Review"}
            updatedAt={TRUST_LAST_REVIEWED}
            sources={rebateTrustSources}
            disclosure={rebateDisclosure}
          />
        </div>
      </section>

      <footer className="py-12 px-4 border-t" style={{ background: 'rgba(10,25,47,0.98)', borderColor: 'rgba(255,215,0,0.1)' }}>
        <div className="container mx-auto text-center max-w-2xl">
          <h3 className="text-xl font-black text-white mb-2">
            {zh ? "\u8ba9\u4ea4\u6613\u6210\u672c\u66f4\u6e05\u6670" : "Make Trading Costs Easier to Read"}
          </h3>
          <p className="text-slate-500 mb-8 text-sm">
            {zh ? "\u628a Web3 \u5b66\u4e60\u3001\u4ea4\u6613\u6240\u4e0e\u8d39\u7387\u4fe1\u606f\u6574\u7406\u5728\u540c\u4e00\u6761\u6d4f\u89c8\u8def\u5f84\u91cc" : "Keep Web3 learning, exchange routes, and fee information in one clearer path"}
          </p>
          <div className="flex justify-center flex-wrap gap-6 text-sm mb-6">
            <button onClick={() => navigate('/exchanges')} className="text-slate-500 hover:text-amber-400 transition font-medium">{texts.nav.exchanges}</button>
            <button onClick={() => navigate('/exchange-download')} className="text-slate-500 hover:text-amber-400 transition font-medium">{zh ? "\u4e0b\u8f7d\u6307\u5357" : "Download Guide"}</button>
            <button onClick={() => navigate('/exchange-guide')} className="text-slate-500 hover:text-amber-400 transition font-medium">{zh ? "\u4ea4\u6613\u6240\u626b\u76f2" : "Exchange Guide"}</button>
            <button onClick={() => navigate('/web3-guide/kyc-flow')} className="text-slate-500 hover:text-amber-400 transition font-medium">{zh ? "KYC\u5b9e\u540d\u6d41\u7a0b" : "KYC Verification Flow"}</button>
            <button onClick={() => navigate('/standards')} className="text-slate-500 hover:text-amber-400 transition font-medium">{zh ? "\u7f16\u8f91\u539f\u5219" : "Editorial Standards"}</button>
            <button onClick={() => navigate('/legal')} className="text-slate-500 hover:text-amber-400 transition font-medium">{zh ? "\u6cd5\u5f8b\u4e0e\u98ce\u9669" : "Legal & Risk"}</button>
            <button onClick={() => navigate('/contact')} className="text-slate-500 hover:text-amber-400 transition font-medium">{texts.nav.contact}</button>
          </div>
          <p className="text-slate-700 text-xs">
            <a
              href="/manage-m2u0z0i04"
              style={{ color: 'inherit', textDecoration: 'none', cursor: 'default' }}
            >{zh ? "\u672c\u9875\u4ec5\u5bf9 Web3 \u5b66\u4e60\u3001\u5e73\u53f0\u4fe1\u606f\u4e0e\u8d39\u7387\u8def\u5f84\u505a\u7edf\u4e00\u6574\u7406\u3002" : "This page is a consolidated reference for Web3 learning, platform info, and fee paths."}</a>
          </p>
        </div>
      </footer>

      {/* 浮动章节菜单 */}
      <FloatChapterMenu activeId={activeChapter} zh={zh} />

      {/* 回到顶部 */}
      <ScrollToTopButton color="yellow" />
    </div>
  );
}
