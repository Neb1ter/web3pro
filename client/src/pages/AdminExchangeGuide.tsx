import { useMemo, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArticlesTab } from "./admin/AdminArticlesTab";
import { PlatformsTab } from "./admin/AdminPlatformsTab";
import { PublishLogsTab } from "./admin/AdminPublishLogsTab";

const GUIDE_FALLBACKS = {
  gate: {
    1: "/images/exchange-guides/gate/step-1-home.png",
    2: "/images/exchange-guides/gate/step-2-invite.png",
    3: "/images/exchange-guides/gate/step-3-download.png",
  },
} as const;

function getFallbackGuideImage(slug: string, step: 1 | 2 | 3): string {
  const fallback = GUIDE_FALLBACKS[slug as keyof typeof GUIDE_FALLBACKS];
  return fallback?.[step] ?? "";
}


function ExchangeGuideManager({ zh }: { zh: boolean }) {
  type ExchangeRow = {
    slug: string;
    name?: string | null;
    referralLink?: string | null;
    inviteCode?: string | null;
    rebateRate?: string | null;
    guideStep1ImageUrl?: string | null;
    guideStep2ImageUrl?: string | null;
    guideStep3ImageUrl?: string | null;
  };

  type ExchangeForm = {
    name: string;
    referralLink: string;
    inviteCode: string;
    rebateRate: string;
    guideStep1ImageUrl: string;
    guideStep2ImageUrl: string;
    guideStep3ImageUrl: string;
  };

  const stepMeta = [
    { step: 1 as const, key: "guideStep1ImageUrl" as const, titleZh: "步骤 1：官网首页", titleEn: "Step 1: Official homepage" },
    { step: 2 as const, key: "guideStep2ImageUrl" as const, titleZh: "步骤 2：邀请码位置", titleEn: "Step 2: Invite code field" },
    { step: 3 as const, key: "guideStep3ImageUrl" as const, titleZh: "步骤 3：官方下载页", titleEn: "Step 3: Official download page" },
  ];

  const emptyForm: ExchangeForm = {
    name: "",
    referralLink: "",
    inviteCode: "",
    rebateRate: "",
    guideStep1ImageUrl: "",
    guideStep2ImageUrl: "",
    guideStep3ImageUrl: "",
  };

  const exchangesQuery = trpc.exchanges.list.useQuery();
  const updateMutation = trpc.exchanges.update.useMutation({
    onSuccess: () => {
      toast.success(zh ? "交易所设置已保存" : "Exchange settings saved");
      exchangesQuery.refetch();
      setEditing(null);
      setForm(emptyForm);
    },
    onError: () => toast.error(zh ? "保存失败，请重试" : "Save failed"),
  });
  const uploadMutation = trpc.exchanges.uploadGuideImage.useMutation();

  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ExchangeForm>(emptyForm);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const startEdit = (ex: ExchangeRow) => {
    setEditing(ex.slug);
    setForm({
      name: ex.name ?? "",
      referralLink: ex.referralLink ?? "",
      inviteCode: ex.inviteCode ?? "",
      rebateRate: ex.rebateRate ?? "",
      guideStep1ImageUrl: ex.guideStep1ImageUrl ?? "",
      guideStep2ImageUrl: ex.guideStep2ImageUrl ?? "",
      guideStep3ImageUrl: ex.guideStep3ImageUrl ?? "",
    });
  };

  const resetEdit = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("read-failed"));
      reader.readAsDataURL(file);
    });

  const triggerFilePicker = (slug: string, step: 1 | 2 | 3) => {
    fileInputRefs.current[`${slug}-${step}`]?.click();
  };

  const handleUpload = async (slug: string, step: 1 | 2 | 3, file?: File) => {
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const result = await uploadMutation.mutateAsync({
        slug: slug as "gate" | "okx" | "binance" | "bybit" | "bitget",
        step,
        dataUrl,
        fileName: file.name,
      });

      const fieldMap = {
        1: "guideStep1ImageUrl",
        2: "guideStep2ImageUrl",
        3: "guideStep3ImageUrl",
      } as const;

      if (editing === slug) {
        setForm(prev => ({ ...prev, [fieldMap[step]]: result.url }));
      }

      toast.success(zh ? `步骤 ${step} 图片已上传` : `Step ${step} image uploaded`);
      exchangesQuery.refetch();
    } catch (error) {
      const reason = error instanceof Error ? error.message : (zh ? "未知错误" : "Unknown error");
      toast.error(zh ? `图片上传失败：${reason}` : `Image upload failed: ${reason}`);
    }
  };

  const handleSave = (slug: string) => {
    updateMutation.mutate({ slug, ...form });
  };

  if (exchangesQuery.isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white">{zh ? "交易所链接与教程图片管理" : "Exchange links and tutorial images"}</h2>
        <p className="text-sm text-slate-400">
          {zh
            ? "在这里统一管理 5 家交易所的合作链接、邀请码、返佣标签，以及官网注册教程的三张步骤图。"
            : "Manage the partner link, invite code, rebate label, and the three tutorial screenshots for each exchange here."}
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {((exchangesQuery.data ?? []) as ExchangeRow[]).map((ex) => {
          const isEditing = editing === ex.slug;
          const persistedImages = [ex.guideStep1ImageUrl, ex.guideStep2ImageUrl, ex.guideStep3ImageUrl];
          const imageCount = persistedImages.filter(Boolean).length;
          const renderedCount = persistedImages
            .map((url, index) => url || getFallbackGuideImage(ex.slug, (index + 1) as 1 | 2 | 3))
            .filter(Boolean).length;

          return (
            <section key={ex.slug} className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5 shadow-[0_20px_50px_rgba(2,8,23,0.25)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{ex.name ?? ex.slug}</h3>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-cyan-800/50 bg-cyan-950/40 px-2.5 py-1 text-cyan-300">
                      {zh ? "邀请码" : "Invite"} {ex.inviteCode ?? "-"}
                    </span>
                    <span className="rounded-full border border-emerald-800/50 bg-emerald-950/40 px-2.5 py-1 text-emerald-300">
                      {zh ? "返佣标签" : "Rebate"} {ex.rebateRate ?? "-"}
                    </span>
                    <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-slate-300">
                      {zh ? "教程图" : "Guide images"} {imageCount}/3
                    </span>
                  </div>
                </div>
                {!isEditing ? (
                  <button onClick={() => startEdit(ex)} className="admin-btn-ghost text-sm">
                    {zh ? "编辑" : "Edit"}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => handleSave(ex.slug)} disabled={updateMutation.isPending} className="admin-btn-primary text-sm">
                      {zh ? "保存" : "Save"}
                    </button>
                    <button onClick={resetEdit} className="admin-btn-ghost text-sm">
                      {zh ? "取消" : "Cancel"}
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="mt-5 space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <LabeledInput label={zh ? "显示名称" : "Display name"} value={form.name} onChange={v => setForm(prev => ({ ...prev, name: v }))} />
                    <LabeledInput label={zh ? "邀请码" : "Invite code"} value={form.inviteCode} onChange={v => setForm(prev => ({ ...prev, inviteCode: v }))} />
                    <div className="sm:col-span-2">
                      <LabeledInput
                        label={zh ? "合作链接（官网分配域名）" : "Partner link (official assigned domain)"}
                        value={form.referralLink}
                        onChange={v => setForm(prev => ({ ...prev, referralLink: v }))}
                        placeholder="https://..."
                      />
                    </div>
                    <LabeledInput
                      label={zh ? "返佣标签" : "Rebate label"}
                      value={form.rebateRate}
                      onChange={v => setForm(prev => ({ ...prev, rebateRate: v }))}
                      placeholder="20%"
                    />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{zh ? "官网注册三步教程图片" : "Three-step official registration images"}</h4>
                      <p className="mt-1 text-xs text-slate-400">
                        {zh
                          ? "步骤 1 放官网首页，步骤 2 放邀请码位置，步骤 3 放官方下载页。上传后前台会自动引用。"
                          : "Upload homepage, invite field, and official download screenshots. The front-end guide will use them automatically."}
                      </p>
                    </div>

                    <div className="grid gap-3">
                      {stepMeta.map(step => {
                        const imageUrl = form[step.key];
                        const fallbackImageUrl = getFallbackGuideImage(ex.slug, step.step);
                        const previewImageUrl = imageUrl || fallbackImageUrl;
                        const usingFallback = !imageUrl && Boolean(fallbackImageUrl);
                        return (
                          <div key={step.step} className="rounded-xl border border-slate-700/60 bg-slate-950/40 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="text-sm font-medium text-white">{zh ? step.titleZh : step.titleEn}</div>
                                <div className="text-xs text-slate-400">
                                  {zh ? "可上传新图，也可手动粘贴外部图片链接。" : "Upload a new image or paste an external image URL."}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => triggerFilePicker(ex.slug, step.step)}
                                className="admin-btn-primary text-xs"
                                disabled={uploadMutation.isPending}
                              >
                                {uploadMutation.isPending ? (zh ? "上传中..." : "Uploading...") : (zh ? "上传图片" : "Upload")}
                              </button>
                            </div>

                            <input
                              ref={node => {
                                fileInputRefs.current[`${ex.slug}-${step.step}`] = node;
                              }}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => handleUpload(ex.slug, step.step, e.target.files?.[0])}
                            />

                            <div className="mt-3 grid gap-3 lg:grid-cols-[220px,1fr]">
                              <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/80">
                                {previewImageUrl ? (
                                  <img src={previewImageUrl} alt={zh ? step.titleZh : step.titleEn} className="h-36 w-full object-cover" />
                                ) : (
                                  <div className="flex h-36 items-center justify-center px-4 text-center text-xs text-slate-500">
                                    {zh ? "暂未上传图片" : "No image uploaded yet"}
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2">
                                {usingFallback ? (
                                  <div className="rounded-lg border border-amber-700/40 bg-amber-950/20 px-3 py-2 text-xs text-amber-300">
                                    {zh ? "当前前台使用默认图。上传后会自动覆盖默认图。" : "Front-end is using a built-in fallback image. Upload to override it."}
                                  </div>
                                ) : null}
                                <LabeledInput
                                  label={zh ? "图片链接" : "Image URL"}
                                  value={imageUrl}
                                  onChange={v => setForm(prev => ({ ...prev, [step.key]: v }))}
                                  placeholder="https://..."
                                />
                                <div className="text-xs text-slate-500">
                                  {zh
                                    ? "如果你已经有外部图床链接，也可以直接贴在这里再点保存。"
                                    : "If you already host the image elsewhere, paste the URL here and save."}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/35 p-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{zh ? "合作链接" : "Partner link"}</div>
                    <div className="mt-2 break-all text-sm text-slate-300">{ex.referralLink || (zh ? "未设置" : "Not set")}</div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/35 p-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{zh ? "教程图状态" : "Guide image status"}</div>
                    <div className="mt-2 text-sm text-slate-300">
                      {zh ? `数据库已配置 ${imageCount} / 3 张` : `DB configured ${imageCount} / 3 images`}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {zh ? `前台当前可显示 ${renderedCount} / 3 张（含默认图）` : `Front-end renders ${renderedCount} / 3 (includes defaults)`}
                    </div>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

// ─── Types ─────────────────────────────────────────────────────────────────────
type Tab = "exchanges" | "contacts" | "tools" | "news" | "articles" | "platforms" | "publishLogs" | "settings";

// ─── Shared UI helpers ─────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function LabeledInput({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <input
        type={type}
        className="admin-input w-full"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

// ─── Exchanges Tab ─────────────────────────────────────────────────────────────
function ExchangesTab({ zh }: { zh: boolean }) {

  const exchangesQuery = trpc.exchanges.list.useQuery();
  const updateMutation = trpc.exchanges.update.useMutation({
    onSuccess: () => {
      toast.success(zh ? "保存成功" : "Saved");
      exchangesQuery.refetch();
      setEditing(null);
    },
    onError: (e) => toast.error(zh ? "保存失败" : "Save failed"),
  });

  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<{ referralLink?: string; inviteCode?: string; rebateRate?: string; name?: string }>({});

  const startEdit = (ex: { slug: string; referralLink?: string | null; inviteCode?: string | null; rebateRate?: string | null; name?: string | null }) => {
    setEditing(ex.slug);
    setForm({
      referralLink: ex.referralLink ?? "",
      inviteCode: ex.inviteCode ?? "",
      rebateRate: ex.rebateRate ?? "",
      name: ex.name ?? "",
    });
  };

  if (exchangesQuery.isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-4">{zh ? "交易所返佣链接管理" : "Exchange Referral Links"}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 text-left">
              <th className="py-3 px-4">{zh ? "交易所" : "Exchange"}</th>
              <th className="py-3 px-4">{zh ? "返佣链接" : "Referral Link"}</th>
              <th className="py-3 px-4">{zh ? "邀请码" : "Invite Code"}</th>
              <th className="py-3 px-4">{zh ? "返佣比例" : "Rebate Rate"}</th>
              <th className="py-3 px-4">{zh ? "操作" : "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {(exchangesQuery.data ?? []).map((ex) => (
              <tr key={ex.slug} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                {editing === ex.slug ? (
                  <>
                    <td className="py-3 px-4">
                      <input className="admin-input w-24" value={form.name ?? ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </td>
                    <td className="py-3 px-4">
                      <input className="admin-input w-64" value={form.referralLink ?? ""} onChange={e => setForm(f => ({ ...f, referralLink: e.target.value }))} placeholder="https://..." />
                    </td>
                    <td className="py-3 px-4">
                      <input className="admin-input w-28" value={form.inviteCode ?? ""} onChange={e => setForm(f => ({ ...f, inviteCode: e.target.value }))} />
                    </td>
                    <td className="py-3 px-4">
                      <input className="admin-input w-20" value={form.rebateRate ?? ""} onChange={e => setForm(f => ({ ...f, rebateRate: e.target.value }))} placeholder="60%" />
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <button onClick={() => updateMutation.mutate({ slug: ex.slug, ...form })} disabled={updateMutation.isPending} className="admin-btn-primary text-xs">
                        {zh ? "保存" : "Save"}
                      </button>
                      <button onClick={() => setEditing(null)} className="admin-btn-ghost text-xs">{zh ? "取消" : "Cancel"}</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-3 px-4 font-medium text-white">{ex.name ?? ex.slug}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs">
                      {ex.referralLink ? (
                        <a href={ex.referralLink} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline truncate block max-w-xs">{ex.referralLink}</a>
                      ) : <span className="text-slate-500">—</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{ex.inviteCode ?? "—"}</td>
                    <td className="py-3 px-4">
                      {ex.rebateRate ? (
                        <span className="px-2 py-0.5 bg-emerald-900/60 text-emerald-300 rounded text-xs font-mono">{ex.rebateRate}</span>
                      ) : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => startEdit(ex)} className="admin-btn-ghost text-xs">{zh ? "编辑" : "Edit"}</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}



// ─── Contacts Tab ──────────────────────────────────────────────
function ContactsTab({ zh }: { zh: boolean }) {
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const contactsQuery = trpc.contact.list.useQuery(
    { limit: PAGE_SIZE, offset: page * PAGE_SIZE }
  );

  const submissions = contactsQuery.data?.submissions ?? [];
  const total = contactsQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const PLATFORM_LABELS: Record<string, string> = {
    telegram: "Telegram", wechat: "微信", whatsapp: "WhatsApp",
    twitter: "Twitter / X", email: "邮箱", other: "其他",
  };

  if (contactsQuery.isLoading) return <LoadingSpinner />;

  if (contactsQuery.isError) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-red-400">{zh ? "加载失败，请刷新页面" : "Failed to load. Please refresh."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">
          {zh ? "客户联系表单" : "Contact Submissions"}
          <span className="ml-2 text-sm font-normal text-slate-400">({total} {zh ? "条记录" : "records"})</span>
        </h2>
        <button onClick={() => contactsQuery.refetch()} className="admin-btn-primary text-sm">
          {zh ? "刷新" : "Refresh"}
        </button>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center text-slate-500 py-12">
          <div className="text-4xl mb-3">📬</div>
          <p>{zh ? "暂无客户提交的联系表单" : "No contact submissions yet"}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-left">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">{zh ? "提交时间" : "Time"}</th>
                  <th className="py-3 px-4">{zh ? "联系方式" : "Platform"}</th>
                  <th className="py-3 px-4">{zh ? "账号" : "Account"}</th>
                  <th className="py-3 px-4">{zh ? "交易所 UID" : "Exchange UID"}</th>
                  <th className="py-3 px-4">{zh ? "交易所用户名" : "Exchange Username"}</th>
                  <th className="py-3 px-4">{zh ? "留言" : "Message"}</th>
                  <th className="py-3 px-4">{zh ? "IP 地址" : "IP Address"}</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s, i) => (
                  <tr key={s.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-500 text-xs">{page * PAGE_SIZE + i + 1}</td>
                    <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleString(zh ? "zh-CN" : "en-US", {
                        month: "2-digit", day: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-900/40 text-cyan-300 border border-cyan-800/40">
                        {PLATFORM_LABELS[s.platform] ?? s.platform}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white font-medium">{s.accountName}</td>
                    <td className="py-3 px-4 text-slate-300">{s.exchangeUid || <span className="text-slate-600">—</span>}</td>
                    <td className="py-3 px-4 text-slate-300">{s.exchangeUsername || <span className="text-slate-600">—</span>}</td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs">
                      <span className="line-clamp-2 text-xs">{s.message || <span className="text-slate-600">—</span>}</span>
                    </td>
                    <td className="py-3 px-4">
                      {s.ipAddress
                        ? <span className="font-mono text-xs text-amber-300 bg-amber-900/20 px-2 py-0.5 rounded border border-amber-800/30">{s.ipAddress}</span>
                        : <span className="text-slate-600">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="admin-btn-primary text-sm disabled:opacity-40"
              >
                {zh ? "上一页" : "Prev"}
              </button>
              <span className="text-slate-400 text-sm">{page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="admin-btn-primary text-sm disabled:opacity-40"
              >
                {zh ? "下一页" : "Next"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Tools Tab ────────────────────────────────────────────────────────────────
const TOOL_CATEGORIES = [
  { key: "price",    zh: "行情价格", en: "Price" },
  { key: "chart",    zh: "图表分析", en: "Charts" },
  { key: "onchain",  zh: "链上数据", en: "On-Chain" },
  { key: "defi",     zh: "DeFi",     en: "DeFi" },
  { key: "nft",      zh: "NFT",      en: "NFT" },
  { key: "security", zh: "安全工具", en: "Security" },
  { key: "tax",      zh: "税务合规", en: "Tax" },
  { key: "news",     zh: "资讯新闻", en: "News" },
  { key: "general",  zh: "综合工具", en: "General" },
];

const EMPTY_TOOL = {
  name: "", nameEn: "", description: "", descriptionEn: "",
  category: "general", source: "", url: "", icon: "🔧",
  tags: "", difficulty: "beginner" as const, needVpn: true, sortOrder: 0, isActive: true,
};

function ToolsTab({ zh }: { zh: boolean }) {
  const toolsQuery = trpc.tools.listAll.useQuery();
  const upsertMutation = trpc.tools.upsert.useMutation({
    onSuccess: () => { toast.success(zh ? "保存成功" : "Saved"); toolsQuery.refetch(); setEditing(null); },
    onError: () => toast.error(zh ? "保存失败" : "Save failed"),
  });
  const deleteMutation = trpc.tools.delete.useMutation({
    onSuccess: () => { toast.success(zh ? "已删除" : "Deleted"); toolsQuery.refetch(); },
    onError: () => toast.error(zh ? "删除失败" : "Delete failed"),
  });

  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<typeof EMPTY_TOOL & { id?: number }>(EMPTY_TOOL);

  const startNew = () => { setForm(EMPTY_TOOL); setEditing("new"); };
  const startEdit = (t: any) => {
    setForm({
      id: t.id, name: t.name, nameEn: t.nameEn,
      description: t.description, descriptionEn: t.descriptionEn,
      category: t.category, source: t.source, url: t.url,
      icon: t.icon, tags: t.tags ?? "",
      difficulty: t.difficulty, needVpn: t.needVpn ?? true, sortOrder: t.sortOrder, isActive: !!t.isActive,
    });
    setEditing(t.id);
  };
  const handleSave = () => {
    const { id, ...rest } = form;
    upsertMutation.mutate(editing === "new" ? rest : { id: id!, ...rest });
  };

  if (toolsQuery.isLoading) return <LoadingSpinner />;

  const tools = toolsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">
          {zh ? "币圈工具合集管理" : "Crypto Tools Management"}
          <span className="ml-2 text-sm font-normal text-slate-400">({tools.length} {zh ? "个工具" : "tools"})</span>
        </h2>
        <button onClick={startNew} className="admin-btn-primary text-sm">+ {zh ? "新增工具" : "Add Tool"}</button>
      </div>

      {/* Edit / New Form */}
      {editing !== null && (
        <div className="bg-slate-800/60 border border-cyan-700/40 rounded-xl p-5 mb-4 space-y-3">
          <h3 className="text-white font-semibold mb-2">{editing === "new" ? (zh ? "新增工具" : "New Tool") : (zh ? "编辑工具" : "Edit Tool")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <LabeledInput label={zh ? "工具名称（中文）" : "Name (ZH)"} value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
            <LabeledInput label={zh ? "工具名称（英文）" : "Name (EN)"} value={form.nameEn} onChange={v => setForm(f => ({ ...f, nameEn: v }))} />
            <div className="sm:col-span-2">
              <LabeledInput label={zh ? "功能描述（中文）" : "Description (ZH)"} value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} />
            </div>
            <div className="sm:col-span-2">
              <LabeledInput label={zh ? "功能描述（英文）" : "Description (EN)"} value={form.descriptionEn} onChange={v => setForm(f => ({ ...f, descriptionEn: v }))} />
            </div>
            <LabeledInput label={zh ? "来源 / 提供方" : "Source"} value={form.source} onChange={v => setForm(f => ({ ...f, source: v }))} placeholder="CoinGecko" />
            <LabeledInput label="URL" value={form.url} onChange={v => setForm(f => ({ ...f, url: v }))} placeholder="https://..." />
            <div>
              <label className="block text-xs text-slate-400 mb-1">{zh ? "分类" : "Category"}</label>
              <select className="admin-input w-full" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {TOOL_CATEGORIES.map(c => <option key={c.key} value={c.key}>{zh ? c.zh : c.en}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{zh ? "难度" : "Difficulty"}</label>
              <select className="admin-input w-full" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as any }))}>
                <option value="beginner">{zh ? "新手" : "Beginner"}</option>
                <option value="intermediate">{zh ? "进阶" : "Intermediate"}</option>
                <option value="advanced">{zh ? "高级" : "Advanced"}</option>
              </select>
            </div>
            <LabeledInput label={zh ? "图标（Emoji）" : "Icon (Emoji)"} value={form.icon} onChange={v => setForm(f => ({ ...f, icon: v }))} placeholder="🔧" />
            <LabeledInput label={zh ? "标签（逗号分隔）" : "Tags (comma-separated)"} value={form.tags} onChange={v => setForm(f => ({ ...f, tags: v }))} placeholder="价格,实时,免费" />
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id="toolNeedVpn" checked={!!form.needVpn} onChange={e => setForm(f => ({ ...f, needVpn: e.target.checked }))} className="w-4 h-4 accent-cyan-500" />
              <label htmlFor="toolNeedVpn" className="text-sm text-slate-300">{zh ? "需要 VPN 才能稳定访问" : "Requires VPN for stable access"}</label>
            </div>
            <LabeledInput label={zh ? "排序权重" : "Sort Order"} value={String(form.sortOrder)} onChange={v => setForm(f => ({ ...f, sortOrder: parseInt(v) || 0 }))} type="number" />
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id="toolActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-cyan-500" />
              <label htmlFor="toolActive" className="text-sm text-slate-300">{zh ? "启用（前台可见）" : "Active (visible on site)"}</label>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={upsertMutation.isPending} className="admin-btn-primary">
              {upsertMutation.isPending ? (zh ? "保存中..." : "Saving...") : (zh ? "保存" : "Save")}
            </button>
            <button onClick={() => setEditing(null)} className="admin-btn-ghost">{zh ? "取消" : "Cancel"}</button>
          </div>
        </div>
      )}

      {/* Tools Table */}
      {tools.length === 0 ? (
        <div className="text-center text-slate-500 py-12">
          <div className="text-4xl mb-3">🛠️</div>
          <p>{zh ? "暂无工具，点击上方按钮新增" : "No tools yet. Click above to add."}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-left">
                <th className="py-3 px-3">{zh ? "图标" : "Icon"}</th>
                <th className="py-3 px-3">{zh ? "名称" : "Name"}</th>
                <th className="py-3 px-3">{zh ? "分类" : "Category"}</th>
                <th className="py-3 px-3">{zh ? "来源" : "Source"}</th>
                <th className="py-3 px-3">{zh ? "访问" : "Access"}</th>
                <th className="py-3 px-3">{zh ? "难度" : "Difficulty"}</th>
                <th className="py-3 px-3">{zh ? "状态" : "Status"}</th>
                <th className="py-3 px-3">{zh ? "操作" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {tools.map(t => (
                <tr key={t.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 text-2xl">{t.icon}</td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-white">{zh ? t.name : t.nameEn}</div>
                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{zh ? t.description : t.descriptionEn}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600/40">
                      {TOOL_CATEGORIES.find(c => c.key === t.category)?.[zh ? "zh" : "en"] ?? t.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 text-xs">{t.source}</td>
                  <td className="py-3 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      t.needVpn
                        ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                        : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    }`}>
                      {t.needVpn ? (zh ? "需 VPN" : "VPN") : (zh ? "可直连" : "Direct")}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      t.difficulty === "beginner" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                      t.difficulty === "intermediate" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                      "bg-red-500/20 text-red-400 border-red-500/30"
                    }`}>
                      {t.difficulty === "beginner" ? (zh ? "新手" : "Beginner") :
                       t.difficulty === "intermediate" ? (zh ? "进阶" : "Intermediate") :
                       (zh ? "高级" : "Advanced")}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {t.isActive
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">{zh ? "启用" : "Active"}</span>
                      : <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/40 text-slate-500 border border-slate-600/30">{zh ? "停用" : "Inactive"}</span>
                    }
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(t)} className="admin-btn-ghost text-xs">{zh ? "编辑" : "Edit"}</button>
                      <button
                        onClick={() => { if (confirm(zh ? `确定删除「${t.name}」？` : `Delete "${t.nameEn}"?`)) deleteMutation.mutate({ id: t.id }); }}
                        disabled={deleteMutation.isPending}
                        className="admin-btn-danger text-xs"
                      >{zh ? "删除" : "Delete"}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function LegacySettingsTab({ zh }: { zh: boolean }) {
  const settingsQuery = trpc.settings.getAll.useQuery();
  const setMutation = trpc.settings.set.useMutation({
    onSuccess: () => {
      settingsQuery.refetch();
      toast.success(zh ? "设置已保存" : "Settings saved");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const settings = settingsQuery.data ?? [];

  function getVal(key: string, def: string = "true") {
    return settings.find((s: { key: string; value: string }) => s.key === key)?.value ?? def;
  }

  function toggle(key: string, description: string) {
    const current = getVal(key);
    setMutation.mutate({ key, value: current === "true" ? "false" : "true", description });
  }

  const switchItems = [
    {
      key: "rss_enabled",
      label: zh ? "RSS 自动抓取快讯" : "RSS Auto-fetch News",
      desc: zh ? "每 30 分钟自动从各大媒体抓取最新加密快讯并入库" : "Auto-fetch latest crypto news from media sources every 30 minutes",
      icon: "📡",
    },
    {
      key: "telegram_enabled",
      label: zh ? "Telegram 自动推送" : "Telegram Auto-push",
      desc: zh ? "每条新快讯入库时自动推送到 Telegram 频道（需配置 TELEGRAM_BOT_TOKEN）" : "Auto-push each new article to Telegram channel (requires TELEGRAM_BOT_TOKEN)",
      icon: "✈️",
    },
  ];

  if (settingsQuery.isLoading) return <div className="py-8 text-center text-slate-400">{zh ? "加载中..." : "Loading..."}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-white font-semibold text-lg">{zh ? "系统设置" : "System Settings"}</h2>
      <p className="text-slate-400 text-sm">{zh ? "以下开关可随时切换，无需重新部署，立即生效。" : "These switches take effect immediately without redeployment."}</p>

      {/* Auto-push switches */}
      <div className="space-y-4">
        <h3 className="text-slate-300 font-medium text-sm uppercase tracking-wider">{zh ? "自动化功能" : "Automation"}</h3>
        {switchItems.map(item => {
          const isOn = getVal(item.key) === "true";
          return (
            <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{item.icon}</span>
                <div>
                  <div className="text-white font-medium text-sm">{item.label}</div>
                  <div className="text-slate-400 text-xs mt-0.5 max-w-md">{item.desc}</div>
                </div>
              </div>
              <button
                onClick={() => toggle(item.key, item.desc)}
                disabled={setMutation.isPending}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ml-4 ${
                  isOn ? "bg-cyan-500" : "bg-slate-600"
                } ${setMutation.isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    isOn ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Raw settings table */}
      {settings.length > 0 && (
        <div>
          <h3 className="text-slate-300 font-medium text-sm uppercase tracking-wider mb-3">{zh ? "所有设置记录" : "All Settings"}</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-700/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/40">
                  <th className="text-left px-4 py-2 text-slate-400 font-medium">Key</th>
                  <th className="text-left px-4 py-2 text-slate-400 font-medium">{zh ? "值" : "Value"}</th>
                  <th className="text-left px-4 py-2 text-slate-400 font-medium">{zh ? "最后更新" : "Updated"}</th>
                </tr>
              </thead>
              <tbody>
                {settings.map((s: { key: string; value: string; description: string | null; updatedAt: Date }) => (
                  <tr key={s.key} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                    <td className="px-4 py-2 font-mono text-cyan-400">{s.key}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        s.value === "true" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      }`}>{s.value}</span>
                    </td>
                    <td className="px-4 py-2 text-slate-500 text-xs">{new Date(s.updatedAt).toLocaleString("zh-CN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
// ─── NewsTab ───────────────────────────────────────────────────────────────────
function SettingsTab({ zh }: { zh: boolean }) {
  const settingsQuery = trpc.settings.getAll.useQuery();
  const platformsQuery = trpc.platforms.list.useQuery();
  const setMutation = trpc.settings.set.useMutation({
    onSuccess: () => {
      settingsQuery.refetch();
      platformsQuery.refetch();
      toast.success(zh ? "设置已保存" : "Settings saved");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const settings = settingsQuery.data ?? [];
  const platforms = platformsQuery.data ?? [];

  function getVal(key: string, def: string = "true") {
    return settings.find((s: { key: string; value: string }) => s.key === key)?.value ?? def;
  }

  function toggle(key: string, description: string) {
    const current = getVal(key);
    setMutation.mutate({ key, value: current === "true" ? "false" : "true", description });
  }

  function saveSetting(key: string, value: string, description: string) {
    setMutation.mutate({ key, value, description });
  }

  function parseMultiValue(key: string) {
    const raw = getVal(key, "all").trim();
    if (!raw || raw.toLowerCase() === "all") return [] as string[];
    return raw.split(",").map(item => item.trim()).filter(Boolean);
  }

  function saveMultiValue(key: string, nextValues: string[], description: string) {
    saveSetting(key, nextValues.length ? nextValues.join(",") : "all", description);
  }

  const switchItems = [
    {
      key: "rss_enabled",
      label: zh ? "RSS 自动抓取快讯" : "RSS Auto-fetch News",
      desc: zh ? "自动从配置好的 RSS 来源抓取快讯并入库。" : "Automatically fetch news from configured RSS sources and save them into the database.",
      icon: "📰",
    },
    {
      key: "telegram_enabled",
      label: zh ? "Telegram 自动推送" : "Telegram Auto-push",
      desc: zh ? "系统级 Telegram 推送总开关，和平台管理里的 Telegram 开关一起生效。" : "System-wide Telegram push switch. It works together with the Telegram platform switch.",
      icon: "✈️",
    },
    {
      key: "rss_push_enabled",
      label: zh ? "RSS 快讯允许推送" : "RSS Push Enabled",
      desc: zh ? "关闭后仍会抓取入库，但不会自动把 RSS 快讯推送到 Telegram。" : "When off, RSS still ingests news but stops auto-pushing them to Telegram.",
      icon: "📨",
    },
  ];

  const rssSources = useMemo(() => [
    { value: "吳說區塊鏈", labelZh: "吴说区块链", labelEn: "Wu Blockchain" },
    { value: "Foresight News", labelZh: "Foresight News", labelEn: "Foresight News" },
    { value: "Odaily每日星球", labelZh: "Odaily 每日星球", labelEn: "Odaily" },
    { value: "CoinDesk", labelZh: "CoinDesk", labelEn: "CoinDesk" },
    { value: "CoinTelegraph", labelZh: "CoinTelegraph", labelEn: "CoinTelegraph" },
    { value: "Decrypt", labelZh: "Decrypt", labelEn: "Decrypt" },
  ], []);

  const rssCategories = useMemo(() => [
    { value: "market", labelZh: "行情", labelEn: "Market" },
    { value: "policy", labelZh: "政策监管", labelEn: "Policy" },
    { value: "exchange", labelZh: "交易所", labelEn: "Exchange" },
    { value: "defi", labelZh: "DeFi", labelEn: "DeFi" },
    { value: "nft", labelZh: "NFT", labelEn: "NFT" },
    { value: "other", labelZh: "其他", labelEn: "Other" },
  ], []);

  const rssInterval = getVal("rss_interval_minutes", "10");
  const selectedSources = parseMultiValue("rss_push_sources");
  const selectedCategories = parseMultiValue("rss_push_categories");
  const telegramPlatform = platforms.find((platform: { platform: string }) => platform.platform === "telegram");
  const telegramReady = Boolean(telegramPlatform?.apiKey?.trim() && telegramPlatform?.channelId?.trim());

  if (settingsQuery.isLoading || platformsQuery.isLoading) {
    return <div className="py-8 text-center text-slate-400">{zh ? "加载中..." : "Loading..."}</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-white font-semibold text-lg">{zh ? "系统设置" : "System Settings"}</h2>
      <p className="text-slate-400 text-sm">{zh ? "这些设置会直接影响 RSS 抓取和 Telegram 推送。" : "These settings directly control RSS ingestion and Telegram push behavior."}</p>

      <div className={`rounded-xl border px-4 py-3 text-sm ${
        telegramReady
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          : "border-amber-500/30 bg-amber-500/10 text-amber-100"
      }`}>
        {telegramReady
          ? (zh ? "已检测到 Telegram 平台完整配置，RSS 推送会优先使用平台管理里保存的 Token 和频道 ID。" : "Telegram platform config is ready. RSS push will prefer the token and channel ID saved in Platform Management.")
          : (zh ? "当前 Telegram 平台缺少 Token 或频道 ID。即使开关打开，也可能不会推送，请先去平台管理补齐。" : "Telegram platform config is incomplete. Even with switches on, pushes may still fail until token and channel ID are filled in Platform Management.")}
      </div>

      <div className="space-y-4">
        <h3 className="text-slate-300 font-medium text-sm uppercase tracking-wider">{zh ? "自动化开关" : "Automation"}</h3>
        {switchItems.map(item => {
          const isOn = getVal(item.key) === "true";
          return (
            <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{item.icon}</span>
                <div>
                  <div className="text-white font-medium text-sm">{item.label}</div>
                  <div className="text-slate-400 text-xs mt-0.5 max-w-md">{item.desc}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggle(item.key, item.desc)}
                disabled={setMutation.isPending}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ml-4 ${
                  isOn ? "bg-cyan-500" : "bg-slate-600"
                } ${setMutation.isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    isOn ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 space-y-3">
          <h3 className="text-white font-medium">{zh ? "快讯抓取频率" : "RSS Fetch Frequency"}</h3>
          <p className="text-xs text-slate-400">{zh ? "修改后下一轮调度就会自动读取新的频率，无需重新部署。" : "The next scheduler loop will read the new interval automatically without redeploying."}</p>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={180}
              defaultValue={rssInterval}
              onBlur={(e) => {
                const next = Math.min(180, Math.max(1, Number.parseInt(e.target.value || "10", 10) || 10));
                saveSetting("rss_interval_minutes", String(next), zh ? "RSS 快讯自动抓取间隔（分钟）" : "RSS fetch interval in minutes");
              }}
              className="admin-input w-full"
            />
            <button
              type="button"
              onClick={() => saveSetting("rss_interval_minutes", "10", zh ? "RSS 快讯自动抓取间隔（分钟）" : "RSS fetch interval in minutes")}
              className="admin-btn-ghost shrink-0"
            >
              {zh ? "重置" : "Reset"}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 space-y-3">
          <h3 className="text-white font-medium">{zh ? "快讯推送方向" : "Push Filters"}</h3>
          <p className="text-xs text-slate-400">{zh ? "不选代表全部推送；选了之后只推对应来源或分类。" : "Select nothing to push everything. Once selected, only those sources or categories will be pushed."}</p>
          <div>
            <label className="block text-xs text-slate-400 mb-2">{zh ? "来源筛选" : "Source Filter"}</label>
            <div className="flex flex-wrap gap-2">
              {rssSources.map(source => {
                const active = selectedSources.includes(source.value);
                return (
                  <button
                    key={source.value}
                    type="button"
                    onClick={() => {
                      const next = active
                        ? selectedSources.filter(item => item !== source.value)
                        : [...selectedSources, source.value];
                      saveMultiValue("rss_push_sources", next, zh ? "允许自动推送的 RSS 来源，逗号分隔，all 表示全部" : "Allowed RSS push sources, comma separated, all means all");
                    }}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${
                      active
                        ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-200"
                        : "border-slate-600/60 bg-slate-900/40 text-slate-300"
                    }`}
                  >
                    {zh ? source.labelZh : source.labelEn}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-2">{zh ? "分类筛选" : "Category Filter"}</label>
            <div className="flex flex-wrap gap-2">
              {rssCategories.map(category => {
                const active = selectedCategories.includes(category.value);
                return (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => {
                      const next = active
                        ? selectedCategories.filter(item => item !== category.value)
                        : [...selectedCategories, category.value];
                      saveMultiValue("rss_push_categories", next, zh ? "允许自动推送的快讯分类，逗号分隔，all 表示全部" : "Allowed RSS push categories, comma separated, all means all");
                    }}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${
                      active
                        ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-200"
                        : "border-slate-600/60 bg-slate-900/40 text-slate-300"
                    }`}
                  >
                    {zh ? category.labelZh : category.labelEn}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {settings.length > 0 && (
        <div>
          <h3 className="text-slate-300 font-medium text-sm uppercase tracking-wider mb-3">{zh ? "全部设置记录" : "All Settings"}</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-700/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/40">
                  <th className="text-left px-4 py-2 text-slate-400 font-medium">Key</th>
                  <th className="text-left px-4 py-2 text-slate-400 font-medium">{zh ? "值" : "Value"}</th>
                  <th className="text-left px-4 py-2 text-slate-400 font-medium">{zh ? "最后更新" : "Updated"}</th>
                </tr>
              </thead>
              <tbody>
                {settings.map((s: { key: string; value: string; description: string | null; updatedAt: Date }) => (
                  <tr key={s.key} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                    <td className="px-4 py-2 font-mono text-cyan-400">{s.key}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        s.value === "true" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      }`}>
                        {s.value}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-500 text-xs">{new Date(s.updatedAt).toLocaleString("zh-CN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function NewsTab({ zh }: { zh: boolean }) {
  const utils = trpc.useUtils();
  const { data: newsList, isLoading } = trpc.news.listAll.useQuery({ limit: 100, offset: 0 });
  const createMutation = trpc.news.create.useMutation({ onSuccess: () => { utils.news.listAll.invalidate(); toast.success(zh ? "已添加" : "Added"); setForm(null); } });
  const updateMutation = trpc.news.update.useMutation({ onSuccess: () => { utils.news.listAll.invalidate(); toast.success(zh ? "已更新" : "Updated"); setEditing(null); } });
  const deleteMutation = trpc.news.delete.useMutation({ onSuccess: () => { utils.news.listAll.invalidate(); toast.success(zh ? "已删除" : "Deleted"); } });

  type NewsForm = { title: string; summary: string; source: string; url: string; category: string; isPinned: boolean; isActive: boolean; };
  const emptyForm: NewsForm = { title: "", summary: "", source: "律动BlockBeats", url: "", category: "market", isPinned: false, isActive: true };
  const [form, setForm] = useState<NewsForm | null>(null);
  const [editing, setEditing] = useState<(NewsForm & { id: number }) | null>(null);

  const categoryLabel: Record<string, string> = { market: "行情", policy: "政策", exchange: "交易所", defi: "DeFi", nft: "NFT", other: "其他" };

  function NewsForm({ value, onChange, onSubmit, onCancel, loading }: {
    value: NewsForm; onChange: (v: NewsForm) => void;
    onSubmit: () => void; onCancel: () => void; loading: boolean;
  }) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-800/60 rounded-xl border border-slate-700/50 mb-4">
        <div className="md:col-span-2"><LabeledInput label={zh ? "标题 *" : "Title *"} value={value.title} onChange={v => onChange({ ...value, title: v })} /></div>
        <div className="md:col-span-2"><LabeledInput label={zh ? "摘要" : "Summary"} value={value.summary} onChange={v => onChange({ ...value, summary: v })} /></div>
        <LabeledInput label={zh ? "来源" : "Source"} value={value.source} onChange={v => onChange({ ...value, source: v })} />
        <LabeledInput label="URL" value={value.url} onChange={v => onChange({ ...value, url: v })} />
        <div>
          <label className="block text-xs text-slate-400 mb-1">{zh ? "分类" : "Category"}</label>
          <select className="admin-input w-full" value={value.category} onChange={e => onChange({ ...value, category: e.target.value })}>
            {Object.entries(categoryLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-4 pt-5">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={value.isPinned} onChange={e => onChange({ ...value, isPinned: e.target.checked })} className="w-4 h-4" />
            {zh ? "置顶" : "Pinned"}
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={value.isActive} onChange={e => onChange({ ...value, isActive: e.target.checked })} className="w-4 h-4" />
            {zh ? "显示" : "Active"}
          </label>
        </div>
        <div className="md:col-span-2 flex gap-2 justify-end">
          <button className="admin-btn-ghost" onClick={onCancel}>{zh ? "取消" : "Cancel"}</button>
          <button className="admin-btn-primary" onClick={onSubmit} disabled={loading || !value.title}>{zh ? "保存" : "Save"}</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold text-lg">{zh ? "快讯管理" : "News Management"}</h2>
        {!form && !editing && (
          <button className="admin-btn-primary" onClick={() => setForm(emptyForm)}>{zh ? "+ 新增快讯" : "+ Add News"}</button>
        )}
      </div>

      {form && (
        <NewsForm value={form} onChange={setForm}
          onSubmit={() => createMutation.mutate({ ...form, category: form.category as any })}
          onCancel={() => setForm(null)} loading={createMutation.isPending} />
      )}

      {isLoading ? <LoadingSpinner /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50 text-slate-400 text-xs">
                <th className="text-left py-2 pr-3 w-8">ID</th>
                <th className="text-left py-2 pr-3">{zh ? "标题" : "Title"}</th>
                <th className="text-left py-2 pr-3 hidden md:table-cell">{zh ? "来源" : "Source"}</th>
                <th className="text-left py-2 pr-3 hidden md:table-cell">{zh ? "分类" : "Cat"}</th>
                <th className="text-left py-2 pr-3 hidden lg:table-cell">{zh ? "状态" : "Status"}</th>
                <th className="text-right py-2">{zh ? "操作" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {(newsList ?? []).map((n: any) => (
                <tr key={n.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                  <td className="py-2 pr-3 text-slate-500 text-xs">{n.id}</td>
                  <td className="py-2 pr-3 text-slate-200 max-w-xs">
                    {editing?.id === n.id ? (
                      <NewsForm value={editing as any} onChange={v => setEditing({ ...v, id: n.id })}
                        onSubmit={() => editing && updateMutation.mutate({ id: n.id, title: editing.title, summary: editing.summary, source: editing.source, url: editing.url, category: editing.category as any, isPinned: editing.isPinned, isActive: editing.isActive })}
                        onCancel={() => setEditing(null)} loading={updateMutation.isPending} />
                    ) : (
                      <span className="line-clamp-2">{n.isPinned && "📌 "}{n.title}</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-slate-400 text-xs hidden md:table-cell">{n.source}</td>
                  <td className="py-2 pr-3 hidden md:table-cell">
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-700/60 text-slate-300">{categoryLabel[n.category] ?? n.category}</span>
                  </td>
                  <td className="py-2 pr-3 hidden lg:table-cell">
                    <span className={`px-2 py-0.5 rounded text-xs ${n.isActive ? "bg-green-900/40 text-green-400" : "bg-slate-700/40 text-slate-500"}`}>
                      {n.isActive ? (zh ? "显示" : "Active") : (zh ? "隐藏" : "Hidden")}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    {editing?.id !== n.id && (
                      <div className="flex gap-1 justify-end">
                        <button className="admin-btn-ghost text-xs" onClick={() => setEditing({ id: n.id, title: n.title, summary: n.summary ?? "", source: n.source, url: n.url ?? "", category: n.category, isPinned: n.isPinned, isActive: n.isActive })}>
                          {zh ? "编辑" : "Edit"}
                        </button>
                        <button className="admin-btn-danger text-xs" onClick={() => { if (confirm(zh ? `确定删除？` : `Delete?`)) deleteMutation.mutate({ id: n.id }); }} disabled={deleteMutation.isPending}>
                          {zh ? "删除" : "Del"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Page ───────────────────────────────────────────────────────────
export default function AdminExchangeGuide() {
  const { language } = useLanguage();
  const zh = language === "zh";
  const { user, loading } = useAuth({ redirectOnUnauthenticated: false });
  const [tab, setTab] = useState<Tab>("exchanges");

  const tabs: { id: Tab; label: string }[] = [
    { id: "exchanges", label: zh ? "🔗 返佣链接" : "🔗 Referral Links" },
    { id: "contacts", label: zh ? "📬 联系记录" : "📬 Contacts" },
    { id: "tools", label: zh ? "🛠️ 工具合集" : "🛠️ Tools" },
    { id: "news", label: zh ? "📰 快讯管理" : "📰 News" },
    { id: "articles", label: zh ? "✍️ 文章管理" : "✍️ Articles" },
    { id: "platforms", label: zh ? "📡 媒体推送" : "📡 Platforms" },
    { id: "publishLogs", label: zh ? "📋 推送日志" : "📋 Publish Logs" },
    { id: "settings", label: zh ? "⚙️ 系统设置" : "⚙️ Settings" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A192F" }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A192F" }}>
        <div className="text-center text-white max-w-sm">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold mb-2">{zh ? "需要登录" : "Login Required"}</h1>
          <p className="text-slate-400 mb-6">{zh ? "请先登录管理员账户才能访问后台" : "Please log in with an admin account to continue"}</p>
          <a href="/manage-m2u0z0i04" className="admin-btn-primary inline-block">{zh ? "前往登录" : "Go to Login"}</a>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A192F" }}>
        <div className="text-center text-white max-w-sm">
          <div className="text-5xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold mb-2">{zh ? "权限不足" : "Access Denied"}</h1>
          <p className="text-slate-400">{zh ? "此页面仅限管理员访问" : "This page is for admins only"}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .admin-input {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(100, 116, 139, 0.4);
          border-radius: 0.5rem;
          color: #e2e8f0;
          padding: 0.375rem 0.625rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .admin-input:focus { border-color: #22d3ee; box-shadow: 0 0 0 2px rgba(34,211,238,0.15); }
        .admin-btn-primary {
          background: linear-gradient(135deg, #0891b2, #0e7490);
          color: white; border: none; border-radius: 0.5rem;
          padding: 0.375rem 0.875rem; font-size: 0.875rem; font-weight: 500;
          cursor: pointer; transition: opacity 0.15s;
        }
        .admin-btn-primary:hover:not(:disabled) { opacity: 0.85; }
        .admin-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .admin-btn-ghost {
          background: rgba(100,116,139,0.15); color: #94a3b8;
          border: 1px solid rgba(100,116,139,0.3); border-radius: 0.5rem;
          padding: 0.375rem 0.875rem; font-size: 0.875rem;
          cursor: pointer; transition: all 0.15s;
        }
        .admin-btn-ghost:hover { background: rgba(100,116,139,0.25); color: #e2e8f0; }
        .admin-btn-danger {
          background: rgba(239,68,68,0.15); color: #f87171;
          border: 1px solid rgba(239,68,68,0.3); border-radius: 0.5rem;
          padding: 0.375rem 0.875rem; font-size: 0.875rem;
          cursor: pointer; transition: all 0.15s;
        }
        .admin-btn-danger:hover { background: rgba(239,68,68,0.25); }
      `}</style>

      <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0A192F 0%, #0d2137 100%)" }}>
        {/* Header */}
        <div className="border-b border-slate-700/50 bg-slate-900/60 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" className="text-slate-400 hover:text-white transition-colors text-sm">← {zh ? "返回网站" : "Back to Site"}</a>
              <span className="text-slate-600">|</span>
              <h1 className="text-white font-bold text-lg">Get8 Pro {zh ? "管理后台" : "Admin"}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">
                {(user as { name?: string; email?: string }).name ?? (user as { name?: string; email?: string }).email ?? (zh ? "管理员" : "Admin")}
                <span className="ml-2 px-2 py-0.5 bg-cyan-900/60 text-cyan-300 rounded text-xs">admin</span>
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Tab navigation */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  tab === t.id
                    ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/40"
                    : "bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
            {tab === "exchanges" && <ExchangeGuideManager zh={zh} />}
            {tab === "contacts" && <ContactsTab zh={zh} />}
            {tab === "tools" && <ToolsTab zh={zh} />}
            {tab === "news" && <NewsTab zh={zh} />}
            {tab === "settings" && <SettingsTab zh={zh} />}
            {tab === "articles" && <ArticlesTab zh={zh} />}
            {tab === "platforms" && <PlatformsTab zh={zh} />}
            {tab === "publishLogs" && <PublishLogsTab zh={zh} />}
          </div>
        </div>
      </div>
    </>
  );
}
