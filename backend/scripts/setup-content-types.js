/**
 * Strapi 内容模型自动化创建脚本
 * 为 get8.pro 创建三个核心内容类型：
 * 1. web3-tutorial (Web3教程)
 * 2. exchange-review (交易所评测)
 * 3. rebate-link (返佣链接)
 */

const http = require('http');

const BASE_URL = 'http://localhost:1337';
const ADMIN_EMAIL = 'admin@get8.pro';
const ADMIN_PASSWORD = 'Get8Pro@2026!';

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 1337,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseData) });
        } catch {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // 1. 登录获取 token
  console.log('🔑 正在登录 Strapi...');
  const loginRes = await request('POST', '/admin/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  const token = loginRes.data.data?.token;
  if (!token) {
    console.error('❌ 登录失败:', JSON.stringify(loginRes.data));
    process.exit(1);
  }
  console.log('✅ 登录成功\n');

  // 2. 创建 Web3教程 内容类型
  console.log('📚 创建内容类型: Web3 Tutorial (Web3教程)...');
  const tutorialRes = await request('POST', '/api/content-type-builder/content-types', {
    contentType: {
      displayName: 'Web3 Tutorial',
      singularName: 'web3-tutorial',
      pluralName: 'web3-tutorials',
      description: 'Web3科普教程文章，包含区块链基础、DeFi、NFT等主题',
      kind: 'collectionType',
      draftAndPublish: true,
      pluginOptions: {},
      attributes: {
        title: {
          type: 'string',
          required: true,
          maxLength: 200,
          pluginOptions: {},
        },
        slug: {
          type: 'uid',
          targetField: 'title',
          required: true,
          pluginOptions: {},
        },
        summary: {
          type: 'text',
          maxLength: 500,
          pluginOptions: {},
        },
        content: {
          type: 'richtext',
          required: true,
          pluginOptions: {},
        },
        cover_image: {
          type: 'media',
          multiple: false,
          required: false,
          allowedTypes: ['images'],
          pluginOptions: {},
        },
        category: {
          type: 'enumeration',
          enum: ['基础入门', 'DeFi', 'NFT', '交易所', 'Web3钱包', '区块链技术', '市场分析'],
          default: '基础入门',
          pluginOptions: {},
        },
        difficulty: {
          type: 'enumeration',
          enum: ['入门', '进阶', '高级'],
          default: '入门',
          pluginOptions: {},
        },
        read_time: {
          type: 'integer',
          min: 1,
          max: 60,
          pluginOptions: {},
        },
        is_featured: {
          type: 'boolean',
          default: false,
          pluginOptions: {},
        },
        view_count: {
          type: 'integer',
          default: 0,
          pluginOptions: {},
        },
      },
    },
  }, token);
  
  if (tutorialRes.status === 201) {
    console.log('✅ Web3 Tutorial 创建成功');
  } else {
    console.log('⚠️  Web3 Tutorial 状态:', tutorialRes.status, JSON.stringify(tutorialRes.data).slice(0, 200));
  }

  // 等待 Strapi 重启（内容类型创建后会自动重启）
  console.log('⏳ 等待 Strapi 重启 (15秒)...');
  await new Promise(r => setTimeout(r, 15000));

  // 重新登录
  console.log('🔑 重新登录...');
  const loginRes2 = await request('POST', '/admin/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  const token2 = loginRes2.data.data?.token;
  if (!token2) {
    console.error('❌ 重新登录失败');
    process.exit(1);
  }
  console.log('✅ 重新登录成功\n');

  // 3. 创建 交易所评测 内容类型
  console.log('🏦 创建内容类型: Exchange Review (交易所评测)...');
  const exchangeRes = await request('POST', '/api/content-type-builder/content-types', {
    contentType: {
      displayName: 'Exchange Review',
      singularName: 'exchange-review',
      pluralName: 'exchange-reviews',
      description: '主流加密货币交易所的详细评测，包含费率、安全性、返佣信息',
      kind: 'collectionType',
      draftAndPublish: true,
      pluginOptions: {},
      attributes: {
        name: {
          type: 'string',
          required: true,
          maxLength: 100,
          pluginOptions: {},
        },
        name_en: {
          type: 'string',
          required: true,
          maxLength: 100,
          pluginOptions: {},
        },
        logo: {
          type: 'media',
          multiple: false,
          required: false,
          allowedTypes: ['images'],
          pluginOptions: {},
        },
        rating: {
          type: 'decimal',
          min: 0,
          max: 5,
          pluginOptions: {},
        },
        pros: {
          type: 'text',
          pluginOptions: {},
        },
        cons: {
          type: 'text',
          pluginOptions: {},
        },
        description: {
          type: 'richtext',
          pluginOptions: {},
        },
        rebate_rate: {
          type: 'string',
          maxLength: 50,
          pluginOptions: {},
        },
        rebate_link: {
          type: 'string',
          maxLength: 500,
          pluginOptions: {},
        },
        official_website: {
          type: 'string',
          maxLength: 500,
          pluginOptions: {},
        },
        trading_fee: {
          type: 'string',
          maxLength: 100,
          pluginOptions: {},
        },
        supported_countries: {
          type: 'text',
          pluginOptions: {},
        },
        is_recommended: {
          type: 'boolean',
          default: false,
          pluginOptions: {},
        },
        sort_order: {
          type: 'integer',
          default: 0,
          pluginOptions: {},
        },
      },
    },
  }, token2);

  if (exchangeRes.status === 201) {
    console.log('✅ Exchange Review 创建成功');
  } else {
    console.log('⚠️  Exchange Review 状态:', exchangeRes.status, JSON.stringify(exchangeRes.data).slice(0, 200));
  }

  // 等待重启
  console.log('⏳ 等待 Strapi 重启 (15秒)...');
  await new Promise(r => setTimeout(r, 15000));

  // 重新登录
  const loginRes3 = await request('POST', '/admin/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  const token3 = loginRes3.data.data?.token;
  console.log('✅ 重新登录成功\n');

  // 4. 创建 返佣链接 内容类型
  console.log('💰 创建内容类型: Rebate Link (返佣链接)...');
  const rebateRes = await request('POST', '/api/content-type-builder/content-types', {
    contentType: {
      displayName: 'Rebate Link',
      singularName: 'rebate-link',
      pluralName: 'rebate-links',
      description: '交易所返佣推广链接管理，包含返佣比例、有效期等信息',
      kind: 'collectionType',
      draftAndPublish: true,
      pluginOptions: {},
      attributes: {
        exchange_name: {
          type: 'string',
          required: true,
          maxLength: 100,
          pluginOptions: {},
        },
        link_type: {
          type: 'enumeration',
          enum: ['注册返佣', '充值返佣', '交易返佣', '专属优惠'],
          default: '注册返佣',
          pluginOptions: {},
        },
        rebate_url: {
          type: 'string',
          required: true,
          maxLength: 1000,
          pluginOptions: {},
        },
        rebate_percentage: {
          type: 'string',
          maxLength: 50,
          pluginOptions: {},
        },
        description: {
          type: 'text',
          maxLength: 500,
          pluginOptions: {},
        },
        is_active: {
          type: 'boolean',
          default: true,
          pluginOptions: {},
        },
        expires_at: {
          type: 'date',
          pluginOptions: {},
        },
        click_count: {
          type: 'integer',
          default: 0,
          pluginOptions: {},
        },
        sort_order: {
          type: 'integer',
          default: 0,
          pluginOptions: {},
        },
      },
    },
  }, token3);

  if (rebateRes.status === 201) {
    console.log('✅ Rebate Link 创建成功');
  } else {
    console.log('⚠️  Rebate Link 状态:', rebateRes.status, JSON.stringify(rebateRes.data).slice(0, 200));
  }

  console.log('\n⏳ 等待最终重启 (15秒)...');
  await new Promise(r => setTimeout(r, 15000));
  console.log('\n🎉 所有内容类型创建完成！');
  console.log('📌 请访问 http://localhost:1337/admin 查看结果');
}

main().catch(console.error);
