import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, ArrowUpRight, Boxes, CheckCircle2, CircleDollarSign, ClipboardList, Headphones, PackagePlus, RefreshCw, Search, Settings2, ShieldCheck, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { commerce, commerceError, money, statusLabel, stripeRefund, reconcilePayments } from "@/lib/commerce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";

type Product = { id: string; title: string; slug: string; price: number; price_cents?: number; status: string; delivery_method: string; warranty_days: number; auto_replace: boolean; max_replacements: number; available_stock?: number };
type Order = { id: string; order_number: string; user_id: string; status: string; total_cents: number; created_at: string; delivery_email?: string };
type Payment = { id: string; order_id: string | null; user_id: string; amount_cents: number; currency: string; provider: string; status: string; created_at: string };
type Refund = { id: string; order_id: string | null; payment_id: string; amount_cents: number; status: string; reason: string; created_at: string };
type Ticket = { id: string; order_id: string | null; subject: string; kind: string; status: string; created_at: string; user_id: string; item_id?: string; replacement_applied?: boolean };
type Stock = { id: string; product_id: string; status: string; expires_at?: string; created_at: string; item_id?: string };
type Snapshot = { products: Product[]; inventory: Stock[]; orders: Order[]; payments: Payment[]; tickets: Ticket[]; refunds: Refund[] };
type OrderDetails = { order: Order; items: { id: string; title?: string; product_title?: string; quantity: number; unit_price_cents: number }[]; events: { id: string; kind?: string; event_type?: string; message?: string; created_at: string }[]; tickets: Ticket[] };
type TicketDetails = { ticket: Ticket; messages: { id: string; body: string; is_admin?: boolean; created_at: string }[] };
export type CommerceTab = "overview" | "orders" | "inventory" | "products" | "support" | "payments";
const tabs = [{ id: "overview", label: "运营概览", icon: Activity }, { id: "orders", label: "订单与交付", icon: ClipboardList }, { id: "inventory", label: "卡密库存", icon: Boxes }, { id: "products", label: "商品与售后规则", icon: Settings2 }, { id: "support", label: "售后与投诉", icon: Headphones }, { id: "payments", label: "支付与退款", icon: CircleDollarSign }] as const;
const time = (value: string) => new Date(value).toLocaleString("zh-CN");
const inputClass = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm";
const emptyDraft = () => ({ product_id: "", title: "", slug: "", price: "", status: "active", delivery_method: "automatic", warranty_days: 7, auto_replace: false, max_replacements: 1 });

function Badge({ value, label }: { value: string; label?: string }) {
  const color = ["succeeded", "completed", "delivered", "active", "available", "resolved"].includes(value) ? "bg-emerald-50 text-emerald-700" : ["failed", "defective", "refund_due", "disabled"].includes(value) ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700";
  return <span className={`inline-block whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium ${color}`}>{label || statusLabel(value)}</span>;
}
function Panel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <section className="rounded-xl border border-border bg-card shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5"><h2 className="font-semibold">{title}</h2>{action}</div><div className="p-5">{children}</div></section>;
}
function Empty({ children }: { children: ReactNode }) { return <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>; }

export default function AdminCommerce({ embedded = false, initialTab = "overview", lowStockAlert = 5, onNavigate }: { embedded?: boolean; initialTab?: CommerceTab; lowStockAlert?: number; onNavigate?: (tab: CommerceTab) => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const currentUserId = useRef(userId);
  currentUserId.current = userId;
  const loadSequence = useRef(0);
  const mutationSequence = useRef(0);
  const submitting = useRef(false);
  const [loadedUserId, setLoadedUserId] = useState<string>();
  const [tab, setTab] = useState<CommerceTab>(initialTab);
  const navigateTab = (next: CommerceTab) => { if (onNavigate) onNavigate(next); else setTab(next); };
  const [storedSnapshot, setSnapshot] = useState<Snapshot | null>(null);
  const snapshot = loadedUserId === userId ? storedSnapshot : null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState(emptyDraft);
  const [importProduct, setImportProduct] = useState("");
  const [secrets, setSecrets] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetails | null>(null);
  const [reply, setReply] = useState("");
  const [ticketStatus, setTicketStatus] = useState("open");
  const [refundTarget, setRefundTarget] = useState<{ order_id?: string; payment_id?: string } | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const load = useCallback(async () => {
    if (!userId) return;
    const sequence = ++loadSequence.current;
    setLoading(true); setError("");
    try {
      const data = await commerce<Snapshot>("admin_snapshot");
      if (sequence === loadSequence.current && currentUserId.current === userId) {
        setSnapshot(data); setLoadedUserId(userId);
      }
    } catch (e) {
      if (sequence === loadSequence.current && currentUserId.current === userId) setError(commerceError(e));
    } finally {
      if (sequence === loadSequence.current && currentUserId.current === userId) setLoading(false);
    }
  }, [userId]);
  useEffect(() => {
    setSnapshot(null); setLoadedUserId(undefined); setSelectedOrder(null); setSelectedTicket(null);
    setDraft(emptyDraft()); setSecrets(""); setReply(""); setRefundTarget(null); setRefundReason("");
    setBusy(false); submitting.current = false; mutationSequence.current++;
    void load();
    const requests = loadSequence; const mutations = mutationSequence;
    return () => { requests.current++; mutations.current++; };
  }, [load]);
  const act = async (action: () => Promise<unknown>, success = "操作已完成") => {
    if (submitting.current) return;
    submitting.current = true; setBusy(true);
    const sequence = ++mutationSequence.current;
    try {
      await action();
      if (sequence !== mutationSequence.current || currentUserId.current !== userId) return;
      void queryClient.invalidateQueries({ queryKey: ["commerce-catalog"] });
      toast.success(success); await load();
    } catch (e) {
      if (sequence === mutationSequence.current && currentUserId.current === userId) toast.error(commerceError(e));
    } finally {
      if (sequence === mutationSequence.current) { submitting.current = false; setBusy(false); }
    }
  };
  const filtered = <T,>(rows: T[]) => rows.filter(row => JSON.stringify(row).toLowerCase().includes(query.trim().toLowerCase()));
  const stockByProduct = useMemo(() => {
    const result = new Map<string, number>();
    snapshot?.inventory.filter(i => i.status === "available" && (!i.expires_at || new Date(i.expires_at).getTime() > Date.now() + 3_600_000)).forEach(i => result.set(i.product_id, (result.get(i.product_id) ?? 0) + 1));
    return result;
  }, [snapshot]);
  const productName = (id: string) => snapshot?.products.find(p => p.id === id)?.title ?? id;
  const saveProduct = (event: FormEvent) => {
    event.preventDefault();
    const priceCents = Math.round(Number(draft.price) * 100);
    if (!Number.isSafeInteger(priceCents) || priceCents < 50) return toast.error("商品价格至少为 $0.50");
    void act(async () => {
      await commerce("admin_product", { ...draft, product_id: draft.product_id || undefined, price_cents: priceCents });
      setDraft(emptyDraft());
    });
  };
  const openOrder = (id: string) => act(async () => {
    const data = await commerce<OrderDetails>("order", { order_id: id });
    if (currentUserId.current === userId) setSelectedOrder(data);
  }, "已加载订单");
  const openTicket = (ticket: Ticket) => act(async () => {
    const data = await commerce<TicketDetails>("support_detail", { ticket_id: ticket.id });
    if (currentUserId.current === userId) { setSelectedTicket(data); setReply(""); setTicketStatus(ticket.status); }
  }, "已加载工单");
  const replaceTicket = () => {
    if (!selectedTicket) return;
    const ticketId = selectedTicket.ticket.id;
    void act(async () => {
      await commerce("admin_replace", { ticket_id: ticketId });
      const updated = await commerce<TicketDetails>("support_detail", { ticket_id: ticketId });
      if (currentUserId.current === userId) { setSelectedTicket(updated); setTicketStatus(updated.ticket.status); }
    }, "换货已完成，新凭证已交付至顾客订单");
  };
  const submitRefund = (event: FormEvent) => {
    event.preventDefault();
    void act(async () => {
      const result = await commerce<{ refund: Refund; payment: Payment }>("admin_refund", { ...refundTarget, reason: refundReason });
      if (result.payment.provider === "stripe" && result.refund.status !== "succeeded") await stripeRefund(result.refund.id);
      setRefundTarget(null); setRefundReason("");
    }, "退款请求已处理，请以退款记录状态为准");
  };
  const refundAmount = refundTarget?.payment_id
    ? snapshot?.payments.find(payment => payment.id === refundTarget.payment_id)?.amount_cents
    : snapshot?.orders.find(order => order.id === refundTarget?.order_id)?.total_cents;
  return <div className={embedded ? "text-slate-900" : "min-h-screen bg-[#f5f6f8] text-slate-900 dark:bg-gray-950 dark:text-slate-100"}>
    {!embedded && <header className="sticky top-0 z-30 border-b border-border bg-card"><div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-5 py-4">
      <Link to="/admin" className="flex items-center gap-3 font-bold"><span className="grid h-9 w-9 place-items-center rounded-lg bg-orange-500 text-lg text-white">G</span> GoAifast <span className="text-sm font-normal text-muted-foreground">商家中心</span></Link>
      <div className="flex items-center gap-4 text-sm"><Link to="/admin/products" className="text-muted-foreground hover:text-orange-600">商品详情</Link><Link to="/admin/content" className="text-muted-foreground hover:text-orange-600">站点内容</Link><Link to="/" className="inline-flex items-center gap-1 font-medium text-orange-600">查看商城 <ArrowUpRight className="h-4 w-4" /></Link></div>
    </div></header>}
    <div className={embedded ? "" : "mx-auto grid max-w-[1600px] gap-6 px-4 py-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-6"}>
      {!embedded && <aside><nav className="flex gap-1 overflow-auto rounded-xl border border-border bg-card p-2 lg:sticky lg:top-24 lg:flex-col">
        {tabs.map(item => <button key={item.id} onClick={() => { navigateTab(item.id); setQuery(""); setSelectedOrder(null); setSelectedTicket(null); }} className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition-colors ${tab === item.id ? "bg-orange-50 text-orange-700" : "text-muted-foreground hover:bg-secondary/40"}`}><item.icon className="h-4 w-4" />{item.label}</button>)}
        <div className="m-2 hidden border-t pt-5 text-xs leading-6 text-muted-foreground lg:block"><ShieldCheck className="mb-2 h-5 w-5 text-emerald-600" />金额由服务端核算<br />支付到账后分配库存<br />每笔退款保留记录</div>
      </nav></aside>}
      <main className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4"><div>{!embedded && <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-orange-600">COMMERCE OPERATIONS</p>}<h2 className="text-xl font-bold">{tabs.find(t => t.id === tab)?.label}</h2></div><Button variant="outline" onClick={load} disabled={loading || busy}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />刷新数据</Button></div>
        {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-5"><p className="font-semibold">交易服务暂不可用</p><p className="mt-2 text-sm">{error}</p><p className="mt-2 text-xs text-amber-800">首次安装请按项目 docs/commerce-setup.md 完成数据库和 Stripe 配置。配置完成后点击刷新数据。</p></div>}
        {loading && !snapshot && !error && <Empty>正在加载商家数据…</Empty>}
        {snapshot && <>
          {tab === "overview" ? <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
              ["待处理订单", snapshot.orders.filter(o => ["paid", "fulfilling", "processing"].includes(o.status)).length, "确认到账后完成交付", ClipboardList],
              ["可用卡密", snapshot.inventory.filter(i => i.status === "available" && (!i.expires_at || new Date(i.expires_at).getTime() > Date.now() + 3_600_000)).length, "有效期不足 1 小时不计入可售库存", Boxes],
              ["进行中的售后", snapshot.tickets.filter(t => !["closed", "resolved", "rejected"].includes(t.status)).length, "关注故障、退款和投诉", Headphones],
              ["待完成退款", snapshot.refunds.filter(r => !["succeeded", "failed"].includes(r.status)).length, "原支付渠道退还", CircleDollarSign],
            ].map(([label, value, caption, Icon]) => { const StatIcon = Icon as typeof Activity; return <div key={String(label)} className="rounded-xl border border-border bg-card p-5"><div className="flex items-center justify-between text-sm text-muted-foreground">{String(label)}<StatIcon className="h-4 w-4 text-orange-500" /></div><p className="my-3 text-3xl font-bold tabular-nums">{String(value)}</p><p className="text-xs text-muted-foreground">{String(caption)}</p></div>; })}</div>
            <Panel title="订单处理流程"><div className="grid gap-4 md:grid-cols-4">{[["01", "下单预留", "按在售 SKU 计价，锁定可用库存"], ["02", "确认收款", "Stripe 回调验签或钱包原子扣款"], ["03", "安全交付", "卡密只向订单本人和管理员展示"], ["04", "售后跟进", "受限自动换货，退款和投诉人工审核"]].map(([n, title, text]) => <div key={n} className="rounded-lg bg-secondary/40 p-4"><span className="text-xs font-bold text-orange-500">{n}</span><h3 className="my-2 font-semibold">{title}</h3><p className="text-xs leading-6 text-muted-foreground">{text}</p></div>)}</div></Panel>
            <Panel title="需要关注的商品" action={<Button variant="ghost" onClick={() => navigateTab("inventory")}>补充库存 <ArrowUpRight className="ml-1 h-4 w-4" /></Button>}>{snapshot.products.filter(p => p.status === "active" && (p.available_stock ?? stockByProduct.get(p.id) ?? 0) < lowStockAlert).length ? <div className="divide-y">{snapshot.products.filter(p => p.status === "active" && (p.available_stock ?? stockByProduct.get(p.id) ?? 0) < lowStockAlert).map(p => <div key={p.id} className="flex items-center justify-between py-3 text-sm"><span>{p.title}</span><span className="text-amber-700">剩余 {p.available_stock ?? stockByProduct.get(p.id) ?? 0} 份</span></div>)}</div> : <Empty>目前没有低库存商品</Empty>}</Panel>
          </> : <div className="relative max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="搜索当前列表" value={query} onChange={e => setQuery(e.target.value)} className="bg-card pl-9" placeholder="搜索名称、订单号或记录编号" /></div>}
          {tab === "orders" && <Panel title="订单记录"><div className="space-y-3">{filtered(snapshot.orders).map(order => <div key={order.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"><div><p className="font-mono text-sm font-semibold">{order.order_number}</p><p className="mt-1 text-xs text-muted-foreground">{time(order.created_at)} · {order.delivery_email || order.user_id}</p></div><div className="flex flex-wrap items-center gap-3"><strong className="text-sm">{money(order.total_cents)}</strong><Badge value={order.status} /><Button size="sm" variant="outline" disabled={busy} onClick={() => openOrder(order.id)}>查看</Button>{["paid", "processing", "fulfilling"].includes(order.status) && <Button size="sm" disabled={busy} onClick={() => act(() => commerce("admin_fulfill", { order_id: order.id }))}>分配库存并发货</Button>}{["paid", "processing", "fulfilling", "delivered", "completed"].includes(order.status) && <Button size="sm" variant="outline" disabled={busy} onClick={() => { setRefundTarget({ order_id: order.id }); setRefundReason(""); }}>退款</Button>}</div></div>)}{!filtered(snapshot.orders).length && <Empty>没有匹配的订单</Empty>}</div></Panel>}
          {selectedOrder && tab === "orders" && <Panel title={`订单详情 · ${selectedOrder.order.order_number}`} action={<Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}>收起</Button>}><div className="space-y-3">{selectedOrder.items.map(item => <div key={item.id} className="flex justify-between text-sm"><span>{item.product_title ?? item.title} × {item.quantity}</span><span>{money(item.unit_price_cents * item.quantity)}</span></div>)}<div className="border-t pt-3">{selectedOrder.events.map(event => <p key={event.id} className="py-1 text-xs text-muted-foreground">{time(event.created_at)} · {event.message ?? statusLabel(event.kind ?? event.event_type ?? "")}</p>)}</div></div></Panel>}
          {tab === "inventory" && <>
            <Panel title="导入数字货物"><form onSubmit={e => { e.preventDefault(); const lines = secrets.split(/\r?\n/).map(v => v.trim()).filter(Boolean); if (!lines.length || lines.length > 500) return toast.error("每次请输入 1–500 份卡密"); if (new Set(lines).size !== lines.length) return toast.error("输入包含重复卡密，请先去重"); void act(async () => { await commerce("admin_inventory", { product_id: importProduct, secrets: lines, expires_at: expiresAt ? new Date(expiresAt).toISOString() : null }); setSecrets(""); }, "库存已导入"); }} className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><label className="space-y-2 text-sm"><span>对应 SKU</span><select aria-label="库存商品" className={inputClass} value={importProduct} onChange={e => setImportProduct(e.target.value)} required><option value="">选择商品</option>{snapshot.products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label><label className="space-y-2 text-sm"><span>有效期（选填）</span><Input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} /></label></div><label className="block space-y-2 text-sm"><span>交付内容 · 每行一份</span><Textarea aria-label="卡密交付内容" value={secrets} onChange={e => setSecrets(e.target.value)} placeholder="兑换码，或完整的账号 / 密码 / 使用说明" rows={5} required maxLength={1000000} className="font-mono" /></label><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">每份货物只分配一次；请勿导入其他平台已使用的卡密。</p><Button type="submit" disabled={busy}><PackagePlus className="mr-2 h-4 w-4" />导入库存</Button></div></form></Panel>
            <Panel title="库存状态"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs text-muted-foreground"><th className="pb-3">货物编号 / 商品</th><th className="pb-3">状态</th><th className="pb-3">有效期</th><th className="pb-3 text-right">操作</th></tr></thead><tbody>{filtered(snapshot.inventory).map(item => <tr key={item.id} className="border-b last:border-0"><td className="py-3"><p>{productName(item.product_id)}</p><p className="mt-1 font-mono text-[11px] text-muted-foreground">{item.id}</p></td><td><Badge value={item.expires_at && new Date(item.expires_at).getTime() <= Date.now() ? "expired" : item.status} /></td><td className="text-xs text-muted-foreground">{item.expires_at ? <>{time(item.expires_at)}{item.status === "available" && new Date(item.expires_at).getTime() > Date.now() && new Date(item.expires_at).getTime() <= Date.now() + 3_600_000 && <span className="mt-1 block text-amber-600">即将到期，暂不新售</span>}</> : "未设置"}</td><td className="text-right">{["available", "disabled"].includes(item.status) && <Button size="sm" variant="outline" disabled={busy} onClick={() => act(() => commerce("admin_inventory", { inventory_id: item.id, status: item.status === "available" ? "disabled" : "available" }))}>{item.status === "available" ? "停用" : "启用"}</Button>}</td></tr>)}</tbody></table></div>{!filtered(snapshot.inventory).length && <Empty>暂无库存，请导入卡密</Empty>}</Panel>
          </>}
          {tab === "products" && <>
            <Panel title={draft.product_id ? "编辑商品与售后策略" : "新增商品"}><form onSubmit={saveProduct} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-2 text-sm"><span>商品名称</span><Input required value={draft.title} maxLength={120} onChange={e => setDraft({ ...draft, title: e.target.value })} /></label><label className="space-y-2 text-sm"><span>页面标识 slug</span><Input required value={draft.slug} maxLength={120} onChange={e => setDraft({ ...draft, slug: e.target.value })} /></label><label className="space-y-2 text-sm"><span>单价（USD）</span><Input required type="number" min="0.50" step="0.01" value={draft.price} onChange={e => setDraft({ ...draft, price: e.target.value })} /></label>
              <label className="space-y-2 text-sm"><span>上架状态</span><select className={inputClass} value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value })}><option value="active">上架</option><option value="inactive">下架</option></select></label><label className="space-y-2 text-sm"><span>交付方式</span><select className={inputClass} value={draft.delivery_method} onChange={e => setDraft({ ...draft, delivery_method: e.target.value })}><option value="automatic">收款后自动分配卡密</option><option value="manual">管理员确认后分配卡密</option></select></label><label className="space-y-2 text-sm"><span>售后期限（天）</span><Input type="number" required min="0" max="365" value={draft.warranty_days} onChange={e => setDraft({ ...draft, warranty_days: Number(e.target.value) })} /></label>
            </div><div className="flex flex-wrap items-center gap-6 rounded-lg bg-secondary/40 p-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.auto_replace} onChange={e => setDraft({ ...draft, auto_replace: e.target.checked })} />允许故障自动换货</label><label className="flex items-center gap-2 text-sm">每份商品最多换货 <Input aria-label="最大换货次数" className="w-20" type="number" min="0" max="5" value={draft.max_replacements} onChange={e => setDraft({ ...draft, max_replacements: Number(e.target.value) })} />次</label></div><p className="text-xs leading-6 text-muted-foreground">启用后，顾客在期限内报告故障且有可用库存时可自动获得替换。超期、次数用尽或缺货会进入人工工单。</p><div className="flex justify-end gap-2">{draft.product_id && <Button variant="outline" type="button" onClick={() => setDraft(emptyDraft())}>取消编辑</Button>}<Button type="submit" disabled={busy}>保存商品</Button></div></form></Panel>
            <Panel title="商品列表"><div className="grid gap-3 md:grid-cols-2">{filtered(snapshot.products).map(product => <div key={product.id} className="rounded-lg border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{product.title}</p><p className="mt-1 text-xs text-muted-foreground">{product.slug}</p></div><Badge value={product.status} /></div><div className="my-4 flex flex-wrap gap-4 text-sm"><strong>{money(product.price_cents ?? Math.round(product.price * 100))}</strong><span className="text-muted-foreground">库存 {product.available_stock ?? stockByProduct.get(product.id) ?? 0}</span><span className="text-muted-foreground">售后 {product.warranty_days} 天</span></div><Button variant="outline" size="sm" onClick={() => { setDraft({ product_id: product.id, title: product.title, slug: product.slug, price: String((product.price_cents ?? Math.round(product.price * 100)) / 100), status: product.status, delivery_method: product.delivery_method === "manual" ? "manual" : "automatic", warranty_days: product.warranty_days, auto_replace: product.auto_replace, max_replacements: product.max_replacements }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>编辑规则</Button></div>)}</div>{!snapshot.products.length && <Empty>先创建商品，再导入库存即可上架销售</Empty>}</Panel>
          </>}
          {tab === "support" && <><Panel title="客户工单"><div className="space-y-3">{filtered(snapshot.tickets).map(ticket => <button disabled={busy} key={ticket.id} onClick={() => openTicket(ticket)} className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border p-4 text-left hover:bg-secondary/40"><div><p className="text-sm font-semibold">{statusLabel(ticket.kind)} · {ticket.subject}</p><p className="mt-1 text-xs text-muted-foreground">{time(ticket.created_at)} · {ticket.id}</p></div><Badge value={ticket.status} /></button>)}{!filtered(snapshot.tickets).length && <Empty>暂无售后和投诉工单</Empty>}</div></Panel>{selectedTicket && <Panel title={selectedTicket.ticket.subject}><div className="mb-5 space-y-3">{selectedTicket.messages.map(message => <div key={message.id} className="rounded-lg bg-secondary/40 p-3"><div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>{message.is_admin ? "客服" : "顾客"}</span><time>{time(message.created_at)}</time></div><p className="whitespace-pre-wrap break-words text-sm">{message.body}</p></div>)}</div>{selectedTicket.ticket.kind === "replacement" && <p className="mb-4 rounded-lg bg-secondary p-3 text-xs leading-6 text-muted-foreground">人工换货仍须满足购买时的保障期限、换货次数和库存要求。确认故障后点击「审核通过并换货」，系统会交付一批新凭证并保留历史记录。</p>}<form className="space-y-3" onSubmit={e => { e.preventDefault(); void act(async () => { await commerce("admin_ticket", { ticket_id: selectedTicket.ticket.id, status: ticketStatus, reply }); const updated = await commerce<TicketDetails>("support_detail", { ticket_id: selectedTicket.ticket.id }); if (currentUserId.current === userId) { setSelectedTicket(updated); setReply(""); } }); }}><Textarea aria-label="客服回复" placeholder="回复顾客，说明处理结果和下一步" value={reply} onChange={e => setReply(e.target.value)} maxLength={5000} rows={4} /><div className="flex flex-wrap justify-between gap-3"><select aria-label="工单状态" className={`${inputClass} max-w-48`} value={ticketStatus} onChange={e => setTicketStatus(e.target.value)}>{["open", "in_progress", "resolved", "closed", "rejected"].map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}</select><div className="flex flex-wrap gap-2">{selectedTicket.ticket.kind === "replacement" && !selectedTicket.ticket.replacement_applied && <Button variant="outline" type="button" disabled={busy} onClick={replaceTicket}>审核通过并换货</Button>}{selectedTicket.ticket.order_id && <Button variant="outline" type="button" onClick={() => { setRefundTarget({ order_id: selectedTicket.ticket.order_id! }); setRefundReason(selectedTicket.ticket.subject); }}>审批订单退款</Button>}<Button type="submit" disabled={busy}>保存回复与状态</Button></div></div></form></Panel>}</>}
          {tab === "payments" && <><Panel title="退款记录"><div className="space-y-3">{filtered(snapshot.refunds).map(refund => <div key={refund.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"><div><p className="text-sm font-semibold">{money(refund.amount_cents)} · {refund.reason}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{refund.id}</p></div><div className="flex items-center gap-3"><Badge value={refund.status} label={refund.status === "pending" ? "退款处理中" : refund.status === "succeeded" ? "退款成功" : "退款失败"} />{["pending", "processing"].includes(refund.status) && <Button size="sm" variant="outline" disabled={busy} onClick={() => act(() => stripeRefund(refund.id), "已核对退款状态")}>提交 / 核对退款</Button>}</div></div>)}{!snapshot.refunds.length && <Empty>暂无退款</Empty>}</div></Panel><Panel title="支付记录" action={<Button variant="outline" size="sm" disabled={busy} onClick={() => act(async () => { const report = await reconcilePayments(); toast.info(`已核对 ${report.checked} 笔：到账 ${report.settled}，关闭 ${report.expired}，退款 ${report.refunds}，待人工核对 ${report.needs_review.length}`); }, "支付核对已完成")}>核对支付 / 释放过期预留</Button>}><div className="space-y-3">{filtered(snapshot.payments).map(payment => <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-3 last:border-0"><div><p className="text-sm font-semibold">{payment.order_id ? "订单付款" : "钱包充值"} · {money(payment.amount_cents)}</p><p className="mt-1 text-xs text-muted-foreground">{statusLabel(payment.provider)} · {time(payment.created_at)}</p><p className="mt-1 font-mono text-[11px] text-muted-foreground">{payment.id}</p></div><div className="flex items-center gap-3"><Badge value={payment.status} />{payment.status === "refund_due" && <Button variant="outline" size="sm" disabled={busy} onClick={() => { setRefundTarget({ payment_id: payment.id }); setRefundReason("订单取消后到账，退回原支付渠道"); }}>退还款项</Button>}</div></div>)}{!filtered(snapshot.payments).length && <Empty>暂无支付记录</Empty>}</div></Panel></>}
        </>}
      </main>
    </div>
    {refundTarget && snapshot && <div role="dialog" aria-modal="true" aria-labelledby="refund-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={submitRefund} className="w-full max-w-lg space-y-5 rounded-2xl bg-card p-6 shadow-xl"><h2 id="refund-title" className="text-xl font-bold">确认全额退款 {refundAmount === undefined ? "" : money(refundAmount)}</h2><p className="text-sm leading-6 text-muted-foreground">系统将核对原支付、锁定退款记录并原路退回。已交付的数字货物会标记为退款，不会重新加入可售库存；外部账号或卡密需按供货渠道规则另行撤销。请先确认售后申请符合退款条件。</p><label className="block space-y-2 text-sm"><span>退款原因</span><Textarea required minLength={5} maxLength={1000} value={refundReason} onChange={e => setRefundReason(e.target.value)} /></label><div className="flex justify-end gap-3"><Button type="button" variant="outline" disabled={busy} onClick={() => setRefundTarget(null)}>返回</Button><Button type="submit" disabled={busy}>{busy ? "处理中…" : "确认退款"}</Button></div></form></div>}
  </div>;
}
