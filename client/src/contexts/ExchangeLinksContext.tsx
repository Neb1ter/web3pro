/**
 * ExchangeLinksContext
 *
 * 在应用启动时从数据库加载最新的返佣链接，以 INVITE_CODES 为 fallback。
 * 所有页面通过 useExchangeLinks() 获取链接，后台修改后自动生效。
 */
import { createContext, useContext, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { INVITE_CODES, getFallbackReferralLink, getFallbackInviteCode } from "@shared/exchangeFees";

type ExchangeLinkData = {
  slug: string;
  name: string | null;
  referralLink: string;
  inviteCode: string;
  rebateRate: string;
};

type ExchangeLinksContextValue = {
  /** 获取指定交易所的返佣链接（数据库优先，fallback 到硬编码） */
  getReferralLink: (slug: string) => string;
  /** 获取指定交易所的邀请码（数据库优先，fallback 到硬编码） */
  getInviteCode: (slug: string) => string;
  /** 获取指定交易所的返佣比例（数据库优先，fallback 到硬编码） */
  getRebateRate: (slug: string) => string;
  /** 所有交易所的完整数据（合并数据库与 fallback） */
  allLinks: ExchangeLinkData[];
  /** 是否正在加载 */
  loading: boolean;
};

const ExchangeLinksContext = createContext<ExchangeLinksContextValue | null>(null);

export function ExchangeLinksProvider({ children }: { children: React.ReactNode }) {
  // 从数据库加载，失败时静默降级到 fallback
  const { data: dbLinks, isLoading } = trpc.exchanges.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,   // 5 分钟内不重新请求
    retry: 2,
    // 加载失败时不显示错误，直接使用 fallback
  });

  type DbLink = { slug: string; name?: string | null; referralLink?: string | null; inviteCode?: string | null; rebateRate?: string | null };

  const value = useMemo<ExchangeLinksContextValue>(() => {
    // 将数据库数据转为 slug → data 的 Map，方便 O(1) 查找
    const dbMap = new Map<string, DbLink>();
    (dbLinks ?? []).forEach(link => dbMap.set(link.slug, link as DbLink));

    const getReferralLink = (slug: string): string => {
      const db = dbMap.get(slug);
      if (db?.referralLink) return db.referralLink;
      return getFallbackReferralLink(slug);
    };

    const getInviteCode = (slug: string): string => {
      const db = dbMap.get(slug);
      if (db?.inviteCode) return db.inviteCode;
      return getFallbackInviteCode(slug);
    };

    const getRebateRate = (slug: string): string => {
      const db = dbMap.get(slug);
      if (db?.rebateRate) return db.rebateRate;
      return INVITE_CODES[slug as keyof typeof INVITE_CODES]?.rebateRate ?? "";
    };

    // 合并所有交易所（以 INVITE_CODES 的 slug 列表为基准）
    const allLinks: ExchangeLinkData[] = Object.keys(INVITE_CODES).map(slug => ({
      slug,
      name: dbMap.get(slug)?.name ?? slug,
      referralLink: getReferralLink(slug),
      inviteCode: getInviteCode(slug),
      rebateRate: getRebateRate(slug),
    }));

    return { getReferralLink, getInviteCode, getRebateRate, allLinks, loading: isLoading };
  }, [dbLinks, isLoading]);

  return (
    <ExchangeLinksContext.Provider value={value}>
      {children}
    </ExchangeLinksContext.Provider>
  );
}

/** 获取全局返佣链接数据（数据库优先，自动 fallback） */
export function useExchangeLinks() {
  const ctx = useContext(ExchangeLinksContext);
  if (!ctx) throw new Error("useExchangeLinks must be used within ExchangeLinksProvider");
  return ctx;
}
