/**
 * DesktopFloatNav — 桌面端悬浮导航球（可拖动，松手自动吸附左/右边缘）
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Home, Building2, BookOpen, Mail, Compass,
  ChevronUp, CheckCircle2, Circle, ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { key: "home",      path: "/",              icon: Home,      labelZh: "首页",   labelEn: "Home",      color: "#10b981", colorRgb: "16,185,129"  },
  { key: "learn",     path: "/learning-path", icon: Compass,   labelZh: "学习",   labelEn: "Learn",     color: "#06b6d4", colorRgb: "6,182,212"   },
  { key: "exchanges", path: "/exchanges",      icon: Building2, labelZh: "交易所", labelEn: "Exchanges", color: "#3b82f6", colorRgb: "59,130,246"  },
  { key: "guide",     path: "/exchange-guide", icon: BookOpen,  labelZh: "指南",   labelEn: "Guide",     color: "#f59e0b", colorRgb: "245,158,11"  },
  { key: "contact",   path: "/contact",        icon: Mail,      labelZh: "联系",   labelEn: "Contact",   color: "#a855f7", colorRgb: "168,85,247"  },
] as const;

const BALL_SIZE = 56;
const EDGE_MARGIN = 16;
const STORAGE_KEY = "desktop_nav_pos";

function loadSavedPos(): { side: "left" | "right" | "center"; bottom: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { side: "center", bottom: 28 };
}

export default function DesktopFloatNav() {
  const [location, navigate] = useLocation();
  const { language } = useLanguage();
  const zh = language === "zh";

  const [expanded, setExpanded] = useState(false);
  const [learningMenuOpen, setLearningMenuOpen] = useState(false);
  const [hasLearningPath, setHasLearningPath] = useState(false);
  const [learningIncomplete, setLearningIncomplete] = useState(false);
  const [pathSteps, setPathSteps] = useState<{ id: string; icon: string; title: string; path: string }[]>([]);
  const [pathCompleted, setPathCompleted] = useState<string[]>([]);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const [pos, setPos] = useState<{ side: "left" | "right" | "center"; bottom: number }>(loadSavedPos);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);
  const hasDraggedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkPath = () => {
      try {
        const raw = localStorage.getItem("web3_learning_path");
        if (raw) {
          const data = JSON.parse(raw);
          setHasLearningPath(true);
          setPathSteps(Array.isArray(data.steps) ? data.steps : []);
          setPathCompleted(Array.isArray(data.completedSteps) ? data.completedSteps : []);
          setLearningIncomplete(
            Array.isArray(data.steps) &&
            Array.isArray(data.completedSteps) &&
            data.completedSteps.length < data.steps.length
          );
        } else {
          setHasLearningPath(false);
          setPathSteps([]);
          setPathCompleted([]);
          setLearningIncomplete(false);
        }
      } catch {
        setHasLearningPath(false);
      }
    };
    checkPath();
    window.addEventListener("storage", checkPath);
    const interval = setInterval(checkPath, 2000);
    return () => {
      window.removeEventListener("storage", checkPath);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
        setLearningMenuOpen(false);
      }
    };
    const t = setTimeout(() => document.addEventListener("mousedown", onOutside), 100);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onOutside);
    };
  }, [expanded]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    hasDraggedRef.current = false;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: rect.left + rect.width / 2,
      startY: rect.top + rect.height / 2,
    };

    const onMove = (me: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = me.clientX - dragStartRef.current.mouseX;
      const dy = me.clientY - dragStartRef.current.mouseY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        hasDraggedRef.current = true;
        setIsDragging(true);
      }
      if (!hasDraggedRef.current) return;
      const newX = dragStartRef.current.startX + dx;
      const newY = dragStartRef.current.startY + dy;
      const clampedX = Math.max(BALL_SIZE / 2 + EDGE_MARGIN, Math.min(window.innerWidth - BALL_SIZE / 2 - EDGE_MARGIN, newX));
      const clampedY = Math.max(BALL_SIZE / 2 + EDGE_MARGIN, Math.min(window.innerHeight - BALL_SIZE / 2 - EDGE_MARGIN, newY));
      setDragPos({ x: clampedX, y: clampedY });
    };

    const onUp = (me: MouseEvent) => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      setIsDragging(false);
      if (!hasDraggedRef.current) {
        dragStartRef.current = null;
        setDragPos(null);
        return;
      }
      const finalX = (dragStartRef.current?.startX ?? window.innerWidth / 2) + (me.clientX - (dragStartRef.current?.mouseX ?? me.clientX));
      const finalY = (dragStartRef.current?.startY ?? window.innerHeight / 2) + (me.clientY - (dragStartRef.current?.mouseY ?? me.clientY));
      const side: "left" | "right" = finalX < window.innerWidth / 2 ? "left" : "right";
      const bottomVal = Math.max(EDGE_MARGIN, Math.min(
        window.innerHeight - BALL_SIZE - EDGE_MARGIN,
        window.innerHeight - finalY - BALL_SIZE / 2
      ));
      const newPos = { side, bottom: bottomVal };
      setPos(newPos);
      setDragPos(null);
      dragStartRef.current = null;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newPos)); } catch { /* ignore */ }
      setExpanded(false);
      setLearningMenuOpen(false);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  const containerStyle: React.CSSProperties = isDragging && dragPos
    ? {
        position: "fixed",
        left: dragPos.x - BALL_SIZE / 2,
        top: dragPos.y - BALL_SIZE / 2,
        bottom: "auto",
        transform: "none",
        zIndex: 9990,
        userSelect: "none",
        WebkitUserSelect: "none",
        cursor: "grabbing",
        transition: "none",
      }
    : pos.side === "center"
    ? {
        position: "fixed",
        bottom: pos.bottom,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9990,
        userSelect: "none",
        WebkitUserSelect: "none",
      }
    : {
        position: "fixed",
        bottom: pos.bottom,
        ...(pos.side === "left" ? { left: EDGE_MARGIN } : { right: EDGE_MARGIN }),
        transform: "none",
        zIndex: 9990,
        userSelect: "none",
        WebkitUserSelect: "none",
        transition: "left 0.35s cubic-bezier(0.22,1,0.36,1), right 0.35s cubic-bezier(0.22,1,0.36,1), bottom 0.35s cubic-bezier(0.22,1,0.36,1)",
      };

  const labelOnRight = pos.side === "left";

  const isActive = useCallback((path: string) => {
    if (path === "/") return location === "/" || location === "/portal";
    if (path === "/learning-path") {
      return location === "/learning-path" ||
        location === "/web3-quiz" ||
        location === "/learning-complete";
    }
    return location.startsWith(path);
  }, [location]);

  const activeItem = NAV_ITEMS.find(item => isActive(item.path)) ?? NAV_ITEMS[0];

  const handleNavClick = useCallback((path: string, key: string) => {
    if (hasDraggedRef.current) return;
    if (key === "learn" && hasLearningPath) {
      setLearningMenuOpen(prev => !prev);
      return;
    }
    navigate(path);
    setExpanded(false);
    setLearningMenuOpen(false);
  }, [hasLearningPath, navigate]);

  const handleLearningStepClick = useCallback((stepPath: string) => {
    navigate(stepPath);
    setLearningMenuOpen(false);
    setExpanded(false);
  }, [navigate]);

  const nextStepIndex = pathSteps.findIndex(s => !pathCompleted.includes(s.id));
  const allDone = pathSteps.length > 0 && pathCompleted.length >= pathSteps.length;
  const progress = pathSteps.length > 0 ? Math.round((pathCompleted.length / pathSteps.length) * 100) : 0;

  return (
    <div
      className="hidden md:block"
      style={containerStyle}
      ref={containerRef}
      onMouseDown={handleDragStart}
    >
      {expanded && (
        <div
          style={{
            position: "absolute",
            bottom: BALL_SIZE + 12,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            animation: "desktopNavUp 0.22s cubic-bezier(0.22,1,0.36,1) both",
            willChange: "transform, opacity",
            isolation: "isolate",
          }}
        >
          {learningMenuOpen && hasLearningPath && pathSteps.length > 0 && (
            <div
              style={{
                position: "absolute",
                bottom: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                marginBottom: 8,
                width: 280,
                maxHeight: "55vh",
                overflowY: "auto",
                borderRadius: 16,
                background: "rgba(10,15,28,0.97)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(6,182,212,0.25)",
                boxShadow: "0 -8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
                animation: "desktopNavUp 0.18s cubic-bezier(0.22,1,0.36,1) both",
              }}
            >
              <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#06b6d4", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {zh ? "学习路径" : "Learning Path"}
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{progress}%</span>
                </div>
                <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#06b6d4,#8b5cf6)", borderRadius: 2, transition: "width 0.5s ease" }} />
                </div>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                  {allDone
                    ? (zh ? "🎉 全部完成！" : "🎉 All done!")
                    : zh ? `${pathCompleted.length}/${pathSteps.length} 步骤已完成` : `${pathCompleted.length}/${pathSteps.length} steps done`
                  }
                </p>
              </div>
              <div style={{ padding: "6px 0" }}>
                {pathSteps.map((step, index) => {
                  const done = pathCompleted.includes(step.id);
                  const isNext = nextStepIndex === index;
                  const isCurrent = location.split("?")[0] === step.path || location.split("?")[0].startsWith(step.path + "/");
                  return (
                    <button
                      key={step.id}
                      draggable={false}
                      onClick={() => handleLearningStepClick(step.path)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 16px",
                        background: isCurrent ? "rgba(6,182,212,0.1)" : "transparent",
                        borderLeft: `3px solid ${isCurrent ? "#06b6d4" : "transparent"}`,
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={e => { if (!isCurrent) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
                      onMouseLeave={e => { if (!isCurrent) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    >
                      <span style={{ flexShrink: 0 }}>
                        {done ? (
                          <CheckCircle2 size={15} color="#4ade80" />
                        ) : isNext ? (
                          <div style={{ width: 15, height: 15, borderRadius: "50%", border: "2px solid #06b6d4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#06b6d4" }} />
                          </div>
                        ) : (
                          <Circle size={15} color="rgba(255,255,255,0.18)" />
                        )}
                      </span>
                      <span style={{ fontSize: 15, flexShrink: 0 }}>{step.icon}</span>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: done ? "rgba(255,255,255,0.35)" : isCurrent ? "#06b6d4" : "rgba(255,255,255,0.82)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {step.title}
                      </span>
                      {isNext && !done && (
                        <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: "#06b6d4", background: "rgba(6,182,212,0.12)", padding: "2px 6px", borderRadius: 20 }}>
                          {zh ? "下一步" : "Next"}
                        </span>
                      )}
                      {!done && !isNext && (
                        <ChevronRight size={12} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />
                      )}
                    </button>
                  );
                })}
              </div>
              {allDone && (
                <div style={{ padding: "8px 12px 12px" }}>
                  <button
                    draggable={false}
                    onClick={() => { navigate("/learning-complete"); setLearningMenuOpen(false); setExpanded(false); }}
                    style={{ width: "100%", padding: "8px", borderRadius: 10, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    {zh ? "🎓 查看完成总结 →" : "🎓 View Summary →"}
                  </button>
                </div>
              )}
            </div>
          )}

          {[...NAV_ITEMS].reverse().map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            const label = zh ? item.labelZh : item.labelEn;
            const showDot = item.key === "learn" && learningIncomplete && !active;
            const isHovered = hoveredKey === item.key;
            const isLearnOpen = item.key === "learn" && learningMenuOpen;
            return (
              <div
                key={item.key}
                style={{
                  position: "relative",
                  width: 46,
                  height: 46,
                  flexShrink: 0,
                  animation: "desktopNavUp 0.2s cubic-bezier(0.22,1,0.36,1) both",
                }}
              >
                {isHovered && (
                  <div
                    style={{
                      position: "absolute",
                      ...(labelOnRight
                        ? { left: "calc(100% + 10px)" }
                        : { right: "calc(100% + 10px)" }),
                      top: "50%",
                      transform: "translateY(-50%)",
                      padding: "5px 10px",
                      borderRadius: 10,
                      background: "rgba(10,15,28,0.95)",
                      border: `1px solid rgba(${item.colorRgb},0.3)`,
                      color: item.color,
                      fontSize: 12,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                      backdropFilter: "blur(12px)",
                      pointerEvents: "none",
                      zIndex: 10,
                      animation: "fadeInLeft 0.15s ease",
                    }}
                  >
                    {label}
                    {item.key === "learn" && hasLearningPath && (
                      <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.6 }}>
                        {allDone ? "✓" : `${pathCompleted.length}/${pathSteps.length}`}
                      </span>
                    )}
                  </div>
                )}
                <button
                  draggable={false}
                  onClick={() => handleNavClick(item.path, item.key)}
                  onMouseEnter={() => setHoveredKey(item.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: active || isLearnOpen
                      ? `rgba(${item.colorRgb},0.2)`
                      : isHovered
                        ? `rgba(${item.colorRgb},0.1)`
                        : "rgba(10,15,28,0.85)",
                    border: `1.5px solid rgba(${item.colorRgb},${active || isLearnOpen ? 0.5 : isHovered ? 0.3 : 0.15})`,
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    boxShadow: active || isLearnOpen
                      ? `0 0 0 2px rgba(${item.colorRgb},0.15), 0 4px 16px rgba(${item.colorRgb},0.25)`
                      : "0 2px 8px rgba(0,0,0,0.3)",
                    cursor: "pointer",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Icon
                    size={19}
                    color={active || isLearnOpen ? item.color : isHovered ? item.color : "rgba(255,255,255,0.5)"}
                    strokeWidth={active || isLearnOpen ? 2.2 : 1.8}
                    style={{
                      filter: (active || isLearnOpen) ? `drop-shadow(0 0 4px ${item.color}80)` : "none",
                      transition: "all 0.2s ease",
                      flexShrink: 0,
                    }}
                  />
                  {showDot && (
                    <span style={{
                      position: "absolute", top: -1, right: -1,
                      width: 9, height: 9, borderRadius: "50%",
                      background: "#06b6d4",
                      boxShadow: "0 0 6px rgba(6,182,212,0.8)",
                    }} />
                  )}
                  {active && (
                    <div style={{
                      position: "absolute", bottom: -1, left: "50%", transform: "translateX(-50%)",
                      width: 16, height: 2, borderRadius: 2,
                      background: item.color,
                      boxShadow: `0 0 6px ${item.color}`,
                    }} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        data-drag="true"
        draggable={false}
        onClick={() => {
          if (hasDraggedRef.current) return;
          setExpanded(prev => !prev);
          if (expanded) setLearningMenuOpen(false);
        }}
        style={{
          position: "relative",
          width: BALL_SIZE,
          height: BALL_SIZE,
          userSelect: "none",
          WebkitUserSelect: "none",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: expanded
            ? `rgba(${activeItem.colorRgb},0.18)`
            : "rgba(10,15,28,0.85)",
          border: `1.5px solid rgba(${activeItem.colorRgb},${expanded ? 0.5 : 0.28})`,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: isDragging
            ? `0 0 0 3px rgba(${activeItem.colorRgb},0.2), 0 12px 40px rgba(0,0,0,0.5)`
            : expanded
            ? `0 0 0 3px rgba(${activeItem.colorRgb},0.12), 0 8px 32px rgba(${activeItem.colorRgb},0.28), 0 4px 16px rgba(0,0,0,0.4)`
            : `0 0 0 1px rgba(${activeItem.colorRgb},0.1), 0 4px 20px rgba(0,0,0,0.4), 0 0 16px rgba(${activeItem.colorRgb},0.1)`,
          cursor: isDragging ? "grabbing" : "grab",
          outline: "none",
          transition: isDragging ? "none" : "all 0.25s cubic-bezier(0.22,1,0.36,1)",
          transform: isDragging ? "scale(1.08)" : "scale(1)",
        }}
      >
        {(() => {
          const Icon = activeItem.icon;
          return (
            <Icon
              size={24}
              color={activeItem.color}
              strokeWidth={2}
              style={{
                filter: `drop-shadow(0 0 5px ${activeItem.color}80)`,
                transition: "all 0.3s ease",
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                flexShrink: 0,
                pointerEvents: "none",
              }}
            />
          );
        })()}
        {learningIncomplete && !isActive("/learning-path") && (
          <span style={{
            position: "absolute", top: 2, right: 2,
            width: 10, height: 10, borderRadius: "50%",
            background: "#06b6d4",
            boxShadow: "0 0 8px rgba(6,182,212,0.8)",
            pointerEvents: "none",
          }} />
        )}
        {!isDragging && (
          <div style={{
            position: "absolute",
            top: -10,
            left: "50%",
            transform: `translateX(-50%) ${expanded ? "rotate(180deg)" : "rotate(0deg)"}`,
            transition: "transform 0.25s ease",
            lineHeight: 1,
            pointerEvents: "none",
          }}>
            <ChevronUp size={12} color={expanded ? activeItem.color : "rgba(255,255,255,0.3)"} />
          </div>
        )}
      </button>

      <style>{`
        @keyframes desktopNavUp {
          from { opacity: 0; transform: translateY(12px) scale(0.85); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
