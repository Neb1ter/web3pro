import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { WEB3_CHAPTERS, tWeb3 } from "@/lib/web3I18n";

function TriggerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="relative">
      {!isOpen && (
        <span
          className="absolute inset-0 rounded-xl animate-ping"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)",
            animationDuration: "2.5s",
          }}
        />
      )}
      <div
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${
          isOpen
            ? "border border-indigo-400/60 bg-indigo-500/30"
            : "border border-slate-600/60 bg-slate-800/80 hover:border-indigo-500/60 hover:bg-indigo-500/10"
        }`}
        style={{
          boxShadow: isOpen
            ? "0 0 20px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
            : "0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {isOpen ? (
          <svg className="h-4 w-4 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="1.5" className="text-indigo-400" stroke="currentColor" />
            <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="1.5" className="text-indigo-300" stroke="currentColor" />
            <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="1.5" className="text-slate-400" stroke="currentColor" />
            <line x1="14" y1="17.5" x2="21" y2="17.5" strokeWidth="1.5" strokeLinecap="round" className="text-slate-500" stroke="currentColor" />
            <line x1="14" y1="20.5" x2="18.5" y2="20.5" strokeWidth="1.5" strokeLinecap="round" className="text-slate-600" stroke="currentColor" />
          </svg>
        )}
      </div>
      {!isOpen && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-medium tracking-wider text-slate-500">
          Menu
        </div>
      )}
    </div>
  );
}

interface Web3ChapterNavProps {
  currentChapterId: string;
}

export default function Web3ChapterNav({ currentChapterId }: Web3ChapterNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const zh = language === "zh";

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const currentChapter = WEB3_CHAPTERS.find((chapter) => chapter.id === currentChapterId);
  const currentIndex = WEB3_CHAPTERS.findIndex((chapter) => chapter.id === currentChapterId);

  return (
    <div ref={menuRef} className="relative" style={{ zIndex: 60 }}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex flex-col items-center gap-0.5 focus:outline-none"
        aria-label={zh ? "章节导航" : "Chapter navigation"}
      >
        <TriggerIcon isOpen={isOpen} />
      </button>

      <div
        className="absolute right-0 top-14 w-72 overflow-hidden rounded-2xl sm:w-80"
        style={{
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? "translateY(0) scale(1)" : "translateY(-12px) scale(0.96)",
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.25s ease, transform 0.25s ease",
          background: "rgba(8, 15, 30, 0.92)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid rgba(99, 102, 241, 0.2)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <div className="border-b px-4 py-3" style={{ borderColor: "rgba(99,102,241,0.15)" }}>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {zh ? "Web3 入圈指南 · 章节导航" : "Web3 Guide · Chapters"}
            </span>
          </div>
          {currentChapter && (
            <p className="ml-3.5 mt-1 text-[10px] text-slate-500">
              {zh
                ? `当前：第 ${currentChapter.num} 章 · ${tWeb3(currentChapter.title, language)}`
                : `Current: Chapter ${currentChapter.num} · ${tWeb3(currentChapter.title, language)}`}
            </p>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {WEB3_CHAPTERS.map((chapter, index) => {
            const isCurrent = chapter.id === currentChapterId;
            const isPrev = index < currentIndex;

            return (
              <Link
                key={chapter.id}
                href={chapter.path}
                onClick={() => setIsOpen(false)}
                className={`group mb-1 flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-200 ${
                  isCurrent
                    ? `${chapter.activeBg} ${chapter.borderColor}`
                    : "border-transparent hover:border-white/8 hover:bg-white/5"
                }`}
              >
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-black transition-all ${
                    isCurrent
                      ? `${chapter.color} bg-white/10`
                      : isPrev
                        ? "bg-slate-800/60 text-slate-500"
                        : "bg-slate-800/40 text-slate-400 group-hover:text-slate-200"
                  }`}
                  style={isCurrent ? { boxShadow: "0 0 12px rgba(99,102,241,0.2)" } : {}}
                >
                  {isPrev && !isCurrent ? (
                    <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    chapter.num
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-bold leading-tight transition-colors ${isCurrent ? chapter.color : "text-slate-300 group-hover:text-white"}`}>
                    {chapter.icon} {tWeb3(chapter.title, language)}
                  </div>
                  <div className="mt-0.5 truncate text-[10px] text-slate-500">
                    {tWeb3(chapter.subtitle, language)}
                  </div>
                </div>

                {isCurrent ? (
                  <div className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${chapter.color.replace("text-", "bg-")}`} />
                ) : (
                  <svg className="h-3.5 w-3.5 flex-shrink-0 text-slate-600 transition-colors group-hover:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </Link>
            );
          })}
        </div>

        <div className="mx-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }} />

        <div className="p-2 pt-1.5">
          <Link
            href="/web3-guide"
            onClick={() => setIsOpen(false)}
            className="group mb-1 flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-all hover:border-white/8 hover:bg-white/5"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800/60">
              <svg className="h-4 w-4 text-slate-400 transition-colors group-hover:text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-slate-400 transition-colors group-hover:text-slate-200">
                🧭 {zh ? "指南总览" : "Guide Overview"}
              </div>
              <div className="text-[10px] text-slate-600">
                {zh ? "返回 Web3 入圈指南首页" : "Back to the main Web3 guide"}
              </div>
            </div>
          </Link>

          <Link
            href="/crypto-saving"
            onClick={() => setIsOpen(false)}
            className="group flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-all hover:border-yellow-500/20 hover:bg-yellow-500/8"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-yellow-500/20 bg-yellow-500/10">
              <span className="text-sm">💵</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-yellow-500/80 transition-colors group-hover:text-yellow-400">
                {zh ? "币圈省钱指南" : "Crypto Saving Guide"}
              </div>
              <div className="text-[10px] text-slate-600">
                {zh ? "交易所返佣 · 手续费优化" : "Exchange rebates · Fee optimization"}
              </div>
            </div>
            <svg className="h-3.5 w-3.5 flex-shrink-0 text-yellow-600/60 transition-colors group-hover:text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>

        <div className="px-4 py-2 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <span className="text-[9px] uppercase tracking-widest text-slate-700">
            {zh ? "Web3 入圈指南 · 7 个章节" : "Web3 Guide · 7 Chapters"}
          </span>
        </div>
      </div>

      {isOpen && <div className="fixed inset-0 -z-10" onClick={() => setIsOpen(false)} />}
    </div>
  );
}
