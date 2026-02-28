import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { submitContactForm, getContactSubmissions, getExchangeLinks, updateExchangeLink, getFaqs, getCryptoNews, getExchangeFeatureCategories, getExchangeFeatureSupport, getAllExchangeFeatureSupport, getExchangeAllFeatures, createFeatureCategory, updateFeatureCategory, deleteFeatureCategory, upsertFeatureSupport, deleteFeatureSupport, getCryptoTools, getAllCryptoTools, upsertCryptoTool, deleteCryptoTool } from "./db";
import { TRPCError } from "@trpc/server";
import { and, eq, asc } from "drizzle-orm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  contact: router({
    submit: publicProcedure
      .input(z.object({
        // 字段长度限制，防止超大输入体
        platform:        z.string().min(1, "请选择联系平台").max(32),
        accountName:     z.string().min(1, "请填写账号名称").max(64),
        exchangeUid:     z.string().max(64).optional().default(""),
        exchangeUsername:z.string().max(64).optional().default(""),
        message:         z.string().max(500).optional().default(""),
      }))
      .mutation(async ({ input, ctx }) => {
        // 简单内容过滤：去除潜在的 HTML/Script 注入
        const sanitize = (s: string) => s.replace(/<[^>]*>/g, "").trim();
        // 获取用户真实 IP（已配置 trust proxy，可信任 X-Forwarded-For）
        const ipAddress = (ctx.req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
          ?? ctx.req.socket?.remoteAddress
          ?? null;
        await submitContactForm({
          platform:        sanitize(input.platform),
          accountName:     sanitize(input.accountName),
          exchangeUid:     input.exchangeUid     ? sanitize(input.exchangeUid)      : null,
          exchangeUsername:input.exchangeUsername? sanitize(input.exchangeUsername) : null,
          message:         input.message         ? sanitize(input.message)          : null,
          ipAddress,
        });
        return { success: true } as const;
      }),
    /** 管理员查看所有联系表单提交记录 */
    list: protectedProcedure
      .input(z.object({
        limit:  z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: '仅管理员可查看表单记录' });
        return getContactSubmissions(input.limit, input.offset);
      }),
  }),

  exchanges: router({
    list: publicProcedure.query(async () => getExchangeLinks()),
    update: protectedProcedure
      .input(z.object({
        slug: z.string().min(1),
        referralLink: z.string().url("请输入有效的 URL").optional(),
        inviteCode: z.string().optional(),
        rebateRate: z.string().optional(),
        name: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: '仅管理员可修改返佣链接' });
        const { slug, ...data } = input;
        await updateExchangeLink(slug, data);
        return { success: true } as const;
      }),
  }),

  /** FAQ (新手问答) — supports optional search query */
  faq: router({
    list: publicProcedure
      .input(z.object({ search: z.string().max(100).optional() }))
      .query(async ({ input }) => getFaqs(input.search)),
  }),

  /** Exchange Feature Guide — 交易所扫盲指南 */
  exchangeGuide: router({
    categories: publicProcedure.query(async () => getExchangeFeatureCategories()),
    featureSupport: publicProcedure
      .input(z.object({ featureSlug: z.string().min(1) }))
      .query(async ({ input }) => getExchangeFeatureSupport(input.featureSlug)),
    allFeatureSupport: publicProcedure
      .query(async () => getAllExchangeFeatureSupport()),
    exchangeFeatures: publicProcedure
      .input(z.object({ exchangeSlug: z.string().min(1) }))
      .query(async ({ input }) => getExchangeAllFeatures(input.exchangeSlug)),
  }),

  /** Admin: Exchange Guide CRUD (admin only) */
  adminExchangeGuide: router({
    // --- Feature Categories CRUD ---
    createCategory: protectedProcedure
      .input(z.object({
        slug: z.string().min(1).max(32),
        nameZh: z.string().min(1).max(64),
        nameEn: z.string().min(1).max(64),
        icon: z.string().min(1).max(8),
        descZh: z.string().min(1),
        descEn: z.string().min(1),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
        sortOrder: z.number().int().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: '仅管理员可操作' });
        await createFeatureCategory(input);
        return { success: true } as const;
      }),
    updateCategory: protectedProcedure
      .input(z.object({
        slug: z.string().min(1),
        nameZh: z.string().min(1).max(64).optional(),
        nameEn: z.string().min(1).max(64).optional(),
        icon: z.string().min(1).max(8).optional(),
        descZh: z.string().min(1).optional(),
        descEn: z.string().min(1).optional(),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        sortOrder: z.number().int().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: '仅管理员可操作' });
        const { slug, ...data } = input;
        await updateFeatureCategory(slug, data);
        return { success: true } as const;
      }),
    deleteCategory: protectedProcedure
      .input(z.object({ slug: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: '仅管理员可操作' });
        await deleteFeatureCategory(input.slug);
        return { success: true } as const;
      }),
    // --- Feature Support CRUD ---
    upsertSupport: protectedProcedure
      .input(z.object({
        exchangeSlug: z.string().min(1).max(32),
        featureSlug: z.string().min(1).max(32),
        supported: z.number().int().min(0).max(1).default(1),
        levelZh: z.string().min(1).max(32),
        levelEn: z.string().min(1).max(64),
        detailZh: z.string().min(1),
        detailEn: z.string().min(1),
        maxLeverage: z.string().max(16).optional(),
        feeInfo: z.string().max(256).optional(),
        highlight: z.number().int().min(0).max(1).default(0),
        kycLevel: z.enum(['none', 'basic', 'standard', 'full']).optional(),
        supportedRegions: z.string().max(256).optional(),
        feeLevel: z.string().max(8).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: '仅管理员可操作' });
        await upsertFeatureSupport(input);
        return { success: true } as const;
      }),
    deleteSupport: protectedProcedure
      .input(z.object({
        exchangeSlug: z.string().min(1),
        featureSlug: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: '仅管理员可操作' });
        await deleteFeatureSupport(input.exchangeSlug, input.featureSlug);
        return { success: true } as const;
      }),
    // --- Read all support for admin view ---
    allSupport: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: '仅管理员可操作' });
      const { getDb } = await import('./db');
      const { exchangeFeatureSupport: efs } = await import('../drizzle/schema');
      const db = await getDb();
      if (!db) return [];
      return db.select().from(efs).orderBy(efs.featureSlug, efs.exchangeSlug);
    }),
  }),

  /** Crypto news timeline */
  news: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).optional().default(20) }))
      .query(async ({ input }) => getCryptoNews(input.limit)),
  }),

  /**
   * Simulated trading history — protected, tied to authenticated user.
   * Rate-limited by userId to prevent abuse.
   */
  sim: router({
    /** Save a closed position to history */
    saveHistory: protectedProcedure
      .input(z.object({
        simType: z.enum(["spot", "futures", "margin"]),
        symbol: z.string().max(16),
        direction: z.enum(["long", "short", "buy", "sell"]),
        entryPrice: z.string().max(32),
        exitPrice: z.string().max(32),
        size: z.string().max(32),
        leverage: z.number().int().min(1).max(500).default(1),
        pnl: z.string().max(32),
        pnlPct: z.string().max(16),
        closeReason: z.string().max(32).default("manual"),
        marginMode: z.string().max(16).optional(),
        openedAt: z.number(), // Unix ms timestamp
      }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import('./db');
        const { simTradeHistory } = await import('../drizzle/schema');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
        // 防止单用户大量写入：每类型最多保留 200 条记录
        const existing = await db.select({ id: simTradeHistory.id })
          .from(simTradeHistory)
          .where(and(
            eq(simTradeHistory.userId, ctx.user.id),
            eq(simTradeHistory.simType, input.simType)
          ))
          .orderBy(asc(simTradeHistory.closedAt))
          .limit(1000);
        if (existing.length >= 200) {
          // 删除最早的记录，保持在 200 条以内
          const toDelete = existing.slice(0, existing.length - 199);
          for (const rec of toDelete) {
            await db.delete(simTradeHistory).where(eq(simTradeHistory.id, rec.id));
          }
        }
        await db.insert(simTradeHistory).values({
          userId: ctx.user.id,
          simType: input.simType,
          symbol: input.symbol,
          direction: input.direction,
          entryPrice: input.entryPrice,
          exitPrice: input.exitPrice,
          size: input.size,
          leverage: input.leverage,
          pnl: input.pnl,
          pnlPct: input.pnlPct,
          closeReason: input.closeReason,
          marginMode: input.marginMode ?? null,
          openedAt: new Date(input.openedAt),
          closedAt: new Date(),
        });
        return { success: true } as const;
      }),

    /** Get trade history for a specific sim type */
    getHistory: protectedProcedure
      .input(z.object({
        simType: z.enum(["spot", "futures", "margin"]),
        limit: z.number().int().min(1).max(100).default(50),
      }))
      .query(async ({ ctx, input }) => {
        const { getDb } = await import('./db');
        const { simTradeHistory } = await import('../drizzle/schema');
        const { and, eq, desc } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) return [];
        return db.select().from(simTradeHistory)
          .where(and(
            eq(simTradeHistory.userId, ctx.user.id),
            eq(simTradeHistory.simType, input.simType)
          ))
          .orderBy(desc(simTradeHistory.closedAt))
          .limit(input.limit);
      }),

    /** Reset all sim data for the authenticated user (requires explicit confirmation) */
    resetAll: protectedProcedure
      .input(z.object({
        confirm: z.literal(true),
      }))
      .mutation(async ({ ctx }) => {
        const { getDb } = await import('./db');
        const { simTradeHistory } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
        await db.delete(simTradeHistory).where(eq(simTradeHistory.userId, ctx.user.id));
        return { success: true, message: '所有模拟交易记录已重置' } as const;
      }),
  }),

  tools: router({
    /** Public: get all active tools */
    list: publicProcedure.query(async () => {
      return getCryptoTools(true);
    }),
    /** Admin: get all tools including inactive */
    listAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      return getAllCryptoTools();
    }),
    /** Admin: upsert a tool */
    upsert: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        name: z.string().min(1).max(64),
        nameEn: z.string().min(1).max(64),
        description: z.string().min(1),
        descriptionEn: z.string().min(1),
        category: z.string().max(32).default('general'),
        source: z.string().min(1).max(128),
        url: z.string().url().max(512),
        icon: z.string().max(8).default('🔧'),
        tags: z.string().max(256).optional(),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
        sortOrder: z.number().int().default(0),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        await upsertCryptoTool(input);
        return { success: true };
      }),
    /** Admin: delete a tool */
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        await deleteCryptoTool(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
