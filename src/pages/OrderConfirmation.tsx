import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Home, FileText, Mail, Calendar, Hash, Package, ListOrdered } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLocale } from "@/i18n/locale";

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
  placedAt?: number; // epoch ms
}

// Fallback demo data so the page is directly viewable at /order/success.
const demoOrder: Required<OrderState> = {
  orderId: "GG-2607-8F3A21",
  email: "demo@example.com",
  paymentMethod: "Credit/Debit Card",
  productTitle: "Netflix Premium (4K UHD)",
  productColor: "bg-red-600",
  productInitial: "N",
  quantity: 1,
  unitPriceUSD: 3.67,
  discountUSD: 0,
  feeUSD: 0,
  placedAt: Date.now(),
};

export default function OrderConfirmation() {
  const { t } = useTranslation();
  const { formatPrice, formatDateTime } = useLocale();
  const location = useLocation();
  const state = (location.state as OrderState) || {};
  const order = { ...demoOrder, ...state };

  const subtotal = order.unitPriceUSD * order.quantity;
  const total = Math.max(0, subtotal - order.discountUSD + order.feeUSD);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4">
        <div className="container mx-auto px-4 flex items-center">
          <Link to="/" className="flex items-center gap-2 me-6">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">G</div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">GoAifast</span>
          </Link>
          <div className="flex-1" />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 lg:py-16 max-w-3xl">
        {/* Success banner */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
            {t("order.title")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{t("order.subtitle")}</p>
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
                {t("order.statusPaid")}
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

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to={`/order/${order.orderId}`}
            state={order}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-95"
          >
            <Package className="w-5 h-5" />
            {t("order.viewDetail", "查看订单详情")}
          </Link>
          <Link
            to="/orders"
            className="flex items-center justify-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-semibold py-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ListOrdered className="w-5 h-5" />
            {t("order.myOrders", "我的订单")}
          </Link>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-semibold py-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Home className="w-5 h-5" />
            {t("order.backHome")}
          </Link>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">{t("order.thanks")}</p>
      </main>
    </div>
  );
}
