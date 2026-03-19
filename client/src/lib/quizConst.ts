// ============================================================
// Quiz 相关全局常量与类型
// 独立文件，避免 OnboardingPrompt / LearningPath 等组件
// 静态引用 Web3Quiz 页面，导致懒加载失效
// ============================================================

export const QUIZ_STORAGE_KEY = "web3_quiz_profile";
export const LEARNING_PATH_KEY = "web3_learning_path";

export interface LearningStep {
  id: string;
  icon: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  path: string;
  duration: string;
  durationEn: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
}

export type QuizAnswer = {
  questionId: string;
  optionId: string;
  tags: string[];
  weight: number;
};

export interface UserProfile {
  level: "beginner" | "intermediate" | "advanced";
  interests?: string[];
  answers: QuizAnswer[];
  completedAt: string;
}

export const ALL_STEPS: LearningStep[] = [
  { id: "what-is-web3", icon: "🌐", title: "什么是 Web3", titleEn: "What is Web3", description: "了解 Web3 的核心概念和发展历程", descriptionEn: "Learn the core concepts and history of Web3", path: "/web3-guide/what-is-web3", duration: "8 分钟", durationEn: "8 min", difficulty: "beginner", tags: ["basics", "overview"] },
  { id: "blockchain-basics", icon: "⛓️", title: "区块链基础", titleEn: "Blockchain Basics", description: "理解区块链技术原理和工作机制", descriptionEn: "Understand blockchain technology and how it works", path: "/web3-guide/blockchain-basics", duration: "12 分钟", durationEn: "12 min", difficulty: "beginner", tags: ["basics", "blockchain"] },
  { id: "wallet-keys", icon: "🔑", title: "钱包与私钥", titleEn: "Wallets & Private Keys", description: "学习如何安全管理你的数字资产", descriptionEn: "Learn how to securely manage your digital assets", path: "/web3-guide/wallet-keys", duration: "10 分钟", durationEn: "10 min", difficulty: "beginner", tags: ["basics", "practice"] },
  { id: "kyc-flow", icon: "🪪", title: "KYC 实名流程", titleEn: "KYC Verification Flow", description: "先搞懂资料准备和审核逻辑，再去注册会更顺", descriptionEn: "Understand KYC prep and review logic before registering", path: "/web3-guide/kyc-flow", duration: "8 分钟", durationEn: "8 min", difficulty: "beginner", tags: ["exchange", "practice", "basics"] },
  { id: "exchange-download", icon: "📱", title: "下载交易所", titleEn: "Download Exchange", description: "手把手教你下载和注册交易所", descriptionEn: "Step-by-step guide to download and register on exchanges", path: "/exchange-download", duration: "5 分钟", durationEn: "5 min", difficulty: "beginner", tags: ["exchange", "practice"] },
  { id: "crypto-saving", icon: "💰", title: "交易成本指南", titleEn: "Trading Cost Guide", description: "通过返佣规则理解并优化交易成本", descriptionEn: "Understand and optimize trading costs through rebate rules", path: "/crypto-saving", duration: "10 分钟", durationEn: "10 min", difficulty: "beginner", tags: ["saving", "exchange"] },
  { id: "exchange-guide", icon: "📖", title: "交易所扫盲", titleEn: "Exchange Guide", description: "深度了解交易所各项功能", descriptionEn: "In-depth overview of exchange features and functions", path: "/exchange-guide", duration: "15 分钟", durationEn: "15 min", difficulty: "intermediate", tags: ["exchange", "trading"] },
  { id: "defi-deep", icon: "🏦", title: "DeFi 深度解析", titleEn: "DeFi Deep Dive", description: "探索去中心化金融的无限可能", descriptionEn: "Explore the endless possibilities of decentralized finance", path: "/web3-guide/defi-deep", duration: "15 分钟", durationEn: "15 min", difficulty: "intermediate", tags: ["defi", "investment"] },
  { id: "investment-gateway", icon: "📈", title: "投资方式入门", titleEn: "Investment Methods", description: "了解加密货币的各种投资方式", descriptionEn: "Learn various ways to invest in cryptocurrency", path: "/web3-guide/investment-gateway", duration: "12 分钟", durationEn: "12 min", difficulty: "intermediate", tags: ["trading", "investment"] },
  { id: "economic-opportunity", icon: "🌍", title: "经济机遇分析", titleEn: "Economic Opportunity", description: "Web3 时代的历史机遇与趋势", descriptionEn: "Historical opportunities and trends in the Web3 era", path: "/web3-guide/economic-opportunity", duration: "10 分钟", durationEn: "10 min", difficulty: "intermediate", tags: ["overview", "investment"] },
  { id: "exchange-guide-deep", icon: "🔄", title: "交易所功能详解", titleEn: "Advanced Exchange Guide", description: "现货、合约、杠杆深度教学", descriptionEn: "Deep dive into spot, futures, and leverage trading", path: "/web3-guide/exchange-guide", duration: "20 分钟", durationEn: "20 min", difficulty: "advanced", tags: ["trading", "advanced"] },
  { id: "sim-spot", icon: "🎮", title: "模拟交易 - 现货", titleEn: "Sim Trading - Spot", description: "在零风险环境中练习现货交易", descriptionEn: "Practice spot trading in a risk-free environment", path: "/sim/spot", duration: "自由练习", durationEn: "Free practice", difficulty: "intermediate", tags: ["trading", "practice"] },
  { id: "sim-futures", icon: "⚡", title: "模拟交易 - 合约", titleEn: "Sim Trading - Futures", description: "学习合约交易的高级玩法", descriptionEn: "Learn advanced futures trading strategies", path: "/sim/futures", duration: "自由练习", durationEn: "Free practice", difficulty: "advanced", tags: ["trading", "advanced"] },
];
