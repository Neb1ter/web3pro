import { useEffect, useState } from "react";

interface ScrollToTopButtonProps {
  threshold?: number;
  color?: "emerald" | "yellow" | "blue" | "purple" | "cyan";
}

const colorConfig = {
  cyan: {
    ring: "#22d3ee",
    glow: "rgba(34, 211, 238, 0.55)",
    glowSoft: "rgba(34, 211, 238, 0.18)",
    track: "rgba(34, 211, 238, 0.15)",
    bg: "rgba(34, 211, 238, 0.12)",
    border: "rgba(34, 211, 238, 0.35)",
    text: "#a5f3fc",
  },
  emerald: {
    ring: "#10b981",
    glow: "rgba(16, 185, 129, 0.55)",
    glowSoft: "rgba(16, 185, 129, 0.18)",
    track: "rgba(16, 185, 129, 0.15)",
    bg: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.35)",
    text: "#6ee7b7",
  },
  yellow: {
    ring: "#eab308",
    glow: "rgba(234, 179, 8, 0.55)",
    glowSoft: "rgba(234, 179, 8, 0.18)",
    track: "rgba(234, 179, 8, 0.15)",
    bg: "rgba(234, 179, 8, 0.12)",
    border: "rgba(234, 179, 8, 0.35)",
    text: "#fde68a",
  },
  blue: {
    ring: "#3b82f6",
    glow: "rgba(59, 130, 246, 0.55)",
    glowSoft: "rgba(59, 130, 246, 0.18)",
    track: "rgba(59, 130, 246, 0.15)",
    bg: "rgba(59, 130, 246, 0.12)",
    border: "rgba(59, 130, 246, 0.35)",
    text: "#93c5fd",
  },
  purple: {
    ring: "#a855f7",
    glow: "rgba(168, 85, 247, 0.55)",
    glowSoft: "rgba(168, 85, 247, 0.18)",
    track: "rgba(168, 85, 247, 0.15)",
    bg: "rgba(168, 85, 247, 0.12)",
    border: "rgba(168, 85, 247, 0.35)",
    text: "#d8b4fe",
  },
} as const;

const SIZE = 52;
const STROKE = 3.5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ScrollToTopButton({
  threshold = 300,
  color = "emerald",
}: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hovered, setHovered] = useState(false);

  const cfg = colorConfig[color] ?? colorConfig.emerald;

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        setVisible(scrollY > threshold);
        setProgress(docHeight > 0 ? Math.min(scrollY / docHeight, 1) : 0);
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const pct = Math.round(progress * 100);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
      style={{
        transition: "opacity 0.35s ease, transform 0.35s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div
        style={{
          transition: "opacity 0.2s ease, transform 0.2s ease",
          opacity: showTooltip ? 1 : 0,
          transform: showTooltip ? "scale(1)" : "scale(0.92)",
          pointerEvents: "none",
          background: "rgba(15, 23, 42, 0.88)",
          backdropFilter: "blur(8px)",
          border: `1px solid ${cfg.border}`,
          borderRadius: "10px",
          padding: "6px 12px",
          color: cfg.text,
          fontSize: "12px",
          fontWeight: 600,
          whiteSpace: "nowrap",
          boxShadow: `0 4px 16px ${cfg.glowSoft}`,
          position: "relative",
        }}
      >
        已浏览 {pct}% · 点击回到顶部
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            top: "100%",
            width: 0,
            height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "5px solid rgba(15, 23, 42, 0.88)",
          }}
        />
      </div>

      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => {
          setShowTooltip(true);
          setHovered(true);
        }}
        onMouseLeave={() => {
          setShowTooltip(false);
          setHovered(false);
        }}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-label={`回到顶部，当前已浏览 ${pct}%`}
        style={{
          position: "relative",
          width: SIZE,
          height: SIZE,
          borderRadius: "50%",
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          backdropFilter: "blur(12px)",
          cursor: "pointer",
          padding: 0,
          outline: "none",
          transition: "transform 0.15s ease, box-shadow 0.3s ease",
          transform: hovered ? "scale(1.1)" : "scale(1)",
          boxShadow: hovered
            ? `0 0 0 4px ${cfg.glowSoft}, 0 0 20px 6px ${cfg.glow}, 0 4px 16px ${cfg.glowSoft}`
            : `0 0 0 2px ${cfg.glowSoft}, 0 0 10px 2px ${cfg.glowSoft}, 0 2px 8px rgba(0,0,0,0.3)`,
        }}
      >
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            transform: "rotate(-90deg)",
          }}
        >
          <defs>
            <filter id={`glow-${color}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={cfg.track}
            strokeWidth={STROKE}
          />

          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={cfg.ring}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            filter={`url(#glow-${color})`}
            style={{ transition: "stroke-dashoffset 0.4s ease" }}
          />
        </svg>

        <svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          stroke={cfg.text}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            transition: "transform 0.15s ease",
          }}
        >
          <path d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}
