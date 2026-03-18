import { SeoManager } from "@/components/SeoManager";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import { BadgeCheck, BookOpen, Mail, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";

const SECTIONS = {
  zh: {
    title: "编辑原则与透明度",
    subtitle: "让用户、搜索引擎和各类 AI 都更容易判断 Get8 Pro 是什么样的网站。",
    badge: "可信度中心",
    intro:
      "Get8 Pro 不是交易所，也不是理财销售页面。我们做的是 Web3 导航、教程整合、交易所信息核对和工具推荐。下面这页把我们如何写内容、如何处理合作关系、怎样纠错、以及哪些事情不会做说清楚。",
    cards: [
      {
        icon: "官方",
        title: "源头优先",
        desc: "费率、返佣、KYC、活动规则和支持地区，优先以交易所官方页面、官方公告和后台配置为准。",
      },
      {
        icon: "披露",
        title: "先讲限制再讲收益",
        desc: "老账户补绑限制、地区限制、实名要求和风险提示会优先展示，不靠模糊词推动转化。",
      },
      {
        icon: "纠错",
        title: "允许修正",
        desc: "如果规则变化、活动下线、数据过期，我们会更新说明并保留修正入口。",
      },
    ],
    sections: [
      {
        icon: BookOpen,
        title: "我们发布什么内容",
        body: "站内内容主要包括：Web3 入门教程、交易所功能对比、KYC 与下载流程、币圈工具导航、快讯聚合和模拟交易教学。我们尽量把“先看什么、先做什么、哪里有风险”讲清楚，而不是只堆注册链接。",
      },
      {
        icon: ShieldCheck,
        title: "我们怎么核对信息",
        body: "对交易所相关信息，我们优先核对官方页面、活动公告、后台展示和平台配置。对快讯与文章，我们会标明来源，并尽量把聚合内容和观点内容分开。遇到无法确认的内容，我们宁可不写死，也不会装成确定答案。",
      },
      {
        icon: TriangleAlert,
        title: "我们怎么处理合作与返佣",
        body: "站内部分交易所链接属于官方合作或邀请计划。我们会因此获得收益，但合作关系不会替代风险披露，也不会直接决定教程顺序。公开页面的默认返佣说明会尽量统一，变更时以交易所官方页面和实际后台显示为准。",
      },
      {
        icon: RefreshCw,
        title: "我们怎么更新与修正",
        body: "快讯、文章、交易所规则和工具信息都可能变化。对于会变化的内容，我们倾向于给出来源、时间和限制条件，而不是长期保留模糊描述。如果你发现某条信息已经过期，可以直接联系，我们会优先核查。",
      },
    ],
    bulletsTitle: "我们不会做的事",
    bullets: [
      "不会把内容包装成投资承诺或保本承诺。",
      "不会把合作链接说成官方背书的收益保证。",
      "不会故意隐藏老账户无法补绑、KYC 限制或地区限制。",
      "不会把模拟交易页面包装成真实收益工具。",
    ],
    contactTitle: "纠错与联系",
    contactBody:
      "如果你发现费率、返佣、下载入口、KYC 要求或文章信息有误，可以直接通过联系页或邮箱告诉我们。对这类“影响用户决策”的问题，我们会优先处理。",
    legalHint: "更多风险和免责声明可在法律页查看。",
    legalLink: "查看法律与风险披露",
    contactLink: "联系 Get8 Pro",
  },
  en: {
    title: "Editorial Standards & Transparency",
    subtitle: "A clearer trust layer for users, search engines, and AI systems.",
    badge: "Trust Center",
    intro:
      "Get8 Pro is not an exchange and not a financial sales page. We focus on Web3 navigation, educational guidance, exchange info verification, and practical tool curation. This page explains how we publish, how partnerships are handled, how corrections work, and what we do not claim.",
    cards: [
      {
        icon: "Source",
        title: "Source-first",
        desc: "Fees, rebates, KYC requirements, campaigns, and supported regions are checked against official exchange pages and official announcements first.",
      },
      {
        icon: "Risk",
        title: "Limits before upside",
        desc: "Existing-account limits, regional restrictions, KYC requirements, and risk notes are surfaced before conversion-oriented copy.",
      },
      {
        icon: "Fix",
        title: "Correction-friendly",
        desc: "When rules change or content becomes outdated, we update the explanation instead of pretending the old version is still valid.",
      },
    ],
    sections: [
      {
        icon: BookOpen,
        title: "What we publish",
        body: "The site mainly covers Web3 onboarding, exchange comparisons, KYC and download walkthroughs, crypto tools, news aggregation, and educational simulators. The goal is to make the next step clearer, not just to stack referral links.",
      },
      {
        icon: ShieldCheck,
        title: "How we verify information",
        body: "For exchange-related content, we prioritize official pages, official announcements, backend displays, and platform configuration. For news and articles, we distinguish between sourced aggregation and interpretation. If something cannot be verified confidently, we avoid presenting it as settled fact.",
      },
      {
        icon: TriangleAlert,
        title: "How we handle partnerships and rebates",
        body: "Some exchange links on this site are part of official partner or referral programs. That can generate revenue for us, but it does not replace risk disclosures or directly determine how guides are structured. Public rebate information should always be rechecked against the exchange before action.",
      },
      {
        icon: RefreshCw,
        title: "How updates and corrections work",
        body: "News, fees, KYC rules, and tool availability can change quickly. For time-sensitive content, we try to surface source and timing context instead of publishing vague evergreen claims. If you spot an outdated item, we want that correction quickly.",
      },
    ],
    bulletsTitle: "What we do not do",
    bullets: [
      "We do not present content as guaranteed returns or capital protection.",
      "We do not present partner links as guaranteed outcomes.",
      "We do not hide existing-account limits, KYC requirements, or regional restrictions.",
      "We do not frame simulator pages as real-profit tools.",
    ],
    contactTitle: "Corrections & Contact",
    contactBody:
      "If you find inaccurate fee info, rebate rules, download links, KYC requirements, or article content, contact us directly. We prioritize issues that can materially affect user decisions.",
    legalHint: "More legal, disclaimer, and risk details are available on the legal page.",
    legalLink: "Open legal & risk disclosures",
    contactLink: "Contact Get8 Pro",
  },
} as const;

export default function Standards() {
  const { language } = useLanguage();
  const zh = language === "zh";
  const t = zh ? SECTIONS.zh : SECTIONS.en;

  return (
    <>
      <SeoManager path="/standards" />

      <div className="min-h-screen bg-[#050D1A] text-white">
        <div className="sticky top-0 z-10 border-b border-white/10 bg-[#050D1A]/85 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 text-sm">
            <Link href="/" className="text-slate-400 transition hover:text-white">Get8 Pro</Link>
            <span className="text-slate-600">/</span>
            <span className="font-semibold text-white">{t.title}</span>
          </div>
        </div>

        <div className="mx-auto max-w-5xl space-y-14 px-4 py-12">
          <section className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300">
              <BadgeCheck className="h-3.5 w-3.5" />
              {t.badge}
            </div>
            <h1 className="mb-4 text-4xl font-black leading-tight sm:text-5xl">{t.title}</h1>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-slate-400">{t.subtitle}</p>
            <p className="mx-auto mt-6 max-w-3xl text-sm leading-8 text-slate-300">{t.intro}</p>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {t.cards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-cyan-300">{card.icon}</div>
                <h2 className="mb-2 text-xl font-black text-white">{card.title}</h2>
                <p className="text-sm leading-7 text-slate-400">{card.desc}</p>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {t.sections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-black text-white">{section.title}</h2>
                  </div>
                  <p className="text-sm leading-8 text-slate-300">{section.body}</p>
                </div>
              );
            })}
          </section>

          <section className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6">
            <h2 className="mb-4 text-2xl font-black text-white">{t.bulletsTitle}</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {t.bullets.map((bullet) => (
                <div key={bullet} className="rounded-xl border border-white/10 bg-black/15 p-4 text-sm leading-7 text-slate-300">
                  {bullet}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-blue-500/20 bg-blue-950/20 p-6">
            <h2 className="mb-3 text-2xl font-black text-white">{t.contactTitle}</h2>
            <p className="mb-4 text-sm leading-8 text-slate-300">{t.contactBody}</p>
            <p className="mb-6 text-sm text-slate-400">{t.legalHint}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/legal" className="tap-target inline-flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-2.5 text-sm font-bold text-amber-300 transition hover:bg-amber-500/15">
                <ShieldCheck className="h-4 w-4" />
                {t.legalLink}
              </Link>
              <Link href="/contact" className="tap-target inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-2.5 text-sm font-bold text-cyan-300 transition hover:bg-cyan-500/15">
                <Mail className="h-4 w-4" />
                {t.contactLink}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
