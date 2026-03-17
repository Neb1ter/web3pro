/**
 * SpotSim — 现货交易模拟器（重构版）
 * 参考 OKX 移动端现货界面（图1）
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, RefreshCw, Info, X, ChevronDown } from "lucide-react";
import {
  CandleChart, OrderBook, Toast, EmptyHint, HistoryTab, ResetConfirmModal, PercentSlider,
  initCandles, nextCandle, calcEMA, genBook, useDeferredMount,
  type Candle, type LimitOrder,
} from "./SimComponents";
import { useLocalHistory } from "./SimComponents";

const INITIAL_BALANCE = 10000;
const TICK_MS = 1000;
const INIT_PRICE = 65000;
const INITIAL_CANDLE_COUNT = 60;

export default function SpotSim() {
  const [, navigate] = useLocation();

  const [candles,      setCandles]      = useState(() => initCandles(INITIAL_CANDLE_COUNT, INIT_PRICE));
  const [currentPrice, setCurrentPrice] = useState(INIT_PRICE);
  const [openPrice]                     = useState(INIT_PRICE);
  const [book,         setBook]         = useState(() => genBook(INIT_PRICE));
  const [balance,      setBalance]      = useState(INITIAL_BALANCE);
  const [btcHeld,      setBtcHeld]      = useState(0);
  const [avgBuyPrice,  setAvgBuyPrice]  = useState(0);
  const [limitOrders,  setLimitOrders]  = useState<LimitOrder[]>([]);
  const [side,         setSide]         = useState<"buy" | "sell">("buy");
  const [orderType,    setOrderType]    = useState<"market" | "limit">("market");
  const [limitPrice,   setLimitPrice]   = useState("");
  const [amountInput,  setAmountInput]  = useState("");
  const [sliderPct,    setSliderPct]    = useState(0);
  const [paused,       setPaused]       = useState(false);
  const [speed,        setSpeed]        = useState(1);
  const [msg,          setMsg]          = useState<{ text: string; ok: boolean } | null>(null);
  const [drawerTab,    setDrawerTab]    = useState<"positions" | "orders" | "assets" | "history">("positions");
  const [showTip,      setShowTip]      = useState(false);
  const [chartH,       setChartH]       = useState(170);
  const [timeframe,    setTimeframe]    = useState("小时");
  const [showReset,    setShowReset]    = useState(false);
  const [buyTime,      setBuyTime]      = useState<number>(0);
  const orderBookReady                  = useDeferredMount(120);
  // 价格偏向：买入时约 70% 向上偏、30% 向下偏，有亏有赢更真实
  const [priceBias,    setPriceBias]    = useState(0);
  // 首次开仓后自动滚动到仓位区域
  const drawerRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  const { records: historyRecords, addRecord: addHistory, resetRecords: resetHistory } = useLocalHistory("spot");

  const ordIdRef = useRef(0);
  const tickRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const upd = () => setChartH(Math.max(130, Math.min(190, window.innerHeight * 0.22)));
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);

  const tick = useCallback(() => {
    setCandles(prev => {
      const last = prev[prev.length - 1];
      // 使用 priceBias 让价格向用户操作方向靠拢
      const c = nextCandle(last.close, priceBias);
      const price = c.close;
      setCurrentPrice(price);
      setBook(genBook(price));

      // 限价单触发
      setLimitOrders(orders => {
        const remaining: LimitOrder[] = [];
        orders.forEach(o => {
          const triggered = o.side === "buy" ? price <= o.price : price >= o.price;
          if (triggered) {
            if (o.side === "buy") {
              const cost = o.price * o.amount * 1.001;
              setBalance(b => {
                if (b < cost) { remaining.push(o); return b; }
                setBtcHeld(h => {
                  setAvgBuyPrice(avg => avg > 0 ? (avg * h + o.price * o.amount) / (h + o.amount) : o.price);
                  return h + o.amount;
                });
                return b - cost;
              });
            } else {
              setBtcHeld(h => {
                if (h < o.amount) { remaining.push(o); return h; }
                setBalance(b => b + o.price * o.amount * 0.999);
                return h - o.amount;
              });
            }
          } else {
            remaining.push(o);
          }
        });
        return remaining;
      });

      return [...prev.slice(-99), c];
    });
  }, [priceBias]);

  useEffect(() => {
    if (paused) return;
    tickRef.current = setInterval(tick, speed === 1 ? TICK_MS : 350);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [tick, speed, paused]);

  const showMsg = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 2500);
  };

  // 首次开仓后滚动到仓位区域
  const scrollToDrawer = () => {
    if (!hasScrolled.current && drawerRef.current) {
      hasScrolled.current = true;
      setTimeout(() => {
        drawerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  };

  const execPrice = orderType === "market" ? currentPrice : (parseFloat(limitPrice) || currentPrice);
  const amountNum = parseFloat(amountInput) || 0;
  const totalCost = execPrice * amountNum;
  const fee       = totalCost * 0.001;
  const priceChange = (currentPrice - openPrice) / openPrice;
  const unrealizedPnl = btcHeld > 0 ? (currentPrice - avgBuyPrice) * btcHeld : 0;
  const unrealizedPct = btcHeld > 0 ? (currentPrice - avgBuyPrice) / avgBuyPrice * 100 : 0;

  const handleSlider = (pct: number) => {
    setSliderPct(pct);
    const max = side === "buy" ? balance * pct / 100 / execPrice : btcHeld * pct / 100;
    setAmountInput(max.toFixed(4));
  };

  const handleOrder = () => {
    if (amountNum <= 0) return showMsg("请输入数量", false);
    if (orderType === "limit") {
      ordIdRef.current++;
      setLimitOrders(o => [...o, { id: ordIdRef.current, side, price: execPrice, amount: amountNum, time: new Date().toLocaleTimeString() }]);
      showMsg(`限价委托 ${side === "buy" ? "买入" : "卖出"} @ ${execPrice.toFixed(2)}`, true);
      setAmountInput(""); setSliderPct(0);
      return;
    }
    if (side === "buy") {
      if (totalCost + fee > balance) return showMsg("余额不足", false);
      const newAvg = btcHeld > 0 ? (avgBuyPrice * btcHeld + execPrice * amountNum) / (btcHeld + amountNum) : execPrice;
      setBalance(b => b - totalCost - fee);
      setBtcHeld(h => h + amountNum);
      setAvgBuyPrice(newAvg);
      if (btcHeld === 0) {
        setBuyTime(Date.now());
        hasScrolled.current = false; // 重置，允许下次开仓再次滚动
      }
      // 约 70% 胜率：70% 时价格向上偏（盈利），30% 时向下偏（亏损）
      setPriceBias(Math.random() < 0.7 ? 0.22 : -0.22);
      setTimeout(() => setPriceBias(0), 15000);
      showMsg(`买入 ${amountNum.toFixed(4)} BTC @ ${execPrice.toFixed(2)}`, true);
      setDrawerTab("positions");
      scrollToDrawer();
    } else {
      if (amountNum > btcHeld) return showMsg(`持仓不足 (${btcHeld.toFixed(4)} BTC)`, false);
      const pnl = (execPrice - avgBuyPrice) * amountNum;
      const pnlPct = avgBuyPrice > 0 ? pnl / (avgBuyPrice * amountNum) * 100 : 0;
      setBalance(b => b + totalCost - fee);
      setBtcHeld(h => Math.max(0, h - amountNum));
      if (btcHeld - amountNum <= 0) setAvgBuyPrice(0);
      // 卖出后恢复中性
      setPriceBias(0);
      showMsg(`卖出 ${amountNum.toFixed(4)} BTC，盈亏 ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}`, pnl >= 0);
      addHistory({
        simType: "spot",
        symbol: "BTC/USDT",
        direction: "long",
        entryPrice: avgBuyPrice.toFixed(2),
        exitPrice: execPrice.toFixed(2),
        size: amountNum.toFixed(6),
        leverage: 1,
        pnl: pnl.toFixed(2),
        pnlPct: pnlPct.toFixed(2),
        closeReason: "manual",
        openedAt: buyTime || Date.now(),
      });
    }
    setAmountInput(""); setSliderPct(0);
  };

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

  // Tab 标签配置
  const TABS = [
    { key: "positions" as const, label: `持仓 (${btcHeld > 0 ? 1 : 0})` },
    { key: "orders"   as const, label: `委托 (${limitOrders.length})` },
    { key: "assets"   as const, label: "资产" },
    { key: "history"  as const, label: "历史" },
  ];

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
              <ChevronDown size={13} color="rgba(255,255,255,0.4)" />
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
          <button onClick={() => { setCandles(initCandles(INITIAL_CANDLE_COUNT, INIT_PRICE)); setBalance(INITIAL_BALANCE); setBtcHeld(0); setAvgBuyPrice(0); setLimitOrders([]); setCurrentPrice(INIT_PRICE); setAmountInput(""); setSliderPct(0); setPriceBias(0); hasScrolled.current = false; }} style={{ background: "rgba(255,255,255,0.07)", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", borderRadius: 6, padding: "3px 6px", display: "flex", alignItems: "center" }}>
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

      {/* K线图 */}
      <div style={{ flexShrink: 0 }}>
        <CandleChart
          candles={candles}
          height={chartH}
          entryPrice={btcHeld > 0 ? avgBuyPrice : undefined}
        />
      </div>

      {/* 中部：左侧买卖面板 + 右侧订单簿 */}
      <div style={{ display: "flex", minHeight: 300, borderTop: "1px solid rgba(255,255,255,0.06)" }}>

        {/* 左侧：买卖面板 */}
        <div style={{ flex: "0 0 56%", display: "flex", flexDirection: "column", padding: "8px 10px", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

          {/* 买入/卖出 Tab */}
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <button onClick={() => { setSide("buy"); setSliderPct(0); }} style={{
              flex: 1, padding: "8px 0", borderRadius: 22, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700,
              background: side === "buy" ? "#26a69a" : "rgba(255,255,255,0.07)",
              color: side === "buy" ? "#fff" : "rgba(255,255,255,0.45)",
            }}>买入</button>
            <button onClick={() => { setSide("sell"); setSliderPct(0); }} style={{
              flex: 1, padding: "8px 0", borderRadius: 22, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700,
              background: side === "sell" ? "#ef5350" : "rgba(255,255,255,0.07)",
              color: side === "sell" ? "#fff" : "rgba(255,255,255,0.45)",
            }}>卖出</button>
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

          {/* 市价提示 */}
          {orderType === "market" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "7px 10px", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>市场最优价</span>
              <ChevronDown size={12} color="rgba(255,255,255,0.4)" />
            </div>
          )}

          {/* 交易额 */}
          <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "7px 10px", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginRight: 6 }}>交易额</span>
            <input value={amountInput} onChange={e => { setAmountInput(e.target.value); setSliderPct(0); }} placeholder="0"
              style={{ flex: 1, background: "none", border: "none", color: "#fff", fontSize: 13, textAlign: "right", outline: "none" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginLeft: 4 }}>USDT</span>
          </div>

          {/* 仓位分配滑动条（优化版） */}
          <PercentSlider
            value={sliderPct}
            onChange={handleSlider}
            color={side === "buy" ? "#26a69a" : "#ef5350"}
          />

          {/* 可用 / 最大可买 */}
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 2, display: "flex", justifyContent: "space-between" }}>
            <span>可用</span>
            <span style={{ color: "rgba(255,255,255,0.8)" }}>{balance.toFixed(2)} USDT</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
            <span>最大可买</span>
            <span style={{ color: "rgba(255,255,255,0.8)" }}>{(balance / execPrice).toFixed(6)} BTC</span>
          </div>

          {/* 买入/卖出按钮 */}
          <button onClick={handleOrder} style={{
            width: "100%", padding: "11px 0", borderRadius: 24, border: "none", cursor: "pointer",
            background: side === "buy" ? "#26a69a" : "#ef5350",
            color: "#fff", fontSize: 15, fontWeight: 700,
            boxShadow: `0 2px 14px ${side === "buy" ? "rgba(38,166,154,0.4)" : "rgba(239,83,80,0.4)"}`,
          }}>
            {side === "buy" ? "买入 BTC" : "卖出 BTC"}
          </button>
        </div>

        {/* 右侧：订单簿 */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 4px" }}>
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
            {TABS.map(({ key, label }) => (
              <button key={key} onClick={() => setDrawerTab(key)} style={{
                flex: 1, padding: "11px 4px", background: "none", border: "none", cursor: "pointer",
                fontSize: 12,
                color: drawerTab === key ? "#fff" : "rgba(255,255,255,0.4)",
                fontWeight: drawerTab === key ? 700 : 400,
                borderBottom: drawerTab === key ? "2px solid #26a69a" : "2px solid transparent",
                transition: "color 0.15s",
              }}>{label}</button>
            ))}
            <button onClick={() => setShowTip(s => !s)} style={{ background: "none", border: "none", cursor: "pointer", padding: "11px 6px", color: "rgba(255,255,255,0.3)" }}>
              <Info size={14} />
            </button>
          </div>
        </div>

        {/* Tab 内容区 */}
        <div style={{ background: "#0b0f1e", minHeight: 180, padding: "12px 12px 24px" }}>

          {/* 持仓 Tab */}
          {drawerTab === "positions" && (
            btcHeld <= 0
              ? <EmptyHint text="暂无持仓" hint={"买入 BTC 后，这里会显示您的持仓信息\n例：用 1000 USDT 买入 BTC，持有后等待价格上涨再卖出"} />
              : (
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>BTC/USDT 现货</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: unrealizedPnl >= 0 ? "#26a69a" : "#ef5350", fontFamily: "monospace" }}>
                      {unrealizedPnl >= 0 ? "+" : ""}{unrealizedPnl.toFixed(2)} USDT
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: unrealizedPct >= 0 ? "#26a69a" : "#ef5350" }}>
                      {unrealizedPct >= 0 ? "+" : ""}{unrealizedPct.toFixed(2)}%
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 0", marginBottom: 10, fontSize: 12 }}>
                    {[
                      ["持仓量", `${btcHeld.toFixed(6)} BTC`],
                      ["持仓均价", `${avgBuyPrice.toFixed(2)} USDT`],
                      ["当前价格", `${currentPrice.toFixed(2)} USDT`],
                      ["持仓价值", `${(btcHeld * currentPrice).toFixed(2)} USDT`],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{k}</span>
                        <span style={{ color: "#fff", fontFamily: "monospace", fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => {
                    const sellPrice = currentPrice;
                    const heldAmt = btcHeld;
                    const avgP = avgBuyPrice;
                    const pnl = (sellPrice - avgP) * heldAmt;
                    const pnlPct = avgP > 0 ? pnl / (avgP * heldAmt) * 100 : 0;
                    setBalance(b => b + heldAmt * sellPrice * 0.999);
                    setBtcHeld(0);
                    setAvgBuyPrice(0);
                    setPriceBias(0);
                    showMsg(`卖出全部 BTC，盈亏 ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}`, pnl >= 0);
                    addHistory({
                      simType: "spot",
                      symbol: "BTC/USDT",
                      direction: "long",
                      entryPrice: avgP.toFixed(2),
                      exitPrice: sellPrice.toFixed(2),
                      size: heldAmt.toFixed(6),
                      leverage: 1,
                      pnl: pnl.toFixed(2),
                      pnlPct: pnlPct.toFixed(2),
                      closeReason: "manual",
                      openedAt: buyTime || Date.now(),
                    });
                  }} style={{
                    width: "100%", padding: "9px 0", borderRadius: 20, border: "none", cursor: "pointer",
                    background: "rgba(239,83,80,0.15)", outline: "1px solid rgba(239,83,80,0.3)", color: "#ef5350", fontSize: 13, fontWeight: 600,
                  }}>市价卖出全部</button>
                </div>
              )
          )}

          {/* 委托 Tab */}
          {drawerTab === "orders" && (
            limitOrders.length === 0
              ? <EmptyHint text="暂无委托" hint={"切换到「限价」模式，设置目标价格后挂单\n例：当前价 65000，挂 64000 的买单\n价格跌到 64000 时自动成交"} />
              : limitOrders.map(o => (
                  <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 10, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: o.side === "buy" ? "#26a69a" : "#ef5350" }}>
                        {o.side === "buy" ? "买入" : "卖出"} BTC/USDT
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                        限价 {o.price.toFixed(2)} · {o.amount.toFixed(6)} BTC · {o.time}
                      </div>
                    </div>
                    <button onClick={() => setLimitOrders(os => os.filter(x => x.id !== o.id))} style={{
                      padding: "4px 10px", borderRadius: 8, background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 11,
                    }}>撤单</button>
                  </div>
                ))
          )}

          {/* 资产 Tab */}
          {drawerTab === "assets" && (
            <div style={{ fontSize: 13 }}>
              {[
                ["USDT 余额", `${balance.toFixed(2)} USDT`],
                ["BTC 持仓", `${btcHeld.toFixed(6)} BTC`],
                ["持仓市値", `${(btcHeld * currentPrice).toFixed(2)} USDT`],
                ["浮动盈亏", `${unrealizedPnl >= 0 ? "+" : ""}${unrealizedPnl.toFixed(2)} USDT`, unrealizedPnl >= 0 ? "#26a69a" : "#ef5350"],
                ["收益率", `${unrealizedPct >= 0 ? "+" : ""}${unrealizedPct.toFixed(2)}%`, unrealizedPct >= 0 ? "#26a69a" : "#ef5350"],
                ["账户总値", `${(balance + btcHeld * currentPrice).toFixed(2)} USDT`],
              ].map(([k, v, c]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>{k}</span>
                  <span style={{ fontFamily: "monospace", color: (c as string) || "#fff" }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* 历史 Tab */}
          {drawerTab === "history" && (
            <HistoryTab
              records={historyRecords}
              isLoading={false}
              onReset={() => setShowReset(true)}
            />
          )}
        </div>
      </div>

      <Toast msg={msg} />

      {/* 重置确认弹窗 */}
      {showReset && (
        <ResetConfirmModal
          onCancel={() => setShowReset(false)}
          onConfirm={() => {
            resetHistory();
            setBalance(INITIAL_BALANCE);
            setBtcHeld(0);
            setAvgBuyPrice(0);
            setLimitOrders([]);
            setPriceBias(0);
            setSliderPct(0);
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
            <span style={{ fontWeight: 700, color: "#60a5fa" }}>💡 现货交易要点</span>
            <button onClick={() => setShowTip(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}><X size={14} /></button>
          </div>
          <p style={{ marginBottom: 6 }}><strong style={{ color: "#fff" }}>现货交易</strong>：直接买卖真实资产，不使用杠杆，最大亏损为本金</p>
          <p style={{ marginBottom: 6 }}><strong style={{ color: "#fff" }}>市价单</strong>：立即以当前最优价格成交</p>
          <p style={{ marginBottom: 6 }}><strong style={{ color: "#fff" }}>限价单</strong>：设置目标价格，等待市场价到达时自动成交</p>
          <p><strong style={{ color: "#fff" }}>手续费</strong>：每笔交易收取 0.1% 手续费</p>
        </div>
      )}
    </div>
  );
}
