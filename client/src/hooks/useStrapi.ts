/**
 * Strapi 数据获取 Hooks
 * 提供带缓存、加载状态和错误处理的数据获取能力
 */

import { useState, useEffect } from 'react';
import {
  getWeb3Tutorials,
  getExchangeReviews,
  getRebateLinks,
  type Web3Tutorial,
  type ExchangeReview,
  type RebateLink,
} from '../lib/strapi';

interface UseDataState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

/**
 * 获取 Web3 教程列表
 */
export function useWeb3Tutorials(params?: {
  category?: string;
  featured?: boolean;
  limit?: number;
}) {
  const [state, setState] = useState<UseDataState<Web3Tutorial>>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, loading: true, error: null }));

    getWeb3Tutorials(params)
      .then(data => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch(err => {
        if (!cancelled) setState({ data: [], loading: false, error: err.message });
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.category, params?.featured, params?.limit]);

  return state;
}

/**
 * 获取交易所评测列表
 */
export function useExchangeReviews(params?: { recommended?: boolean }) {
  const [state, setState] = useState<UseDataState<ExchangeReview>>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, loading: true, error: null }));

    getExchangeReviews(params)
      .then(data => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch(err => {
        if (!cancelled) setState({ data: [], loading: false, error: err.message });
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.recommended]);

  return state;
}

/**
 * 获取返佣链接列表
 */
export function useRebateLinks(params?: { active?: boolean }) {
  const [state, setState] = useState<UseDataState<RebateLink>>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, loading: true, error: null }));

    getRebateLinks(params)
      .then(data => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch(err => {
        if (!cancelled) setState({ data: [], loading: false, error: err.message });
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.active]);

  return state;
}
