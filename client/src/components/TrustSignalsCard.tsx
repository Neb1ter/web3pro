import { BadgeCheck, CalendarClock, FileSearch, ShieldAlert, UserRound } from "lucide-react";
import { formatTrustDate } from "@/lib/trust";

type SourceItem = {
  label: string;
  href?: string;
};

type TrustSignalsCardProps = {
  zh: boolean;
  title?: string;
  summary?: string;
  author: string;
  reviewer: string;
  updatedAt?: string | Date | null;
  sources: SourceItem[];
  disclosure: string;
  reviewNote?: string | null;
};

export function TrustSignalsCard({
  zh,
  title,
  summary,
  author,
  reviewer,
  updatedAt,
  sources,
  disclosure,
  reviewNote,
}: TrustSignalsCardProps) {
  const metaItems = [
    {
      icon: <UserRound className="h-4 w-4 text-cyan-300" />,
      label: zh ? "作者" : "Author",
      value: author,
    },
    {
      icon: <BadgeCheck className="h-4 w-4 text-emerald-300" />,
      label: zh ? "审核" : "Reviewed by",
      value: reviewer,
    },
    {
      icon: <CalendarClock className="h-4 w-4 text-amber-300" />,
      label: zh ? "更新时间" : "Updated",
      value: formatTrustDate(updatedAt, zh),
    },
    {
      icon: <ShieldAlert className="h-4 w-4 text-rose-300" />,
      label: zh ? "披露" : "Disclosure",
      value: disclosure,
      wide: true,
    },
  ];

  return (
    <section className="rounded-2xl border border-cyan-500/20 bg-[#081423]/80 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2">
          <FileSearch className="h-5 w-5 text-cyan-300" />
        </div>
        <div>
          <h3 className="text-base font-black text-white">
            {title ?? (zh ? "作者、来源与披露说明" : "Authorship, Sources & Disclosure")}
          </h3>
          {summary ? <p className="mt-1 text-sm leading-6 text-slate-400">{summary}</p> : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {metaItems.map((item) => (
          <div
            key={item.label}
            className={`rounded-xl border border-white/10 bg-white/5 p-4 ${item.wide ? "sm:col-span-2" : ""}`}
          >
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              {item.icon}
              <span>{item.label}</span>
            </div>
            <p className="text-sm leading-7 text-slate-200">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
          {zh ? "来源依据" : "Source basis"}
        </p>
        <div className="flex flex-wrap gap-2">
          {sources.map((source) =>
            source.href ? (
              <a
                key={`${source.label}-${source.href}`}
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200 transition hover:border-cyan-400/40 hover:bg-cyan-500/15"
              >
                {source.label}
              </a>
            ) : (
              <span
                key={source.label}
                className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200"
              >
                {source.label}
              </span>
            ),
          )}
        </div>
      </div>

      {reviewNote ? (
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
          <span className="font-bold text-amber-300">{zh ? "审核备注：" : "Review note: "}</span>
          {reviewNote}
        </div>
      ) : null}
    </section>
  );
}
