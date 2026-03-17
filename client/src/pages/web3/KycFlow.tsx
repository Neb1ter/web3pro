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
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
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

  const prepCards = zh
    ? [
        { icon: "🪪", title: "准备有效证件", desc: "身份证、护照或驾照任选其一，确保未过期、四角完整、文字清晰。" },
        { icon: "📸", title: "提前确认拍摄环境", desc: "选择光线稳定、背景干净的环境，避免反光、模糊和镜头抖动。" },
        { icon: "🧾", title: "先注册好交易所账号", desc: "建议先完成邮箱或手机号注册，再进入身份认证页填写资料。" },
        { icon: "🔒", title: "使用自己的设备和网络", desc: "尽量在自己的手机或电脑上操作，不要在公共设备上上传证件。" },
      ]
    : [
        { icon: "🪪", title: "Prepare a valid ID", desc: "Use an unexpired ID card, passport, or driver license with all corners visible." },
        { icon: "📸", title: "Set up a clean shooting environment", desc: "Use steady light, a plain background, and avoid glare, blur, or camera shake." },
        { icon: "🧾", title: "Create the exchange account first", desc: "Finish email or phone registration before entering the identity verification page." },
        { icon: "🔒", title: "Use your own device and network", desc: "Upload documents on a personal phone or laptop instead of a shared or public machine." },
      ];

  const steps = zh
    ? [
        {
          step: "01",
          title: "进入 KYC 页面",
          desc: "在交易所 App 或网页的个人中心、安全中心里找到“身份认证 / Verification / KYC”入口。",
          tip: "通常会出现在头像菜单、账户设置或安全设置里。",
          color: "text-blue-400",
          border: "border-blue-500/30",
          bg: "bg-blue-500/5",
          icon: "🧭",
        },
        {
          step: "02",
          title: "填写基础身份信息",
          desc: "按要求填写姓名、国籍、证件类型、证件号码和出生日期，内容必须与证件保持一致。",
          tip: "最常见的问题是拼写顺序、日期格式和中英文姓名不一致。",
          color: "text-cyan-400",
          border: "border-cyan-500/30",
          bg: "bg-cyan-500/5",
          icon: "📝",
        },
        {
          step: "03",
          title: "上传证件正反面",
          desc: "上传清晰、无遮挡、无过度压缩的证件照片，保证信息可读，边角完整。",
          tip: "不要上传截图、二次拍屏或经过编辑的软件图片。",
          color: "text-emerald-400",
          border: "border-emerald-500/30",
          bg: "bg-emerald-500/5",
          icon: "🖼️",
        },
        {
          step: "04",
          title: "完成活体或自拍验证",
          desc: "按照页面提示做眨眼、转头、点头或自拍确认，让平台确认是真人本人操作。",
          tip: "摘掉帽子和墨镜，确保面部完整进入取景框。",
          color: "text-yellow-400",
          border: "border-yellow-500/30",
          bg: "bg-yellow-500/5",
          icon: "🧑",
        },
        {
          step: "05",
          title: "等待审核结果",
          desc: "系统审核可能几分钟完成，也可能因为高峰期或人工复核延长到数小时。",
          tip: "资料模糊、信息冲突或证件重复绑定都会拖慢进度。",
          color: "text-orange-400",
          border: "border-orange-500/30",
          bg: "bg-orange-500/5",
          icon: "⏳",
        },
        {
          step: "06",
          title: "通过后解锁更多功能",
          desc: "通过 KYC 后，通常就能使用法币入金、更高提币额度和更多交易权限。",
          tip: "部分平台还有更高等级认证，后续可按需要再升级。",
          color: "text-violet-400",
          border: "border-violet-500/30",
          bg: "bg-violet-500/5",
          icon: "✅",
        },
      ]
    : [
        {
          step: "01",
          title: "Open the KYC page",
          desc: "Find the Identity Verification, Verification, or KYC entry in the profile or security area of the exchange.",
          tip: "It is usually under the profile menu, account settings, or security center.",
          color: "text-blue-400",
          border: "border-blue-500/30",
          bg: "bg-blue-500/5",
          icon: "🧭",
        },
        {
          step: "02",
          title: "Fill in your identity details",
          desc: "Enter your legal name, nationality, document type, document number, and date of birth exactly as shown on the ID.",
          tip: "Mismatch in spelling order, date format, or middle names is a common failure point.",
          color: "text-cyan-400",
          border: "border-cyan-500/30",
          bg: "bg-cyan-500/5",
          icon: "📝",
        },
        {
          step: "03",
          title: "Upload document photos",
          desc: "Use clean, readable front and back photos with all corners visible and no heavy compression.",
          tip: "Do not upload edited images, screenshots, or photos of a screen.",
          color: "text-emerald-400",
          border: "border-emerald-500/30",
          bg: "bg-emerald-500/5",
          icon: "🖼️",
        },
        {
          step: "04",
          title: "Complete the liveness check",
          desc: "Follow the prompts for blinking, turning your head, moving the camera, or taking a selfie confirmation.",
          tip: "Remove hats and sunglasses and keep your face fully inside the frame.",
          color: "text-yellow-400",
          border: "border-yellow-500/30",
          bg: "bg-yellow-500/5",
          icon: "🧑",
        },
        {
          step: "05",
          title: "Wait for review",
          desc: "Automated review can finish in minutes, but busy periods or manual review can take several hours.",
          tip: "Blurry photos, conflicting information, or repeated document use usually slow the process down.",
          color: "text-orange-400",
          border: "border-orange-500/30",
          bg: "bg-orange-500/5",
          icon: "⏳",
        },
        {
          step: "06",
          title: "Unlock more functions",
          desc: "After approval, you usually unlock fiat funding, higher withdrawal limits, and more complete exchange access.",
          tip: "Some platforms also offer higher verification tiers that you can upgrade later.",
          color: "text-violet-400",
          border: "border-violet-500/30",
          bg: "bg-violet-500/5",
          icon: "✅",
        },
      ];

  const failurePoints = zh
    ? [
        "证件照片模糊、反光、裁边或信息被遮挡。",
        "姓名、生日、证件号与证件不一致。",
        "活体识别时光线太暗，或者面部被帽子、头发、眼镜遮挡。",
        "上传截图、拍屏图或经过修图软件处理过的文件。",
        "同一证件频繁绑定多个账户，触发平台风控。",
      ]
    : [
        "Blurry, reflective, cropped, or partially covered document photos.",
        "Name, birth date, or ID number not matching the document.",
        "Poor lighting or partial face coverage during the liveness check.",
        "Uploading screenshots, edited files, or photos of a screen.",
        "Repeatedly binding the same document to multiple accounts and triggering risk controls.",
      ];

  const safetyNotes = zh
    ? [
        "只在交易所官方 App 或官方域名里完成 KYC，不要通过陌生链接上传证件。",
        "不要把自拍、证件照或验证码发给所谓“私聊客服”账号。",
        "如果平台要求补交材料，先确认通知来自官方邮件或站内消息。",
      ]
    : [
        "Only complete KYC inside the official app or official domain.",
        "Never send selfies, document photos, or one-time codes to unofficial support accounts.",
        "If extra files are requested, verify that the request came from an official email or in-app notice first.",
      ];

  return (
    <div className="min-h-screen bg-[#050D1A] text-white" style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.6s ease" }}>
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#050D1A]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <button type="button" onClick={() => window.history.back()} className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {zh ? "返回上一页" : "Back"}
          </button>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-cyan-500/30 bg-cyan-500/20 px-2.5 py-1 text-xs text-cyan-400 sm:inline-flex">
              {zh ? "实操 · 第 07 章" : "Hands-on · Chapter 07"}
            </span>
            <Web3ChapterNav currentChapterId="kyc-flow" />
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-4 py-12 pb-20">
        <FadeIn className="mb-12">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-400">
            {zh ? "🪪 第七章：KYC 实名流程" : "🪪 Chapter 7: KYC verification flow"}
          </div>
          <h1 className="mb-4 text-4xl font-black leading-tight sm:text-5xl">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent">
              {zh ? "KYC" : "KYC"}
            </span>{" "}
            {zh ? "实名验证流程" : "verification walkthrough"}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-slate-400">
            {zh
              ? "如果你准备从交易所进入 Web3，这一章就是最实用的过渡步骤。我们把材料准备、上传规则、审核节奏、常见失败点和安全提醒集中整理好，让你先看懂，再去提交。"
              : "If you plan to enter Web3 through an exchange, this chapter covers the most practical verification step. It pulls together the prep list, upload rules, review rhythm, common rejection reasons, and safety reminders in one place."}
          </p>
        </FadeIn>

        <FadeIn className="mb-8">
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
            <h2 className="mb-4 text-xl font-black text-cyan-400">
              {zh ? "为什么交易所要做 KYC？" : "Why do exchanges require KYC?"}
            </h2>
            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              {zh
                ? "KYC 的本质是平台识别用户真实身份的流程，用来满足反洗钱、反欺诈、法币通道合规和账户安全要求。对普通用户来说，它的实际意义是：通过之后，账户更安全，法币入金和提币额度更完整，很多主流功能也会随之解锁。"
                : "KYC is the process exchanges use to verify real user identity. It supports anti-fraud, anti-money-laundering, fiat compliance, and account security requirements. For most users, passing KYC means a safer account, more complete fiat access, higher limits, and broader exchange functionality."}
            </p>
          </div>
        </FadeIn>

        <FadeIn className="mb-10">
          <h2 className="mb-5 text-2xl font-black text-white">
            {zh ? "提交前先准备这四件事" : "Prepare these four things first"}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {prepCards.map((item) => (
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
            {zh ? "KYC 的 6 步完整流程" : "The 6-step KYC flow"}
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
              {zh ? "最常见的审核失败原因" : "The most common review failures"}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {failurePoints.map((item) => (
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
              {zh ? "上传证件前的安全提醒" : "Safety reminders before uploading documents"}
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
                  ? "如果你已经看懂了 KYC 这一章，下一步就可以去看完整的交易所入门页，继续选择平台、注册账户、入金和第一次买币。"
                  : "Once the KYC flow feels clear, you can continue into the full exchange onboarding page and move on to platform selection, registration, funding, and the first trade."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Link href="/web3-guide/exchange-guide" className="tap-target block">
                <div className="rounded-2xl border border-emerald-500/20 bg-black/20 p-5 text-center transition-colors hover:bg-emerald-500/10">
                  <div className="mb-2 text-2xl">🏦</div>
                  <h3 className="mb-1 text-sm font-bold text-white">
                    {zh ? "继续第八章：交易所入门" : "Continue to Chapter 8: Exchange starter guide"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {zh ? "继续看交易所对比、注册步骤和新手上手路径。" : "Move forward into exchange selection, registration, and beginner onboarding."}
                  </p>
                </div>
              </Link>

              <Link href="/crypto-saving" className="tap-target block">
                <div className="rounded-2xl border border-yellow-500/20 bg-black/20 p-5 text-center transition-colors hover:bg-yellow-500/10">
                  <div className="mb-2 text-2xl">💰</div>
                  <h3 className="mb-1 text-sm font-bold text-white">
                    {zh ? "看返佣与注册入口" : "Open rebate and registration links"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {zh ? "完成 KYC 之后，就可以衔接法币入金与交易流程。" : "After KYC, you can move directly into fiat funding and trading."}
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
