import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useScrollMemory } from "@/hooks/useScrollMemory";

// 从独立常量文件导入，避免其他组件静态引用本页面
import { QUIZ_STORAGE_KEY, LEARNING_PATH_KEY, ALL_STEPS } from "@/lib/quizConst";
import type { LearningStep, UserProfile, QuizAnswer } from "@/lib/quizConst";

interface QuizQuestion {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  options: { id: string; icon: string; label: string; desc: string; tags: string[]; weight: number }[];
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: "knowledge",
    icon: "🧠",
    title: "你对 Web3 / 区块链的了解程度？",
    subtitle: "选择最符合你当前状态的选项",
    options: [
      { id: "zero", icon: "🌱", label: "完全零基础", desc: "听说过比特币但不太清楚什么是区块链", tags: ["beginner", "basics"], weight: 0 },
      { id: "basic", icon: "📖", label: "有基础了解", desc: "知道区块链、钱包等概念，但没实际操作过", tags: ["beginner", "practice"], weight: 1 },
      { id: "user", icon: "💻", label: "有使用经验", desc: "用过交易所买卖过加密货币", tags: ["intermediate", "trading"], weight: 2 },
      { id: "experienced", icon: "🔥", label: "经验丰富", desc: "熟悉 DeFi、NFT 等领域，有链上操作经验", tags: ["advanced", "defi"], weight: 3 },
    ],
  },
  {
    id: "interest",
    icon: "🎯",
    title: "你最感兴趣的 Web3 方向是？",
    subtitle: "选择你最想深入了解的领域",
    options: [
      { id: "invest", icon: "📈", label: "投资理财", desc: "学习如何在加密市场中获取收益", tags: ["trading", "investment"], weight: 1 },
      { id: "tech", icon: "⛓️", label: "技术原理", desc: "深入理解区块链、智能合约等底层技术", tags: ["basics", "blockchain"], weight: 1 },
      { id: "defi", icon: "🏦", label: "DeFi 去中心化金融", desc: "借贷、流动性挖矿、收益农场等", tags: ["defi", "advanced"], weight: 2 },
      { id: "save", icon: "💰", label: "省钱省手续费", desc: "通过返佣等方式降低交易成本", tags: ["saving", "exchange"], weight: 1 },
    ],
  },
  {
    id: "goal",
    icon: "🚀",
    title: "你学习 Web3 的主要目标是？",
    subtitle: "你希望通过学习达成什么",
    options: [
      { id: "understand", icon: "💡", label: "了解趋势", desc: "跟上时代不掉队，建立基本认知", tags: ["basics", "overview"], weight: 0 },
      { id: "trade", icon: "📊", label: "开始交易", desc: "学会在交易所进行买卖操作", tags: ["trading", "exchange", "practice"], weight: 1 },
      { id: "earn", icon: "🌾", label: "获取被动收益", desc: "通过质押、DeFi 等方式赚取收益", tags: ["defi", "investment", "advanced"], weight: 2 },
      { id: "build", icon: "🔨", label: "参与生态建设", desc: "成为 Web3 建设者或深度参与者", tags: ["advanced", "blockchain", "defi"], weight: 3 },
    ],
  },
  {
    id: "risk",
    icon: "🛡️",
    title: "你对风险的态度是？",
    subtitle: "投资涉及风险，了解自己的偏好很重要",
    options: [
      { id: "conservative", icon: "🔒", label: "非常保守", desc: "不想承担任何损失风险", tags: ["saving", "basics"], weight: 0 },
      { id: "moderate", icon: "⚖️", label: "适度承受", desc: "可以接受小幅波动，追求稳健收益", tags: ["trading", "investment"], weight: 1 },
      { id: "aggressive", icon: "🎲", label: "愿意冒险", desc: "高风险高回报，愿意尝试新机会", tags: ["defi", "advanced"], weight: 2 },
    ],
  },
  {
    id: "time",
    icon: "⏰",
    title: "你每天能投入多少时间学习？",
    subtitle: "我们会根据你的时间安排学习节奏",
    options: [
      { id: "little", icon: "☕", label: "10 分钟", desc: "碎片化时间，快速浏览", tags: ["quick"], weight: 0 },
      { id: "some", icon: "📚", label: "30 分钟", desc: "每天花半小时系统学习", tags: ["systematic"], weight: 1 },
      { id: "lots", icon: "🔥", label: "1 小时以上", desc: "集中精力深度学习", tags: ["deep"], weight: 2 },
    ],
  },
];

// UserProfile, LearningStep, QuizAnswer, ALL_STEPS 均从 @/lib/quizConst 导入

export function generateLearningPath(profile: UserProfile): LearningStep[] {
  const tagScores = new Map<string, number>();
  for (const answer of profile.answers) {
    for (const tag of answer.tags) {
      tagScores.set(tag, (tagScores.get(tag) || 0) + answer.weight + 1);
    }
  }

  const scored = ALL_STEPS.map(step => {
    let score = 0;
    for (const tag of step.tags) {
      score += tagScores.get(tag) || 0;
    }
    if (step.difficulty === profile.level) score += 3;
    if (step.difficulty === "beginner" && profile.level === "intermediate") score += 1;
    if (step.difficulty === "intermediate" && profile.level === "advanced") score += 1;
    if (step.difficulty === "advanced" && profile.level === "beginner") score -= 2;
    return { step, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };
  const selected = scored.slice(0, 8).map(s => s.step);
  selected.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);

  return selected;
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-slate-500">
          {current} / {total}
        </span>
        <span className="text-xs font-bold text-cyan-400">
          {Math.round((current / total) * 100)}%
        </span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${(current / total) * 100}%`,
            background: "linear-gradient(90deg, #06b6d4, #8b5cf6)",
          }}
        />
      </div>
    </div>
  );
}

export default function Web3Quiz() {
  useScrollMemory();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const existing = localStorage.getItem(QUIZ_STORAGE_KEY);
    if (existing) {
      try {
        const profile = JSON.parse(existing) as UserProfile;
        if (profile.completedAt) {
          navigate("/learning-path");
          return;
        }
      } catch {}
    }
  }, [navigate]);

  const currentQuestion = QUESTIONS[step];

  const handleSelect = useCallback((optionId: string) => {
    if (animating) return;
    setSelectedOption(optionId);
  }, [animating]);

  const handleNext = useCallback(() => {
    if (!selectedOption || animating) return;
    const question = QUESTIONS[step];
    const option = question.options.find(o => o.id === selectedOption);
    if (!option) return;

    const newAnswer: QuizAnswer = {
      questionId: question.id,
      optionId: option.id,
      tags: option.tags,
      weight: option.weight,
    };

    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);
    setAnimating(true);

    setTimeout(() => {
      if (step < QUESTIONS.length - 1) {
        setStep(step + 1);
        setSelectedOption(null);
        setAnimating(false);
      } else {
        const totalWeight = newAnswers.reduce((sum, a) => sum + a.weight, 0);
        const avgWeight = totalWeight / newAnswers.length;
        const level: UserProfile["level"] =
          avgWeight < 1 ? "beginner" : avgWeight < 2 ? "intermediate" : "advanced";

        const allTags = newAnswers.flatMap(a => a.tags);
        const tagCounts = new Map<string, number>();
        for (const tag of allTags) tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        const interests = Array.from(tagCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([tag]) => tag);

        const profile: UserProfile = {
          level,
          interests,
          answers: newAnswers,
          completedAt: new Date().toISOString(),
        };

        localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(profile));

        const path = generateLearningPath(profile);
        const pathState = { steps: path, currentStep: 0, completedSteps: [] as string[] };
        localStorage.setItem(LEARNING_PATH_KEY, JSON.stringify(pathState));

        navigate("/learning-path");
      }
    }, 400);
  }, [selectedOption, animating, step, answers, navigate]);

  if (showIntro) {
    return (
      <div className="min-h-screen text-white flex flex-col" style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1a2d 50%, #0a1628 100%)" }}>
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-lg w-full text-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <div className="w-64 h-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(6,182,212,0.3), transparent 70%)" }} />
              </div>
              <div className="relative text-7xl mb-6 animate-bounce" style={{ animationDuration: "2s" }}>🧭</div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              发现你的 Web3 之旅
            </h1>
            <p className="text-slate-400 text-base sm:text-lg leading-relaxed mb-3">
              回答几个简单的问题，让我们了解你的背景和兴趣
            </p>
            <p className="text-slate-500 text-sm mb-10">
              我们将为你定制专属的学习路径，帮你高效入门 Web3 世界
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">✓</span>
                仅需 2 分钟
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">✓</span>
                {QUESTIONS.length} 道问题
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-5 h-5 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400">✓</span>
                个性化路径
              </div>
            </div>
            <button
              onClick={() => { setShowIntro(false); window.scrollTo(0, 0); }}
              className="px-10 py-3.5 rounded-2xl font-black text-base text-white transition-all hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                boxShadow: "0 4px 24px rgba(6,182,212,0.35), 0 0 0 1px rgba(139,92,246,0.2)",
              }}
            >
              开始测评 →
            </button>
            <div className="mt-6">
              <button
                onClick={() => navigate("/")}
                className="text-sm text-slate-600 hover:text-slate-400 transition-colors"
              >
                暂时跳过，直接浏览
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1a2d 50%, #0a1628 100%)" }}>
      <nav className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl" style={{ background: "rgba(10,15,30,0.85)" }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="text-sm text-slate-500 hover:text-white transition-colors flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            返回
          </button>
          <span className="text-xs font-bold text-slate-600">Web3 知识测评</span>
          <span className="text-xs text-slate-600">{step + 1}/{QUESTIONS.length}</span>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-lg w-full" style={{ opacity: animating ? 0 : 1, transform: animating ? "translateY(12px)" : "none", transition: "opacity 0.3s ease, transform 0.3s ease" }}>
          <ProgressBar current={step} total={QUESTIONS.length} />

          <div className="text-center mb-8">
            <span className="text-4xl mb-3 block">{currentQuestion.icon}</span>
            <h2 className="text-xl sm:text-2xl font-black text-white mb-2">{currentQuestion.title}</h2>
            <p className="text-sm text-slate-500">{currentQuestion.subtitle}</p>
          </div>

          <div className="space-y-3 mb-8">
            {currentQuestion.options.map(option => {
              const isSelected = selectedOption === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className="w-full text-left rounded-2xl border p-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    borderColor: isSelected ? "rgba(6,182,212,0.5)" : "rgba(255,255,255,0.06)",
                    background: isSelected
                      ? "linear-gradient(135deg, rgba(6,182,212,0.12), rgba(139,92,246,0.08))"
                      : "rgba(255,255,255,0.02)",
                    boxShadow: isSelected ? "0 0 20px rgba(6,182,212,0.15), inset 0 0 0 1px rgba(6,182,212,0.2)" : "none",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{option.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-sm mb-1 ${isSelected ? "text-cyan-300" : "text-white"}`}>{option.label}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{option.desc}</p>
                    </div>
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-all"
                      style={{
                        borderColor: isSelected ? "#06b6d4" : "rgba(255,255,255,0.15)",
                        background: isSelected ? "#06b6d4" : "transparent",
                      }}
                    >
                      {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => { if (step > 0) { setStep(step - 1); setSelectedOption(answers[step - 1]?.optionId || null); setAnswers(answers.slice(0, -1)); } }}
              disabled={step === 0}
              className="px-5 py-2.5 text-sm font-bold rounded-xl border border-white/8 text-slate-500 hover:text-white hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              上一步
            </button>
            <button
              onClick={handleNext}
              disabled={!selectedOption}
              className="px-8 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: selectedOption ? "linear-gradient(135deg, #06b6d4, #8b5cf6)" : "rgba(255,255,255,0.05)",
                boxShadow: selectedOption ? "0 4px 16px rgba(6,182,212,0.3)" : "none",
              }}
            >
              {step === QUESTIONS.length - 1 ? "生成学习路径 ✨" : "下一步 →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 重新导出 quizConst 中的常量，保持向后兼容
export { QUIZ_STORAGE_KEY, LEARNING_PATH_KEY, ALL_STEPS } from "@/lib/quizConst";
export type { UserProfile, QuizAnswer, LearningStep } from "@/lib/quizConst";
