import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, ChevronRight, Download, ExternalLink, ImagePlus, Shield } from "lucide-react";
import { SeoManager } from "@/components/SeoManager";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { useExchangeLinks } from "@/contexts/ExchangeLinksContext";
import { goBack, useScrollMemory } from "@/hooks/useScrollMemory";

type ExchangeSlug = "gate" | "okx" | "binance" | "bybit" | "bitget";
type FlowMode = "partner" | "official";

type ExchangeMeta = {
  name: string;
  accent: string;
  officialSignup: string;
  officialDownload: string;
  blockerZh: string[];
  blockerEn: string[];
};

type GuideStep = {
  titleZh: string;
  titleEn: string;
  bodyZh: string;
  bodyEn: string;
  visualTitleZh: string;
  visualTitleEn: string;
  visualHintZh: string;
  visualHintEn: string;
};

const FALLBACK_INVITE = "getitpro";

const EXCHANGES: Record<ExchangeSlug, ExchangeMeta> = {
  gate: {
    name: "Gate.io",
    accent: "#00B173",
    officialSignup: "https://www.gate.com/signup",
    officialDownload: "https://www.gate.com/mobileapp",
    blockerZh: [
      "\u8bf7\u5148\u786e\u8ba4\u4f60\u6253\u5f00\u7684\u662f Gate \u5b98\u65b9\u57df\u540d\u3002",
      "\u63d0\u4ea4\u524d\u518d\u68c0\u67e5\u4e00\u904d Referral code \u662f\u5426\u5df2\u5e26\u5165\u3002",
      "\u5f00\u59cb KYC \u524d\u5148\u51c6\u5907\u8bc1\u4ef6\u548c\u7a33\u5b9a\u5149\u7ebf\u3002",
    ],
    blockerEn: [
      "Confirm that you are on Gate's official domain first.",
      "Double-check the referral field before you submit the form.",
      "Prepare your ID and stable lighting before starting KYC.",
    ],
  },
  okx: {
    name: "OKX",
    accent: "#7EA7FF",
    officialSignup: "https://www.okx.com/account/register",
    officialDownload: "https://www.okx.com/download",
    blockerZh: [
      "\u90e8\u5206\u5730\u533a\u7684 App Store \u5165\u53e3\u53d7\u9650\uff0c\u4f18\u5148\u53c2\u8003 OKX \u5b98\u7f51\u4e0b\u8f7d\u9875\u3002",
      "\u9080\u8bf7\u7801\u4e00\u822c\u4e0d\u80fd\u5728\u6ce8\u518c\u540e\u8865\u586b\u3002",
      "\u5982\u679c\u5207\u5230 App \u5185\u7ee7\u7eed\u6ce8\u518c\uff0c\u8bf7\u91cd\u65b0\u68c0\u67e5 Referral code\u3002",
    ],
    blockerEn: [
      "In some regions the App Store entry is limited, so use the official OKX download page first.",
      "The referral code usually cannot be added after registration.",
      "If you continue in the app, re-check the referral code there.",
    ],
  },
  binance: {
    name: "Binance",
    accent: "#F0B90B",
    officialSignup: "https://accounts.binance.com/register",
    officialDownload: "https://www.binance.com/download",
    blockerZh: [
      "\u4e0d\u8981\u4ece\u5e7f\u544a\u9875\u6216\u77ed\u94fe\u5165\u53e3\u8df3\u8f6c\uff0c\u907f\u514d\u4e22\u6389\u9080\u8bf7\u7801\u3002",
      "\u9080\u8bf7\u7801\u680f\u6709\u65f6\u9ed8\u8ba4\u6298\u53e0\uff0c\u63d0\u4ea4\u524d\u9700\u8981\u624b\u52a8\u5c55\u5f00\u786e\u8ba4\u3002",
      "\u90e8\u5206\u5730\u533a\u4e0b\u8f7d\u5165\u53e3\u53d7\u9650\uff0c\u4ee5\u5b98\u7f51\u8bf4\u660e\u4e3a\u51c6\u3002",
    ],
    blockerEn: [
      "Avoid ad pages or short links so the referral context is not lost.",
      "The referral field may be collapsed by default.",
      "In some regions, app access is limited and the official page should be treated as the source of truth.",
    ],
  },
  bybit: {
    name: "Bybit",
    accent: "#6EA8FF",
    officialSignup: "https://www.bybit.com/register",
    officialDownload: "https://www.bybit.com/download",
    blockerZh: [
      "\u6ce8\u518c\u5b8c\u6210\u540e\u901a\u5e38\u4e0d\u80fd\u8865\u5f55\u9080\u8bf7\u7801\uff0c\u6240\u4ee5\u521b\u5efa\u8d26\u6237\u524d\u8981\u5148\u68c0\u67e5\u3002",
      "\u5982\u679c\u5148\u5728 App \u5185\u7ee7\u7eed\u6ce8\u518c\uff0c\u8bf7\u518d\u786e\u8ba4\u4e00\u6b21\u9080\u8bf7\u7801\u3002",
      "\u4e0b\u8f7d\u524d\u8bf7\u6838\u5bf9\u5b98\u65b9\u56fe\u6807\u548c\u5f00\u53d1\u8005\u4fe1\u606f\u3002",
    ],
    blockerEn: [
      "The code usually cannot be added after registration, so verify it before creating the account.",
      "If you continue in the app, re-check the referral field there too.",
      "Verify the official icon and developer information before downloading.",
    ],
  },
  bitget: {
    name: "Bitget",
    accent: "#9C6CFF",
    officialSignup: "https://www.bitget.com/account/register",
    officialDownload: "https://www.bitget.com/download",
    blockerZh: [
      "\u4e0d\u8981\u4ece\u6765\u8def\u4e0d\u660e\u7684\u955c\u50cf\u7ad9\u4e0b\u8f7d\u3002",
      "\u6d4f\u89c8\u5668\u81ea\u52a8\u7ffb\u8bd1\u65f6\uff0c\u8bf7\u5148\u786e\u8ba4 Invite code \u6216 Referral code \u5b57\u6bb5\u4f4d\u7f6e\u6ca1\u53d8\u3002",
      "\u65e7\u8d26\u6237\u901a\u5e38\u65e0\u6cd5\u8865\u5f55\u9080\u8bf7\u7801\uff0c\u9996\u6b21\u6ce8\u518c\u9700\u8981\u68c0\u67e5\u6e05\u695a\u3002",
    ],
    blockerEn: [
      "Do not download from unofficial mirrors.",
      "If the browser auto-translates the page, verify the referral field position first.",
      "Existing accounts usually cannot add the code later, so check carefully on first registration.",
    ],
  },
};

function readQuery() {
  if (typeof window === "undefined") {
    return { exchange: "gate" as ExchangeSlug, mode: "partner" as FlowMode };
  }
  const params = new URLSearchParams(window.location.search);
  const rawExchange = params.get("exchange") || "gate";
  const rawMode = params.get("mode") || "partner";
  return {
    exchange: (["gate", "okx", "binance", "bybit", "bitget"].includes(rawExchange) ? rawExchange : "gate") as ExchangeSlug,
    mode: (rawMode === "official" ? "official" : "partner") as FlowMode,
  };
}

export default function ExchangeDownload() {
  useScrollMemory();
  const { language } = useLanguage();
  const zh = language === "zh";
  const { getReferralLink, getInviteCode, getRebateRate } = useExchangeLinks();
  const initial = readQuery();
  const [exchange, setExchange] = useState<ExchangeSlug>(initial.exchange);
  const [mode, setMode] = useState<FlowMode>(initial.mode);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.set("exchange", exchange);
    params.set("mode", mode);
    const hash = window.location.hash || "#registration-guide";
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}${hash}`);
  }, [exchange, mode]);

  const meta = EXCHANGES[exchange];
  const inviteCode = getInviteCode(exchange) || FALLBACK_INVITE;
  const rebateRate = getRebateRate(exchange);
  const partnerLink = getReferralLink(exchange);
  const primaryHref = mode === "partner" ? partnerLink : meta.officialSignup;
  const primaryLabel =
    zh
      ? mode === "partner"
        ? "\u524d\u5f80\u5b98\u65b9\u5408\u4f5c\u94fe\u63a5"
        : "\u524d\u5f80\u5b98\u7f51\u6ce8\u518c\u94fe\u63a5"
      : mode === "partner"
        ? "Open official partner sign-up link"
        : "Open official registration link";

  const steps = useMemo<GuideStep[]>(() => {
    if (exchange === "gate") {
      if (mode === "partner") {
        return [
          {
            titleZh: "\u5148\u786e\u8ba4 Gate \u5b98\u7f51\u9875\u9762",
            titleEn: "Confirm the official Gate page first",
            bodyZh: "\u5148\u901a\u8fc7\u6211\u4eec\u63d0\u4f9b\u7684\u5b98\u65b9\u5408\u4f5c\u94fe\u63a5\u8fdb\u5165 Gate\uff0c\u5148\u770b\u57df\u540d\u662f gate.com\uff0c\u518d\u7ee7\u7eed\u6ce8\u518c\u3002",
            bodyEn: "Open Gate through the official partner link we provide and confirm the domain is gate.com before you continue.",
            visualTitleZh: "\u7d20\u6750 1\uff1a\u5b98\u7f51\u9996\u9875\u4e0e\u57df\u540d",
            visualTitleEn: "Asset 1: Official homepage and domain",
            visualHintZh: "\u653e\u4f60\u7684 Gate \u5b98\u7f51\u9996\u9875\u7d20\u6750\uff0c\u91cd\u70b9\u662f\u8ba9\u7528\u6237\u770b\u5230 gate.com \u8fd9\u4e2a\u5730\u5740\u3002",
            visualHintEn: "Place the homepage screenshot here and highlight gate.com in the address bar.",
          },
          {
            titleZh: "\u8fdb\u5165\u6ce8\u518c\u9875\u540e\u68c0\u67e5\u9080\u8bf7\u7801",
            titleEn: "Check the invite field on the sign-up page",
            bodyZh: "\u6253\u5f00\u6ce8\u518c\u9875\u540e\uff0c\u5148\u5c55\u5f00\u9080\u8bf7\u7801\u4f4d\u7f6e\u3002\u5982\u679c\u6ca1\u6709\u81ea\u52a8\u5e26\u5165\uff0c\u5c31\u624b\u52a8\u586b\u5199 getitpro\u3002",
            bodyEn: "Open the registration form and expand the invite field. If the code is not prefilled, enter getitpro manually.",
            visualTitleZh: "\u7d20\u6750 2\uff1a\u9080\u8bf7\u7801\u586b\u5199\u4f4d\u7f6e",
            visualTitleEn: "Asset 2: Invite code field",
            visualHintZh: "\u7528\u56fe\u7247\u628a getitpro \u5e94\u8be5\u586b\u5165\u7684\u4f4d\u7f6e\u5708\u51fa\u6765\u3002",
            visualHintEn: "Use the screenshot that shows where getitpro should be entered.",
          },
          {
            titleZh: "\u5b8c\u6210\u6ce8\u518c\u540e\u518d\u4e0b\u8f7d App",
            titleEn: "Download the app after registration",
            bodyZh: "\u6ce8\u518c\u6210\u529f\u540e\uff0c\u518d\u56de\u5230 Gate \u5b98\u65b9\u4e0b\u8f7d\u5165\u53e3\uff0c\u6309\u4f60\u7684\u8bbe\u5907\u7cfb\u7edf\u9009\u62e9 App \u4e0b\u8f7d\u3002",
            bodyEn: "After registration, return to the official Gate download page and pick the app version that matches your device.",
            visualTitleZh: "\u7d20\u6750 3\uff1a\u5b98\u65b9\u4e0b\u8f7d\u5165\u53e3",
            visualTitleEn: "Asset 3: Official download entry",
            visualHintZh: "\u653e\u4e0b\u8f7d\u5165\u53e3\u622a\u56fe\uff0c\u8ba9\u7528\u6237\u77e5\u9053\u4e0b\u4e00\u6b65\u53bb\u54ea\u91cc\u5b89\u88c5\u3002",
            visualHintEn: "Place the official download entry screenshot here.",
          },
        ];
      }

      return [
        {
          titleZh: "\u5148\u786e\u8ba4\u4f60\u6253\u5f00\u7684\u662f Gate \u5b98\u7f51",
          titleEn: "Confirm that you are on the official Gate site",
          bodyZh: "\u76f4\u63a5\u6253\u5f00 Gate \u5b98\u7f51\u539f\u751f\u6ce8\u518c\u9875\u4e4b\u524d\uff0c\u5148\u770b\u57df\u540d\u662f gate.com\uff0c\u518d\u5f00\u59cb\u586b\u5199\u8d26\u53f7\u4fe1\u606f\u3002",
          bodyEn: "Before continuing, confirm the domain is gate.com and that you are on the official registration page.",
          visualTitleZh: "\u7d20\u6750 1\uff1a\u5b98\u7f51\u9996\u9875\u4e0e\u57df\u540d",
          visualTitleEn: "Asset 1: Official homepage and domain",
          visualHintZh: "\u7528 Gate \u5b98\u7f51\u622a\u56fe\u8ba9\u7528\u6237\u5148\u5b66\u4f1a\u8fa8\u8ba4\u6b63\u786e\u57df\u540d\u3002",
          visualHintEn: "Use the Gate homepage screenshot to show the correct official domain.",
        },
        {
          titleZh: "\u5c55\u5f00\u9080\u8bf7\u7801\u4f4d\u7f6e\u5e76\u624b\u52a8\u586b\u5199",
          titleEn: "Expand the invite field and enter the code",
          bodyZh: "\u5728 Gate \u539f\u751f\u6ce8\u518c\u8868\u5355\u91cc\uff0c\u627e\u5230 Invite code \u6216 Referral code \u4f4d\u7f6e\uff0c\u624b\u52a8\u8f93\u5165 getitpro\u3002",
          bodyEn: "On Gate's native registration form, find the Invite code or Referral code field and enter getitpro manually.",
          visualTitleZh: "\u7d20\u6750 2\uff1a\u586b\u5199 getitpro",
          visualTitleEn: "Asset 2: Enter getitpro",
          visualHintZh: "\u7528\u7ea2\u6846\u7a81\u51fa getitpro \u8fd9\u4e2a\u4f4d\u7f6e\uff0c\u8ba9\u7528\u6237\u4e00\u773c\u5c31\u80fd\u5bf9\u4e0a\u3002",
          visualHintEn: "Highlight the getitpro field so users can match it at a glance.",
        },
        {
          titleZh: "\u5b8c\u6210\u6ce8\u518c\u540e\u518d\u4e0b\u8f7d",
          titleEn: "Download after the account is created",
          bodyZh: "\u8d26\u53f7\u521b\u5efa\u6210\u529f\u540e\uff0c\u518d\u4ece Gate \u5b98\u7f51\u6216\u5b98\u65b9\u4e0b\u8f7d\u9875\u7ee7\u7eed\u4e0b\u8f7d\u3002",
          bodyEn: "Once the account is created, continue from the official Gate download page.",
          visualTitleZh: "\u7d20\u6750 3\uff1a\u5b98\u65b9\u4e0b\u8f7d\u5165\u53e3",
          visualTitleEn: "Asset 3: Official download entry",
          visualHintZh: "\u7528\u4e0b\u8f7d\u5165\u53e3\u622a\u56fe\u544a\u8bc9\u7528\u6237\u8981\u4ece\u54ea\u4e2a\u5b98\u7f51\u533a\u57df\u7ee7\u7eed\u4e0b\u8f7d\u3002",
          visualHintEn: "Show where the user should continue for the official download.",
        },
      ];
    }

    return mode === "partner"
      ? [
          {
            titleZh: `\u5148\u901a\u8fc7 ${meta.name} \u5b98\u65b9\u5408\u4f5c\u94fe\u63a5\u8fdb\u5165`,
            titleEn: `Enter through the official ${meta.name} partner link`,
            bodyZh: "\u5148\u68c0\u67e5\u8df3\u8f6c\u540e\u7684\u9875\u9762\u662f\u5426\u4ecd\u5728\u5b98\u65b9\u57df\u540d\u4e0b\uff0c\u7136\u540e\u518d\u586b\u5199\u6ce8\u518c\u4fe1\u606f\u3002",
            bodyEn: "Confirm that the redirected page still uses the official domain before you continue.",
            visualTitleZh: "\u622a\u56fe 1\uff1a\u5b98\u65b9\u6ce8\u518c\u5165\u53e3",
            visualTitleEn: "Screenshot 1: Official sign-up entry",
            visualHintZh: "\u53ef\u4ee5\u653e\u5b98\u7f51\u6ce8\u518c\u9875\u6216\u5408\u4f5c\u8df3\u8f6c\u9875\u7684\u622a\u56fe\u3002",
            visualHintEn: "Place the sign-up entry screenshot here.",
          },
          {
            titleZh: "\u786e\u8ba4\u9080\u8bf7\u7801\u4f4d\u7f6e",
            titleEn: "Confirm the referral field",
            bodyZh: `\u5982\u679c\u7cfb\u7edf\u6ca1\u6709\u81ea\u52a8\u5e26\u5165\uff0c\u624b\u52a8\u586b\u5199 ${inviteCode}\u3002`,
            bodyEn: `If the field is not prefilled, enter ${inviteCode} manually.`,
            visualTitleZh: "\u622a\u56fe 2\uff1a\u9080\u8bf7\u7801\u533a\u57df",
            visualTitleEn: "Screenshot 2: Referral field",
            visualHintZh: "\u5c06\u9080\u8bf7\u7801\u683c\u5b50\u5708\u51fa\u6765\uff0c\u8ba9\u7528\u6237\u4e0d\u7528\u731c\u3002",
            visualHintEn: "Highlight the field so users can match it quickly.",
          },
          {
            titleZh: "\u6ce8\u518c\u540e\u518d\u8fdb\u5165\u5b98\u65b9\u4e0b\u8f7d",
            titleEn: "Open the official download page after registration",
            bodyZh: "\u5b8c\u6210\u6ce8\u518c\u518d\u4e0b\u8f7d App\uff0c\u6d41\u7a0b\u4f1a\u66f4\u7ebf\u6027\u3002",
            bodyEn: "Finish sign-up first, then move to the official download page.",
            visualTitleZh: "\u622a\u56fe 3\uff1a\u4e0b\u8f7d\u5165\u53e3",
            visualTitleEn: "Screenshot 3: Download entry",
            visualHintZh: "\u7528\u5b98\u65b9\u4e0b\u8f7d\u9875\u622a\u56fe\u4f5c\u4e3a\u6700\u540e\u4e00\u6b65\u7684\u5bf9\u7167\u3002",
            visualHintEn: "Use the official download page screenshot as the last visual step.",
          },
        ]
      : [
          {
            titleZh: `\u6253\u5f00 ${meta.name} \u5b98\u7f51\u539f\u751f\u6ce8\u518c\u9875`,
            titleEn: `Open ${meta.name}'s native registration page`,
            bodyZh: "\u5148\u6838\u5bf9\u5b98\u7f51\u57df\u540d\u548c\u9875\u9762\u62ac\u5934\uff0c\u518d\u5f00\u59cb\u586b\u5199\u8d26\u53f7\u4fe1\u606f\u3002",
            bodyEn: "Confirm the official domain and page header, then start filling in your account details.",
            visualTitleZh: "\u622a\u56fe 1\uff1a\u5b98\u7f51\u6ce8\u518c\u9875",
            visualTitleEn: "Screenshot 1: Native registration page",
            visualHintZh: "\u653e\u5b98\u7f51\u539f\u751f\u6ce8\u518c\u9875\u7684\u622a\u56fe\u3002",
            visualHintEn: "Place the official native registration page screenshot here.",
          },
          {
            titleZh: "\u627e\u5230\u9080\u8bf7\u7801\u4f4d\u7f6e\u5e76\u586b\u5199",
            titleEn: "Locate the referral field and enter the code",
            bodyZh: `\u5c06 ${inviteCode} \u586b\u5165 Referral code \u6216 Invite code \u4f4d\u7f6e\uff0c\u518d\u7ee7\u7eed\u9a8c\u8bc1\u6d41\u7a0b\u3002`,
            bodyEn: `Enter ${inviteCode} in the referral field before continuing.`,
            visualTitleZh: "\u622a\u56fe 2\uff1a\u9080\u8bf7\u7801\u586b\u5199",
            visualTitleEn: "Screenshot 2: Enter the referral code",
            visualHintZh: "\u7528\u622a\u56fe\u628a\u9080\u8bf7\u7801\u4f4d\u7f6e\u5708\u51fa\u6765\u3002",
            visualHintEn: "Use a marked screenshot to show the exact field position.",
          },
          {
            titleZh: "\u5b8c\u6210\u6ce8\u518c\u540e\u518d\u4e0b\u8f7d",
            titleEn: "Download after the account is created",
            bodyZh: "\u8d26\u53f7\u521b\u5efa\u6210\u529f\u540e\uff0c\u518d\u4ece\u5b98\u65b9\u4e0b\u8f7d\u9875\u6216 App \u5165\u53e3\u7ee7\u7eed\u3002",
            bodyEn: "After registration, continue from the official download page or app entry.",
            visualTitleZh: "\u622a\u56fe 3\uff1a\u5b98\u65b9\u4e0b\u8f7d",
            visualTitleEn: "Screenshot 3: Official download",
            visualHintZh: "\u4f7f\u7528\u5b98\u65b9\u4e0b\u8f7d\u9875\u6216 App \u5165\u53e3\u622a\u56fe\u3002",
            visualHintEn: "Use the official download page or app entry screenshot.",
          },
        ];
  }, [exchange, inviteCode, meta.name, mode]);

  const pathCards = [
    {
      key: "partner" as const,
      title: zh ? "\u4f7f\u7528\u6211\u4eec\u63d0\u4f9b\u7684\u5b98\u65b9\u5408\u4f5c\u94fe\u63a5" : "Use the official partner link we provide",
      body: zh
        ? "\u9002\u5408\u60f3\u76f4\u63a5\u8fdb\u5165\u5e26\u9080\u8bf7\u4fe1\u606f\u7684\u5b98\u65b9\u6ce8\u518c\u9875\u3002"
        : "Best when you want the official sign-up page with referral context already attached.",
    },
    {
      key: "official" as const,
      title: zh ? "\u4ece\u5b98\u7f51\u539f\u751f\u9875\u9762\u6ce8\u518c" : "Use the native official registration page",
      body: zh
        ? "\u9002\u5408\u60f3\u5148\u8d70\u5b98\u7f51\u539f\u751f\u6ce8\u518c\u9875\uff0c\u518d\u624b\u52a8\u586b\u9080\u8bf7\u7801\u7684\u7528\u6237\u3002"
        : "Best when you prefer the exchange's native sign-up page and want to enter the code manually.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#081a30] text-white">
      <SeoManager
        title={zh ? "\u4ea4\u6613\u6240\u6ce8\u518c\u4e0e\u4e0b\u8f7d\u6559\u7a0b | Get8 Pro" : "Exchange registration and download guide | Get8 Pro"}
        description={
          zh
            ? "\u5728\u4e00\u4e2a\u9875\u9762\u5b8c\u6210\u4ea4\u6613\u6240\u9009\u62e9\u3001\u6ce8\u518c\u8def\u5f84\u9009\u62e9\u3001\u9080\u8bf7\u7801\u586b\u5199\u4e0e\u5b98\u65b9\u4e0b\u8f7d\u6559\u7a0b\u3002"
            : "Choose an exchange, select a registration path, confirm the invite code, and follow the official download tutorial in one place."
        }
        path="/exchange-download"
      />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#081a30]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <button type="button" onClick={() => goBack()} className="tap-target inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            {zh ? "\u8fd4\u56de" : "Back"}
          </button>
          <div className="text-sm font-semibold text-slate-300">
            {zh ? "\u4ea4\u6613\u6240\u6ce8\u518c\u4e0e\u4e0b\u8f7d\u6559\u7a0b" : "Exchange registration and download guide"}
          </div>
          <Link href="/" className="tap-target text-sm text-slate-400 transition hover:text-white">
            {zh ? "\u9996\u9875" : "Home"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5 sm:py-8">
        <section className="overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(135deg,#071424_0%,#0b2140_52%,#081a30_100%)]">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="border-b border-white/8 px-5 py-6 lg:border-b-0 lg:border-r lg:px-7 lg:py-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 px-3 py-1 text-[11px] font-semibold text-slate-300">
                <Shield className="h-4 w-4 text-cyan-300" />
                <span>{zh ? "\u53c2\u8003\u4ea4\u6613\u6240\u5e2e\u52a9\u4e2d\u5fc3\u7684\u7ebf\u6027\u6559\u7a0b\u601d\u8def" : "Inspired by exchange help-center tutorials"}</span>
              </div>
              <h1 className="mt-4 max-w-lg text-[2rem] font-black leading-tight tracking-tight text-white sm:text-[2.4rem]">
                {zh ? "\u4ea4\u6613\u6240\u6ce8\u518c\u4e0e\u4e0b\u8f7d\u6559\u7a0b" : "Exchange registration and download guide"}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                {zh
                  ? "\u4f7f\u7528\u300c\u5148\u8fa8\u8ba4\u5b98\u7f51\uff0c\u518d\u786e\u8ba4\u9080\u8bf7\u7801\uff0c\u6700\u540e\u518d\u4e0b\u8f7d\u300d\u7684\u987a\u5e8f\uff0c\u8ba9\u7528\u6237\u5728\u624b\u673a\u4e0a\u4e5f\u80fd\u6309\u4e00\u6761\u7ebf\u770b\u5b8c\u3002"
                  : "Follow a simple order: confirm the official site, confirm the invite field, then move to the download step."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">{zh ? "\u5148\u770b\u57df\u540d" : "Check the domain first"}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">{zh ? "\u518d\u770b\u9080\u8bf7\u7801" : "Then check the invite field"}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">{zh ? "\u6700\u540e\u518d\u4e0b\u8f7d" : "Download last"}</span>
              </div>
            </div>

            <div className="bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] px-5 py-6 lg:px-7 lg:py-7">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full border border-white/10" style={{ background: `radial-gradient(circle at 35% 35%, ${meta.accent}, rgba(255,255,255,0.05))` }} />
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{zh ? "\u5f53\u524d\u6559\u7a0b" : "Current guide"}</p>
                  <h2 className="mt-1 text-2xl font-black text-white">{meta.name}</h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <span className="text-sm text-slate-300">{zh ? "\u6ce8\u518c\u8def\u5f84" : "Path"}</span>
                  <span className="text-sm font-semibold text-white">
                    {mode === "partner"
                      ? zh
                        ? "\u5b98\u65b9\u5408\u4f5c"
                        : "Partner link"
                      : zh
                        ? "\u5b98\u7f51\u624b\u52a8\u586b\u7801"
                        : "Manual official"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <span className="text-sm text-slate-300">{zh ? "\u9080\u8bf7\u7801" : "Invite code"}</span>
                  <span className="text-sm font-black text-white">{inviteCode}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <span className="text-sm text-slate-300">{zh ? "\u9ed8\u8ba4\u8fd4\u4f63" : "Default rebate"}</span>
                  <span className="text-sm font-black text-yellow-300">{rebateRate}</span>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-3.5 py-3 text-sm leading-6 text-amber-100">
                {zh
                  ? mode === "partner"
                    ? `\u5982\u679c\u8df3\u8f6c\u540e\u6ca1\u6709\u81ea\u52a8\u5e26\u5165\uff0c\u624b\u52a8\u586b ${inviteCode}\u3002`
                    : `\u8d70\u5b98\u7f51\u539f\u751f\u9875\u65f6\uff0c\u8bb0\u5f97\u5728 Invite code \u4f4d\u7f6e\u586b ${inviteCode}\u3002`
                  : mode === "partner"
                    ? `If the partner page does not prefill the code, enter ${inviteCode} manually.`
                    : `On the native official page, remember to enter ${inviteCode} in the invite field.`}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <a
                  href={primaryHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-black transition hover:scale-[1.01]"
                  style={{ background: meta.accent }}
                >
                  {primaryLabel}
                  <ExternalLink className="h-4 w-4" />
                </a>
                <a
                  href={meta.officialDownload}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {zh ? "\u5b98\u65b9\u4e0b\u8f7d" : "Official download"}
                  <Download className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="registration-guide" className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{zh ? "\u7b2c\u4e00\u6bb5" : "Part 1"}</p>
              <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">{zh ? "\u5148\u628a\u9009\u62e9\u786e\u5b9a" : "Lock in the choices first"}</h2>
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                {(Object.keys(EXCHANGES) as ExchangeSlug[]).map((slug) => {
                  const item = EXCHANGES[slug];
                  const active = slug === exchange;
                  return (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => setExchange(slug)}
                      className={`tap-target rounded-[18px] border px-3.5 py-3.5 text-left transition ${active ? "border-white/40 bg-white/[0.09] shadow-[0_12px_30px_rgba(15,23,42,0.18)]" : "border-white/10 bg-black/15 hover:bg-white/[0.05]"}`}
                    >
                      <div className="h-7 w-7 rounded-full" style={{ background: `radial-gradient(circle at 30% 30%, ${item.accent}, rgba(255,255,255,0.08))` }} />
                      <h3 className="mt-3 text-base font-black leading-none text-white">{item.name}</h3>
                      <div className="mt-2 inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-1 text-[10px] font-bold text-yellow-300">
                        {zh ? `\u9ed8\u8ba4\u8fd4\u4f63 ${rebateRate}` : `Default rebate ${rebateRate}`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{zh ? "\u7b2c\u4e8c\u6bb5" : "Part 2"}</p>
              <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">{zh ? "\u518d\u9009\u6ce8\u518c\u65b9\u5f0f" : "Then choose the registration method"}</h2>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {pathCards.map((item) => {
                  const active = item.key === mode;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setMode(item.key)}
                      className={`tap-target rounded-[18px] border px-4 py-4 text-left transition ${active ? "border-white/40 bg-white/[0.09]" : "border-white/10 bg-black/15 hover:bg-white/[0.05]"}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-black text-white">{item.title}</p>
                          <p className="mt-2 text-[13px] leading-6 text-slate-300">{item.body}</p>
                        </div>
                        {active ? (
                          <span className="mt-1 shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold text-black" style={{ background: meta.accent }}>
                            {zh ? "\u5f53\u524d\u8def\u5f84" : "Current"}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.15))] p-4 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[0.34fr_0.66fr]">
            <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{zh ? "\u5f53\u524d\u8bbe\u7f6e" : "Current setup"}</p>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">{zh ? "\u4ea4\u6613\u6240" : "Exchange"}</span>
                    <span className="text-sm font-black text-white">{meta.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">{zh ? "\u8def\u5f84" : "Path"}</span>
                    <span className="text-sm font-semibold text-white">
                      {mode === "partner"
                        ? zh
                          ? "\u5b98\u65b9\u5408\u4f5c"
                          : "Partner link"
                        : zh
                          ? "\u5b98\u7f51\u624b\u52a8"
                          : "Manual official"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">{zh ? "\u9080\u8bf7\u7801" : "Code"}</span>
                    <span className="text-sm font-black text-white">{inviteCode}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{zh ? "\u5e38\u89c1\u5361\u70b9" : "Watch for these"}</p>
                <div className="mt-3 space-y-3">
                  {(zh ? meta.blockerZh : meta.blockerEn).map((item) => (
                    <div key={item} className="flex items-start gap-2.5 text-sm leading-6 text-slate-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: meta.accent }} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{zh ? "\u7b2c\u4e09\u6bb5" : "Part 3"}</p>
                <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">{zh ? "\u8ddf\u7740\u6559\u7a0b\u987a\u5e8f\u8d70" : "Follow the guide in order"}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                  {zh
                    ? "\u6bcf\u6b65\u53ea\u505a\u4e00\u4ef6\u4e8b\uff0c\u53f3\u4fa7\u7684\u622a\u56fe\u4e5f\u53ea\u7528\u6765\u8bf4\u660e\u5f53\u524d\u8fd9\u4e00\u6b65\uff0c\u907f\u514d\u7528\u6237\u4e0a\u4e0b\u5bf9\u7167\u65f6\u5931\u53bb\u4e0a\u4e0b\u6587\u3002"
                    : "One action per step, with one screenshot that only explains that exact moment."}
                </p>
              </div>

              <div className="relative space-y-5 before:absolute before:left-[17px] before:top-3 before:bottom-3 before:w-px before:bg-white/12">
                {steps.map((step, index) => (
                  <div key={`${step.titleZh}-${index}`} className="relative pl-11">
                    <div
                      className="absolute left-0 top-1.5 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-sm font-black text-black"
                      style={{ background: meta.accent }}
                    >
                      {index + 1}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-black text-white">{zh ? step.titleZh : step.titleEn}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-200">{zh ? step.bodyZh : step.bodyEn}</p>
                      </div>

                      <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[#0a0f18]">
                        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                          <div>
                            <p className="text-sm font-bold text-white">{zh ? step.visualTitleZh : step.visualTitleEn}</p>
                            <p className="mt-1 text-xs text-slate-500">{zh ? "\u5bf9\u5e94\u5f53\u524d\u6b65\u9aa4\u7684\u5b98\u65b9\u622a\u56fe" : "Official screenshot for this step"}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-500" />
                        </div>
                        <div className="grid gap-0 lg:grid-cols-[0.58fr_0.42fr]">
                          <div className="border-b border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-4 lg:border-b-0 lg:border-r">
                            <div className="flex aspect-[16/9] items-center justify-center rounded-[20px] border border-dashed border-white/10 bg-white/[0.04]">
                              <div className="max-w-[18rem] text-center">
                                <ImagePlus className="mx-auto h-6 w-6 text-slate-500" />
                                <p className="mt-3 text-sm font-semibold text-slate-200">{zh ? step.visualTitleZh : step.visualTitleEn}</p>
                                <p className="mt-2 text-xs leading-6 text-slate-500">{zh ? step.visualHintZh : step.visualHintEn}</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{zh ? "\u64cd\u4f5c\u8981\u70b9" : "What to check"}</p>
                            <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
                              <li className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: meta.accent }} />
                                <span>{zh ? step.bodyZh : step.bodyEn}</span>
                              </li>
                              <li className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: meta.accent }} />
                                <span>
                                  {zh
                                    ? "\u622a\u56fe\u53ea\u670d\u52a1\u8fd9\u4e00\u6b65\uff0c\u4e0d\u8981\u628a\u4e0d\u540c\u6d41\u7a0b\u7684\u56fe\u6df7\u5728\u4e00\u5f20\u91cc\u3002"
                                    : "Keep the screenshot focused on this one step instead of mixing multiple moments together."}
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[22px] border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{zh ? "\u9875\u9762\u7ed3\u5c3e" : "Wrap-up"}</p>
            <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">{zh ? "\u4e34\u70b9\u51fb\u524d\u518d\u770b\u4e00\u904d" : "One last check before you click through"}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-black text-white">{zh ? "\u57df\u540d" : "Domain"}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{zh ? "\u786e\u8ba4\u662f\u5b98\u65b9\u57df\u540d\uff0c\u4e0d\u8981\u8df3\u5230\u955c\u50cf\u9875\u6216\u4e0d\u660e\u7f51\u7ad9\u3002" : "Confirm the official domain and avoid mirrors or unclear sites."}</p>
              </div>
              <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-black text-white">{zh ? "\u9080\u8bf7\u7801" : "Invite code"}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{zh ? `\u5982\u679c\u6ca1\u6709\u81ea\u52a8\u5e26\u5165\uff0c\u624b\u52a8\u586b ${inviteCode}\u3002` : `If it is not prefilled, enter ${inviteCode} manually.`}</p>
              </div>
              <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-black text-white">{zh ? "\u4e0b\u8f7d\u65f6\u673a" : "Download timing"}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{zh ? "\u5148\u5b8c\u6210\u6ce8\u518c\uff0c\u518d\u56de\u5230\u5b98\u65b9\u4e0b\u8f7d\u5165\u53e3\u3002" : "Finish registration first, then move to the official download entry."}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <ScrollToTopButton color="cyan" />
    </div>
  );
}
