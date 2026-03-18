import { SeoManager } from "@/components/SeoManager";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import {
  BadgeCheck,
  CheckCircle2,
  Eye,
  Mail,
  MessageSquare,
  Shield,
  Target,
  Users,
} from "lucide-react";

const PRINCIPLES = [
  {
    icon: <Eye className="w-6 h-6" />,
    title: { zh: "官方口径优先", en: "Official-source first" },
    desc: {
      zh: "费率、返佣和活动规则优先以交易所官方页面与公告为准，我们只做整合和解释。",
      en: "Fees, rebates, and campaign rules are checked against official exchange pages and announcements first.",
    },
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: { zh: "先讲限制再讲收益", en: "Limits before upside" },
    desc: {
      zh: "老账户补绑限制、KYC 要求、风险提示会先说清楚，不会用模糊话术硬推转化。",
      en: "Retrofit limits, KYC requirements, and risks are explained before any upside claims.",
    },
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: { zh: "按人群给路径", en: "Different paths for different users" },
    desc: {
      zh: "新手、老用户和有交易经验的人，看到的下一步动作应该不一样。",
      en: "Beginners, existing users, and active traders should not be pushed into the same path.",
    },
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: { zh: "把信息做成可执行", en: "Actionable information" },
    desc: {
      zh: "不只是告诉你哪家交易所不错，而是告诉你应该先看什么、先做什么、怎么避免踩坑。",
      en: "We do not just say which exchange looks good. We explain what to read, what to do first, and what to avoid.",
    },
  },
];

const PARTNERSHIPS = [
  { name: "Gate.io", emoji: "🟢", href: "/exchange/gate" },
  { name: "OKX", emoji: "⚫", href: "/exchange/okx" },
  { name: "Binance", emoji: "🟡", href: "/exchange/binance" },
  { name: "Bybit", emoji: "🔵", href: "/exchange/bybit" },
  { name: "Bitget", emoji: "🟦", href: "/exchange/bitget" },
];

const VERIFICATION_STEPS = [
  {
    zh: { title: "我们先核对源头", desc: "交易所页面、公告和后台配置优先于二手转述。" },
    en: { title: "We verify the source first", desc: "Exchange pages, official announcements, and platform config come before second-hand summaries." },
  },
  {
    zh: { title: "我们把规则写成人话", desc: "像默认 20%、老账户通常不可补绑这类规则，会直接前置展示。" },
    en: { title: "We turn rules into plain language", desc: "Rules like the default 20% rebate and existing-account limits are shown clearly upfront." },
  },
  {
    zh: { title: "我们给不同人不同入口", desc: "把新手教育、手续费优化和老用户方案拆开，减少误点和流失。" },
    en: { title: "We split paths by visitor intent", desc: "Beginner education, fee optimization, and existing-user options are separated to reduce drop-off." },
  },
];

const STATS = [
  { val: "5+", label: { zh: "官方合作交易所", en: "Official Partner Exchanges" } },
  { val: "20%", label: { zh: "默认返佣起点", en: "Default Rebate Entry" } },
  { val: "24/7", label: { zh: "快讯与行情覆盖", en: "News & market coverage" } },
  { val: "Web3", label: { zh: "学习到实操闭环", en: "Guide-to-action flow" } },
];

export default function About() {
  const { language } = useLanguage();
  const zh = language === "zh";

  return (
    <>
      <SeoManager path="/about" />

      <div className="min-h-screen bg-[#050D1A] text-white">
        <div className="sticky top-0 z-10 border-b border-white/10 bg-[#050D1A]/85 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 text-sm">
            <Link href="/" className="text-slate-400 transition hover:text-white">Get8 Pro</Link>
            <span className="text-slate-600">/</span>
            <span className="font-semibold text-white">{zh ? "关于我们" : "About Us"}</span>
          </div>
        </div>

        <div className="mx-auto max-w-5xl space-y-16 px-4 py-12">
          <section className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400">
              <BadgeCheck className="h-3.5 w-3.5" />
              {zh ? "透明说明 · 方法优先" : "Transparent explanation · Method first"}
            </div>
            <h1 className="mb-4 text-4xl font-black leading-tight sm:text-5xl">
              {zh ? "关于 " : "About "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Get8 Pro</span>
            </h1>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-slate-400">
              {zh
                ? "我们想做的不是一个只会导流的站，而是一个让新手不慌、让交易者更省成本、让老用户快速看清限制的 Web3 导航站。"
                : "We are building more than a referral page. The goal is a Web3 navigation site that helps beginners stay calm, traders reduce costs, and existing users see limits clearly."}
            </p>
          </section>

          <section>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {STATS.map((item) => (
                <div key={item.val + item.label.en} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                  <div className="mb-1 text-3xl font-black text-white">{item.val}</div>
                  <div className="text-xs text-slate-400">{zh ? item.label.zh : item.label.en}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-950/40 to-slate-950 p-6 sm:p-8">
            <h2 className="mb-5 text-2xl font-black text-white">{zh ? "我们为什么这样设计网站" : "Why The Site Is Designed This Way"}</h2>
            <div className="space-y-4 text-base leading-8 text-slate-300">
              <p>
                {zh
                  ? "很多人第一次进加密网站，脑子里同时会出现三种念头：这东西靠谱吗、我该先点哪里、会不会一不小心就踩坑。网站留存率低，往往不是内容少，而是用户在前 30 秒没有得到足够稳定的答案。"
                  : "When people first land on a crypto site, they usually ask three things at once: Is this trustworthy? Where should I click first? Am I about to make a mistake?"}
              </p>
              <p>
                {zh
                  ? "所以我们把路径分层，把返佣规则前置，把风险和免责声明放在显眼位置，同时让教程、工具、快讯和模拟交易彼此衔接。这样用户不是被催着转化，而是被稳稳接住。"
                  : "That is why we split the paths, surface rebate rules early, show disclaimers clearly, and connect guides, tools, news, and simulations into one flow."}
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-6 text-2xl font-black text-white">{zh ? "我们的内容原则" : "Our Editorial Principles"}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {PRINCIPLES.map((item) => (
                <div key={item.title.en} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="text-blue-400">{item.icon}</div>
                    <h3 className="font-bold text-white">{zh ? item.title.zh : item.title.en}</h3>
                  </div>
                  <p className="text-sm leading-7 text-slate-400">{zh ? item.desc.zh : item.desc.en}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-6 text-2xl font-black text-white">{zh ? "我们如何验证信息" : "How We Verify Information"}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {VERIFICATION_STEPS.map((step, index) => (
                <div key={step.en.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-black text-emerald-300">
                    {index + 1}
                  </div>
                  <h3 className="mb-2 font-bold text-white">{zh ? step.zh.title : step.en.title}</h3>
                  <p className="text-sm leading-7 text-slate-400">{zh ? step.zh.desc : step.en.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-2xl font-black text-white">{zh ? "合作交易所" : "Partner Exchanges"}</h2>
            <p className="mb-6 text-sm leading-7 text-slate-400">
              {zh
                ? "目前优先支持 5 家合作交易所。页面统一默认按 20% 起展示；如果你交易量更大，或需要更高额度与其他平台方案，可以直接联系我。"
                : "We currently prioritize 5 partner exchanges. Public pages show the default 20% starting point; contact us for higher tiers or other platform options."}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PARTNERSHIPS.map((item) => (
                <Link key={item.name} href={item.href} className="tap-target block">
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20 hover:bg-white/10">
                    <span className="text-2xl">{item.emoji}</span>
                    <div>
                      <div className="font-bold text-white">{item.name}</div>
                      <div className="text-xs text-slate-400">
                        {zh ? "默认 20%，更高额度可联系" : "Default 20%, contact for higher tiers"}
                      </div>
                    </div>
                    <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-400" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-black text-white">{zh ? "重要声明" : "Important Disclaimer"}</h2>
            <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-950/30 p-5 text-sm leading-7 text-slate-300">
              <p>
                {zh
                  ? "Get8 Pro 的内容仅供参考，不构成投资建议。加密市场波动大，任何决策都应结合你自己的风险承受能力。"
                  : "Content on Get8 Pro is for reference only and does not constitute investment advice. Crypto markets are highly volatile."}
              </p>
              <p>
                {zh
                  ? "我们与部分交易所存在官方合作关系，并会通过合作计划获得收益。但合作关系不会替代风险提示，也不会决定内容排序。"
                  : "We do have official partner relationships with some exchanges, but those relationships do not replace risk disclosures or determine the content order."}
              </p>
              <p>
                {zh
                  ? "返佣规则、手续费和活动都可能变化，所以在注册前请以交易所官方页面与后台显示为准。"
                  : "Rebate rules, fees, and promotions can change, so always verify the latest information on official exchange pages before registering."}
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-6 text-2xl font-black text-white">{zh ? "联系我们" : "Contact Us"}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <a
                href="mailto:contact@get8.pro"
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
              >
                <Mail className="h-5 w-5 text-blue-400" />
                <div>
                  <div className="text-sm font-semibold text-white">{zh ? "邮件联系" : "Email"}</div>
                  <div className="text-xs text-slate-400">contact@get8.pro</div>
                </div>
              </a>
              <Link href="/contact" className="tap-target block">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10">
                  <MessageSquare className="h-5 w-5 text-emerald-400" />
                  <div>
                    <div className="text-sm font-semibold text-white">{zh ? "联系表单" : "Contact Form"}</div>
                    <div className="text-xs text-slate-400">{zh ? "适合返佣咨询、平台开户和合作沟通" : "For rebate questions, platform setup, and cooperation inquiries"}</div>
                  </div>
                </div>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
