import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/contexts/LanguageContext";

const BASE_URL = "https://get8.pro";

export function SchemaManager() {
  const { language } = useLanguage();
  const isZh = language === "zh";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Get8 Pro",
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: isZh
      ? "Get8 Pro 是一个面向 Web3 学习、交易所信息整理、KYC 说明和工具导航的内容网站。"
      : "Get8 Pro is a content website focused on Web3 learning, exchange information, KYC guidance, and tool navigation.",
    email: "contact@get8.pro",
    contactPoint: {
      "@type": "ContactPoint",
      email: "contact@get8.pro",
      contactType: "customer support",
      availableLanguage: ["Chinese", "English"],
    },
    areaServed: "Global",
    knowsAbout: [
      "Web3 education",
      "exchange comparison",
      "KYC onboarding",
      "crypto tools",
      "risk disclosures",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: BASE_URL,
    name: "Get8 Pro",
    description: isZh
      ? "提供 Web3 指南、交易所信息、KYC 流程、工具导航和加密资讯内容。"
      : "Provides Web3 guides, exchange information, KYC workflows, tool navigation, and crypto news content.",
    inLanguage: [isZh ? "zh-CN" : "en", isZh ? "en" : "zh-CN"],
    publisher: {
      "@type": "Organization",
      name: "Get8 Pro",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: isZh ? "Get8 Pro 导航与内容中心" : "Get8 Pro guides and navigation hub",
    url: BASE_URL,
    description: isZh
      ? "聚合 Web3 指南、交易所信息、KYC 流程、工具与风险提示。"
      : "A hub for Web3 education, exchange information, KYC guidance, tools, and risk disclosures.",
    isPartOf: {
      "@type": "WebSite",
      name: "Get8 Pro",
      url: BASE_URL,
    },
    about: [
      "Web3 onboarding",
      "exchange comparisons",
      "crypto tools",
      "risk notices",
    ],
  };

  const aboutPageSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: isZh ? "关于 Get8 Pro" : "About Get8 Pro",
    url: `${BASE_URL}/about`,
    description: isZh
      ? "介绍站点定位、合作披露、信息整理方法和风险说明。"
      : "Explains site purpose, partnership disclosures, information organization, and risk notes.",
    isPartOf: {
      "@type": "WebSite",
      name: "Get8 Pro",
      url: BASE_URL,
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(collectionPageSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(aboutPageSchema)}</script>
    </Helmet>
  );
}
