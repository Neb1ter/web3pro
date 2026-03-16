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
  "/tools": () => import("@/pages/CryptoTools"),
  "/web3-quiz": () => import("@/pages/Web3Quiz"),
};

const preloadedRoutes = new Set<string>();

export function preloadRoute(route: string): void {
  if (preloadedRoutes.has(route)) return;
  const importer = routeImporters[route];
  if (!importer) return;

  preloadedRoutes.add(route);
  void importer().catch(() => {
    preloadedRoutes.delete(route);
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
