import { Link, Navigate, useSearchParams } from "react-router-dom";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";

/** A payment redirect is only navigation. The detail page verifies the authenticated server order. */
export default function OrderConfirmation() {
  const [params] = useSearchParams();
  const orderId = params.get("order_id");
  if (orderId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) return <Navigate to={`/order/${orderId}`} replace />;
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-gray-950"><div className="max-w-lg rounded-2xl border bg-card p-10 text-center"><PackageSearch className="mx-auto mb-5 h-12 w-12 text-blue-600" /><h1 className="text-2xl font-bold">查看订单与付款状态</h1><p className="my-5 text-sm leading-6 text-muted-foreground">请打开真实订单确认付款与交付状态。支付页面返回并不表示已经付款成功。</p><Button asChild><Link to="/orders">前往我的订单</Link></Button></div></main>;
}
