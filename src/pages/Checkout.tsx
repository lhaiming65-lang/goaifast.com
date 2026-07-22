import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CheckCircle2, CreditCard, Lock, Mail, ChevronLeft, ChevronRight, Ticket, Calendar } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLocale } from "@/i18n/locale";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const mockProduct = {
  id: 1,
  title: "Netflix Premium (4K UHD)",
  price: 3.67,
  originalPrice: 15.99,
  imagePlaceholder: "N",
  color: "bg-red-600",
};

const paymentMethods = [
  { id: "card", name: "Credit/Debit Card", iconPlaceholder: "VISA / MC", color: "bg-blue-600" },
  { id: "paypal", name: "PayPal", iconPlaceholder: "PayPal", color: "bg-[#003087]" },
  { id: "crypto", name: "Cryptocurrency (USDT)", iconPlaceholder: "USDT", color: "bg-green-500" },
];

export default function Checkout() {
  const { t } = useTranslation();
  const { formatPrice, formatDate, isRTL } = useLocale();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [selectedPayment, setSelectedPayment] = useState(paymentMethods[0].id);
  const [couponCode, setCouponCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const total = mockProduct.price;
  const BackIcon = isRTL ? ChevronRight : ChevronLeft;

  const generateOrderId = () => {
    const rand = Math.random().toString(16).slice(2, 8).toUpperCase();
    const d = new Date();
    return `GG-${d.getFullYear().toString().slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}-${rand}`;
  };

  const handlePay = async () => {
    if (!email.includes("@")) {
      alert(t("checkout.invalidEmail"));
      return;
    }
    if (!user) {
      navigate("/auth", { state: { from: "/checkout" } });
      return;
    }
    setIsProcessing(true);
    const method = paymentMethods.find((m) => m.id === selectedPayment);
    const orderNo = generateOrderId();
    const placedAt = new Date();

    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      order_no: orderNo,
      product_title: mockProduct.title,
      product_color: mockProduct.color,
      product_initial: mockProduct.imagePlaceholder,
      quantity: 1,
      unit_price_usd: mockProduct.price,
      discount_usd: 0,
      fee_usd: 0,
      total_usd: total,
      payment_method: method?.name ?? null,
      delivery_email: email,
      status: "paid",
      placed_at: placedAt.toISOString(),
    });

    setIsProcessing(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    navigate(`/order/${orderNo}`, {
      state: {
        orderId: orderNo,
        email,
        paymentMethod: method?.name,
        productTitle: mockProduct.title,
        productColor: mockProduct.color,
        productInitial: mockProduct.imagePlaceholder,
        quantity: 1,
        unitPriceUSD: mockProduct.price,
        discountUSD: 0,
        feeUSD: 0,
        placedAt: placedAt.getTime(),
        status: "paid",
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4">
        <div className="container mx-auto px-4 flex items-center">
          <Link to="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors me-6">
            <BackIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{t("checkout.back")}</span>
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">G</div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">{t("checkout.cashier")}</span>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 text-sm">1</span>
                {t("checkout.emailStep")}
              </h2>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("checkout.emailPlaceholder")}
                  className="w-full ps-11 pe-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 dark:text-white"
                  required
                />
                <p className="text-xs text-gray-500 mt-2 ps-1">{t("checkout.emailNotice")}</p>
              </div>
            </section>

            <section className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 text-sm">2</span>
                {t("checkout.paymentStep")}
              </h2>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedPayment === method.id
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={selectedPayment === method.id}
                        onChange={() => setSelectedPayment(method.id)}
                        className="hidden"
                      />
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedPayment === method.id ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}>
                        {selectedPayment === method.id && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`h-8 px-3 ${method.color} text-white text-xs font-bold rounded flex items-center justify-center`} dir="ltr">
                          {method.iconPlaceholder}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{method.name}</span>
                      </div>
                    </div>
                    {selectedPayment === method.id && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                  </label>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t("checkout.summary")}</h3>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(new Date())}
                </span>
              </div>

              <div className="flex gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                <div className={`w-16 h-16 ${mockProduct.color} rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-sm shrink-0`}>
                  {mockProduct.imagePlaceholder}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1">{mockProduct.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">{t("checkout.duration")}</p>
                </div>
                <div className="text-end">
                  <div className="font-bold text-gray-900 dark:text-white" dir="ltr">{formatPrice(mockProduct.price)}</div>
                  <div className="text-xs text-gray-400 line-through" dir="ltr">{formatPrice(mockProduct.originalPrice)}</div>
                </div>
              </div>

              <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                  <Ticket className="w-4 h-4" />
                  {t("checkout.coupon")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t("checkout.couponPlaceholder")}
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                    {t("checkout.apply")}
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>{t("checkout.subtotal")}</span>
                  <span dir="ltr">{formatPrice(mockProduct.price)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>{t("checkout.fee")}</span>
                  <span dir="ltr">{formatPrice(0)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-800">
                  <span className="font-bold text-lg text-gray-900 dark:text-white">{t("checkout.total")}</span>
                  <span className="font-extrabold text-3xl text-blue-600" dir="ltr">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                onClick={handlePay}
                disabled={isProcessing}
                className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-md text-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${isProcessing ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {isProcessing ? (
                  <>{t("checkout.processing")}</>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>{t("checkout.payNow")}</span>
                    <span dir="ltr">{formatPrice(total)}</span>
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                <CreditCard className="w-4 h-4" />
                <span>{t("checkout.secureNotice")}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
