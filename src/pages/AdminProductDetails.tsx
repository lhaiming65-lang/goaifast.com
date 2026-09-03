import { useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, Save, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { products } from "@/data/products";
import { ICON_NAMES, GRADIENTS } from "@/lib/productIcons";
import type { ProductContent, HighlightItem, FeatureItem, ScoreItem, ReviewItem, SubscriptionType, UsageItem } from "@/hooks/useProductContent";

const emptyContent = (slug: string, title: string, price = 0, original = 0): ProductContent => ({
  slug,
  title,
  monthly_price: price,
  original_price: original,
  month_options: [1, 3, 6, 12],
  subscription_types: [],
  description: "",
  intro_badge: "",
  intro_body: "",
  how_it_works_title: "",
  usage_title: "",
  usage_guide: [],
  big_headline: "",
  big_sub: "",
  features: [],
  how_it_works: [],
  highlights: [],
  feature_grid: [],
  overall_score: 4.6,
  scores: [],
  pros: [],
  cons: [],
  reviews: [],
});

const input =
  "w-full px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:ring-2 focus:ring-primary/50";
const label = "text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block";
const card = "bg-card rounded-2xl border border-border p-5 space-y-4";

interface SubTemplate {
  id: string;
  name: string;
  types: SubscriptionType[];
}

export default function AdminProductDetails() {
  const [rows, setRows] = useState<Record<string, ProductContent>>({});
  const [slug, setSlug] = useState(products[0]?.titleKey ?? "");
  const [draft, setDraft] = useState<ProductContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<SubTemplate[]>([]);
  const [applyId, setApplyId] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [{ data, error }, { data: tData }] = await Promise.all([
        supabase.from("product_details").select("*"),
        supabase.from("subscription_type_templates").select("*").order("created_at"),
      ]);
      if (!active) return;
      if (error) toast.error(error.message);
      const map: Record<string, ProductContent> = {};
      (data ?? []).forEach((r) => {
        map[(r as { slug: string }).slug] = r as unknown as ProductContent;
      });
      setRows(map);
      setTemplates((tData ?? []) as unknown as SubTemplate[]);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("admin_product_details")
      .on("postgres_changes", { event: "*", schema: "public", table: "product_details" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "subscription_type_templates" }, () => load())
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const applyTemplate = () => {
    const t = templates.find((x) => x.id === applyId);
    if (!t || !draft) return;
    set("subscription_types", t.types.map((x) => ({ ...x })));
    toast.success(`已套用模板「${t.name}」，记得点击保存`);
  };

  const saveAsTemplate = async () => {
    if (!draft || draft.subscription_types.length === 0) {
      toast.error("请先添加订阅类型再保存为模板");
      return;
    }
    const name = window.prompt("模板名称", `${draft.title} 订阅类型`);
    if (!name) return;
    const { error } = await supabase.from("subscription_type_templates").insert({ name, types: draft.subscription_types } as never);
    if (error) toast.error(error.message);
    else toast.success("模板已保存，可套用到其他产品");
  };

  const baseProduct = useMemo(() => products.find((p) => p.titleKey === slug), [slug]);

  useEffect(() => {
    if (loading) return;
    setDraft(
      rows[slug]
        ? { ...emptyContent(slug, slug), ...rows[slug] }
        : emptyContent(slug, slug, baseProduct?.price ?? 0, baseProduct?.originalPrice ?? 0),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, loading]);

  const set = <K extends keyof ProductContent>(key: K, value: ProductContent[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    const { id, ...payload } = draft;
    const { error } = await supabase.from("product_details").upsert(
      { ...payload, slug } as never,
      { onConflict: "slug" },
    );
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("已保存，前台已实时更新");
  };

  const remove = async () => {
    if (!rows[slug]) return;
    const { error } = await supabase.from("product_details").delete().eq("slug", slug);
    if (error) toast.error(error.message);
    else toast.success("已删除，前台恢复默认内容");
  };

  if (loading || !draft) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">G</div>
            <span className="font-bold text-foreground">GoAifast 后台</span>
          </Link>
          <span className="text-sm font-semibold text-primary">商品详情页管理</span>
          <Link to="/admin/skus" className="text-sm text-muted-foreground hover:text-primary">商品管理（SKU）→</Link>
          <div className="flex-1" />
          <a
            href={`/product/${encodeURIComponent(slug)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
          >
            <ExternalLink className="w-4 h-4" /> 预览
          </a>
          {rows[slug] && (
            <button onClick={remove} className="inline-flex items-center gap-1.5 text-sm text-destructive">
              <Trash2 className="w-4 h-4" /> 删除
            </button>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2 rounded-full disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 保存
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Product list */}
        <aside className="lg:col-span-1">
          <div className="bg-card rounded-2xl border border-border p-3 max-h-[75vh] overflow-auto sticky top-24">
            {products.map((p) => (
              <button
                key={p.titleKey}
                onClick={() => setSlug(p.titleKey)}
                className={`w-full text-start px-3 py-2 rounded-lg text-sm mb-1 flex items-center justify-between ${
                  slug === p.titleKey ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted text-foreground"
                }`}
              >
                {p.titleKey}
                {rows[p.titleKey] && <span className="w-2 h-2 rounded-full bg-green-500" />}
              </button>
            ))}
          </div>
        </aside>

        {/* Editor */}
        <main className="lg:col-span-3 space-y-6">
          <section className={card}>
            <h2 className="font-bold text-foreground">基础信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className={label}>标题</span>
                <input className={input} value={draft.title} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div>
                <span className={label}>月价 (USD)</span>
                <input type="number" step="0.01" className={input} value={draft.monthly_price} onChange={(e) => set("monthly_price", Number(e.target.value))} />
              </div>
              <div>
                <span className={label}>原价 (USD)</span>
                <input type="number" step="0.01" className={input} value={draft.original_price} onChange={(e) => set("original_price", Number(e.target.value))} />
              </div>
            </div>
            <div>
              <span className={label}>可选月份（逗号分隔）</span>
              <input
                className={input}
                value={draft.month_options.join(",")}
                onChange={(e) =>
                  set("month_options", e.target.value.split(",").map((v) => Number(v.trim())).filter((n) => !Number.isNaN(n) && n > 0))
                }
              />
            </div>
            <div>
              <span className={label}>产品描述</span>
              <textarea rows={4} className={input} value={draft.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className={label}>大标题</span>
                <textarea rows={2} className={input} value={draft.big_headline} onChange={(e) => set("big_headline", e.target.value)} />
              </div>
              <div>
                <span className={label}>大标题副文案</span>
                <textarea rows={2} className={input} value={draft.big_sub} onChange={(e) => set("big_sub", e.target.value)} />
              </div>
            </div>
          </section>

          <section className={card}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-bold text-foreground">订阅类型</h2>
              <div className="flex items-center gap-2">
                <select className={`${input} !w-auto`} value={applyId} onChange={(e) => setApplyId(e.target.value)}>
                  <option value="">选择模板…</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}（{t.types.length} 项）</option>
                  ))}
                </select>
                <button onClick={applyTemplate} disabled={!applyId} className="text-sm font-semibold text-primary disabled:opacity-50">
                  套用模板
                </button>
                <AddBtn onClick={() => set("subscription_types", [...draft.subscription_types, { label: "", note: "", price_delta: 0 }])} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">按产品配置可选的订阅方式，前台详情页「Select Type」展示；不填则前台不显示该模块。可从模板一键套用，也可将当前配置保存为模板。</p>
            {draft.subscription_types.length > 0 && (
              <button onClick={saveAsTemplate} className="text-sm font-semibold text-primary">
                将当前配置保存为模板
              </button>
            )}
            {draft.subscription_types.map((s2, i) => (
              <Row key={i} onRemove={() => set("subscription_types", draft.subscription_types.filter((_, j) => j !== i))}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input className={input} placeholder="类型名称（如 独享账号）" value={s2.label} onChange={(e) => updateAt<SubscriptionType>(draft.subscription_types, i, { label: e.target.value }, (v) => set("subscription_types", v))} />
                  <input className={input} placeholder="备注（如 含质保）" value={s2.note ?? ""} onChange={(e) => updateAt<SubscriptionType>(draft.subscription_types, i, { note: e.target.value }, (v) => set("subscription_types", v))} />
                  <input type="number" step="0.01" className={input} placeholder="加价 (USD)" value={s2.price_delta ?? 0} onChange={(e) => updateAt<SubscriptionType>(draft.subscription_types, i, { price_delta: Number(e.target.value) }, (v) => set("subscription_types", v))} />
                </div>
              </Row>
            ))}
          </section>

          <StringList title="特性标签" items={draft.features} onChange={(v) => set("features", v)} placeholder="例如：专业版" />

          <section className={card}>
            <h2 className="font-bold text-foreground">产品介绍</h2>
            <p className="text-xs text-muted-foreground">对应前台详情页顶部的介绍区与大标题上方的标签，留空则使用默认文案。</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className={label}>介绍标签（大标题上方，如 Disney+）</span>
                <input className={input} value={draft.intro_badge} onChange={(e) => set("intro_badge", e.target.value)} placeholder="留空则显示产品名" />
              </div>
              <div>
                <span className={label}>「工作原理」模块标题</span>
                <input className={input} value={draft.how_it_works_title} onChange={(e) => set("how_it_works_title", e.target.value)} placeholder="留空则显示 How it works" />
              </div>
            </div>
            <div>
              <span className={label}>产品介绍正文（补充说明，显示在介绍区下方）</span>
              <textarea rows={4} className={input} value={draft.intro_body} onChange={(e) => set("intro_body", e.target.value)} placeholder="可多段，回车换行" />
            </div>
          </section>

          <StringList title="工作原理（每条一句）" items={draft.how_it_works} onChange={(v) => set("how_it_works", v)} placeholder="一条说明" />

          <section className={card}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground">使用详情说明</h2>
              <AddBtn onClick={() => set("usage_guide", [...draft.usage_guide, { title: "", body: "" }])} />
            </div>
            <p className="text-xs text-muted-foreground">按步骤/条目说明如何使用，前台详情页在「工作原理」下方以卡片列表展示；不填则不显示该模块。</p>
            <div>
              <span className={label}>模块标题</span>
              <input className={input} value={draft.usage_title} onChange={(e) => set("usage_title", e.target.value)} placeholder="留空则显示 使用详情说明" />
            </div>
            {draft.usage_guide.map((u, i) => (
              <Row key={i} onRemove={() => set("usage_guide", draft.usage_guide.filter((_, j) => j !== i))}>
                <input className={input} placeholder="步骤标题" value={u.title} onChange={(e) => updateAt<UsageItem>(draft.usage_guide, i, { title: e.target.value }, (v) => set("usage_guide", v))} />
                <textarea rows={2} className={input} placeholder="步骤说明" value={u.body} onChange={(e) => updateAt<UsageItem>(draft.usage_guide, i, { body: e.target.value }, (v) => set("usage_guide", v))} />
              </Row>
            ))}
          </section>

          <section className={card}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground">图文亮点</h2>
              <AddBtn onClick={() => set("highlights", [...draft.highlights, { icon: "Lock", bg: GRADIENTS[draft.highlights.length % GRADIENTS.length], kicker: "", title: "", body: "" }])} />
            </div>
            {draft.highlights.map((h, i) => (
              <Row key={i} onRemove={() => set("highlights", draft.highlights.filter((_, j) => j !== i))}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select className={input} value={h.icon ?? "Lock"} onChange={(e) => updateAt<HighlightItem>(draft.highlights, i, { icon: e.target.value }, (v) => set("highlights", v))}>
                    {ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <select className={input} value={h.bg ?? GRADIENTS[0]} onChange={(e) => updateAt<HighlightItem>(draft.highlights, i, { bg: e.target.value }, (v) => set("highlights", v))}>
                    {GRADIENTS.map((g, k) => <option key={g} value={g}>渐变 {k + 1}</option>)}
                  </select>
                </div>
                <input className={input} placeholder="小标题（蓝色）" value={h.kicker} onChange={(e) => updateAt<HighlightItem>(draft.highlights, i, { kicker: e.target.value }, (v) => set("highlights", v))} />
                <input className={input} placeholder="主标题" value={h.title} onChange={(e) => updateAt<HighlightItem>(draft.highlights, i, { title: e.target.value }, (v) => set("highlights", v))} />
                <textarea rows={2} className={input} placeholder="正文" value={h.body} onChange={(e) => updateAt<HighlightItem>(draft.highlights, i, { body: e.target.value }, (v) => set("highlights", v))} />
              </Row>
            ))}
          </section>

          <section className={card}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground">四宫格特性</h2>
              <AddBtn onClick={() => set("feature_grid", [...draft.feature_grid, { icon: "Globe", title: "", body: "" }])} />
            </div>
            {draft.feature_grid.map((f, i) => (
              <Row key={i} onRemove={() => set("feature_grid", draft.feature_grid.filter((_, j) => j !== i))}>
                <select className={input} value={f.icon ?? "Globe"} onChange={(e) => updateAt<FeatureItem>(draft.feature_grid, i, { icon: e.target.value }, (v) => set("feature_grid", v))}>
                  {ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <input className={input} placeholder="标题" value={f.title} onChange={(e) => updateAt<FeatureItem>(draft.feature_grid, i, { title: e.target.value }, (v) => set("feature_grid", v))} />
                <textarea rows={2} className={input} placeholder="说明" value={f.body} onChange={(e) => updateAt<FeatureItem>(draft.feature_grid, i, { body: e.target.value }, (v) => set("feature_grid", v))} />
              </Row>
            ))}
          </section>

          <section className={card}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground">产品评估</h2>
              <AddBtn onClick={() => set("scores", [...draft.scores, { label: "", score: 4.5, desc: "" }])} />
            </div>
            <div className="max-w-xs">
              <span className={label}>总评分</span>
              <input type="number" step="0.1" min="0" max="5" className={input} value={draft.overall_score} onChange={(e) => set("overall_score", Number(e.target.value))} />
            </div>
            {draft.scores.map((s, i) => (
              <Row key={i} onRemove={() => set("scores", draft.scores.filter((_, j) => j !== i))}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input className={`${input} md:col-span-2`} placeholder="维度名称" value={s.label} onChange={(e) => updateAt<ScoreItem>(draft.scores, i, { label: e.target.value }, (v) => set("scores", v))} />
                  <input type="number" step="0.1" min="0" max="5" className={input} value={s.score} onChange={(e) => updateAt<ScoreItem>(draft.scores, i, { score: Number(e.target.value) }, (v) => set("scores", v))} />
                </div>
                <input className={input} placeholder="说明" value={s.desc} onChange={(e) => updateAt<ScoreItem>(draft.scores, i, { desc: e.target.value }, (v) => set("scores", v))} />
              </Row>
            ))}
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StringList title="优点" items={draft.pros} onChange={(v) => set("pros", v)} placeholder="一条优点" />
            <StringList title="缺点" items={draft.cons} onChange={(v) => set("cons", v)} placeholder="一条缺点" />
          </div>

          <section className={card}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground">用户评价</h2>
              <AddBtn onClick={() => set("reviews", [...draft.reviews, { name: "", country: "", text: "" }])} />
            </div>
            {draft.reviews.map((r, i) => (
              <Row key={i} onRemove={() => set("reviews", draft.reviews.filter((_, j) => j !== i))}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className={input} placeholder="用户名" value={r.name} onChange={(e) => updateAt<ReviewItem>(draft.reviews, i, { name: e.target.value }, (v) => set("reviews", v))} />
                  <input className={input} placeholder="国家/地区" value={r.country} onChange={(e) => updateAt<ReviewItem>(draft.reviews, i, { country: e.target.value }, (v) => set("reviews", v))} />
                </div>
                <textarea rows={2} className={input} placeholder="评价内容" value={r.text} onChange={(e) => updateAt<ReviewItem>(draft.reviews, i, { text: e.target.value }, (v) => set("reviews", v))} />
              </Row>
            ))}
          </section>

          <TemplatesManager templates={templates} />
        </main>
      </div>
    </div>
  );
}

function updateAt<T>(list: T[], index: number, patch: Partial<T>, onChange: (v: T[]) => void) {
  onChange(list.map((item, i) => (i === index ? { ...item, ...patch } : item)));
}

function AddBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
      <Plus className="w-4 h-4" /> 添加
    </button>
  );
}

function Row({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="rounded-xl border border-border p-4 space-y-3 relative">
      <button onClick={onRemove} className="absolute top-3 end-3 text-muted-foreground hover:text-destructive">
        <Trash2 className="w-4 h-4" />
      </button>
      {children}
    </div>
  );
}

function StringList({
  title,
  items,
  onChange,
  placeholder,
}: {
  title: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  return (
    <section className={card}>
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-foreground">{title}</h2>
        <AddBtn onClick={() => onChange([...items, ""])} />
      </div>
      {items.map((v, i) => (
        <div key={i} className="flex gap-2">
          <input
            className={input}
            placeholder={placeholder}
            value={v}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
          />
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive px-2">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      {items.length === 0 && <p className="text-xs text-muted-foreground">未设置时前台使用默认内容。</p>}
    </section>
  );
}

function TemplatesManager({ templates }: { templates: SubTemplate[] }) {
  const [editing, setEditing] = useState<SubTemplate | null>(null);
  const [savingTpl, setSavingTpl] = useState(false);

  const startCreate = () => setEditing({ id: "", name: "", types: [{ label: "", note: "", price_delta: 0 }] });

  const saveTemplate = async () => {
    if (!editing || !editing.name.trim()) {
      toast.error("请填写模板名称");
      return;
    }
    setSavingTpl(true);
    const payload = { name: editing.name.trim(), types: editing.types.filter((t) => t.label.trim()) };
    const { error } = editing.id
      ? await supabase.from("subscription_type_templates").update(payload as never).eq("id", editing.id)
      : await supabase.from("subscription_type_templates").insert(payload as never);
    setSavingTpl(false);
    if (error) toast.error(error.message);
    else {
      toast.success("模板已保存");
      setEditing(null);
    }
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase.from("subscription_type_templates").delete().eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("模板已删除");
  };

  return (
    <section className={card}>
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-foreground">订阅类型模板</h2>
        <AddBtn onClick={startCreate} />
      </div>
      <p className="text-xs text-muted-foreground">模板可复用：在上方「订阅类型」处选择模板一键套用到当前产品。</p>

      {templates.length === 0 && !editing && (
        <p className="text-sm text-muted-foreground">暂无模板，点击「添加」创建第一个模板。</p>
      )}

      {templates.map((t) => (
        <div key={t.id} className="rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{t.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {t.types.map((x) => x.label).filter(Boolean).join(" / ") || "（空）"}
            </p>
          </div>
          <button onClick={() => setEditing({ ...t, types: t.types.map((x) => ({ ...x })) })} className="text-muted-foreground hover:text-primary">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => deleteTemplate(t.id)} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      {editing && (
        <div className="rounded-xl border-2 border-primary/40 p-4 space-y-3">
          <div>
            <span className={label}>模板名称</span>
            <input className={input} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="如：流媒体标准类型" />
          </div>
          {editing.types.map((t, i) => (
            <Row key={i} onRemove={() => setEditing({ ...editing, types: editing.types.filter((_, j) => j !== i) })}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input className={input} placeholder="类型名称（如 独享账号）" value={t.label} onChange={(e) => updateAt<SubscriptionType>(editing.types, i, { label: e.target.value }, (v) => setEditing({ ...editing, types: v }))} />
                <input className={input} placeholder="备注（如 含质保）" value={t.note ?? ""} onChange={(e) => updateAt<SubscriptionType>(editing.types, i, { note: e.target.value }, (v) => setEditing({ ...editing, types: v }))} />
                <input type="number" step="0.01" className={input} placeholder="加价 (USD)" value={t.price_delta ?? 0} onChange={(e) => updateAt<SubscriptionType>(editing.types, i, { price_delta: Number(e.target.value) }, (v) => setEditing({ ...editing, types: v }))} />
              </div>
            </Row>
          ))}
          <div className="flex items-center gap-4">
            <AddBtn onClick={() => setEditing({ ...editing, types: [...editing.types, { label: "", note: "", price_delta: 0 }] })} />
            <div className="flex-1" />
            <button onClick={() => setEditing(null)} className="text-sm text-muted-foreground">取消</button>
            <button onClick={saveTemplate} disabled={savingTpl} className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-1.5 rounded-full text-sm disabled:opacity-60">
              {savingTpl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 保存模板
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
