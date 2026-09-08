import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, Package, RefreshCw, Search, ShoppingBag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { commerce, money, statusLabel } from "@/lib/commerce";
import { CommerceOrder, commerceDate } from "@/lib/cart";

export default function Orders() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const orders = useQuery({ queryKey: ["commerce-orders", user?.id], queryFn: () => commerce<{ orders: CommerceOrder[] }>("orders"), enabled: !!user, retry: false });
  const filtered = (orders.data?.orders || []).filter((order) => {
    const matchesStatus = filter === "all" || (filter === "support" ? ["refund_pending", "refunded"].includes(order.status) : order.status === filter);
    const text = `${order.order_number} ${(order.items || []).map((item) => item.title).join(" ")}`.toLowerCase();
    return matchesStatus && text.includes(query.trim().toLowerCase());
  });
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
      <header className="border-b bg-card"><div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5"><Link to="/" className="flex items-center gap-2 font-medium"><ArrowLeft className="h-4 w-4" />返回商城</Link><div className="flex gap-5 text-sm"><Link to="/wallet">我的钱包</Link><Link to="/profile">个人中心</Link></div></div></header>
      <main className="mx-auto max-w-5xl px-4 py-10"><div className="mb-8 flex items-center justify-between gap-4"><div className="flex items-center gap-4"><div className="rounded-2xl bg-blue-100 p-3 text-blue-600"><Package /></div><div><h1 className="text-3xl font-bold">我的订单</h1><p className="mt-1 text-sm text-muted-foreground">追踪付款、领取商品和处理售后。</p></div></div><Button variant="outline" size="icon" aria-label="刷新订单" disabled={orders.isFetching} onClick={() => orders.refetch()}><RefreshCw className={`h-4 w-4 ${orders.isFetching ? "animate-spin" : ""}`} /></Button></div>
        <div className="mb-6 space-y-4"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="h-11 rounded-xl pl-9" aria-label="搜索订单" placeholder="搜索订单号或商品名称" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="flex gap-2 overflow-x-auto pb-1">{[{ key: "all", label: "全部订单" }, { key: "pending_payment", label: "待付款" }, { key: "processing", label: "待交付" }, { key: "delivered", label: "待确认" }, { key: "completed", label: "已完成" }, { key: "support", label: "退款" }, { key: "cancelled", label: "已取消" }].map((tab) => <button key={tab.key} onClick={() => setFilter(tab.key)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium ${filter === tab.key ? "border-blue-600 bg-blue-600 text-white" : "bg-card hover:border-blue-400"}`}>{tab.label}</button>)}</div></div>
        {orders.isLoading ? <p className="py-16 text-center text-muted-foreground">正在加载订单…</p> : orders.error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{orders.error.message}</div> : !filtered.length ? <div className="rounded-2xl border bg-card p-12 text-center"><ShoppingBag className="mx-auto mb-4 h-12 w-12 text-slate-300" /><h2 className="text-xl font-semibold">{query || filter !== "all" ? "没有匹配的订单" : "还没有订单"}</h2><p className="mb-6 mt-2 text-muted-foreground">所有真实订单及付款记录都会保存在这里。</p><Button asChild><Link to="/">浏览商品</Link></Button></div> : <div className="space-y-4">{filtered.map((order) => <Link key={order.id} to={`/order/${order.id}`} className="block rounded-2xl border bg-card p-5 transition hover:border-blue-300 hover:shadow-md"><div className="flex flex-wrap justify-between gap-3 border-b pb-3 text-xs text-muted-foreground"><span className="font-mono">{order.order_number}</span><span>{commerceDate(order.created_at)}</span></div><div className="mt-4 flex items-center justify-between gap-4"><div className="min-w-0"><h2 className="font-semibold">{order.items?.length ? order.items.map((item) => `${item.title} × ${item.quantity}`).join("、") : "数字商品订单"}</h2><p className="mt-2 text-sm text-muted-foreground">{order.payment_method === "wallet" ? "钱包支付" : "Stripe"} · <span className="text-blue-600">{statusLabel(order.status)}</span></p></div><div className="shrink-0 text-right"><span className="block text-xl font-bold">{money(order.total_cents)}</span><span className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600">查看详情<ArrowUpRight className="h-3 w-3" /></span></div></div></Link>)}</div>}
      </main>
    </div>
  );
}
