export const TRUST_LAST_REVIEWED = "2026-03-18";

export function formatTrustDate(value: string | Date | null | undefined, zh: boolean): string {
  if (!value) return zh ? "待补充" : "Pending";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return zh ? "待补充" : "Pending";
  return date.toLocaleDateString(zh ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getArticleSourceList(category: string, zh: boolean): string[] {
  const sourceMap: Record<string, { zh: string[]; en: string[] }> = {
    news_decode: {
      zh: ["原始快讯来源与项目公告", "公开市场数据与链上数据", "Get8 Pro 编辑复核"],
      en: ["Original news source and project announcements", "Public market data and on-chain data", "Get8 Pro editorial review"],
    },
    tutorial: {
      zh: ["官方帮助文档与产品页面", "平台公开规则与更新说明", "Get8 Pro 编辑复核"],
      en: ["Official help docs and product pages", "Public platform rules and update notes", "Get8 Pro editorial review"],
    },
    project: {
      zh: ["项目官网与公开文档", "公开融资与生态资料", "Get8 Pro 编辑复核"],
      en: ["Project website and public docs", "Public fundraising and ecosystem materials", "Get8 Pro editorial review"],
    },
    promo: {
      zh: ["公开活动页面与平台说明", "官方费率与返佣页面", "Get8 Pro 编辑复核"],
      en: ["Public campaign pages and platform notes", "Official fee and rebate pages", "Get8 Pro editorial review"],
    },
    report: {
      zh: ["公开研究报告与统计数据", "项目官方数据与公告", "Get8 Pro 编辑复核"],
      en: ["Public research reports and datasets", "Official project data and announcements", "Get8 Pro editorial review"],
    },
    analysis: {
      zh: ["公开市场数据与链上数据", "项目官方页面与公告", "Get8 Pro 编辑复核"],
      en: ["Public market data and on-chain data", "Official project pages and announcements", "Get8 Pro editorial review"],
    },
  };

  return (sourceMap[category] ?? sourceMap.analysis)[zh ? "zh" : "en"];
}
