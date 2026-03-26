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
import { scheduleIdle } from "@/lib/routePreload";
import { getSeoForPath } from "@/lib/seo";
// Delay loading large floating nav bundles until idle time.
const MobileFloatNav = lazy(() => import("@/components/MobileFloatNav"));
const DesktopFloatNav = lazy(() => import("@/components/DesktopFloatNav"));
import { SchemaManager } from "./components/SchemaManager";
import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";

// ============================================================
// Keep the homepage and NotFound route synchronous for faster first paint.
// ============================================================
import Portal from "./pages/Portal";
import NotFound from "@/pages/NotFound";

// ============================================================
// Lazy-load all non-critical routes.
// ============================================================

// Core site pages
const Home            = lazy(() => import("./pages/Home"));
const Contact         = lazy(() => import("./pages/Contact"));
const Exchanges       = lazy(() => import("./pages/Exchanges"));
const Beginner        = lazy(() => import("./pages/Beginner"));
const CryptoIntro     = lazy(() => import("./pages/CryptoIntro"));
const CryptoNews      = lazy(() => import("./pages/CryptoNews"));
const ArticleDetail   = lazy(() => import("./pages/ArticleDetail"));
const ArticleList     = lazy(() => import("./pages/ArticleList"));
const ExchangeDetail  = lazy(() => import("./pages/ExchangeDetail"));
const ExchangeRegistrationGuide = lazy(() => import("./pages/ExchangeRegistrationGuide"));
const About           = lazy(() => import("./pages/About"));
const Standards       = lazy(() => import("./pages/Standards"));
const UiDemos         = lazy(() => import("./pages/UiDemos"));

// Web3 learning pages
const Web3Guide           = lazy(() => import("./pages/Web3Guide"));
const WhatIsWeb3          = lazy(() => import("./pages/web3/WhatIsWeb3"));
const BlockchainBasics    = lazy(() => import("./pages/web3/BlockchainBasics"));
const WalletKeys          = lazy(() => import("./pages/web3/WalletKeys"));
const DefiDeep            = lazy(() => import("./pages/web3/DefiDeep"));
const ExchangeGuideDeep   = lazy(() => import("./pages/web3/ExchangeGuide"));
const InvestmentGateway   = lazy(() => import("./pages/web3/InvestmentGateway"));
const EconomicOpportunity = lazy(() => import("./pages/web3/EconomicOpportunity"));
const KycFlow             = lazy(() => import("./pages/web3/KycFlow"));

// Exchange guide pages
const ExchangeGuideIndex   = lazy(() => import("./pages/ExchangeGuideIndex"));
const ExchangeDownload     = lazy(() => import("./pages/ExchangeDownload"));
const ExchangeFeatureDetail = lazy(() => import("./pages/ExchangeFeatureDetail"));
const AdminArticleRedirect = lazy(() => import("./pages/admin/AdminArticleRedirect"));

// Admin routes are internal-only and can stay lazy.
const AdminExchangeGuide = lazy(() => import("./pages/AdminExchangeGuide"));
const AdminLogin         = lazy(() => import("./pages/AdminLogin"));

// Simulators are the heaviest routes, so keep them lazy.
const SpotSim    = lazy(() => import("./pages/sim/SpotSim"));
const FuturesSim = lazy(() => import("./pages/sim/FuturesSim"));
const TradFiSim  = lazy(() => import("./pages/sim/TradFiSim"));
const MarginSim  = lazy(() => import("./pages/sim/MarginSim"));
const OptionsSim = lazy(() => import("./pages/sim/OptionsSim"));
const BotSim     = lazy(() => import("./pages/sim/BotSim"));

// Tool collection
const CryptoTools    = lazy(() => import("./pages/CryptoTools"));

// Quiz and learning path pages
const Web3Quiz       = lazy(() => import("./pages/Web3Quiz"));
const LearningPath   = lazy(() => import("./pages/LearningPath"));
const LearningComplete = lazy(() => import("./pages/LearningComplete"));
const Legal          = lazy(() => import("./pages/Legal"));

// ============================================================
// Fallback UI for chunk loading errors such as stale deploys or flaky networks.
// ============================================================
interface ChunkErrorState { hasError: boolean; }
const CHUNK_RECOVERY_KEY = "get8pro:chunk-recovery";

function isChunkLoadFailure(error: unknown) {
  const message =
    error instanceof Error
      ? `${error.name} ${error.message}`
      : typeof error === "string"
        ? error
        : "";

  return /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(
    message,
  );
}

function recoverFromStaleChunk() {
  if (typeof window === "undefined") return false;

  try {
    const marker = `${window.location.pathname}${window.location.search}`;
    const previous = window.sessionStorage.getItem(CHUNK_RECOVERY_KEY);
    if (previous === marker) {
      window.sessionStorage.removeItem(CHUNK_RECOVERY_KEY);
      return false;
    }
    window.sessionStorage.setItem(CHUNK_RECOVERY_KEY, marker);
  } catch {
    return false;
  }

  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set("_reload", Date.now().toString());
  window.location.replace(nextUrl.toString());
  return true;
}

class ChunkErrorBoundary extends Component<{ children: React.ReactNode }, ChunkErrorState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): ChunkErrorState {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    if (isChunkLoadFailure(error) && recoverFromStaleChunk()) {
      return;
    }
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
          <p className="max-w-sm text-center text-sm text-slate-400">
            资源加载出了点问题，可能是网络波动或页面刚更新。请刷新后再试一次。
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
// Generic loading skeleton for lazy routes.
// ============================================================
function PageSkeleton() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: "#0a192f" }}
    >
      {/* top navigation skeleton */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-slate-800/60 backdrop-blur-sm border-b border-slate-700/40 z-50" />
      {/* content skeleton */}
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

function SimulatorLoadingScreen() {
  const [progress, setProgress] = useState(14);

  useEffect(() => {
    const checkpoints = [28, 43, 57, 72, 84, 92];
    let index = 0;
    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (index >= checkpoints.length) {
          window.clearInterval(timer);
          return current;
        }
        const next = checkpoints[index];
        index += 1;
        return current < next ? next : current;
      });
    }, 180);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "linear-gradient(180deg, #07111f 0%, #0a192f 100%)" }}
    >
      <div className="w-full max-w-md rounded-3xl border border-cyan-500/20 bg-slate-950/55 p-7 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/12 text-2xl">
            Game
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">Simulation Loading</p>
            <h2 className="text-xl font-black text-white">Preparing your simulator</h2>
          </div>
        </div>

        <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full transition-[width] duration-300 ease-out"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)",
            }}
          />
        </div>

        <div className="mb-4 flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-400">Loading chart engine, game state, and tutorial assets</span>
          <span className="text-cyan-300">{progress}%</span>
        </div>

        <div className="space-y-2 rounded-2xl border border-white/8 bg-white/4 p-4 text-sm text-slate-300">
          <p>Charts and interaction modules are loading in the background.</p>
          <p>Please keep this page open. We will enter the simulator automatically.</p>
        </div>
      </div>
    </div>
  );
}

function RouteFallback() {
  const [location] = useLocation();

  if (location.startsWith("/sim/")) {
    return <SimulatorLoadingScreen />;
  }

  return <PageSkeleton />;
}

// ============================================================
// Page transition wrapper.
// ============================================================
function PageTransition({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  useLearningPathSync();
  usePageMeta();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<"enter" | "exit">("enter");
  const prevLocation = useRef(location);

  const isExchangeGuideRoute = (path: string) =>
    path === "/exchange-download" ||
    path.startsWith("/exchange-registration/") ||
    path.startsWith("/exchange/");

  useEffect(() => {
    if (location !== prevLocation.current) {
      const transitionDelay =
        isExchangeGuideRoute(location) && isExchangeGuideRoute(prevLocation.current) ? 110 : 280;
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
      }, transitionDelay);
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
// Keep route metadata in stable literals to avoid encoding regressions.
// ============================================================
function usePageMeta() {
  const [location] = useLocation();
  const { language } = useLanguage();
  useEffect(() => {
    const meta = getSeoForPath(location, language);
    const canonicalPath = location === "/portal" ? "/" : location;
    const canonicalUrl = `https://get8.pro${canonicalPath === "/" ? "/" : canonicalPath}`;

    document.title = meta.title;
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";

    const updateMeta = (selector: string, value: string, attr: "content" | "href" = "content") => {
      const element = document.querySelector(selector);
      if (element) {
        element.setAttribute(attr, value);
      }
    };

    updateMeta('meta[name="description"]', meta.description);
    updateMeta('meta[name="keywords"]', meta.keywords);
    updateMeta('meta[property="og:title"]', meta.title);
    updateMeta('meta[property="og:description"]', meta.description);
    updateMeta('meta[property="og:url"]', canonicalUrl);
    updateMeta('meta[name="twitter:title"]', meta.title);
    updateMeta('meta[name="twitter:description"]', meta.description);
    updateMeta('meta[name="twitter:url"]', canonicalUrl);
    updateMeta('link[rel="canonical"]', canonicalUrl, "href");
  }, [language, location]);
}

function LegacyPortalRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/");
  }, [setLocation]);

  return null;
}


function Router() {
  return (
    <ChunkErrorBoundary>
    <Suspense fallback={<RouteFallback />}>
      <PageTransition>
        <Switch>
          {/* synchronous first-paint routes */}
          <Route path="/"       component={Portal} />
          <Route path="/portal" component={LegacyPortalRedirect} />

          {/* core guide routes */}
          <Route path="/crypto-saving" component={Home} />
          <Route path="/contact"       component={Contact} />
          <Route path="/exchanges"     component={Exchanges} />
          <Route path="/beginner"      component={Beginner} />
          <Route path="/crypto-intro"  component={CryptoIntro} />
          <Route path="/crypto-news"   component={CryptoNews} />
          <Route path="/article/:slug"  component={ArticleDetail} />
          <Route path="/articles"         component={ArticleList} />
          {/* exchange detail */}
          <Route path="/exchange/:slug"   component={ExchangeDetail} />
          {/* trust and about pages */}
          <Route path="/about"            component={About} />
          <Route path="/standards"        component={Standards} />
          <Route path="/ui-demos"         component={UiDemos} />

          {/* Web3 learning routes */}
          <Route path="/web3-guide"                         component={Web3Guide} />
          <Route path="/web3-guide/what-is-web3"            component={WhatIsWeb3} />
          <Route path="/web3-guide/blockchain-basics"       component={BlockchainBasics} />
          <Route path="/web3-guide/wallet-keys"             component={WalletKeys} />
          <Route path="/web3-guide/defi-deep"               component={DefiDeep} />
          <Route path="/web3-guide/exchange-guide"          component={ExchangeGuideDeep} />
          <Route path="/web3-guide/investment-gateway"      component={InvestmentGateway} />
          <Route path="/web3-guide/economic-opportunity"    component={EconomicOpportunity} />
          <Route path="/web3-guide/kyc-flow"                component={KycFlow} />

          {/* exchange guide routes */}
          <Route path="/exchange-guide"              component={ExchangeGuideIndex} />
          <Route path="/exchange-download"           component={ExchangeDownload} />
          <Route path="/exchange-registration/:slug" component={ExchangeRegistrationGuide} />
          <Route path="/exchange-guide/:featureSlug" component={ExchangeFeatureDetail} />

          {/* admin routes */}
          <Route path="/manage-m2u0z0i04"    component={AdminLogin} />
          <Route path="/admin/exchange-guide" component={AdminExchangeGuide} />
          <Route path="/admin/article/new" component={AdminArticleRedirect} />

          {/* tool routes */}
          <Route path="/tools" component={CryptoTools} />

          {/* quiz and learning path routes */}
          <Route path="/web3-quiz"        component={Web3Quiz} />
          <Route path="/learning-path"    component={LearningPath} />
          <Route path="/learning-complete" component={LearningComplete} />
          <Route path="/legal"            component={Legal} />

          {/* simulator routes */}
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
// Disable horizontal swipe-back gestures inside simulator pages.
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
  const [showFloatNav, setShowFloatNav] = useState(false);
  const [location] = useLocation();
  const hideFloatNav =
    location.startsWith("/sim/") ||
    location === "/crypto-intro" ||
    location === "/web3-quiz" ||
    location === "/learning-path" ||
    location === "/learning-complete" ||
    location === "/exchange-guide" ||
    location.startsWith("/exchange-guide/") ||
    location.startsWith("/admin/") ||
    location.startsWith("/manage-");

  useEffect(() => {
    return scheduleIdle(() => {
      setShowFloatNav(true);
    }, 1500);
  }, []);

  useEffect(() => {
    const handlePreloadError = (event: Event) => {
      const payload = event as Event & { payload?: unknown };
      if (isChunkLoadFailure(payload.payload) || isChunkLoadFailure((event as CustomEvent).detail)) {
        recoverFromStaleChunk();
      }
    };

    window.addEventListener("vite:preloadError", handlePreloadError as EventListener);
    return () => {
      window.removeEventListener("vite:preloadError", handlePreloadError as EventListener);
    };
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
              {showFloatNav && !hideFloatNav ? (
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
        // Cache low-volatility content for five minutes.
        staleTime: 1000 * 60 * 5,
        // Keep cached data around for thirty minutes when switching routes.
        gcTime: 1000 * 60 * 30,
        // Retry once on failures.
        retry: 1,
        // Avoid refetching just because the tab regains focus.
        refetchOnWindowFocus: false,
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
