import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, Loader2, X, ImageIcon, ExternalLink, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { categories } from "@/data/products";
import { GRADIENTS } from "@/lib/productIcons";
import { useStoreProducts, type StoreProductRow } from "@/hooks/useProductContent";

const BADGES = [
  { value: "", label: "无标签" },
  { value: "hot", label: "热销" },
  { value: "new", label: "新品" },
  { value: "recommend", label: "推荐" },
];

const STATUSES = [
  { value: "active", label: "上架，前台展示" },
  { value: "off", label: "下架，前台隐藏" },
];

const DELIVERY_METHODS = [
  { value: "auto", label: "自动交付" },
  { value: "manual", label: "人工交付" },
  { value: "auto_manual", label: "自动+人工" },
];

const emptyDraft = (): Omit<StoreProductRow, "id"> => ({
  slug: "",
  title: "",
  category: "svod",
  price: 0,
  original_price: 0,
  cost: 0,
  stock: 0,
  badge: "",
  status: "active",
  delivery_method: "auto_manual",
  subtitle: "",
  delivery_rules: "",
  detail_description: "",
  color: GRADIENTS[0],
  image_url: "",
});

const input =
  "w-full px-4 py-2.5 rounded-full bg-background border border-border text-sm outline-none focus:ring-2 focus:ring-primary/50";
const area =
  "w-full px-4 py-3 rounded-2xl bg-background border border-border text-sm outline-none focus:ring-2 focus:ring-primary/50";
const label = "text-sm font-semibold text-foreground mb-2 block";

export default function AdminProducts() {
  const rows = useStoreProducts();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(StoreProductRow | Omit<StoreProductRow, "id">) | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const isNew = editing !== null && !("id" in editing);

  const set = <K extends keyof Omit<StoreProductRow, "id">>(key: K, value: Omit<StoreProductRow, "id">[K]) =>
    setEditing((d) => (d ? { ...d, [key]: value } : d));

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim() || !editing.slug.trim()) {
      toast.error("请填写商品名称（名称将同时作为唯一标识 slug）");
      return;
    }
    setSaving(true);
    const { id, ...payload } = editing as StoreProductRow;
    const { error } = id
      ? await supabase.from("store_products").update(payload as never).eq("id", id)
      : await supabase.from("store_products").insert(payload as never);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("已保存，前台已实时同步");
      setEditing(null);
    }
  };

  const remove = async (row: StoreProductRow) => {
    if (!window.confirm(`确定删除商品「${row.title}」吗？`)) return;
    const { error } = await supabase.from("store_products").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else toast.success("已删除");
  };

  const sorted = useMemo(() => rows, [rows]);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">G</div>
            <span className="font-bold text-foreground">GoAifast 后台</span>
          </Link>
          <span className="text-sm font-semibold text-primary">商品管理（SKU）</span>
          <Link to="/admin/products" className="text-sm text-muted-foreground hover:text-primary">详情页内容管理 →</Link>
          <div className="flex-1" />
          <button
            onClick={() => setEditing(emptyDraft())}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2 rounded-full"
          >
            <Plus className="w-4 h-4" /> 新增商品
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : sorted.length === 0 ? (
          <div className="bg-card rounded-2xl border border-dashed border-border p-16 text-center space-y-4">
            <Package className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">还没有后台 SKU。点击右上角「新增商品」创建，保存后前台立即展示。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sorted.map((row) => (
              <div key={row.id} className="bg-card rounded-2xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {row.image_url ? (
                    <img src={row.image_url} alt={row.title} className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold ${row.color || GRADIENTS[0]}`}>
                      {row.title.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-foreground truncate">{row.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{row.slug} · {row.category}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${row.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                    {row.status === "active" ? "上架中" : "已下架"}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4">
                  <span>售价 <b className="text-foreground">${row.price}</b></span>
                  <span>成本 ${row.cost}</span>
                  <span>库存 {row.stock}</span>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <button onClick={() => setEditing(row)} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    <Pencil className="w-4 h-4" /> 编辑
                  </button>
                  <a href={`/product/${encodeURIComponent(row.slug)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
                    <ExternalLink className="w-4 h-4" /> 预览
                  </a>
                  <div className="flex-1" />
                  <button onClick={() => remove(row)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit dialog — 参照截图的「编辑商品明细」布局 */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start md:items-center justify-center p-4 overflow-y-auto" onClick={() => setEditing(null)}>
          <div className="bg-background rounded-3xl w-full max-w-5xl shadow-2xl my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Pencil className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{isNew ? "新增商品明细" : "编辑商品明细"}</h2>
                <p className="text-sm text-muted-foreground">保存后会立即同步到前台商品列表和详情页。</p>
              </div>
              <button onClick={() => setEditing(null)} className="ms-auto text-muted-foreground hover:text-foreground">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left column: image + color */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-border p-4 space-y-4">
                  <span className="font-bold text-foreground">商品图片</span>
                  {editing.image_url ? (
                    <div className="relative">
                      <img src={editing.image_url} alt="preview" className="w-full aspect-square object-cover rounded-xl border border-border" />
                      <button
                        onClick={() => set("image_url", "")}
                        className="absolute top-2 end-2 bg-background/90 border border-border rounded-full p-1.5 hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="aspect-square rounded-xl border-2 border-dashed border-border bg-muted/40 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <ImageIcon className="w-10 h-10" />
                      <span className="text-sm">粘贴图片 URL</span>
                    </div>
                  )}
                  <input
                    className={input}
                    placeholder="粘贴图片 URL（https://…）"
                    value={editing.image_url}
                    onChange={(e) => set("image_url", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">留空则前台使用下方卡片颜色 + 首字母展示。</p>
                </div>

                <div className="rounded-2xl border border-border p-4 space-y-3">
                  <span className="font-bold text-foreground">卡片颜色</span>
                  <div className="grid grid-cols-3 gap-3">
                    {GRADIENTS.map((g) => (
                      <button
                        key={g}
                        onClick={() => set("color", g)}
                        className={`h-12 rounded-xl ${g} transition-all ${editing.color === g ? "ring-2 ring-offset-2 ring-foreground scale-95" : "hover:scale-95"}`}
                        aria-label={`选择颜色 ${g}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right columns: fields */}
              <div className="md:col-span-2 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <span className={label}>商品名称</span>
                    <input className={input} value={editing.title} onChange={(e) => {
                      const v = e.target.value;
                      setEditing((d) => (d ? { ...d, title: v, ...(isNew ? { slug: v } : {}) } : d));
                    }} placeholder="Netflix" />
                  </div>
                  <div>
                    <span className={label}>商品分类</span>
                    <select className={input} value={editing.category} onChange={(e) => set("category", e.target.value)}>
                      {categories.filter((c) => c.id !== "all").map((c) => (
                        <option key={c.id} value={c.id}>{c.labelZh} / {c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className={label}>售价 USD</span>
                    <input type="number" step="0.01" className={input} value={editing.price} onChange={(e) => set("price", Number(e.target.value))} />
                  </div>
                  <div>
                    <span className={label}>原价 USD</span>
                    <input type="number" step="0.01" className={input} value={editing.original_price} onChange={(e) => set("original_price", Number(e.target.value))} />
                  </div>
                  <div>
                    <span className={label}>成本 USD</span>
                    <input type="number" step="0.01" className={input} value={editing.cost} onChange={(e) => set("cost", Number(e.target.value))} />
                  </div>
                  <div>
                    <span className={label}>库存数量</span>
                    <input type="number" className={input} value={editing.stock} onChange={(e) => set("stock", Number(e.target.value))} />
                  </div>
                  <div>
                    <span className={label}>标签</span>
                    <select className={input} value={editing.badge} onChange={(e) => set("badge", e.target.value)}>
                      {BADGES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <span className={label}>上架状态</span>
                    <select className={input} value={editing.status} onChange={(e) => set("status", e.target.value)}>
                      {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <span className={label}>交付方式</span>
                    <select className={input} value={editing.delivery_method} onChange={(e) => set("delivery_method", e.target.value)}>
                      {DELIVERY_METHODS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <span className={label}>前台副标题</span>
                    <input className={input} value={editing.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="例如 独享账号 · 极速交付" />
                  </div>
                </div>

                <div>
                  <span className={label}>交付/售后规则</span>
                  <textarea rows={3} className={area} value={editing.delivery_rules} onChange={(e) => set("delivery_rules", e.target.value)} placeholder="流媒体 · 共享账号自动交付" />
                </div>
                <div>
                  <span className={label}>商品详情说明</span>
                  <textarea rows={5} className={area} value={editing.detail_description} onChange={(e) => set("detail_description", e.target.value)} placeholder="填写前台详情页介绍、使用说明、注意事项。" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-border">
              <button onClick={() => setEditing(null)} className="px-6 py-2.5 rounded-full border border-border font-semibold text-foreground hover:bg-muted">
                取消
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 保存商品
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
