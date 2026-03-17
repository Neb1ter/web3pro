/**
 * SimComponents — 三个模拟器共享组件
 * - PositionCard: 仓位卡片（参考 OKX 图2）
 * - TpSlModal: 止盈止损弹窗（全部仓位 / 部分仓位 / 追踪止盈）
 * - CandleChart: K线图
 * - genBook / OrderBook: 订单簿
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronDown, AlertTriangle } from "lucide-react";

// ─── 类型 ─────────────────────────────────────────────────────────────────────
export interface Position {
  id: number;
  symbol: string;          // "BTC/USDT"
  type: "futures" | "margin" | "spot";
  direction: "long" | "short";
  size: number;            // BTC 数量
  entryPrice: number;
  leverage: number;
  margin: number;
  liquidPrice: number;
  marginMode?: "全仓" | "逐仓";  // 保证金模式
  tpPrice?: number;        // 止盈触发价
  slPrice?: number;        // 止损触发价
  trailActivate?: number;  // 追踪止盈激活价
  trailCallback?: number;  // 追踪止盈回调幅度%
}

export interface LimitOrder {
  id: number;
  side: "buy" | "sell";
  price: number;
  amount: number;
  time: string;
}

// ─── K线 ──────────────────────────────────────────────────────────────────────
export interface Candle { open: number; high: number; low: number; close: number; }

// bias: 0 = neutral, positive = bullish, negative = bearish
// 范围建议 -0.15 ~ +0.15，用于让价格向用户操作方向偏移
export function nextCandle(prev: number, bias = 0): Candle {
  const vol   = prev * (0.002 + Math.random() * 0.009);
  const open  = prev;
  // bias 偏移随机中心点：默认 -0.48（轻微下跌），加 bias 后向上/下偏移
  const center = -0.48 + Math.max(-0.35, Math.min(0.35, bias));
  const close = Math.max(prev * 0.7, prev + (Math.random() + center) * vol * 2);
  const high  = Math.max(open, close) * (1 + Math.random() * 0.003);
  const low   = Math.min(open, close) * (1 - Math.random() * 0.003);
  return { open, high, low, close };
}

export function initCandles(n = 80, start = 65000): Candle[] {
  const arr: Candle[] = [];
  let p = start;
  for (let i = 0; i < n; i++) { const c = nextCandle(p); arr.push(c); p = c.close; }
  return arr;
}

export function useDeferredMount(delay = 120) {
  const [ready, setReady] = useState(delay <= 0);

  useEffect(() => {
    if (delay <= 0) return;
    const timer = window.setTimeout(() => setReady(true), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  return ready;
}

export function calcEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  data.forEach((v, i) => { out.push(i === 0 ? v : v * k + out[i - 1] * (1 - k)); });
  return out;
}

export function CandleChart({ candles, height = 200, entryPrice, liquidPrice }: { candles: Candle[]; height?: number; entryPrice?: number; liquidPrice?: number }) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    frame = window.requestAnimationFrame(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || candles.length < 2) return;
    const W = container.clientWidth;
    const H = height;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#0a0e1a"; ctx.fillRect(0, 0, W, H);

    const pad = { top: 8, bottom: 20, left: 2, right: 58 };
    const cW = W - pad.left - pad.right;
    const cH = H - pad.top - pad.bottom;
    const prices = candles.flatMap(c => [c.high, c.low]);
    const minP = Math.min(...prices) * 0.9985;
    const maxP = Math.max(...prices) * 1.0015;
    const range = maxP - minP || 1;
    const toY = (p: number) => pad.top + cH - ((p - minP) / range) * cH;
    const spacing = cW / candles.length;
    const cw = Math.max(1.5, spacing - 1.5);

    ctx.strokeStyle = "rgba(255,255,255,0.04)"; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (cH / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = "9px monospace"; ctx.textAlign = "left";
      ctx.fillText((maxP - (range / 4) * i).toFixed(0), W - pad.right + 4, y + 3);
    }

    const closes = candles.map(c => c.close);
    [{ p: 5, c: "#f59e0b" }, { p: 25, c: "#22c55e" }, { p: 45, c: "#3b82f6" }, { p: 144, c: "#ef4444" }].forEach(({ p, c }) => {
      const ema = calcEMA(closes, p);
      ctx.strokeStyle = c; ctx.lineWidth = 0.8; ctx.beginPath();
      candles.forEach((_, i) => {
        const x = pad.left + i * spacing + spacing / 2;
        i === 0 ? ctx.moveTo(x, toY(ema[i])) : ctx.lineTo(x, toY(ema[i]));
      });
      ctx.stroke();
    });

    candles.forEach((c, i) => {
      const x = pad.left + i * spacing + spacing / 2;
      const bull = c.close >= c.open;
      const color = bull ? "#26a69a" : "#ef5350";
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, toY(c.high)); ctx.lineTo(x, toY(c.low)); ctx.stroke();
      const bodyTop = toY(Math.max(c.open, c.close));
      const bodyH = Math.max(1, Math.abs(toY(c.open) - toY(c.close)));
      ctx.fillRect(x - cw / 2, bodyTop, cw, bodyH);
    });

    const last = candles[candles.length - 1];
    const ly = toY(last.close);
    const bull = last.close >= last.open;
    ctx.setLineDash([3, 3]); ctx.strokeStyle = bull ? "#26a69a" : "#ef5350"; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(pad.left, ly); ctx.lineTo(W - pad.right, ly); ctx.stroke();
    ctx.setLineDash([]);
    const lbl = last.close.toFixed(1);
    const lblW = lbl.length * 6.5 + 8;
    ctx.fillStyle = bull ? "#26a69a" : "#ef5350";
    ctx.fillRect(W - pad.right + 1, ly - 8, lblW, 16);
    ctx.fillStyle = "#fff"; ctx.font = "bold 9px monospace"; ctx.textAlign = "left";
    ctx.fillText(lbl, W - pad.right + 5, ly + 4);

    // 持仓均价线（绿色虚线）
    if (entryPrice && entryPrice >= minP && entryPrice <= maxP) {
      const ey = toY(entryPrice);
      ctx.setLineDash([4, 4]); ctx.strokeStyle = "#26a69a"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(pad.left, ey); ctx.lineTo(W - pad.right, ey); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(38,166,154,0.85)";
      ctx.fillRect(W - pad.right + 1, ey - 8, 42, 16);
      ctx.fillStyle = "#fff"; ctx.font = "bold 8px monospace"; ctx.textAlign = "left";
      ctx.fillText("开仓", W - pad.right + 3, ey - 1);
      ctx.fillText(entryPrice.toFixed(0), W - pad.right + 3, ey + 7);
    }

    // 爆仓线（橙红色虚线）
    if (liquidPrice && liquidPrice >= minP && liquidPrice <= maxP) {
      const lqy = toY(liquidPrice);
      ctx.setLineDash([3, 3]); ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(pad.left, lqy); ctx.lineTo(W - pad.right, lqy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(245,158,11,0.85)";
      ctx.fillRect(W - pad.right + 1, lqy - 8, 42, 16);
      ctx.fillStyle = "#000"; ctx.font = "bold 8px monospace"; ctx.textAlign = "left";
      ctx.fillText("爆仓", W - pad.right + 3, lqy - 1);
      ctx.fillText(liquidPrice.toFixed(0), W - pad.right + 3, lqy + 7);
    }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [candles, height, entryPrice, liquidPrice]);

  return <div ref={containerRef} style={{ width: "100%", height }}><canvas ref={canvasRef} style={{ display: "block" }} /></div>;
}

// ─── 订单簿 ───────────────────────────────────────────────────────────────────
export interface OrderRow { price: number; qty: number; }
export function genBook(mid: number, rows = 5): { asks: OrderRow[]; bids: OrderRow[] } {
  const asks: OrderRow[] = [];
  const bids: OrderRow[] = [];
  for (let i = rows; i >= 1; i--) asks.push({ price: mid + i * 0.2, qty: +(Math.random() * 3 + 0.001).toFixed(4) });
  for (let i = 1; i <= rows; i++) bids.push({ price: mid - i * 0.2, qty: +(Math.random() * 3 + 0.001).toFixed(4) });
  return { asks, bids };
}

export function OrderBook({ asks, bids, mid, decimals = 1 }: {
  asks: OrderRow[]; bids: OrderRow[]; mid: number; decimals?: number;
}) {
  const fmt = (n: number) => n.toFixed(decimals);
  return (
    <div style={{ fontSize: 11, fontFamily: "monospace" }}>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 4px 4px", color: "rgba(255,255,255,0.35)", fontSize: 10 }}>
        <span>价格(USDT)</span><span>数量</span>
      </div>
      {asks.slice().reverse().map((r, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2px 4px" }}>
          <span style={{ color: "#ef5350" }}>{fmt(r.price)}</span>
          <span style={{ color: "rgba(255,255,255,0.6)" }}>{r.qty.toFixed(4)}</span>
        </div>
      ))}
      <div style={{ padding: "4px 4px", borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", margin: "2px 0" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#26a69a", fontFamily: "monospace" }}>{fmt(mid)}</div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>≈ ${fmt(mid)}</div>
      </div>
      {bids.map((r, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2px 4px" }}>
          <span style={{ color: "#26a69a" }}>{fmt(r.price)}</span>
          <span style={{ color: "rgba(255,255,255,0.6)" }}>{r.qty.toFixed(4)}</span>
        </div>
      ))}
      <div style={{ marginTop: 4, padding: "0 4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>
          <span>B 57%</span><span>43% S</span>
        </div>
        <div style={{ height: 3, borderRadius: 2, background: "#ef5350", overflow: "hidden" }}>
          <div style={{ width: "57%", height: "100%", background: "#26a69a" }} />
        </div>
      </div>
    </div>
  );
}

// ─── 止盈止损弹窗 ─────────────────────────────────────────────────────────────
type TpSlTab = "all" | "partial" | "trail";

interface TpSlModalProps {
  pos: Position;
  currentPrice: number;
  onClose: () => void;
  onConfirm: (update: Partial<Position>) => void;
}

export function TpSlModal({ pos, currentPrice, onClose, onConfirm }: TpSlModalProps) {
  const [tab,           setTab]           = useState<TpSlTab>("all");
  const [tpPrice,       setTpPrice]       = useState(pos.tpPrice ? String(pos.tpPrice) : "");
  const [tpPct,         setTpPct]         = useState("");
  const [slPrice,       setSlPrice]       = useState(pos.slPrice ? String(pos.slPrice) : "");
  const [slPct,         setSlPct]         = useState("");
  const [partialPct,    setPartialPct]    = useState(100);
  const [trailActivate, setTrailActivate] = useState(pos.trailActivate ? String(pos.trailActivate) : "");
  const [trailCallback, setTrailCallback] = useState(pos.trailCallback ? String(pos.trailCallback) : "");

  const isLong = pos.direction === "long";
  const pnlPct = isLong
    ? (currentPrice - pos.entryPrice) / pos.entryPrice * pos.leverage * 100
    : (pos.entryPrice - currentPrice) / pos.entryPrice * pos.leverage * 100;
  const mmr = Math.max(0, pos.margin - Math.abs(currentPrice - pos.entryPrice) * pos.size);

  // 价格 ↔ 收益率 联动
  const priceFromPct = (pct: number) => isLong
    ? pos.entryPrice * (1 + pct / 100 / pos.leverage)
    : pos.entryPrice * (1 - pct / 100 / pos.leverage);

  const pctFromPrice = (p: number) => isLong
    ? (p - pos.entryPrice) / pos.entryPrice * pos.leverage * 100
    : (pos.entryPrice - p) / pos.entryPrice * pos.leverage * 100;

  const handleTpPriceChange = (v: string) => {
    setTpPrice(v);
    const p = parseFloat(v);
    if (!isNaN(p)) setTpPct(pctFromPrice(p).toFixed(1));
  };
  const handleTpPctChange = (v: string) => {
    setTpPct(v);
    const pct = parseFloat(v);
    if (!isNaN(pct)) setTpPrice(priceFromPct(pct).toFixed(2));
  };
  const handleSlPriceChange = (v: string) => {
    setSlPrice(v);
    const p = parseFloat(v);
    if (!isNaN(p)) setSlPct(pctFromPrice(p).toFixed(1));
  };
  const handleSlPctChange = (v: string) => {
    setSlPct(v);
    const pct = parseFloat(v);
    if (!isNaN(pct)) setSlPrice(priceFromPct(pct).toFixed(2));
  };

  const handleConfirm = () => {
    if (tab === "trail") {
      onConfirm({
        trailActivate: parseFloat(trailActivate) || undefined,
        trailCallback: parseFloat(trailCallback) || 5,
      });
    } else {
      onConfirm({
        tpPrice: parseFloat(tpPrice) || undefined,
        slPrice: parseFloat(slPrice) || undefined,
      });
    }
    onClose();
  };

  const S = {
    overlay: { position: "fixed" as const, inset: 0, zIndex: 60, display: "flex", flexDirection: "column" as const, justifyContent: "flex-end", background: "rgba(0,0,0,0.5)" },
    sheet:   { background: "#0d1120", borderRadius: "20px 20px 0 0", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh", display: "flex", flexDirection: "column" as const },
    input:   { flex: 1, background: "none", border: "none", color: "#fff", fontSize: 13, outline: "none", minWidth: 0 },
    inputBox:{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 10px", gap: 4 },
    label:   { fontSize: 11, color: "rgba(255,255,255,0.4)" },
    row:     { display: "flex", gap: 8, marginBottom: 8 },
    slider:  { width: "100%", accentColor: "#3b82f6", marginBottom: 2 },
    pctRow:  { display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 8 },
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.sheet} onClick={e => e.stopPropagation()}>
        {/* 标题 */}
        <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>止盈/止损</span>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}><X size={18} /></button>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
            {pos.symbol} · {pos.marginMode ?? (pos.type === "futures" ? "全仓" : "逐仓")} · {pos.leverage}x ·
            <span style={{ color: pos.direction === "long" ? "#26a69a" : "#ef5350", marginLeft: 4 }}>
              {pos.direction === "long" ? "多" : "空"}
            </span>
          </div>
        </div>

        {/* Tab */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 16px" }}>
          {([["all", "全部仓位"], ["partial", "部分仓位"], ["trail", "追踪止盈"]] as [TpSlTab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "10px 0", background: "none", border: "none", cursor: "pointer", fontSize: 13,
              color: tab === t ? "#fff" : "rgba(255,255,255,0.4)",
              fontWeight: tab === t ? 700 : 400,
              borderBottom: tab === t ? "2px solid #3b82f6" : "2px solid transparent",
            }}>{label}</button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
          {/* 价格信息 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12, fontSize: 12 }}>
            {[
              ["最新价格", `${currentPrice.toFixed(2)} USDT`],
              ["开仓均价", `${pos.entryPrice.toFixed(2)} USDT`],
              ["预估强平价", `${pos.liquidPrice.toFixed(2)} USDT`, "#f59e0b"],
              ["维持保证金", `${mmr.toFixed(2)} USDT`],
            ].map(([k, v, c]) => (
              <div key={k} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>{k}</span>
                <span style={{ color: (c as string) || "#fff", fontFamily: "monospace", fontSize: 13 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* 部分仓位：数量选择 */}
          {tab === "partial" && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ ...S.inputBox, marginBottom: 6 }}>
                <span style={S.label}>委托数量 ({pos.symbol.split("/")[0]})</span>
                <input style={S.input} value={`${partialPct}%(≈${(pos.size * partialPct / 100).toFixed(4)})`} readOnly />
              </div>
              <input type="range" min={10} max={100} step={10} value={partialPct}
                onChange={e => setPartialPct(+e.target.value)} style={S.slider} />
              <div style={S.pctRow}>
                {[10, 25, 50, 75, 100].map(p => <span key={p}>{p}%</span>)}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>持仓数量 {pos.size.toFixed(4)} {pos.symbol.split("/")[0]}</div>
            </div>
          )}

          {/* 追踪止盈 */}
          {tab === "trail" && (
            <div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
                  激活价格 <span style={{ fontSize: 10 }}>（价格到达此处后开始追踪）</span>
                </div>
                <div style={S.inputBox}>
                  <input style={S.input} value={trailActivate} onChange={e => setTrailActivate(e.target.value)} placeholder="激活价格" />
                  <span style={S.label}>USDT</span>
                </div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
                  回调幅度 <span style={{ fontSize: 10 }}>（价格从最高点回落此幅度时触发平仓）</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ ...S.inputBox, flex: 1 }}>
                    <input style={S.input} value={trailCallback} onChange={e => setTrailCallback(e.target.value)} placeholder="回调幅度" />
                    <span style={S.label}>%</span>
                  </div>
                  {[5, 10].map(v => (
                    <button key={v} onClick={() => setTrailCallback(String(v))} style={{
                      padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12,
                      background: trailCallback === String(v) ? "#3b82f6" : "rgba(255,255,255,0.08)",
                      color: "#fff",
                    }}>{v}%</button>
                  ))}
                </div>
              </div>
              <div style={{ padding: "8px 10px", background: "rgba(59,130,246,0.08)", borderRadius: 8, fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
                💡 例：激活价 70000，回调 5%。价格涨到 70000 后开始追踪，若从最高点回落 5% 则自动平仓，锁住大部分利润。
              </div>
            </div>
          )}

          {/* 全部/部分仓位：止盈止损输入 */}
          {tab !== "trail" && (
            <>
              {/* 止盈 */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>止盈</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>最新价格 ▾</span>
                </div>
                <div style={S.row}>
                  <div style={S.inputBox}>
                    <input style={S.input} value={tpPrice} onChange={e => handleTpPriceChange(e.target.value)} placeholder="触发价格" />
                    <span style={S.label}>USDT</span>
                  </div>
                  <div style={S.inputBox}>
                    <input style={S.input} value={tpPct} onChange={e => handleTpPctChange(e.target.value)} placeholder="收益率" />
                    <span style={S.label}>%</span>
                  </div>
                </div>
                <input type="range" min={0} max={200} step={5} value={parseFloat(tpPct) || 0}
                  onChange={e => handleTpPctChange(e.target.value)} style={{ ...S.slider, accentColor: "#26a69a" }} />
                <div style={S.pctRow}><span>0%</span><span>50%</span><span>100%</span><span>150%</span><span>200%</span></div>
                {tab === "partial" && (
                  <div style={{ ...S.inputBox, marginBottom: 4 }}>
                    <span style={S.label}>委托价格</span>
                    <div style={{ flex: 1 }} />
                    <span style={{ padding: "3px 10px", background: "rgba(255,255,255,0.1)", borderRadius: 6, fontSize: 12 }}>市价</span>
                  </div>
                )}
              </div>

              {/* 止损 */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>止损</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>最新价格 ▾</span>
                </div>
                <div style={S.row}>
                  <div style={S.inputBox}>
                    <input style={S.input} value={slPrice} onChange={e => handleSlPriceChange(e.target.value)} placeholder="触发价格" />
                    <span style={S.label}>USDT</span>
                  </div>
                  <div style={S.inputBox}>
                    <input style={S.input} value={slPct} onChange={e => handleSlPctChange(e.target.value)} placeholder="收益率" />
                    <span style={S.label}>%</span>
                  </div>
                </div>
                <input type="range" min={0} max={200} step={5} value={Math.abs(parseFloat(slPct) || 0)}
                  onChange={e => handleSlPctChange(String(-parseFloat(e.target.value)))} style={{ ...S.slider, accentColor: "#ef5350" }} />
                <div style={S.pctRow}><span>0%</span><span>50%</span><span>100%</span><span>150%</span><span>200%</span></div>
                {tab === "partial" && (
                  <div style={{ ...S.inputBox, marginBottom: 4 }}>
                    <span style={S.label}>委托价格</span>
                    <div style={{ flex: 1 }} />
                    <span style={{ padding: "3px 10px", background: "rgba(255,255,255,0.1)", borderRadius: 6, fontSize: 12 }}>市价</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* 风险提示 */}
          <div style={{ padding: "8px 10px", background: "rgba(239,83,80,0.07)", borderRadius: 8, marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
              <AlertTriangle size={13} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 11, color: "#f59e0b" }}>由于行情变动快，止损触发价不宜离预估强平价过近，避免触发失败。</span>
            </div>
          </div>
        </div>

        {/* 确认按钮 */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={handleConfirm} style={{
            width: "100%", padding: "13px 0", borderRadius: 24, border: "none", cursor: "pointer",
            background: "#3b82f6", color: "#fff", fontSize: 15, fontWeight: 700,
          }}>确认</button>
        </div>
      </div>
    </div>
  );
}

// ─── 仓位卡片（参考 OKX 图2）─────────────────────────────────────────────────
interface PositionCardProps {
  pos: Position;
  currentPrice: number;
  onClose: (pos: Position, reason?: string, exitPriceOverride?: number) => void;
  onReverse: (pos: Position) => void;
  onTpSl: (pos: Position) => void;
}

export function PositionCard({ pos, currentPrice, onClose, onReverse, onTpSl }: PositionCardProps) {
  const isLong = pos.direction === "long";
  const pnl = isLong
    ? (currentPrice - pos.entryPrice) * pos.size
    : (pos.entryPrice - currentPrice) * pos.size;
  const pnlPct = pnl / pos.margin * 100;
  const mmr = Math.max(0, pos.margin + pnl);
  const markPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.0002);

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: "12px 14px", marginBottom: 10, border: "1px solid rgba(255,255,255,0.07)" }}>
      {/* 标题行 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{pos.symbol.replace("/", "")}</span>
          <span style={{
            fontSize: 11, padding: "2px 6px", borderRadius: 4, fontWeight: 700,
            background: isLong ? "rgba(38,166,154,0.2)" : "rgba(239,83,80,0.2)",
            color: isLong ? "#26a69a" : "#ef5350",
          }}>{isLong ? "多" : "空"}</span>
          <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}>
            {pos.marginMode ?? (pos.type === "futures" ? "全仓" : "逐仓")}
          </span>
          <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}>
            {pos.leverage}x
          </span>
        </div>
      </div>

      {/* 未实现盈亏 + 收益率 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>未实现盈亏 (USDT)</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: pnl >= 0 ? "#26a69a" : "#ef5350", fontFamily: "monospace" }}>
            {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>≈ ${pnl.toFixed(2)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>收益率</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: pnlPct >= 0 ? "#26a69a" : "#ef5350", fontFamily: "monospace" }}>
            {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* 数据网格 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px 0", marginBottom: 10, fontSize: 12 }}>
        {[
          ["持仓数量", `${pos.size.toFixed(4)}`],
          ["维持保证金", `${mmr.toFixed(2)}`],
          ["MMR", "999+%", "#26a69a"],
          ["开仓均价", `${pos.entryPrice.toFixed(2)}`],
          ["标记价格", `${markPrice.toFixed(2)}`],
          ["预估强平价", `${pos.liquidPrice.toFixed(2)}`, "#f59e0b"],
        ].map(([k, v, c]) => (
          <div key={k} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{k}</span>
            <span style={{ color: (c as string) || "#fff", fontFamily: "monospace", fontWeight: 600 }}>{v}</span>
          </div>
        ))}
      </div>

      {/* 止盈止损标签 */}
      {(pos.tpPrice || pos.slPrice || pos.trailActivate) && (
        <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
          {pos.tpPrice && (
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, background: "rgba(38,166,154,0.15)", color: "#26a69a" }}>
              止盈 {pos.tpPrice.toFixed(2)}
            </span>
          )}
          {pos.slPrice && (
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, background: "rgba(239,83,80,0.15)", color: "#ef5350" }}>
              止损 {pos.slPrice.toFixed(2)}
            </span>
          )}
          {pos.trailActivate && (
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}>
              追踪止盈 激活:{pos.trailActivate.toFixed(2)} 回调:{pos.trailCallback}%
            </span>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onReverse(pos)} style={{
          flex: 1, padding: "9px 0", borderRadius: 20, border: "none", cursor: "pointer",
          background: "rgba(255,255,255,0.09)", color: "#fff", fontSize: 13, fontWeight: 600,
        }}>反手</button>
        <button onClick={() => onTpSl(pos)} style={{
          flex: 1, padding: "9px 0", borderRadius: 20, border: "none", cursor: "pointer",
          background: "rgba(255,255,255,0.09)", color: "#fff", fontSize: 13, fontWeight: 600,
        }}>止盈/止损</button>
        <button onClick={() => onClose(pos)} style={{
          flex: 1, padding: "9px 0", borderRadius: 20, border: "none", cursor: "pointer",
          background: "rgba(255,255,255,0.09)", color: "#fff", fontSize: 13, fontWeight: 600,
        }}>平仓</button>
      </div>
    </div>
  );
}

// ─── 空状态提示 ───────────────────────────────────────────────────────────────
export function EmptyHint({ text, hint }: { text: string; hint?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "28px 16px" }}>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: hint ? 8 : 0 }}>{text}</div>
      {hint && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

// ─── 历史仓位 Tab ──────────────────────────────────────────────────────────────
export interface HistoryRecord {
  id: number;
  simType: string;
  symbol: string;
  direction: string;
  entryPrice: string;
  exitPrice: string;
  size: string;
  leverage: number;
  pnl: string;
  pnlPct: string;
  closeReason: string;
  marginMode?: string | null;
  openedAt: number;  // timestamp ms
  closedAt: number;  // timestamp ms
}

// ─── localStorage 历史记录 hook ─────────────────────────────────────────────
const MAX_HISTORY = 200;

// 全局事件总线：确保同一页面内所有订阅者即时收到更新
const historyListeners = new Map<string, Set<() => void>>();

function notifyListeners(key: string) {
  historyListeners.get(key)?.forEach(fn => fn());
}

function readFromStorage(key: string): HistoryRecord[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}

export function useLocalHistory(simType: string) {
  const KEY = `sim_history_${simType}`;
  const [records, setRecords] = useState<HistoryRecord[]>(() => readFromStorage(KEY));

  // 注册监听器，当其他地方写入时即时更新
  useEffect(() => {
    const listener = () => setRecords(readFromStorage(KEY));
    if (!historyListeners.has(KEY)) historyListeners.set(KEY, new Set());
    historyListeners.get(KEY)!.add(listener);
    // 同步一次，防止挂载时数据过期
    listener();
    return () => { historyListeners.get(KEY)?.delete(listener); };
  }, [KEY]);

  const addRecord = useCallback((rec: Omit<HistoryRecord, "id" | "closedAt">) => {
    const current = readFromStorage(KEY);
    const next: HistoryRecord[] = [
      { ...rec, id: Date.now(), closedAt: Date.now() },
      ...current,
    ].slice(0, MAX_HISTORY);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    // 直接更新 state + 通知所有监听器
    setRecords(next);
    notifyListeners(KEY);
  }, [KEY]);

  const resetRecords = useCallback(() => {
    try { localStorage.removeItem(KEY); } catch {}
    setRecords([]);
    notifyListeners(KEY);
  }, [KEY]);

  return { records, addRecord, resetRecords };
}

export function HistoryTab({
  records,
  isLoading,
  onReset,
}: {
  records: HistoryRecord[];
  isLoading: boolean;
  onReset: () => void;
}) {
  if (isLoading) {
    return <div style={{ textAlign: "center", padding: "28px 16px", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>加载中...</div>;
  }
  if (records.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "28px 16px" }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>暂无历史交易记录</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", lineHeight: 1.6 }}>
          平仓后交易记录会自动保存在本地
          <br />无需登录，重置后记录将被清空
        </div>
      </div>
    );
  }
  const totalPnl = records.reduce((sum, r) => sum + parseFloat(r.pnl), 0);
  const winCount = records.filter(r => parseFloat(r.pnl) > 0).length;
  const winRate = records.length > 0 ? (winCount / records.length * 100).toFixed(0) : "0";

  return (
    <div>
      {/* 汇总统计 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "10px 0", marginBottom: 8 }}>
        {[
          ["总盈亏 (USDT)", totalPnl >= 0 ? `+${totalPnl.toFixed(2)}` : totalPnl.toFixed(2), totalPnl >= 0 ? "#26a69a" : "#ef5350"],
          ["胜率", `${winRate}%`, parseFloat(winRate) >= 50 ? "#26a69a" : "#ef5350"],
          ["交易次数", `${records.length}次`, "#fff"],
        ].map(([k, v, c]) => (
          <div key={k} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>{k}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: c as string, fontFamily: "monospace" }}>{v}</div>
          </div>
        ))}
      </div>

      {/* 记录列表 */}
      {records.map(r => {
        const pnl = parseFloat(r.pnl);
        const pnlPct = parseFloat(r.pnlPct);
        const isProfit = pnl >= 0;
        const closeReasonMap: Record<string, string> = {
          manual: "手动平仓",
          tp: "止盈触发",
          sl: "止损触发",
          liquidated: "被强平",
          reversed: "反手平仓",
        };
        const dirLabel = { long: "多", short: "空", buy: "买入", sell: "卖出" }[r.direction] || r.direction;
        const dirColor = ["long", "buy"].includes(r.direction) ? "#26a69a" : "#ef5350";
        return (
          <div key={r.id} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "10px 12px", marginBottom: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
            {/* 标题行 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{r.symbol.replace("/", "")}</span>
                <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 4, background: isProfit ? "rgba(38,166,154,0.15)" : "rgba(239,83,80,0.15)", color: dirColor, fontWeight: 700 }}>{dirLabel}</span>
                {r.leverage > 1 && <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" }}>{r.leverage}x</span>}
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{closeReasonMap[r.closeReason] || r.closeReason}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: isProfit ? "#26a69a" : "#ef5350", fontFamily: "monospace" }}>
                  {isProfit ? "+" : ""}{pnl.toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: isProfit ? "#26a69a" : "#ef5350", fontFamily: "monospace" }}>
                  {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
                </div>
              </div>
            </div>
            {/* 价格行 */}
            <div style={{ display: "flex", gap: 16, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
              <span>开仓 <span style={{ color: "rgba(255,255,255,0.7)" }}>{parseFloat(r.entryPrice).toFixed(2)}</span></span>
              <span>平仓 <span style={{ color: "rgba(255,255,255,0.7)" }}>{parseFloat(r.exitPrice).toFixed(2)}</span></span>
              <span>数量 <span style={{ color: "rgba(255,255,255,0.7)" }}>{parseFloat(r.size).toFixed(4)}</span></span>
            </div>
            {/* 时间 */}
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>
              {new Date(r.closedAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        );
      })}

      {/* 重置按鈕 */}
      <div style={{ padding: "12px 0 4px", textAlign: "center" }}>
        <button onClick={onReset} style={{
          padding: "8px 24px", borderRadius: 20, border: "1px solid rgba(239,83,80,0.4)",
          background: "transparent", color: "rgba(239,83,80,0.8)", fontSize: 12, cursor: "pointer",
        }}>重置模拟数据</button>
      </div>
    </div>
  );
}

// ─── 重置确认弹窗 ──────────// ─── 重置确认弹窗 ─────────────────────────────────────────────
export function ResetConfirmModal({
  onConfirm,
  onCancel,
  isLoading = false,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 24px",
    }}>
      <div style={{ background: "#1a1f2e", borderRadius: 18, padding: "24px 20px", width: "100%", maxWidth: 360, border: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <AlertTriangle size={20} color="#f59e0b" />
          <span style={{ fontWeight: 700, fontSize: 16 }}>确认重置</span>
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginBottom: 20 }}>
          重置后，以下数据将被清除：
          <br />• 所有历史交易记录
          <br />• 当前模拟资金（恢复初始资金）
          <br /><br />
          <span style={{ color: "#f59e0b", fontWeight: 600 }}>此操作不可撤销，请谨慎确认。</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "11px 0", borderRadius: 20, border: "1px solid rgba(255,255,255,0.15)",
            background: "transparent", color: "rgba(255,255,255,0.7)", fontSize: 14, cursor: "pointer",
          }}>否，保留</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "11px 0", borderRadius: 20, border: "none",
            background: "#ef5350", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}>确认重置</button>
        </div>
      </div>
    </div>
  );
}

// ─── 仓位分配滑动条（移动端优化版）────────────────────────────────────────────
/**
 * PercentSlider — 替代原生 <input type="range">
 * - Pointer Events API 确保跟手，支持触摸/鼠标
 * - 5 档快捷按钮（25/50/75/100%）
 * - 滑道高度 4px，拇指 22px，触摸区域 44px
 */
export function PercentSlider({
  value,
  onChange,
  color = "#26a69a",
}: {
  value: number;           // 0-100
  onChange: (v: number) => void;
  color?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const calcPct = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    onChange(Math.round(calcPct(e.clientX)));
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    onChange(Math.round(calcPct(e.clientX)));
  };
  const onPointerUp = () => { dragging.current = false; };

  const SNAPS = [0, 25, 50, 75, 100];

  return (
    <div style={{ marginBottom: 10, userSelect: "none" }}>
      {/* 滑道区域（含拇指） */}
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position: "relative",
          height: 44,           // 触摸热区
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          touchAction: "none",
        }}
      >
        {/* 背景轨道 */}
        <div style={{
          position: "absolute", left: 0, right: 0,
          height: 4, borderRadius: 2,
          background: "rgba(255,255,255,0.12)",
        }} />
        {/* 已填充部分 */}
        <div style={{
          position: "absolute", left: 0,
          width: `${value}%`,
          height: 4, borderRadius: 2,
          background: color,
          transition: dragging.current ? "none" : "width 0.1s",
        }} />
        {/* 刻度点 */}
        {[25, 50, 75].map(p => (
          <div key={p} style={{
            position: "absolute",
            left: `${p}%`,
            transform: "translateX(-50%)",
            width: 3, height: 3, borderRadius: "50%",
            background: value >= p ? color : "rgba(255,255,255,0.25)",
            pointerEvents: "none",
          }} />
        ))}
        {/* 拇指 */}
        <div style={{
          position: "absolute",
          left: `${value}%`,
          transform: "translateX(-50%)",
          width: 22, height: 22, borderRadius: "50%",
          background: color,
          border: "3px solid rgba(255,255,255,0.9)",
          boxShadow: `0 0 8px ${color}88`,
          pointerEvents: "none",
          transition: dragging.current ? "none" : "left 0.1s",
        }} />
      </div>
      {/* 快捷档位按钮 */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
        {SNAPS.map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            style={{
              padding: "3px 0",
              minWidth: 36,
              borderRadius: 6,
              border: value === p ? `1px solid ${color}` : "1px solid rgba(255,255,255,0.12)",
              background: value === p ? `${color}22` : "transparent",
              color: value === p ? color : "rgba(255,255,255,0.4)",
              fontSize: 10,
              fontWeight: value === p ? 700 : 400,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {p === 0 ? "○" : `${p}%`}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 消息提示 ─────────────────────────────────────────────────────────────────
export function Toast({ msg }: { msg: { text: string; ok: boolean } | null }) {
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)", zIndex: 50,
      padding: "8px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600,
      background: msg.ok ? "rgba(38,166,154,0.9)" : "rgba(239,83,80,0.9)",
      color: "#fff", backdropFilter: "blur(8px)", whiteSpace: "nowrap",
      boxShadow: "0 4px 16px rgba(0,0,0,0.4)", pointerEvents: "none",
    }}>{msg.text}</div>
  );
}
