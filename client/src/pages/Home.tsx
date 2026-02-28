/**
 * Home.tsx — /crypto-saving
 * 币圈省钱指南：自然阅读顺序返佣科普长页面
 * 章节顺序：Hero → 什么是返佣 → 返佣来源 → 机制揭秘 → 安全合规 → 实战案例（含计算器）→ 全场景覆盖 → 新老用户如何获得 → 总结与行动
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { WelcomeGuide } from '@/components/WelcomeGuide';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/i18n';

import {
  TrendingUp, Shield, CheckCircle2, Users, Gift, Zap,
  ChevronDown, BookOpen, Calculator, ChevronRight,
  Lock, Globe, AlertTriangle, ExternalLink, Menu, X,
} from 'lucide-react';
import { useScrollMemory } from '@/hooks/useScrollMemory';
import { useExchangeLinks } from '@/contexts/ExchangeLinksContext';
import { ScrollToTopButton } from "@/components/ScrollToTopButton";

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
function FloatChapterMenu({ activeId, zh }: { activeId: string; zh: boolean }) {
  const [open, setOpen] = useState(false);
  const active = CHAPTERS.find(c => c.id === activeId) ?? CHAPTERS[0];
  // 拖拽偏移量（相对于初始位置 bottom:1.5rem left:1rem）
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setOpen(false);
  };

  // 鼠标拖拽
  const onMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: offset.x, origY: offset.y, moved: false };
    e.preventDefault();
  };
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
      setOffset({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy });
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);
  // 触控拖拽
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    dragRef.current = { startX: t.clientX, startY: t.clientY, origX: offset.x, origY: offset.y, moved: false };
  };
  useEffect(() => {
    const onMove = (e: TouchEvent) => {
      if (!dragRef.current) return;
      const t = e.touches[0];
      const dx = t.clientX - dragRef.current.startX;
      const dy = t.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        dragRef.current.moved = true;
        setOffset({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy });
        e.preventDefault();
      }
    };
    const onEnd = () => { dragRef.current = null; };
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    return () => { window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd); };
  }, []);

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    left: `calc(1rem + ${offset.x}px)`,
    bottom: `calc(1.5rem - ${offset.y}px)`,
    zIndex: 50,
    userSelect: 'none',
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
      <div style={containerStyle}>
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
        {/* 触发按钮（拖拽手柄） */}
        <div
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          className="cursor-grab active:cursor-grabbing"
        >
          <button
            onClick={() => { if (!dragRef.current?.moved) setOpen(v => !v); }}
            className="flex items-center gap-2.5 rounded-2xl border border-amber-500/30 px-3.5 py-2.5 transition-all hover:border-amber-500/60"
            style={{
              background: 'rgba(10,25,47,0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 12px rgba(255,215,0,0.08)',
            }}
            title={zh ? '拖动可移位，点击切换章节' : 'Drag to move · Tap to switch'}
          >
            <span className="text-lg">{active.icon}</span>
            <div className="hidden sm:block">
              <p className="text-xs font-black text-amber-400 leading-none mb-0.5">
                {zh ? active.zh : active.en}
              </p>
              <p className="text-[10px] text-slate-500 leading-none">
                {zh ? '拖动可移位，点击切换' : 'Drag to move'}
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
  const { getRebateRate } = useExchangeLinks();
  const [volume, setVolume] = useState(100000);
  const [feeRate, setFeeRate] = useState(0.1);
  
  // 默认使用 Gate 的返佣比例作为计算基准，或者取所有交易所中的最高值
  const gateRebate = parseFloat(getRebateRate('gate')) || 60;
  const [rebateRate, setRebateRate] = useState(gateRebate);

  // 当数据库加载完成后，如果初始值是 60 且数据库有不同值，可以考虑同步，但这里保持用户可调
  useEffect(() => {
    const rate = parseFloat(getRebateRate('gate'));
    if (rate && rate !== 60) setRebateRate(rate);
  }, [getRebateRate]);

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
            <span className="text-sm font-black text-amber-400">{rebateRate}%</span>
          </div>
          <input
            type="range" min={0} max={100} step={5}
            value={rebateRate}
            onChange={e => setRebateRate(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#FFD700' }}
          />
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>0%</span><span>60%</span><span>100%</span>
          </div>
        </div>
      </div>

      {/* 结果展示 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/5 p-4 border border-white/5">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{zh ? '月手续费' : 'Monthly Fee'}</p>
          <p className="text-xl font-black text-white">{fmt(fee)}</p>
        </div>
        <div className="rounded-xl bg-amber-500/10 p-4 border border-amber-500/20">
          <p className="text-[10px] font-bold text-amber-500/70 uppercase mb-1">{zh ? '月返佣金额' : 'Monthly Rebate'}</p>
          <p className="text-xl font-black text-amber-400">{fmt(rebate)}</p>
        </div>
        <div className="col-span-2 rounded-xl bg-emerald-500/10 p-4 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-emerald-500/70 uppercase mb-1">{zh ? '年化节省' : 'Yearly Savings'}</p>
            <p className="text-2xl font-black text-emerald-400">{fmt(yearly)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{zh ? '实际支付' : 'Actual Paid'}</p>
            <p className="text-sm font-bold text-slate-300">{fmt(actual)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { language } = useLanguage();
  const zh = language === 'zh';
  const texts = translations[language];
  const [, navigate] = useLocation();
  const { getReferralLink, getRebateRate } = useExchangeLinks();

  // ── 滚动监听与章节激活 ──
  const [activeChapter, setActiveChapter] = useState('what-is-rebate');
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
            setActiveChapter(entry.target.id);
          }
        });
      },
      { threshold: [0.3], rootMargin: '-10% 0px -40% 0px' }
    );
    CHAPTERS.forEach((c) => {
      const el = document.getElementById(c.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  useScrollMemory();

  return (
    <div className="min-h-screen bg-background selection:bg-amber-500/30">
      <WelcomeGuide />

      {/* ══════════════════════════════════════════════════════════════════════
          §1 Hero Section
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full -z-10 opacity-20 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-amber-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-600 rounded-full blur-[140px]" />
        </div>

        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">
              {zh ? '2025 币圈省钱终极指南' : 'Ultimate Crypto Saving Guide 2025'}
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.1] mb-8 tracking-tight">
            {zh ? '让你的每一笔交易' : 'Make Every Trade'} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-500 to-orange-500">
              {zh ? '都自带 60% 利润' : 'Return 60% Profit'}
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {texts.hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="w-full sm:w-auto px-8 h-14 rounded-2xl font-black text-base hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#0A192F', boxShadow: '0 8px 24px rgba(255,215,0,0.25)' }}
              onClick={() => navigate('/exchanges')}
            >
              {zh ? '立即开启高额返佣' : 'Start Getting Rebates'}
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto h-14 rounded-2xl text-slate-300 hover:text-white hover:bg-white/5 font-bold"
              onClick={() => document.getElementById('what-is-rebate')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {zh ? '向下深入了解' : 'Learn More Below'}
              <ChevronDown className="ml-2 w-4 h-4 animate-bounce" />
            </Button>
          </div>

          {/* 快速数据展示 */}
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 border-t border-white/5 pt-10">
            {[
              { label: zh ? '最高返佣' : 'Max Rebate', val: '60%', color: 'text-amber-400' },
              { label: zh ? '覆盖平台' : 'Exchanges', val: '5+', color: 'text-white' },
              { label: zh ? '结算速度' : 'Settlement', val: zh ? '实时' : 'Real-time', color: 'text-white' },
              { label: zh ? '安全等级' : 'Security', val: 'Bank-Level', color: 'text-emerald-400' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{item.label}</p>
                <p className={`text-2xl font-black ${item.color}`}>{item.val}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §1 什么是返佣
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="what-is-rebate" className="py-24 px-4 bg-white/[0.02]">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">💡</span>
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
              {zh ? '第一章' : 'Chapter 1'}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-6">
            {texts.whatIsRebate.title}
          </h2>
          <div className="space-y-6 text-slate-400 text-base sm:text-lg leading-relaxed">
            <p>
              {texts.whatIsRebate.p1}
            </p>
            <div className="bg-amber-500/5 border-l-4 border-amber-500 p-6 rounded-r-2xl my-8">
              <p className="text-white font-bold italic">
                {texts.whatIsRebate.highlight}
              </p>
            </div>
            <p>
              {texts.whatIsRebate.p2}
            </p>
          </div>

          {/* 痛点对比 */}
          <div className="mt-12 grid sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20">
              <h4 className="text-red-400 font-black mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {zh ? '传统交易者' : 'Traditional Trader'}
              </h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                {zh ? '手续费全额上缴交易所，长期交易成本占本金 10%-30%，在震荡市中本金被手续费慢慢磨损。' : 'Full fees paid to exchange. Costs can eat 10-30% of capital over time, especially in sideways markets.'}
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
              <h4 className="text-emerald-400 font-black mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {zh ? '返佣交易者' : 'Rebate Trader'}
              </h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                {zh ? '每笔交易即时返还 40%-60% 手续费，相当于交易自带「安全垫」，大幅降低盈亏平衡点。' : '40-60% fees returned instantly. Acts as a safety buffer, significantly lowering your break-even point.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §2 返佣来源
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="rebate-source" className="py-24 px-4 bg-background">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🏦</span>
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
              {zh ? '第二章' : 'Chapter 2'}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-6">
            {texts.rebateSource.title}
          </h2>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed mb-10">
            {texts.rebateSource.subtitle}
          </p>

          <div className="space-y-4">
            {[
              { title: texts.rebateSource.marketing, desc: texts.rebateSource.marketingDesc },
              { title: texts.rebateSource.broker, desc: texts.rebateSource.brokerDesc },
              { title: texts.rebateSource.sharing, desc: texts.rebateSource.sharingDesc },
            ].map((item, i) => (
              <div key={i} className="group p-6 rounded-2xl border border-white/5 bg-white/2 hover:bg-white/4 hover:border-amber-500/20 transition-all">
                <h3 className="text-lg font-black text-white mb-2 group-hover:text-amber-400 transition-colors">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* 流程图简述 */}
          <div className="mt-12 p-8 rounded-3xl border border-dashed border-slate-800 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              <div className="space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center mx-auto text-2xl">🏛️</div>
                <p className="text-xs font-bold text-slate-400">{zh ? '交易所' : 'Exchange'}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-700 rotate-90 sm:rotate-0" />
              <div className="space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto text-2xl border border-amber-500/30">💎</div>
                <p className="text-xs font-bold text-amber-400">Get8 Pro</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-700 rotate-90 sm:rotate-0" />
              <div className="space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 flex items-center justify-center mx-auto text-2xl">👤</div>
                <p className="text-xs font-bold text-slate-400">{zh ? '交易者 (你)' : 'Trader (You)'}</p>
              </div>
            </div>
            <p className="mt-8 text-xs text-slate-600 font-medium">
              {zh ? '交易所拨出营销预算 → Get8 Pro 作为渠道商获得佣金 → 我们将佣金的 80%-90% 返还给你' : 'Exchange allocates budget → Get8 Pro gets commission → We return 80-90% of it to you'}
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §3 机制揭秘
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="mechanism" className="py-24 px-4 bg-white/2">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">⚙️</span>
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
              {zh ? '第三章' : 'Chapter 3'}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-6">
            {texts.mechanism.title}
          </h2>
          <p className="text-slate-400 text-base leading-relaxed mb-10">{texts.mechanism.subtitle}</p>

          <div className="space-y-6">
            {[
              { icon: <Users className="w-6 h-6" />, step: '01', title: texts.mechanism.registration.title, desc: texts.mechanism.registration.desc },
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
          §5 实战案例
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="case-study" className="py-24 px-4 bg-white/2">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">📊</span>
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
              {zh ? '第五章' : 'Chapter 5'}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-8">
            {zh ? '实战案例：返佣到底能省多少？' : 'Case Study: How Much Can You Save?'}
          </h2>

          <FeeCalculator zh={zh} />

          <div className="mt-12 grid sm:grid-cols-2 gap-6">
            <div className="bg-white/3 p-6 rounded-2xl border border-white/10">
              <h4 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {zh ? '无返佣用户' : 'No Rebate User'}
              </h4>
              <ul className="space-y-3 text-xs text-slate-400">
                <li>• {zh ? '支付 100% 手续费' : 'Pays 100% fees'}</li>
                <li>• {zh ? '交易成本极高，难以覆盖滑点' : 'High costs, hard to cover slippage'}</li>
                <li>• {zh ? '长期交易导致本金缓慢流失' : 'Slow capital erosion over time'}</li>
              </ul>
            </div>
            <div className="bg-amber-500/5 p-6 rounded-2xl border border-amber-500/20">
              <h4 className="text-sm font-black text-amber-400 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                {zh ? 'Get8 Pro 返佣用户' : 'Get8 Pro Rebate User'}
              </h4>
              <ul className="space-y-3 text-xs text-slate-300">
                <li>• {zh ? '仅支付 40% 实际手续费' : 'Pays only 40% actual fees'}</li>
                <li>• {zh ? '每笔交易即时获得现金返还' : 'Instant cash back on every trade'}</li>
                <li>• {zh ? '省下的钱就是纯利润' : 'Saved money is pure profit'}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §6 全场景覆盖
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="scenarios" className="py-24 px-4 bg-background">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="text-2xl">🌐</span>
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
              {zh ? '第六章' : 'Chapter 6'}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            {zh ? '全场景覆盖' : 'All Scenarios Covered'}
          </h2>
          <p className="text-slate-400 mb-12">{zh ? '无论你玩什么，返佣都能帮你省钱' : 'No matter what you trade, rebates save you money'}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: '📈', title: zh ? '现货交易' : 'Spot', desc: zh ? '长线持仓必备' : 'For long-term' },
              { icon: '⚡', title: zh ? '合约杠杆' : 'Futures', desc: zh ? '高频交易救星' : 'For high-freq' },
              { icon: '🤖', title: zh ? '量化网格' : 'Grid Bot', desc: zh ? '大幅提升胜率' : 'Boost win rate' },
              { icon: '💎', title: zh ? '新币申购' : 'Launchpad', desc: zh ? '降低参与门槛' : 'Lower entry' },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl border border-white/10 bg-white/3 hover:border-amber-500/30 transition-all group">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{item.icon}</div>
                <h4 className="text-sm font-black text-white mb-1">{item.title}</h4>
                <p className="text-[10px] text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §7 如何获得返佣
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="how-to-get" className="py-24 px-4 bg-white/2">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🎁</span>
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
              {zh ? '第七章' : 'Chapter 7'}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-10">
            {zh ? '如何开始获得返佣？' : 'How to Start Getting Rebates?'}
          </h2>

          <div className="grid sm:grid-cols-2 gap-8 mb-12">
            {/* 新用户 */}
            <div className="bg-white/3 p-6 rounded-2xl border border-amber-500/20">
              <div className="text-3xl mb-3">🆕</div>
              <h3 className="text-lg font-black text-amber-400 mb-5">{texts.comparison.newUser}</h3>
              {[texts.comparison.step1New, texts.comparison.step2New, texts.comparison.step3New].map((step, i) => (
                <div key={i} className="flex items-start gap-3 mb-4 last:mb-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5" style={{ background: 'rgba(255,215,0,0.12)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.25)' }}>{i + 1}</div>
                  <p className="text-slate-300 text-sm leading-relaxed">{step}</p>
                </div>
              ))}
              <button
                onClick={() => navigate('/exchanges')}
                className="w-full mt-6 py-3 rounded-xl bg-amber-500 text-[#0A192F] font-black text-sm hover:bg-amber-400 transition-colors"
              >
                {zh ? '查看交易所注册链接' : 'View Registration Links'}
              </button>
            </div>

            {/* 老用户 */}
            <div className="bg-white/3 p-6 rounded-2xl border border-white/10">
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="text-lg font-black text-white mb-5">{texts.comparison.oldUser}</h3>
              {[texts.comparison.step1Old, texts.comparison.step2Old, texts.comparison.step3Old].map((step, i) => (
                <div key={i} className="flex items-start gap-3 mb-4 last:mb-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5" style={{ background: 'rgba(255,255,255,0.08)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.15)' }}>{i + 1}</div>
                  <p className="text-slate-400 text-sm leading-relaxed">{step}</p>
                </div>
              ))}
              <button
                onClick={() => navigate('/contact')}
                className="w-full mt-6 py-3 rounded-xl bg-white/10 text-white font-black text-sm hover:bg-white/20 transition-colors border border-white/10"
              >
                {zh ? '联系我们协助迁移' : 'Contact Us for Migration'}
              </button>
            </div>
          </div>

          {/* 交易所快速入口 */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {['gate', 'okx', 'binance', 'bybit', 'bitget'].map((slug) => (
              <a
                key={slug}
                href={getReferralLink(slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-4 rounded-2xl bg-white/3 border border-white/5 hover:border-amber-500/30 hover:bg-white/5 transition-all group"
              >
                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{EXCHANGE_META[slug].emoji}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{slug}</span>
                <span className="text-xs font-bold text-amber-400 mt-1">{getRebateRate(slug)} {zh ? '返佣' : 'Rebate'}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §8 总结与行动
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="action" className="py-32 px-4 bg-background relative overflow-hidden">
        {/* 底部装饰 */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-64 bg-amber-500/5 blur-[120px] -z-10" />

        <div className="container mx-auto max-w-3xl text-center">
          <div className="inline-block p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 mb-8">
            <Zap className="w-8 h-8 text-amber-400 fill-amber-400" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 leading-tight">
            {texts.summary.title}
          </h2>
          <p className="text-lg text-slate-400 mb-12 leading-relaxed">
            {texts.summary.subtitle}
          </p>

          {/* 核心价值点 */}
          <div className="grid sm:grid-cols-3 gap-6 mb-16">
            {[
              { title: zh ? '零成本' : 'Zero Cost', sub: zh ? '无需支付任何额外费用' : 'No extra fees' },
              { title: zh ? '高收益' : 'High Return', sub: zh ? '省下的每一分都是利润' : 'Every cent is profit' },
              { title: zh ? '全自动' : 'Automated', sub: zh ? '系统自动结算，省心省力' : 'Auto settlement' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-amber-400" />
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Button
              size="lg"
              className="font-black hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#0A192F', boxShadow: '0 4px 20px rgba(255,215,0,0.3)' }}
              onClick={() => navigate('/contact')}
            >
              {texts.summary.contactBtn}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 font-bold"
              onClick={() => navigate('/exchanges')}
            >
              {zh ? '查看交易所返佣对比' : 'View Exchange Rebate Comparison'}
            </Button>
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
      <footer className="py-12 px-4 border-t" style={{ background: 'rgba(10,25,47,0.98)', borderColor: 'rgba(255,215,0,0.1)' }}>
        <div className="container mx-auto text-center max-w-2xl">
          <h3 className="text-xl font-black text-white mb-2">
            {zh ? '让每一笔交易都更具价值' : 'Make Every Trade More Valuable'}
          </h3>
          <p className="text-slate-500 mb-8 text-sm">
            {zh ? '智慧交易，从省钱开始' : 'Smart Trading Starts with Savings'}
          </p>
          <div className="flex justify-center flex-wrap gap-6 text-sm mb-6">
            <button onClick={() => navigate('/exchanges')} className="text-slate-500 hover:text-amber-400 transition font-medium">{texts.nav.exchanges}</button>
            <button onClick={() => navigate('/exchange-download')} className="text-slate-500 hover:text-amber-400 transition font-medium">{zh ? '下载指南' : 'Download Guide'}</button>
            <button onClick={() => navigate('/exchange-guide')} className="text-slate-500 hover:text-amber-400 transition font-medium">{zh ? '交易所扫盲' : 'Exchange Guide'}</button>
            <button onClick={() => navigate('/contact')} className="text-slate-500 hover:text-amber-400 transition font-medium">{texts.nav.contact}</button>
            <button onClick={() => navigate('/beginner')} className="text-slate-500 hover:text-amber-400 transition font-medium">{texts.nav.beginnerGuide}</button>
          </div>
          <p className="text-slate-700 text-xs">
            {zh ? '祝您在币圈稳健获利，财富自由！' : 'Wishing you stable profits and financial freedom in crypto!'}
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
