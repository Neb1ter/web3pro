/**
 * 交易所中心 — /exchanges
 * 三个 Tab：💰 返佣对比 | 🔍 各交易所详情 | 📚 交易所科普
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollMemory, goBack } from "@/hooks/useScrollMemory";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import {
  ArrowLeft, ExternalLink, Gift, Key, Shield, Star,
  Check, X, ChevronDown, ChevronUp, Users, TrendingUp,
  TrendingDown, Globe, Zap, Clock, BarChart2, Lock,
  RefreshCw, CheckCircle2, ChevronRight, MessageCircle,
} from "lucide-react";
import { EXCHANGE_FEES, SPOT_MAKER_ROW, FUT_MAKER_ROW, REBATE_ROW, INVITE_CODES } from "@shared/exchangeFees";
import { useExchangeLinks } from '@contexts/ExchangeLinksContext';
import { trpc } from "@/lib/trpc";
import { SeoManager } from "@/components/SeoManager";

// ... (rest of the file remains the same)

export default function Exchanges() {
  useScrollMemory();
  const [location, setLocation] = useLocation();
  const { language } = useLanguage();
  const zh = language === 'zh';

  // ... (rest of the component logic remains the same)

  return (
    <>
      <SeoManager
        title={zh ? "交易所返佣对比 | Get8 Pro" : "Exchange Rebate Comparison | Get8 Pro"}
        description={zh ? "对比币安、OKX、Gate.io 等主流交易所的返佣比例、手续费和特点，选择最适合你的交易所，开启低成本交易。" : "Compare rebate rates, fees, and features of major exchanges like Binance, OKX, and Gate.io. Choose the best exchange for you and start low-cost trading."}
        path="/exchanges"
        keywords="交易所对比, 手续费对比, 返佣对比, 币安, OKX, Gate.io, exchange comparison, fee comparison, rebate comparison, Binance, OKX, Gate.io"
      />
      <div className="min-h-screen" style={{ background: "#0A192F" }}>
        {/* ... (rest of the JSX remains the same) */}
      </div>
    </>
  );
}
