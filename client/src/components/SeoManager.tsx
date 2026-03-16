import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';

interface SeoManagerProps {
  title: string;
  description: string;
  path: string;
  keywords?: string;
  image?: string;
  type?: 'website' | 'article';
}

const BASE_URL = 'https://get8.pro';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

export function SeoManager({
  title,
  description,
  path,
  keywords,
  image = DEFAULT_IMAGE,
  type = 'website',
}: SeoManagerProps) {
  const { language } = useLanguage();
  const canonicalUrl = `${BASE_URL}${path}`;
  const pageLang = language === 'zh' ? 'zh-CN' : 'en';
  const ogLocale = language === 'zh' ? 'zh_CN' : 'en_US';
  const defaultKeywords =
    'Get8 Pro,Web3,crypto exchange rebates,exchange comparison,trading tools,Web3 education,Binance,OKX,Gate.io,Bybit,Bitget';

  return (
    <Helmet prioritizeSeoTags>
      <html lang={pageLang} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      <meta
        name="robots"
        content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
      />
      <meta
        name="googlebot"
        content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
      />
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="zh-CN" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="Get8 Pro" />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={title} />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:locale:alternate" content={language === 'zh' ? 'en_US' : 'zh_CN'} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:url" content={canonicalUrl} />

      <meta name="geo.region" content="CN,US,GB,CA,AU,JP,KR,SG" />
      <meta name="geo.placename" content="Global" />
      <meta name="llms" content={`${BASE_URL}/llms.txt`} />
    </Helmet>
  );
}
