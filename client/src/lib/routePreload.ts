const routeImporters: Record<string, () => Promise<unknown>> = {
  "/crypto-saving": () => import("@/pages/Home"),
  "/contact": () => import("@/pages/Contact"),
  "/exchanges": () => import("@/pages/Exchanges"),
  "/beginner": () => import("@/pages/Beginner"),
  "/crypto-intro": () => import("@/pages/CryptoIntro"),
  "/crypto-news": () => import("@/pages/CryptoNews"),
  "/articles": () => import("@/pages/ArticleList"),
  "/about": () => import("@/pages/About"),
  "/web3-guide": () => import("@/pages/Web3Guide"),
  "/exchange-guide": () => import("@/pages/ExchangeGuideIndex"),
  "/exchange-download": () => import("@/pages/ExchangeDownload"),
  "/exchange/:slug": () => import("@/pages/ExchangeDetail"),
  "/exchange-registration/:slug": () => import("@/pages/ExchangeRegistrationGuide"),
  "/tools": () => import("@/pages/CryptoTools"),
  "/web3-quiz": () => import("@/pages/Web3Quiz"),
  "/sim/spot": () => import("@/pages/sim/SpotSim"),
  "/sim/futures": () => import("@/pages/sim/FuturesSim"),
  "/sim/tradfi": () => import("@/pages/sim/TradFiSim"),
  "/sim/margin": () => import("@/pages/sim/MarginSim"),
  "/sim/options": () => import("@/pages/sim/OptionsSim"),
  "/sim/bot": () => import("@/pages/sim/BotSim"),
};

const preloadedRoutes = new Set<string>();

function normalizeRoute(route: string): string {
  if (route.startsWith("/exchange-registration/")) return "/exchange-registration/:slug";
  if (route.startsWith("/exchange/")) return "/exchange/:slug";
  return route;
}

export function preloadRoute(route: string): void {
  const normalizedRoute = normalizeRoute(route);
  if (preloadedRoutes.has(normalizedRoute)) return;
  const importer = routeImporters[normalizedRoute];
  if (!importer) return;

  preloadedRoutes.add(normalizedRoute);
  void importer().catch(() => {
    preloadedRoutes.delete(normalizedRoute);
  });
}

export function preloadRoutes(routes: string[]): void {
  routes.forEach(preloadRoute);
}

export function scheduleIdle(task: () => void, timeout = 1200): () => void {
  type IdleWindow = Window & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  const idleWindow = window as IdleWindow;
  if (idleWindow.requestIdleCallback) {
    const id = idleWindow.requestIdleCallback(() => task(), { timeout });
    return () => idleWindow.cancelIdleCallback?.(id);
  }

  const fallbackId = window.setTimeout(task, 250);
  return () => window.clearTimeout(fallbackId);
}
