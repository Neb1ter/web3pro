import type { Language } from "@/lib/i18n";

export type LocalizedText = {
  zh: string;
  en: string;
};

export type Web3Chapter = {
  id: string;
  path: string;
  num: string;
  icon: string;
  color: string;
  borderColor: string;
  activeBg: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  badge: LocalizedText;
};

export const WEB3_CHAPTERS: Web3Chapter[] = [
  {
    id: "what-is-web3",
    path: "/web3-guide/what-is-web3",
    num: "01",
    icon: "🌐",
    color: "text-emerald-400",
    borderColor: "border-emerald-500/40",
    activeBg: "bg-emerald-500/15",
    title: { zh: "什么是 Web3", en: "What Is Web3" },
    subtitle: { zh: "互联网的第三次进化", en: "The third evolution of the internet" },
    badge: { zh: "入门", en: "Basics" },
  },
  {
    id: "blockchain-basics",
    path: "/web3-guide/blockchain-basics",
    num: "02",
    icon: "⛓️",
    color: "text-blue-400",
    borderColor: "border-blue-500/40",
    activeBg: "bg-blue-500/15",
    title: { zh: "区块链基础", en: "Blockchain Basics" },
    subtitle: { zh: "支撑 Web3 的底层技术", en: "The core technology behind Web3" },
    badge: { zh: "进阶", en: "Advanced" },
  },
  {
    id: "wallet-keys",
    path: "/web3-guide/wallet-keys",
    num: "03",
    icon: "🔐",
    color: "text-violet-400",
    borderColor: "border-violet-500/40",
    activeBg: "bg-violet-500/15",
    title: { zh: "钱包与私钥", en: "Wallets and Private Keys" },
    subtitle: { zh: "你的数字资产保险箱", en: "Your digital asset vault" },
    badge: { zh: "进阶", en: "Advanced" },
  },
  {
    id: "defi-deep",
    path: "/web3-guide/defi-deep",
    num: "04",
    icon: "💸",
    color: "text-yellow-400",
    borderColor: "border-yellow-500/40",
    activeBg: "bg-yellow-500/15",
    title: { zh: "DeFi 深度解析", en: "Deep Dive into DeFi" },
    subtitle: { zh: "去中心化金融的世界", en: "The world of decentralized finance" },
    badge: { zh: "进阶", en: "Advanced" },
  },
  {
    id: "economic-opportunity",
    path: "/web3-guide/economic-opportunity",
    num: "05",
    icon: "📈",
    color: "text-orange-400",
    borderColor: "border-orange-500/40",
    activeBg: "bg-orange-500/15",
    title: { zh: "经济形势与 Web3 机会", en: "Macro Trends and Web3 Opportunities" },
    subtitle: { zh: "现实压力中的新机会", en: "New opportunities amid real-world pressure" },
    badge: { zh: "核心", en: "Core" },
  },
  {
    id: "investment-gateway",
    path: "/web3-guide/investment-gateway",
    num: "06",
    icon: "🚪",
    color: "text-rose-400",
    borderColor: "border-rose-500/40",
    activeBg: "bg-rose-500/15",
    title: { zh: "参与 Web3 的门槛", en: "Your Gateway to Web3" },
    subtitle: { zh: "CEX、DEX 与链上参与方式", en: "CEX, DEX, and on-chain participation" },
    badge: { zh: "核心", en: "Core" },
  },
  {
    id: "kyc-flow",
    path: "/web3-guide/kyc-flow",
    num: "07",
    icon: "🪪",
    color: "text-cyan-400",
    borderColor: "border-cyan-500/40",
    activeBg: "bg-cyan-500/15",
    title: { zh: "KYC 实名流程", en: "KYC Verification Flow" },
    subtitle: { zh: "完成认证前要准备什么", en: "What to prepare before verification" },
    badge: { zh: "实操", en: "Hands-on" },
  },
  {
    id: "exchange-guide",
    path: "/web3-guide/exchange-guide",
    num: "08",
    icon: "🏦",
    color: "text-teal-400",
    borderColor: "border-teal-500/40",
    activeBg: "bg-teal-500/15",
    title: { zh: "交易所入门指南", en: "Exchange Starter Guide" },
    subtitle: { zh: "迈出 Web3 的第一步", en: "Take your first step into Web3" },
    badge: { zh: "实操", en: "Hands-on" },
  },
];

export const WEB3_GUIDE_SECTIONS = [
  { id: "intro", icon: "🌐", label: { zh: "什么是 Web3", en: "What Is Web3" } },
  { id: "blockchain", icon: "⛓️", label: { zh: "区块链基础", en: "Blockchain Basics" } },
  { id: "defi", icon: "💸", label: { zh: "DeFi 金融", en: "DeFi" } },
  { id: "economy", icon: "📈", label: { zh: "经济形势与机会", en: "Macro Opportunity" } },
  { id: "invest", icon: "🚪", label: { zh: "参与方式", en: "Ways to Participate" } },
  { id: "kyc", icon: "🪪", label: { zh: "KYC 实名流程", en: "KYC Flow" } },
  { id: "start", icon: "🏦", label: { zh: "交易所入门", en: "Exchange Starter" } },
] as const;

export function tWeb3(text: LocalizedText, language: Language) {
  return language === "zh" ? text.zh : text.en;
}
