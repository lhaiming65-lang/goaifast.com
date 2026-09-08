import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/commerce";
import { updateCartQuantity, useCart, useCatalog } from "@/lib/cart";

export default function Cart() {
  const lines = useCart();
  const catalog = useCatalog();
  const products = catalog.data?.products || [];
  const rows = lines.map((line) => ({ ...line, product: products.find((p) => p.id === line.product_id) }));
  const total = rows.reduce((sum, row) => sum + (row.product?.price_cents || 0) * row.quantity, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const limitExceeded = itemCount > 100 || lines.length > 50;
  const invalid = limitExceeded || rows.some((row) => !row.product || row.quantity > row.product.available_stock);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
      <header className="border-b bg-card"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5"><Link to="/" className="flex items-center gap-2 font-semibold"><ArrowLeft className="h-4 w-4" />继续选购</Link><Link to="/orders" className="text-sm text-muted-foreground">我的订单</Link></div></header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex items-center gap-4"><div className="rounded-2xl bg-blue-100 p-3 text-blue-600"><ShoppingBag /></div><div><h1 className="text-3xl font-bold">购物车</h1><p className="mt-1 text-sm text-muted-foreground">确认商品数量，付款后在订单中领取数字商品。</p></div></div>
        {catalog.isLoading ? <p className="py-12 text-center text-muted-foreground">正在核对商品价格与库存…</p> : catalog.error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"><p>{catalog.error.message}</p><Button variant="outline" className="mt-4" onClick={() => catalog.refetch()}>重新加载</Button></div> : !lines.length ? <div className="rounded-2xl border bg-card p-12 text-center"><ShoppingBag className="mx-auto mb-4 h-12 w-12 text-slate-300" /><h2 className="text-xl font-semibold">购物车还是空的</h2><p className="mb-6 mt-2 text-muted-foreground">挑选一个适合你的数字服务。</p><Button asChild><Link to="/">浏览商品</Link></Button></div> : <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="space-y-4" aria-label="购物车商品">{rows.map(({ product_id, quantity, product }) => <article key={product_id} className="rounded-2xl border bg-card p-5">
            <div className="flex gap-4"><div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white ${product?.color || ""}`}>{product?.title.charAt(0) || "?"}</div><div className="min-w-0 flex-1"><h2 className="font-semibold">{product ? <Link to={`/product/${encodeURIComponent(product.slug)}`}>{product.title}</Link> : "商品已下架或不可购买"}</h2><p className="mt-1 text-sm text-muted-foreground">{product ? `${money(product.price_cents)} / 件 · 可售库存 ${product.available_stock}` : "请移除此商品后继续结算"}</p></div><button className="self-start rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600" aria-label={`移除 ${product?.title || "商品"}`} onClick={() => updateCartQuantity(product_id, 0)}><Trash2 className="h-4 w-4" /></button></div>
            <div className="mt-4 flex items-center justify-between"><div className="flex items-center rounded-xl border"><button className="p-3 disabled:opacity-40" aria-label="减少数量" disabled={quantity <= 1} onClick={() => updateCartQuantity(product_id, quantity - 1)}><Minus className="h-4 w-4" /></button><span className="min-w-10 text-center text-sm font-semibold">{quantity}</span><button className="p-3 disabled:opacity-40" aria-label="增加数量" disabled={!product || quantity >= Math.min(99, product.available_stock) || itemCount >= 100} onClick={() => updateCartQuantity(product_id, quantity + 1)}><Plus className="h-4 w-4" /></button></div><span className="text-lg font-bold">{product ? money(product.price_cents * quantity) : "—"}</span></div>
            {product && quantity > product.available_stock && <p role="alert" className="mt-3 text-sm text-red-600">库存不足，请减少购买数量或移除该商品。</p>}
          </article>)}</section>
          <aside className="h-fit rounded-2xl border bg-card p-6 lg:sticky lg:top-6"><h2 className="text-lg font-bold">订单摘要</h2><div className="my-5 flex justify-between text-sm text-muted-foreground"><span>共 {itemCount} 件商品</span><span>USD</span></div><div className="flex justify-between border-t pt-5 text-xl font-bold"><span>商品总额</span><span>{money(total)}</span></div>{limitExceeded && <p role="alert" className="mt-3 text-sm text-red-600">每单最多 50 种、100 件商品，请调整购物车后分单购买。</p>}<p className="my-4 text-xs leading-5 text-muted-foreground">结算时将再次核对库存与价格。数字商品通过订单详情交付。</p>{invalid ? <Button disabled className="w-full rounded-xl py-6">请先调整购物车</Button> : <Button asChild className="w-full gap-2 rounded-xl py-6"><Link to="/checkout">前往结算<ArrowRight className="h-4 w-4" /></Link></Button>}<div className="mt-5 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />支持 Stripe 和钱包付款，订单内可查询交付及申请售后。</div></aside>
        </div>}
      </main>
    </div>
  );
}
