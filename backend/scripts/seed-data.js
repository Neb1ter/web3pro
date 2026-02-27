/**
 * Strapi 示例数据录入脚本
 * 用法: node scripts/seed-data.js
 */
const BASE = 'http://localhost:1337';

async function login() {
  const res = await fetch(`${BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@get8.pro', password: 'Get8Pro@2026!' }),
  });
  const data = await res.json();
  return data?.data?.token;
}

async function create(token, endpoint, body) {
  const res = await fetch(`${BASE}/api/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ data: body }),
  });
  const data = await res.json();
  if (data?.data?.id) {
    console.log(`✅ Created ${endpoint} #${data.data.id}: ${body.name || body.title}`);
    return data.data.id;
  } else {
    console.log(`⚠️  ${endpoint}:`, JSON.stringify(data).slice(0, 200));
    return null;
  }
}

async function publish(token, endpoint, id) {
  const res = await fetch(`${BASE}/api/${endpoint}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ data: { publishedAt: new Date().toISOString() } }),
  });
  const data = await res.json();
  if (data?.data?.id) {
    console.log(`📢 Published ${endpoint} #${id}`);
  }
}

async function main() {
  // 获取管理员 token（使用 admin API token）
  const adminRes = await fetch(`${BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@get8.pro', password: 'Get8Pro@2026!' }),
  });
  const adminData = await adminRes.json();
  const adminToken = adminData?.data?.token;

  if (!adminToken) {
    console.log('❌ 登录失败，请检查账号密码');
    console.log(JSON.stringify(adminData));
    return;
  }
  console.log('🔑 登录成功');

  // 创建交易所评测
  const exchanges = [
    {
      name: '币安 Binance',
      slug: 'binance',
      logo_url: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png',
      website_url: 'https://www.binance.com',
      overall_rating: 4.8,
      fee_rating: 4.5,
      security_rating: 4.9,
      liquidity_rating: 5.0,
      beginner_friendly: true,
      spot_trading: true,
      futures_trading: true,
      copy_trading: true,
      staking: true,
      maker_fee: 0.1,
      taker_fee: 0.1,
      futures_fee: 0.02,
      max_rebate_percent: 20,
      supported_countries: 'Global (except US)',
      kyc_required: true,
      description_zh: '全球最大加密货币交易所，交易量第一，产品线最全，适合所有级别用户。',
      description_en: 'The world\'s largest crypto exchange by trading volume, offering spot, futures, staking and more.',
      pros_zh: '流动性最强,手续费低,产品丰富,安全可靠',
      cons_zh: '部分国家受限,KYC严格',
      pros_en: 'Best liquidity,Low fees,Wide product range,Strong security',
      cons_en: 'Restricted in some countries,Strict KYC',
      status: 'active',
      is_featured: true,
      sort_order: 1,
    },
    {
      name: 'OKX',
      slug: 'okx',
      logo_url: 'https://cryptologos.cc/logos/okb-okb-logo.png',
      website_url: 'https://www.okx.com',
      overall_rating: 4.6,
      fee_rating: 4.6,
      security_rating: 4.7,
      liquidity_rating: 4.8,
      beginner_friendly: true,
      spot_trading: true,
      futures_trading: true,
      copy_trading: true,
      staking: true,
      maker_fee: 0.08,
      taker_fee: 0.1,
      futures_fee: 0.02,
      max_rebate_percent: 30,
      supported_countries: 'Global (except US)',
      kyc_required: true,
      description_zh: '全球前三大交易所，合约交易功能强大，Web3钱包生态完善，返佣比例业内最高。',
      description_en: 'Top 3 global exchange with powerful derivatives trading and the best Web3 wallet ecosystem.',
      pros_zh: '返佣比例高,合约功能强,Web3生态好',
      cons_zh: '界面较复杂,新手需要学习',
      pros_en: 'High rebate rate,Strong futures,Great Web3 ecosystem',
      cons_en: 'Complex UI,Learning curve for beginners',
      status: 'active',
      is_featured: true,
      sort_order: 2,
    },
    {
      name: 'Bybit',
      slug: 'bybit',
      logo_url: 'https://cryptologos.cc/logos/bybit-logo.png',
      website_url: 'https://www.bybit.com',
      overall_rating: 4.5,
      fee_rating: 4.7,
      security_rating: 4.6,
      liquidity_rating: 4.6,
      beginner_friendly: true,
      spot_trading: true,
      futures_trading: true,
      copy_trading: true,
      staking: false,
      maker_fee: 0.1,
      taker_fee: 0.1,
      futures_fee: 0.01,
      max_rebate_percent: 30,
      supported_countries: 'Global (except US)',
      kyc_required: false,
      description_zh: '合约交易专业平台，无需KYC即可交易，手续费极低，跟单交易功能出色。',
      description_en: 'Professional derivatives exchange with no-KYC trading, ultra-low fees and excellent copy trading.',
      pros_zh: '无需KYC,合约手续费极低,跟单功能强',
      cons_zh: '现货流动性略逊于币安',
      pros_en: 'No KYC required,Ultra-low futures fees,Great copy trading',
      cons_en: 'Spot liquidity slightly lower than Binance',
      status: 'active',
      is_featured: true,
      sort_order: 3,
    },
  ];

  const exchangeIds = {};
  for (const ex of exchanges) {
    const id = await create(adminToken, 'exchange-reviews', ex);
    if (id) {
      exchangeIds[ex.slug] = id;
      await publish(adminToken, 'exchange-reviews', id);
    }
  }

  // 创建返佣链接（关联交易所）
  const rebateLinks = [
    {
      exchange_name: '币安 Binance',
      exchange_slug: 'binance',
      link_type: 'spot',
      referral_code: 'GET8PRO',
      referral_url: 'https://www.binance.com/zh-CN/register?ref=GET8PRO',
      rebate_percent: 20,
      rebate_description_zh: '通过此链接注册，永久享受20%手续费返佣，直接抵扣交易费用。',
      rebate_description_en: 'Register via this link for a permanent 20% fee rebate on all spot trades.',
      is_exclusive: true,
      is_active: true,
      sort_order: 1,
      exchange_review: exchangeIds['binance'],
    },
    {
      exchange_name: '币安 Binance',
      exchange_slug: 'binance',
      link_type: 'futures',
      referral_code: 'GET8PRO',
      referral_url: 'https://www.binance.com/zh-CN/futures/ref/GET8PRO',
      rebate_percent: 10,
      rebate_description_zh: '合约专属返佣链接，享受10%手续费减免。',
      rebate_description_en: 'Exclusive futures rebate link with 10% fee discount.',
      is_exclusive: false,
      is_active: true,
      sort_order: 2,
      exchange_review: exchangeIds['binance'],
    },
    {
      exchange_name: 'OKX',
      exchange_slug: 'okx',
      link_type: 'spot',
      referral_code: 'GET8',
      referral_url: 'https://www.okx.com/join/GET8',
      rebate_percent: 30,
      rebate_description_zh: '业内最高30%返佣，注册即享，永久有效，无需任何条件。',
      rebate_description_en: 'Industry-leading 30% rebate, permanent and unconditional after registration.',
      is_exclusive: true,
      is_active: true,
      sort_order: 3,
      exchange_review: exchangeIds['okx'],
    },
    {
      exchange_name: 'OKX',
      exchange_slug: 'okx',
      link_type: 'futures',
      referral_code: 'GET8',
      referral_url: 'https://www.okx.com/join/GET8?type=futures',
      rebate_percent: 20,
      rebate_description_zh: 'OKX合约交易返佣20%，适合高频合约交易者。',
      rebate_description_en: '20% rebate for OKX futures trading, ideal for active traders.',
      is_exclusive: false,
      is_active: true,
      sort_order: 4,
      exchange_review: exchangeIds['okx'],
    },
    {
      exchange_name: 'Bybit',
      exchange_slug: 'bybit',
      link_type: 'spot',
      referral_code: 'GET8BYBIT',
      referral_url: 'https://www.bybit.com/invite?ref=GET8BYBIT',
      rebate_percent: 30,
      rebate_description_zh: 'Bybit注册返佣30%，合约手续费极低，适合专业交易者。',
      rebate_description_en: '30% rebate on Bybit, ultra-low futures fees for professional traders.',
      is_exclusive: true,
      is_active: true,
      sort_order: 5,
      exchange_review: exchangeIds['bybit'],
    },
  ];

  for (const link of rebateLinks) {
    const id = await create(adminToken, 'rebate-links', link);
    if (id) await publish(adminToken, 'rebate-links', id);
  }

  // 创建 Web3 教程
  const tutorials = [
    {
      title_zh: '什么是Web3？从零开始了解去中心化互联网',
      title_en: 'What is Web3? A Beginner\'s Guide to the Decentralized Internet',
      slug: 'what-is-web3',
      category: 'beginner',
      difficulty: 'beginner',
      read_time_minutes: 8,
      summary_zh: '本文将带你从零开始了解Web3的核心概念，包括区块链、去中心化、数字钱包等基础知识。',
      summary_en: 'This guide covers the core concepts of Web3 from scratch, including blockchain, decentralization, and digital wallets.',
      content_zh: '## 什么是Web3？\n\nWeb3是互联网的第三个发展阶段...',
      content_en: '## What is Web3?\n\nWeb3 represents the third evolution of the internet...',
      tags: 'web3,blockchain,beginner,crypto',
      is_featured: true,
      sort_order: 1,
      status: 'published',
    },
    {
      title_zh: '如何注册交易所并获得最高返佣？完整操作指南',
      title_en: 'How to Register on Crypto Exchanges & Get Maximum Rebates',
      slug: 'how-to-register-exchange-get-rebates',
      category: 'exchange',
      difficulty: 'beginner',
      read_time_minutes: 10,
      summary_zh: '手把手教你注册主流交易所，通过专属邀请链接获得最高返佣，每笔交易都能省钱。',
      summary_en: 'Step-by-step guide to registering on major exchanges and maximizing your rebates through referral links.',
      content_zh: '## 为什么要用邀请链接注册？\n\n使用专属邀请链接注册交易所...',
      content_en: '## Why Use Referral Links?\n\nUsing exclusive referral links when registering...',
      tags: 'exchange,rebate,binance,okx,tutorial',
      is_featured: true,
      sort_order: 2,
      status: 'published',
    },
    {
      title_zh: '币安完全使用指南：从注册到高级功能',
      title_en: 'Complete Binance Guide: From Registration to Advanced Features',
      slug: 'binance-complete-guide',
      category: 'exchange',
      difficulty: 'intermediate',
      read_time_minutes: 15,
      summary_zh: '全面介绍币安交易所的所有功能，包括现货交易、合约交易、理财、NFT等。',
      summary_en: 'Comprehensive guide to all Binance features including spot, futures, earn, and NFT.',
      content_zh: '## 币安简介\n\n币安是全球最大的加密货币交易所...',
      content_en: '## About Binance\n\nBinance is the world\'s largest cryptocurrency exchange...',
      tags: 'binance,exchange,tutorial,spot,futures',
      is_featured: false,
      sort_order: 3,
      status: 'published',
    },
  ];

  for (const tutorial of tutorials) {
    const id = await create(adminToken, 'web3-tutorials', tutorial);
    if (id) await publish(adminToken, 'web3-tutorials', id);
  }

  console.log('\n🎉 所有示例数据录入完成！');
  console.log('📊 API 测试：');
  console.log('  交易所评测: http://localhost:1337/api/exchange-reviews?populate=rebate_links');
  console.log('  返佣链接:   http://localhost:1337/api/rebate-links?populate=exchange_review');
  console.log('  Web3教程:   http://localhost:1337/api/web3-tutorials');
}

main().catch(console.error);
