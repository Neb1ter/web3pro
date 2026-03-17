import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import Web3ChapterNav from "@/components/Web3ChapterNav";
import { useScrollMemory } from "@/hooks/useScrollMemory";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { useLanguage } from "@/contexts/LanguageContext";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        obs.disconnect();
      }
    }, { threshold: 0.1 });

    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(24px)",
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function KycFlow() {
  useScrollMemory();
  const { language } = useLanguage();
  const zh = language === "zh";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 50);
    return () => window.clearTimeout(timer);
  }, []);

  const checklist = zh
    ? [
        { icon: "🪪", title: "有效身份证件", desc: "准备身份证、护照或驾照，确保证件清晰、未过期、四角完整。" },
        { icon: "📱", title: "稳定的拍摄环境", desc: "光线充足、背景干净，避免逆光、反光和镜头抖动。" },
        { icon: "📧", title: "已注册交易所账号", desc: "先完成邮箱或手机号注册，再进入 KYC 页面填写资料。" },
        { icon: "🔐", title: "安全网络与设备", desc: "尽量用自己的手机或电脑操作，不在网吧或陌生设备上上传资料。" },
      ]
    : [
        { icon: "🪪", title: "Valid ID", desc: "Prepare a clear, unexpired ID card, passport, or driver license with all corners visible." },
        { icon: "📱", title: "Stable shooting setup", desc: "Use good lighting and a clean background. Avoid glare, blur, and backlight." },
        { icon: "📧", title: "Registered exchange account", desc: "Create your exchange account first, then enter the KYC flow from the security or verification page." },
        { icon: "🔐", title: "Trusted device and network", desc: "Use your own phone or laptop whenever possible and avoid uploading documents on public devices." },
      ];

  const steps = zh
    ? [
        { step: "01", title: "进入实名认证页面", desc: "在交易所 App 或网页的账户安全中心找到“身份认证 / KYC / Verification”入口。", tip: "通常在头像、账户设置或安全中心里。", color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/5", icon: "🧭" },
        { step: "02", title: "填写基础身份信息", desc: "按要求填写姓名、国籍、证件类型和证件号码，信息必须与证件完全一致。", tip: "中英文姓名、拼写顺序和生日格式都不要填错。", color: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500/5", icon: "📝" },
        { step: "03", title: "上传证件正反面", desc: "根据页面提示上传证件照片，确保文字清楚、无遮挡、无过度压缩。", tip: "不要裁掉边角，也不要在图片上加水印。", color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/5", icon: "📤" },
        { step: "04", title: "进行活体或自拍验证", desc: "按照提示完成人脸识别、眨眼、摇头或自拍动作，确保是真人本人操作。", tip: "摘掉帽子和墨镜，保持面部完整进入取景框。", color: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/5", icon: "🧑‍💻" },
        { step: "05", title: "等待平台审核", desc: "提交后等待系统或人工审核，快则几分钟，慢则数小时到 1 天左右。", tip: "高峰期、证件不清晰或资料冲突时会更慢。", color: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/5", icon: "⏳" },
        { step: "06", title: "通过后解锁法币功能", desc: "审核通过后，你通常就能使用法币入金、提币额度提升和更多交易功能。", tip: "有些平台还会分级认证，后续可按需升级。", color: "text-violet-400", border: "border-violet-500/30", bg: "bg-violet-500/5", icon: "✅" },
      ]
    : [
        { step: "01", title: "Open the verification page", desc: "Find the “Identity Verification”, “KYC”, or “Verification” entry in your exchange account settings or security center.", tip: "It is usually under the profile menu, account settings, or security area.", color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/5", icon: "🧭" },
        { step: "02", title: "Fill in identity details", desc: "Enter your legal name, nationality, document type, and ID number exactly as shown on the document.", tip: "Do not mismatch spelling order, date format, or middle names.", color: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500/5", icon: "📝" },
        { step: "03", title: "Upload document photos", desc: "Upload the front and back of your ID with clean, readable images and no missing corners.", tip: "Avoid heavy compression, watermarks, or edited screenshots.", color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/5", icon: "📤" },
        { step: "04", title: "Complete selfie or liveness check", desc: "Follow the prompts for face capture, head movement, blinking, or selfie confirmation so the exchange can verify you are the real person.", tip: "Remove hats and sunglasses and keep your face fully inside the frame.", color: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/5", icon: "🧑‍💻" },
        { step: "05", title: "Wait for review", desc: "Reviews may finish in minutes or take several hours depending on traffic, clarity, and whether manual review is needed.", tip: "Peak traffic, blurry uploads, or inconsistent info usually slow things down.", color: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/5", icon: "⏳" },
        { step: "06", title: "Unlock fiat and advanced functions", desc: "Once approved, you usually unlock fiat deposit channels, higher withdrawal limits, and broader exchange features.", tip: "Some exchanges use tiered verification and let you upgrade later if needed.", color: "text-violet-400", border: "border-violet-500/30", bg: "bg-violet-500/5", icon: "✅" },
      ];

  const failures = zh
    ? [
        "证件照片模糊、反光、边角不完整。",
        "姓名、生日、证件号填写和证件不一致。",
        "活体识别环境太暗，或面部被遮挡。",
        "使用截图、翻拍屏幕或经过编辑的图片提交。",
        "同一证件频繁绑定多个账户，触发风控审核。",
      ]
    : [
        "Blurry, reflective, or cropped document photos.",
        "Name, birth date, or document number not matching the ID.",
        "Poor lighting or partial face coverage during the liveness check.",
        "Submitting screenshots, edited images, or photos of a screen.",
        "Using the same document repeatedly across multiple accounts and triggering risk controls.",
      ];

  const safetyNotes = zh
    ? [
        "只在官方 App 或官方域名页面进行 KYC，不要通过陌生链接上传证件。",
        "不要把自拍、证件照或验证码发给“客服私聊”账号。",
        "如果页面要求额外资料，先核验是否为交易所官方通知。",
      ]
    : [
        "Only complete KYC inside the official app or official domain.",
        "Never send document photos or verification codes to unofficial support accounts.",
        "If extra materials are requested, verify the request is from the official exchange channel first.",
      ];

  return (
    <div className="min-h-screen bg-[#050D1A] text-white" style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.6s ease" }}>
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#050D1A]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {zh ? "返回上一页" : "Back"}
          </button>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-cyan-500/30 bg-cyan-500/20 px-2.5 py-1 text-xs text-cyan-400 sm:inline-flex">
              {zh ? "实操补充 · KYC" : "Hands-on extra · KYC"}
            </span>
            <Web3ChapterNav currentChapterId="exchange-guide" />
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-4 py-12 pb-20">
        <FadeIn className="mb-12">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-400">
            {zh ? "🪪 KYC 实名流程" : "🪪 KYC verification flow"}
          </div>
          <h1 className="mb-4 text-4xl font-black leading-tight sm:text-5xl">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent">
              {zh ? "KYC" : "KYC"}
            </span>{" "}
            {zh ? "实名认证流程" : "verification walkthrough"}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-slate-400">
            {zh
              ? "如果你准备从交易所迈出 Web3 第一步，KYC 实名认证通常是必须经过的一关。这个页面按新手视角把准备材料、提交流程、常见失败原因和安全注意事项梳理清楚。"
              : "If you plan to start from a centralized exchange, KYC is often the first operational step. This page breaks down the preparation, submission flow, common rejection reasons, and safety notes in a beginner-friendly way."}
          </p>
        </FadeIn>

        <FadeIn className="mb-8">
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
            <h2 className="mb-4 text-xl font-black text-cyan-400">
              {zh ? "💡 为什么交易所要做 KYC？" : "💡 Why do exchanges require KYC?"}
            </h2>
            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              {zh
                ? "KYC（Know Your Customer）本质上是平台识别用户身份的流程，用来满足反洗钱、反欺诈、账户安全和法币通道合规要求。对普通用户来说，它的实际意义是：通过认证后，账号更安全，法币入金和提现额度更完整，很多主流功能也会随之解锁。"
                : "KYC stands for “Know Your Customer”. Exchanges use it to meet anti-fraud, anti-money-laundering, and fiat compliance requirements. In practical terms, passing KYC usually makes your account more secure and unlocks fiat channels, higher limits, and more complete trading access."}
            </p>
          </div>
        </FadeIn>

        <FadeIn className="mb-10">
          <h2 className="mb-5 text-2xl font-black text-white">
            {zh ? "🧰 提交前准备清单" : "🧰 Pre-submission checklist"}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {checklist.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/8 bg-slate-900/50 p-5">
                <div className="mb-3 text-3xl">{item.icon}</div>
                <h3 className="mb-2 text-base font-black text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        <FadeIn className="mb-10">
          <h2 className="mb-5 text-2xl font-black text-white">
            {zh ? "🪜 KYC 实名 6 步流程" : "🪜 6-step KYC flow"}
          </h2>
          <div className="space-y-4">
            {steps.map((item, index) => (
              <FadeIn key={item.step} delay={index * 80}>
                <div className={`rounded-2xl border ${item.border} ${item.bg} p-5 sm:p-6`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 flex-shrink-0 text-center text-3xl font-black leading-none opacity-30 ${item.color}`}>
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <h3 className={`text-base font-bold sm:text-lg ${item.color}`}>{item.title}</h3>
                      </div>
                      <p className="mb-3 text-sm leading-relaxed text-slate-300">{item.desc}</p>
                      <div className={`inline-flex rounded-full border px-3 py-1 text-xs ${item.border} ${item.color}`}>
                        {zh ? `提示：${item.tip}` : `Tip: ${item.tip}`}
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </FadeIn>

        <FadeIn className="mb-10">
          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6">
            <h2 className="mb-4 text-xl font-black text-orange-400">
              {zh ? "🚫 最常见的审核失败原因" : "🚫 Most common review failures"}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {failures.map((item) => (
                <div key={item} className="flex items-start gap-2 rounded-xl border border-white/8 bg-black/20 p-4 text-sm text-slate-300">
                  <span className="mt-0.5 flex-shrink-0 text-orange-400">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        <FadeIn className="mb-12">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <h2 className="mb-4 text-xl font-black text-red-400">
              {zh ? "🛡️ 上传证件前的安全提醒" : "🛡️ Safety reminders before uploading documents"}
            </h2>
            <div className="space-y-2">
              {safetyNotes.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="mt-0.5 flex-shrink-0 text-red-400">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        <FadeIn>
          <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-8">
            <div className="mb-6 text-center">
              <div className="mb-3 text-4xl">🚀</div>
              <h2 className="mb-2 text-2xl font-black text-white">
                {zh ? "准备继续下一步了吗？" : "Ready for the next step?"}
              </h2>
              <p className="mx-auto max-w-lg text-sm leading-relaxed text-slate-400">
                {zh
                  ? "如果你已经理解了 KYC 流程，下一步就可以去看完整的交易所入门页，或者直接通过合作链接去注册并完成后续操作。"
                  : "Once the KYC flow feels clear, you can continue into the full exchange onboarding page or jump to the partner registration links and move forward."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Link href="/web3-guide/exchange-guide" className="tap-target block">
                <div className="rounded-2xl border border-emerald-500/20 bg-black/20 p-5 text-center transition-colors hover:bg-emerald-500/10">
                  <div className="mb-2 text-2xl">🏦</div>
                  <h3 className="mb-1 text-sm font-bold text-white">
                    {zh ? "返回交易所入门指南" : "Back to exchange starter guide"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {zh ? "继续看交易所对比、注册和使用路径" : "Continue with exchange selection and onboarding"}
                  </p>
                </div>
              </Link>
              <Link href="/crypto-saving" className="tap-target block">
                <div className="rounded-2xl border border-yellow-500/20 bg-black/20 p-5 text-center transition-colors hover:bg-yellow-500/10">
                  <div className="mb-2 text-2xl">🎁</div>
                  <h3 className="mb-1 text-sm font-bold text-white">
                    {zh ? "查看返佣与注册入口" : "Open rebate and registration links"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {zh ? "完成 KYC 后衔接法币入金与交易" : "Move from verification into fiat onboarding and trading"}
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>

      <ScrollToTopButton color="emerald" />
    </div>
  );
}
