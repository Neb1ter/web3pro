import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollMemory, goBack } from "@/hooks/useScrollMemory";
import { SeoManager } from "@/components/SeoManager";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Twitter,
  UserRound,
} from "lucide-react";

const DiscordIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-indigo-400">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

function SendButton({ isPending, label, pendingLabel }: { isPending: boolean; label: string; pendingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="tap-target flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isPending ? pendingLabel : label}
    </button>
  );
}

const TEXT = {
  zh: {
    seoTitle: "联系 Get8 Pro | 咨询、返佣配置与内容反馈",
    seoDesc: "联系 Get8 Pro 咨询返佣、交易所选择、老账户限制、合作需求与内容修正，查看联系渠道、回复流程和提交建议。",
    navBack: "返回上一页",
    heroBadge: "联系与支持",
    heroTitle: "联系我们",
    heroSubtitle: "返佣咨询、路径确认、合作沟通和内容反馈都可以从这里开始。",
    heroDesc:
      "如果你想确认新用户返佣、老账户限制、平台选择、下载/KYC 流程，或者需要更高额度方案，这一页会告诉你先准备什么、通过什么渠道联系，以及提交后会发生什么。",
    useCasesTitle: "你可以因为什么来联系",
    useCases: [
      { title: "新用户返佣配置", desc: "确认默认返佣、开户链接和注册前需要注意的步骤。" },
      { title: "老账户限制确认", desc: "先看是否还能补绑，再决定是否需要新账户方案。" },
      { title: "更高额度或其他平台", desc: "如果五家平台不够，或者你需要更高额度方案，可以单独沟通。" },
      { title: "内容修正与合作", desc: "发现页面信息过期、链接异常，或有合作需求，也可以直接联系。" },
    ],
    channelsTitle: "联系渠道",
    channelsSubtitle: "你可以先选最方便的入口，我们会根据问题类型继续跟进。",
    channels: [
      { name: "Telegram", handle: "私信咨询", desc: "适合返佣、路径确认和快速沟通", icon: "telegram" },
      { name: "X (Twitter)", handle: "发送私信", desc: "适合公开关注后继续私聊", icon: "twitter" },
      { name: "微信", handle: "联系 Get8 Pro", desc: "适合中文环境下沟通注册和返佣问题", icon: "wechat" },
      { name: "Email", handle: "contact@get8.pro", desc: "适合合作、修正反馈和需要留档的事项", icon: "email" },
      { name: "Discord", handle: "discord.gg/wgvetpH6Un", desc: "适合进群了解更多学习与社区信息", icon: "discord", href: "https://discord.gg/wgvetpH6Un" },
    ],
    prepareTitle: "联系前建议准备",
    prepareItems: [
      "你使用或准备使用的交易所名称",
      "你的联系平台和用户名",
      "如果已有账户，可附上 UID 或注册用户名",
      "你关心的是默认 20% 方案、老账户限制，还是更高额度方案",
    ],
    workflowTitle: "提交后会怎么处理",
    workflow: [
      { title: "1. 先看问题类型", desc: "先判断你是新用户、老用户、合作咨询还是内容反馈。" },
      { title: "2. 再给到对应路径", desc: "像返佣、平台选择、KYC 或下载问题，会给你对应的下一步。" },
      { title: "3. 再继续跟进", desc: "复杂问题会继续通过你留下的联系方式确认细节。" },
    ],
    trustTitle: "联系页会回答什么",
    trustCards: [
      { title: "默认返佣口径", desc: "公开页默认按统一方案展示，避免前后口径不一致。" },
      { title: "老账户限制说明", desc: "不会把通常无法补绑这件事藏起来，而是直接提前说明。" },
      { title: "联系方式用途", desc: "只用于问题跟进、返佣配置或内容修正，不做无关用途。" },
    ],
    formTitle: "提交你的信息",
    formDesc: "如果你希望我们根据你的情况继续跟进，可以直接提交下面这份信息。",
    platform: "联系平台",
    platformSelect: "请选择联系平台",
    accountName: "你的账号名称",
    accountPlaceholder: "填写你在该平台上的用户名",
    accountExample: "例如 Telegram @username、微信号、邮箱地址等",
    exchangeUid: "交易所 UID（可选）",
    exchangeUidPlaceholder: "如有，可填写你的交易所 UID",
    exchangeUsername: "交易所用户名（可选）",
    exchangeUsernamePlaceholder: "如有，可填写你的交易所注册用户名",
    message: "补充说明（可选）",
    messagePlaceholder: "例如你想问的平台、目前账号状态、是否需要更高额度等",
    submit: "提交信息",
    submitting: "提交中...",
    privacy: "你的信息仅用于联系跟进、返佣配置或内容修正，不用于无关用途。",
    successMsg: "提交成功，我们会尽快联系你。",
    requiredMsg: "请先填写必填项。",
    responseTitle: "回复预期",
    responseDesc: "工作日通常会在 24 小时内回复；如果是路径确认或简单问题，通常会更快。",
    footerTitle: "把问题说清楚，比盲目操作更重要",
    footerSubtitle: "先确认规则、再行动，会比反复试错更省时间。",
  },
  en: {
    seoTitle: "Contact Get8 Pro | Support, Rebate Setup & Feedback",
    seoDesc: "Contact Get8 Pro for rebate questions, exchange selection, existing-account limits, cooperation, or content corrections.",
    navBack: "Back",
    heroBadge: "Contact & Support",
    heroTitle: "Contact Us",
    heroSubtitle: "Questions about rebates, onboarding paths, cooperation, or content feedback can start here.",
    heroDesc:
      "If you want to confirm new-user rebates, existing-account limits, exchange choices, download/KYC steps, or a higher-tier plan, this page explains what to prepare, how to reach us, and what happens after submission.",
    useCasesTitle: "Why people usually contact us",
    useCases: [
      { title: "New-user rebate setup", desc: "Confirm the default rebate, referral entry, and what to check before registering." },
      { title: "Existing-account limits", desc: "Check whether a retrofit is still possible before choosing the next path." },
      { title: "Higher tier or other platforms", desc: "If the current five exchanges are not enough, or you need a higher tier, we can discuss it." },
      { title: "Corrections and cooperation", desc: "If information is outdated or you want to discuss cooperation, contact us directly." },
    ],
    channelsTitle: "Contact Channels",
    channelsSubtitle: "Choose the most convenient entry point and we will follow up based on your question.",
    channels: [
      { name: "Telegram", handle: "Direct message", desc: "Best for rebate questions and quick path checks", icon: "telegram" },
      { name: "X (Twitter)", handle: "Send a DM", desc: "Useful if you already follow and want a quick message thread", icon: "twitter" },
      { name: "WeChat", handle: "Contact Get8 Pro", desc: "Best for Chinese-language onboarding and rebate questions", icon: "wechat" },
      { name: "Email", handle: "contact@get8.pro", desc: "Best for cooperation, corrections, or anything that needs a record", icon: "email" },
      { name: "Discord", handle: "discord.gg/wgvetpH6Un", desc: "Good for community access and further learning resources", icon: "discord", href: "https://discord.gg/wgvetpH6Un" },
    ],
    prepareTitle: "Helpful things to prepare",
    prepareItems: [
      "Which exchange you use or plan to use",
      "Your contact platform and username",
      "If you already have an account, your UID or registered username",
      "Whether you need the default 20% plan, an existing-account answer, or a higher-tier option",
    ],
    workflowTitle: "What happens after submission",
    workflow: [
      { title: "1. We identify the request type", desc: "We first separate beginner, existing-account, cooperation, and correction requests." },
      { title: "2. We point you to the right path", desc: "Rebate, platform choice, KYC, or download questions get routed to the relevant next step." },
      { title: "3. We follow up if needed", desc: "For more complex cases, we continue via the contact details you submitted." },
    ],
    trustTitle: "What this page clarifies",
    trustCards: [
      { title: "Default rebate baseline", desc: "Public pages keep a consistent default baseline instead of changing the story page by page." },
      { title: "Existing-account limits", desc: "We do not hide the usual retrofit limitation for older accounts." },
      { title: "Contact-data purpose", desc: "Your details are used for follow-up, rebate setup, or corrections, not unrelated outreach." },
    ],
    formTitle: "Submit Your Information",
    formDesc: "If you want us to follow up based on your situation, submit the form below.",
    platform: "Contact Platform",
    platformSelect: "Select a contact platform",
    accountName: "Your Account Name",
    accountPlaceholder: "Enter your username on that platform",
    accountExample: "For example: Telegram @username, WeChat ID, or an email address",
    exchangeUid: "Exchange UID (Optional)",
    exchangeUidPlaceholder: "If available, enter your exchange UID",
    exchangeUsername: "Exchange Username (Optional)",
    exchangeUsernamePlaceholder: "If available, enter your registered exchange username",
    message: "Additional Notes (Optional)",
    messagePlaceholder: "For example: preferred exchange, current account status, or whether you need a higher tier",
    submit: "Submit Information",
    submitting: "Submitting...",
    privacy: "Your information is used only for follow-up, rebate setup, or content corrections.",
    successMsg: "Submitted successfully. We will follow up soon.",
    requiredMsg: "Please fill in the required fields first.",
    responseTitle: "Response expectation",
    responseDesc: "We usually reply within 24 hours on business days, and simple questions are often handled faster.",
    footerTitle: "Clear questions save more time than trial and error",
    footerSubtitle: "Confirm the rules first, then act with more confidence.",
  },
} as const;

function renderChannelIcon(icon: string) {
  switch (icon) {
    case "telegram":
      return <MessageCircle className="h-5 w-5 text-cyan-300" />;
    case "twitter":
      return <Twitter className="h-5 w-5 text-slate-200" />;
    case "wechat":
      return <Phone className="h-5 w-5 text-emerald-300" />;
    case "email":
      return <Mail className="h-5 w-5 text-amber-300" />;
    case "discord":
      return <DiscordIcon />;
    default:
      return <UserRound className="h-5 w-5 text-white" />;
  }
}

export default function Contact() {
  const { language, setLanguage } = useLanguage();
  const t = language === "zh" ? TEXT.zh : TEXT.en;
  useScrollMemory();

  const [platform, setPlatform] = useState("");
  const [accountName, setAccountName] = useState("");
  const [exchangeUid, setExchangeUid] = useState("");
  const [exchangeUsername, setExchangeUsername] = useState("");
  const [message, setMessage] = useState("");

  const submitContact = trpc.contact.submit.useMutation({
    onSuccess: () => {
      toast.success(t.successMsg);
      setPlatform("");
      setAccountName("");
      setExchangeUid("");
      setExchangeUsername("");
      setMessage("");
    },
    onError: () => {
      toast.error(language === "zh" ? "提交失败，请稍后重试" : "Submission failed, please try again later");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!platform || !accountName) {
      toast.error(t.requiredMsg);
      return;
    }
    submitContact.mutate({ platform, accountName, exchangeUid, exchangeUsername, message });
  };

  return (
    <>
      <SeoManager
        path="/contact"
        title={t.seoTitle}
        description={t.seoDesc}
      />

      <div className="min-h-screen bg-[#050D1A] text-white">
        <nav className="sticky top-0 z-30 border-b border-white/10 bg-[#050D1A]/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <button
              type="button"
              onClick={goBack}
              className="tap-target inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.navBack}
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLanguage("zh")}
                className={`tap-target rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  language === "zh" ? "bg-cyan-400/20 text-cyan-300" : "text-slate-400 hover:text-white"
                }`}
              >
                中文
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`tap-target rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  language === "en" ? "bg-cyan-400/20 text-cyan-300" : "text-slate-400 hover:text-white"
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </nav>

        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_45%),linear-gradient(180deg,#07111f_0%,#050d1a_100%)] px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t.heroBadge}
            </div>
            <h1 className="mb-4 text-4xl font-black leading-tight sm:text-5xl">{t.heroTitle}</h1>
            <p className="mx-auto mb-4 max-w-3xl text-lg text-slate-200 sm:text-xl">{t.heroSubtitle}</p>
            <p className="mx-auto max-w-3xl text-sm leading-8 text-slate-400 sm:text-base">{t.heroDesc}</p>
          </div>
        </section>

        <section className="px-4 py-12">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-6 text-2xl font-black text-white">{t.useCasesTitle}</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {t.useCases.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="mb-2 text-base font-bold text-white">{item.title}</h3>
                  <p className="text-sm leading-7 text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.03] px-4 py-12">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-2 text-2xl font-black text-white">{t.channelsTitle}</h2>
            <p className="mb-8 text-sm text-slate-400">{t.channelsSubtitle}</p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {t.channels.map((channel) => {
                const card = (
                  <div className="tap-target h-full rounded-2xl border border-white/10 bg-[#081224] p-5 transition hover:border-cyan-400/30 hover:bg-[#0c1830]">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5">
                      {renderChannelIcon(channel.icon)}
                    </div>
                    <h3 className="mb-1 text-base font-bold text-white">{channel.name}</h3>
                    <p className="mb-2 text-sm font-medium text-cyan-300">{channel.handle}</p>
                    <p className="text-xs leading-6 text-slate-400">{channel.desc}</p>
                    {channel.href ? (
                      <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-indigo-300">
                        Open
                        <ExternalLink className="h-3.5 w-3.5" />
                      </div>
                    ) : null}
                  </div>
                );

                return channel.href ? (
                  <a key={channel.name} href={channel.href} target="_blank" rel="noopener noreferrer" className="block">
                    {card}
                  </a>
                ) : (
                  <div key={channel.name}>{card}</div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 py-12">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="mb-4 text-2xl font-black text-white">{t.prepareTitle}</h2>
                <div className="space-y-3">
                  {t.prepareItems.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl bg-black/15 p-4">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                      <p className="text-sm leading-7 text-slate-300">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="mb-4 text-2xl font-black text-white">{t.workflowTitle}</h2>
                <div className="space-y-3">
                  {t.workflow.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-white/8 bg-black/15 p-4">
                      <p className="mb-1 text-sm font-black text-white">{item.title}</p>
                      <p className="text-sm leading-7 text-slate-400">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-cyan-400/15 bg-cyan-400/5 p-6">
                <div className="mb-3 flex items-center gap-2 text-cyan-300">
                  <Clock3 className="h-5 w-5" />
                  <h2 className="text-xl font-black">{t.responseTitle}</h2>
                </div>
                <p className="text-sm leading-7 text-slate-300">{t.responseDesc}</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="mb-4 text-2xl font-black text-white">{t.trustTitle}</h2>
                <div className="grid gap-3 md:grid-cols-3">
                  {t.trustCards.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-white/8 bg-black/15 p-4">
                      <p className="mb-1 text-sm font-black text-white">{item.title}</p>
                      <p className="text-xs leading-6 text-slate-400">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-amber-400/20 bg-[#0b1425] p-6 sm:p-7">
              <h2 className="mb-2 text-2xl font-black text-white">{t.formTitle}</h2>
              <p className="mb-6 text-sm leading-7 text-slate-400">{t.formDesc}</p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">
                    {t.platform} <span className="text-amber-300">*</span>
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-400/40"
                  >
                    <option value="">{t.platformSelect}</option>
                    <option value="telegram">Telegram</option>
                    <option value="x">X (Twitter)</option>
                    <option value="wechat">WeChat</option>
                    <option value="email">Email</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">
                    {t.accountName} <span className="text-amber-300">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder={t.accountPlaceholder}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/40"
                  />
                  <p className="mt-2 text-xs leading-6 text-slate-500">{t.accountExample}</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">{t.exchangeUid}</label>
                  <input
                    type="text"
                    value={exchangeUid}
                    onChange={(e) => setExchangeUid(e.target.value)}
                    placeholder={t.exchangeUidPlaceholder}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/40"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">{t.exchangeUsername}</label>
                  <input
                    type="text"
                    value={exchangeUsername}
                    onChange={(e) => setExchangeUsername(e.target.value)}
                    placeholder={t.exchangeUsernamePlaceholder}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/40"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">{t.message}</label>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t.messagePlaceholder}
                    className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/40"
                  />
                </div>

                <SendButton isPending={submitContact.isPending} label={t.submit} pendingLabel={t.submitting} />
                <p className="text-center text-xs leading-6 text-slate-500">{t.privacy}</p>
              </form>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 bg-white/[0.03] px-4 py-12">
          <div className="mx-auto max-w-4xl text-center">
            <h3 className="mb-3 text-2xl font-black text-white">{t.footerTitle}</h3>
            <p className="mx-auto mb-4 max-w-2xl text-sm leading-7 text-slate-400">{t.footerSubtitle}</p>
            <a
              href="mailto:contact@get8.pro"
              className="tap-target inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition hover:text-cyan-200"
            >
              <Mail className="h-4 w-4" />
              contact@get8.pro
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}
