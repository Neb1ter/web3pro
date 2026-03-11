import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';

interface SeoManagerProps {
  title: string;
  description: string;
  path: string;
  keywords?: string;
}

const BASE_URL = 'https://get8.pro';

export function SeoManager({ title, description, path, keywords }: SeoManagerProps) {
  const { language } = useLanguage();
  const canonicalUrl = `${BASE_URL}${path}`;

  const defaultKeywords = 'Web3教程,交易所返佣,币圈入门,币安返佣,OKX返佣,加密货币,区块链,DeFi';

  return (
    <Helmet>
      <html lang={language === 'zh' ? 'zh-CN' : 'en'} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* hreflang for GEO optimization */}
      <link rel="alternate" hrefLang="zh-CN" href={`${BASE_URL}/zh-CN${path}`} />
      <link rel="alternate" hrefLang="en" href={`${BASE_URL}/en${path}`} />
      <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}/en${path}`} />

      {/* Open Graph (for social sharing) */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={language === 'zh' ? 'zh_CN' : 'en_US'} />
      <meta property="og:site_name" content="Get8 Pro" />
      <meta property="og:image" content={`${BASE_URL}/og-image.png`} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />

      {/* AI-specific GEO tags */}
      <meta name="geo.region" content="CN,US,GB,CA,AU,JP,KR,SG" />
      <meta name="geo.placename" content="Global" />
      <meta name="geo.position" content="0;0" />
    </Helmet>
  );
}
