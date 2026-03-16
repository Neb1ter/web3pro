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
import { preloadRoutes, scheduleIdle } from "@/lib/routePreload";
// Delay loading large floating nav bundles until idle time.
const MobileFloatNav = lazy(() => import("@/components/MobileFloatNav"));
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

// 娴嬭瘎涓庡涔犺矾寰?
const Web3Quiz       = lazy(() => import("./pages/Web3Quiz"));
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
// Dynamic route meta kept in ASCII-safe literals to avoid encoding-related build failures.
// ============================================================
const PAGE_META: Record<string, { title: string; desc: string }> = {
  "/": { title: "Get8 Pro | Web3 Trading Navigation Platform", desc: "Get8 Pro provides exchange comparison, rebate guides, Web3 education, and tools to help users lower trading costs." },
  "/portal": { title: "Get8 Pro | Web3 Trading Navigation Platform", desc: "Get8 Pro provides exchange comparison, rebate guides, Web3 education, and tools to help users lower trading costs." },
  "/crypto-saving": { title: "Crypto Saving Guide | Get8 Pro", desc: "Compare exchange fees, rebate options, and onboarding paths for lower-cost trading." },
  "/exchanges": { title: "Exchange Comparison | Get8 Pro", desc: "Compare major crypto exchanges across fees, security, liquidity, and feature coverage." },
  "/exchange-guide": { title: "Exchange Guide | Get8 Pro", desc: "Explore exchange features, product differences, and beginner-friendly trading guidance." },
  "/beginner": { title: "Beginner Guide | Get8 Pro", desc: "Learn crypto basics, trading concepts, safety tips, and common beginner questions." },
  "/crypto-intro": { title: "Crypto Intro | Get8 Pro", desc: "A practical introduction to crypto, Bitcoin, Ethereum, DeFi, and on-chain concepts." },
  "/crypto-news": { title: "Crypto News Hub | Get8 Pro", desc: "Track crypto news, market updates, exchange announcements, and policy developments." },
  "/web3-guide": { title: "Web3 Guide | Get8 Pro", desc: "Understand Web3 fundamentals, wallets, DeFi, and the broader on-chain ecosystem." },
  "/contact": { title: "Contact | Get8 Pro", desc: "Contact the Get8 Pro team for support, cooperation, and rebate-related questions." },
  "/legal": { title: "Legal | Get8 Pro", desc: "Read the terms, privacy information, and risk disclosures for Get8 Pro." },
  "/about": { title: "About | Get8 Pro", desc: "Learn more about Get8 Pro and its focus on exchange guidance, Web3 education, and tools." },
  "/articles": { title: "Articles | Get8 Pro", desc: "Browse in-depth articles, exchange reviews, rebate strategy guides, and Web3 tutorials." },
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
  const [showFloatNav, setShowFloatNav] = useState(false);

  useEffect(() => {
    return scheduleIdle(() => {
      setShowFloatNav(true);
      preloadRoutes(["/crypto-saving", "/exchanges", "/web3-guide", "/crypto-news"]);
    }, 1500);
  }, []);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider defaultTheme="dark">
                <ExchangeLinksProvider>
        <SchemaManager />
            <TooltipProvider>
              <Toaster />
              <Router />
              {showFloatNav ? (
                <Suspense fallback={null}>
                  <MobileFloatNav />
                  <DesktopFloatNav />
                </Suspense>
              ) : null}
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
