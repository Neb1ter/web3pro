import { useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArticlesTab } from "./admin/AdminArticlesTab";
import { SensitiveWordsTab } from "./admin/AdminSensitiveWordsTab";
import { PlatformsTab } from "./admin/AdminPlatformsTab";
import { PublishLogsTab } from "./admin/AdminPublishLogsTab";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Tab = "exchanges" | "categories" | "featureSupport" | "contacts" | "tools" | "news" | "articles" | "sensitiveWords" | "platforms" | "publishLogs" | "settings";

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

// ─── Categories Tab ────────────────────────────────────────────────────────────
const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
type Difficulty = typeof DIFFICULTIES[number];
const EMPTY_CAT = { slug: "", nameZh: "", nameEn: "", icon: "", descZh: "", descEn: "", difficulty: "beginner" as Difficulty, sortOrder: 0 };

function CategoriesTab({ zh }: { zh: boolean }) {

  const categoriesQuery = trpc.exchangeGuide.categories.useQuery();
  const createMutation = trpc.adminExchangeGuide.createCategory.useMutation({
    onSuccess: () => { toast.success(zh ? "创建成功" : "Created"); categoriesQuery.refetch(); setShowCreate(false); setCreateForm(EMPTY_CAT); },
    onError: (e) => toast.error(zh ? "创建失败" : "Failed"),
  });
  const updateMutation = trpc.adminExchangeGuide.updateCategory.useMutation({
    onSuccess: () => { toast.success(zh ? "更新成功" : "Updated"); categoriesQuery.refetch(); setEditing(null); },
    onError: (e) => toast.error(zh ? "更新失败" : "Failed"),
  });
  const deleteMutation = trpc.adminExchangeGuide.deleteCategory.useMutation({
    onSuccess: () => { toast.success(zh ? "已删除" : "Deleted"); categoriesQuery.refetch(); },
    onError: (e) => toast.error(zh ? "删除失败" : "Failed"),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CAT);
  const [editing, setEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<typeof EMPTY_CAT>>({});

  const diffLabel = (d: string) => ({ beginner: zh ? "入门" : "Beginner", intermediate: zh ? "进阶" : "Intermediate", advanced: zh ? "高级" : "Advanced" }[d] ?? d);
  const diffColor = (d: string) => ({ beginner: "bg-green-900/60 text-green-300", intermediate: "bg-yellow-900/60 text-yellow-300", advanced: "bg-red-900/60 text-red-300" }[d] ?? "bg-slate-700 text-slate-300");

  if (categoriesQuery.isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">{zh ? "功能分类管理" : "Feature Categories"}</h2>
        <button onClick={() => setShowCreate(v => !v)} className="admin-btn-primary text-sm">
          {showCreate ? (zh ? "取消" : "Cancel") : (zh ? "+ 新增分类" : "+ New Category")}
        </button>
      </div>

      {showCreate && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3 mb-4">
          <h3 className="text-white font-semibold">{zh ? "新增功能分类" : "New Category"}</h3>
          <div className="grid grid-cols-2 gap-3">
            <LabeledInput label={zh ? "Slug (唯一标识)" : "Slug"} value={createForm.slug} onChange={v => setCreateForm(f => ({ ...f, slug: v }))} placeholder="spot-trading" />
            <LabeledInput label={zh ? "图标 (emoji)" : "Icon"} value={createForm.icon} onChange={v => setCreateForm(f => ({ ...f, icon: v }))} placeholder="📈" />
            <LabeledInput label={zh ? "中文名称" : "Name (ZH)"} value={createForm.nameZh} onChange={v => setCreateForm(f => ({ ...f, nameZh: v }))} />
            <LabeledInput label={zh ? "英文名称" : "Name (EN)"} value={createForm.nameEn} onChange={v => setCreateForm(f => ({ ...f, nameEn: v }))} />
            <LabeledInput label={zh ? "中文描述" : "Desc (ZH)"} value={createForm.descZh} onChange={v => setCreateForm(f => ({ ...f, descZh: v }))} />
            <LabeledInput label={zh ? "英文描述" : "Desc (EN)"} value={createForm.descEn} onChange={v => setCreateForm(f => ({ ...f, descEn: v }))} />
            <div>
              <label className="block text-xs text-slate-400 mb-1">{zh ? "难度" : "Difficulty"}</label>
              <select className="admin-input w-full" value={createForm.difficulty} onChange={e => setCreateForm(f => ({ ...f, difficulty: e.target.value as Difficulty }))}>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{diffLabel(d)}</option>)}
              </select>
            </div>
            <LabeledInput label={zh ? "排序 (数字越小越靠前)" : "Sort Order"} value={String(createForm.sortOrder)} onChange={v => setCreateForm(f => ({ ...f, sortOrder: Number(v) || 0 }))} type="number" />
          </div>
          <button
            onClick={() => createMutation.mutate(createForm)}
            disabled={createMutation.isPending || !createForm.slug || !createForm.nameZh}
            className="admin-btn-primary"
          >
            {createMutation.isPending ? (zh ? "创建中..." : "Creating...") : (zh ? "确认创建" : "Create")}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {(categoriesQuery.data ?? []).map((cat) => (
          <div key={cat.id} className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
            {editing === cat.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <LabeledInput label={zh ? "中文名称" : "Name (ZH)"} value={editForm.nameZh ?? cat.nameZh} onChange={v => setEditForm(f => ({ ...f, nameZh: v }))} />
                  <LabeledInput label={zh ? "英文名称" : "Name (EN)"} value={editForm.nameEn ?? cat.nameEn} onChange={v => setEditForm(f => ({ ...f, nameEn: v }))} />
                  <LabeledInput label={zh ? "图标" : "Icon"} value={editForm.icon ?? cat.icon} onChange={v => setEditForm(f => ({ ...f, icon: v }))} />
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">{zh ? "难度" : "Difficulty"}</label>
                    <select className="admin-input w-full" value={editForm.difficulty ?? cat.difficulty} onChange={e => setEditForm(f => ({ ...f, difficulty: e.target.value as Difficulty }))}>
                      {DIFFICULTIES.map(d => <option key={d} value={d}>{diffLabel(d)}</option>)}
                    </select>
                  </div>
                  <LabeledInput label={zh ? "中文描述" : "Desc (ZH)"} value={editForm.descZh ?? cat.descZh} onChange={v => setEditForm(f => ({ ...f, descZh: v }))} />
                  <LabeledInput label={zh ? "英文描述" : "Desc (EN)"} value={editForm.descEn ?? cat.descEn} onChange={v => setEditForm(f => ({ ...f, descEn: v }))} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => updateMutation.mutate({ slug: cat.slug, ...editForm })} disabled={updateMutation.isPending} className="admin-btn-primary text-sm">{zh ? "保存" : "Save"}</button>
                  <button onClick={() => setEditing(null)} className="admin-btn-ghost text-sm">{zh ? "取消" : "Cancel"}</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold">{zh ? cat.nameZh : cat.nameEn}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">{cat.slug}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${diffColor(cat.difficulty)}`}>{diffLabel(cat.difficulty)}</span>
                    </div>
                    <p className="text-slate-400 text-sm mt-0.5">{zh ? cat.descZh : cat.descEn}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 ml-4">
                  <button onClick={() => { setEditing(cat.id); setEditForm({}); }} className="admin-btn-ghost text-xs">{zh ? "编辑" : "Edit"}</button>
                  <button
                    onClick={() => { if (confirm(zh ? `确认删除「${cat.nameZh}」？` : `Delete "${cat.nameEn}"?`)) deleteMutation.mutate({ slug: cat.slug }); }}
                    className="admin-btn-danger text-xs"
                  >
                    {zh ? "删除" : "Del"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {(categoriesQuery.data ?? []).length === 0 && (
          <div className="text-center text-slate-500 py-8">{zh ? "暂无分类，点击上方按钮新增" : "No categories yet. Click above to add one."}</div>
        )}
      </div>
    </div>
  );
}

// ─── Feature Support Tab ───────────────────────────────────────────────────────
function FeatureSupportTab({ zh }: { zh: boolean }) {

  const categoriesQuery = trpc.exchangeGuide.categories.useQuery();
  const allSupportQuery = trpc.exchangeGuide.allFeatureSupport.useQuery();
  const exchangesQuery = trpc.exchanges.list.useQuery();

  const upsertMutation = trpc.adminExchangeGuide.upsertSupport.useMutation({
    onSuccess: () => { toast.success(zh ? "保存成功" : "Saved"); allSupportQuery.refetch(); setEditing(null); setShowAdd(false); },
    onError: (e) => toast.error(zh ? "保存失败" : "Failed"),
  });
  const deleteMutation = trpc.adminExchangeGuide.deleteSupport.useMutation({
    onSuccess: () => { toast.success(zh ? "已删除" : "Deleted"); allSupportQuery.refetch(); },
    onError: (e) => toast.error(zh ? "删除失败" : "Failed"),
  });

  const EMPTY_ADD = { exchangeSlug: "", featureSlug: "", levelZh: "", levelEn: "", detailZh: "", detailEn: "", supported: 1, highlight: 0, maxLeverage: "", feeInfo: "" };
  const [selectedFeature, setSelectedFeature] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string | number>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD);

  const categories = categoriesQuery.data ?? [];
  const exchanges = exchangesQuery.data ?? [];
  const allSupport = allSupportQuery.data ?? [];
  const filteredSupport = selectedFeature ? allSupport.filter(s => s.featureSlug === selectedFeature) : allSupport;

  if (categoriesQuery.isLoading || allSupportQuery.isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">{zh ? "交易所功能支持详情" : "Exchange Feature Support"}</h2>
        <button onClick={() => setShowAdd(v => !v)} className="admin-btn-primary text-sm">
          {showAdd ? (zh ? "取消" : "Cancel") : (zh ? "+ 新增记录" : "+ Add Record")}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <label className="text-slate-400 text-sm shrink-0">{zh ? "按功能筛选：" : "Filter:"}</label>
        <select className="admin-input" value={selectedFeature} onChange={e => setSelectedFeature(e.target.value)}>
          <option value="">{zh ? "全部功能" : "All Features"}</option>
          {categories.map(c => <option key={c.slug} value={c.slug}>{zh ? c.nameZh : c.nameEn}</option>)}
        </select>
        <span className="text-slate-500 text-sm">{filteredSupport.length} {zh ? "条" : "records"}</span>
      </div>

      {showAdd && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3 mb-4">
          <h3 className="text-white font-semibold">{zh ? "新增功能支持记录" : "Add Feature Support"}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">{zh ? "交易所" : "Exchange"}</label>
              <select className="admin-input w-full" value={addForm.exchangeSlug} onChange={e => setAddForm(f => ({ ...f, exchangeSlug: e.target.value }))}>
                <option value="">{zh ? "选择交易所" : "Select Exchange"}</option>
                {exchanges.map(ex => <option key={ex.slug} value={ex.slug}>{ex.name ?? ex.slug}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{zh ? "功能分类" : "Feature"}</label>
              <select className="admin-input w-full" value={addForm.featureSlug} onChange={e => setAddForm(f => ({ ...f, featureSlug: e.target.value }))}>
                <option value="">{zh ? "选择功能" : "Select Feature"}</option>
                {categories.map(c => <option key={c.slug} value={c.slug}>{zh ? c.nameZh : c.nameEn}</option>)}
              </select>
            </div>
            <LabeledInput label={zh ? "支持等级 (中文)" : "Level (ZH)"} value={addForm.levelZh} onChange={v => setAddForm(f => ({ ...f, levelZh: v }))} placeholder={zh ? "完整支持" : "Full Support"} />
            <LabeledInput label={zh ? "支持等级 (英文)" : "Level (EN)"} value={addForm.levelEn} onChange={v => setAddForm(f => ({ ...f, levelEn: v }))} placeholder="Full Support" />
            <LabeledInput label={zh ? "详情 (中文)" : "Detail (ZH)"} value={addForm.detailZh} onChange={v => setAddForm(f => ({ ...f, detailZh: v }))} />
            <LabeledInput label={zh ? "详情 (英文)" : "Detail (EN)"} value={addForm.detailEn} onChange={v => setAddForm(f => ({ ...f, detailEn: v }))} />
            <LabeledInput label={zh ? "最大杠杆" : "Max Leverage"} value={addForm.maxLeverage} onChange={v => setAddForm(f => ({ ...f, maxLeverage: v }))} placeholder="100x" />
            <LabeledInput label={zh ? "手续费信息" : "Fee Info"} value={addForm.feeInfo} onChange={v => setAddForm(f => ({ ...f, feeInfo: v }))} />
          </div>
          <button
            onClick={() => upsertMutation.mutate(addForm)}
            disabled={upsertMutation.isPending || !addForm.exchangeSlug || !addForm.featureSlug}
            className="admin-btn-primary"
          >
            {upsertMutation.isPending ? (zh ? "保存中..." : "Saving...") : (zh ? "保存" : "Save")}
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 text-left">
              <th className="py-3 px-3">{zh ? "交易所" : "Exchange"}</th>
              <th className="py-3 px-3">{zh ? "功能" : "Feature"}</th>
              <th className="py-3 px-3">{zh ? "支持等级" : "Level"}</th>
              <th className="py-3 px-3">{zh ? "详情摘要" : "Detail"}</th>
              <th className="py-3 px-3">{zh ? "操作" : "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {filteredSupport.map((s) => (
              <tr key={s.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                {editing === s.id ? (
                  <>
                    <td className="py-2 px-3 text-white font-medium">{s.exchangeSlug}</td>
                    <td className="py-2 px-3 text-slate-300">{s.featureSlug}</td>
                    <td className="py-2 px-3">
                      <input className="admin-input w-24" value={String(editForm.levelZh ?? s.levelZh)} onChange={e => setEditForm(f => ({ ...f, levelZh: e.target.value }))} />
                    </td>
                    <td className="py-2 px-3">
                      <input className="admin-input w-48" value={String(editForm.detailZh ?? s.detailZh)} onChange={e => setEditForm(f => ({ ...f, detailZh: e.target.value }))} />
                    </td>
                    <td className="py-2 px-3 flex gap-2">
                      <button
                        onClick={() => upsertMutation.mutate({
                          exchangeSlug: s.exchangeSlug,
                          featureSlug: s.featureSlug,
                          levelZh: String(editForm.levelZh ?? s.levelZh),
                          levelEn: String(editForm.levelEn ?? s.levelEn),
                          detailZh: String(editForm.detailZh ?? s.detailZh),
                          detailEn: String(editForm.detailEn ?? s.detailEn),
                          supported: Number(editForm.supported ?? s.supported),
                          highlight: Number(editForm.highlight ?? s.highlight),
                        })}
                        className="admin-btn-primary text-xs"
                      >
                        {zh ? "保存" : "Save"}
                      </button>
                      <button onClick={() => setEditing(null)} className="admin-btn-ghost text-xs">{zh ? "取消" : "Cancel"}</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2 px-3 text-white font-medium">{s.exchangeSlug}</td>
                    <td className="py-2 px-3 text-slate-300">{s.featureSlug}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${s.supported ? "bg-emerald-900/60 text-emerald-300" : "bg-red-900/60 text-red-300"}`}>
                        {zh ? s.levelZh : s.levelEn}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-400 max-w-xs truncate">{zh ? s.detailZh : s.detailEn}</td>
                    <td className="py-2 px-3 flex gap-2">
                      <button onClick={() => { setEditing(s.id); setEditForm({}); }} className="admin-btn-ghost text-xs">{zh ? "编辑" : "Edit"}</button>
                      <button
                        onClick={() => { if (confirm(zh ? "确认删除此记录？" : "Delete this record?")) deleteMutation.mutate({ exchangeSlug: s.exchangeSlug, featureSlug: s.featureSlug }); }}
                        className="admin-btn-danger text-xs"
                      >
                        {zh ? "删除" : "Del"}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSupport.length === 0 && (
          <div className="text-center text-slate-500 py-8">{zh ? "暂无数据" : "No data"}</div>
        )}
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
  tags: "", difficulty: "beginner" as const, sortOrder: 0, isActive: true,
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
      difficulty: t.difficulty, sortOrder: t.sortOrder, isActive: !!t.isActive,
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
function SettingsTab({ zh }: { zh: boolean }) {
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
    { id: "categories", label: zh ? "📂 功能分类" : "📂 Categories" },
    { id: "featureSupport", label: zh ? "⚙️ 功能支持" : "⚙️ Feature Support" },
    { id: "contacts", label: zh ? "📬 联系记录" : "📬 Contacts" },
    { id: "tools", label: zh ? "🛠️ 工具合集" : "🛠️ Tools" },
    { id: "news", label: zh ? "📰 快讯管理" : "📰 News" },
    { id: "articles", label: zh ? "✍️ 文章管理" : "✍️ Articles" },
    { id: "sensitiveWords", label: zh ? "🔍 敏感词库" : "🔍 Sensitive Words" },
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
            {tab === "exchanges" && <ExchangesTab zh={zh} />}
            {tab === "categories" && <CategoriesTab zh={zh} />}
            {tab === "featureSupport" && <FeatureSupportTab zh={zh} />}
            {tab === "contacts" && <ContactsTab zh={zh} />}
            {tab === "tools" && <ToolsTab zh={zh} />}
            {tab === "news" && <NewsTab zh={zh} />}
            {tab === "settings" && <SettingsTab zh={zh} />}
            {tab === "articles" && <ArticlesTab zh={zh} />}
            {tab === "sensitiveWords" && <SensitiveWordsTab zh={zh} />}
            {tab === "platforms" && <PlatformsTab zh={zh} />}
            {tab === "publishLogs" && <PublishLogsTab zh={zh} />}
          </div>
        </div>
      </div>
    </>
  );
}
