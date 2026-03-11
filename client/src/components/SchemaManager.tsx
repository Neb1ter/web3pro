import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';

const BASE_URL = 'https://get8.pro';

// 定义 Organization 结构化数据
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Get8 Pro',
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'mailto:muzi2629265049@gmail.com',
    contactType: 'customer support',
  },
  sameAs: [
    // 在这里添加社交媒体链接
  ],
};

// 定义 WebSite 结构化数据
const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  url: BASE_URL,
  name: 'Get8 Pro',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${BASE_URL}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

// 定义 Service 结构化数据（针对返佣服务）
const serviceSchema = (language: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: language === 'zh' ? '交易所返佣服务' : 'Exchange Rebate Service',
  provider: {
    '@type': 'Organization',
    name: 'Get8 Pro',
  },
  areaServed: {
    '@type': 'Country',
    name: 'Global',
  },
  description: language === 'zh' ? '通过 Get8 Pro 官方合作的专属邀请码，永久降低主流交易所（币安、OKX、Gate.io 等）的交易手续费。' : 'Permanently reduce trading fees on major exchanges like Binance, OKX, and Gate.io with exclusive, officially partnered referral codes from Get8 Pro.',
  name: language === 'zh' ? '加密货币交易所手续费返佣' : 'Cryptocurrency Exchange Fee Rebates',
});

// 定义 FAQPage 结构化数据
const faqSchema = (language: string) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: language === 'zh' ? '什么是交易所返佣？' : 'What are exchange rebates?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: language === 'zh' ? '交易所返佣是平台将一部分交易手续费返还给用户或推广者的激励机制。通过使用特定的邀请码注册，您可以永久性地降低每笔交易的成本。' : 'Exchange rebates are an incentive mechanism where the platform returns a portion of the trading fees to users or promoters. By registering with a specific referral code, you can permanently reduce the cost of every trade.',
      },
    },
    {
      '@type': 'Question',
      name: language === 'zh' ? '使用返佣码安全吗？' : 'Is it safe to use a rebate code?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: language === 'zh' ? '非常安全。返佣是通过交易所官方后台实现的，只影响您的费率设置，不涉及账户权限或资金安全。Get8 Pro 提供的都是官方合作渠道。' : 'Yes, it is very safe. Rebates are handled through the exchange\'s official backend system. It only affects your fee rate and does not involve your account permissions or fund security. All channels provided by Get8 Pro are official partnerships.',
      },
    },
  ],
});

export function SchemaManager() {
  const { language } = useLanguage();

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(webSiteSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(serviceSchema(language))}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(faqSchema(language))}
      </script>
    </Helmet>
  );
}
