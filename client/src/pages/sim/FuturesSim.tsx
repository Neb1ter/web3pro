/**
 * FuturesSim — 合约交易模拟器（重构版）
 * 参考 OKX 移动端合约界面
 * 修复：爆仓记录历史、加仓合并均价、图表显示加权均价/爆仓线
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, RefreshCw, Info, X, ChevronDown, AlertTriangle } from "lucide-react";
import {
  CandleChart, OrderBook, PositionCard, TpSlModal, Toast, EmptyHint, HistoryTab, ResetConfirmModal, PercentSlider,
  initCandles, nextCandle, calcEMA, genBook, useDeferredMount,
  type Candle, type Position, type LimitOrder,
} from "./SimComponents";
import { useLocalHistory } from "./SimComponents";

const INITIAL_BALANCE = 10000;
const TICK_MS = 1000;
const LEVERAGES = [1, 3, 5, 10, 20, 50, 100, 200];
const MARGIN_MODES = ["全仓", "逐仓"] as const;
const INIT_PRICE = 65000;
const INITIAL_CANDLE_COUNT = 60;

export default function FuturesSim() {
  const [, navigate] = useLocation();

  const [candles,      setCandles]      = useState(() => initCandles(INITIAL_CANDLE_COUNT, INIT_PRICE));
  const [currentPrice, setCurrentPrice] = useState(INIT_PRICE);
  const [openPrice]                     = useState(INIT_PRICE);
  const [book,         setBook]         = useState(() => genBook(INIT_PRICE));
  const [balance,      setBalance]      = useState(INITIAL_BALANCE);
  const [positions,    setPositions]    = useState<Position[]>([]);
  const [limitOrders,  setLimitOrders]  = useState<LimitOrder[]>([]);
  const [mode,         setMode]         = useState<"open" | "close">("open");
  const [marginMode,   setMarginMode]   = useState<typeof MARGIN_MODES[number]>("全仓");
  const [leverage,     setLeverage]     = useState(20);
  const [orderType,    setOrderType]    = useState<"market" | "limit">("market");
  const [limitPrice,   setLimitPrice]   = useState("");
  const [amountInput,  setAmountInput]  = useState("");
  const [sliderPct,    setSliderPct]    = useState(0);
  const [paused,       setPaused]       = useState(false);
  const [speed,        setSpeed]        = useState(1);
  const [msg,          setMsg]          = useState<{ text: string; ok: boolean } | null>(null);
  const [drawerTab,    setDrawerTab]    = useState<"positions" | "orders" | "assets" | "history">("positions");
  const [showLeverage, setShowLeverage] = useState(false);
  const [showTip,      setShowTip]      = useState(false);
  const [chartH,       setChartH]       = useState(170);
  const [timeframe,    setTimeframe]    = useState("1时");
  const [tpSlPos,      setTpSlPos]      = useState<Position | null>(null);
  const orderBookReady                  = useDeferredMount(120);
  const [showReset,    setShowReset]    = useState(false);
  const [openedAt,     setOpenedAt]     = useState<Record<number, number>>({});
  // 价格偏向：开多/开空时约 70% 朝有利方向偏，30% 不利，有亏有赢更真实
  const [priceBias,    setPriceBias]    = useState(0);
  // 首次开仓后自动滚动到仓位区域
  const drawerRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  const { records: historyRecords, addRecord: addHistory, resetRecords: resetHistory } = useLocalHistory("futures");

  const posIdRef  = useRef(0);
  const ordIdRef  = useRef(0);
  const tickRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const upd = () => setChartH(Math.max(130, Math.min(190, window.innerHeight * 0.22)));
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);

  const scrollToDrawer = () => {
    if (!hasScrolled.current && drawerRef.current) {
      hasScrolled.current = true;
      setTimeout(() => {
        drawerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  };

  // 全仓/逐仓爆仓价计算
  // 逐仓：只用该仓位保证金，爆仓价更近
  // 全仓：共享账户余额，爆仓价更远（简化为 0.95 系数）
  const calcLiqPrice = (dir: "long" | "short", price: number, lev: number, mode: typeof MARGIN_MODES[number]) => {
    const safetyFactor = mode === "逐仓" ? 0.9 : 0.95;
    return dir === "long"
      ? price * (1 - 1 / lev * safetyFactor)
      : price * (1 + 1 / lev * safetyFactor);
  };

  // 加权平均爆仓价（全仓模式下，多个同方向仓位共享保证金）
  const calcMergedLiqPrice = (
    dir: "long" | "short",
    avgEntry: number,
    totalSize: number,
    totalMargin: number,
    lev: number,
    mode: typeof MARGIN_MODES[number]
  ) => {
    if (mode === "逐仓") {
      // 逐仓：各自独立，用加权均价重算
      const safetyFactor = 0.9;
      return dir === "long"
        ? avgEntry * (1 - 1 / lev * safetyFactor)
        : avgEntry * (1 + 1 / lev * safetyFactor);
    } else {
      // 全仓：爆仓价 = 均价 ± 保证金/持仓量（简化模型）
      const safetyFactor = 0.95;
      return dir === "long"
        ? avgEntry * (1 - 1 / lev * safetyFactor)
        : avgEntry * (1 + 1 / lev * safetyFactor);
    }
  };

  const showMsg = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 2500);
  };

  const tick = useCallback(() => {
    setCandles(prev => {
      const last = prev[prev.length - 1];
      const c = nextCandle(last.close, priceBias);
      const price = c.close;
      setCurrentPrice(price);
      setBook(genBook(price));

      // 爆仓检查 — 爆仓时记录历史
      setPositions(ps => {
        const surviving: Position[] = [];
        for (const p of ps) {
          const isLiquidated =
            (p.direction === "long" && price <= p.liquidPrice) ||
            (p.direction === "short" && price >= p.liquidPrice);

          if (isLiquidated) {
            // 爆仓：损失全部保证金，PnL = -margin
            const pnl = -p.margin;
            const pnlPct = -100;
            showMsg("⚠️ 仓位已爆仓，损失全部保证金", false);
            // 记录爆仓历史
            addHistory({
              simType: "futures",
              symbol: p.symbol,
              direction: p.direction,
              entryPrice: p.entryPrice.toFixed(2),
              exitPrice: price.toFixed(2),
              size: p.size.toFixed(6),
              leverage: p.leverage,
              pnl: pnl.toFixed(2),
              pnlPct: pnlPct.toFixed(2),
              closeReason: "liquidation",
              marginMode: p.marginMode,
              openedAt: openedAt[p.id] ?? Date.now(),
            });
            setOpenedAt(prev => { const n = { ...prev }; delete n[p.id]; return n; });
            // 爆仓不退还保证金（balance 不变）
            continue;
          }

          // 止盈触发
          if (p.tpPrice && p.direction === "long" && price >= p.tpPrice) {
            const pnl = (price - p.entryPrice) * p.size;
            setBalance(b => b + p.margin + pnl);
            showMsg(`✅ 止盈触发 +${pnl.toFixed(2)} USDT`, true);
            addHistory({
              simType: "futures", symbol: p.symbol, direction: p.direction,
              entryPrice: p.entryPrice.toFixed(2), exitPrice: price.toFixed(2),
              size: p.size.toFixed(6), leverage: p.leverage,
              pnl: pnl.toFixed(2), pnlPct: (pnl / p.margin * 100).toFixed(2),
              closeReason: "tp", marginMode: p.marginMode, openedAt: openedAt[p.id] ?? Date.now(),
            });
            setOpenedAt(prev => { const n = { ...prev }; delete n[p.id]; return n; });
            continue;
          }
          if (p.tpPrice && p.direction === "short" && price <= p.tpPrice) {
            const pnl = (p.entryPrice - price) * p.size;
            setBalance(b => b + p.margin + pnl);
            showMsg(`✅ 止盈触发 +${pnl.toFixed(2)} USDT`, true);
            addHistory({
              simType: "futures", symbol: p.symbol, direction: p.direction,
              entryPrice: p.entryPrice.toFixed(2), exitPrice: price.toFixed(2),
              size: p.size.toFixed(6), leverage: p.leverage,
              pnl: pnl.toFixed(2), pnlPct: (pnl / p.margin * 100).toFixed(2),
              closeReason: "tp", marginMode: p.marginMode, openedAt: openedAt[p.id] ?? Date.now(),
            });
            setOpenedAt(prev => { const n = { ...prev }; delete n[p.id]; return n; });
            continue;
          }
          // 止损触发
          if (p.slPrice && p.direction === "long" && price <= p.slPrice) {
            const pnl = (price - p.entryPrice) * p.size;
            setBalance(b => b + p.margin + pnl);
            showMsg(`🛑 止损触发 ${pnl.toFixed(2)} USDT`, false);
            addHistory({
              simType: "futures", symbol: p.symbol, direction: p.direction,
              entryPrice: p.entryPrice.toFixed(2), exitPrice: price.toFixed(2),
              size: p.size.toFixed(6), leverage: p.leverage,
              pnl: pnl.toFixed(2), pnlPct: (pnl / p.margin * 100).toFixed(2),
              closeReason: "sl", marginMode: p.marginMode, openedAt: openedAt[p.id] ?? Date.now(),
            });
            setOpenedAt(prev => { const n = { ...prev }; delete n[p.id]; return n; });
            continue;
          }
          if (p.slPrice && p.direction === "short" && price >= p.slPrice) {
            const pnl = (p.entryPrice - price) * p.size;
            setBalance(b => b + p.margin + pnl);
            showMsg(`🛑 止损触发 ${pnl.toFixed(2)} USDT`, false);
            addHistory({
              simType: "futures", symbol: p.symbol, direction: p.direction,
              entryPrice: p.entryPrice.toFixed(2), exitPrice: price.toFixed(2),
              size: p.size.toFixed(6), leverage: p.leverage,
              pnl: pnl.toFixed(2), pnlPct: (pnl / p.margin * 100).toFixed(2),
              closeReason: "sl", marginMode: p.marginMode, openedAt: openedAt[p.id] ?? Date.now(),
            });
            setOpenedAt(prev => { const n = { ...prev }; delete n[p.id]; return n; });
            continue;
          }

          surviving.push(p);
        }
        return surviving;
      });

      // 限价单触发
      setLimitOrders(orders => {
        const remaining: LimitOrder[] = [];
        orders.forEach(o => {
          const triggered = o.side === "buy" ? price <= o.price : price >= o.price;
          if (triggered) {
            const margin = o.amount * o.price / leverage;
            setBalance(b => b - margin);
            posIdRef.current++;
            const newId = posIdRef.current;
            const dir = o.side === "buy" ? "long" : "short";
            const liqP = calcLiqPrice(dir, o.price, leverage, "全仓");
            // 限价单触发时也合并同方向仓位
            setPositions(ps => mergeOrAddPosition(ps, {
              id: newId, symbol: "BTC/USDT", type: "futures",
              direction: dir,
              size: o.amount, entryPrice: o.price, leverage, margin, liquidPrice: liqP,
              marginMode: "全仓",
            }));
            setOpenedAt(prev => ({ ...prev, [newId]: Date.now() }));
            showMsg(`限价单成交 ${o.side === "buy" ? "多" : "空"} @ ${o.price.toFixed(2)}`, true);
          } else {
            remaining.push(o);
          }
        });
        return remaining;
      });

      return [...prev.slice(-99), c];
    });
  }, [leverage, priceBias, openedAt, addHistory]);

  useEffect(() => {
    if (paused) return;
    tickRef.current = setInterval(tick, speed === 1 ? TICK_MS : 350);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [tick, speed, paused]);

  const execPrice = orderType === "market" ? currentPrice : (parseFloat(limitPrice) || currentPrice);
  const amountNum = parseFloat(amountInput) || (sliderPct > 0 ? balance * sliderPct / 100 * leverage / execPrice : 0);
  const marginNeeded = amountNum * execPrice / leverage;
  const priceChange = (currentPrice - openPrice) / openPrice;

  const fundingRate = 0.0039;
  const [countdown, setCountdown] = useState("01:31:51");
  useEffect(() => {
    let secs = 91 * 60 + 51;
    const t = setInterval(() => {
      secs = Math.max(0, secs - 1);
      const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
      setCountdown(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  /**
   * 加仓合并逻辑：若已有同方向仓位（相同 marginMode），合并为一个仓位
   * - 新开仓均价 = 加权平均价
   * - 新持仓量 = 两者之和
   * - 新保证金 = 两者之和
   * - 新爆仓价 = 按新均价重算
   */
  const mergeOrAddPosition = (ps: Position[], newPos: Position): Position[] => {
    const sameDir = ps.find(p => p.direction === newPos.direction && p.marginMode === newPos.marginMode);
    if (!sameDir) return [...ps, newPos];

    const totalSize = sameDir.size + newPos.size;
    const avgEntry = (sameDir.entryPrice * sameDir.size + newPos.entryPrice * newPos.size) / totalSize;
    const totalMargin = sameDir.margin + newPos.margin;
    const newLiqP = calcLiqPrice(newPos.direction, avgEntry, newPos.leverage, newPos.marginMode ?? "全仓");

    const merged: Position = {
      ...sameDir,
      size: totalSize,
      entryPrice: avgEntry,
      margin: totalMargin,
      liquidPrice: newLiqP,
      leverage: newPos.leverage, // 使用最新杠杆
    };
    return ps.map(p => p.id === sameDir.id ? merged : p);
  };

  const openPosition = (direction: "long" | "short") => {
    if (amountNum <= 0) return showMsg("请输入数量", false);
    if (marginNeeded > balance) return showMsg("保证金不足", false);

    if (orderType === "limit") {
      ordIdRef.current++;
      setLimitOrders(o => [...o, { id: ordIdRef.current, side: direction === "long" ? "buy" : "sell", price: execPrice, amount: amountNum, time: new Date().toLocaleTimeString() }]);
      showMsg(`限价委托 ${direction === "long" ? "多" : "空"} @ ${execPrice.toFixed(2)}`, true);
      setAmountInput(""); setSliderPct(0);
      return;
    }

    const liqP = calcLiqPrice(direction, execPrice, leverage, marginMode);
    posIdRef.current++;
    const newId = posIdRef.current;
    const newPos: Position = {
      id: newId, symbol: "BTC/USDT", type: "futures", direction,
      size: amountNum, entryPrice: execPrice, leverage, margin: marginNeeded, liquidPrice: liqP,
      marginMode,
    };

    setOpenedAt(prev => ({ ...prev, [newId]: Date.now() }));
    setPositions(ps => mergeOrAddPosition(ps, newPos));
    setBalance(b => b - marginNeeded);

    // 约 70% 胜率：开多 70% 向上偏 / 开空 70% 向下偏，30% 则反向
    setPriceBias(direction === "long"
      ? (Math.random() < 0.7 ? 0.22 : -0.22)
      : (Math.random() < 0.7 ? -0.22 : 0.22));
    setTimeout(() => setPriceBias(0), 15000);

    const modeLabel = marginMode === "全仓" ? "[全仓]" : "[逐仓]";
    showMsg(`${direction === "long" ? "开多" : "开空"} ${amountNum.toFixed(4)} BTC @ ${execPrice.toFixed(2)} ${modeLabel}`, true);
    setAmountInput(""); setSliderPct(0);
    // 首次开仓后自动切换 Tab 并滚动
    hasScrolled.current = false;
    setDrawerTab("positions");
    scrollToDrawer();
  };

  const closePosition = (pos: Position, reason = "manual", exitPriceOverride?: number) => {
    const exitP = exitPriceOverride ?? currentPrice;
    const pnl = pos.direction === "long"
      ? (exitP - pos.entryPrice) * pos.size
      : (pos.entryPrice - exitP) * pos.size;
    const pnlPct = pnl / pos.margin * 100;
    setBalance(b => b + pos.margin + pnl);
    setPositions(ps => ps.filter(p => p.id !== pos.id));
    setOpenedAt(prev => { const n = { ...prev }; delete n[pos.id]; return n; });
    showMsg(`平仓 ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} USDT`, pnl >= 0);
    // 将历史记录写入 localStorage
    addHistory({
      simType: "futures",
      symbol: pos.symbol,
      direction: pos.direction,
      entryPrice: pos.entryPrice.toFixed(2),
      exitPrice: exitP.toFixed(2),
      size: pos.size.toFixed(6),
      leverage: pos.leverage,
      pnl: pnl.toFixed(2),
      pnlPct: pnlPct.toFixed(2),
      closeReason: reason,
      marginMode: pos.marginMode,
      openedAt: openedAt[pos.id] ?? Date.now(),
    });
  };

  const reversePosition = (pos: Position) => {
    closePosition(pos);
    const newDir = pos.direction === "long" ? "short" : "long";
    const liqP = calcLiqPrice(newDir, currentPrice, pos.leverage, pos.marginMode ?? "全仓");
    const newMargin = pos.size * currentPrice / pos.leverage;
    if (newMargin > balance) return showMsg("余额不足以反手", false);
    posIdRef.current++;
    const newId = posIdRef.current;
    setOpenedAt(prev => ({ ...prev, [newId]: Date.now() }));
    setPositions(ps => [...ps, {
      id: newId, symbol: "BTC/USDT", type: "futures", direction: newDir,
      size: pos.size, entryPrice: currentPrice, leverage: pos.leverage, margin: newMargin, liquidPrice: liqP,
      marginMode: pos.marginMode,
    }]);
    setBalance(b => b - newMargin);
    showMsg(`反手 ${newDir === "long" ? "开多" : "开空"} @ ${currentPrice.toFixed(2)}`, true);
  };

  const updateTpSl = (posId: number, update: Partial<Position>) => {
    setPositions(ps => ps.map(p => p.id === posId ? { ...p, ...update } : p));
    showMsg("止盈止损已设置", true);
  };

  const unrealizedPnl = positions.reduce((s, p) => {
    const pnl = p.direction === "long"
      ? (currentPrice - p.entryPrice) * p.size
      : (p.entryPrice - currentPrice) * p.size;
    return s + pnl;
  }, 0);

  const totalMargin = positions.reduce((s, p) => s + p.margin, 0);

  // 计算图表显示的加权均价和综合爆仓价（取多仓或空仓中持仓最大的一侧）
  const chartLines = (() => {
    if (positions.length === 0) return { entryPrice: undefined, liquidPrice: undefined };
    // 分别计算多仓和空仓的加权均价
    const longs = positions.filter(p => p.direction === "long");
    const shorts = positions.filter(p => p.direction === "short");
    const calcWeighted = (ps: Position[]) => {
      if (ps.length === 0) return null;
      const totalSize = ps.reduce((s, p) => s + p.size, 0);
      const avgEntry = ps.reduce((s, p) => s + p.entryPrice * p.size, 0) / totalSize;
      // 爆仓价取最危险的（多仓取最高爆仓价，空仓取最低爆仓价）
      const liqPrice = ps[0].direction === "long"
        ? Math.max(...ps.map(p => p.liquidPrice))
        : Math.min(...ps.map(p => p.liquidPrice));
      return { avgEntry, liqPrice, totalSize };
    };
    const longInfo = calcWeighted(longs);
    const shortInfo = calcWeighted(shorts);
    // 优先显示持仓量更大的一侧
    if (longInfo && shortInfo) {
      return longInfo.totalSize >= shortInfo.totalSize
        ? { entryPrice: longInfo.avgEntry, liquidPrice: longInfo.liqPrice }
        : { entryPrice: shortInfo.avgEntry, liquidPrice: shortInfo.liqPrice };
    }
    if (longInfo) return { entryPrice: longInfo.avgEntry, liquidPrice: longInfo.liqPrice };
    if (shortInfo) return { entryPrice: shortInfo.avgEntry, liquidPrice: shortInfo.liqPrice };
    return { entryPrice: undefined, liquidPrice: undefined };
  })();

  const emas = (() => {
    const closes = candles.map(c => c.close);
    return {
      ema5:   calcEMA(closes, 5).at(-1)!,
      ema25:  calcEMA(closes, 25).at(-1)!,
      ema45:  calcEMA(closes, 45).at(-1)!,
      ema144: calcEMA(closes, 144).at(-1)!,
    };
  })();

  const timeframes = ["1时", "2时", "4时", "6时", "8时", "12时", "1日", "2日", "3日", "5日"];

  return (
    <div style={{ minHeight: "100dvh", background: "#0a0e1a", color: "#fff", fontFamily: "system-ui,-apple-system,sans-serif", fontSize: 13, overscrollBehaviorX: "none" as any, touchAction: "pan-y", overflowX: "hidden" }}>

      {/* 顶部导航（sticky 固定） */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px 6px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0a0e1a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => window.history.back()} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: "2px 6px 2px 0", display: "flex", alignItems: "center" }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 17 }}>BTC/USDT</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: 4 }}>永续</span>
            </div>
            <div style={{ fontSize: 11, color: priceChange >= 0 ? "#26a69a" : "#ef5350", fontWeight: 600, marginTop: 1 }}>
              {priceChange >= 0 ? "+" : ""}{(priceChange * 100).toFixed(2)}%
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setPaused(p => !p)} style={{ padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.07)", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 11 }}>
            {paused ? "▶" : "⏸"}
          </button>
          <button onClick={() => setSpeed(s => s === 1 ? 3 : 1)} style={{ padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.07)", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 11 }}>
            {speed}×
          </button>
          <button onClick={() => { setCandles(initCandles(INITIAL_CANDLE_COUNT, INIT_PRICE)); setBalance(INITIAL_BALANCE); setPositions([]); setLimitOrders([]); setCurrentPrice(INIT_PRICE); setAmountInput(""); }} style={{ background: "rgba(255,255,255,0.07)", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", borderRadius: 6, padding: "3px 6px", display: "flex", alignItems: "center" }}>
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* 时间周期 */}
      <div style={{ flexShrink: 0, display: "flex", overflowX: "auto", padding: "4px 8px 2px", scrollbarWidth: "none" }}>
        {timeframes.map(t => (
          <button key={t} onClick={() => setTimeframe(t)} style={{
            padding: "4px 10px", fontSize: 12, background: "none", border: "none", cursor: "pointer", flexShrink: 0,
            color: timeframe === t ? "#fff" : "rgba(255,255,255,0.35)",
            fontWeight: timeframe === t ? 700 : 400,
            borderBottom: timeframe === t ? "2px solid #26a69a" : "2px solid transparent",
          }}>{t}</button>
        ))}
      </div>

      {/* EMA 指标行 */}
      <div style={{ flexShrink: 0, display: "flex", gap: 8, padding: "2px 10px 3px", fontSize: 10, fontFamily: "monospace" }}>
        <span style={{ color: "#f59e0b" }}>EMA5:{emas.ema5.toFixed(0)}</span>
        <span style={{ color: "#22c55e" }}>EMA25:{emas.ema25.toFixed(0)}</span>
        <span style={{ color: "#3b82f6" }}>EMA45:{emas.ema45.toFixed(0)}</span>
        <span style={{ color: "#ef4444" }}>EMA144:{emas.ema144.toFixed(0)}</span>
      </div>

      {/* K线图 — 显示加权均价线和综合爆仓线 */}
      <div style={{ flexShrink: 0 }}>
        <CandleChart
          candles={candles}
          height={chartH}
          entryPrice={chartLines.entryPrice}
          liquidPrice={chartLines.liquidPrice}
        />
      </div>

      {/* 中部：左侧开仓面板 + 右侧资金费率+订单簿 */}
      <div style={{ display: "flex", minHeight: 300, borderTop: "1px solid rgba(255,255,255,0.06)" }}>

        {/* 左侧：开仓面板 */}
        <div style={{ flex: "0 0 56%", display: "flex", flexDirection: "column", padding: "8px 10px", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

          {/* 开仓/平仓 Tab */}
          <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
            {(["open", "close"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: "6px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12,
                background: mode === m ? "rgba(255,255,255,0.12)" : "transparent",
                color: mode === m ? "#fff" : "rgba(255,255,255,0.4)",
                fontWeight: mode === m ? 700 : 400,
              }}>{m === "open" ? "开仓" : "平仓"}</button>
            ))}
          </div>

          {/* 全仓/逐仓 + 杠杆 */}
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <button onClick={() => setMarginMode(m => m === "全仓" ? "逐仓" : "全仓")} style={{
              padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "none", color: "#fff", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 3,
            }}>{marginMode}<ChevronDown size={11} color="rgba(255,255,255,0.4)" /></button>
            <button onClick={() => setShowLeverage(true)} style={{
              flex: 1, padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "none", color: "#fff", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ color: "#f59e0b", fontWeight: 700 }}>{leverage}x</span>
              <ChevronDown size={11} color="rgba(255,255,255,0.4)" />
            </button>
          </div>

          {/* 订单类型 */}
          <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
            {(["market", "limit"] as const).map(t => (
              <button key={t} onClick={() => setOrderType(t)} style={{
                flex: 1, padding: "5px 0", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11,
                background: orderType === t ? "rgba(255,255,255,0.12)" : "transparent",
                color: orderType === t ? "#fff" : "rgba(255,255,255,0.35)",
              }}>{t === "market" ? "市价" : "限价"}</button>
            ))}
          </div>

          {/* 限价输入 */}
          {orderType === "limit" && (
            <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "7px 10px", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginRight: 6 }}>价格</span>
              <input value={limitPrice} onChange={e => setLimitPrice(e.target.value)} placeholder={currentPrice.toFixed(1)}
                style={{ flex: 1, background: "none", border: "none", color: "#fff", fontSize: 13, textAlign: "right", outline: "none" }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginLeft: 4 }}>USDT</span>
            </div>
          )}

          {/* 数量输入 */}
          <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "7px 10px", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginRight: 6 }}>数量</span>
            <input value={amountInput} onChange={e => setAmountInput(e.target.value)} placeholder="0"
              style={{ flex: 1, background: "none", border: "none", color: "#fff", fontSize: 13, textAlign: "right", outline: "none" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginLeft: 4 }}>BTC</span>
          </div>

          {/* 仓位分配滑动条（优化版） */}
          <PercentSlider
            value={sliderPct}
            onChange={pct => { setSliderPct(pct); setAmountInput((balance * pct / 100 * leverage / execPrice).toFixed(4)); }}
            color="#26a69a"
          />

          {/* 可用/保证金 */}
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 2, display: "flex", justifyContent: "space-between" }}>
            <span>可用</span><span style={{ color: "rgba(255,255,255,0.8)" }}>{balance.toFixed(2)} USDT</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
            <span>保证金</span><span style={{ color: "rgba(255,255,255,0.8)" }}>{marginNeeded.toFixed(2)} USDT</span>
          </div>

          {/* 开多/开空 */}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => openPosition("long")} style={{
              flex: 1, padding: "11px 0", borderRadius: 22, border: "none", cursor: "pointer",
              background: "#26a69a", color: "#fff", fontSize: 14, fontWeight: 700,
              boxShadow: "0 2px 12px rgba(38,166,154,0.4)",
            }}>开多</button>
            <button onClick={() => openPosition("short")} style={{
              flex: 1, padding: "11px 0", borderRadius: 22, border: "none", cursor: "pointer",
              background: "#ef5350", color: "#fff", fontSize: 14, fontWeight: 700,
              boxShadow: "0 2px 12px rgba(239,83,80,0.4)",
            }}>开空</button>
          </div>
        </div>

        {/* 右侧：资金费率 + 订单簿 */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          {/* 资金费率 */}
          <div style={{ padding: "6px 6px 4px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>
              <span>资金费率</span><span>倒计时</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "monospace" }}>
              <span style={{ color: "#f59e0b", fontSize: 12, fontWeight: 700 }}>{fundingRate.toFixed(4)}%</span>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>{countdown}</span>
            </div>
          </div>
          {/* 订单簿 */}
          <div style={{ flex: 1, padding: "4px 4px" }}>
            {orderBookReady ? (
              <OrderBook asks={book.asks} bids={book.bids} mid={currentPrice} decimals={1} />
            ) : (
              <div style={{ padding: "16px 8px", color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
                <div style={{ height: 12, width: "72%", borderRadius: 999, background: "rgba(255,255,255,0.08)", marginBottom: 10 }} />
                <div style={{ height: 88, borderRadius: 12, background: "rgba(255,255,255,0.05)" }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 底部 Tab 导航 + 内容区 ── */}
      <div ref={drawerRef}>
        {/* Tab 导航栏 */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          borderTop: "2px solid rgba(255,255,255,0.1)",
          background: "rgba(8,12,22,0.98)",
          backdropFilter: "blur(8px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", padding: "0 4px" }}>
            {(["positions", "orders", "assets", "history"] as const).map(t => (
              <button key={t} onClick={() => setDrawerTab(t)} style={{
                flex: 1, padding: "11px 4px", background: "none", border: "none", cursor: "pointer",
                fontSize: 12,
                color: drawerTab === t ? "#fff" : "rgba(255,255,255,0.4)",
                fontWeight: drawerTab === t ? 700 : 400,
                borderBottom: drawerTab === t ? "2px solid #f59e0b" : "2px solid transparent",
                transition: "color 0.15s",
              }}>
                {t === "positions" ? `仓位 (${positions.length})`
                  : t === "orders" ? `委托 (${limitOrders.length})`
                  : t === "history" ? "历史"
                  : "资产"}
              </button>
            ))}
            <button onClick={() => setShowTip(s => !s)} style={{ background: "none", border: "none", cursor: "pointer", padding: "11px 6px", color: "rgba(255,255,255,0.3)" }}>
              <Info size={14} />
            </button>
          </div>
        </div>

        {/* Tab 内容区 */}
        <div style={{ background: "#0b0f1e", minHeight: 180, padding: "12px 12px 24px" }}>
          {drawerTab === "positions" && (
            positions.length === 0
              ? <EmptyHint text="暂无持仓" hint={"点击「开多」或「开空」开始交易\n例：选 20x 杠杆，输入 0.001 BTC，点开多\n价格上涨 1% = 盈利 20%\n\n💡 加仓同方向仓位会自动合并，更新开仓均价"} />
              : <>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                    <button onClick={() => { positions.forEach(p => closePosition(p)); }} style={{
                      padding: "5px 14px", borderRadius: 16, background: "rgba(239,83,80,0.15)", border: "1px solid rgba(239,83,80,0.3)", color: "#ef5350", fontSize: 12, cursor: "pointer",
                    }}>一键平仓</button>
                  </div>
                  {positions.map(pos => (
                    <PositionCard key={pos.id} pos={pos} currentPrice={currentPrice}
                      onClose={closePosition}
                      onReverse={reversePosition}
                      onTpSl={p => setTpSlPos(p)}
                    />
                  ))}
                </>
          )}
          {drawerTab === "orders" && (
            limitOrders.length === 0
              ? <EmptyHint text="暂无委托" hint={"切换到「限价」模式，设置目标价格后挂单\n例：当前价 65000，挂 64000 的买单\n价格跌到 64000 时自动成交"} />
              : limitOrders.map(o => (
                  <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 10, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: o.side === "buy" ? "#26a69a" : "#ef5350" }}>
                        {o.side === "buy" ? "买入(多)" : "卖出(空)"} BTC/USDT
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                        限价 {o.price.toFixed(2)} · {o.amount.toFixed(4)} BTC · {o.time}
                      </div>
                    </div>
                    <button onClick={() => setLimitOrders(os => os.filter(x => x.id !== o.id))} style={{
                      padding: "4px 10px", borderRadius: 8, background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 11,
                    }}>撤单</button>
                  </div>
                ))
          )}
          {drawerTab === "assets" && (
            <div style={{ fontSize: 13 }}>
              {[
                ["可用余额", `${balance.toFixed(2)} USDT`],
                ["占用保证金", `${totalMargin.toFixed(2)} USDT`],
                ["浮动盈亏", `${unrealizedPnl >= 0 ? "+" : ""}${unrealizedPnl.toFixed(2)} USDT`, unrealizedPnl >= 0 ? "#26a69a" : "#ef5350"],
                ["账户净値", `${(balance + totalMargin + unrealizedPnl).toFixed(2)} USDT`],
              ].map(([k, v, c]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>{k}</span>
                  <span style={{ fontFamily: "monospace", color: (c as string) || "#fff" }}>{v}</span>
                </div>
              ))}
            </div>
          )}
          {drawerTab === "history" && (
            <HistoryTab
              records={historyRecords}
              isLoading={false}
              onReset={() => setShowReset(true)}
            />
          )}
        </div>
      </div>{/* end drawerRef */}

      <Toast msg={msg} />

      {/* 杠杆选择器 */}
      {showLeverage && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
          onClick={() => setShowLeverage(false)}>
          <div style={{ background: "#0d1120", borderRadius: "20px 20px 0 0", border: "1px solid rgba(255,255,255,0.1)", padding: 16 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>选择杠杆</span>
              <button onClick={() => setShowLeverage(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}><X size={18} /></button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {LEVERAGES.map(lv => (
                <button key={lv} onClick={() => { setLeverage(lv); setShowLeverage(false); }} style={{
                  padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                  background: leverage === lv ? "#26a69a" : "rgba(255,255,255,0.08)",
                  color: leverage === lv ? "#fff" : "rgba(255,255,255,0.7)",
                }}>{lv}x</button>
              ))}
            </div>
            <div style={{ padding: "8px 10px", background: "rgba(245,158,11,0.1)", borderRadius: 8, border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={13} color="#f59e0b" />
              <span style={{ fontSize: 11, color: "#f59e0b" }}>高杠杆风险极大，爆仓价格接近开仓价，请谨慎使用</span>
            </div>
          </div>
        </div>
      )}

      {/* 止盈止损弹窗 */}
      {tpSlPos && (
        <TpSlModal
          pos={tpSlPos}
          currentPrice={currentPrice}
          onClose={() => setTpSlPos(null)}
          onConfirm={update => updateTpSl(tpSlPos.id, update)}
        />
      )}

      {/* 重置确认弹窗 */}
      {showReset && (
        <ResetConfirmModal
          onCancel={() => setShowReset(false)}
          onConfirm={() => {
            resetHistory();
            setBalance(INITIAL_BALANCE);
            setPositions([]);
            setLimitOrders([]);
            setOpenedAt({});
            setShowReset(false);
            showMsg("资金和历史记录已重置", true);
          }}
          isLoading={false}
        />
      )}

      {/* 教学提示 */}
      {showTip && (
        <div style={{
          position: "fixed", bottom: 60, right: 12, zIndex: 30, width: 260,
          background: "rgba(13,17,32,0.96)", border: "1px solid rgba(59,130,246,0.2)",
          borderRadius: 16, padding: 14, fontSize: 12, color: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(12px)", boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontWeight: 700, color: "#60a5fa" }}>💡 合约交易要点</span>
            <button onClick={() => setShowTip(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}><X size={14} /></button>
          </div>
          <p style={{ marginBottom: 6 }}><strong style={{ color: "#fff" }}>杠杆</strong>：放大收益的同时也放大亏损，高杠杆容易爆仓</p>
          <p style={{ marginBottom: 6 }}><strong style={{ color: "#fff" }}>加仓</strong>：同方向加仓会自动合并，更新开仓均价和爆仓价</p>
          <p style={{ marginBottom: 6 }}><strong style={{ color: "#fff" }}>爆仓</strong>：损失全部保证金，记录在历史中标注「爆仓」</p>
          <p style={{ marginBottom: 6 }}><strong style={{ color: "#fff" }}>全仓 vs 逐仓</strong>：全仓爆仓价更远，逐仓风险隔离</p>
          <p><strong style={{ color: "#fff" }}>止盈止损</strong>：开仓后点仓位卡片上的「止盈/止损」按钮设置</p>
        </div>
      )}
    </div>
  );
}
