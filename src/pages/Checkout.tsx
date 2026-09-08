import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, LockKeyhole, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { commerce, money, stripeCheckout } from "@/lib/commerce";
import { removePurchasedItems, CommerceOrder, useCart, useCatalog } from "@/lib/cart";

export default function Checkout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const lines = useCart();
  const catalog = useCatalog();
  const [method, setMethod] = useState<"stripe" | "wallet">("stripe");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const submitting = useRef(false);
  const rows = lines.map((line) => ({ ...line, product: catalog.data?.products.find((p) => p.id === line.product_id) }));
  const total = rows.reduce((sum, row) => sum + (row.product?.price_cents || 0) * row.quantity, 0);
  const invalid = !lines.length || lines.length > 50 || lines.reduce((sum, line) => sum + line.quantity, 0) > 100 || rows.some((row) => !row.product || row.quantity > row.product.available_stock);

  useEffect(() => {
    let active = true;
    if (user) commerce<{ wallet: { balance_cents: number } }>("wallet").then((data) => {
      if (active) setBalance(data.wallet.balance_cents);
    }).catch(() => { if (active) setBalance(null); });
    return () => { active = false; };
  }, [user]);

  async function pay(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || invalid || !agreed) return;
    if (!user) { navigate("/auth", { state: { from: "/checkout" } }); return; }
    submitting.current = true;
    setBusy(true);
    setError("");
    let order: CommerceOrder | undefined;
    try {
      const signature = JSON.stringify({ user: user.id, method, lines });
      let saved: { signature: string; key: string } | null = null;
      try { saved = JSON.parse(sessionStorage.getItem("goaifast-checkout-attempt") || "null"); } catch { /* Discard malformed cached attempts. */ }
      const key = saved?.signature === signature && typeof saved.key === "string" && /^[0-9a-f-]{36}$/i.test(saved.key) ? saved.key : crypto.randomUUID();
      sessionStorage.setItem("goaifast-checkout-attempt", JSON.stringify({ signature, key }));
      const result = await commerce<{ order: CommerceOrder; payment: { id: string } }>("checkout", {
        items: lines, payment_method: method, idempotency_key: key, expected_total_cents: total,
      });
      order = result.order;
      void queryClient.invalidateQueries({ queryKey: ["commerce-catalog"] });
      void queryClient.invalidateQueries({ queryKey: ["commerce-orders", user.id] });
      sessionStorage.removeItem("goaifast-checkout-attempt");
      if (method === "stripe" && order.status === "pending_payment") {
        const session = await stripeCheckout(result.payment.id);
        removePurchasedItems(lines);
        window.location.assign(session.url);
      } else {
        removePurchasedItems(lines);
        navigate(`/order/${order.id}`, { replace: true });
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "结算失败，请稍后重试";
      if (order) {
        try { removePurchasedItems(lines); } catch { /* The order remains available even if browser storage is blocked. */ }
        toast.error(`订单已创建，支付尚未完成：${message}`);
        navigate(`/order/${order.id}`, { replace: true });
      } else {
        setError(message);
        void catalog.refetch();
      }
    } finally { submitting.current = false; setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
      <header className="border-b bg-card"><div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5"><Link to="/cart" className="flex items-center gap-2 font-medium"><ArrowLeft className="h-4 w-4" />返回购物车</Link><span className="flex items-center gap-2 text-sm text-muted-foreground"><LockKeyhole className="h-4 w-4" />安全结算</span></div></header>
      <main className="mx-auto max-w-5xl px-4 py-10"><h1 className="mb-2 text-3xl font-bold">确认订单并付款</h1><p className="mb-8 text-muted-foreground">支付完成后，你的卡密、兑换码或账号将保存在订单详情中。</p>
        {catalog.isLoading ? <p className="py-12 text-center">正在核对购物车…</p> : catalog.error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">{catalog.error.message}<Button variant="outline" className="ml-4" onClick={() => catalog.refetch()}>重试</Button></div> : !lines.length ? <div className="rounded-2xl border bg-card p-10 text-center"><p className="mb-5">购物车中还没有商品。</p><Button asChild><Link to="/">去选购</Link></Button></div> : <form onSubmit={pay} className="grid gap-6 md:grid-cols-[1fr_340px]">
          <div className="space-y-6"><section className="rounded-2xl border bg-card p-6"><h2 className="mb-4 text-lg font-bold">1. 交付账号</h2><p className="break-all font-medium">{user?.email}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">商品归属当前登录账号。付款后请前往「我的订单」安全查看交付内容与使用说明。</p></section>
            <section className="rounded-2xl border bg-card p-6"><h2 className="mb-4 text-lg font-bold">2. 支付方式</h2><div className="space-y-3">{([
              { value: "stripe", title: "Stripe 安全支付", icon: CreditCard, desc: "银行卡及结账页支持的本地支付方式" },
              { value: "wallet", title: "钱包余额", icon: Wallet, desc: balance === null ? "余额将在付款时由服务器核验" : `可用余额 ${money(balance)}` },
            ] as const).map((item) => <label key={item.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 ${method === item.value ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20" : "border-border"}`}><input type="radio" name="payment" value={item.value} checked={method === item.value} onChange={() => setMethod(item.value)} disabled={busy} /><item.icon className="h-5 w-5 shrink-0 text-blue-600" /><span><span className="block font-semibold">{item.title}</span><span className="mt-1 block text-xs text-muted-foreground">{item.desc}</span></span></label>)}</div>{method === "wallet" && balance !== null && balance < total && <p className="mt-4 text-sm text-amber-700">余额不足，请选择 Stripe，或前往 <Link to="/wallet" className="underline">钱包充值</Link>。</p>}</section>
            <div className="flex gap-3 rounded-xl bg-blue-50 p-5 text-sm leading-6 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200"><ShieldCheck className="mt-1 h-5 w-5 shrink-0" /><p>数字商品按页面所示规格交付。发生卡密失效、账号异常或其他问题，可在订单内申请换货、退款或投诉。自动换货适用范围与次数以商品保障规则为准。</p></div>
          </div>
          <aside className="h-fit rounded-2xl border bg-card p-6"><h2 className="mb-5 text-lg font-bold">订单明细</h2><div className="space-y-4">{rows.map((row) => <div key={row.product_id} className="flex justify-between gap-4 text-sm"><div><p className="font-medium">{row.product?.title || "商品不可购买"}</p><p className="mt-1 text-xs text-muted-foreground">数量 {row.quantity} · {row.product ? money(row.product.price_cents) : "—"} / 件</p>{row.product && row.quantity > row.product.available_stock && <p className="mt-1 text-xs text-red-600">库存不足</p>}</div><span className="whitespace-nowrap font-medium">{row.product ? money(row.product.price_cents * row.quantity) : "—"}</span></div>)}</div><div className="mt-6 flex justify-between border-t pt-5 text-xl font-bold"><span>应付金额</span><span className="text-blue-600">{money(total)}</span></div><p className="mt-2 text-xs text-muted-foreground">USD · 订单创建时重新核验价格与库存</p>
            <label className="my-5 flex items-start gap-3 text-xs leading-5"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} className="mt-1" required disabled={busy} /><span>我已核对商品规格，理解数字商品的交付方式，并同意 <Link to="/page/terms" className="text-blue-600 underline" target="_blank" rel="noreferrer">服务条款</Link> 与 <Link to="/page/refund" className="text-blue-600 underline" target="_blank" rel="noreferrer">退款规则</Link>。</span></label>
            {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <Button type="submit" disabled={busy || !agreed || invalid || (method === "wallet" && balance !== null && balance < total)} className="w-full rounded-xl py-6">{busy ? "正在处理，请稍候…" : method === "stripe" ? "创建订单并前往 Stripe" : `钱包支付 ${money(total)}`}</Button>{invalid && <Link to="/cart" className="mt-3 block text-center text-sm text-red-600 underline">返回购物车处理不可购买商品</Link>}
          </aside>
        </form>}
      </main>
    </div>
  );
}
