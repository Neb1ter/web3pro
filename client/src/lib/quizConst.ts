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
  description: string;
  path: string;
  duration: string;
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
  { id: "what-is-web3", icon: "🌐", title: "什么是 Web3", description: "了解 Web3 的核心概念和发展历程", path: "/web3-guide/what-is-web3", duration: "8 分钟", difficulty: "beginner", tags: ["basics", "overview"] },
  { id: "blockchain-basics", icon: "⛓️", title: "区块链基础", description: "理解区块链技术原理和工作机制", path: "/web3-guide/blockchain-basics", duration: "12 分钟", difficulty: "beginner", tags: ["basics", "blockchain"] },
  { id: "wallet-keys", icon: "🔑", title: "钱包与私钥", description: "学习如何安全管理你的数字资产", path: "/web3-guide/wallet-keys", duration: "10 分钟", difficulty: "beginner", tags: ["basics", "practice"] },
  { id: "exchange-download", icon: "📱", title: "下载交易所", description: "手把手教你下载和注册交易所", path: "/exchange-download", duration: "5 分钟", difficulty: "beginner", tags: ["exchange", "practice"] },
  { id: "crypto-saving", icon: "💰", title: "省钱指南", description: "通过返佣机制降低交易手续费", path: "/crypto-saving", duration: "10 分钟", difficulty: "beginner", tags: ["saving", "exchange"] },
  { id: "exchange-guide", icon: "📖", title: "交易所扫盲", description: "深度了解交易所各项功能", path: "/exchange-guide", duration: "15 分钟", difficulty: "intermediate", tags: ["exchange", "trading"] },
  { id: "defi-deep", icon: "🏦", title: "DeFi 深度解析", description: "探索去中心化金融的无限可能", path: "/web3-guide/defi-deep", duration: "15 分钟", difficulty: "intermediate", tags: ["defi", "investment"] },
  { id: "investment-gateway", icon: "📈", title: "投资方式入门", description: "了解加密货币的各种投资方式", path: "/web3-guide/investment-gateway", duration: "12 分钟", difficulty: "intermediate", tags: ["trading", "investment"] },
  { id: "economic-opportunity", icon: "🌍", title: "经济机遇分析", description: "Web3 时代的历史机遇与趋势", path: "/web3-guide/economic-opportunity", duration: "10 分钟", difficulty: "intermediate", tags: ["overview", "investment"] },
  { id: "exchange-guide-deep", icon: "🔄", title: "交易所功能详解", description: "现货、合约、杠杆深度教学", path: "/web3-guide/exchange-guide", duration: "20 分钟", difficulty: "advanced", tags: ["trading", "advanced"] },
  { id: "sim-spot", icon: "🎮", title: "模拟交易 - 现货", description: "在零风险环境中练习现货交易", path: "/sim/spot", duration: "自由练习", difficulty: "intermediate", tags: ["trading", "practice"] },
  { id: "sim-futures", icon: "⚡", title: "模拟交易 - 合约", description: "学习合约交易的高级玩法", path: "/sim/futures", duration: "自由练习", difficulty: "advanced", tags: ["trading", "advanced"] },
];
