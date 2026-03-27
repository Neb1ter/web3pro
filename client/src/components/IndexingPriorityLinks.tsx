import { Link } from "wouter";
import {
  ArrowRight,
  FileText,
  Globe,
  Newspaper,
  Scale,
  ShieldCheck,
  Wallet,
} from "lucide-react";

type Props = {
  zh: boolean;
  compact?: boolean;
};

const PRIORITY_LINKS = [
  {
    href: "/exchange-download",
    zhTitle: "交易所注册与下载教程",
    enTitle: "Exchange Registration & Download Guide",
    zhDesc: "先看官网注册路径、邀请码填写和官方下载安装步骤。",
    enDesc: "Start with the official registration path, invite code, and download flow.",
    icon: Wallet,
  },
  {
    href: "/exchanges",
    zhTitle: "交易所对比",
    enTitle: "Exchange Comparison",
    zhDesc: "快速查看费用、功能、KYC 和平台差异。",
    enDesc: "Compare fees, features, KYC, and platform differences.",
    icon: Globe,
  },
  {
    href: "/articles",
    zhTitle: "深度文章中心",
    enTitle: "Articles",
    zhDesc: "浏览教程、分析和更完整的背景说明。",
    enDesc: "Browse tutorials, analysis, and deeper context.",
    icon: FileText,
  },
  {
    href: "/crypto-news",
    zhTitle: "加密快讯中心",
    enTitle: "Crypto News Hub",
    zhDesc: "集中查看市场更新、公告和重点快讯。",
    enDesc: "Track market updates, announcements, and key headlines.",
    icon: Newspaper,
  },
  {
    href: "/about",
    zhTitle: "关于 Get8 Pro",
    enTitle: "About Get8 Pro",
    zhDesc: "了解站点定位、内容边界与合作披露。",
    enDesc: "See the site's scope, boundaries, and partner disclosures.",
    icon: ShieldCheck,
  },
  {
    href: "/standards",
    zhTitle: "编辑原则与透明度",
    enTitle: "Editorial Standards",
    zhDesc: "查看来源、审核和更新规则。",
    enDesc: "Review sourcing, review, and update standards.",
    icon: Scale,
  },
];

export default function IndexingPriorityLinks({ zh, compact = false }: Props) {
  return (
    <section
      aria-labelledby="priority-pages-heading"
      className={`rounded-2xl border border-slate-700/70 bg-slate-950/45 ${
        compact ? "p-5" : "p-6 sm:p-7"
      }`}
    >
      <div className="mb-5">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-cyan-300/80">
          {zh ? "优先浏览入口" : "Priority Pages"}
        </p>
        <h2 id="priority-pages-heading" className="text-xl font-black text-white sm:text-2xl">
          {zh ? "先从这些核心页面进入" : "Start With These Core Pages"}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          {zh
            ? "把注册下载、交易所对比、文章、快讯和站点说明集中在一起，既方便用户快速进入，也方便搜索引擎更稳定地发现重要页面。"
            : "Group registration, exchange comparison, articles, news, and site information in one clean navigation block for both readers and crawlers."}
        </p>
      </div>

      <nav aria-label={zh ? "核心页面导航" : "Core page navigation"}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PRIORITY_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="tap-target block">
                <div className="group h-full rounded-2xl border border-slate-800 bg-slate-900/55 p-4 transition-all hover:border-cyan-400/40 hover:bg-slate-900/80">
                  <div className="mb-3 inline-flex rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="mb-2 text-sm font-black text-white sm:text-base">
                    {zh ? item.zhTitle : item.enTitle}
                  </h3>
                  <p className="mb-4 text-xs leading-5 text-slate-400 sm:text-sm">
                    {zh ? item.zhDesc : item.enDesc}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 sm:text-sm">
                    {zh ? "进入页面" : "Open page"}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </section>
  );
}
