import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const MEDIA_CREATE_URL = "https://media.get8.pro";

export default function AdminArticleRedirect() {
  const { language } = useLanguage();
  const zh = language === "zh";

  useEffect(() => {
    window.location.replace(MEDIA_CREATE_URL);
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "linear-gradient(180deg, #081221 0%, #0a192f 100%)" }}
    >
      <div className="w-full max-w-md rounded-3xl border border-cyan-500/20 bg-slate-950/55 p-7 text-center shadow-2xl shadow-cyan-950/40 backdrop-blur-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/12 text-2xl">
          Edit
        </div>
        <h1 className="mb-2 text-xl font-black text-white">
          {zh ? "正在跳转到文章创作后台" : "Redirecting to the media editor"}
        </h1>
        <p className="mb-5 text-sm leading-relaxed text-slate-400">
          {zh
            ? "如果浏览器没有自动跳转，可以点击下面的按钮继续。"
            : "If the browser does not redirect automatically, use the button below."}
        </p>
        <a
          href={MEDIA_CREATE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-black text-slate-950 no-underline transition hover:bg-cyan-400"
        >
          {zh ? "打开 media.get8.pro" : "Open media.get8.pro"}
        </a>
      </div>
    </div>
  );
}
