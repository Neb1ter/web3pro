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

type UseCase = {
  id: UseCaseId;
  title: string;
  desc: string;
  recommendedChannel: ChannelId;
  details: string[];
  prompt: string;
};

type Channel = {
  id: ChannelId;
  name: string;
  handle: string;
  desc: string;
  href?: string;
};

const DiscordIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-indigo-500">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const copy = {
  zh: {
    seoTitle: "联系 Get8 Pro | 更清晰的移动端支持页",
    seoDesc: "先选问题，再看推荐渠道，最后提交必要信息，减少来回翻看。",
    back: "返回上一页",
    badge: "联系与支持",
    title: "简单内容简单显示，复杂问题再展开说明",
    subtitle: "这页专门按移动端高效浏览重做。先做选择，再看大块详情，不再一开始堆满长卡片和深色内容。",
    step1: "先选事项",
    step2: "再看渠道",
    step3: "最后提交",
    issueTitle: "你现在想处理什么",
    issueHint: "只保留高频入口，先快速定位，再展开当前事项的完整说明。",
    summaryTitle: "当前事项",
    detailsTitle: "建议先准备",
    focusTitle: "推荐处理方式",
    chooseForm: "去填资料",
    chooseChannels: "查看渠道",
    channelsTitle: "推荐联系渠道",
    channelsDesc: "优先把最适合的渠道放在上面，其它方式只保留为补充入口。",
    formTitle: "提交你的基本信息",
    formDesc: "先填写必要字段。可选信息默认收起，避免手机端一次看到太多内容。",
    platform: "联系平台",
    platformSelect: "请选择联系平台",
    accountName: "你的账号名称",
    accountPlaceholder: "填写你在该平台上的用户名",
    accountExample: "例如 Telegram @username、微信号或邮箱地址",
    message: "补充说明",
    messageFallback: "简要说明你的问题、当前状态和你想确认的内容",
    optionalShow: "展开可选信息",
    optionalHide: "收起可选信息",
    uid: "交易所 UID（可选）",
    uidPlaceholder: "如果有，可以填写 UID",
    username: "交易所用户名（可选）",
    usernamePlaceholder: "如果有，可以填写注册用户名",
    submit: "提交信息",
    submitting: "提交中...",
    success: "提交成功，我们会尽快联系你。",
    failed: "提交失败，请稍后重试",
    required: "请先填写必填项。",
    noteTitle: "填写建议",
    note1: "简单问题先写结论，例如你想绑定哪家交易所、是否已注册。",
    note2: "复杂需求再补背景，例如额度、限制、当前账号状态。",
    note3: "如果你有更稳定的联系方式，可以在可选信息里补充。",
    mobileCurrent: "当前事项",
    mobileAction: "去填资料",
  },
  en: {
    seoTitle: "Contact Get8 Pro | Cleaner Mobile Support",
    seoDesc: "Choose the issue first, see the recommended channel, then submit the key details.",
    back: "Back",
    badge: "Contact & Support",
    title: "Show the simple parts simply, expand only the complex parts",
    subtitle: "This page is redesigned for faster mobile browsing. Choose first, then open the larger detail areas only when you need them.",
    step1: "Pick issue",
    step2: "See channel",
    step3: "Submit info",
    issueTitle: "What do you want to handle right now",
    issueHint: "High-frequency entry points stay short and scannable. The selected issue gets the larger explanation area.",
    summaryTitle: "Current issue",
    detailsTitle: "Prepare first",
    focusTitle: "Recommended path",
    chooseForm: "Go to form",
    chooseChannels: "See channels",
    channelsTitle: "Recommended contact channels",
    channelsDesc: "The best-fit channel stays at the top. Other options remain available as secondary paths.",
    formTitle: "Submit the basics",
    formDesc: "Show the required inputs first. Optional details stay collapsed so the page remains easy to scan on mobile.",
    platform: "Contact Platform",
    platformSelect: "Select a contact platform",
    accountName: "Your Account Name",
    accountPlaceholder: "Enter your username on that platform",
    accountExample: "For example: Telegram @username, WeChat ID, or an email address",
    message: "Additional Notes",
    messageFallback: "Briefly describe your issue, current status, and what you want to confirm",
    optionalShow: "Show optional fields",
    optionalHide: "Hide optional fields",
    uid: "Exchange UID (Optional)",
    uidPlaceholder: "If available, enter your UID",
    username: "Exchange Username (Optional)",
    usernamePlaceholder: "If available, enter your registered username",
    submit: "Submit Information",
    submitting: "Submitting...",
    success: "Submitted successfully. We will follow up soon.",
    failed: "Submission failed, please try again later.",
    required: "Please fill in the required fields first.",
    noteTitle: "What to include",
    note1: "For simple issues, state the goal first, such as the exchange you want to use.",
    note2: "For complex requests, add context like account status, limit, or platform requirements.",
    note3: "If you have a more stable contact method, add it in the optional fields.",
    mobileCurrent: "Current issue",
    mobileAction: "Go to form",
  },
} as const;

function renderChannelIcon(icon: ChannelId) {
  switch (icon) {
    case "telegram":
      return <MessageCircle className="h-5 w-5 text-sky-600" />;
    case "x":
      return <Twitter className="h-5 w-5 text-slate-700" />;
    case "wechat":
      return <Phone className="h-5 w-5 text-emerald-600" />;
    case "email":
      return <Mail className="h-5 w-5 text-amber-600" />;
    case "discord":
      return <DiscordIcon />;
    default:
      return <UserRound className="h-5 w-5 text-slate-700" />;
  }
}

function toPlatform(channelId: ChannelId): FormPlatform {
  return channelId === "discord" ? "other" : channelId;
}

function SubmitButton({ isPending, label, pendingLabel }: { isPending: boolean; label: string; pendingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="tap-target flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isPending ? pendingLabel : label}
    </button>
  );
}

function SectionPill({ index, label }: { index: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] text-white">{index}</span>
      {label}
    </div>
  );
}

export default function Contact() {
  const { language, setLanguage } = useLanguage();
  const t = language === "zh" ? copy.zh : copy.en;
  useScrollMemory();

  const channelsRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  const [activeUseCaseId, setActiveUseCaseId] = useState<UseCaseId>("new-user");
  const [platform, setPlatform] = useState<FormPlatform>("telegram");
  const [accountName, setAccountName] = useState("");
  const [exchangeUid, setExchangeUid] = useState("");
  const [exchangeUsername, setExchangeUsername] = useState("");
  const [message, setMessage] = useState("");
  const [showOptional, setShowOptional] = useState(false);

  const useCases: Record<UseCaseId, UseCase> = {
    "new-user": {
      id: "new-user",
      title: language === "zh" ? "新用户返佣配置" : "New-user rebate setup",
      desc: language === "zh" ? "先确认默认方案、注册链接和基础流程。" : "Confirm the default setup, signup link, and the basic flow first.",
      recommendedChannel: "telegram",
      details:
        language === "zh"
          ? ["你打算使用哪家交易所", "是否已经注册过账号", "是否还需要更高额度或额外方案"]
          : ["Which exchange you plan to use", "Whether you already registered", "Whether you also need a higher-tier plan"],
      prompt:
        language === "zh"
          ? "我准备注册 ______，想确认默认返佣方案和注册链接。"
          : "I plan to register on ______ and want to confirm the default rebate setup and signup link.",
    },
    "existing-account": {
      id: "existing-account",
      title: language === "zh" ? "老账号限制确认" : "Existing-account limits",
      desc: language === "zh" ? "先看账号状态，再决定是否还有可行路径。" : "Check the current account status before deciding the next workable path.",
      recommendedChannel: "wechat",
      details:
        language === "zh"
          ? ["准备好 UID 或注册用户名", "说明账号是否完成 KYC", "说明你是要确认限制还是询问替代方案"]
          : ["Prepare your UID or username", "State whether KYC is completed", "Clarify whether you need a limit check or an alternative path"],
      prompt:
        language === "zh"
          ? "我已经有 ______ 账号，UID / 用户名是 ______，想确认现在还能怎么处理。"
          : "I already have an account on ______. My UID / username is ______ and I want to know what path is still possible.",
    },
    "higher-tier": {
      id: "higher-tier",
      title: language === "zh" ? "更高额度或其他平台" : "Higher tier or other platforms",
      desc: language === "zh" ? "这类需求通常更复杂，建议直接进入完整沟通。" : "These cases are usually more complex and should move into a fuller conversation quickly.",
      recommendedChannel: "email",
      details:
        language === "zh"
          ? ["目标平台或目标额度", "你的大致交易规模或使用背景", "你最稳定的联系方法"]
          : ["Target platform or target tier", "Your approximate trading size or context", "Your most stable contact method"],
      prompt:
        language === "zh"
          ? "我想咨询 ______ 平台 / 更高额度方案，主要需求是 ______。"
          : "I want to discuss ______ exchange / a higher-tier plan. My main request is ______.",
    },
    "content-feedback": {
      id: "content-feedback",
      title: language === "zh" ? "内容修正与合作" : "Corrections and cooperation",
      desc: language === "zh" ? "页面问题、链接异常或合作需求都走这里。" : "Use this for page issues, broken links, and cooperation requests.",
      recommendedChannel: "email",
      details:
        language === "zh"
          ? ["指出具体页面、链接或内容位置", "说明你发现的问题或合作方向", "如果有时效要求，请直接标注"]
          : ["Point to the exact page, link, or content block", "Describe the issue or cooperation direction", "Mark urgency directly if timing matters"],
      prompt:
        language === "zh"
          ? "我想反馈 / 沟通 ______，相关页面或内容是 ______。"
          : "I want to report or discuss ______ on page / content ______.",
    },
  };

  const channels: Channel[] = [
    {
      id: "telegram",
      name: "Telegram",
      handle: language === "zh" ? "私信咨询" : "Direct message",
      desc: language === "zh" ? "适合返佣、路径确认和快速沟通。" : "Best for rebates, path checks, and fast follow-up.",
    },
    {
      id: "wechat",
      name: language === "zh" ? "微信" : "WeChat",
      handle: language === "zh" ? "联系 Get8 Pro" : "Contact Get8 Pro",
      desc: language === "zh" ? "适合中文环境下的持续沟通。" : "Good for sustained Chinese-language communication.",
    },
    {
      id: "email",
      name: "Email",
      handle: "contact@get8.pro",
      desc: language === "zh" ? "适合详细需求、合作和修正反馈。" : "Best for detailed requests, cooperation, and corrections.",
      href: "mailto:contact@get8.pro",
    },
    {
      id: "x",
      name: "X (Twitter)",
      handle: language === "zh" ? "发送私信" : "Send a DM",
      desc: language === "zh" ? "适合作为补充入口使用。" : "Useful as a secondary contact path.",
    },
    {
      id: "discord",
      name: "Discord",
      handle: "discord.gg/wgvetpH6Un",
      desc: language === "zh" ? "适合进入社区继续交流。" : "Useful for continued community discussion.",
      href: "https://discord.gg/wgvetpH6Un",
    },
  ];

  const activeUseCase = useCases[activeUseCaseId];
  const featuredChannel = channels.find((item) => item.id === activeUseCase.recommendedChannel) ?? channels[0];
  const otherChannels = channels.filter((item) => item.id !== featuredChannel.id);

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

  const scrollToSection = (ref: RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleUseCaseSelect = (id: UseCaseId) => {
    setActiveUseCaseId(id);
    setPlatform(toPlatform(useCases[id].recommendedChannel));
  };

  const handleChannelSelect = (channelId: ChannelId) => {
    setPlatform(toPlatform(channelId));
    scrollToSection(formRef);
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
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <nav className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <button
              type="button"
              onClick={goBack}
              className="tap-target inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.back}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLanguage("zh")}
                className={`tap-target rounded-xl px-3 py-2 text-sm font-medium transition ${
                  language === "zh" ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-900"
                }`}
              >
                中文
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`tap-target rounded-xl px-3 py-2 text-sm font-medium transition ${
                  language === "en" ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-900"
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </nav>

        <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f4f9ff_100%)] px-4 py-10 sm:py-14">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-12 top-8 h-40 w-40 rounded-full bg-sky-100 blur-3xl" />
            <div className="absolute left-[-3rem] top-20 h-28 w-28 rounded-full bg-cyan-100 blur-3xl" />
            <svg
              aria-hidden="true"
              viewBox="0 0 520 220"
              className="absolute right-0 top-0 h-full w-[70%] min-w-[260px] text-sky-200/70"
            >
              <path d="M24 82H178L224 36H356L410 90H496" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M54 162H196L248 116H332L388 168H476" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="178" cy="82" r="6" fill="currentColor" />
              <circle cx="224" cy="36" r="6" fill="currentColor" />
              <circle cx="410" cy="90" r="6" fill="currentColor" />
              <circle cx="248" cy="116" r="6" fill="currentColor" />
              <circle cx="388" cy="168" r="6" fill="currentColor" />
            </svg>
          </div>

          <div className="relative mx-auto max-w-6xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t.badge}
            </div>

            <h1 className="max-w-3xl text-3xl font-black leading-tight text-slate-950 sm:text-5xl">{t.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">{t.subtitle}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <SectionPill index="1" label={t.step1} />
              <SectionPill index="2" label={t.step2} />
              <SectionPill index="3" label={t.step3} />
            </div>
          </div>
        </section>

        <section className="px-4 py-8 sm:py-12">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-2xl font-black text-slate-950">{t.issueTitle}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">{t.issueHint}</p>

              <div className="mt-6 space-y-3">
                {Object.values(useCases).map((item) => {
                  const active = item.id === activeUseCaseId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleUseCaseSelect(item.id)}
                      className={`tap-target flex w-full items-start justify-between gap-4 rounded-3xl border px-5 py-4 text-left transition ${
                        active
                          ? "border-sky-200 bg-sky-50 text-slate-950 shadow-[0_10px_30px_rgba(14,165,233,0.08)]"
                          : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      <div>
                        <p className="text-base font-black">{item.title}</p>
                        <p className={`mt-1 text-sm leading-7 ${active ? "text-slate-600" : "text-slate-500"}`}>{item.desc}</p>
                      </div>
                      <ChevronRight className={`mt-1 h-4 w-4 shrink-0 ${active ? "text-sky-600" : "text-slate-400"}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t.summaryTitle}</p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">{activeUseCase.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{activeUseCase.desc}</p>

              <div className="mt-6 grid gap-4 md:grid-cols-[1fr_0.9fr]">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t.detailsTitle}</p>
                  <div className="mt-3 space-y-3">
                    {activeUseCase.details.map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <p className="text-sm leading-7 text-slate-700">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-sky-100 bg-[linear-gradient(180deg,#f0f9ff_0%,#ffffff_100%)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t.focusTitle}</p>
                  <div className="mt-3 flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                      {renderChannelIcon(featuredChannel.id)}
                    </div>
                    <div>
                      <p className="text-base font-black text-slate-950">{featuredChannel.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{featuredChannel.handle}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{featuredChannel.desc}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => scrollToSection(formRef)}
                  className="tap-target rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                >
                  {t.chooseForm}
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection(channelsRef)}
                  className="tap-target rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                >
                  {t.chooseChannels}
                </button>
              </div>
            </div>
          </div>
        </section>
        <section ref={channelsRef} className="border-y border-slate-200 bg-white px-4 py-8 sm:py-12">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-black text-slate-950">{t.channelsTitle}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">{t.channelsDesc}</p>

            <div className="mt-6 grid gap-3 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="rounded-[28px] border border-sky-100 bg-[linear-gradient(180deg,#f8fcff_0%,#ffffff_100%)] p-6 shadow-[0_12px_40px_rgba(14,165,233,0.06)]">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">{renderChannelIcon(featuredChannel.id)}</div>
                  <div className="min-w-0">
                    <p className="text-lg font-black text-slate-950">{featuredChannel.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{featuredChannel.handle}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{featuredChannel.desc}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleChannelSelect(featuredChannel.id)}
                    className="tap-target rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                  >
                    {t.chooseForm}
                  </button>
                  {featuredChannel.href ? (
                    <a
                      href={featuredChannel.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tap-target inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                    >
                      {t.chooseChannels}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <div className="space-y-3">
                  {otherChannels.map((channel) => (
                    <div key={channel.id} className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-4 py-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100">
                          {renderChannelIcon(channel.id)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900">{channel.name}</p>
                          <p className="mt-1 truncate text-sm text-slate-500">{channel.handle}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleChannelSelect(channel.id)}
                        className="tap-target shrink-0 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                      >
                        {t.chooseForm}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-8 pb-28 sm:py-12 sm:pb-16">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_0.86fr]">
            <div ref={formRef} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-7">
              <h2 className="text-2xl font-black text-slate-950">{t.formTitle}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">{t.formDesc}</p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    {t.platform} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as FormPlatform)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400"
                  >
                    <option value="">{t.platformSelect}</option>
                    <option value="telegram">Telegram</option>
                    <option value="x">X (Twitter)</option>
                    <option value="wechat">{language === "zh" ? "微信" : "WeChat"}</option>
                    <option value="email">Email</option>
                    <option value="other">{language === "zh" ? "其他" : "Other"}</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    {t.accountName} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder={t.accountPlaceholder}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400"
                  />
                  <p className="mt-2 text-xs leading-6 text-slate-500">{t.accountExample}</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">{t.message}</label>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={activeUseCase.prompt || t.messageFallback}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400"
                  />
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <button
                    type="button"
                    onClick={() => setShowOptional((value) => !value)}
                    className="tap-target flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-slate-700"
                  >
                    <span>{showOptional ? t.optionalHide : t.optionalShow}</span>
                    <ChevronRight className={`h-4 w-4 transition ${showOptional ? "rotate-90" : ""}`} />
                  </button>

                  {showOptional ? (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-900">{t.uid}</label>
                        <input
                          type="text"
                          value={exchangeUid}
                          onChange={(e) => setExchangeUid(e.target.value)}
                          placeholder={t.uidPlaceholder}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-900">{t.username}</label>
                        <input
                          type="text"
                          value={exchangeUsername}
                          onChange={(e) => setExchangeUsername(e.target.value)}
                          placeholder={t.usernamePlaceholder}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                <SubmitButton isPending={submitContact.isPending} label={t.submit} pendingLabel={t.submitting} />
              </form>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white p-6 sm:p-7">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>

              <h2 className="text-2xl font-black text-slate-950">{t.noteTitle}</h2>
              <div className="mt-5 space-y-4">
                {[t.note1, t.note2, t.note3].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="text-sm leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="fixed inset-x-4 bottom-4 z-40 md:hidden">
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{t.mobileCurrent}</p>
                <p className="truncate text-sm font-semibold text-slate-900">{activeUseCase.title}</p>
              </div>

              <button
                type="button"
                onClick={() => scrollToSection(formRef)}
                className="tap-target rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                {t.mobileAction}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
