import { eq, like, or, asc, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";
import {
  InsertUser, users,
  contactSubmissions, InsertContactSubmission,
  exchangeLinks, InsertExchangeLink, ExchangeLink,
  faqs, InsertFaq, Faq,
  cryptoNews, InsertCryptoNews, CryptoNews,
  exchangeFeatureCategories, ExchangeFeatureCategory, InsertExchangeFeatureCategory,
  exchangeFeatureSupport, ExchangeFeatureSupport, InsertExchangeFeatureSupport,
  cryptoTools, CryptoTool, InsertCryptoTool,
  systemSettings,
  mediaPlatforms,
} from "../drizzle/schema";
import { ENV } from './_core/env';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = createPool({
        uri: process.env.DATABASE_URL,
        supportBigNumbers: true,
        bigNumberStrings: false,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 30000,
        // Railway MySQL 内部连接不需要 SSL，外部连接需要
        ssl: process.env.DATABASE_URL?.includes('railway.app') || process.env.DATABASE_URL?.includes('sslmode=require')
          ? { rejectUnauthorized: false }
          : undefined,
      });
      _db = drizzle(pool);
      console.log('[Database] Connection pool created successfully');
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

const DIRECT_TOOL_HINTS = [
  "aicoin",
  "jin10",
  "blockbeats",
  "oklink",
  "feixiaohao",
  "tokeninsight",
  "rootdata",
  "sosovalue",
] as const;

function inferToolNeedVpn(tool: Pick<InsertCryptoTool, "name" | "nameEn" | "source" | "url">): boolean {
  const haystack = [tool.name, tool.nameEn, tool.source, tool.url]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return !DIRECT_TOOL_HINTS.some((hint) => haystack.includes(hint));
}

export async function ensureCryptoToolsSchema(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.execute("ALTER TABLE crypto_tools ADD COLUMN needVpn BOOLEAN NOT NULL DEFAULT TRUE");
    console.log("[Database] Added crypto_tools.needVpn column");
  } catch (error) {
    const message = String(error).toLowerCase();
    if (!message.includes("duplicate column")) {
      console.warn("[Database] Failed to ensure crypto_tools.needVpn column:", error);
    }
  }

  try {
    const tools = await db
      .select({
        id: cryptoTools.id,
        name: cryptoTools.name,
        nameEn: cryptoTools.nameEn,
        source: cryptoTools.source,
        url: cryptoTools.url,
        needVpn: cryptoTools.needVpn,
      })
      .from(cryptoTools);

    for (const tool of tools) {
      const expectedNeedVpn = inferToolNeedVpn(tool);
      if (tool.needVpn !== expectedNeedVpn) {
        await db.update(cryptoTools).set({ needVpn: expectedNeedVpn }).where(eq(cryptoTools.id, tool.id));
      }
    }
  } catch (error) {
    console.warn("[Database] Failed to sync crypto tool VPN metadata:", error);
  }
}

/**
 * 检查数据库中是否已有管理员账号。
 * 用于「首位注册用户自动成为管理员」逻辑。
 */
async function hasAnyAdmin(db: ReturnType<typeof drizzle>): Promise<boolean> {
  try {
    const result = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(1);
    return result.length > 0;
  } catch {
    return false;
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }

    // ── 角色分配逻辑（优先级从高到低）────────────────────────────────────────
    if (user.role !== undefined) {
      // 1. 调用方显式指定了角色（最高优先级）
      values.role = user.role;
      updateSet.role = user.role;
    } else if (ENV.ownerOpenId && user.openId === ENV.ownerOpenId) {
      // 2. openId 匹配环境变量 OWNER_OPEN_ID（固定管理员）
      values.role = 'admin';
      updateSet.role = 'admin';
    } else {
      // 3. 首位注册用户自动成为管理员（仅当数据库中还没有任何管理员时）
      //    此后所有新用户默认为普通 user，该逻辑自动关闭
      const adminExists = await hasAnyAdmin(db);
      if (!adminExists) {
        values.role = 'admin';
        // 注意：updateSet 不设置 role，避免已有账号重新登录时被降级
        console.log(`[Auth] First user detected — granting admin role to openId: ${user.openId}`);
      }
    }

    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function submitContactForm(
  data: Omit<InsertContactSubmission, "id" | "createdAt">
): Promise<void> {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  try {
    await db.insert(contactSubmissions).values(data);
  } catch (error) {
    console.error("[Database] Failed to submit contact form:", error);
    throw error;
  }
}

/**
 * 获取客户联系表单提交记录（管理员后台使用）
 * 按创建时间倒序排列，支持分页加载
 */
export async function getContactSubmissions(
  limit = 50,
  offset = 0
): Promise<{ submissions: import("../drizzle/schema").ContactSubmission[]; total: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [submissions, countResult] = await Promise.all([
    db
      .select()
      .from(contactSubmissions)
      .orderBy(desc(contactSubmissions.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: contactSubmissions.id }).from(contactSubmissions),
  ]);
  return { submissions, total: countResult.length };
}

// ─── Exchange Links ────────────────────────────────────────────────────────────

const DEFAULT_EXCHANGE_LINKS: InsertExchangeLink[] = [
  { slug: 'gate', name: 'Gate.io', referralLink: 'https://www.gateport.business/share/GETITPRO', inviteCode: 'GETITPRO', rebateRate: '60%', sortOrder: 1 },
  { slug: 'okx', name: 'OKX', referralLink: 'https://www.vmutkhamuut.com/join/GETITPRO', inviteCode: 'GETITPRO', rebateRate: '20%', sortOrder: 2 },
  { slug: 'binance', name: 'Binance', referralLink: 'https://www.bsmkweb.cc/join?ref=GETITPRO', inviteCode: 'GETITPRO', rebateRate: '20%', sortOrder: 3 },
  { slug: 'bybit', name: 'Bybit', referralLink: 'https://partner.bybit.com/b/GETITPRO', inviteCode: 'GETITPRO', rebateRate: '30%', sortOrder: 4 },
  { slug: 'bitget', name: 'Bitget', referralLink: 'https://partner.hdmune.cn/bg/u9qqgq4u', inviteCode: 'GETITPRO', rebateRate: '50%', sortOrder: 5 },
];

export async function getExchangeLinks(): Promise<ExchangeLink[]> {
  const db = await getDb();
  if (!db) {
    return DEFAULT_EXCHANGE_LINKS.map((d, i) => ({ ...d, id: i + 1, sortOrder: d.sortOrder ?? i + 1, updatedAt: new Date() })) as ExchangeLink[];
  }
  const existing = await db.select().from(exchangeLinks);
  if (existing.length === 0) {
    console.log("[Database] Seeding exchange_links table with defaults…");
    await db.insert(exchangeLinks).values(DEFAULT_EXCHANGE_LINKS);
    return db.select().from(exchangeLinks).orderBy(exchangeLinks.sortOrder);
  }
  return db.select().from(exchangeLinks).orderBy(exchangeLinks.sortOrder);
}

export async function updateExchangeLink(
  slug: string,
  data: Partial<Pick<InsertExchangeLink, 'referralLink' | 'inviteCode' | 'rebateRate' | 'name'>>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(exchangeLinks).set(data).where(eq(exchangeLinks.slug, slug));
}

// ─── FAQ ───────────────────────────────────────────────────────────────────────

const DEFAULT_FAQS: InsertFaq[] = [
  { question: "什么是加密货币？", answer: "加密货币是一种基于区块链技术的数字货币，不由任何国家或机构控制。比特币（BTC）是第一种加密货币，诞生于2009年。目前全球有超过2万种加密货币，总市值超过2万亿美元。", category: "basic", sortOrder: 1, isActive: true },
  { question: "区块链是什么？", answer: "区块链是一种分布式账本技术，所有交易记录被打包成「区块」，并按时间顺序链接成「链」。数据一旦写入就无法篡改，任何人都可以公开验证，无需信任中间机构。", category: "basic", sortOrder: 2, isActive: true },
  { question: "什么是钱包地址？", answer: "钱包地址是你在区块链上的「账号」，类似银行卡号。由一串字母和数字组成（如 0x1234...abcd），用于接收和发送加密货币。每个地址都有对应的私钥，私钥就是你的「密码」，千万不能泄露。", category: "basic", sortOrder: 3, isActive: true },
  { question: "什么是返佣？怎么获得？", answer: "返佣是交易所为了推广用户而设计的奖励机制。通过邀请链接注册后，你每次交易产生的手续费，有一部分会以返佣形式退还给你。使用我们的邀请链接注册，可享受最高60%的手续费返还，长期交易可节省大量成本。", category: "fees", sortOrder: 4, isActive: true },
  { question: "什么是现货交易？", answer: "现货交易是最基础的交易方式：用一种货币直接买入另一种货币。比如用100 USDT买入BTC，价格上涨后卖出获利。现货交易没有杠杆，最多亏损本金，适合新手入门。", category: "trading", sortOrder: 5, isActive: true },
  { question: "什么是合约交易（永续合约）？", answer: "合约交易允许你用「保证金」控制更大的仓位，通过杠杆放大收益（同时也放大风险）。永续合约没有到期日，可以做多（看涨）也可以做空（看跌）。例如：用100 USDT开10倍杠杆，相当于控制1000 USDT的仓位，价格涨10%你赚100%，但跌10%也会亏损100%。", category: "trading", sortOrder: 6, isActive: true },
  { question: "什么是杠杆？有什么风险？", answer: "杠杆是放大交易规模的工具。10倍杠杆意味着用1份本金控制10份资产。收益和亏损都被同比例放大。当亏损超过保证金时，交易所会「强制平仓」（强平），你会损失全部保证金。新手建议从低杠杆（2-3倍）开始，切勿满仓操作。", category: "trading", sortOrder: 7, isActive: true },
  { question: "如何保护我的账户安全？", answer: "① 开启双重验证（2FA/Google Authenticator）；② 使用强密码，不同平台不重复；③ 不在公共WiFi下操作；④ 不点击陌生链接，防止钓鱼攻击；⑤ 大额资产建议转入冷钱包（硬件钱包）；⑥ 私钥和助记词离线保存，不截图不上传云端。", category: "security", sortOrder: 8, isActive: true },
  { question: "什么是USDT？为什么大家都用它？", answer: "USDT（泰达币）是与美元1:1锚定的稳定币，1 USDT ≈ 1美元。它的价格不波动，是加密市场的「结算货币」。大多数交易对都以USDT计价，转账快速且手续费低，是进入币圈的第一步。", category: "basic", sortOrder: 9, isActive: true },
  { question: "交易所之间有什么区别？", answer: "主要区别在于：① 支持的币种数量（Gate.io > Binance > OKX）；② 手续费高低（通过邀请链接注册可大幅降低）；③ 安全性（大交易所储备金更透明）；④ 功能（Gate.io支持TradFi资产，OKX有强大的Web3钱包）。建议新手选择Binance或Gate.io入门。", category: "fees", sortOrder: 10, isActive: true },
  { question: "什么是DeFi（去中心化金融）？", answer: "DeFi是运行在区块链上的金融服务，无需银行或中间机构。包括去中心化交易所（DEX）、借贷协议、流动性挖矿等。资产完全由自己控制，但风险也更高，需要了解智能合约风险和流动性风险。", category: "basic", sortOrder: 11, isActive: true },
  { question: "如何从法币（人民币）买入加密货币？", answer: "主要方式：① P2P交易：在交易所的P2P市场找商家，用支付宝/微信/银行卡购买USDT；② C2C：与其他用户直接交易；③ 场外OTC：大额交易可联系专业OTC商。建议新手通过大型交易所（Binance、OKX）的P2P功能购买，安全有保障。", category: "basic", sortOrder: 12, isActive: true },
  { question: "什么是牛市和熊市？", answer: "牛市：市场整体上涨，价格持续走高，投资者情绪乐观。熊市：市场整体下跌，价格持续走低，恐慌情绪蔓延。加密市场波动远大于传统市场，日涨跌10-20%很常见。建议新手在熊市低价布局，牛市高点逐步获利了结。", category: "trading", sortOrder: 13, isActive: true },
  { question: "什么是Gas费？", answer: "Gas费是在以太坊等区块链上进行交易时支付给矿工/验证者的费用，用于激励他们处理你的交易。网络拥堵时Gas费会大幅上涨。Solana、BNB Chain等公链的Gas费通常更低，适合频繁小额交易。", category: "fees", sortOrder: 14, isActive: true },
  { question: "什么是NFT？", answer: "NFT（非同质化代币）是区块链上的唯一数字资产，每个NFT都是独一无二的，不可复制。可以代表数字艺术品、游戏道具、虚拟土地等。2021年NFT市场爆发，但目前市场已大幅降温，投资需谨慎。", category: "basic", sortOrder: 15, isActive: true },
  { question: "加密货币交易需要缴税吗？", answer: "各国政策不同。中国大陆目前没有明确的加密货币税收规定，但资金流动可能受到监管关注。美国、欧盟等地区将加密货币视为资产，买卖盈利需缴纳资本利得税。建议了解所在地区的法规，保留交易记录。", category: "other", sortOrder: 16, isActive: true },
  { question: "什么是做市商和吃单方？手续费有什么区别？", answer: "做市商（Maker）：挂单等待成交，为市场提供流动性，手续费通常更低甚至为0。吃单方（Taker）：直接与已有订单成交，消耗流动性，手续费略高。通过邀请链接注册后，两种手续费都会有折扣，长期下来节省相当可观。", category: "fees", sortOrder: 17, isActive: true },
  { question: "什么是空投（Airdrop）？", answer: "空投是项目方免费向用户分发代币的方式，通常用于推广项目。获取方式：① 持有特定代币；② 使用项目的产品（如DEX、借贷协议）；③ 完成特定任务（关注社交媒体、测试网交互）。知名空投案例：Uniswap（UNI）、Arbitrum（ARB）等，部分用户获得了价值数千美元的代币。", category: "basic", sortOrder: 18, isActive: true },
];

/** Seed faqs table if empty, then return active FAQs */
export async function getFaqs(search?: string): Promise<Faq[]> {
  const db = await getDb();
  if (!db) {
    // Return static fallback
    const all = DEFAULT_FAQS.map((d, i) => ({ ...d, id: i + 1, createdAt: new Date(), updatedAt: new Date() })) as Faq[];
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter(f => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
  }

  const existing = await db.select().from(faqs);
  if (existing.length === 0) {
    console.log("[Database] Seeding faqs table with defaults…");
    await db.insert(faqs).values(DEFAULT_FAQS);
  }

  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    return db.select().from(faqs)
      .where(or(like(faqs.question, q), like(faqs.answer, q)))
      .orderBy(asc(faqs.sortOrder));
  }

  return db.select().from(faqs)
    .where(eq(faqs.isActive, true))
    .orderBy(asc(faqs.sortOrder));
}

// ─── Crypto News ───────────────────────────────────────────────────────────────

const DEFAULT_NEWS: InsertCryptoNews[] = [
  {
    title: "比特币跌破6.5万美元，避险情绪升温推动金银走高",
    summary: "受地缘政治紧张及美国关税不确定性影响，加密市场再度下跌。过去1小时全网爆仓2.38亿美元，其中多单爆仓2.32亿美元。",
    source: "律动BlockBeats",
    url: "https://www.theblockbeats.info/flash",
    category: "market",
    isPinned: true,
    isActive: true,
    publishedAt: new Date("2026-02-23T09:16:00Z"),
  },
  {
    title: "加密恐慌指数降至5，市场「极度恐慌」情绪加深",
    summary: "CMC恐惧与贪婪指数跌至5，为近年来极低水平，显示市场情绪极度悲观。历史上极度恐慌往往是布局良机。",
    source: "律动BlockBeats",
    url: "https://www.theblockbeats.info/flash",
    category: "market",
    isPinned: false,
    isActive: true,
    publishedAt: new Date("2026-02-23T08:16:00Z"),
  },
  {
    title: "早期比特币布道者Erik Voorhees斥资2038万美元买入9911枚ETH",
    summary: "链上数据显示，比特币早期布道者Erik Voorhees近日大举买入以太坊，均价约2056美元，显示部分老牌投资者在下跌中逢低布局。",
    source: "律动BlockBeats",
    url: "https://www.theblockbeats.info/flash",
    category: "market",
    isPinned: false,
    isActive: true,
    publishedAt: new Date("2026-02-23T07:42:00Z"),
  },
  {
    title: "渣打银行：稳定币市值2028年底将达2万亿美元",
    summary: "渣打银行报告预测，稳定币市值将在2028年底达到2万亿美元，为美国国债带来0.8至1万亿美元的新需求，稳定币正成为全球金融体系的重要组成部分。",
    source: "律动BlockBeats",
    url: "https://www.theblockbeats.info/flash",
    category: "policy",
    isPinned: false,
    isActive: true,
    publishedAt: new Date("2026-02-23T06:39:00Z"),
  },
  {
    title: "Binance平台比特币余额升至676,834枚，创2024年11月以来新高",
    summary: "链上数据显示，Binance平台BTC余额持续增加，表明用户正将比特币转入交易所，可能预示着卖压增加或用户准备交易。",
    source: "律动BlockBeats",
    url: "https://www.theblockbeats.info/flash",
    category: "exchange",
    isPinned: false,
    isActive: true,
    publishedAt: new Date("2026-02-23T05:10:00Z"),
  },
  {
    title: "Arthur Hayes披露当前投资组合：持有BTC、ETH、ZEC、HYPE及实物黄金",
    summary: "BitMEX创始人Arthur Hayes公开当前仓位，加密资产包括BTC、ETH、ZEC、HYPE，同时布局贵金属与能源股，并持有实物黄金作为对冲。",
    source: "律动BlockBeats",
    url: "https://www.theblockbeats.info/flash",
    category: "market",
    isPinned: false,
    isActive: true,
    publishedAt: new Date("2026-02-23T04:33:00Z"),
  },
  {
    title: "彭博社：曾推动比特币ETF热潮的对冲基金正迅速撤离",
    summary: "彭博社报道，2025年Q4比特币ETF持仓环比下降28%，曾大力推动比特币ETF的对冲基金正在减仓，市场机构投资者情绪出现明显转变。",
    source: "律动BlockBeats",
    url: "https://www.theblockbeats.info/flash",
    category: "market",
    isPinned: false,
    isActive: true,
    publishedAt: new Date("2026-02-23T03:23:00Z"),
  },
  {
    title: "2025年全球加密货币持有者达7.41亿，同比增长12.4%",
    summary: "Crypto.com最新报告显示，全球加密货币持有者数量从2024年的6.59亿增至7.41亿，同比增长12.4%，加密货币普及率持续提升。",
    source: "深潮TechFlow",
    url: "https://www.techflowpost.com",
    category: "market",
    isPinned: false,
    isActive: true,
    publishedAt: new Date("2026-02-22T10:00:00Z"),
  },
  {
    title: "《经济学人》：在亚洲，稳定币正成为新的支付基础设施",
    summary: "Chainalysis数据显示，印度加密货币流入规模估计达3380亿美元（2024年中至2025年），稳定币在亚洲支付场景中的应用正在快速扩张。",
    source: "律动BlockBeats",
    url: "https://www.theblockbeats.info/flash",
    category: "policy",
    isPinned: false,
    isActive: true,
    publishedAt: new Date("2026-02-22T08:00:00Z"),
  },
  {
    title: "AI支付暗战：Google带60家盟友，Stripe自己建了整条路",
    summary: "Google联合60家合作伙伴推进AI支付生态，Stripe则申请国家银行信托牌照，并与Paradigm共同孵化专为支付设计的Tempo Chain，AI与加密支付的融合正在加速。",
    source: "律动BlockBeats",
    url: "https://www.theblockbeats.info/news/61305",
    category: "defi",
    isPinned: false,
    isActive: true,
    publishedAt: new Date("2026-02-22T06:00:00Z"),
  },
];

// ─── Exchange Feature Guide ─────────────────────────────────────────────────────

const DEFAULT_FEATURE_CATEGORIES: InsertExchangeFeatureCategory[] = [
  // 1. 现货交易
  { slug: 'spot', nameZh: '现货交易', nameEn: 'Spot Trading', icon: '💱', descZh: '用一种加密货币直接买入另一种，是最基础的交易方式，无杠杆，最多亏损本金。', descEn: 'Directly exchange one crypto for another. The most basic trading method with no leverage — you can only lose your principal.', difficulty: 'beginner', sortOrder: 1 },
  // 2. 合约交易
  { slug: 'futures', nameZh: '合约交易', nameEn: 'Futures / Perpetuals', icon: '📈', descZh: '通过保证金控制更大仓位，可做多也可做空，支持高倍杠杆，风险与收益同步放大。', descEn: 'Control larger positions with margin, go long or short, with high leverage that amplifies both gains and losses.', difficulty: 'intermediate', sortOrder: 2 },
  // 3. 杠杆交易
  { slug: 'margin', nameZh: '杠杆交易', nameEn: 'Margin Trading', icon: '⚡', descZh: '在现货市场借入资金进行交易，实际持有真实加密货币资产，有借贷利息但无资金费率，最高杠杆通常为 3-10 倍。', descEn: 'Borrow funds to trade in the spot market — you hold real crypto assets. Has borrowing interest but no funding rates. Max leverage typically 3-10x.', difficulty: 'intermediate', sortOrder: 3 },
  // 4. 跟单交易
  { slug: 'copy_trading', nameZh: '跟单交易', nameEn: 'Copy Trading', icon: '👥', descZh: '自动复制顶级交易员的仓位，适合没有时间研究市场的用户，一键跟随专业策略。', descEn: 'Automatically mirror top traders\' positions. Ideal for users without time to research markets — one-click professional strategy copying.', difficulty: 'beginner', sortOrder: 4 },
  // 5. TradFi 传统金融
  { slug: 'tradfi', nameZh: 'TradFi 传统金融', nameEn: 'TradFi Assets', icon: '🏅', descZh: '在加密交易所内交易黄金、白银、原油、股票指数等传统金融资产的代币化版本，打通 TradFi 与 DeFi 的边界。', descEn: 'Trade tokenized versions of traditional financial assets — gold, silver, crude oil, stock indices — directly within a crypto exchange, bridging TradFi and DeFi.', difficulty: 'intermediate', sortOrder: 5 },
  // 6. P2P 法币交易
  { slug: 'p2p', nameZh: 'P2P 法币交易', nameEn: 'P2P Fiat Trading', icon: '🏦', descZh: '通过支付宝/微信/银行卡等方式直接与其他用户买卖加密货币，交易所担保托管资产。', descEn: 'Buy/sell crypto directly with other users via Alipay/WeChat/bank transfer, with the exchange acting as escrow.', difficulty: 'beginner', sortOrder: 6 },
  // 7. Launchpad 打新
  { slug: 'launchpad', nameZh: 'Launchpad 打新', nameEn: 'Launchpad / IEO', icon: '🚀', descZh: '在新项目代币正式上市前以优惠价格认购，由交易所背书，通常需要质押平台币获得资格。', descEn: 'Subscribe to new project tokens at preferential prices before public listing, backed by the exchange. Usually requires staking platform tokens.', difficulty: 'intermediate', sortOrder: 7 },
  // 8. 交易机器人
  { slug: 'bots', nameZh: '交易机器人', nameEn: 'Trading Bots', icon: '🤖', descZh: '自动化交易策略工具，包括网格交易、DCA（定投）、套利机器人等，7×24 小时不间断执行。', descEn: 'Automated trading strategy tools including grid trading, DCA (dollar-cost averaging), and arbitrage bots running 24/7.', difficulty: 'intermediate', sortOrder: 8 },
  // 9. 加密借记卡
  { slug: 'card', nameZh: '加密借记卡', nameEn: 'Crypto Debit Card', icon: '💳', descZh: '将加密货币余额绑定到 Visa/Mastercard 借记卡，在全球任何支持刷卡的场所消费，实时兑换。', descEn: 'Link your crypto balance to a Visa/Mastercard debit card for spending anywhere globally, with real-time conversion.', difficulty: 'beginner', sortOrder: 9 },
  // 10. 内置 DEX
  { slug: 'dex', nameZh: '内置 DEX', nameEn: 'Built-in DEX', icon: '🔄', descZh: '无需离开交易所即可访问去中心化交易所，聚合多个 DEX 的流动性，获取最优兑换价格。', descEn: 'Access decentralized exchanges without leaving the platform. Aggregates liquidity from multiple DEXs for the best swap rates.', difficulty: 'advanced', sortOrder: 10 },
  // 11. Web3 钱包
  { slug: 'web3_wallet', nameZh: 'Web3 钱包', nameEn: 'Web3 Wallet', icon: '🌐', descZh: '内置去中心化钱包，支持多链资产管理、DApp 交互、NFT 收藏和跨链桥接，是进入 Web3 世界的门户。', descEn: 'Built-in decentralized wallet supporting multi-chain asset management, DApp interaction, NFT collection, and cross-chain bridging.', difficulty: 'intermediate', sortOrder: 11 },
  // 12. 安全与储备
  { slug: 'security', nameZh: '安全与储备', nameEn: 'Security & Reserves', icon: '🛡️', descZh: '交易所的资产储备证明、安全审计、保险基金等保障措施，直接关系到用户资产的安全性。', descEn: 'Exchange proof-of-reserves, security audits, and insurance funds — directly related to the safety of user assets.', difficulty: 'beginner', sortOrder: 12 },
  // 13. 生态系统
  { slug: 'ecosystem', nameZh: '生态系统', nameEn: 'Ecosystem', icon: '🏗️', descZh: '交易所自有公链、支付系统、借记卡等周边产品构成的完整生态，持有平台币可享受更多权益。', descEn: 'The complete ecosystem of exchange-owned blockchains, payment systems, and peripheral products. Platform token holders enjoy additional benefits.', difficulty: 'advanced', sortOrder: 13 },
  // 14. 交易所活动（预留，日后扩展）
  { slug: 'events', nameZh: '交易所活动', nameEn: 'Exchange Events', icon: '🎉', descZh: '交易所定期举办的各类活动，包括交易大赛、空投活动、节日福利、VIP 专属活动等，是获取额外收益的重要渠道。', descEn: 'Regular exchange events including trading competitions, airdrops, holiday promotions, and VIP-exclusive activities — key channels for extra rewards.', difficulty: 'beginner', sortOrder: 14 },
  // 15. 理财/赚币（保留，顺序靠后）
  { slug: 'earn', nameZh: '理财/赚币', nameEn: 'Earn / Yield', icon: '💰', descZh: '将闲置资产存入交易所获取利息，包括活期理财、定期存款、质押挖矿等多种方式。', descEn: 'Deposit idle assets to earn interest, including flexible savings, fixed-term deposits, and staking products.', difficulty: 'beginner', sortOrder: 15 },
];

const DEFAULT_FEATURE_SUPPORT: InsertExchangeFeatureSupport[] = [
  // spot
  { exchangeSlug: 'gate', featureSlug: 'spot', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: '支持 3,600+ 交易对，山寨币品种全球最多，现货 Maker 手续费 0.15%，使用 GT 可享折扣。', detailEn: 'Supports 3,600+ trading pairs — most altcoins globally. Spot Maker fee 0.15%, discount available with GT.', feeInfo: 'Maker 0.15% / Taker 0.15%', highlight: 0, kycLevel: 'basic', supportedRegions: 'HK,TW,SG,EU,US部分州', feeLevel: '中' },
  { exchangeSlug: 'okx', featureSlug: 'spot', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: '支持 350+ 交易对，流动性极强，现货 Maker 手续费 0.08%，行业最低之一。', detailEn: 'Supports 350+ pairs with excellent liquidity. Spot Maker fee 0.08%, one of the lowest in the industry.', feeInfo: 'Maker 0.08% / Taker 0.10%', highlight: 1, kycLevel: 'standard', supportedRegions: 'HK,TW,SG,EU,全球（除美国）', feeLevel: '低' },
  { exchangeSlug: 'binance', featureSlug: 'spot', supported: 1, levelZh: '行业第一', levelEn: 'Industry #1', detailZh: '全球最大现货市场，流动性无与伦比，350+ 交易对，持有 BNB 享 25% 手续费折扣。', detailEn: 'World\'s largest spot market with unmatched liquidity. 350+ pairs, 25% fee discount with BNB.', feeInfo: 'Maker 0.10% / Taker 0.10%', highlight: 1, kycLevel: 'standard', supportedRegions: '全球（除美国、中国大陆）', feeLevel: '中' },
  { exchangeSlug: 'bybit', featureSlug: 'spot', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: '支持 1,000+ 现货交易对，流动性良好，但不及 Binance/OKX。', detailEn: 'Supports 1,000+ spot pairs with good liquidity, though not as deep as Binance/OKX.', feeInfo: 'Maker 0.10% / Taker 0.10%', highlight: 0, kycLevel: 'standard', supportedRegions: '全球（除美国、加拿大等）', feeLevel: '中' },
  { exchangeSlug: 'bitget', featureSlug: 'spot', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: '支持 800+ 现货交易对，Maker 手续费仅 0.02%，是手续费最低的主流交易所之一。', detailEn: 'Supports 800+ spot pairs. Maker fee only 0.02%, one of the lowest among major exchanges.', feeInfo: 'Maker 0.02% / Taker 0.06%', highlight: 1, kycLevel: 'basic', supportedRegions: '全球（除美国等受限地区）', feeLevel: '低' },
  // futures
  { exchangeSlug: 'gate', featureSlug: 'futures', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: '支持永续合约和交割合约，最高 100x 杠杆，合约 Maker 费率 -0.015%（负费率返佣）。', detailEn: 'Supports perpetual and delivery contracts, up to 100x leverage. Contract Maker fee -0.015% (rebate).', maxLeverage: '100x', feeInfo: 'Maker -0.015%', highlight: 0, kycLevel: 'basic', supportedRegions: 'HK,TW,SG,EU,US部分州', feeLevel: '低' },
  { exchangeSlug: 'okx', featureSlug: 'futures', supported: 1, levelZh: '顶级流动性', levelEn: 'Top Liquidity', detailZh: '全球前二衍生品交易所，最高 125x 杠杆，合约 Maker 费率 -0.0025%，大额开仓滑点极小。', detailEn: 'Top 2 derivatives exchange globally, up to 125x leverage, contract Maker fee -0.0025%, minimal slippage for large positions.', maxLeverage: '125x', feeInfo: 'Maker -0.0025%', highlight: 1, kycLevel: 'standard', supportedRegions: 'HK,TW,SG,EU,全球（除美国）', feeLevel: '低' },
  { exchangeSlug: 'binance', featureSlug: 'futures', supported: 1, levelZh: '行业第一', levelEn: 'Industry #1', detailZh: '全球最大合约市场，最高 125x 杠杆，流动性无与伦比，持有 BNB 享手续费折扣。', detailEn: 'World\'s largest futures market, up to 125x leverage, unmatched liquidity, BNB discount available.', maxLeverage: '125x', feeInfo: 'Maker 0.02%', highlight: 1, kycLevel: 'standard', supportedRegions: '全球（除美国、中国大陆）', feeLevel: '中' },
  { exchangeSlug: 'bybit', featureSlug: 'futures', supported: 1, levelZh: '专业级', levelEn: 'Professional', detailZh: '专注衍生品的交易所，合约 Maker 费率仅 0.01%，全行业最低，机构级流动性。', detailEn: 'Derivatives-focused exchange with contract Maker fee only 0.01% — lowest in the industry, institutional-grade liquidity.', maxLeverage: '125x', feeInfo: 'Maker 0.01% ⭐', highlight: 1, kycLevel: 'standard', supportedRegions: '全球（除美国、加拿大等）', feeLevel: '低' },
  { exchangeSlug: 'bitget', featureSlug: 'futures', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: '支持永续合约，最高 125x 杠杆，合约 Maker 费率 0.02%，流动性良好。', detailEn: 'Supports perpetual contracts, up to 125x leverage, contract Maker fee 0.02%, good liquidity.', maxLeverage: '125x', feeInfo: 'Maker 0.02%', highlight: 0, kycLevel: 'basic', supportedRegions: '全球（除美国等受限地区）', feeLevel: '低' },
  // copy_trading
  { exchangeSlug: 'gate', featureSlug: 'copy_trading', supported: 0, levelZh: '不支持', levelEn: 'Not Available', detailZh: 'Gate.io 目前不提供跟单交易功能，是其相对于竞争对手的主要短板之一。', detailEn: 'Gate.io does not currently offer copy trading — one of its main disadvantages vs competitors.', highlight: 0, kycLevel: 'none', supportedRegions: 'N/A', feeLevel: 'N/A' },
  { exchangeSlug: 'okx', featureSlug: 'copy_trading', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: '支持现货和合约跟单，可查看交易员历史收益、回撤和胜率，一键跟随。', detailEn: 'Supports spot and futures copy trading. View trader history, drawdown, and win rate — one-click follow.', highlight: 0, kycLevel: 'standard', supportedRegions: '全球（除美国）', feeLevel: '中' },
  { exchangeSlug: 'binance', featureSlug: 'copy_trading', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: '支持合约跟单，可设置跟单金额上限和止损，保护本金安全。', detailEn: 'Supports futures copy trading with configurable position limits and stop-loss to protect principal.', highlight: 0, kycLevel: 'standard', supportedRegions: '全球（除美国、中国大陆）', feeLevel: '中' },
  { exchangeSlug: 'bybit', featureSlug: 'copy_trading', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: '支持现货和合约跟单，交易员数据透明，可按收益率、最大回撤等指标筛选。', detailEn: 'Supports spot and futures copy trading with transparent trader data — filter by ROI, max drawdown, etc.', highlight: 0, kycLevel: 'standard', supportedRegions: '全球（除美国、加拿大等）', feeLevel: '中' },
  { exchangeSlug: 'bitget', featureSlug: 'copy_trading', supported: 1, levelZh: '行业第一 ⭐', levelEn: 'Industry #1 ⭐', detailZh: '全球最大跟单平台，800+ 专业交易员，数据最透明，一键跟单体验最佳，新手首选。', detailEn: 'World\'s largest copy trading platform with 800+ pro traders, most transparent data, best one-click experience — top choice for beginners.', highlight: 1, kycLevel: 'basic', supportedRegions: '全球（除美国等受限地区）', feeLevel: '中' },
  // earn
  { exchangeSlug: 'gate', featureSlug: 'earn', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: '提供活期理财、定期存款、质押挖矿、双币投资等多种产品，GT 质押可获额外收益。', detailEn: 'Offers flexible savings, fixed deposits, staking, dual investment, and more. GT staking earns additional yield.', highlight: 0, kycLevel: 'basic', supportedRegions: 'HK,TW,SG,EU,US部分州', feeLevel: '低' },
  { exchangeSlug: 'okx', featureSlug: 'earn', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: 'OKX Earn 提供简单赚币、链上赚币、结构化产品等，支持 100+ 种资产，APY 有竞争力。', detailEn: 'OKX Earn offers simple earn, on-chain earn, and structured products for 100+ assets with competitive APY.', highlight: 0, kycLevel: 'standard', supportedRegions: '全球（除美国）', feeLevel: '低' },
  { exchangeSlug: 'binance', featureSlug: 'earn', supported: 1, levelZh: '行业最丰富 ⭐', levelEn: 'Most Diverse ⭐', detailZh: 'Binance Earn 产品最丰富：活期、定期、BNB Vault、Launchpool 质押、双币投资等，APY 通常最高。', detailEn: 'Binance Earn has the most diverse products: flexible, fixed, BNB Vault, Launchpool staking, dual investment — usually highest APY.', highlight: 1, kycLevel: 'standard', supportedRegions: '全球（除美国、中国大陆）', feeLevel: '低' },
  { exchangeSlug: 'bybit', featureSlug: 'earn', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: 'Bybit Earn 提供灵活理财、固定理财和质押产品，界面简洁，操作方便。', detailEn: 'Bybit Earn offers flexible savings, fixed savings, and staking with a clean, easy-to-use interface.', highlight: 0, kycLevel: 'standard', supportedRegions: '全球（除美国、加拿大等）', feeLevel: '低' },
  { exchangeSlug: 'bitget', featureSlug: 'earn', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: 'Bitget Earn 提供活期和定期理财，BGB 质押可获额外收益，产品种类持续扩充。', detailEn: 'Bitget Earn offers flexible and fixed products. BGB staking earns additional yield with continuously expanding options.', highlight: 0, kycLevel: 'basic', supportedRegions: '全球（除美国等受限地区）', feeLevel: '低' },
  // launchpad
  { exchangeSlug: 'gate', featureSlug: 'launchpad', supported: 1, levelZh: '四合一生态', levelEn: 'Four-in-One', detailZh: 'Gate 拥有 Launchpool + Launchpad + CandyDrop + HODLer Airdrop 四合一打新生态，新币上线最快。', detailEn: 'Gate has a four-in-one launch ecosystem: Launchpool + Launchpad + CandyDrop + HODLer Airdrop — fastest new coin listings.', highlight: 0, kycLevel: 'basic', supportedRegions: 'HK,TW,SG,EU', feeLevel: '低' },
  { exchangeSlug: 'okx', featureSlug: 'launchpad', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: 'OKX Jumpstart 需要质押 OKB 参与，项目质量较高，上市后涨幅可观。', detailEn: 'OKX Jumpstart requires OKB staking. Projects are high quality with strong post-listing performance.', highlight: 0, kycLevel: 'standard', supportedRegions: '全球（除美国）', feeLevel: '低' },
  { exchangeSlug: 'binance', featureSlug: 'launchpad', supported: 1, levelZh: '行业标杆 ⭐', levelEn: 'Industry Benchmark ⭐', detailZh: 'Binance Launchpad 历史年化收益超 300%，项目质量最高，需持有 BNB 参与，是持有 BNB 的核心理由。', detailEn: 'Binance Launchpad has delivered 300%+ historical annualized returns with the highest project quality. Requires BNB — the core reason to hold BNB.', highlight: 1, kycLevel: 'standard', supportedRegions: '全球（除美国、中国大陆）', feeLevel: '低' },
  { exchangeSlug: 'bybit', featureSlug: 'launchpad', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: 'Bybit Launchpad 提供优质新项目认购，参与门槛相对较低，适合中小资金用户。', detailEn: 'Bybit Launchpad offers quality new project subscriptions with relatively low entry requirements — suitable for smaller capital.', highlight: 0, kycLevel: 'standard', supportedRegions: '全球（除美国、加拿大等）', feeLevel: '低' },
  { exchangeSlug: 'bitget', featureSlug: 'launchpad', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: 'Bitget Launchpad 持续引入优质项目，BGB 持有者享有优先认购权。', detailEn: 'Bitget Launchpad continuously introduces quality projects with priority subscription rights for BGB holders.', highlight: 0, kycLevel: 'basic', supportedRegions: '全球（除美国等受限地区）', feeLevel: '低' },
  // p2p
  { exchangeSlug: 'gate', featureSlug: 'p2p', supported: 1, levelZh: '支持', levelEn: 'Supported', detailZh: 'Gate.io 提供 P2P 交易功能，支持主流法币和支付方式，商家数量少于 Binance/OKX。', detailEn: 'Gate.io offers P2P trading supporting major fiat currencies and payment methods, though with fewer merchants than Binance/OKX.', highlight: 0, kycLevel: 'standard', supportedRegions: 'HK,TW,SG,EU', feeLevel: '低' },
  { exchangeSlug: 'okx', featureSlug: 'p2p', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: 'OKX P2P 市场活跃，支持支付宝/微信/银行卡，商家数量多，价差小，是国内用户常用入金渠道。', detailEn: 'OKX P2P is active with Alipay/WeChat/bank support, many merchants, tight spreads — popular fiat on-ramp for Chinese users.', highlight: 0, kycLevel: 'standard', supportedRegions: 'HK,TW,SG,全球（除美国）', feeLevel: '低' },
  { exchangeSlug: 'binance', featureSlug: 'p2p', supported: 1, levelZh: '全球最大 ⭐', levelEn: 'World\'s Largest ⭐', detailZh: '全球最大 P2P 市场，商家最多，价差最小，支持 100+ 法币和多种支付方式，入金最方便。', detailEn: 'World\'s largest P2P market with the most merchants, tightest spreads, 100+ fiat currencies and payment methods — easiest fiat on-ramp.', highlight: 1, kycLevel: 'standard', supportedRegions: '全球（除美国、中国大陆）', feeLevel: '低' },
  { exchangeSlug: 'bybit', featureSlug: 'p2p', supported: 1, levelZh: '支持', levelEn: 'Supported', detailZh: 'Bybit P2P 支持主流法币交易，商家数量适中，适合中小额入金。', detailEn: 'Bybit P2P supports major fiat trading with moderate merchant count — suitable for small to medium fiat on-ramps.', highlight: 0, kycLevel: 'standard', supportedRegions: '全球（除美国、加拿大等）', feeLevel: '低' },
  { exchangeSlug: 'bitget', featureSlug: 'p2p', supported: 1, levelZh: '支持', levelEn: 'Supported', detailZh: 'Bitget P2P 支持基础法币交易功能，商家数量相对较少。', detailEn: 'Bitget P2P supports basic fiat trading with relatively fewer merchants.', highlight: 0, kycLevel: 'basic', supportedRegions: '全球（除美国等受限地区）', feeLevel: '低' },
  // web3_wallet
  { exchangeSlug: 'gate', featureSlug: 'web3_wallet', supported: 1, levelZh: '支持', levelEn: 'Supported', detailZh: 'Gate Web3 钱包支持多链资产管理和 DApp 访问，功能完整但知名度低于 OKX。', detailEn: 'Gate Web3 wallet supports multi-chain asset management and DApp access — fully functional but less known than OKX.', highlight: 0, kycLevel: 'basic', supportedRegions: '全球', feeLevel: '低' },
  { exchangeSlug: 'okx', featureSlug: 'web3_wallet', supported: 1, levelZh: '行业最强 ⭐', levelEn: 'Industry Best ⭐', detailZh: 'OKX Web3 钱包支持 100+ 区块链，内置 DEX 聚合、NFT 市场、DApp 浏览器，是最完整的 Web3 入口。', detailEn: 'OKX Web3 wallet supports 100+ blockchains with built-in DEX aggregation, NFT marketplace, and DApp browser — the most complete Web3 gateway.', highlight: 1, kycLevel: 'none', supportedRegions: '全球', feeLevel: '低' },
  { exchangeSlug: 'binance', featureSlug: 'web3_wallet', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: 'Binance Web3 钱包集成在 App 内，支持多链和 DApp，但功能不及 OKX Wallet。', detailEn: 'Binance Web3 wallet is integrated in the app, supports multi-chain and DApps, but less feature-rich than OKX Wallet.', highlight: 0, kycLevel: 'none', supportedRegions: '全球', feeLevel: '低' },
  { exchangeSlug: 'bybit', featureSlug: 'web3_wallet', supported: 0, levelZh: '不支持', levelEn: 'Not Available', detailZh: 'Bybit 目前不提供内置 Web3 钱包功能，需使用第三方钱包（如 MetaMask）进行 DeFi 操作。', detailEn: 'Bybit does not currently offer a built-in Web3 wallet. Use third-party wallets (e.g., MetaMask) for DeFi operations.', highlight: 0, kycLevel: 'none', supportedRegions: 'N/A', feeLevel: 'N/A' },
  { exchangeSlug: 'bitget', featureSlug: 'web3_wallet', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: 'Bitget Wallet 是独立 App，支持多链资产管理、DApp 访问和 NFT，功能完整。', detailEn: 'Bitget Wallet is a standalone app supporting multi-chain asset management, DApp access, and NFTs.', highlight: 0, kycLevel: 'none', supportedRegions: '全球', feeLevel: '低' },
  // dex
  { exchangeSlug: 'gate', featureSlug: 'dex', supported: 1, levelZh: '支持', levelEn: 'Supported', detailZh: 'Gate Alpha 提供链上资产交易，结合 CEX 便利与 DEX 自由，支持早期高潜力资产。', detailEn: 'Gate Alpha provides on-chain asset trading combining CEX convenience with DEX freedom, supporting early high-potential assets.', highlight: 0, kycLevel: 'none', supportedRegions: '全球', feeLevel: '低' },
  { exchangeSlug: 'okx', featureSlug: 'dex', supported: 1, levelZh: '行业最强 ⭐', levelEn: 'Industry Best ⭐', detailZh: 'OKX DEX 聚合 100+ 去中心化交易所的流动性，支持 20+ 区块链，自动找到最优兑换路径。', detailEn: 'OKX DEX aggregates liquidity from 100+ DEXs across 20+ blockchains, automatically finding the best swap route.', highlight: 1, kycLevel: 'none', supportedRegions: '全球', feeLevel: '低' },
  { exchangeSlug: 'binance', featureSlug: 'dex', supported: 0, levelZh: '不支持', levelEn: 'Not Available', detailZh: 'Binance 不提供内置 DEX 功能，需通过 Binance Web3 钱包访问第三方 DEX。', detailEn: 'Binance does not offer a built-in DEX. Access third-party DEXs through the Binance Web3 wallet.', highlight: 0, kycLevel: 'none', supportedRegions: 'N/A', feeLevel: 'N/A' },
  { exchangeSlug: 'bybit', featureSlug: 'dex', supported: 0, levelZh: '不支持', levelEn: 'Not Available', detailZh: 'Bybit 不提供内置 DEX 功能，专注于 CEX 交易体验。', detailEn: 'Bybit does not offer a built-in DEX, focusing on CEX trading experience.', highlight: 0, kycLevel: 'none', supportedRegions: 'N/A', feeLevel: 'N/A' },
  { exchangeSlug: 'bitget', featureSlug: 'dex', supported: 0, levelZh: '不支持', levelEn: 'Not Available', detailZh: 'Bitget 不提供内置 DEX，需通过 Bitget Wallet 访问外部 DEX。', detailEn: 'Bitget does not offer a built-in DEX. Access external DEXs through Bitget Wallet.', highlight: 0, kycLevel: 'none', supportedRegions: 'N/A', feeLevel: 'N/A' },
  // bots
  { exchangeSlug: 'gate', featureSlug: 'bots', supported: 1, levelZh: '支持', levelEn: 'Supported', detailZh: 'Gate.io 提供网格交易机器人，支持现货和合约网格，操作简单，适合震荡行情。', detailEn: 'Gate.io offers grid trading bots for spot and futures, easy to use and suitable for ranging markets.', highlight: 0, kycLevel: 'basic', supportedRegions: '全球', feeLevel: '低' },
  { exchangeSlug: 'okx', featureSlug: 'bots', supported: 1, levelZh: '功能最丰富 ⭐', levelEn: 'Most Features ⭐', detailZh: 'OKX 提供网格交易、DCA、套利、信号机器人等多种策略，是交易机器人功能最丰富的交易所。', detailEn: 'OKX offers grid trading, DCA, arbitrage, signal bots, and more — the most feature-rich exchange for trading bots.', highlight: 1, kycLevel: 'standard', supportedRegions: '全球（除美国）', feeLevel: '低' },
  { exchangeSlug: 'binance', featureSlug: 'bots', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: 'Binance 提供网格交易、DCA 定投等机器人策略，用户基础大，策略市场活跃。', detailEn: 'Binance offers grid trading, DCA bots, and more with a large user base and active strategy marketplace.', highlight: 0, kycLevel: 'standard', supportedRegions: '全球（除美国、中国大陆）', feeLevel: '低' },
  { exchangeSlug: 'bybit', featureSlug: 'bots', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: 'Bybit 提供网格机器人、DCA 机器人和套利机器人，界面友好，适合中级用户。', detailEn: 'Bybit offers grid bots, DCA bots, and arbitrage bots with a user-friendly interface for intermediate users.', highlight: 0, kycLevel: 'standard', supportedRegions: '全球（除美国、加拿大等）', feeLevel: '低' },
  { exchangeSlug: 'bitget', featureSlug: 'bots', supported: 1, levelZh: '支持', levelEn: 'Supported', detailZh: 'Bitget 提供基础的网格交易和 DCA 机器人功能，种类少于 OKX/Bybit。', detailEn: 'Bitget offers basic grid trading and DCA bots with fewer options than OKX/Bybit.', highlight: 0, kycLevel: 'basic', supportedRegions: '全球（除美国等受限地区）', feeLevel: '低' },
  // margin (杠杆交易)
  { exchangeSlug: 'gate', featureSlug: 'margin', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: 'Gate 支持全仓和逐仓杠杆交易，最高 10 倍杠杆，支持 200+ 交易对，借贷利息按小时计算。', detailEn: 'Gate supports cross and isolated margin trading, up to 10x leverage, 200+ trading pairs, hourly borrowing interest.', feeInfo: 'Maker 0.15% / Taker 0.15%', highlight: 0, kycLevel: 'basic', supportedRegions: 'HK,TW,SG,EU,US部分州', feeLevel: '中' },
  { exchangeSlug: 'okx', featureSlug: 'margin', supported: 1, levelZh: '顶级流动性', levelEn: 'Top Liquidity', detailZh: 'OKX 杠杆交易支持全仓和逐仓模式，最高 10 倍杠杆，流动性极强，借贷利息竞争力强。', detailEn: 'OKX margin supports cross and isolated modes, up to 10x leverage, excellent liquidity, competitive borrowing rates.', feeInfo: 'Maker 0.08% / Taker 0.10%', highlight: 1, kycLevel: 'standard', supportedRegions: 'HK,TW,SG,EU,全球（除美国）', feeLevel: '低' },
  { exchangeSlug: 'binance', featureSlug: 'margin', supported: 1, levelZh: '行业第一', levelEn: 'Industry #1', detailZh: 'Binance 杠杆交易支持全仓和逐仓，最高 10 倍杠杆，全球最大杠杆市场，流动性无与伦比。', detailEn: 'Binance margin supports cross and isolated modes, up to 10x leverage, world\'s largest margin market, unmatched liquidity.', feeInfo: 'Maker 0.10% / Taker 0.10%', highlight: 1, kycLevel: 'standard', supportedRegions: '全球（除美国、中国大陆）', feeLevel: '中' },
  { exchangeSlug: 'bybit', featureSlug: 'margin', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: 'Bybit 杠杆交易支持逐仓模式，最高 10 倍杠杆，利息竞争力强。', detailEn: 'Bybit margin supports isolated mode, up to 10x leverage, competitive interest rates.', feeInfo: 'Maker 0.10% / Taker 0.10%', highlight: 0, kycLevel: 'basic', supportedRegions: '全球（除美国等）', feeLevel: '中' },
  { exchangeSlug: 'bitget', featureSlug: 'margin', supported: 1, levelZh: '支持', levelEn: 'Supported', detailZh: 'Bitget 杠杆交易支持全仓和逐仓，最高 10 倍杠杆，功能完善。', detailEn: 'Bitget margin supports cross and isolated modes, up to 10x leverage, complete feature set.', feeInfo: 'Maker 0.10% / Taker 0.10%', highlight: 0, kycLevel: 'basic', supportedRegions: '全球（除美国等受限地区）', feeLevel: '中' },
  // card
  { exchangeSlug: 'gate', featureSlug: 'card', supported: 0, levelZh: '不支持', levelEn: 'Not Available', detailZh: 'Gate.io 目前不提供加密借记卡服务，是其相对于竞争对手的短板之一。', detailEn: 'Gate.io does not currently offer a crypto debit card — one of its disadvantages vs competitors.', highlight: 0, kycLevel: 'none', supportedRegions: 'N/A', feeLevel: 'N/A' },
  { exchangeSlug: 'okx', featureSlug: 'card', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: 'OKX Card 支持 Visa，可在全球消费，实时将加密货币兑换为法币，支持 Apple Pay/Google Pay。', detailEn: 'OKX Card supports Visa for global spending, real-time crypto-to-fiat conversion, and Apple Pay/Google Pay.', highlight: 0, kycLevel: 'full', supportedRegions: 'EU,部分亚太地区', feeLevel: '低' },
  { exchangeSlug: 'binance', featureSlug: 'card', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: 'Binance Card 支持 Visa，全球 6000 万+ 商家可用，持有 BNB 可享消费返现，最高 8% 返现。', detailEn: 'Binance Card supports Visa at 60M+ merchants globally. BNB holders enjoy up to 8% cashback on spending.', highlight: 1, kycLevel: 'full', supportedRegions: 'EU,全球部分地区', feeLevel: '低' },
  { exchangeSlug: 'bybit', featureSlug: 'card', supported: 0, levelZh: '不支持', levelEn: 'Not Available', detailZh: 'Bybit 目前不提供加密借记卡服务。', detailEn: 'Bybit does not currently offer a crypto debit card.', highlight: 0, kycLevel: 'none', supportedRegions: 'N/A', feeLevel: 'N/A' },
  { exchangeSlug: 'bitget', featureSlug: 'card', supported: 0, levelZh: '不支持', levelEn: 'Not Available', detailZh: 'Bitget 目前不提供加密借记卡服务。', detailEn: 'Bitget does not currently offer a crypto debit card.', highlight: 0, kycLevel: 'none', supportedRegions: 'N/A', feeLevel: 'N/A' },
  // security
  { exchangeSlug: 'gate', featureSlug: 'security', supported: 1, levelZh: '行业最透明 ⭐', levelEn: 'Most Transparent ⭐', detailZh: '全球首家 100% 储备承诺，与 Armanino LLP 合作审计，储备率 125%，开源 Merkle Tree 验证，透明度行业第一。', detailEn: 'World\'s first 100% reserve commitment, audited by Armanino LLP, 125% reserve ratio, open-source Merkle Tree verification — industry-leading transparency.', highlight: 1, kycLevel: 'basic', supportedRegions: '全球', feeLevel: '低' },
  { exchangeSlug: 'okx', featureSlug: 'security', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: 'OKX 定期发布储备证明，储备率 105%+，设有安全基金，多重签名冷钱包存储大部分资产。', detailEn: 'OKX regularly publishes proof-of-reserves with 105%+ ratio, maintains a security fund, and stores most assets in multi-sig cold wallets.', highlight: 0, kycLevel: 'standard', supportedRegions: '全球（除美国）', feeLevel: '低' },
  { exchangeSlug: 'binance', featureSlug: 'security', supported: 1, levelZh: '行业标准', levelEn: 'Industry Standard', detailZh: 'Binance 储备率 100%+，设有 10 亿美元 SAFU 保险基金，是行业最大的用户保护基金。', detailEn: 'Binance maintains 100%+ reserves and a $1B SAFU insurance fund — the largest user protection fund in the industry.', highlight: 0, kycLevel: 'standard', supportedRegions: '全球（除美国、中国大陆）', feeLevel: '低' },
  { exchangeSlug: 'bybit', featureSlug: 'security', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: 'Bybit 储备率 100%+，迂拜监管合规，定期发布储备证明，资产安全有保障。', detailEn: 'Bybit maintains 100%+ reserves, is Dubai-regulated, and regularly publishes proof-of-reserves.', highlight: 0, kycLevel: 'standard', supportedRegions: '全球（除美国、加拿大等）', feeLevel: '低' },
  { exchangeSlug: 'bitget', featureSlug: 'security', supported: 1, levelZh: '行业领先 ⭐', levelEn: 'Industry Leading ⭐', detailZh: 'Bitget 储备率超过 150%，设有 3 亿美元用户保护基金，是储备率最高的主流交易所之一。', detailEn: 'Bitget maintains 150%+ reserves and a $300M user protection fund — one of the highest reserve ratios among major exchanges.', highlight: 1, kycLevel: 'basic', supportedRegions: '全球（除美国等受限地区）', feeLevel: '低' },
  // ecosystem
  { exchangeSlug: 'gate', featureSlug: 'ecosystem', supported: 1, levelZh: 'TradFi 先锋', levelEn: 'TradFi Pioneer', detailZh: 'Gate 生态包括 GateChain（公链）、Gate Layer（L2）、Gate Perp DEX，以及独特的黄金代币（XAUt）等 TradFi 资产支持。', detailEn: 'Gate ecosystem includes GateChain, Gate Layer (L2), Gate Perp DEX, and unique TradFi asset support like gold tokens (XAUt).', highlight: 0, kycLevel: 'basic', supportedRegions: '全球', feeLevel: '中' },
  { exchangeSlug: 'okx', featureSlug: 'ecosystem', supported: 1, levelZh: 'Web3 最完整 ⭐', levelEn: 'Most Complete Web3 ⭐', detailZh: 'OKX 生态最完整：X Layer（L2）+ OKX Web3 钱包 + DEX + NFT + DApp 生态，是最完整的 Web3 交易所生态。', detailEn: 'OKX has the most complete ecosystem: X Layer (L2) + OKX Web3 Wallet + DEX + NFT + DApp ecosystem — the most complete Web3 exchange ecosystem.', highlight: 1, kycLevel: 'standard', supportedRegions: '全球（除美国）', feeLevel: '中' },
  { exchangeSlug: 'binance', featureSlug: 'ecosystem', supported: 1, levelZh: '规模最大 ⭐', levelEn: 'Largest Scale ⭐', detailZh: 'Binance 生态规模最大：BNB Chain（全球最活跃 EVM 链之一）+ Binance Pay + Binance Card + Binance NFT，用户基础无与伦比。', detailEn: 'Binance has the largest ecosystem: BNB Chain (one of the most active EVM chains) + Binance Pay + Binance Card + Binance NFT, with an unmatched user base.', highlight: 1, kycLevel: 'standard', supportedRegions: '全球（除美国、中国大陆）', feeLevel: '中' },
  { exchangeSlug: 'bybit', featureSlug: 'ecosystem', supported: 1, levelZh: '专注交易', levelEn: 'Trading Focused', detailZh: 'Bybit 生态相对简单，专注于交易体验，没有自有公链，Web3 功能较弱。', detailEn: 'Bybit\'s ecosystem is relatively simple, focused on trading experience without its own blockchain or strong Web3 features.', highlight: 0, kycLevel: 'standard', supportedRegions: '全球（除美国、加拿大等）', feeLevel: '中' },
  { exchangeSlug: 'bitget', featureSlug: 'ecosystem', supported: 1, levelZh: '跟单生态', levelEn: 'Copy Trading Ecosystem', detailZh: 'Bitget 生态以跟单为核心，Bitget Wallet 作为独立 App 提供 Web3 功能，BGB 是生态核心代币。', detailEn: 'Bitget\'s ecosystem centers on copy trading, with Bitget Wallet as a standalone app for Web3 features and BGB as the core ecosystem token.', highlight: 0, kycLevel: 'basic', supportedRegions: '全球（除美国等受限地区）', feeLevel: '中' },
  // tradfi
  { exchangeSlug: 'gate', featureSlug: 'tradfi', supported: 1, levelZh: '行业先锋 ⭐', levelEn: 'Industry Pioneer ⭐', detailZh: 'Gate 是最早支持 TradFi 资产的主流交易所，提供黄金代币（XAUt）、白銀代币、原油 CFD 等传统金融资产交易。', detailEn: 'Gate is the earliest major exchange to support TradFi assets, offering gold tokens (XAUt), silver tokens, crude oil CFDs, and other traditional financial assets.', highlight: 1, kycLevel: 'standard', supportedRegions: 'HK,TW,SG,EU', feeLevel: '中' },
  { exchangeSlug: 'okx', featureSlug: 'tradfi', supported: 1, levelZh: '完整支持', levelEn: 'Full Support', detailZh: 'OKX 提供黄金代币（OKX Gold）、白銀代币等商品资产，支持通过合约交易商品指数。', detailEn: 'OKX offers gold tokens (OKX Gold), silver tokens, and commodity assets, supporting commodity index trading through futures contracts.', highlight: 0, kycLevel: 'standard', supportedRegions: 'HK,TW,SG,EU,全球（除美国）', feeLevel: '中' },
  { exchangeSlug: 'binance', featureSlug: 'tradfi', supported: 0, levelZh: '不支持', levelEn: 'Not Available', detailZh: 'Binance 目前不提供黄金、股票等传统金融资产的代币化交易，专注于加密货币原生资产。', detailEn: 'Binance does not currently offer tokenized trading of traditional assets like gold or stocks, focusing on native crypto assets.', highlight: 0, kycLevel: 'none', supportedRegions: 'N/A', feeLevel: 'N/A' },
  { exchangeSlug: 'bybit', featureSlug: 'tradfi', supported: 0, levelZh: '不支持', levelEn: 'Not Available', detailZh: 'Bybit 目前不提供黄金、股票等传统金融资产交易。', detailEn: 'Bybit does not currently offer trading of traditional financial assets like gold or stocks.', highlight: 0, kycLevel: 'none', supportedRegions: 'N/A', feeLevel: 'N/A' },
  { exchangeSlug: 'bitget', featureSlug: 'tradfi', supported: 0, levelZh: '不支持', levelEn: 'Not Available', detailZh: 'Bitget 目前不提供黄金、股票等传统金融资产交易。', detailEn: 'Bitget does not currently offer trading of traditional financial assets like gold or stocks.', highlight: 0, kycLevel: 'none', supportedRegions: 'N/A', feeLevel: 'N/A' },
  // events (交易所活动)
  { exchangeSlug: 'gate', featureSlug: 'events', supported: 1, levelZh: '活动丰富', levelEn: 'Rich Events', detailZh: 'Gate 定期举办交易大赛、空投活动、节日福利，山寨币用户可获得额外奖励。', detailEn: 'Gate regularly hosts trading competitions, airdrops, and holiday promotions. Altcoin users can earn extra rewards.', highlight: 0, kycLevel: 'none', supportedRegions: '全球', feeLevel: 'N/A' },
  { exchangeSlug: 'okx', featureSlug: 'events', supported: 1, levelZh: '顶级活动 ⭐', levelEn: 'Top Events ⭐', detailZh: 'OKX 活动质量高，包括 Web3 活动、交易大赛、空投、OKB 持有者专属福利，是行业内活动丰富度最高的交易所之一。', detailEn: 'OKX offers high-quality events including Web3 activities, trading competitions, airdrops, and OKB holder exclusives — one of the most event-rich exchanges.', highlight: 1, kycLevel: 'none', supportedRegions: '全球', feeLevel: 'N/A' },
  { exchangeSlug: 'binance', featureSlug: 'events', supported: 1, levelZh: '行业最多活动', levelEn: 'Most Events', detailZh: 'Binance 活动数量最多，包括 Launchpool、空投、交易大赛、BNB 持有者专属福利，用户基数庄大保证活动质量。', detailEn: 'Binance has the most events industry-wide: Launchpool, airdrops, trading competitions, BNB holder exclusives. Massive user base ensures quality activities.', highlight: 1, kycLevel: 'none', supportedRegions: '全球（除美国、中国大陆）', feeLevel: 'N/A' },
  { exchangeSlug: 'bybit', featureSlug: 'events', supported: 1, levelZh: '活动丰富', levelEn: 'Active Events', detailZh: 'Bybit 定期举办交易大赛、空投和 VIP 专属活动，对合约交易者奖励尤为丰厚。', detailEn: 'Bybit regularly hosts trading competitions, airdrops, and VIP-exclusive events with particularly generous rewards for futures traders.', highlight: 0, kycLevel: 'none', supportedRegions: '全球（除美国等）', feeLevel: 'N/A' },
  { exchangeSlug: 'bitget', featureSlug: 'events', supported: 1, levelZh: '活动丰富', levelEn: 'Active Events', detailZh: 'Bitget 活动内容包括交易大赛、空投和新用户福利，跟单交易用户奖励尤其丰厚。', detailEn: 'Bitget events include trading competitions, airdrops, and new user bonuses, with particularly generous rewards for copy trading users.', highlight: 0, kycLevel: 'none', supportedRegions: '全球（除美国等）', feeLevel: 'N/A' },
];

/** Return all feature categories ordered by sortOrder, auto-seed if empty */
export async function getExchangeFeatureCategories(): Promise<ExchangeFeatureCategory[]> {
  const db = await getDb();
  if (!db) return DEFAULT_FEATURE_CATEGORIES.map((d, i) => ({ ...d, id: i + 1 })) as ExchangeFeatureCategory[];
  const existing = await db.select().from(exchangeFeatureCategories);
  if (existing.length === 0) {
    console.log('[Database] Seeding exchange_feature_categories with defaults…');
    await db.insert(exchangeFeatureCategories).values(DEFAULT_FEATURE_CATEGORIES);
  }
  return db.select().from(exchangeFeatureCategories).orderBy(asc(exchangeFeatureCategories.sortOrder));
}

/** Return all feature support rows for a given featureSlug, auto-seed if empty */
export async function getExchangeFeatureSupport(featureSlug: string): Promise<ExchangeFeatureSupport[]> {
  const db = await getDb();
  if (!db) return DEFAULT_FEATURE_SUPPORT.filter(s => s.featureSlug === featureSlug) as ExchangeFeatureSupport[];
  const totalExisting = await db.select().from(exchangeFeatureSupport);
  if (totalExisting.length === 0) {
    console.log('[Database] Seeding exchange_feature_support with defaults…');
    await db.insert(exchangeFeatureSupport).values(DEFAULT_FEATURE_SUPPORT);
  }
  return db.select().from(exchangeFeatureSupport)
    .where(eq(exchangeFeatureSupport.featureSlug, featureSlug));
}

/** Return all feature support rows for a given exchange, auto-seed if empty */
export async function getAllExchangeFeatureSupport(): Promise<ExchangeFeatureSupport[]> {
  const db = await getDb();
  if (!db) return DEFAULT_FEATURE_SUPPORT as ExchangeFeatureSupport[];
  const rows = await db.select().from(exchangeFeatureSupport);
  if (rows.length === 0) {
    console.log('[Database] Seeding exchange_feature_support with defaults…');
    await db.insert(exchangeFeatureSupport).values(DEFAULT_FEATURE_SUPPORT);
    return db.select().from(exchangeFeatureSupport);
  }
  return rows;
}

export async function getExchangeAllFeatures(exchangeSlug: string): Promise<ExchangeFeatureSupport[]> {
  const db = await getDb();
  if (!db) return DEFAULT_FEATURE_SUPPORT.filter(s => s.exchangeSlug === exchangeSlug) as ExchangeFeatureSupport[];
  const totalExisting = await db.select().from(exchangeFeatureSupport);
  if (totalExisting.length === 0) {
    console.log('[Database] Seeding exchange_feature_support with defaults…');
    await db.insert(exchangeFeatureSupport).values(DEFAULT_FEATURE_SUPPORT);
  }
  return db.select().from(exchangeFeatureSupport)
    .where(eq(exchangeFeatureSupport.exchangeSlug, exchangeSlug));
}

/** Seed crypto_news table if empty, then return active news sorted by publishedAt desc */
export async function getCryptoNews(limit = 20): Promise<CryptoNews[]> {
  const db = await getDb();
  if (!db) {
    return DEFAULT_NEWS.map((d, i) => ({ ...d, id: i + 1, createdAt: new Date() })) as CryptoNews[];
  }

  const existing = await db.select().from(cryptoNews);
  if (existing.length === 0) {
    console.log("[Database] Seeding crypto_news table with defaults…");
    await db.insert(cryptoNews).values(DEFAULT_NEWS);
  }

  return db.select().from(cryptoNews)
    .where(eq(cryptoNews.isActive, true))
    .orderBy(desc(cryptoNews.publishedAt))
    .limit(limit);
}

// ─── Admin CRUD: Feature Categories ────────────────────────────────────────

/** Create a new feature category */
export async function createFeatureCategory(data: InsertExchangeFeatureCategory): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.insert(exchangeFeatureCategories).values(data);
}

/** Update an existing feature category by slug */
export async function updateFeatureCategory(
  slug: string,
  data: Partial<Omit<InsertExchangeFeatureCategory, 'slug'>>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(exchangeFeatureCategories)
    .set(data)
    .where(eq(exchangeFeatureCategories.slug, slug));
}

/** Delete a feature category by slug */
export async function deleteFeatureCategory(slug: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.delete(exchangeFeatureCategories)
    .where(eq(exchangeFeatureCategories.slug, slug));
}

// ─── Admin CRUD: Feature Support ────────────────────────────────────────────

/** Upsert (insert or update) a feature support record */
export async function upsertFeatureSupport(data: InsertExchangeFeatureSupport): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  // Build the update set (all fields except the composite key)
  const updateSet: Partial<InsertExchangeFeatureSupport> = {
    supported: data.supported,
    levelZh: data.levelZh,
    levelEn: data.levelEn,
    detailZh: data.detailZh,
    detailEn: data.detailEn,
    highlight: data.highlight,
  };
  if (data.maxLeverage !== undefined) updateSet.maxLeverage = data.maxLeverage;
  if (data.feeInfo !== undefined) updateSet.feeInfo = data.feeInfo;
  if (data.kycLevel !== undefined) updateSet.kycLevel = data.kycLevel;
  if (data.supportedRegions !== undefined) updateSet.supportedRegions = data.supportedRegions;
  if (data.feeLevel !== undefined) updateSet.feeLevel = data.feeLevel;
  if (data.notes !== undefined) updateSet.notes = data.notes;

  await db.insert(exchangeFeatureSupport)
    .values(data)
    .onDuplicateKeyUpdate({ set: updateSet });
}

/** Delete a feature support record by exchangeSlug + featureSlug */
export async function deleteFeatureSupport(exchangeSlug: string, featureSlug: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const { and } = await import('drizzle-orm');
  await db.delete(exchangeFeatureSupport)
    .where(and(
      eq(exchangeFeatureSupport.exchangeSlug, exchangeSlug),
      eq(exchangeFeatureSupport.featureSlug, featureSlug)
    ));
}

// ─── Crypto Tools ─────────────────────────────────────────────────────────────

/** Get all active crypto tools, ordered by sortOrder */
export async function getCryptoTools(activeOnly = true): Promise<CryptoTool[]> {
  const db = await getDb();
  if (!db) return [];
  const { asc } = await import('drizzle-orm');
  // 如果表为空，自动插入种子数据（与 getCryptoNews 逻辑一致）
  const existing = await db.select({ id: cryptoTools.id }).from(cryptoTools).limit(1);
  if (existing.length === 0) {
    console.log('[Database] Seeding crypto_tools table with defaults...');
    await seedCryptoToolsIfEmpty();
  }
  if (activeOnly) {
    return db.select().from(cryptoTools)
      .where(eq(cryptoTools.isActive, true))
      .orderBy(asc(cryptoTools.sortOrder), asc(cryptoTools.id));
  }
  return db.select().from(cryptoTools)
    .orderBy(asc(cryptoTools.sortOrder), asc(cryptoTools.id));
}

/** Get all crypto tools (admin) */
export async function getAllCryptoTools(): Promise<CryptoTool[]> {
  return getCryptoTools(false);
}

/** Upsert a crypto tool */
export async function upsertCryptoTool(data: InsertCryptoTool): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  if (data.id) {
    await db.update(cryptoTools)
      .set({ ...data, createdAt: undefined })
      .where(eq(cryptoTools.id, data.id));
  } else {
    await db.insert(cryptoTools).values(data);
  }
}

/** Delete a crypto tool by id */
export async function deleteCryptoTool(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.delete(cryptoTools).where(eq(cryptoTools.id, id));
}

/** Seed default crypto tools if table is empty */
export async function seedCryptoToolsIfEmpty(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const defaults: InsertCryptoTool[] = [
    { name: "CoinGecko 行情", nameEn: "CoinGecko", description: "全球最大加密货币数据平台，实时价格、市值、交易量，支持数千种代币", descriptionEn: "World's largest crypto data platform with real-time prices, market cap, and volume for thousands of tokens", category: "price", source: "CoinGecko", url: "https://www.coingecko.com", icon: "🦎", tags: "价格,市值,新手", difficulty: "beginner", sortOrder: 1, isActive: true },
    { name: "CoinMarketCap", nameEn: "CoinMarketCap", description: "加密货币市场数据权威平台，提供价格、排名、DeFi、NFT 等全方位数据", descriptionEn: "Leading crypto market data platform with prices, rankings, DeFi and NFT data", category: "price", source: "CoinMarketCap", url: "https://coinmarketcap.com", icon: "📊", tags: "价格,排名,新手", difficulty: "beginner", sortOrder: 2, isActive: true },
    { name: "TradingView 图表", nameEn: "TradingView", description: "专业 K 线图表工具，支持技术指标、画线工具，是交易者必备的图表分析平台", descriptionEn: "Professional charting tool with technical indicators and drawing tools, essential for traders", category: "chart", source: "TradingView", url: "https://www.tradingview.com", icon: "📈", tags: "K线,技术分析,进阶", difficulty: "intermediate", sortOrder: 3, isActive: true },
    { name: "Etherscan 区块浏览器", nameEn: "Etherscan", description: "以太坊区块链浏览器，查询交易记录、钱包余额、智能合约，链上数据透明可查", descriptionEn: "Ethereum blockchain explorer to check transactions, wallet balances, and smart contracts", category: "onchain", source: "Etherscan", url: "https://etherscan.io", icon: "🔍", tags: "链上,以太坊,新手", difficulty: "beginner", sortOrder: 4, isActive: true },
    { name: "DeFiLlama TVL 追踪", nameEn: "DeFiLlama", description: "追踪所有 DeFi 协议的 TVL（总锁仓量），了解 DeFi 生态资金流向和协议排名", descriptionEn: "Track TVL across all DeFi protocols to understand capital flows and protocol rankings", category: "defi", source: "DeFiLlama", url: "https://defillama.com", icon: "🦙", tags: "DeFi,TVL,进阶", difficulty: "intermediate", sortOrder: 5, isActive: true },
    { name: "Dune Analytics 数据分析", nameEn: "Dune Analytics", description: "链上数据查询和可视化平台，可自定义 SQL 查询区块链数据，适合深度研究者", descriptionEn: "On-chain data query and visualization platform with custom SQL queries for blockchain data", category: "onchain", source: "Dune Analytics", url: "https://dune.com", icon: "🔮", tags: "链上,数据分析,高级", difficulty: "advanced", sortOrder: 6, isActive: true },
    { name: "Nansen 智能钱包追踪", nameEn: "Nansen", description: "追踪聪明钱包（Smart Money）的链上行为，发现早期机会和市场趋势", descriptionEn: "Track smart money on-chain behavior to discover early opportunities and market trends", category: "onchain", source: "Nansen", url: "https://www.nansen.ai", icon: "🧠", tags: "聪明钱包,链上,高级", difficulty: "advanced", sortOrder: 7, isActive: true },
    { name: "Fear & Greed Index 恐贪指数", nameEn: "Fear & Greed Index", description: "比特币市场情绪指数，0-100 分衡量市场恐惧与贪婪程度，辅助判断市场顶底", descriptionEn: "Bitcoin market sentiment index from 0-100 measuring fear and greed to help identify market tops and bottoms", category: "general", source: "Alternative.me", url: "https://alternative.me/crypto/fear-and-greed-index/", icon: "😱", tags: "情绪,市场,新手", difficulty: "beginner", sortOrder: 8, isActive: true },
    { name: "Glassnode 链上指标", nameEn: "Glassnode", description: "专业链上数据分析平台，提供比特币/以太坊持仓分布、矿工行为等高级指标", descriptionEn: "Professional on-chain analytics with BTC/ETH holder distribution, miner behavior, and advanced metrics", category: "onchain", source: "Glassnode", url: "https://glassnode.com", icon: "🔬", tags: "链上,比特币,高级", difficulty: "advanced", sortOrder: 9, isActive: true },
    { name: "Messari 研究报告", nameEn: "Messari", description: "加密货币研究和数据平台，提供项目分析报告、代币经济学研究，适合深度投研", descriptionEn: "Crypto research and data platform with project analysis, tokenomics research for deep investment research", category: "general", source: "Messari", url: "https://messari.io", icon: "📋", tags: "研究,报告,进阶", difficulty: "intermediate", sortOrder: 10, isActive: true },
    { name: "Gas 费用追踪", nameEn: "ETH Gas Tracker", description: "实时追踪以太坊 Gas 费用，选择最优时机发送交易，节省手续费", descriptionEn: "Real-time Ethereum gas fee tracker to choose optimal timing for transactions and save on fees", category: "defi", source: "Etherscan", url: "https://etherscan.io/gastracker", icon: "⛽", tags: "Gas,以太坊,新手", difficulty: "beginner", sortOrder: 11, isActive: true },
    { name: "Crypto.com 税务计算", nameEn: "Koinly Tax Calculator", description: "加密货币税务计算工具，自动整合交易记录，生成合规税务报告", descriptionEn: "Crypto tax calculator that automatically aggregates trading records and generates compliant tax reports", category: "tax", source: "Koinly", url: "https://koinly.io", icon: "🧾", tags: "税务,合规,进阶", difficulty: "intermediate", sortOrder: 12, isActive: true },
    { name: "金十数据", nameEn: "Jin10 Data", description: "国内最快的财经资讯平台，提供加密货币、外汇、股市实时快讯，7×24 小时不间断推送市场重要消息", descriptionEn: "China's fastest financial news platform with real-time crypto, forex, and stock market alerts 24/7", category: "news", source: "Jin10", url: "https://www.jin10.com", icon: "⚡", tags: "资讯,快讯,新手", difficulty: "beginner", sortOrder: 13, isActive: true },
    { name: "律动 BlockBeats", nameEn: "BlockBeats", description: "专注 Web3 的中文资讯媒体，深度报道 DeFi、NFT、公链生态，提供行业研究与项目分析", descriptionEn: "Web3-focused Chinese media with in-depth coverage of DeFi, NFT, and blockchain ecosystems", category: "news", source: "BlockBeats", url: "https://www.theblockbeats.info", icon: "🎵", tags: "资讯,Web3,进阶", difficulty: "intermediate", sortOrder: 14, isActive: true },
    { name: "CoinGlass 合约数据", nameEn: "CoinGlass", description: "专业加密货币衍生品数据平台，提供爆仓数据、资金费率、持仓量、多空比等合约核心指标", descriptionEn: "Professional crypto derivatives data platform with liquidations, funding rates, open interest, and long/short ratios", category: "chart", source: "CoinGlass", url: "https://www.coinglass.com", icon: "🔮", tags: "合约,爆仓,进阶", difficulty: "intermediate", sortOrder: 15, isActive: true },
    { name: "AICoin 行情终端", nameEn: "AICoin", description: "面向中文用户的行情与预警工具，适合盯盘、看异动和接收价格提醒。", descriptionEn: "Chinese-friendly price terminal with alerts, anomaly tracking, and market monitoring.", category: "price", source: "AICoin", url: "https://www.aicoin.com", icon: "📈", tags: "行情,预警,直连", difficulty: "beginner", needVpn: false, sortOrder: 16, isActive: true },
    { name: "OKLink 链上浏览器", nameEn: "OKLink", description: "多链浏览器与地址分析工具，适合查转账、地址标签和链上行为。", descriptionEn: "Multi-chain explorer and address analysis tool for transfers, labels, and on-chain behavior.", category: "onchain", source: "OKLink", url: "https://www.oklink.com", icon: "🔎", tags: "多链,浏览器,直连", difficulty: "beginner", needVpn: false, sortOrder: 17, isActive: true },
    { name: "非小号 市场数据", nameEn: "Feixiaohao", description: "中文加密市场数据站，适合看项目排名、交易所信息和基础资料。", descriptionEn: "Chinese crypto market data site for rankings, exchange info, and project basics.", category: "price", source: "Feixiaohao", url: "https://www.feixiaohao.com", icon: "🧭", tags: "排名,项目,直连", difficulty: "beginner", needVpn: false, sortOrder: 18, isActive: true },
    { name: "TokenInsight 研究与评级", nameEn: "TokenInsight", description: "提供项目研究、交易所评级和市场数据，适合做基础研究。", descriptionEn: "Research, exchange ratings, and market data for initial project due diligence.", category: "general", source: "TokenInsight", url: "https://tokeninsight.com", icon: "📚", tags: "研究,评级,直连", difficulty: "intermediate", needVpn: false, sortOrder: 19, isActive: true },
    { name: "RootData 项目数据库", nameEn: "RootData", description: "面向投研的项目数据库，适合查融资、团队、赛道和项目关系。", descriptionEn: "Project database for research, funding rounds, teams, sectors, and ecosystem relationships.", category: "general", source: "RootData", url: "https://www.rootdata.com", icon: "🗂️", tags: "项目库,投研,直连", difficulty: "intermediate", needVpn: false, sortOrder: 20, isActive: true },
    { name: "SoSoValue 市场面板", nameEn: "SoSoValue", description: "中文友好的市场概览和板块热度面板，适合快速看资金流向和热点轮动。", descriptionEn: "Chinese-friendly market dashboard for flows, sector heat, and rotation tracking.", category: "general", source: "SoSoValue", url: "https://www.sosovalue.com", icon: "🧠", tags: "面板,热点,直连", difficulty: "beginner", needVpn: false, sortOrder: 21, isActive: true },
  ];

  // 使用 upsert 逻辑：按 name 查找，不存在则插入，确保新增工具能自动同步到已有数据库
  const existingNames = new Set(
    (await db.select({ name: cryptoTools.name }).from(cryptoTools)).map((r: { name: string }) => r.name)
  );
  const toInsert = defaults.filter(d => !existingNames.has(d.name));
  if (toInsert.length > 0) {
    await db.insert(cryptoTools).values(toInsert);
    console.log(`[Database] Seeded ${toInsert.length} new crypto tools`);
  }
}

// ─── System Settings ─────────────────────────────────────────────────────────

export async function getSystemSetting(key: string, defaultValue: string = "true"): Promise<string> {
  const db = await getDb();
  if (!db) return defaultValue;
  try {
    const rows = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
    if (rows.length === 0) return defaultValue;
    return rows[0].value;
  } catch {
    return defaultValue;
  }
}

export async function setSystemSetting(key: string, value: string, description?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ id: systemSettings.id }).from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
  if (existing.length > 0) {
    await db.update(systemSettings).set({ value }).where(eq(systemSettings.key, key));
  } else {
    await db.insert(systemSettings).values({ key, value, description: description ?? null });
  }
}

export async function getAllSystemSettings(): Promise<Array<{ key: string; value: string; description: string | null; updatedAt: Date }>> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(systemSettings).orderBy(systemSettings.key);
}


// ─── Media Platforms Seed ──────────────────────────────────────────────────────

/**
 * 所有平台的默认配置。
 * 新增平台时在此数组中追加一条记录即可，启动时会自动写入数据库。
 * 注意：已存在的平台不会被覆盖（onDuplicateKeyUpdate 仅更新 name/icon，不覆盖用户配置）。
 */
const DEFAULT_MEDIA_PLATFORMS = [
  // ── 已完整实现 ──────────────────────────────────────────────────────────────
  {
    platform: "telegram",
    name: "Telegram",
    icon: "✈️",
    isEnabled: false,
    autoPublish: false,
    autoPublishNews: false,
    sensitiveStandard: "international",
  },
  // ── 中文社交媒体（占位，待接入）────────────────────────────────────────────
  {
    platform: "wechat",
    name: "微信公众号",
    icon: "💬",
    isEnabled: false,
    autoPublish: false,
    autoPublishNews: false,
    sensitiveStandard: "wechat",
  },
  {
    platform: "weibo",
    name: "微博",
    icon: "🌐",
    isEnabled: false,
    autoPublish: false,
    autoPublishNews: false,
    sensitiveStandard: "weibo",
  },
  {
    platform: "douyin",
    name: "抖音",
    icon: "🎵",
    isEnabled: false,
    autoPublish: false,
    autoPublishNews: false,
    sensitiveStandard: "douyin",
  },
  // ── 国际社交媒体（占位，待接入）────────────────────────────────────────────
  {
    platform: "twitter",
    name: "Twitter / X",
    icon: "🐦",
    isEnabled: false,
    autoPublish: false,
    autoPublishNews: false,
    sensitiveStandard: "international",
  },
  {
    platform: "discord",
    name: "Discord",
    icon: "🎮",
    isEnabled: false,
    autoPublish: false,
    autoPublishNews: false,
    sensitiveStandard: "international",
  },
  {
    platform: "slack",
    name: "Slack",
    icon: "💼",
    isEnabled: false,
    autoPublish: false,
    autoPublishNews: false,
    sensitiveStandard: "international",
  },
  {
    platform: "reddit",
    name: "Reddit",
    icon: "🤖",
    isEnabled: false,
    autoPublish: false,
    autoPublishNews: false,
    sensitiveStandard: "international",
  },
  {
    platform: "line",
    name: "LINE",
    icon: "💚",
    isEnabled: false,
    autoPublish: false,
    autoPublishNews: false,
    sensitiveStandard: "international",
  },
  {
    platform: "instagram",
    name: "Instagram",
    icon: "📸",
    isEnabled: false,
    autoPublish: false,
    autoPublishNews: false,
    sensitiveStandard: "international",
  },
  {
    platform: "facebook",
    name: "Facebook Page",
    icon: "👍",
    isEnabled: false,
    autoPublish: false,
    autoPublishNews: false,
    sensitiveStandard: "international",
  },
  {
    platform: "notion",
    name: "Notion",
    icon: "📝",
    isEnabled: false,
    autoPublish: false,
    autoPublishNews: false,
    sensitiveStandard: "general",
  },
] as const;

/**
 * 初始化媒体平台数据（如果数据库中不存在则插入，已存在则仅更新 name/icon）。
 * 在服务启动时调用，确保所有平台配置行都存在于数据库中。
 */
export async function seedMediaPlatformsIfEmpty(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    for (const p of DEFAULT_MEDIA_PLATFORMS) {
      await db
        .insert(mediaPlatforms)
        .values(p)
        .onDuplicateKeyUpdate({
          // 已存在的平台只更新显示名称和图标，不覆盖用户配置的 apiKey/channelId 等
          set: { name: p.name, icon: p.icon },
        });
    }
    console.log(`[Database] Media platforms seeded: ${DEFAULT_MEDIA_PLATFORMS.length} platforms ready`);
  } catch (error) {
    console.error("[Database] Failed to seed media platforms:", error);
  }
}
