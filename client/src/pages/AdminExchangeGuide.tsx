import { useLanguage } from "@/contexts/LanguageContext";

export default function AdminExchangeGuide() {
  const { language } = useLanguage();
  const zh = language === "zh";
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A192F" }}>
      <div className="text-center text-white">
        <h1 className="text-2xl font-bold mb-4">{zh ? "管理功能暂不可用" : "Admin feature unavailable"}</h1>
        <p className="text-slate-400">{zh ? "此功能在静态模式下不可用" : "This feature is not available in static mode"}</p>
      </div>
    </div>
  );
}
