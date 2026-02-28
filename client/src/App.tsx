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
import MobileFloatNav from "@/components/MobileFloatNav";
import DesktopFloatNav from "@/components/DesktopFloatNav";
import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";

// ============================================================
// 首屏同步加载：仅 Portal（首页）和 NotFound 保持同步
// ============================================================
import Portal from "./pages/Portal";
import NotFound from "@/pages/NotFound";

// ============================================================
// 路由级懒加载：所有非首屏页面按需加载
// ============================================================

// 币圈省钱指南板块
const Home            = lazy(() => import("./pages/Home"));
const Contact         = lazy(() => import("./pages/Contact"));
const Exchanges       = lazy(() => import("./pages/Exchanges"));
const Beginner        = lazy(() => import("./pages/Beginner"));
const CryptoIntro     = lazy(() => import("./pages/CryptoIntro"));
const CryptoNews      = lazy(() => import("./pages/CryptoNews"));

// Web3 入圈指南板块
const Web3Guide           = lazy(() => import("./pages/Web3Guide"));
const WhatIsWeb3          = lazy(() => import("./pages/web3/WhatIsWeb3"));
const BlockchainBasics    = lazy(() => import("./pages/web3/BlockchainBasics"));
const WalletKeys          = lazy(() => import("./pages/web3/WalletKeys"));
const DefiDeep            = lazy(() => import("./pages/web3/DefiDeep"));
const ExchangeGuideDeep   = lazy(() => import("./pages/web3/ExchangeGuide"));
const InvestmentGateway   = lazy(() => import("./pages/web3/InvestmentGateway"));
const EconomicOpportunity = lazy(() => import("./pages/web3/EconomicOpportunity"));

// 交易所指南
const ExchangeGuideIndex   = lazy(() => import("./pages/ExchangeGuideIndex"));
const ExchangeDownload     = lazy(() => import("./pages/ExchangeDownload"));
const ExchangeFeatureDetail = lazy(() => import("./pages/ExchangeFeatureDetail"));

// 后台管理（仅内部使用，懒加载更合适）
const AdminExchangeGuide = lazy(() => import("./pages/AdminExchangeGuide"));
const AdminLogin         = lazy(() => import("./pages/AdminLogin"));

// 模拟交易游戏（体积最大，懒加载收益最高）
const SpotSim    = lazy(() => import("./pages/sim/SpotSim"));
const FuturesSim = lazy(() => import("./pages/sim/FuturesSim"));
const TradFiSim  = lazy(() => import("./pages/sim/TradFiSim"));
const MarginSim  = lazy(() => import("./pages/sim/MarginSim"));
const OptionsSim = lazy(() => import("./pages/sim/OptionsSim"));
const BotSim     = lazy(() => import("./pages/sim/BotSim"));

// 测评与学习路径
const Web3Quiz       = lazy(() => import("./pages/Web3Quiz"));
const LearningPath   = lazy(() => import("./pages/LearningPath"));
const LearningComplete = lazy(() => import("./pages/LearningComplete"));
const Legal          = lazy(() => import("./pages/Legal"));

// ============================================================
// Chunk 加载失败的错误边界（网络问题/部署问题时显示重试按钮）
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
          <div className="text-4xl">⚠️</div>
          <h2 className="text-white text-xl font-semibold">页面加载失败</h2>
          <p className="text-slate-400 text-sm text-center max-w-sm">
            资源加载出错，可能是网络问题或版本更新。请刷新页面重试。
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)" }}
          >
            刷新重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================
// 骨架屏 Fallback：懒加载过渡动画
// ============================================================
function PageSkeleton() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: "#0a192f" }}
    >
      {/* 顶部导航骨架 */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-slate-800/60 backdrop-blur-sm border-b border-slate-700/40 z-50" />
      {/* 内容区骨架 */}
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
// 页面过渡动画包装器
// ============================================================
function PageTransition({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  useLearningPathSync();
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

function Router() {
  return (
    <ChunkErrorBoundary>
    <Suspense fallback={<PageSkeleton />}>
      <PageTransition>
        <Switch>
          {/* ── 首屏同步路由 ── */}
          <Route path="/"       component={Portal} />
          <Route path="/portal" component={Portal} />

          {/* ── 币圈省钱指南板块 ── */}
          <Route path="/crypto-saving" component={Home} />
          <Route path="/contact"       component={Contact} />
          <Route path="/exchanges"     component={Exchanges} />
          <Route path="/beginner"      component={Beginner} />
          <Route path="/crypto-intro"  component={CryptoIntro} />
          <Route path="/crypto-news"   component={CryptoNews} />

          {/* ── Web3 入圈指南板块 ── */}
          <Route path="/web3-guide"                         component={Web3Guide} />
          <Route path="/web3-guide/what-is-web3"            component={WhatIsWeb3} />
          <Route path="/web3-guide/blockchain-basics"       component={BlockchainBasics} />
          <Route path="/web3-guide/wallet-keys"             component={WalletKeys} />
          <Route path="/web3-guide/defi-deep"               component={DefiDeep} />
          <Route path="/web3-guide/exchange-guide"          component={ExchangeGuideDeep} />
          <Route path="/web3-guide/investment-gateway"      component={InvestmentGateway} />
          <Route path="/web3-guide/economic-opportunity"    component={EconomicOpportunity} />

          {/* ── 交易所指南 ── */}
          <Route path="/exchange-guide"              component={ExchangeGuideIndex} />
          <Route path="/exchange-download"           component={ExchangeDownload} />
          <Route path="/exchange-guide/:featureSlug" component={ExchangeFeatureDetail} />

          {/* ── 后台管理 ── */}
          <Route path="/manage-m2u0z0i04"    component={AdminLogin} />
          <Route path="/admin/exchange-guide" component={AdminExchangeGuide} />

          {/* ── 测评与学习路径 ── */}
          <Route path="/web3-quiz"        component={Web3Quiz} />
          <Route path="/learning-path"    component={LearningPath} />
          <Route path="/learning-complete" component={LearningComplete} />
          <Route path="/legal"            component={Legal} />

          {/* ── 模拟交易游戏 ── */}
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
// 全局禁用水平滑动手势（防止浏览器导航切换页面）
// ============================================================
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
            <TooltipProvider>
              <Toaster />
              <Router />
              <MobileFloatNav />
              <DesktopFloatNav />
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
      queries: { staleTime: 1000 * 60 * 5, retry: 1 },
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
