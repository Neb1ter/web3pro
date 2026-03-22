import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/contexts/LanguageContext";
import { getSeoForPath } from "@/lib/seo";

interface SeoManagerProps {
  path: string;
  title?: string;
  description?: string;
  keywords?: string;
}

const BASE_URL = "https://get8.pro";

export function SeoManager({ path, title, description, keywords }: SeoManagerProps) {
  const { language } = useLanguage();
  const normalizedPath = path === "/portal" ? "/" : path;
  const canonicalUrl = `${BASE_URL}${normalizedPath}`;
  const defaults = getSeoForPath(path, language);
  const resolvedTitle = title || defaults.title;
  const resolvedDescription = description || defaults.description;
  const resolvedKeywords = keywords || defaults.keywords;

  return (
    <Helmet>
      <html lang={language === "zh" ? "zh-CN" : "en"} />
      <title>{resolvedTitle}</title>
      <meta name="description" content={resolvedDescription} />
      <meta name="keywords" content={resolvedKeywords} />
      <link rel="canonical" href={canonicalUrl} />

      <link rel="alternate" hrefLang="zh-CN" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={language === "zh" ? "zh_CN" : "en_US"} />
      <meta property="og:site_name" content="Get8 Pro" />
      <meta property="og:image" content={`${BASE_URL}/og-image.png`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />

      <meta name="geo.region" content="CN,US,GB,CA,AU,JP,KR,SG" />
      <meta name="geo.placename" content="Global" />
      <meta name="geo.position" content="0;0" />
    </Helmet>
  );
}
