import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';

const BASE_URL = 'https://get8.pro';

export function SchemaManager() {
  const { language } = useLanguage();
  const inLanguage = language === 'zh' ? 'zh-CN' : 'en';

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Get8 Pro',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    email: 'contact@get8.pro',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'contact@get8.pro',
      contactType: 'customer support',
      availableLanguage: ['Chinese', 'English'],
    },
    sameAs: ['https://discord.gg/wgvetpH6Un'],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Get8 Pro',
    url: BASE_URL,
    inLanguage: ['zh-CN', 'en'],
    publisher: {
      '@type': 'Organization',
      name: 'Get8 Pro',
      url: BASE_URL,
    },
  };

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: language === 'zh' ? '加密货币交易所返佣与导航服务' : 'Crypto Exchange Rebate and Navigation Service',
    serviceType: language === 'zh' ? '交易所返佣服务' : 'Exchange rebate service',
    inLanguage,
    provider: {
      '@type': 'Organization',
      name: 'Get8 Pro',
      url: BASE_URL,
    },
    areaServed: 'Global',
    description:
      language === 'zh'
        ? 'Get8 Pro 提供交易所对比、返佣信息、Web3 教育内容和工具导航，帮助用户降低交易成本。'
        : 'Get8 Pro provides exchange comparison, rebate information, Web3 education, and tools to help users lower trading costs.',
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage,
    mainEntity: [
      {
        '@type': 'Question',
        name: language === 'zh' ? 'Get8 Pro 提供什么内容？' : 'What does Get8 Pro provide?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            language === 'zh'
              ? 'Get8 Pro 提供交易所对比、返佣指南、Web3 教学内容和交易工具。'
              : 'Get8 Pro provides exchange comparison, rebate guides, Web3 education, and trading tools.',
        },
      },
      {
        '@type': 'Question',
        name: language === 'zh' ? '返佣信息如何使用？' : 'How can rebate information be used?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            language === 'zh'
              ? '用户可以通过站内整理的官方合作信息了解不同交易所的费率、返佣和下载入口，再根据自己的需求选择。'
              : 'Users can compare official partner information, fee rates, rebate details, and download entry points before choosing an exchange.',
        },
      },
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
    </Helmet>
  );
}
