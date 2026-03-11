import { useState, useEffect, useRef } from "react";
import { SeoManager } from "@/components/SeoManager";

// ... (rest of the file remains the same)

export default function BrokerProgram() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", type: "", telegram: "" });
  const [submitted, setSubmitted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setSubmitted(true); };

  return (
    <>
      <SeoManager
        title="交易所经纪商计划 | Get8 Pro"
        description="加入 Get8 Pro 经纪商计划，享受高达 50% 的返佣、专属 API 集成和 24/7 技术支持。无论您是量化平台、跟单社区还是资管团队，我们都提供定制化解决方案。"
        path="/broker-program"
        keywords="交易所经纪商, API交易, 量化交易, 跟单平台, 返佣计划, crypto broker program, API trading, quantitative trading, copy trading, rebate program"
      />
      <div className="min-h-screen bg-black text-white font-sans">
        {/* ... (rest of the JSX remains the same) */}
      </div>
    </>
  );
}
