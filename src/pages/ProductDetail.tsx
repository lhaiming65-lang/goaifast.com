import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, CircleHelp, KeyRound, Minus, Package, Plus, ShieldCheck, ShoppingBag, ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useProductContent } from "@/hooks/useProductContent";
import { useSiteContent } from "@/hooks/useSiteContent";
import { addToCart, useCart, useCatalog } from "@/lib/cart";
import { money } from "@/lib/commerce";
import { useNavigate } from "react-router-dom";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const site = useSiteContent();
  const cart = useCart();
  const catalog = useCatalog();
  const product = catalog.data?.products.find((row) => row.slug === slug || row.title === slug);
  const { content } = useProductContent(product?.slug || slug);
  const [quantity, setQuantity] = useState(1);
  const maxQuantity = Math.min(99, product?.available_stock || 0);
  useEffect(() => setQuantity(1), [product?.id]);
  const existingQuantity = cart.find((line) => line.product_id === product?.id)?.quantity || 0;
  const canBuy = !!product && quantity > 0 && quantity <= maxQuantity && existingQuantity + quantity <= maxQuantity;

  function purchase(checkout: boolean) {
    if (!product || !canBuy) return;
    try {
      addToCart(product.id, quantity);
      if (checkout) navigate("/checkout");
      else toast.success("商品已加入购物车", { action: { label: "查看购物车", onClick: () => navigate("/cart") } });
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : "无法保存购物车，请检查浏览器存储权限"); }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4"><Link to="/" className="flex items-center gap-2 font-bold"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-xl text-white">G</div><span className="hidden sm:inline">{site.brandName}</span></Link><div className="flex-1" /><Link to="/cart" className="flex items-center gap-2 rounded-full border px-3 py-2 text-sm"><ShoppingCart className="h-4 w-4" />购物车{cart.length > 0 && <span className="rounded-full bg-blue-600 px-1.5 text-xs text-white">{cart.reduce((sum, line) => sum + line.quantity, 0)}</span>}</Link><LanguageSwitcher /></div></header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12"><Link to="/" className="mb-7 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-blue-600"><ArrowLeft className="h-4 w-4" />浏览全部商品</Link>
        {catalog.isLoading ? <div className="rounded-2xl border bg-card p-16 text-center text-muted-foreground">正在获取商品与可售库存…</div> : catalog.error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-red-700"><h1 className="mb-3 text-xl font-bold">暂时无法加载商品</h1><p>{catalog.error.message}</p><Button onClick={() => catalog.refetch()} variant="outline" className="mt-5">重新加载</Button></div> : !product ? <div className="rounded-2xl border bg-card p-12 text-center"><Package className="mx-auto mb-4 h-12 w-12 text-slate-300" /><h1 className="text-2xl font-bold">商品尚未上架或已停止销售</h1><p className="my-4 text-muted-foreground">请选择商城中可购买的商品。</p><Button asChild><Link to="/">返回商城</Link></Button></div> : <>
          <div className="grid gap-7 lg:grid-cols-[1fr_360px]"><div className="space-y-6"><section className="rounded-3xl border bg-card p-6 sm:p-8"><div className="flex flex-col gap-6 sm:flex-row">{product.image_url ? <img src={product.image_url} alt={product.title} className="h-36 w-36 shrink-0 rounded-2xl object-cover shadow-md" /> : <div className={`flex h-36 w-36 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-5xl font-extrabold text-white shadow-md ${product.color || ""}`}>{product.title.charAt(0)}</div>}<div className="min-w-0"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${product.available_stock > 0 ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300" : "bg-secondary text-muted-foreground"}`}>{product.available_stock > 0 ? `可售 ${product.available_stock} 件` : "暂时缺货"}</span><h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">{product.title}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{product.subtitle || "数字商品 · 安全支付 · 订单内交付"}</p></div></div>
            <div className="mt-7 border-t pt-6"><h2 className="mb-3 font-bold">商品规格</h2><div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/20"><div className="flex items-center justify-between gap-3"><span className="font-semibold">{product.title}</span><span className="whitespace-nowrap font-bold text-blue-600">{money(product.price_cents)} / 件</span></div><p className="mt-2 text-xs leading-5 text-muted-foreground">每件对应一份上述规格的数字商品。服务期限、适用地区和使用要求以商品说明为准。</p></div></div>
            <div className="mt-6 flex flex-wrap gap-4 text-sm"><span className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-blue-600" />账号内安全领取</span><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-blue-600" />{product.warranty_days} 天售后保障</span><span className="flex items-center gap-2"><Check className="h-4 w-4 text-blue-600" />一次性购买</span></div>
            {(product.detail_description || content?.description) && <div className="mt-6 whitespace-pre-line text-sm leading-7 text-muted-foreground">{product.detail_description || content?.description}</div>}
            {!!content?.features?.length && <ul className="mt-5 grid gap-3 sm:grid-cols-2">{content.features.map((feature, index) => <li key={`${feature}-${index}`} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />{feature}</li>)}</ul>}
          </section>
          <section className="rounded-2xl border bg-card p-6 sm:p-8"><h2 className="mb-5 flex items-center gap-2 text-xl font-bold"><Zap className="h-5 w-5 text-blue-600" />购买与交付流程</h2><ol className="space-y-4">{["将商品加入购物车，确认数量与规格。", "通过 Stripe 或钱包完成付款。", "付款确认后在「我的订单」领取账号、卡密或兑换码。", "按使用说明核验商品，确认收货；遇到问题可在订单内申请售后。"].map((text, index) => <li key={text} className="flex gap-3 text-sm leading-6"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-600">{index + 1}</span>{text}</li>)}</ol>{product.delivery_rules && <div className="mt-6 whitespace-pre-line rounded-xl bg-secondary p-4 text-sm leading-6">{product.delivery_rules}</div>}{!!content?.how_it_works?.length && <div className="mt-5 space-y-2">{content.how_it_works.map((text, index) => <p key={index} className="text-sm leading-6 text-muted-foreground">{text}</p>)}</div>}</section>
          {!!content?.usage_guide?.length && <section className="rounded-2xl border bg-card p-6 sm:p-8"><h2 className="mb-5 text-xl font-bold">{content.usage_title || "使用说明"}</h2><div className="space-y-5">{content.usage_guide.map((guide, index) => <div key={index}><h3 className="mb-2 font-semibold">{index + 1}. {guide.title}</h3><p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{guide.body}</p></div>)}</div></section>}
          <section className="rounded-2xl border bg-card p-6 sm:p-8"><h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><CircleHelp className="h-5 w-5 text-blue-600" />售后保障</h2><div className="space-y-3 text-sm leading-7 text-muted-foreground"><p>商品交付后提供 {product.warranty_days} 天保障。请先参考使用说明排查，仍无法使用时，在订单内提交异常详情。</p><p>{product.auto_replace ? `符合规则且有库存时可自动换货，最多 ${product.max_replacements} 次。超过次数、保障期限或缺货时，申请交由客服审核。` : "换货申请将由客服核实后处理。"}</p><p>退款申请与投诉均可通过订单工单提交；处理过程及回复会保存在订单中。退款获准后按原付款渠道退回。</p></div></section>
          </div><aside><section className="sticky top-24 rounded-3xl border bg-card p-6 shadow-lg"><div className="mb-1 text-sm text-muted-foreground">商品单价</div><div className="flex items-baseline gap-2"><span className="text-3xl font-extrabold">{money(product.price_cents)}</span><span className="text-sm text-muted-foreground">USD / 件</span></div><div className="my-6 flex items-center justify-between"><label className="text-sm font-medium" htmlFor="product-quantity">购买数量</label><div className="flex items-center rounded-xl border"><button aria-label="减少数量" className="p-3 disabled:opacity-40" disabled={quantity <= 1} onClick={() => setQuantity((old) => old - 1)}><Minus className="h-4 w-4" /></button><input id="product-quantity" className="w-12 bg-transparent text-center text-sm font-semibold" type="number" min={1} max={maxQuantity || 1} value={quantity} onChange={(event) => { const value = Number(event.target.value); if (Number.isInteger(value) && value > 0 && value <= Math.max(1, maxQuantity)) setQuantity(value); }} /><button aria-label="增加数量" className="p-3 disabled:opacity-40" disabled={quantity >= maxQuantity} onClick={() => setQuantity((old) => old + 1)}><Plus className="h-4 w-4" /></button></div></div><div className="flex justify-between border-t pt-5 text-lg font-bold"><span>商品总额</span><span className="text-blue-600">{money(product.price_cents * quantity)}</span></div><p className="mb-5 mt-2 text-xs text-muted-foreground">结算时再次核对库存与价格</p><Button className="w-full gap-2 rounded-xl py-6" disabled={!canBuy} onClick={() => purchase(true)}><ShoppingBag className="h-4 w-4" />{product.available_stock ? "立即购买" : "暂时缺货"}</Button><Button variant="outline" className="mt-3 w-full gap-2 rounded-xl py-6" disabled={!canBuy} onClick={() => purchase(false)}><ShoppingCart className="h-4 w-4" />加入购物车</Button>{existingQuantity > 0 && <p className="mt-3 text-xs text-muted-foreground">购物车中已有 {existingQuantity} 件。<Link to="/cart" className="text-blue-600 underline">查看购物车</Link></p>}{existingQuantity + quantity > maxQuantity && product.available_stock > 0 && <p className="mt-3 text-xs text-amber-700">当前选择加上购物车数量超过库存，请调整数量。</p>}<p className="mt-5 rounded-xl bg-secondary p-4 text-xs leading-5 text-muted-foreground">支持 Stripe 银行卡及可用的本地支付，也可使用钱包余额。交付内容仅当前账号可查看。</p></section></aside></div>
        </>}
      </main><Footer />
    </div>
  );
}
