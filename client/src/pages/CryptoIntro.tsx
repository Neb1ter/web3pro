import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useExchangeLinks } from '@/contexts/ExchangeLinksContext';
import { useScrollMemory, goBack } from "@/hooks/useScrollMemory";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ArrowLeft, TrendingUp, TrendingDown, ChevronRight,
  Clock, Globe, Zap, Shield, BarChart2, RefreshCw,
  CheckCircle2, AlertTriangle, Trophy
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Candle = { open: number; high: number; low: number; close: number };
type Direction = "long" | "short" | null;

// ─── Random K-line generator ──────────────────────────────────────────────────
function generateCandles(count: number, startPrice: number): Candle[] {
  const candles: Candle[] = [];
  let price = startPrice;
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.48) * price * 0.025;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * price * 0.01;
    const low = Math.min(open, close) - Math.random() * price * 0.01;
    candles.push({ open, high, low, close });
    price = close;
  }
  return candles;
}

// ─── SVG Candlestick Chart ────────────────────────────────────────────────────
function CandlestickChart({
  candles,
  width = 480,
  height = 180,
  highlightLast = false,
}: {
  candles: Candle[];
  width?: number;
  height?: number;
  highlightLast?: boolean;
}) {
  if (!candles.length) return null;
  const pad = { top: 10, bottom: 20, left: 8, right: 8 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const allPrices = candles.flatMap((c) => [c.high, c.low]);
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const range = maxP - minP || 1;
  const toY = (p: number) => pad.top + chartH - ((p - minP) / range) * chartH;
  const candleW = Math.max(3, (chartW / candles.length) * 0.6);
  const gap = chartW / candles.length;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ maxHeight: height }}
    >
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={pad.left}
          x2={width - pad.right}
          y1={pad.top + chartH * (1 - t)}
          y2={pad.top + chartH * (1 - t)}
          stroke="#ffffff18"
          strokeWidth={0.5}
        />
      ))}
      {/* Candles */}
      {candles.map((c, i) => {
        const x = pad.left + i * gap + gap / 2;
        const isGreen = c.close >= c.open;
        const color = isGreen ? "#22c55e" : "#ef4444";
        const isLast = highlightLast && i === candles.length - 1;
        const bodyTop = toY(Math.max(c.open, c.close));
        const bodyBot = toY(Math.min(c.open, c.close));
        const bodyH = Math.max(1, bodyBot - bodyTop);
        return (
          <g key={i}>
            {/* Wick */}
            <line
              x1={x}
              x2={x}
              y1={toY(c.high)}
              y2={toY(c.low)}
              stroke={isLast ? "#FFD700" : color}
              strokeWidth={isLast ? 2 : 1}
            />
            {/* Body */}
            <rect
              x={x - candleW / 2}
              y={bodyTop}
              width={candleW}
              height={bodyH}
              fill={isLast ? "#FFD700" : color}
              opacity={isLast ? 1 : 0.85}
              rx={1}
            />
          </g>
        );
      })}
      {/* Price labels */}
      <text x={width - pad.right + 2} y={pad.top + 4} fill="#ffffff60" fontSize={8}>
        {maxP.toFixed(0)}
      </text>
      <text x={width - pad.right + 2} y={height - pad.bottom + 4} fill="#ffffff60" fontSize={8}>
        {minP.toFixed(0)}
      </text>
    </svg>
  );
}

// ─── Comparison data ──────────────────────────────────────────────────────────
const COMPARISONS_ZH = [
  {
    icon: <Clock size={28} className="text-accent" />,
    title: "交易时间",
    crypto: "7×24 小时不间断，节假日照常",
    trad: "工作日 9:30–15:00，节假日休市",
    winner: "crypto",
  },
  {
    icon: <Globe size={28} className="text-accent" />,
    title: "全球准入",
    crypto: "无国界，手机即可开户，5 分钟完成",
    trad: "需要本地券商账户，开户流程繁琐",
    winner: "crypto",
  },
  {
    icon: <Zap size={28} className="text-accent" />,
    title: "杠杆倍数",
    crypto: "最高 125x 杠杆，小资金撬动大收益",
    trad: "股票通常 1–2x，期货 5–10x",
    winner: "crypto",
  },
  {
    icon: <TrendingDown size={28} className="text-accent" />,
    title: "做空机制",
    crypto: "随时做空任意币种，下跌也能盈利",
    trad: "做空门槛高，需要融券，成本高",
    winner: "crypto",
  },
  {
    icon: <BarChart2 size={28} className="text-accent" />,
    title: "波动幅度",
    crypto: "日波动 5–20%，机会更多",
    trad: "A 股涨跌停 ±10%，波动受限",
    winner: "crypto",
  },
  {
    icon: <Shield size={28} className="text-accent" />,
    title: "资产透明度",
    crypto: "链上可查，储备率公开可验证",
    trad: "依赖监管机构，信息不对称",
    winner: "crypto",
  },
];

const COMPARISONS_EN = [
  {
    icon: <Clock size={28} className="text-accent" />,
    title: "Trading Hours",
    crypto: "24/7 non-stop, including holidays",
    trad: "Weekdays 9:30–15:00, closed on holidays",
    winner: "crypto",
  },
  {
    icon: <Globe size={28} className="text-accent" />,
    title: "Global Access",
    crypto: "Borderless, open account in 5 min on mobile",
    trad: "Requires local broker, complex onboarding",
    winner: "crypto",
  },
  {
    icon: <Zap size={28} className="text-accent" />,
    title: "Leverage",
    crypto: "Up to 125x leverage, small capital big gains",
    trad: "Stocks 1–2x, futures 5–10x",
    winner: "crypto",
  },
  {
    icon: <TrendingDown size={28} className="text-accent" />,
    title: "Short Selling",
    crypto: "Short any coin anytime, profit from drops",
    trad: "High barrier, requires margin lending",
    winner: "crypto",
  },
  {
    icon: <BarChart2 size={28} className="text-accent" />,
    title: "Volatility",
    crypto: "5–20% daily swings, more opportunities",
    trad: "A-shares ±10% limit, restricted movement",
    winner: "crypto",
  },
  {
    icon: <Shield size={28} className="text-accent" />,
    title: "Transparency",
    crypto: "On-chain verifiable, public reserve ratios",
    trad: "Relies on regulators, information asymmetry",
    winner: "crypto",
  },
];

// ─── Coin options ─────────────────────────────────────────────────────────────
const COINS = [
  { slug: "btc", name: "BTC/USDT", price: 67000, emoji: "₿", color: "#F7931A" },
  { slug: "eth", name: "ETH/USDT", price: 3500, emoji: "Ξ", color: "#627EEA" },
  { slug: "sol", name: "SOL/USDT", price: 180, emoji: "◎", color: "#9945FF" },
  { slug: "bnb", name: "BNB/USDT", price: 580, emoji: "⬡", color: "#F3BA2F" },
];
const LEVERAGES = [5, 10, 20, 50, 100];
const AMOUNTS = [100, 500, 1000, 5000];

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CryptoIntro() {
  const [, navigate] = useLocation();
  useScrollMemory();
  const { language } = useLanguage();
  const zh = language === "zh";
  const comparisons = zh ? COMPARISONS_ZH : COMPARISONS_EN;

  // ── Simulator state ──
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [coinIdx, setCoinIdx] = useState(0);
  const [leverage, setLeverage] = useState(10);
  const [amount, setAmount] = useState(100);
  const [direction, setDirection] = useState<Direction>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [resultCandles, setResultCandles] = useState<Candle[]>([]);
  const [pnl, setPnl] = useState(0);
  const [pnlPct, setPnlPct] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { allLinks: exchangeLinks, getReferralLink } = useExchangeLinks();

  // Generate initial candles when coin changes
  useEffect(() => {
    const coin = COINS[coinIdx];
    setCandles(generateCandles(30, coin.price));
  }, [coinIdx]);

  // Reset simulator
  const resetSim = useCallback(() => {
    setStep(1);
    setDirection(null);
    setPnl(0);
    setPnlPct(0);
    setIsAnimating(false);
    const coin = COINS[coinIdx];
    setCandles(generateCandles(30, coin.price));
    setResultCandles([]);
  }, [coinIdx]);

  // Run simulation
  const runSimulation = useCallback((dir: Direction) => {
    setDirection(dir);
    setIsAnimating(true);

    const coin = COINS[coinIdx];
    const baseCandles = generateCandles(30, coin.price);
    setCandles(baseCandles);

    // Generate 10 more candles after entry
    setTimeout(() => {
      const entryPrice = baseCandles[baseCandles.length - 1].close;
      const extraCandles = generateCandles(10, entryPrice);
      const allCandles = [...baseCandles, ...extraCandles];
      setResultCandles(allCandles);

      const exitPrice = extraCandles[extraCandles.length - 1].close;
      const priceChange = (exitPrice - entryPrice) / entryPrice;
      const leveragedChange = priceChange * leverage;
      const rawPnl = dir === "long" ? leveragedChange : -leveragedChange;
      const dollarPnl = amount * rawPnl;
      const pnlPercent = rawPnl * 100;

      setPnl(dollarPnl);
      setPnlPct(pnlPercent);
      setIsAnimating(false);
      setStep(4);
    }, 1200);
  }, [coinIdx, leverage, amount]);

  const coin = COINS[coinIdx];
  const isWin = pnl > 0;

  // Gate link for CTA
  const gateLink = getReferralLink("gate");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Top Nav ── */}
      <nav className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={goBack} className="text-muted-foreground hover:text-foreground gap-1">
          <ArrowLeft size={16} />
          {zh ? "返回上一页" : "Back"}
        </Button>
        <h1 className="text-sm font-bold text-accent truncate">
          {zh ? "🔥 新手互动指南" : "🔥 Beginner Interactive Guide"}
        </h1>
        <div className="w-20" />
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-12">

        {/* ── Hero ── */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-accent/20 text-accent text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider">
            <span className="animate-pulse">●</span>
            {zh ? "完全免费 · 无需注册" : "100% Free · No Registration"}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            {zh ? "币圈交易 vs 传统交易" : "Crypto Trading vs Traditional Trading"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {zh
              ? "3 分钟了解核心差异，再亲手模拟一笔永续合约，感受杠杆的魔力"
              : "3 min to understand the key differences, then simulate a perpetual contract trade"}
          </p>
        </div>

        {/* ── Part 1: Comparison Table ── */}
        <section>
          <h2 className="text-2xl font-bold text-accent mb-6 flex items-center gap-2">
            <span className="bg-accent text-accent-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">1</span>
            {zh ? "核心差异对比" : "Key Differences"}
          </h2>

          {/* Header */}
          <div className="grid grid-cols-3 gap-3 mb-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
            <div>{zh ? "对比项" : "Category"}</div>
            <div className="text-accent">{zh ? "🪙 币圈" : "🪙 Crypto"}</div>
            <div>{zh ? "📈 传统市场" : "📈 Traditional"}</div>
          </div>

          <div className="space-y-3">
            {comparisons.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-3 gap-3 bg-card border border-border rounded-xl p-4 items-start hover:border-accent/50 transition"
              >
                <div className="flex flex-col items-center gap-1 text-center">
                  {item.icon}
                  <span className="text-xs font-semibold text-white">{item.title}</span>
                </div>
                <div className="bg-accent/10 rounded-lg p-3 text-xs text-accent font-medium leading-relaxed flex items-start gap-1">
                  <CheckCircle2 size={12} className="shrink-0 mt-0.5" />
                  {item.crypto}
                </div>
                <div className="bg-card/50 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed flex items-start gap-1">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5 text-yellow-500/60" />
                  {item.trad}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-accent/10 border border-accent/40 rounded-xl p-4 text-center">
            <p className="text-accent font-bold text-lg">
              {zh ? "💡 币圈独有优势：做多做空都能赚，24 小时随时交易" : "💡 Crypto exclusive: profit from both rises and falls, trade 24/7"}
            </p>
          </div>
        </section>

        {/* ── Part 2: Perpetual Contract Explainer ── */}
        <section>
          <h2 className="text-2xl font-bold text-accent mb-6 flex items-center gap-2">
            <span className="bg-accent text-accent-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">2</span>
            {zh ? "什么是永续合约？" : "What is a Perpetual Contract?"}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: "🔄",
                title: zh ? "永不到期" : "Never Expires",
                desc: zh ? "不像期货有到期日，永续合约可以无限期持有，随时开平仓" : "Unlike futures, perpetual contracts have no expiry date — hold as long as you want",
              },
              {
                icon: "⚡",
                title: zh ? "杠杆放大" : "Leverage Amplified",
                desc: zh ? "用 100 USDT 开 10x 杠杆，等于控制 1000 USDT 的仓位，收益和亏损同步放大" : "With $100 and 10x leverage, you control $1,000 position — gains and losses are amplified",
              },
              {
                icon: "📉",
                title: zh ? "双向交易" : "Two-Way Trading",
                desc: zh ? "做多（Long）= 看涨，价格上涨盈利；做空（Short）= 看跌，价格下跌盈利" : "Long = bullish, profit when price rises; Short = bearish, profit when price falls",
              },
              {
                icon: "🛡️",
                title: zh ? "强制平仓" : "Liquidation",
                desc: zh ? "亏损超过保证金时触发强平，最多亏损本金，不会倒欠交易所" : "Forced close when losses exceed margin — you can only lose your initial capital",
              },
            ].map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5 flex gap-4">
                <div className="text-3xl shrink-0">{item.icon}</div>
                <div>
                  <h3 className="font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Part 3: Interactive Simulator ── */}
        <section>
          <h2 className="text-2xl font-bold text-accent mb-2 flex items-center gap-2">
            <span className="bg-accent text-accent-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">3</span>
            {zh ? "亲手模拟一笔交易" : "Simulate a Trade Yourself"}
          </h2>
          <p className="text-muted-foreground mb-6 text-sm">
            {zh ? "以下为模拟环境，数据随机生成，不代表真实市场" : "Simulated environment only — random data, not real market"}
          </p>

          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                  step > s ? "bg-accent text-accent-foreground" :
                  step === s ? "bg-accent text-accent-foreground ring-4 ring-accent/30" :
                  "bg-card border border-border text-muted-foreground"
                }`}>
                  {step > s ? <CheckCircle2 size={16} /> : s}
                </div>
                <div className={`text-xs font-medium ${step >= s ? "text-white" : "text-muted-foreground"}`}>
                  {s === 1 ? (zh ? "选币种" : "Choose Coin") :
                   s === 2 ? (zh ? "设置仓位" : "Set Position") :
                   (zh ? "开仓方向" : "Direction")}
                </div>
                {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? "bg-accent" : "bg-border"}`} />}
              </div>
            ))}
          </div>

          {/* K-line chart */}
          <div className="bg-card border border-border rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{coin.emoji}</span>
                <div>
                  <div className="font-bold text-white">{coin.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {zh ? "参考价" : "Ref Price"}: ${coin.price.toLocaleString()}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCandles(generateCandles(30, coin.price));
                  setResultCandles([]);
                  if (step === 4) setStep(3);
                }}
                className="text-muted-foreground hover:text-accent gap-1"
              >
                <RefreshCw size={14} />
                {zh ? "换一张" : "Refresh"}
              </Button>
            </div>
            <CandlestickChart
              candles={resultCandles.length > 0 ? resultCandles : candles}
              highlightLast={step === 4}
            />
            {step === 4 && (
              <div className="mt-2 text-center text-xs text-accent/70">
                {zh ? "↑ 金色蜡烛 = 您的平仓点" : "↑ Gold candle = your exit point"}
              </div>
            )}
          </div>

          {/* Step 1: Choose Coin */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-white text-lg">
                {zh ? "第一步：选择交易币种" : "Step 1: Choose a Coin"}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {COINS.map((c, i) => (
                  <button
                    key={c.slug}
                    onClick={() => setCoinIdx(i)}
                    className={`p-4 rounded-xl border-2 text-left transition ${
                      coinIdx === i
                        ? "border-accent bg-accent/10"
                        : "border-border bg-card hover:border-accent/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{c.emoji}</span>
                      <div>
                        <div className="font-bold text-white">{c.name}</div>
                        <div className="text-xs text-muted-foreground">
                          ≈ ${c.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold py-6 text-lg"
                onClick={() => setStep(2)}
              >
                {zh ? "已选择，下一步 →" : "Confirm & Next →"}
                <ChevronRight size={20} className="ml-1" />
              </Button>
            </div>
          )}

          {/* Step 2: Leverage & Amount */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="font-bold text-white text-lg">
                {zh ? "第二步：设置杠杆和开仓金额" : "Step 2: Set Leverage & Amount"}
              </h3>

              {/* Leverage */}
              <div>
                <label className="text-sm text-muted-foreground mb-3 block">
                  {zh ? "选择杠杆倍数" : "Choose Leverage"}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {LEVERAGES.map((lv) => (
                    <button
                      key={lv}
                      onClick={() => setLeverage(lv)}
                      className={`px-4 py-2 rounded-lg border font-bold text-sm transition ${
                        leverage === lv
                          ? "border-accent bg-accent/20 text-accent"
                          : "border-border bg-card text-muted-foreground hover:border-accent/50"
                      }`}
                    >
                      {lv}x
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {zh
                    ? `${leverage}x 杠杆：投入 $${amount} → 控制 $${(amount * leverage).toLocaleString()} 仓位`
                    : `${leverage}x leverage: $${amount} controls $${(amount * leverage).toLocaleString()} position`}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-sm text-muted-foreground mb-3 block">
                  {zh ? "开仓金额（USDT）" : "Position Size (USDT)"}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setAmount(amt)}
                      className={`px-4 py-2 rounded-lg border font-bold text-sm transition ${
                        amount === amt
                          ? "border-accent bg-accent/20 text-accent"
                          : "border-border bg-card text-muted-foreground hover:border-accent/50"
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{zh ? "保证金" : "Margin"}</span>
                  <span className="text-white font-bold">${amount} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{zh ? "杠杆" : "Leverage"}</span>
                  <span className="text-accent font-bold">{leverage}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{zh ? "控制仓位" : "Position"}</span>
                  <span className="text-white font-bold">${(amount * leverage).toLocaleString()} USDT</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  {zh ? "← 上一步" : "← Back"}
                </Button>
                <Button
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 font-bold py-6"
                  onClick={() => setStep(3)}
                >
                  {zh ? "下一步 →" : "Next →"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Direction */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="font-bold text-white text-lg">
                {zh ? "第三步：选择开仓方向" : "Step 3: Choose Direction"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {zh
                  ? "看涨选做多（Long），看跌选做空（Short）。K 线图已随机生成，结果完全随机！"
                  : "Bullish? Go Long. Bearish? Go Short. The K-line is randomly generated — result is random!"}
              </p>

              {isAnimating ? (
                <div className="text-center py-12 space-y-3">
                  <div className="text-4xl animate-bounce">📊</div>
                  <p className="text-accent font-bold animate-pulse">
                    {zh ? "模拟行情中..." : "Simulating market..."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => runSimulation("long")}
                    className="bg-green-500/10 border-2 border-green-500/50 hover:border-green-500 rounded-xl p-6 text-center transition group"
                  >
                    <TrendingUp size={40} className="text-green-400 mx-auto mb-3 group-hover:scale-110 transition" />
                    <div className="text-xl font-bold text-green-400">{zh ? "做多 Long" : "Long ↑"}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {zh ? "看涨，价格上涨盈利" : "Bullish, profit when price rises"}
                    </div>
                  </button>
                  <button
                    onClick={() => runSimulation("short")}
                    className="bg-red-500/10 border-2 border-red-500/50 hover:border-red-500 rounded-xl p-6 text-center transition group"
                  >
                    <TrendingDown size={40} className="text-red-400 mx-auto mb-3 group-hover:scale-110 transition" />
                    <div className="text-xl font-bold text-red-400">{zh ? "做空 Short" : "Short ↓"}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {zh ? "看跌，价格下跌盈利" : "Bearish, profit when price falls"}
                    </div>
                  </button>
                </div>
              )}

              <Button variant="outline" className="w-full" onClick={() => setStep(2)}>
                {zh ? "← 上一步" : "← Back"}
              </Button>
            </div>
          )}

          {/* Step 4: Result */}
          {step === 4 && (
            <div className="space-y-6">
              {/* PnL Card */}
              <div className={`rounded-2xl p-6 text-center border-2 ${
                isWin
                  ? "bg-green-500/10 border-green-500/50"
                  : "bg-red-500/10 border-red-500/50"
              }`}>
                <div className="text-5xl mb-3">{isWin ? "🎉" : "😅"}</div>
                <div className="text-sm text-muted-foreground mb-1">
                  {zh ? "模拟盈亏结果" : "Simulated P&L Result"}
                </div>
                <div className={`text-4xl font-bold mb-2 ${isWin ? "text-green-400" : "text-red-400"}`}>
                  {isWin ? "+" : ""}{pnl.toFixed(2)} USDT
                </div>
                <div className={`text-lg font-semibold ${isWin ? "text-green-400" : "text-red-400"}`}>
                  {isWin ? "+" : ""}{pnlPct.toFixed(1)}%
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-background/40 rounded-lg p-2">
                    <div className="text-muted-foreground text-xs">{zh ? "方向" : "Direction"}</div>
                    <div className={`font-bold ${direction === "long" ? "text-green-400" : "text-red-400"}`}>
                      {direction === "long" ? (zh ? "做多" : "Long") : (zh ? "做空" : "Short")}
                    </div>
                  </div>
                  <div className="bg-background/40 rounded-lg p-2">
                    <div className="text-muted-foreground text-xs">{zh ? "杠杆" : "Leverage"}</div>
                    <div className="font-bold text-accent">{leverage}x</div>
                  </div>
                  <div className="bg-background/40 rounded-lg p-2">
                    <div className="text-muted-foreground text-xs">{zh ? "投入" : "Invested"}</div>
                    <div className="font-bold text-white">${amount}</div>
                  </div>
                </div>
              </div>

              {/* Insight */}
              <div className="bg-card border border-border rounded-xl p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-white mb-1">
                  {zh ? "💡 这说明了什么？" : "💡 What does this show?"}
                </p>
                <p>
                  {zh
                    ? `您用 $${amount} 的保证金，通过 ${leverage}x 杠杆控制了 $${(amount * leverage).toLocaleString()} 的仓位。这就是永续合约的魔力——小资金也能参与大行情。当然，杠杆是双刃剑，实际交易请做好风险管理。`
                    : `You used $${amount} margin with ${leverage}x leverage to control a $${(amount * leverage).toLocaleString()} position. This is the power of perpetual contracts — small capital, big exposure. Remember: leverage cuts both ways, always manage your risk.`}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 gap-2" onClick={resetSim}>
                  <RefreshCw size={16} />
                  {zh ? "再来一次" : "Try Again"}
                </Button>
                <Button
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 font-bold gap-2"
                  onClick={() => window.open(gateLink, "_blank")}
                >
                  <Trophy size={16} />
                  {zh ? "去真实交易 →" : "Real Trading →"}
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* ── CTA: Register ── */}
        <section className="bg-gradient-to-br from-[#0f2744] to-[#1a3a5c] border-2 border-accent/40 rounded-2xl p-8 text-center space-y-4">
          <div className="text-4xl">🚀</div>
          <h2 className="text-2xl font-bold text-white">
            {zh ? "准备好了？开始真实交易" : "Ready? Start Real Trading"}
          </h2>
          <p className="text-muted-foreground">
            {zh
              ? "通过我们的邀请链接注册，立享高额返佣，每笔交易都在省钱"
              : "Register via our referral link and enjoy high rebates on every trade"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg px-8"
              onClick={() => window.open(gateLink, "_blank")}
            >
              {zh ? "注册 Gate.io（推荐）" : "Register Gate.io (Recommended)"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-accent/60 text-accent hover:bg-accent/10"
              onClick={() => navigate("/exchanges")}
            >
              {zh ? "查看全部交易所" : "All Exchanges"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {zh ? "邀请码：GETITPRO（全平台统一）" : "Invite code: GETITPRO (all exchanges)"}
          </p>
        </section>

      </div>
    </div>
  );
}
