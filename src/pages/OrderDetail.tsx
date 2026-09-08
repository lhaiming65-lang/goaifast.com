import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Clock3, Copy, CreditCard, Eye, EyeOff, LifeBuoy, Package, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { commerce, money, statusLabel, stripeCancel, stripeCheckout } from "@/lib/commerce";
import { commerceDate, OrderSnapshot, SupportTicket } from "@/lib/cart";

const kindLabels: Record<string, string> = { replacement: "商品异常 / 申请换货", refund: "申请退款", complaint: "投诉", question: "使用咨询" };
const waitingStates = ["pending_payment", "paid", "processing", "refund_pending"];
const eventLabels: Record<string, string> = {
  created: "订单已创建", order_created: "订单已创建", paid: "付款已确认", payment_succeeded: "付款已确认",
  delivered: "数字商品已交付", completed: "顾客已确认收货", cancelled: "订单已取消",
  refunded: "退款已完成", refund_requested: "退款申请已提交", refund_pending: "退款处理中",
  replacement: "已换货", replaced: "已换货", auto_replaced: "已自动换货", processing: "正在准备交付",
};

function TicketConversation({ ticket, onUpdated }: { ticket: SupportTicket; onUpdated: () => void }) {
  const { user } = useAuth();
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  async function send(event: FormEvent) {
    event.preventDefault();
    if (!reply.trim() || busy) return;
    setBusy(true);
    try {
      await commerce("support_reply", { ticket_id: ticket.id, message: reply.trim() });
      setReply("");
      toast.success("补充信息已提交");
      onUpdated();
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : "回复失败"); }
    finally { setBusy(false); }
  }
  return <article className="rounded-xl border p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold">{ticket.subject}</h3><p className="mt-1 text-xs text-muted-foreground">{kindLabels[ticket.kind] || ticket.kind} · {commerceDate(ticket.created_at)}</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs">{statusLabel(ticket.status)}</span></div><div className="my-4 space-y-3">{(ticket.messages || []).map((message) => <div key={message.id} className={`rounded-lg p-3 text-sm ${message.author_id === user?.id ? "bg-blue-50 dark:bg-blue-950/30" : "bg-secondary"}`}><div className="mb-1 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>{message.author_id === user?.id ? "我" : "客服 / 系统"}</span><span>{commerceDate(message.created_at)}</span></div><p className="whitespace-pre-wrap break-words leading-6">{message.body}</p></div>)}</div>{<form onSubmit={send} className="flex gap-2"><Input aria-label={`补充工单 ${ticket.subject}`} placeholder="补充问题信息…" value={reply} onChange={(event) => setReply(event.target.value)} maxLength={4000} required /><Button type="submit" disabled={busy || !reply.trim()}>{busy ? "发送中" : ["closed", "resolved", "rejected"].includes(ticket.status) ? "补充并重新打开" : "发送"}</Button></form>}</article>;
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [busy, setBusy] = useState("");
  const [actionError, setActionError] = useState("");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [kind, setKind] = useState("replacement");
  const [itemId, setItemId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [pollFinished, setPollFinished] = useState(false);
  const polls = useRef(0);
  const details = useQuery({
    queryKey: ["commerce-order", user?.id, id],
    queryFn: () => commerce<OrderSnapshot>("order", { order_id: id }),
    enabled: !!user && !!id,
    retry: false,
  });
  const { refetch, dataUpdatedAt } = details;
  const snapshot = details.data;
  const order = snapshot?.order;

  useEffect(() => { polls.current = 0; setPollFinished(false); setRevealed({}); }, [id]);
  useEffect(() => {
    if (!order || !waitingStates.includes(order.status)) return;
    if (polls.current >= 12) { setPollFinished(true); return; }
    const timer = window.setTimeout(() => {
      polls.current += 1;
      void refetch();
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [order, dataUpdatedAt, refetch]);

  async function action(name: "cancel" | "confirm" | "pay") {
    if (!order || busy) return;
    setBusy(name);
    setActionError("");
    try {
      if (name === "pay") {
        const payment = snapshot?.payments.find((candidate) => ["pending", "created", "processing"].includes(candidate.status));
        if (!payment) throw new Error("没有可继续付款的记录，请刷新订单状态后重试");
        const session = await stripeCheckout(payment.id);
        window.location.assign(session.url);
      } else {
        const payment = snapshot?.payments.find((candidate) => ["pending", "created", "processing"].includes(candidate.status));
        if (name === "cancel" && order.payment_method === "stripe" && payment && (payment.provider_session_id || payment.checkout_claimed_at)) {
          await stripeCancel(payment.id);
        } else {
          await commerce(name, { order_id: order.id });
        }
        void queryClient.invalidateQueries({ queryKey: ["commerce-catalog"] });
        void queryClient.invalidateQueries({ queryKey: ["commerce-orders", user?.id] });
        toast.success(name === "cancel" ? "订单已取消" : "已确认收货");
        await details.refetch();
      }
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : "操作失败，请稍后重试"); }
    finally { setBusy(""); }
  }

  async function createTicket(event: FormEvent) {
    event.preventDefault();
    if (!order || busy || !message.trim()) return;
    setBusy("support");
    setActionError("");
    try {
      const result = await commerce<{ auto_replaced: boolean }>("support_create", {
        order_id: order.id, item_id: itemId || (kind === "replacement" ? snapshot?.items[0]?.id : undefined),
        kind, subject: subject.trim() || kindLabels[kind], message: message.trim(),
      });
      void queryClient.invalidateQueries({ queryKey: ["commerce-catalog"] });
      setMessage(""); setSubject("");
      toast.success(result.auto_replaced ? "已自动换货，请查看最新交付内容" : "售后申请已提交，可在下方查看处理进展");
      await details.refetch();
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : "提交失败，请稍后重试"); }
    finally { setBusy(""); }
  }

  async function copySecret(secret: string) {
    try { await navigator.clipboard.writeText(secret); toast.success("交付内容已复制"); }
    catch { toast.error("无法访问剪贴板，请手动复制"); }
  }

  const steps = ["下单", "付款", "交付", "完成"];
  const step = !order ? 0 : ["delivered", "completed"].includes(order.status) ? order.status === "completed" ? 3 : 2 : ["paid", "processing", "refund_pending", "refunded"].includes(order.status) ? 1 : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
      <header className="border-b bg-card"><div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5"><Link to="/orders" className="flex items-center gap-2 font-medium"><ArrowLeft className="h-4 w-4" />我的订单</Link><Link to="/" className="text-sm text-muted-foreground">返回商城</Link></div></header>
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-7 flex items-center justify-between"><div><h1 className="text-3xl font-bold">订单详情</h1><p className="mt-2 text-sm text-muted-foreground">付款记录、数字交付与售后服务。</p></div><Button variant="outline" disabled={details.isFetching} onClick={() => details.refetch()} className="gap-2"><RefreshCw className={`h-4 w-4 ${details.isFetching ? "animate-spin" : ""}`} />刷新</Button></div>
        {details.isLoading ? <p className="py-16 text-center text-muted-foreground">正在安全加载订单…</p> : details.error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{details.error.message}<p className="mt-2 text-sm">请确认当前账号拥有该订单，或返回订单列表选择订单。</p></div> : !order || !snapshot ? <div className="rounded-2xl border bg-card p-10 text-center">没有找到此订单。<Link to="/orders" className="ml-2 text-blue-600 underline">查看我的订单</Link></div> : <>
          <section className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white sm:p-8"><div className="flex flex-wrap items-center justify-between gap-5"><div><span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-sm">{statusLabel(order.status)}</span><h2 className="mt-4 break-all font-mono text-lg font-semibold">{order.order_number}</h2><p className="mt-2 text-xs text-blue-100">下单时间 {commerceDate(order.created_at)}</p></div><div><p className="text-sm text-blue-100">订单金额</p><p className="mt-1 text-3xl font-bold">{money(order.total_cents)}</p><p className="mt-1 text-xs text-blue-100">{order.payment_method === "wallet" ? "钱包支付" : "Stripe"} · {order.currency?.toUpperCase()}</p></div></div>{!["cancelled", "refund_pending", "refunded"].includes(order.status) && <ol className="mt-8 grid grid-cols-4 gap-3 border-t border-white/20 pt-6">{steps.map((label, index) => <li key={label} className={`flex items-center gap-2 text-xs sm:text-sm ${index <= step ? "text-white" : "text-white/45"}`}><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${index <= step ? "bg-white text-blue-600" : "border border-white/30"}`}>{index < step ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</span>{label}</li>)}</ol>}</section>
          {order.status === "pending_payment" && <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 dark:bg-amber-950/20 dark:text-amber-100"><div className="flex items-start gap-3"><Clock3 className="mt-1 h-5 w-5 shrink-0" /><div><p className="font-semibold">等待付款确认</p><p className="mt-1 text-sm leading-6">付款状态以支付平台确认结果为准。{order.expires_at ? `库存保留至 ${commerceDate(order.expires_at)}。` : ""} 已付款时请稍候并刷新，勿重复付款。</p><div className="mt-4 flex flex-wrap gap-3">{order.payment_method === "stripe" && <Button disabled={!!busy} onClick={() => action("pay")} className="gap-2"><CreditCard className="h-4 w-4" />{busy === "pay" ? "正在跳转…" : "继续支付"}</Button>}<Button variant="outline" disabled={!!busy} onClick={() => action("cancel")}>{busy === "cancel" ? "正在取消…" : "取消未付款订单"}</Button></div></div></div></div>}
          {["paid", "processing"].includes(order.status) && <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-800 dark:bg-blue-950/20 dark:text-blue-200">付款已确认，商品正在交付。自动发货完成后会在下方显示；若长时间未交付，请提交使用咨询工单。</div>}
          {pollFinished && waitingStates.includes(order.status) && <p className="mb-5 text-sm text-muted-foreground">自动查询已暂停，可点击「刷新」获取最新状态，或稍后返回此订单。</p>}
          {actionError && <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{actionError}</p>}
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]"><div className="space-y-6">
            <section className="rounded-2xl border bg-card p-6"><h2 className="mb-5 flex items-center gap-2 text-lg font-bold"><Package className="h-5 w-5 text-blue-600" />商品与交付</h2><div className="space-y-6">{snapshot.items.map((item) => {
              const deliveries = snapshot.deliveries.filter((delivery) => delivery.item_id === item.id);
              const generation = Math.max(0, ...deliveries.map((delivery) => delivery.generation));
              return <article key={item.id} className="border-b pb-5 last:border-0 last:pb-0"><div className="flex justify-between gap-4"><div><h3 className="font-semibold">{item.title}</h3><p className="mt-1 text-sm text-muted-foreground">{money(item.unit_price_cents)} × {item.quantity}</p></div><span className="font-semibold">{money(item.unit_price_cents * item.quantity)}</span></div><p className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />保障期 {item.warranty_days} 天 · {item.auto_replace ? `符合规则可自动换货，已使用 ${item.replacement_count || 0}/${item.max_replacements} 次` : "商品问题由客服审核处理"}</p>
                {deliveries.length ? <div className="mt-4 space-y-3">{deliveries.map((delivery) => {
                  const secret = typeof delivery.secret === "string" ? delivery.secret : JSON.stringify(delivery.secret, null, 2);
                  const refunded = delivery.status === "refunded";
                  const obsolete = delivery.generation < generation || delivery.status === "replaced" || refunded;
                  return <div key={delivery.id} className={`rounded-xl border p-4 ${obsolete ? "border-border bg-secondary/50 opacity-70" : "border-blue-100 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20"}`}><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold">{refunded ? "历史交付（已退款）" : obsolete ? "历史交付（已更换）" : "当前交付"} · 第 {delivery.generation + 1} 批</span><span className="text-xs text-muted-foreground">{commerceDate(delivery.created_at)}</span></div><div className="my-3 rounded-lg border bg-card p-3"><pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-sm">{revealed[delivery.id] ? secret : "••••••••••••••••••••••••"}</pre></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setRevealed((old) => ({ ...old, [delivery.id]: !old[delivery.id] }))} className="gap-1">{revealed[delivery.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}{revealed[delivery.id] ? "隐藏" : "查看内容"}</Button><Button variant="outline" size="sm" onClick={() => copySecret(secret)} className="gap-1"><Copy className="h-3 w-3" />复制</Button></div></div>;
                })}</div> : <p className="mt-4 rounded-xl bg-secondary p-4 text-sm text-muted-foreground">{order.status === "pending_payment" ? "付款确认后交付" : order.status === "cancelled" ? "订单已取消，无交付内容" : "尚未生成交付内容"}</p>}
                <Link to={`/product/${encodeURIComponent(item.title)}`} className="mt-3 inline-block text-xs text-blue-600 underline">商品使用说明</Link>
              </article>;
            })}</div>{order.status === "delivered" && <div className="mt-5 border-t pt-5"><p className="mb-3 text-sm text-muted-foreground">请核验商品可正常使用后确认收货。保障期内仍可通过工单申请售后。</p><Button disabled={!!busy} onClick={() => action("confirm")} className="gap-2"><CheckCircle2 className="h-4 w-4" />{busy === "confirm" ? "确认中…" : "确认收货"}</Button></div>}</section>
            <section id="support" className="rounded-2xl border bg-card p-6"><h2 className="mb-2 flex items-center gap-2 text-lg font-bold"><LifeBuoy className="h-5 w-5 text-blue-600" />售后与投诉</h2><p className="mb-5 text-sm leading-6 text-muted-foreground">遇到卡密失效、账号异常或交付问题，请描述具体情况。符合保障规则且有可用库存时会自动换货，否则进入客服处理。</p><form onSubmit={createTicket} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm"><span>服务类型</span><select aria-label="服务类型" value={kind} onChange={(event) => setKind(event.target.value)} className="h-11 w-full rounded-lg border bg-background px-3">{Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="space-y-2 text-sm"><span>相关商品</span><select aria-label="相关商品" value={itemId || (kind === "replacement" ? snapshot.items[0]?.id : "")} onChange={(event) => setItemId(event.target.value)} className="h-11 w-full rounded-lg border bg-background px-3">{kind !== "replacement" && <option value="">整个订单</option>}{snapshot.items.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label></div><label className="block space-y-2 text-sm"><span>问题标题</span><Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder={kindLabels[kind]} maxLength={120} /></label><label className="block space-y-2 text-sm"><span>问题详情</span><textarea aria-label="问题详情" required minLength={10} maxLength={4000} rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="请描述问题、发生时间、报错内容及希望的处理方式（至少 10 个字），可附截图链接。" className="w-full resize-y rounded-xl border bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-blue-500" /></label><Button type="submit" disabled={!!busy || message.trim().length < 10}>{busy === "support" ? "正在提交…" : "提交售后申请"}</Button></form></section>
            {!!snapshot.tickets.length && <section className="rounded-2xl border bg-card p-6"><h2 className="mb-5 text-lg font-bold">服务记录</h2><div className="space-y-4">{snapshot.tickets.map((ticket) => <TicketConversation key={ticket.id} ticket={ticket} onUpdated={() => void details.refetch()} />)}</div></section>}
          </div><aside className="space-y-6"><section className="rounded-2xl border bg-card p-5"><h2 className="mb-4 font-bold">订单进展</h2>{snapshot.events.length ? <ol className="space-y-4">{snapshot.events.map((event) => <li key={event.id} className="border-l-2 border-blue-200 pl-3"><p className="text-sm">{event.message || eventLabels[event.event_type || event.type || ""] || statusLabel(event.event_type || event.type || "updated")}</p><time className="mt-1 block text-xs text-muted-foreground">{commerceDate(event.created_at)}</time></li>)}</ol> : <p className="text-sm text-muted-foreground">订单已创建，进展会在这里更新。</p>}</section>
            <section className="rounded-2xl border bg-card p-5"><h2 className="mb-4 font-bold">付款记录</h2><div className="space-y-4">{snapshot.payments.map((payment) => <div key={payment.id} className="text-sm"><div className="flex justify-between gap-2"><span>{money(payment.amount_cents)}</span><span className="text-blue-600">{statusLabel(payment.status)}</span></div><time className="mt-1 block text-xs text-muted-foreground">{commerceDate(payment.created_at)}</time></div>)}</div></section>
            {!!snapshot.refunds.length && <section className="rounded-2xl border bg-card p-5"><h2 className="mb-4 font-bold">退款进展</h2><div className="space-y-4">{snapshot.refunds.map((refund) => <div key={refund.id} className="text-sm"><div className="flex justify-between"><span>{money(refund.amount_cents)}</span><span>{refund.status === "pending" ? "退款处理中" : refund.status === "succeeded" ? "退款成功" : statusLabel(refund.status)}</span></div><p className="mt-1 text-xs text-muted-foreground">{refund.reason}</p><time className="mt-1 block text-xs text-muted-foreground">{commerceDate(refund.created_at)}</time></div>)}</div><p className="mt-4 text-xs leading-5 text-muted-foreground">钱包支付退回钱包，Stripe 支付退回原付款渠道。到账进展以退款状态为准。</p></section>}
          </aside></div>
        </>}
      </main>
    </div>
  );
}
