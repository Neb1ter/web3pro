import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ExchangeLinksProvider } from "./contexts/ExchangeLinksContext";
import { useEffect, useRef, useState, lazy, Suspense, Component, useMemo } from "react";
import { saveScrollPosition, getScrollPosition } from "@/hooks/useScrollMemory";
import { useLearningPathSync } from "@/hooks/useLearningPathSync";
import { useLanguage } from "@/contexts/LanguageContext";
// 瀵艰埅缁勪欢鎳掑姞杞斤細浣撶Н杈冨ぇ锛圡obileFloatNav 756琛岋紝DesktopFloatNav 555琛岋級锛岄灞忎笉闇€瑕佺珛鍗虫覆鏌?const MobileFloatNav = lazy(() => import("@/components/MobileFloatNav"));
const DesktopFloatNav = lazy(() => import("@/components/DesktopFloatNav"));
import { SchemaManager } from "./components/SchemaManager";
import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";

// ============================================================
// 棣栧睆鍚屾鍔犺浇锛氫粎 Portal锛堥椤碉級鍜?NotFound 淇濇寔鍚屾
// ============================================================
import Portal from "./pages/Portal";
import NotFound from "@/pages/NotFound";

// ============================================================
// 璺敱绾ф噿鍔犺浇锛氭墍鏈夐潪棣栧睆椤甸潰鎸夐渶鍔犺浇
// ============================================================

// 甯佸湀鐪侀挶鎸囧崡鏉垮潡
const Home            = lazy(() => import("./pages/Home"));
const Contact         = lazy(() => import("./pages/Contact"));
const Exchanges       = lazy(() => import("./pages/Exchanges"));
const Beginner        = lazy(() => import("./pages/Beginner"));
const CryptoIntro     = lazy(() => import("./pages/CryptoIntro"));
const CryptoNews      = lazy(() => import("./pages/CryptoNews"));
const ArticleDetail   = lazy(() => import("./pages/ArticleDetail"));
const ArticleList     = lazy(() => import("./pages/ArticleList"));
const ExchangeDetail  = lazy(() => import("./pages/ExchangeDetail"));
const About           = lazy(() => import("./pages/About"));

// Web3 鍏ュ湀鎸囧崡鏉垮潡
const Web3Guide           = lazy(() => import("./pages/Web3Guide"));
const WhatIsWeb3          = lazy(() => import("./pages/web3/WhatIsWeb3"));
const BlockchainBasics    = lazy(() => import("./pages/web3/BlockchainBasics"));
const WalletKeys          = lazy(() => import("./pages/web3/WalletKeys"));
const DefiDeep            = lazy(() => import("./pages/web3/DefiDeep"));
const ExchangeGuideDeep   = lazy(() => import("./pages/web3/ExchangeGuide"));
const InvestmentGateway   = lazy(() => import("./pages/web3/InvestmentGateway"));
const EconomicOpportunity = lazy(() => import("./pages/web3/EconomicOpportunity"));

// 浜ゆ槗鎵€鎸囧崡
const ExchangeGuideIndex   = lazy(() => import("./pages/ExchangeGuideIndex"));
const ExchangeDownload     = lazy(() => import("./pages/ExchangeDownload"));
const ExchangeFeatureDetail = lazy(() => import("./pages/ExchangeFeatureDetail"));

// 鍚庡彴绠＄悊锛堜粎鍐呴儴浣跨敤锛屾噿鍔犺浇鏇村悎閫傦級
const AdminExchangeGuide = lazy(() => import("./pages/AdminExchangeGuide"));
const AdminLogin         = lazy(() => import("./pages/AdminLogin"));

// 妯℃嫙浜ゆ槗娓告垙锛堜綋绉渶澶э紝鎳掑姞杞芥敹鐩婃渶楂橈級
const SpotSim    = lazy(() => import("./pages/sim/SpotSim"));
const FuturesSim = lazy(() => import("./pages/sim/FuturesSim"));
const TradFiSim  = lazy(() => import("./pages/sim/TradFiSim"));
const MarginSim  = lazy(() => import("./pages/sim/MarginSim"));
const OptionsSim = lazy(() => import("./pages/sim/OptionsSim"));
const BotSim     = lazy(() => import("./pages/sim/BotSim"));

// 甯佸湀宸ュ叿鍚堥泦
const CryptoTools    = lazy(() => import("./pages/CryptoTools"));

// 娴嬭瘎涓庡涔犺矾寰?const Web3Quiz       = lazy(() => import("./pages/Web3Quiz"));
const LearningPath   = lazy(() => import("./pages/LearningPath"));
const LearningComplete = lazy(() => import("./pages/LearningComplete"));
const Legal          = lazy(() => import("./pages/Legal"));

// ============================================================
// Chunk 鍔犺浇澶辫触鐨勯敊璇竟鐣岋紙缃戠粶闂/閮ㄧ讲闂鏃舵樉绀洪噸璇曟寜閽級
// ============================================================
interface ChunkErrorState { hasError: boolean; }
class ChunkErrorBoundary extends Component<{ children: React.ReactNode }, ChunkErrorState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): ChunkErrorState {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center gap-6 p-8"
          style={{ background: "#0a192f" }}
        >
          <div className="text-4xl">鈿狅笍</div>
          <h2 className="text-white text-xl font-semibold">椤甸潰鍔犺浇澶辫触</h2>
          <p className="text-slate-400 text-sm text-center max-w-sm">
            璧勬簮鍔犺浇鍑洪敊锛屽彲鑳芥槸缃戠粶闂鎴栫増鏈洿鏂般€傝鍒锋柊椤甸潰閲嶈瘯銆?          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)" }}
          >
            鍒锋柊閲嶈瘯
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================
// 楠ㄦ灦灞?Fallback锛氭噿鍔犺浇杩囨浮鍔ㄧ敾
// ============================================================
function PageSkeleton() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: "#0a192f" }}
    >
      {/* 椤堕儴瀵艰埅楠ㄦ灦 */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-slate-800/60 backdrop-blur-sm border-b border-slate-700/40 z-50" />
      {/* 鍐呭鍖洪鏋?*/}
      <div className="w-full max-w-4xl px-6 pt-20 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-700/50 rounded-lg w-2/3 mx-auto" />
        <div className="h-4 bg-slate-700/40 rounded w-1/2 mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-slate-800/60 rounded-2xl border border-slate-700/30" />
          ))}
        </div>
        <div className="space-y-3 mt-6">
          <div className="h-3 bg-slate-700/40 rounded w-full" />
          <div className="h-3 bg-slate-700/40 rounded w-5/6" />
          <div className="h-3 bg-slate-700/40 rounded w-4/6" />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 椤甸潰杩囨浮鍔ㄧ敾鍖呰鍣?// ============================================================
function PageTransition({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  useLearningPathSync();
  usePageMeta();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<"enter" | "exit">("enter");
  const prevLocation = useRef(location);

  useEffect(() => {
    if (location !== prevLocation.current) {
      saveScrollPosition(prevLocation.current);
      setTransitionStage("exit");
      const timer = setTimeout(() => {
        const nextLocation = location;
        prevLocation.current = nextLocation;
        setDisplayLocation(nextLocation);
        setTransitionStage("enter");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const saved = getScrollPosition(nextLocation);
            if (saved !== null) {
              window.scrollTo({ top: saved, behavior: "instant" });
            } else {
              window.scrollTo({ top: 0, behavior: "instant" });
            }
          });
        });
      }, 280);
      return () => clearTimeout(timer);
    }
  }, [location]);

  return (
    <div
      style={{
        opacity: transitionStage === "exit" ? 0 : 1,
        transition:
          transitionStage === "exit"
            ? "opacity 0.2s ease"
            : "opacity 0.3s ease 0.05s",
      }}
    >
      {children}
    </div>
  );
}

// ============================================================
// 鍔ㄦ€?Meta锛氭牴鎹矾鐢辨洿鏂?title 鍜?description锛圫EO锛?// ============================================================
const PAGE_META: Record<string, { title: string; desc: string }> = {
  "/":                    { title: "Get8 Pro 鈥?瀹樻柟璁よ瘉杩斾剑 | Web3 涓撲笟浜ゆ槗鑰呭鑸钩鍙?, desc: "Get8 Pro 鎻愪緵瀹樻柟璁よ瘉鐨勪氦鏄撴墍杩斾剑銆佹潈濞佹暟鎹垎鏋愪笌鐙珛璇勬祴锛屽姪浣犻檷浣庝氦鏄撴垚鏈紝鎻愬崌鍐崇瓥鏁堢巼銆? },
  "/portal":              { title: "Get8 Pro 鈥?瀹樻柟璁よ瘉杩斾剑 | Web3 涓撲笟浜ゆ槗鑰呭鑸钩鍙?, desc: "Get8 Pro 鎻愪緵瀹樻柟璁よ瘉鐨勪氦鏄撴墍杩斾剑銆佹潈濞佹暟鎹垎鏋愪笌鐙珛璇勬祴锛屽姪浣犻檷浣庝氦鏄撴垚鏈紝鎻愬崌鍐崇瓥鏁堢巼銆? },
  "/crypto-saving":       { title: "甯佸湀鐪侀挶鎸囧崡 鈥?Get8 Pro", desc: "鏈€鍏ㄤ氦鏄撴墍杩斾剑鏀荤暐锛孊inance銆丱KX銆丟ate.io 瀹樻柟璁よ瘉杩斾剑锛屾渶楂樿妭鐪?60% 鎵嬬画璐广€? },
  "/exchanges":           { title: "浜ゆ槗鎵€瀵规瘮 鈥?Get8 Pro", desc: "瀹㈣瀵规瘮涓绘祦鍔犲瘑璐у竵浜ゆ槗鎵€鐨勬墜缁垂銆佸畨鍏ㄦ€с€佸姛鑳戒笌杩斾剑姣斾緥锛屾壘鍒版渶閫傚悎浣犵殑骞冲彴銆? },
  "/exchange-guide":      { title: "浜ゆ槗鎵€鍔熻兘鎸囧崡 鈥?Get8 Pro", desc: "娣卞害瑙ｆ瀽鍚勫ぇ浜ゆ槗鎵€鍔熻兘宸紓锛岀幇璐с€佸悎绾︺€佹潬鏉嗐€佺悊璐竴缃戞墦灏姐€? },
  "/beginner":            { title: "鏂版墜闂瓟 鈥?Get8 Pro", desc: "甯佸湀鍩虹鐭ヨ瘑 Q&A锛屼粠鍖哄潡閾惧師鐞嗗埌浜ゆ槗鎶€宸э紝闆跺熀纭€鍏ラ棬鍔犲瘑璐у竵銆? },
  "/crypto-intro":        { title: "鍔犲瘑璐у竵鍏ラ棬 鈥?Get8 Pro", desc: "绯荤粺瀛︿範鍔犲瘑璐у竵鍩虹鐭ヨ瘑锛屼簡瑙ｆ瘮鐗瑰竵銆佷互澶潑銆丏eFi 鍜?NFT 鐨勬牳蹇冩蹇点€? },
  "/crypto-news":         { title: "鍔犲瘑蹇 鈥?Get8 Pro", desc: "瀹炴椂杩借釜鍔犲瘑璐у竵甯傚満鍔ㄦ€併€佹斂绛栨硶瑙勩€佷氦鏄撴墍鍏憡锛屾帉鎻℃渶鏂拌鎯呰祫璁€? },
  "/web3-guide":          { title: "Web3 鍏ュ湀鎸囧崡 鈥?Get8 Pro", desc: "浠庨浂寮€濮嬩簡瑙?Web3 涓栫晫锛屽尯鍧楅摼銆侀挶鍖呫€丏eFi銆丯FT 鍏ㄩ潰绉戞櫘銆? },
  "/contact":             { title: "鑱旂郴鎴戜滑 鈥?Get8 Pro", desc: "鏈変换浣曢棶棰樻垨鍚堜綔鎰忓悜锛屾杩庤仈绯?Get8 Pro 鍥㈤槦銆? },
  "/legal":               { title: "娉曞緥澹版槑 鈥?Get8 Pro", desc: "Get8 Pro 浣跨敤鏉℃銆侀殣绉佹斂绛栦笌鍏嶈矗澹版槑銆? },
  "/about":               { title: "鍏充簬鎴戜滑 鈥?Get8 Pro | Web3涓撲笟浜ゆ槗鑰呯殑鍙俊瀵艰埅浠?, desc: "Get8 Pro 鏄笓娉ㄤ簬鍔犲瘑璐у竵浜ゆ槗鎵€杩斾剑銆乄eb3 鏁欒偛鍜屽伐鍏风殑涓撲笟骞冲彴銆? },
  "/articles":            { title: "鍔犲瘑璐у竵娣卞害鏂囩珷 鈥?浜ゆ槗鎵€璇勬祴銆佽繑浣ｆ敾鐣ャ€乄eb3鏁欑▼ | Get8 Pro", desc: "Get8 Pro 涓撲笟鍐呭涓績锛氫氦鏄撴墍鎵嬬画璐瑰姣斻€佽繑浣ｆ敾鐣ャ€佸悎绾︿氦鏄撴暀绋嬨€乄eb3鍏ラ棬鎸囧崡銆? },
  "/exchange/gate":       { title: "Gate.io 璇勬祴2026锛氭墜缁垂銆?0%杩斾剑銆佸畨鍏ㄦ€у畬鏁存寚鍗?| Get8 Pro", desc: "Gate.io璇︾粏璇勬祴锛?600+甯佺锛?0%杩斾剑鍏ㄨ涓氭渶楂橈紝榛樺厠灏旀爲鍌ㄥ璇佹槑銆? },
  "/exchange/okx":        { title: "OKX 璇勬祴2026锛氭墜缁垂銆佽繑浣ｃ€乄eb3鐢熸€佸畬鏁存寚鍗?| Get8 Pro", desc: "OKX璇︾粏璇勬祴锛歐eb3閽卞寘鏀寔100+鍏摼锛岀幇璐aker 0.08%锛?0%杩斾剑銆? },
  "/exchange/binance":    { title: "甯佸畨璇勬祴2026锛氭墜缁垂銆佽繑浣ｃ€佸畨鍏ㄦ€у畬鏁存寚鍗?| Get8 Pro", desc: "甯佸畨璇︾粏璇勬祴锛氬叏鐞冩渶澶т氦鏄撴墍锛孋oinGlass璇勫垎94.33锛孊NB鎶樻墸25%锛?0%杩斾剑銆? },
  "/exchange/bybit":      { title: "Bybit 璇勬祴2026锛氬悎绾︽墜缁垂0.01%銆佽繑浣ｃ€佸畨鍏ㄦ€?| Get8 Pro", desc: "Bybit璇︾粏璇勬祴锛氬悎绾aker璐圭巼0.01%鍏ㄨ涓氭渶浣庯紝30%杩斾剑銆? },
  "/exchange/bitget":     { title: "Bitget 璇勬祴2026锛氱幇璐ф墜缁垂0.02%銆佽窡鍗曚氦鏄撱€?0%杩斾剑 | Get8 Pro", desc: "Bitget璇︾粏璇勬祴锛氱幇璐aker 0.02%鍏ㄨ涓氭渶浣庯紝50%杩斾剑銆? },
};

function usePageMeta() {
  const [location] = useLocation();
  const { language } = useLanguage();
  useEffect(() => {
    const meta = PAGE_META[location] ?? PAGE_META["/"];
    const fallbackTitle = "Get8 Pro | Web3 Trading Navigation Platform";
    const fallbackDesc =
      "Get8 Pro provides exchange comparison, rebate guides, Web3 education, and tools to help users lower trading costs.";
    const title = meta?.title?.includes("?") ? fallbackTitle : meta?.title || fallbackTitle;
    const desc = meta?.desc?.includes("?") ? fallbackDesc : meta?.desc || fallbackDesc;
    const canonicalUrl = `https://get8.pro${location === "/" ? "/" : location}`;

    document.title = title;
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";

    const updateMeta = (selector: string, value: string, attr: "content" | "href" = "content") => {
      const element = document.querySelector(selector);
      if (element) {
        element.setAttribute(attr, value);
      }
    };

    updateMeta('meta[name="description"]', desc);
    updateMeta('meta[property="og:title"]', title);
    updateMeta('meta[property="og:description"]', desc);
    updateMeta('meta[property="og:url"]', canonicalUrl);
    updateMeta('meta[name="twitter:title"]', title);
    updateMeta('meta[name="twitter:description"]', desc);
    updateMeta('meta[name="twitter:url"]', canonicalUrl);
    updateMeta('link[rel="canonical"]', canonicalUrl, "href");
  }, [language, location]);
}


function Router() {
  return (
    <ChunkErrorBoundary>
    <Suspense fallback={<PageSkeleton />}>
      <PageTransition>
        <Switch>
          {/* 鈹€鈹€ 棣栧睆鍚屾璺敱 鈹€鈹€ */}
          <Route path="/"       component={Portal} />
          <Route path="/portal" component={Portal} />

          {/* 鈹€鈹€ 甯佸湀鐪侀挶鎸囧崡鏉垮潡 鈹€鈹€ */}
          <Route path="/crypto-saving" component={Home} />
          <Route path="/contact"       component={Contact} />
          <Route path="/exchanges"     component={Exchanges} />
          <Route path="/beginner"      component={Beginner} />
          <Route path="/crypto-intro"  component={CryptoIntro} />
          <Route path="/crypto-news"   component={CryptoNews} />
          <Route path="/article/:slug"  component={ArticleDetail} />
          <Route path="/articles"         component={ArticleList} />
          {/* 鈹€鈹€ 浜ゆ槗鎵€鐙珛璇︽儏椤?鈹€鈹€ */}
          <Route path="/exchange/:slug"   component={ExchangeDetail} />
          {/* 鈹€鈹€ 鍏充簬鎴戜滑 鈹€鈹€ */}
          <Route path="/about"            component={About} />

          {/* 鈹€鈹€ Web3 鍏ュ湀鎸囧崡鏉垮潡 鈹€鈹€ */}
          <Route path="/web3-guide"                         component={Web3Guide} />
          <Route path="/web3-guide/what-is-web3"            component={WhatIsWeb3} />
          <Route path="/web3-guide/blockchain-basics"       component={BlockchainBasics} />
          <Route path="/web3-guide/wallet-keys"             component={WalletKeys} />
          <Route path="/web3-guide/defi-deep"               component={DefiDeep} />
          <Route path="/web3-guide/exchange-guide"          component={ExchangeGuideDeep} />
          <Route path="/web3-guide/investment-gateway"      component={InvestmentGateway} />
          <Route path="/web3-guide/economic-opportunity"    component={EconomicOpportunity} />

          {/* 鈹€鈹€ 浜ゆ槗鎵€鎸囧崡 鈹€鈹€ */}
          <Route path="/exchange-guide"              component={ExchangeGuideIndex} />
          <Route path="/exchange-download"           component={ExchangeDownload} />
          <Route path="/exchange-guide/:featureSlug" component={ExchangeFeatureDetail} />

          {/* 鈹€鈹€ 鍚庡彴绠＄悊 鈹€鈹€ */}
          <Route path="/manage-m2u0z0i04"    component={AdminLogin} />
          <Route path="/admin/exchange-guide" component={AdminExchangeGuide} />

          {/* 鈹€鈹€ 甯佸湀宸ュ叿鍚堥泦 鈹€鈹€ */}
          <Route path="/tools" component={CryptoTools} />

          {/* 鈹€鈹€ 娴嬭瘎涓庡涔犺矾寰?鈹€鈹€ */}
          <Route path="/web3-quiz"        component={Web3Quiz} />
          <Route path="/learning-path"    component={LearningPath} />
          <Route path="/learning-complete" component={LearningComplete} />
          <Route path="/legal"            component={Legal} />

          {/* 鈹€鈹€ 妯℃嫙浜ゆ槗娓告垙 鈹€鈹€ */}
          <Route path="/sim/spot"    component={SpotSim} />
          <Route path="/sim/futures" component={FuturesSim} />
          <Route path="/sim/tradfi"  component={TradFiSim} />
          <Route path="/sim/margin"  component={MarginSim} />
          <Route path="/sim/options" component={OptionsSim} />
          <Route path="/sim/bot"     component={BotSim} />

          <Route path="404"  component={NotFound} />
          <Route             component={NotFound} />
        </Switch>
      </PageTransition>
    </Suspense>
    </ChunkErrorBoundary>
  );
}

// ============================================================
// 鍏ㄥ眬绂佺敤姘村钩婊戝姩鎵嬪娍锛堥槻姝㈡祻瑙堝櫒瀵艰埅鍒囨崲椤甸潰锛?// ============================================================
function GlobalSwipeBlocker() {
  const [location] = useLocation();
  const isSimPage = location.startsWith("/sim/");

  useEffect(() => {
    let startX = 0, startY = 0;
    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dx > dy && dx > 3) {
        e.preventDefault();
      }
    };
    if (isSimPage) {
      document.addEventListener("touchstart", onTouchStart, { passive: true });
      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.body.style.overscrollBehaviorX = "none";
      document.documentElement.style.overscrollBehaviorX = "none";
    }
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      if (isSimPage) {
        document.body.style.overscrollBehaviorX = "";
        document.documentElement.style.overscrollBehaviorX = "";
      }
    };
  }, [isSimPage]);

  return null;
}

function AppInner() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider defaultTheme="dark">
                <ExchangeLinksProvider>
        <SchemaManager />
            <TooltipProvider>
              <Toaster />
              <Router />
              <Suspense fallback={null}>
                <MobileFloatNav />
                <DesktopFloatNav />
              </Suspense>
              <GlobalSwipeBlocker />
            </TooltipProvider>
          </ExchangeLinksProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

function App() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // 5鍒嗛挓鍐呬笉閲嶆柊璇锋眰锛堝姞瀵嗚祫璁瓑鏁版嵁鏇存柊棰戠巼涓嶉珮锛?        staleTime: 1000 * 60 * 5,
        // 缂撳瓨淇濈暀 30 鍒嗛挓锛屽垏鎹㈤〉闈㈠悗杩斿洖鏃犻渶閲嶆柊鍔犺浇
        gcTime: 1000 * 60 * 30,
        // 澶辫触閲嶈瘯 1 娆″嵆鍙?        retry: 1,
        // 鍒囨崲鏍囩椤垫椂涓嶈嚜鍔ㄩ噸鏂拌姹傦紙鍑忓皯涓嶅繀瑕佺殑缃戠粶璇锋眰锛?        refetchOnWindowFocus: false,
      },
    },
  }));
  const trpcClient = useMemo(() => trpc.createClient({
    links: [
      httpBatchLink({
        url: "/api/trpc",
        transformer: superjson,
      }),
    ],
  }), []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AppInner />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
