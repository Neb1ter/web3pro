import { type FormEvent, type RefObject, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { goBack, useScrollMemory } from "@/hooks/useScrollMemory";
import { SeoManager } from "@/components/SeoManager";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Twitter,
  UserRound,
} from "lucide-react";

type ChannelId = "telegram" | "x" | "wechat" | "email" | "discord";
type FormPlatform = "telegram" | "x" | "wechat" | "email" | "other";
type UseCaseId = "new-user" | "existing-account" | "higher-tier" | "content-feedback";

const DiscordIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-indigo-300">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const copy = {
  zh: {
    seoTitle: "联系 Get8 Pro | 移动端支持台",
    seoDesc: "先选事项，再看推荐渠道，最后补充资料，减少手机浏览时的信息遗失。",
    back: "返回上一页",
    badge: "联系与支持",
    title: "先锁定问题，再进入正确入口",
    subtitle: "这页按移动端工具站思路重排，先选问题类型，再给推荐渠道和精简表单。",
    intro: "目标不是把内容堆得更满，而是让你在手机上更快做决定，减少一路下滑之后还要回想前面看过什么的问题。",
    flowTitle: "移动端更顺手的顺序",
    flow: [
      { id: "1", title: "选问题", desc: "先确定场景，页面保持上下文。" },
      { id: "2", title: "看推荐渠道", desc: "按事项给更合适的入口。" },
      { id: "3", title: "补资料", desc: "先填必要字段，再决定是否补充更多。" },
    ],
    selectorTitle: "你现在想处理什么",
    selectorDesc: "点一个最接近的场景，右侧会同步给出建议路径、准备项和推荐联系渠道。",
    currentIssue: "当前事项",
    recommendedChannel: "推荐渠道",
    prepare: "建议先准备",
    reply: "回复预期",
    toForm: "去填写资料",
    toChannels: "看渠道说明",
    useCases: [
      {
        id: "new-user",
        title: "新用户返佣配置",
        desc: "确认默认返佣、注册链接和注册前注意事项。",
        recommendedChannel: "telegram",
        routeTitle: "适合快速确认路径",
        routeDesc: "先说明你打算使用的平台，以及是否还没有注册，通常会更快进入正确流程。",
        checklist: ["准备交易所名称", "说明是否未注册", "确认你关心默认方案还是高额度"],
        response: "新用户路径确认通常会优先处理。",
        prompt: "我准备注册 ______，想确认默认返佣和注册链接，目前还未注册 / 已注册未完成 KYC。",
      },
      {
        id: "existing-account",
        title: "老账户限制确认",
        desc: "先判断是否还能处理，再决定是否要用其他方案。",
        recommendedChannel: "wechat",
        routeTitle: "适合先补充账户信息",
        routeDesc: "老账户通常要先确认 UID、用户名和当前状态，信息越完整，判断越快。",
        checklist: ["准备 UID 或注册用户名", "说明是否完成 KYC", "说明要确认限制还是替代方案"],
        response: "这类问题通常需要先核对条件，节奏会稍慢一点。",
        prompt: "我已有 ______ 账户，UID / 用户名是 ______，想确认还能否处理返佣或是否需要别的方案。",
      },
      {
        id: "higher-tier",
        title: "更高额度或其他平台",
        desc: "当五家平台不够，或者你需要更高额度时使用。",
        recommendedChannel: "email",
        routeTitle: "适合一次性说明完整诉求",
        routeDesc: "更高额度、其他平台或更复杂的需求，邮件和完整表单更利于后续跟进。",
        checklist: ["说明目标平台或额度", "说明你的交易体量或背景", "留下稳定联系方式"],
        response: "这类需求通常会进入单独评估。",
        prompt: "我想咨询 ______ 平台 / 更高额度方案，主要诉求是 ______，预计交易规模或背景是 ______。",
      },
      {
        id: "content-feedback",
        title: "内容修正与合作",
        desc: "反馈页面问题、链接异常，或者沟通合作。",
        recommendedChannel: "email",
        routeTitle: "适合结构化表达",
        routeDesc: "页面修正和合作需求更适合文字化说明，这样后续确认时不会遗漏上下文。",
        checklist: ["指出具体页面或链接", "说明问题或合作方向", "有时效性就标出优先级"],
        response: "内容问题会先核实来源，合作请求会按主题继续跟进。",
        prompt: "我想反馈 / 合作的页面是 ______，具体问题或方向是 ______。",
      },
    ],
    channelsTitle: "联系渠道",
    channelsDesc: "推荐渠道会随着事项切换，其它渠道保留为备用入口，方便你直接切换而不是反复回看。",
    featured: "当前更推荐的入口",
    others: "其它可选渠道",
    pickChannel: "选择这个渠道",
    openLink: "打开链接",
    channels: [
      { id: "telegram", name: "Telegram", handle: "私信咨询", desc: "适合返佣、路径确认和快速沟通。", icon: "telegram" },
      { id: "x", name: "X (Twitter)", handle: "发送私信", desc: "适合公开关注后继续私聊。", icon: "twitter" },
      { id: "wechat", name: "微信", handle: "联系 Get8 Pro", desc: "适合中文环境下沟通返佣和注册问题。", icon: "wechat" },
      { id: "email", name: "Email", handle: "contact@get8.pro", desc: "适合合作、修正反馈和需要留档的事项。", icon: "email", href: "mailto:contact@get8.pro" },
      { id: "discord", name: "Discord", handle: "discord.gg/wgvetpH6Un", desc: "适合进入社区继续交流。", icon: "discord", href: "https://discord.gg/wgvetpH6Un" },
    ],
    formTitle: "提交你的关键信息",
    formDesc: "手机上先展示必要输入，其它信息折叠起来，减少第一眼的压力。",
    platform: "联系平台",
    platformSelect: "请选择联系平台",
    accountName: "你的账号名称",
    accountPlaceholder: "填写你在该平台上的用户名",
    accountExample: "例如 Telegram @username、微信号、邮箱地址等",
    message: "补充说明",
    fallbackMessage: "简要描述你的问题、状态和希望确认的点",
    optionalShow: "展开可选信息",
    optionalHide: "收起可选信息",
    uid: "交易所 UID（可选）",
    uidPlaceholder: "如有，可填写 UID",
    userName: "交易所用户名（可选）",
    userNamePlaceholder: "如有，可填写注册用户名",
    submit: "提交信息",
    submitting: "提交中...",
    privacy: "你的信息仅用于联系跟进、返佣配置或内容修正。",
    success: "提交成功，我们会尽快联系你。",
    required: "请先填写必填项。",
    failed: "提交失败，请稍后重试",
    noteTitle: "处理方式说明",
    noteDesc: "工作日通常会在 24 小时内回复，简单路径确认通常会更快。",
    improveTitle: "这版为什么更适合手机",
    improve: [
      { title: "信息先分层", desc: "不再把大量卡片并排堆在一个长页面里。" },
      { title: "当前事项持续可见", desc: "用户不会因为滚动太久而忘掉自己最初选了什么。" },
      { title: "先完成最少动作", desc: "默认只展示关键输入，降低提交前阻力。" },
    ],
    footerTitle: "先确认路径，再继续操作",
    footerDesc: "比起一路滑到底再回头确认，这种结构更像真正的支持工具页。",
    mobileIssue: "当前事项",
    mobileAction: "去填写资料",
  },
  en: {
    seoTitle: "Contact Get8 Pro | Mobile Support Console",
    seoDesc: "Choose the issue first, see the recommended channel, and submit only the details that matter on mobile.",
    back: "Back",
    badge: "Contact & Support",
    title: "Lock the issue first, then move into the right entry point",
    subtitle: "This page is reordered like a mobile tool page: issue first, recommended channel second, compact form last.",
    intro: "The goal is not to show more content. The goal is to help people decide faster on mobile without losing context while scrolling.",
    flowTitle: "A faster mobile order",
    flow: [
      { id: "1", title: "Pick the issue", desc: "Keep the context visible first." },
      { id: "2", title: "See the best channel", desc: "The entry changes with the issue type." },
      { id: "3", title: "Fill key details", desc: "Required fields first, optional later." },
    ],
    selectorTitle: "What do you want to handle right now",
    selectorDesc: "Pick the closest scenario first. The panel on the right will sync the suggested path, checklist, and best contact channel.",
    currentIssue: "Current issue",
    recommendedChannel: "Recommended channel",
    prepare: "Prepare first",
    reply: "Response expectation",
    toForm: "Go to form",
    toChannels: "See channels",
    useCases: [
      {
        id: "new-user",
        title: "New-user rebate setup",
        desc: "Confirm the default rebate, referral link, and pre-registration notes.",
        recommendedChannel: "telegram",
        routeTitle: "Best for a quick path check",
        routeDesc: "Share the exchange you plan to use and whether you have not registered yet. That usually leads to the fastest answer.",
        checklist: ["Prepare the exchange name", "State whether you are still unregistered", "Clarify whether you want the default plan or a higher tier"],
        response: "New-user path questions are usually handled first.",
        prompt: "I plan to register on ______ and want to confirm the default rebate and referral link. I have not registered yet / I registered but have not completed KYC.",
      },
      {
        id: "existing-account",
        title: "Existing-account limits",
        desc: "Check whether it is still possible first, then decide on an alternative path.",
        recommendedChannel: "wechat",
        routeTitle: "Best when account details are shared early",
        routeDesc: "Existing-account questions usually depend on UID, username, and account state. More context means faster answers.",
        checklist: ["Prepare UID or registered username", "State whether KYC is completed", "Clarify whether you want a limit check or another path"],
        response: "This usually needs a condition check first, so it may take a bit longer.",
        prompt: "I already have an account on ______, my UID / username is ______, and I want to know whether rebate handling is still possible or whether I need another path.",
      },
      {
        id: "higher-tier",
        title: "Higher tier or other platforms",
        desc: "Use this when the current five exchanges are not enough, or when you need a stronger plan.",
        recommendedChannel: "email",
        routeTitle: "Best for a complete written request",
        routeDesc: "Higher-tier, extra-platform, or more complex requests work better through email and a fuller form.",
        checklist: ["State the target platform or tier", "Share your trading size or background", "Leave a stable contact method"],
        response: "These requests usually go through a separate review path.",
        prompt: "I want to discuss ______ exchange / a higher-tier plan. My main request is ______ and my expected trading size or background is ______.",
      },
      {
        id: "content-feedback",
        title: "Corrections and cooperation",
        desc: "Report page issues, broken links, or discuss cooperation.",
        recommendedChannel: "email",
        routeTitle: "Best for structured context",
        routeDesc: "Corrections and cooperation are easier to follow when the written context is clear from the start.",
        checklist: ["Point to the exact page or link", "Describe the issue or cooperation direction", "Mark urgency if timing matters"],
        response: "Corrections are verified first, while cooperation requests continue based on topic fit.",
        prompt: "I want to report / discuss ______ on page ______. The issue or direction is ______.",
      },
    ],
    channelsTitle: "Contact channels",
    channelsDesc: "The recommended channel changes with the issue. Other channels stay visible as fallback options so you do not need to scroll back and compare.",
    featured: "Recommended for this issue",
    others: "Other available channels",
    pickChannel: "Use this channel",
    openLink: "Open link",
    channels: [
      { id: "telegram", name: "Telegram", handle: "Direct message", desc: "Best for rebates, path checks, and quick follow-up.", icon: "telegram" },
      { id: "x", name: "X (Twitter)", handle: "Send a DM", desc: "Useful if you prefer continuing the conversation there.", icon: "twitter" },
      { id: "wechat", name: "WeChat", handle: "Contact Get8 Pro", desc: "Good for Chinese-language registration and rebate questions.", icon: "wechat" },
      { id: "email", name: "Email", handle: "contact@get8.pro", desc: "Best for cooperation, corrections, and recorded communication.", icon: "email", href: "mailto:contact@get8.pro" },
      { id: "discord", name: "Discord", handle: "discord.gg/wgvetpH6Un", desc: "Best for community access and further discussion.", icon: "discord", href: "https://discord.gg/wgvetpH6Un" },
    ],
    formTitle: "Submit the key details",
    formDesc: "Only the most important inputs are visible first on mobile. Optional fields stay collapsed until needed.",
    platform: "Contact Platform",
    platformSelect: "Select a contact platform",
    accountName: "Your Account Name",
    accountPlaceholder: "Enter your username on that platform",
    accountExample: "For example: Telegram @username, WeChat ID, or an email address",
    message: "Additional Notes",
    fallbackMessage: "Briefly describe your issue, current status, and what you want to confirm",
    optionalShow: "Show optional fields",
    optionalHide: "Hide optional fields",
    uid: "Exchange UID (Optional)",
    uidPlaceholder: "If available, enter your UID",
    userName: "Exchange Username (Optional)",
    userNamePlaceholder: "If available, enter your registered username",
    submit: "Submit Information",
    submitting: "Submitting...",
    privacy: "Your information is used only for follow-up, rebate setup, or content corrections.",
    success: "Submitted successfully. We will follow up soon.",
    required: "Please fill in the required fields first.",
    failed: "Submission failed, please try again later",
    noteTitle: "Processing note",
    noteDesc: "We usually reply within 24 hours on business days, and simple path checks are often handled faster.",
    improveTitle: "Why this version works better on mobile",
    improve: [
      { title: "Information is layered", desc: "The page no longer stacks too many equal-weight cards in one long scroll." },
      { title: "Selected issue stays visible", desc: "The user does not lose the original context after scrolling." },
      { title: "Minimal first action", desc: "Only the key inputs are shown by default." },
    ],
    footerTitle: "Confirm the path first, then continue",
    footerDesc: "This behaves more like a real support tool page than a long article page.",
    mobileIssue: "Current issue",
    mobileAction: "Go to form",
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

function toPlatform(channelId: ChannelId): FormPlatform {
  return channelId === "discord" ? "other" : channelId;
}

function SendButton({ isPending, label, pendingLabel }: { isPending: boolean; label: string; pendingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="tap-target flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300 px-5 py-3 font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isPending ? pendingLabel : label}
    </button>
  );
}

export default function Contact() {
  const { language, setLanguage } = useLanguage();
  const t = language === "zh" ? copy.zh : copy.en;
  useScrollMemory();

  const channelsRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  const [activeUseCaseId, setActiveUseCaseId] = useState<UseCaseId>(t.useCases[0].id);
  const [platform, setPlatform] = useState<FormPlatform>(toPlatform(t.useCases[0].recommendedChannel));
  const [accountName, setAccountName] = useState("");
  const [exchangeUid, setExchangeUid] = useState("");
  const [exchangeUsername, setExchangeUsername] = useState("");
  const [message, setMessage] = useState("");
  const [showOptional, setShowOptional] = useState(false);
  const activeUseCase = t.useCases.find((item) => item.id === activeUseCaseId) ?? t.useCases[0];
  const featuredChannel = t.channels.find((item) => item.id === activeUseCase.recommendedChannel) ?? t.channels[0];
  const otherChannels = t.channels.filter((item) => item.id !== featuredChannel.id);

  const submitContact = trpc.contact.submit.useMutation({
    onSuccess: () => {
      toast.success(t.success);
      setPlatform(toPlatform(activeUseCase.recommendedChannel));
      setAccountName("");
      setExchangeUid("");
      setExchangeUsername("");
      setMessage("");
      setShowOptional(false);
    },
    onError: () => toast.error(t.failed),
  });

  const scrollToRef = (ref: RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const chooseUseCase = (id: UseCaseId) => {
    const nextCase = t.useCases.find((item) => item.id === id);
    if (!nextCase) return;
    setActiveUseCaseId(id);
    setPlatform(toPlatform(nextCase.recommendedChannel));
  };

  const chooseChannel = (channelId: ChannelId) => {
    setPlatform(toPlatform(channelId));
    scrollToRef(formRef);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!platform || !accountName.trim()) {
      toast.error(t.required);
      return;
    }
    submitContact.mutate({
      platform,
      accountName: accountName.trim(),
      exchangeUid: exchangeUid.trim(),
      exchangeUsername: exchangeUsername.trim(),
      message: message.trim(),
    });
  };

  return (
    <>
      <SeoManager path="/contact" title={t.seoTitle} description={t.seoDesc} />
      <div className="min-h-screen bg-[#06101d] text-white">
        <nav className="sticky top-0 z-30 border-b border-white/10 bg-[#06101d]/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <button type="button" onClick={goBack} className="tap-target inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              {t.back}
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setLanguage("zh")} className={`tap-target rounded-xl px-3 py-2 text-sm font-medium transition ${language === "zh" ? "bg-cyan-400/20 text-cyan-300" : "text-slate-400 hover:text-white"}`}>{"\u4E2D\u6587"}</button>
              <button type="button" onClick={() => setLanguage("en")} className={`tap-target rounded-xl px-3 py-2 text-sm font-medium transition ${language === "en" ? "bg-cyan-400/20 text-cyan-300" : "text-slate-400 hover:text-white"}`}>EN</button>
            </div>
          </div>
        </nav>
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.15),transparent_42%),radial-gradient(circle_at_85%_8%,rgba(251,191,36,0.1),transparent_24%),linear-gradient(180deg,#081220_0%,#06101d_100%)] px-4 py-10 sm:py-14">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t.badge}
                </div>
                <h1 className="max-w-3xl text-3xl font-black leading-tight sm:text-5xl">{t.title}</h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-200 sm:text-lg">{t.subtitle}</p>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">{t.intro}</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm font-semibold text-slate-200">{t.flowTitle}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  {t.flow.map((step) => (
                    <div key={step.id} className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                      <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400/15 text-sm font-black text-cyan-300">{step.id}</div>
                      <p className="text-sm font-bold text-white">{step.title}</p>
                      <p className="mt-1 text-xs leading-6 text-slate-400">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-8 sm:py-12">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_0.92fr]">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <h2 className="text-2xl font-black text-white">{t.selectorTitle}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-400">{t.selectorDesc}</p>
              <div className="mt-6 grid gap-3">
                {t.useCases.map((item) => {
                  const active = item.id === activeUseCaseId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => chooseUseCase(item.id)}
                      className={`tap-target rounded-3xl border p-5 text-left transition ${active ? "border-cyan-400/35 bg-cyan-400/10" : "border-white/8 bg-[#0a1526] hover:border-white/15 hover:bg-[#0d1a2f]"}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-black text-white">{item.title}</p>
                          <p className="mt-2 text-sm leading-7 text-slate-400">{item.desc}</p>
                        </div>
                        <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${active ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-200" : "border-white/10 text-slate-500"}`}>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="overflow-hidden rounded-[30px] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(34,211,238,0.12),rgba(7,18,32,0.96))]">
                <div className="border-b border-white/10 px-5 py-4 sm:px-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{t.currentIssue}</p>
                  <h3 className="mt-2 text-2xl font-black text-white">{activeUseCase.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{activeUseCase.routeDesc}</p>
                </div>
                <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t.recommendedChannel}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5">{renderChannelIcon(featuredChannel.icon)}</div>
                      <div>
                        <p className="text-base font-black text-white">{featuredChannel.name}</p>
                        <p className="text-sm text-cyan-300">{featuredChannel.handle}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{activeUseCase.routeTitle}</p>
                  </div>

                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t.prepare}</p>
                    <div className="space-y-3">
                      {activeUseCase.checklist.map((item) => (
                        <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                          <p className="text-sm leading-7 text-slate-300">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-amber-300/15 bg-amber-300/[0.06] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">{t.reply}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-200">{activeUseCase.response}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button type="button" onClick={() => scrollToRef(formRef)} className="tap-target inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15">{t.toForm}</button>
                    <button type="button" onClick={() => scrollToRef(channelsRef)} className="tap-target inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]">{t.toChannels}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section ref={channelsRef} className="border-y border-white/10 bg-white/[0.03] px-4 py-8 sm:py-12">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-black text-white">{t.channelsTitle}</h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-400">{t.channelsDesc}</p>
            <div className="mt-6 grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
              <div className="rounded-[30px] border border-white/10 bg-[#091425] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{t.featured}</p>
                <div className="mt-4 flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/[0.05]">{renderChannelIcon(featuredChannel.icon)}</div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-black text-white">{featuredChannel.name}</h3>
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">{featuredChannel.handle}</span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{featuredChannel.desc}</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={() => chooseChannel(featuredChannel.id)} className="tap-target inline-flex min-h-[46px] items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15">{t.pickChannel}</button>
                  {featuredChannel.href ? (
                    <a href={featuredChannel.href} target="_blank" rel="noopener noreferrer" className="tap-target inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]">
                      {t.openLink}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-[#091425] p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t.others}</p>
                <div className="mt-4 space-y-3">
                  {otherChannels.map((channel) => (
                    <div key={channel.id} className="flex flex-col gap-4 rounded-3xl border border-white/8 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black/20">{renderChannelIcon(channel.icon)}</div>
                        <div>
                          <p className="text-sm font-bold text-white">{channel.name}</p>
                          <p className="mt-1 text-sm text-slate-300">{channel.handle}</p>
                          <p className="mt-1 text-xs leading-6 text-slate-500">{channel.desc}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => chooseChannel(channel.id)} className="tap-target inline-flex min-h-[42px] items-center justify-center rounded-2xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.06]">{t.pickChannel}</button>
                        {channel.href ? (
                          <a href={channel.href} target="_blank" rel="noopener noreferrer" className="tap-target inline-flex min-h-[42px] items-center justify-center gap-1 rounded-2xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.06]">
                            {t.openLink}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-8 pb-28 sm:py-12 sm:pb-16">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.02fr_0.98fr]">
            <div ref={formRef} className="rounded-[30px] border border-amber-300/20 bg-[#0b1525] p-6 sm:p-7">
              <h2 className="text-2xl font-black text-white">{t.formTitle}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-400">{t.formDesc}</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">{t.platform} <span className="text-amber-300">*</span></label>
                  <select value={platform} onChange={(e) => setPlatform(e.target.value as FormPlatform)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-400/40">
                    <option value="">{t.platformSelect}</option>
                    <option value="telegram">Telegram</option>
                    <option value="x">X (Twitter)</option>
                    <option value="wechat">{language === "zh" ? "微信" : "WeChat"}</option>
                    <option value="email">Email</option>
                    <option value="other">{language === "zh" ? "其他" : "Other"}</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">{t.accountName} <span className="text-amber-300">*</span></label>
                  <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder={t.accountPlaceholder} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/40" />
                  <p className="mt-2 text-xs leading-6 text-slate-500">{t.accountExample}</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">{t.message}</label>
                  <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={activeUseCase.prompt || t.fallbackMessage} className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/40" />
                </div>

                <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                  <button type="button" onClick={() => setShowOptional((value) => !value)} className="tap-target flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-slate-200">
                    <span>{showOptional ? t.optionalHide : t.optionalShow}</span>
                    <ChevronRight className={`h-4 w-4 transition ${showOptional ? "rotate-90" : ""}`} />
                  </button>
                  {showOptional ? (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-white">{t.uid}</label>
                        <input type="text" value={exchangeUid} onChange={(e) => setExchangeUid(e.target.value)} placeholder={t.uidPlaceholder} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/40" />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-white">{t.userName}</label>
                        <input type="text" value={exchangeUsername} onChange={(e) => setExchangeUsername(e.target.value)} placeholder={t.userNamePlaceholder} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/40" />
                      </div>
                    </div>
                  ) : null}
                </div>

                <SendButton isPending={submitContact.isPending} label={t.submit} pendingLabel={t.submitting} />
                <p className="text-center text-xs leading-6 text-slate-500">{t.privacy}</p>
              </form>
            </div>

            <div className="space-y-6">
              <div className="rounded-[30px] border border-cyan-400/15 bg-cyan-400/[0.05] p-6">
                <div className="mb-3 flex items-center gap-2 text-cyan-300">
                  <Clock3 className="h-5 w-5" />
                  <h2 className="text-xl font-black">{t.noteTitle}</h2>
                </div>
                <p className="text-sm leading-7 text-slate-300">{t.noteDesc}</p>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-xl font-black text-white">{t.improveTitle}</h2>
                <div className="mt-4 space-y-3">
                  {t.improve.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-white/8 bg-black/15 p-4">
                      <p className="text-sm font-black text-white">{item.title}</p>
                      <p className="mt-1 text-sm leading-7 text-slate-400">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 bg-white/[0.03] px-4 py-12">
          <div className="mx-auto max-w-4xl text-center">
            <h3 className="text-2xl font-black text-white">{t.footerTitle}</h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-400">{t.footerDesc}</p>
            <a href="mailto:contact@get8.pro" className="tap-target mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition hover:text-cyan-200">
              <Mail className="h-4 w-4" />
              contact@get8.pro
            </a>
          </div>
        </footer>

        <div className="fixed inset-x-4 bottom-4 z-40 md:hidden">
          <div className="rounded-3xl border border-cyan-400/20 bg-[#071220]/95 p-3 shadow-[0_18px_50px_rgba(2,8,23,0.5)] backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">{t.mobileIssue}</p>
                <p className="truncate text-sm font-semibold text-white">{activeUseCase.title}</p>
              </div>
              <button type="button" onClick={() => scrollToRef(formRef)} className="tap-target inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15">
                {t.mobileAction}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
