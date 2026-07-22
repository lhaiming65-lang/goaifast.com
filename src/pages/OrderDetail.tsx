import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Home, Mail, Calendar, Hash, Package, ListOrdered, Copy, KeyRound, User as UserIcon, LifeBuoy, RefreshCw, Trash2, Clock, ShieldCheck, CheckCircle2 } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLocale } from "@/i18n/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OrderState {
  orderId?: string;
  email?: string;
  paymentMethod?: string;
  productTitle?: string;
  productColor?: string;
  productInitial?: string;
  quantity?: number;
  unitPriceUSD?: number;
  discountUSD?: number;
  feeUSD?: number;
  placedAt?: number;
  status?: "paid" | "processing" | "delivered";
}

// Fallback so /order/:id is directly viewable without navigation state.
const demoOrder = (id?: string): Required<OrderState> => ({
  orderId: id || "GG-2607-8F3A21",
  email: "demo@example.com",
  paymentMethod: "Credit/Debit Card",
  productTitle: "Netflix Premium (4K UHD)",
  productColor: "bg-red-600",
  productInitial: "N",
  quantity: 1,
  unitPriceUSD: 3.67,
  discountUSD: 0,
  feeUSD: 0,
  placedAt: Date.now() - 1000 * 60 * 60 * 24,
  status: "paid",
});

export default function OrderDetail() {
  const { t } = useTranslation();
  const { formatPrice, formatDateTime, isRTL } = useLocale();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const stateFromNav = (location.state as OrderState) || {};
  const [fetched, setFetched] = useState<OrderState | null>(null);

  useEffect(() => {
    if (!user || !id || stateFromNav.orderId) return;
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("order_no", id)
        .maybeSingle();
      if (data) {
        setFetched({
          orderId: data.order_no,
          email: data.delivery_email ?? "",
          paymentMethod: data.payment_method ?? "",
          productTitle: data.product_title,
          productColor: data.product_color ?? "bg-blue-600",
          productInitial: data.product_initial ?? data.product_title[0],
          quantity: data.quantity,
          unitPriceUSD: Number(data.unit_price_usd),
          discountUSD: Number(data.discount_usd),
          feeUSD: Number(data.fee_usd),
          placedAt: new Date(data.placed_at).getTime(),
          status: data.status as OrderState["status"],
        });
      }
    })();
  }, [user, id, stateFromNav.orderId]);

  const order = {
    ...demoOrder(id),
    ...(fetched ?? {}),
    ...stateFromNav,
    orderId: stateFromNav.orderId || fetched?.orderId || id || demoOrder(id).orderId,
  };

  const subtotal = order.unitPriceUSD * order.quantity;
  const total = Math.max(0, subtotal - order.discountUSD + order.feeUSD);

  const statusKey =
    order.status === "delivered"
      ? "order.statusDelivered"
      : order.status === "processing"
      ? "order.statusProcessing"
      : "order.statusPaid";

  const navigate = useNavigate();
  const accountUser = `${(order.orderId || "user").toLowerCase().replace(/[^a-z0-9]/g, "")}@goaifast.com`;
  const accountPass = (order.orderId || "TEMP-PASS-1234").split("-").slice(-1)[0] + "!Gg";

  // Subscription period (default 30 days from placedAt)
  const durationDays = 30;
  const startAt = order.placedAt;
  const endAt = startAt + durationDays * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const totalMs = endAt - startAt;
  const usedMs = Math.min(Math.max(now - startAt, 0), totalMs);
  const progress = Math.round((usedMs / totalMs) * 100);
  const remainingDays = Math.max(0, Math.ceil((endAt - now) / (1000 * 60 * 60 * 24)));

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("order.copied", `${label} 已复制`));
    } catch {
      toast.error(t("order.copyFail", "复制失败"));
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("orders.confirmDelete", "确定要删除这个订单记录吗？"))) return;
    if (!user) {
      toast.info(t("order.demoDelete", "示例订单无需删除"));
      navigate("/orders");
      return;
    }
    const { error } = await supabase.from("orders").delete().eq("order_no", order.orderId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("orders.deleted", "订单已删除"));
    navigate("/orders");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={isRTL ? "rtl" : "ltr"}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4">
        <div className="container mx-auto px-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 me-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">G</div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">GoAifast</span>
          </Link>
          <Link
            to="/orders"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ListOrdered className="w-4 h-4" />
            {t("order.myOrders", "我的订单")}
          </Link>
          <div className="flex-1" />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 lg:py-16 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
              {t("order.detailTitle")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("order.detailSubtitle")}
            </p>
          </div>
        </div>

        {/* Order introduction */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-6 md:p-8 mb-6 text-white">
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 ${order.productColor} rounded-xl flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-md`}>
              {order.productInitial}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-2xl font-bold leading-tight">{order.productTitle}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-blue-100">
                <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                  <Hash className="w-3.5 h-3.5" />
                  <span className="font-mono" dir="ltr">{order.orderId}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDateTime(order.placedAt)}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-green-400/20 text-green-50 px-2.5 py-1 rounded-lg font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300" />
                  {t(statusKey)}
                </span>
              </div>
            </div>
            <div className="hidden sm:block text-end">
              <div className="text-xs text-blue-100 mb-0.5">{t("order.total")}</div>
              <div className="text-2xl font-extrabold" dir="ltr">{formatPrice(total)}</div>
            </div>
          </div>
        </div>

        {/* Meta grid */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 md:p-8 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <Hash className="w-3.5 h-3.5" />
                {t("order.orderId")}
              </div>
              <div className="font-mono font-semibold text-gray-900 dark:text-white" dir="ltr">
                {order.orderId}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                {t("order.placedAt")}
              </div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {formatDateTime(order.placedAt)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">{t("order.status")}</div>
              <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {t(statusKey)}
              </span>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">{t("order.paidWith")}</div>
              <div className="font-semibold text-gray-900 dark:text-white">{order.paymentMethod}</div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <Mail className="w-3.5 h-3.5" />
                {t("order.deliveryEmail")}
              </div>
              <div className="font-semibold text-gray-900 dark:text-white break-all" dir="ltr">
                {order.email}
              </div>
              <p className="text-xs text-gray-500 mt-2">{t("order.deliveryNote")}</p>
            </div>
          </div>
        </div>

        {/* Subscription period */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 md:p-8 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-gray-900 dark:text-white">
              {t("order.periodTitle", "订阅周期")}
            </h2>
            <span className="ms-auto inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 uppercase tracking-wider">
              <CheckCircle2 className="w-3 h-3" />
              {t("order.active", "使用中")}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">{t("order.startDate", "开始日期")}</div>
              <div className="font-semibold text-sm text-gray-900 dark:text-white">{formatDateTime(startAt).split(" ")[0]}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">{t("order.endDate", "到期日期")}</div>
              <div className="font-semibold text-sm text-gray-900 dark:text-white">{formatDateTime(endAt).split(" ")[0]}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">{t("order.duration", "时长")}</div>
              <div className="font-semibold text-sm text-gray-900 dark:text-white" dir="ltr">{durationDays} {t("order.days", "天")}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">{t("order.remaining", "剩余")}</div>
              <div className="font-semibold text-sm text-blue-600" dir="ltr">{remainingDays} {t("order.days", "天")}</div>
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t("order.warrantyNote", "全周期售后保障，如遇问题可申请补发")}
          </div>
        </div>

        {/* Account credentials delivery */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-2xl border border-blue-200/60 dark:border-blue-800/60 shadow-sm p-6 md:p-8 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-gray-900 dark:text-white">
              {t("order.accountInfo", "账号信息")}
            </h2>
            <span className="ms-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-700 dark:text-blue-300 uppercase tracking-wider">
              {t("order.autoDelivered", "自动交付")}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                <UserIcon className="w-3.5 h-3.5" />
                {t("order.accountUser", "账号")}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 font-mono text-sm font-semibold truncate" dir="ltr">{accountUser}</div>
                <button
                  onClick={() => copy(accountUser, t("order.accountUser", "账号"))}
                  className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600"
                  aria-label="copy"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                <KeyRound className="w-3.5 h-3.5" />
                {t("order.accountPass", "密码")}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 font-mono text-sm font-semibold truncate" dir="ltr">{accountPass}</div>
                <button
                  onClick={() => copy(accountPass, t("order.accountPass", "密码"))}
                  className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600"
                  aria-label="copy"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 leading-relaxed">
            {t("order.accountTip", "请勿修改账号密码或个人资料，如需支持请联系客服。")}
          </p>
        </div>

        {/* Line items */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 md:p-8 mb-6">
          <div className="flex items-start gap-4 pb-6 border-b border-gray-100 dark:border-gray-800">
            <div className={`w-14 h-14 ${order.productColor} rounded-lg flex items-center justify-center text-white text-2xl font-bold shrink-0`}>
              {order.productInitial}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-white">{order.productTitle}</h3>
              <div className="text-sm text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
                <span>
                  {t("order.quantity")}: <span dir="ltr">{order.quantity}</span>
                </span>
                <span>
                  {t("order.unitPrice")}: <span dir="ltr">{formatPrice(order.unitPriceUSD)}</span>
                </span>
              </div>
            </div>
            <div className="text-end font-bold text-gray-900 dark:text-white" dir="ltr">
              {formatPrice(subtotal)}
            </div>
          </div>

          <div className="space-y-3 pt-6">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>{t("order.subtotal")}</span>
              <span dir="ltr">{formatPrice(subtotal)}</span>
            </div>
            {order.discountUSD > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>{t("order.discount")}</span>
                <span dir="ltr">-{formatPrice(order.discountUSD)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>{t("order.fee")}</span>
              <span dir="ltr">{formatPrice(order.feeUSD)}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-800">
              <span className="font-bold text-lg text-gray-900 dark:text-white">{t("order.total")}</span>
              <span className="font-extrabold text-3xl text-blue-600" dir="ltr">{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Link
            to="/orders"
            className="col-span-2 md:col-span-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-95"
          >
            <ListOrdered className="w-5 h-5" />
            {t("order.myOrders", "我的订单")}
          </Link>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-semibold py-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Home className="w-5 h-5" />
            {t("order.backHome")}
          </button>
          <button
            type="button"
            onClick={() => toast.info(t("order.reorderSoon", "重新购买功能即将上线"))}
            className="flex items-center justify-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-semibold py-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            {t("order.reorder", "再次购买")}
          </button>
          <button
            type="button"
            onClick={() => toast.info(t("order.supportContact", "请通过右下角联系我们"))}
            className="flex items-center justify-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-semibold py-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <LifeBuoy className="w-5 h-5" />
            {t("order.support", "联系客服")}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center justify-center gap-2 bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-semibold py-3.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            {t("orders.delete", "删除订单")}
          </button>
        </div>
      </main>
    </div>
  );
}
