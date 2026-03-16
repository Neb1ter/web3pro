/**
 * cache.ts — 轻量级服务端内存缓存
 *
 * 用于缓存高频但低变化率的数据库查询结果，减少数据库压力，提升 API 响应速度。
 *
 * 使用场景：
 * - exchanges.list（交易所列表，变化极少）
 * - news.list（加密资讯，每小时更新一次）
 * - faq.list（FAQ，极少变化）
 * - exchangeGuide.categories（分类列表，极少变化）
 *
 * ⚠️ 注意：此缓存为进程内内存缓存，PM2 重启后缓存清空。
 * 如需跨进程共享缓存，需引入 Redis（当前规模不必要）。
 *
 * 使用方式：
 * ```ts
 * import { withCache } from './_core/cache';
 * const result = await withCache('exchanges:list', () => db.select()..., 5 * 60 * 1000);
 * ```
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

/**
 * 带缓存的异步函数包装器
 * @param key     缓存键名（建议格式：`模块:操作`，如 `exchanges:list`）
 * @param fetcher 实际数据获取函数（缓存未命中时调用）
 * @param ttlMs   缓存有效期（毫秒），默认 5 分钟
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 5 * 60 * 1000
): Promise<T> {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (entry && Date.now() < entry.expiresAt) {
    return entry.data;
  }
  const data = await fetcher();
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}

/**
 * 主动使指定缓存键失效（用于写操作后清除缓存）
 * @param key 缓存键名，支持前缀通配（如 `exchanges:` 会清除所有以此开头的缓存）
 */
export function invalidateCache(key: string): void {
  if (key.endsWith(':')) {
    // 前缀匹配清除（使用 Array.from 确保 ES5 兼容性）
    Array.from(store.keys()).forEach(k => {
      if (k.startsWith(key)) store.delete(k);
    });
  } else {
    store.delete(key);
  }
}

/** 清除所有缓存（用于测试或紧急刷新） */
export function clearAllCache(): void {
  store.clear();
}
