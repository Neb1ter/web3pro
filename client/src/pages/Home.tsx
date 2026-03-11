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
import { useExchangeLinks } from '@/contexts/ExchangeLinksContext';
import {
  TrendingUp, Shield, CheckCircle2, Users, Gift, Zap,
  ChevronDown, BookOpen, Calculator, ChevronRight,
  Lock, Globe, AlertTriangle, ExternalLink, Menu, X,
} from 'lucide-react';
import { useScrollMemory } from '@/hooks/useScrollMemory';
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { SeoManager } from "@/components/SeoManager";

// ... (rest of the file remains the same)

export default function Home() {
  useScrollMemory();
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const zh = language === 'zh';
  const texts = translations[language];
  const { links, loading } = useExchangeLinks();

  const [activeChapter, setActiveChapter] = useState('what-is-rebate');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveChapter(entry.target.id);
          }
        });
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
    );

    CHAPTERS.forEach(ch => {
      const el = document.getElementById(ch.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <SeoManager
        title={zh ? "Get8 Pro | 币圈省钱指南 - 官方认证交易所返佣" : "Get8 Pro | Crypto Saving Guide - Official Exchange Rebates"}
        description={zh ? "通过 Get8 Pro 官方合作的专属邀请码，永久降低主流交易所（币安、OKX、Gate.io 等）的交易手续费，返佣比例公开透明，笔笔可查。" : "Permanently reduce trading fees on major exchanges (Binance, OKX, Gate.io) with exclusive, officially partnered referral codes from Get8 Pro. Transparent and verifiable rebates on every trade."}
        path="/crypto-saving"
        keywords="交易所返佣, 币安返佣, OKX返佣, 手续费折扣, 邀请码, crypto exchange rebates, Binance referral, OKX commission"
      />
      <div className="min-h-screen" style={{ background: '#0A192F' }}>
        <WelcomeGuide />

        {/* ... (rest of the JSX remains the same) */}

      </div>
    </>
  );
}
