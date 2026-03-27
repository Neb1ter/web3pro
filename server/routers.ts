import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { submitContactForm, getContactSubmissions, getExchangeLinks, updateExchangeLink, getFaqs, getCryptoNews, getExchangeFeatureCategories, getExchangeFeatureSupport, getAllExchangeFeatureSupport, getExchangeAllFeatures, createFeatureCategory, updateFeatureCategory, deleteFeatureCategory, upsertFeatureSupport, deleteFeatureSupport, getCryptoTools, getAllCryptoTools, upsertCryptoTool, deleteCryptoTool, getSystemSetting, setSystemSetting, getAllSystemSettings } from "./db";
import { TRPCError } from "@trpc/server";
import { and, eq, asc } from "drizzle-orm";
import { withCache, invalidateCache } from "./_core/cache";
import { storagePut } from "./storage";
import fs from "fs/promises";
import path from "path";

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
    // 缓存 10 分钟，交易所链接极少变化
    list: publicProcedure.query(async () =>
      withCache('exchanges:list', () => getExchangeLinks(), 10 * 60 * 1000)
    ),
    update: protectedProcedure
      .input(z.object({
        slug: z.string().min(1),
        referralLink: z.string().url("请输入有效的 URL").optional(),
        inviteCode: z.string().optional(),
        rebateRate: z.string().optional(),
        name: z.string().optional(),
        guideStep1ImageUrl: z.string().url().optional().or(z.literal("")),
        guideStep2ImageUrl: z.string().url().optional().or(z.literal("")),
        guideStep3ImageUrl: z.string().url().optional().or(z.literal("")),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: '仅管理员可修改返佣链接' });
        const { slug, ...data } = input;
        const normalized = Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, value === "" ? null : value])
        );
        await updateExchangeLink(slug, normalized);
        invalidateCache("exchanges:list");
        // 写操作后清除缓存，确保下次请求获取最新数据
        invalidateCache('exchanges:list');
        return { success: true } as const;
      }),
    uploadGuideImage: protectedProcedure
      .input(z.object({
        slug: z.enum(["gate", "okx", "binance", "bybit", "bitget"]),
        step: z.union([z.literal(1), z.literal(2), z.literal(3)]),
        dataUrl: z.string().min(1),
        fileName: z.string().min(1).max(128),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can upload guide images" });
        }

        const match = input.dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (!match) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid image payload" });
        }

        const [, mimeType, base64] = match;
        const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "png";
        const safeFileName = input.fileName
          .replace(/\.[^.]+$/, "")
          .replace(/[^a-zA-Z0-9._-]/g, "-")
          .toLowerCase();
        const uploadName = `step-${input.step}-${Date.now()}-${safeFileName || "guide"}.${ext}`;
        const key = `exchange-guides/${input.slug}/${uploadName}`;
        const buffer = Buffer.from(base64, "base64");
        let url = "";

        try {
          const uploaded = await storagePut(key, buffer, mimeType);
          url = uploaded.url;
        } catch (storageError) {
          // Fallback: write to local /uploads when storage proxy is unavailable.
          try {
            const uploadDir = path.resolve(process.cwd(), "uploads", "exchange-guides", input.slug);
            await fs.mkdir(uploadDir, { recursive: true });
            const filePath = path.join(uploadDir, uploadName);
            await fs.writeFile(filePath, buffer);
            url = `/uploads/exchange-guides/${input.slug}/${uploadName}`;
          } catch (diskError) {
            const storageReason = storageError instanceof Error ? storageError.message : String(storageError);
            const diskReason = diskError instanceof Error ? diskError.message : String(diskError);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Image upload failed. storage=${storageReason}; local=${diskReason}`,
            });
          }
        }

        const fieldMap = {
          1: "guideStep1ImageUrl",
          2: "guideStep2ImageUrl",
          3: "guideStep3ImageUrl",
        } as const;

        await updateExchangeLink(input.slug, { [fieldMap[input.step]]: url });
        invalidateCache("exchanges:list");
        return { success: true, url } as const;
      }),
  }),

  /** FAQ (新手问答) — supports optional search query */
  faq: router({
    list: publicProcedure
      .input(z.object({ search: z.string().max(100).optional() }))
      // 无搜索词时缓存 15 分钟，有搜索词时不缓存
      .query(async ({ input }) => {
        if (input.search) return getFaqs(input.search);
        return withCache('faq:list', () => getFaqs(undefined), 15 * 60 * 1000);
      }),
  }),

  /** Exchange Feature Guide — 交易所扫盲指南 */
  exchangeGuide: router({
    // 分类列表极少变化，缓存 30 分钟
    categories: publicProcedure.query(async () =>
      withCache('exchangeGuide:categories', () => getExchangeFeatureCategories(), 30 * 60 * 1000)
    ),
    // 各功能支持情况，缓存 10 分钟
    featureSupport: publicProcedure
      .input(z.object({ featureSlug: z.string().min(1) }))
      .query(async ({ input }) =>
        withCache(`exchangeGuide:feature:${input.featureSlug}`, () => getExchangeFeatureSupport(input.featureSlug), 10 * 60 * 1000)
      ),
    // 全量功能支持数据，缓存 10 分钟
    allFeatureSupport: publicProcedure
      .query(async () =>
        withCache('exchangeGuide:allFeatureSupport', () => getAllExchangeFeatureSupport(), 10 * 60 * 1000)
      ),
    // 单交易所所有功能，缓存 10 分钟
    exchangeFeatures: publicProcedure
      .input(z.object({ exchangeSlug: z.string().min(1) }))
      .query(async ({ input }) =>
        withCache(`exchangeGuide:exchange:${input.exchangeSlug}`, () => getExchangeAllFeatures(input.exchangeSlug), 10 * 60 * 1000)
      ),
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
      .input(z.object({ limit: z.number().min(1).max(100).optional().default(20) }))
      // 新闻缓存 1 分钟，避免前台长期显示旧快讯
      .query(async ({ input }) =>
        withCache(`news:list:${input.limit}`, () => getCryptoNews(input.limit), 60 * 1000)
      ),
    /** Admin: list all news (including inactive) */
    listAll: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(200).default(100), offset: z.number().min(0).default(0) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const { getDb } = await import('./db');
        const { cryptoNews } = await import('../drizzle/schema');
        const { desc } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) return [];
        return db.select().from(cryptoNews).orderBy(desc(cryptoNews.publishedAt)).limit(input.limit).offset(input.offset);
      }),
    /** Admin: create a news item */
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(200),
        summary: z.string().max(500).optional(),
        source: z.string().max(64).default('律动BlockBeats'),
        url: z.string().url().max(512).optional(),
        category: z.enum(['market','policy','exchange','defi','nft','other']).default('market'),
        isPinned: z.boolean().default(false),
        isActive: z.boolean().default(true),
        publishedAt: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const { getDb } = await import('./db');
        const { cryptoNews } = await import('../drizzle/schema');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        await db.insert(cryptoNews).values({
          title: input.title,
          summary: input.summary ?? null,
          source: input.source,
          url: input.url ?? null,
          category: input.category,
          isPinned: input.isPinned,
          isActive: input.isActive,
          publishedAt: input.publishedAt ? new Date(input.publishedAt) : new Date(),
        });
        invalidateCache('news:list:');
        return { success: true };
      }),
    /** Admin: publish a news item to platforms */
    publish: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        platforms: z.array(z.string()).min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const { getDb } = await import('./db');
        const { cryptoNews } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const { publishContent } = await import('./_core/publish');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const [news] = await db.select().from(cryptoNews).where(eq(cryptoNews.id, input.id)).limit(1);
        if (!news) throw new TRPCError({ code: 'NOT_FOUND' });
        const results = await publishContent(
          {
            type: 'news',
            id: news.id,
            title: news.title,
            url: news.url,
            source: news.source,
          },
          input.platforms
        );
        return { success: true, results };
      }),
    /** Admin: build media draft packages for a news item */
    buildDraftPackages: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const { getDb } = await import('./db');
        const { cryptoNews } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const { buildNewsDraftPackages } = await import('./_core/mediaAutomation');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const [news] = await db.select().from(cryptoNews).where(eq(cryptoNews.id, input.id)).limit(1);
        if (!news) throw new TRPCError({ code: 'NOT_FOUND' });
        return { success: true, drafts: buildNewsDraftPackages(news) };
      }),
    /** Admin: update a news item */
    update: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        title: z.string().min(1).max(200).optional(),
        summary: z.string().max(500).optional(),
        source: z.string().max(64).optional(),
        url: z.string().url().max(512).optional().or(z.literal('')),
        category: z.enum(['market','policy','exchange','defi','nft','other']).optional(),
        isPinned: z.boolean().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const { getDb } = await import('./db');
        const { cryptoNews } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { id, ...data } = input;
        await db.update(cryptoNews).set(data).where(eq(cryptoNews.id, id));
        invalidateCache('news:list:');
        return { success: true };
      }),
    /** Admin: delete a news item */
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const { getDb } = await import('./db');
        const { cryptoNews } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        await db.delete(cryptoNews).where(eq(cryptoNews.id, input.id));
        invalidateCache('news:list:');
        return { success: true };
      }),
    /** Admin: retranslate existing English news to Chinese */
    retranslate: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const { retranslateEnglishNews } = await import('./_core/rss');
        const updated = await retranslateEnglishNews();
        return { success: true, updated };
      }),
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
        needVpn: z.boolean().default(true),
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
  /** Articles — public listing + admin CRUD + AI generation + sensitive word check */
  articles: router({
    /** Public: list published articles */
    list: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(50).default(12),
        offset: z.number().min(0).default(0),
        category: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const { getPublishedArticles } = await import('./_core/articles');
        return getPublishedArticles(input);
      }),
    /** Public: get single article by slug */
    bySlug: publicProcedure
      .input(z.object({ slug: z.string().min(1) }))
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const { articles } = await import('../drizzle/schema');
        const { and, eq } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) return null;
        const [article] = await db.select().from(articles)
          .where(and(eq(articles.slug, input.slug), eq(articles.isActive, true)))
          .limit(1);
        if (!article) return null;
        const { incrementArticleView } = await import('./_core/articles');
        incrementArticleView(article.id).catch(() => {});
        return article;
      }),
    /** Admin: list all articles */
    listAll: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        status: z.string().optional(),
        category: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const { getDb } = await import('./db');
        const { articles } = await import('../drizzle/schema');
        const { desc, eq, and } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) return [];
        const conditions: ReturnType<typeof eq>[] = [];
        if (input.status) conditions.push(eq(articles.status, input.status as 'draft'));
        if (input.category) conditions.push(eq(articles.category, input.category));
        return db.select().from(articles)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(articles.updatedAt))
          .limit(input.limit).offset(input.offset);
      }),
    /** Admin: create article */
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(256),
        slug: z.string().max(256).optional(),
        content: z.string().min(1),
        excerpt: z.string().max(500).optional(),
        coverImage: z.string().max(512).optional(),
        category: z.enum(['analysis','tutorial','news_decode','project','promo','report']).default('analysis'),
        tags: z.string().max(512).optional(),
        author: z.string().max(64).default('Get8Pro编辑部'),
        status: z.enum(['draft','pending_review','approved','published','rejected']).default('draft'),
        perspective: z.string().max(32).optional(),
        targetAudience: z.string().max(32).optional(),
        contentStyle: z.string().max(32).optional(),
        metaTitle: z.string().max(256).optional(),
        metaDescription: z.string().max(512).optional(),
        metaKeywords: z.string().max(512).optional(),
        isPinned: z.boolean().default(false),
        scheduledAt: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const { getDb } = await import('./db');
        const { articles } = await import('../drizzle/schema');
        const { generateSlug } = await import('./_core/articles');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const slug = input.slug || generateSlug(input.title);
        const publishedAt = input.status === 'published' ? new Date() : null;
        await db.insert(articles).values({
          ...input,
          slug,
          publishedAt,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        });
        return { success: true, slug };
      }),
    /** Admin: update article */
    update: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        title: z.string().max(256).optional(),
        content: z.string().optional(),
        excerpt: z.string().max(500).optional().nullable(),
        coverImage: z.string().max(512).optional().nullable(),
        category: z.string().max(32).optional(),
        tags: z.string().max(512).optional().nullable(),
        author: z.string().max(64).optional(),
        status: z.enum(['draft','pending_review','approved','published','rejected']).optional(),
        perspective: z.string().max(32).optional(),
        targetAudience: z.string().max(32).optional(),
        contentStyle: z.string().max(32).optional(),
        sensitiveStatus: z.string().max(32).optional(),
        sensitiveWords: z.string().optional().nullable(),
        reviewNotes: z.string().optional().nullable(),
        metaTitle: z.string().max(256).optional().nullable(),
        metaDescription: z.string().max(512).optional().nullable(),
        metaKeywords: z.string().max(512).optional().nullable(),
        isPinned: z.boolean().optional(),
        isActive: z.boolean().optional(),
        scheduledAt: z.string().optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const { getDb } = await import('./db');
        const { articles } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { id, ...data } = input;
        const updateData: Record<string, unknown> = { ...data };
        if (data.status === 'published' && !updateData.publishedAt) updateData.publishedAt = new Date();
        if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);
        await db.update(articles).set(updateData).where(eq(articles.id, id));
        return { success: true };
      }),
    /** Admin: delete article */
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const { getDb } = await import('./db');
        const { articles } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        await db.delete(articles).where(eq(articles.id, input.id));
        return { success: true };
      }),
    /** Admin: AI generate article */
    aiGenerate: protectedProcedure
      .input(z.object({
        topic: z.string().min(1).max(200),
        category: z.string().max(32).default('analysis'),
        perspective: z.enum(['neutral','bullish','bearish','educational']).default('neutral'),
        targetAudience: z.enum(['beginner','intermediate','professional','institutional']).default('beginner'),
        contentStyle: z.enum(['formal','casual','marketing']).default('formal'),
        keywords: z.array(z.string()).optional(),
        wordCount: z.number().min(300).max(3000).default(800),
        relatedNewsTitle: z.string().optional(),
        autoSave: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const { generateArticleWithAI, checkSensitiveWords, generateSlug } = await import('./_core/articles');
        const generated = await generateArticleWithAI(input);
        const fullText = `${generated.title} ${generated.content}`;
        const sensitiveResult = await checkSensitiveWords(fullText);
        if (input.autoSave) {
          const { getDb } = await import('./db');
          const { articles } = await import('../drizzle/schema');
          const db = await getDb();
          if (db) {
            const slug = generateSlug(generated.title);
            await db.insert(articles).values({
              title: generated.title,
              slug,
              content: generated.content,
              excerpt: generated.excerpt || null,
              category: input.category,
              tags: generated.tags || null,
              author: 'Get8Pro AI',
              status: sensitiveResult.isClean ? 'pending_review' : 'draft',
              perspective: input.perspective,
              targetAudience: input.targetAudience,
              contentStyle: input.contentStyle,
              isAiGenerated: true,
              aiPrompt: input.topic,
              sensitiveStatus: sensitiveResult.isClean ? 'clean' : 'flagged',
              sensitiveWords: JSON.stringify(sensitiveResult.flaggedWords),
              metaTitle: generated.metaTitle || null,
              metaDescription: generated.metaDescription || null,
              metaKeywords: generated.metaKeywords || null,
            });
            return { success: true, generated, sensitiveResult, saved: true, slug };
          }
        }
        return { success: true, generated, sensitiveResult, saved: false };
      }),
    /** Admin: check sensitive words */
    checkSensitive: protectedProcedure
      .input(z.object({
        content: z.string().min(1),
        platforms: z.array(z.string()).default(['all']),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const { checkSensitiveWords } = await import('./_core/articles');
        return checkSensitiveWords(input.content, input.platforms);
      }),
    /** Admin: AI rewrite for compliance */
    rewriteCompliance: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const { getDb } = await import('./db');
        const { articles } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const { checkSensitiveWords, rewriteForCompliance } = await import('./_core/articles');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const [article] = await db.select().from(articles).where(eq(articles.id, input.id)).limit(1);
        if (!article) throw new TRPCError({ code: 'NOT_FOUND' });
        const rewritten = await rewriteForCompliance(article.content, JSON.parse(article.sensitiveWords || '[]'));
        const newResult = await checkSensitiveWords(rewritten);
        await db.update(articles).set({
          content: rewritten,
          sensitiveStatus: newResult.isClean ? 'clean' : 'flagged',
          sensitiveWords: JSON.stringify(newResult.flaggedWords),
        }).where(eq(articles.id, input.id));
        return { success: true, isClean: newResult.isClean, flaggedCount: newResult.flaggedWords.length };
      }),
    /** Admin: publish article to platforms */
    publish: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        platforms: z.array(z.string()).min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const { getDb } = await import('./db');
        const { articles } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const { publishContent } = await import('./_core/publish');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const [article] = await db.select().from(articles).where(eq(articles.id, input.id)).limit(1);
        if (!article) throw new TRPCError({ code: 'NOT_FOUND' });
        const articleUrl = `https://get8.pro/article/${article.slug}`;
        const results = await publishContent(
          { type: 'article', id: article.id, title: article.title, excerpt: article.excerpt, url: articleUrl },
          input.platforms
        );
        return { success: true, results };
      }),
    /** Admin: build media draft packages for an article */
    buildDraftPackages: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const { getDb } = await import('./db');
        const { articles } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const { buildArticleDraftPackages } = await import('./_core/mediaAutomation');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const [article] = await db.select().from(articles).where(eq(articles.id, input.id)).limit(1);
        if (!article) throw new TRPCError({ code: 'NOT_FOUND' });
        return { success: true, drafts: buildArticleDraftPackages(article) };
      }),
    /** Admin: Qwen AI content moderation */
    qwenModerate: protectedProcedure
      .input(z.object({
        id: z.number().int().optional(),
        title: z.string().optional(),
        content: z.string().optional(),
        platforms: z.array(z.string()).default(['wechat','weibo','douyin','telegram']),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const { moderateWithQwen } = await import('./_core/articles');
        let title = input.title || '';
        let content = input.content || '';
        if (input.id) {
          const { getDb } = await import('./db');
          const { articles } = await import('../drizzle/schema');
          const { eq } = await import('drizzle-orm');
          const db = await getDb();
          if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
          const [article] = await db.select().from(articles).where(eq(articles.id, input.id)).limit(1);
          if (!article) throw new TRPCError({ code: 'NOT_FOUND' });
          title = article.title;
          content = article.content;
          const result = await moderateWithQwen(title, content, input.platforms);
          await db.update(articles).set({
            sensitiveStatus: result.passed ? 'clean' : 'flagged',
            sensitiveWords: JSON.stringify(result.issues || []),
            status: result.passed ? 'pending_review' : 'draft',
          }).where(eq(articles.id, input.id));
          return { success: true, result };
        }
        const result = await moderateWithQwen(title, content, input.platforms);
        return { success: true, result };
      }),
  }),

  /** Sensitive words management */
  sensitiveWords: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      const { getDb } = await import('./db');
      const { sensitiveWords } = await import('../drizzle/schema');
      const { asc } = await import('drizzle-orm');
      const db = await getDb();
      if (!db) return [];
      return db.select().from(sensitiveWords).orderBy(asc(sensitiveWords.category), asc(sensitiveWords.word));
    }),
    add: protectedProcedure
      .input(z.object({
        word: z.string().min(1).max(128),
        platforms: z.string().default('all'),
        severity: z.enum(['block','warn','replace']).default('warn'),
        replacement: z.string().max(128).optional(),
        category: z.string().max(32).default('custom'),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const { getDb } = await import('./db');
        const { sensitiveWords } = await import('../drizzle/schema');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        await db.insert(sensitiveWords).values(input);
        return { success: true };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        word: z.string().max(128).optional(),
        platforms: z.string().optional(),
        severity: z.enum(['block','warn','replace']).optional(),
        replacement: z.string().max(128).optional().nullable(),
        category: z.string().max(32).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const { getDb } = await import('./db');
        const { sensitiveWords } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { id, ...data } = input;
        await db.update(sensitiveWords).set(data).where(eq(sensitiveWords.id, id));
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const { getDb } = await import('./db');
        const { sensitiveWords } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        await db.delete(sensitiveWords).where(eq(sensitiveWords.id, input.id));
        return { success: true };
      }),
  }),

  /** Sensitive word library auto-update */
  wordUpdate: router({
    /** List all update logs */
    logs: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      const { getDb } = await import('./db');
      const { sensitiveWordUpdateLogs } = await import('../drizzle/schema');
      const { desc } = await import('drizzle-orm');
      const db = await getDb();
      if (!db) return [];
      return db.select().from(sensitiveWordUpdateLogs)
        .orderBy(desc(sensitiveWordUpdateLogs.createdAt))
        .limit(100);
    }),
    /** Get all registered word sources */
    sources: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      const { getWordSources } = await import('./_core/sensitiveWordUpdater');
      return getWordSources();
    }),
    /** Manually trigger update for all or specific sources */
    run: protectedProcedure
      .input(z.object({
        sourceIds: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const { runWordUpdate } = await import('./_core/sensitiveWordUpdater');
        const result = await runWordUpdate(true, input.sourceIds);
        return result;
      }),
  }),

  /** Media platforms management */
  platforms: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      const { getDb } = await import('./db');
      const { mediaPlatforms } = await import('../drizzle/schema');
      const db = await getDb();
      if (!db) return [];
      return db.select().from(mediaPlatforms);
    }),
    capabilities: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      const { listPlatformCapabilities } = await import('./_core/mediaAutomation');
      return listPlatformCapabilities();
    }),
    update: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        isEnabled: z.boolean().optional(),
        apiKey: z.string().optional().nullable(),
        apiSecret: z.string().optional().nullable(),
        channelId: z.string().max(256).optional().nullable(),
        extraConfig: z.string().optional().nullable(),
        autoPublish: z.boolean().optional(),
        autoPublishNews: z.boolean().optional(),
        sensitiveStandard: z.string().max(32).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const { getDb } = await import('./db');
        const { mediaPlatforms } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { id, ...data } = input;
        await db.update(mediaPlatforms).set(data).where(eq(mediaPlatforms.id, id));
        return { success: true };
      }),
    test: protectedProcedure
      .input(z.object({ platform: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const { getDb } = await import('./db');
        const { mediaPlatforms } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const { ENV } = await import('./_core/env');
        const { getPlatformCapability } = await import('./_core/mediaAutomation');
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const [config] = await db.select().from(mediaPlatforms).where(eq(mediaPlatforms.platform, input.platform)).limit(1);
        if (!config) throw new TRPCError({ code: 'NOT_FOUND', message: '平台配置不存在' });
        const capability = getPlatformCapability(input.platform);
        if (capability.deliveryMode !== 'direct') {
          return {
            success: true,
            message: capability.deliveryMode === 'assisted'
              ? `${config.name} 当前走半自动工作流，请生成外发草稿后手动发布。`
              : `${config.name} 目前仍是规划位，暂不支持连接测试。`,
          };
        }
        if (input.platform === 'telegram') {
          const token = config.apiKey || ENV.telegramBotToken;
          const channelId = config.channelId || ENV.telegramChannelId;
          if (!token || !channelId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Token 或 Channel ID 未配置' });
          const res = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${channelId}`);
          const data = await res.json() as { ok: boolean; description?: string; result?: { title?: string } };
          if (!data.ok) throw new TRPCError({ code: 'BAD_REQUEST', message: `Telegram 连接失败: ${data.description}` });
          return { success: true, message: `Telegram 连接成功，频道: ${data.result?.title || channelId}` };
        }
        if (input.platform === 'notion') {
          if (!config.apiKey || !config.channelId) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Notion Token 或 Database ID 未配置' });
          }
          const res = await fetch(`https://api.notion.com/v1/databases/${config.channelId}`, {
            headers: {
              Authorization: `Bearer ${config.apiKey}`,
              'Notion-Version': '2022-06-28',
            },
          });
          if (!res.ok) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: `Notion 连接失败: ${res.status} ${res.statusText}` });
          }
          return { success: true, message: 'Notion 数据库连接成功。' };
        }
        return { success: true, message: `${config.name} 已支持直连发布，当前暂不提供无消息测试。` };
      }),
  }),

  /** Publish logs */
  publishLogs: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        platform: z.string().optional(),
        status: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const { getDb } = await import('./db');
        const { publishLogs } = await import('../drizzle/schema');
        const { desc, eq, and } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) return [];
        const conditions: ReturnType<typeof eq>[] = [];
        if (input.platform) conditions.push(eq(publishLogs.platform, input.platform));
        if (input.status) conditions.push(eq(publishLogs.status, input.status as 'pending'));
        return db.select().from(publishLogs)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(publishLogs.createdAt))
          .limit(input.limit).offset(input.offset);
      }),
  }),

  settings: router({
    /** Admin: get all system settings */
    getAll: protectedProcedure.query(async () => {
      return getAllSystemSettings();
    }),
    /** Admin: get a single setting by key */
    get: protectedProcedure
      .input(z.object({ key: z.string().min(1).max(64) }))
      .query(async ({ input }: { input: { key: string } }) => {
        const value = await getSystemSetting(input.key, "true");
        return { key: input.key, value };
      }),
    /** Admin: set a system setting */
    set: protectedProcedure
      .input(z.object({
        key: z.string().min(1).max(64),
        value: z.string().max(256),
        description: z.string().max(512).optional(),
      }))
      .mutation(async ({ input }: { input: { key: string; value: string; description?: string } }) => {
        await setSystemSetting(input.key, input.value, input.description);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
