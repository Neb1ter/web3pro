/**
 * Strapi CMS API 客户端
 * 用于从后台获取内容数据
 */

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

export interface StrapiResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface Web3Tutorial {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: 'beginner' | 'intermediate' | 'advanced' | 'defi' | 'nft' | 'trading';
  tags: string;
  read_time: number;
  is_featured: boolean;
  view_count: number;
  cover_image?: {
    url: string;
    alternativeText: string;
  };
  publishedAt: string;
  createdAt: string;
}

export interface ExchangeReview {
  id: number;
  name: string;
  name_en: string;
  rating: number;
  pros: string;
  cons: string;
  description: string;
  rebate_rate: string;
  rebate_link: string;
  official_website: string;
  trading_fee: string;
  is_recommended: boolean;
  sort_order: number;
  logo?: {
    url: string;
    alternativeText: string;
  };
  publishedAt: string;
}

export interface RebateLink {
  id: number;
  exchange_name: string;
  link_type: 'register_rebate' | 'trade_rebate' | 'api_rebate';
  rebate_url: string;
  rebate_percentage: string;
  description: string;
  is_active: boolean;
  expires_at: string | null;
  click_count: number;
  sort_order: number;
  publishedAt: string;
}

/**
 * 获取所有 Web3 教程
 */
export async function getWeb3Tutorials(params?: {
  category?: string;
  featured?: boolean;
  limit?: number;
}): Promise<Web3Tutorial[]> {
  try {
    const query = new URLSearchParams();
    query.set('populate', '*');
    query.set('sort', 'createdAt:desc');

    if (params?.category) {
      query.set('filters[category][$eq]', params.category);
    }
    if (params?.featured) {
      query.set('filters[is_featured][$eq]', 'true');
    }
    if (params?.limit) {
      query.set('pagination[pageSize]', String(params.limit));
    }

    const res = await fetch(`${STRAPI_URL}/api/web3-tutorials?${query}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json: StrapiResponse<Web3Tutorial> = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('[Strapi] getWeb3Tutorials failed, using static data:', err);
    return [];
  }
}

/**
 * 获取单篇 Web3 教程（按 slug）
 */
export async function getWeb3TutorialBySlug(slug: string): Promise<Web3Tutorial | null> {
  try {
    const res = await fetch(
      `${STRAPI_URL}/api/web3-tutorials?filters[slug][$eq]=${slug}&populate=*`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json: StrapiResponse<Web3Tutorial> = await res.json();
    return json.data?.[0] || null;
  } catch (err) {
    console.warn('[Strapi] getWeb3TutorialBySlug failed:', err);
    return null;
  }
}

/**
 * 获取所有交易所评测
 */
export async function getExchangeReviews(params?: {
  recommended?: boolean;
}): Promise<ExchangeReview[]> {
  try {
    const query = new URLSearchParams();
    query.set('populate', '*');
    query.set('sort', 'sort_order:asc');

    if (params?.recommended) {
      query.set('filters[is_recommended][$eq]', 'true');
    }

    const res = await fetch(`${STRAPI_URL}/api/exchange-reviews?${query}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json: StrapiResponse<ExchangeReview> = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('[Strapi] getExchangeReviews failed, using static data:', err);
    return [];
  }
}

/**
 * 获取所有返佣链接
 */
export async function getRebateLinks(params?: {
  active?: boolean;
}): Promise<RebateLink[]> {
  try {
    const query = new URLSearchParams();
    query.set('sort', 'sort_order:asc');

    if (params?.active !== false) {
      query.set('filters[is_active][$eq]', 'true');
    }

    const res = await fetch(`${STRAPI_URL}/api/rebate-links?${query}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json: StrapiResponse<RebateLink> = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('[Strapi] getRebateLinks failed, using static data:', err);
    return [];
  }
}

/**
 * 获取图片完整 URL
 */
export function getStrapiImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${STRAPI_URL}${url}`;
}
