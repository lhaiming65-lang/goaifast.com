import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, ShieldCheck, Zap, Users, Repeat, KeyRound, MonitorSmartphone, ArrowLeftRight } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLocale } from "@/i18n/locale";
import { useSyncedProducts } from "@/hooks/useSyncedProducts";

interface NavState {
  title?: string;
  price?: number;
  originalPrice?: number;
  color?: string;
  initial?: string;
  category?: string;
  imageUrl?: string;
}

const MONTH_OPTIONS = [1, 3, 6, 12];

export default function ProductDetail() {
  const { t } = useTranslation();
  const { formatPrice, isRTL } = useLocale();
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as NavState) || {};
  const syncedProducts = useSyncedProducts();

  const decodedTitle = decodeURIComponent(slug || "Netflix");
  const syncedProduct = syncedProducts.find((product) => product.titleKey === decodedTitle);
  const title = syncedProduct?.titleKey || state.title || decodedTitle;
  const monthly = syncedProduct?.price ?? state.price ?? 3.67;
  const originalMonthly = syncedProduct?.originalPrice ?? state.originalPrice ?? 15.99;
  const color = syncedProduct?.color || state.color || "bg-gradient-to-br from-blue-500 to-indigo-600";
  const imageUrl = syncedProduct?.imageUrl || state.imageUrl;
  const initial = state.initial || title.charAt(0);
  const ipPricingRuleName = syncedProduct?.ipPricingRuleName;
  const ipPricingNote = syncedProduct?.ipPricingNote;

  const [months, setMonths] = useState(3);
  const [couponOpen, setCouponOpen] = useState(false);
  const [promo, setPromo] = useState("");

  const subtotal = useMemo(() => monthly * months, [monthly, months]);
  const total = subtotal;
  const savings = Math.max(0, (originalMonthly - monthly) * months);

  const features = [
    { icon: ShieldCheck, label: t("productDetail.featPro", "Pro") },
    { icon: Repeat, label: t("productDetail.featNonRenewal", "Non-renewal") },
    { icon: KeyRound, label: t("productDetail.featPasskey", "Passkey") },
    { icon: MonitorSmartphone, label: t("productDetail.featDevices", "Mobile, Web") },
  ];

  const howItWorks = [
    t("productDetail.how1", "Official private account: latest models with faster speed and stronger processing power for complex tasks."),
    t("productDetail.how2", "Redemption link and top-up support to match different activation needs with flexibility."),
    t("productDetail.how3", "Private and exclusive. Your data is isolated and never shared — stronger privacy and peace of mind."),
    t("productDetail.how4", "Full lifecycle after-sales: instant replacement if anything goes wrong."),
  ];

  const handleJoin = () => {
    navigate("/checkout", {
      state: {
        productTitle: title,
        productColor: color,
        productInitial: initial,
        unitPriceUSD: monthly,
        quantity: months,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={isRTL ? "rtl" : "ltr"}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 sticky top-0 z-30 backdrop-blur">
        <div className="container mx-auto px-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">G</div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">GoAifast</span>
          </Link>
          <div className="flex-1" />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 lg:py-12 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: product info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 md:p-8">
              {imageUrl ? (
                <img src={imageUrl} alt={title} className="w-40 h-40 md:w-48 md:h-48 rounded-2xl object-cover shadow-lg shrink-0 border border-gray-100" />
              ) : (
                <div className={`w-40 h-40 md:w-48 md:h-48 rounded-2xl ${color} flex items-center justify-center text-white text-4xl md:text-5xl font-extrabold shadow-lg shrink-0`}>
                  {title.length > 5 ? title.split(" ")[0] : initial}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">{title}</h1>
                  <button className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-full">
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    {t("productDetail.cheaper", "Cheaper choice")}
                  </button>
                </div>

                <div className="mb-5">
                  <div className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                    {t("productDetail.purchaseMonths", "Purchase months")}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {MONTH_OPTIONS.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMonths(m)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                          months === m
                            ? "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/30"
                            : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                        }`}
                      >
                        {m} {t("productDetail.months", "months")}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <div className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                    {t("productDetail.selectType", "Select Type")}
                  </div>
                  <button className="w-full sm:w-auto px-5 py-3 rounded-xl border-2 border-blue-500 text-blue-600 text-sm font-semibold bg-blue-50/50 dark:bg-blue-950/20">
                    {t("productDetail.giftAccount", "Gift to your account")}
                    <span className="ms-1 text-gray-500 font-normal">
                      ({t("productDetail.noWarranty", "No Warranty")} ⊘)
                    </span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
                  {features.map((f) => (
                    <div key={f.label} className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                      <Check className="w-4 h-4 text-blue-600" />
                      {f.label}
                    </div>
                  ))}
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t(
                    "productDetail.description",
                    `${title} offers an official, exclusive account subscription that is ready to use instantly upon purchase. It supports the latest models and premium features, integrating seamlessly with its data ecosystem to boost efficiency in daily use. It can be applied across various scenarios, fully covering high-frequency needs.`,
                    { title },
                  )}
                </p>
              </div>
            </div>

            {/* How it works */}
            <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 md:p-8">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Zap className="w-6 h-6 text-blue-600" />
                {t("productDetail.howItWorks", "How it works")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {howItWorks.map((line, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20">
                    <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{line}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Big marketing headline like Gamsgo */}
            <section className="text-center py-10">
              <div className="inline-block px-4 py-1 rounded-full text-xs font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/40 mb-4">
                {title}
              </div>
              <h3 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight max-w-3xl mx-auto">
                {t("productDetail.bigHeadline", "Get more done with an official private experience at a lower price")}
              </h3>
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-4 max-w-xl mx-auto">
                {t(
                  "productDetail.bigSub",
                  "You'll get your own official account after purchase and skip the messy top-ups. Just log in and start using it for a faster, smoother experience.",
                )}
              </p>
            </section>
          </div>

          {/* Right: purchase summary */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">{t("productDetail.subtotal", "Subtotal:")}</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white" dir="ltr">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">{t("productDetail.promoCoupon", "Promo code & Coupon:")}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white" dir="ltr">-{formatPrice(0)}</span>
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mb-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 dark:text-white">{t("productDetail.total", "Total:")}</span>
                  <span className="font-extrabold text-2xl text-blue-600" dir="ltr">{formatPrice(total)}</span>
                </div>
                <div className="text-end text-xs text-gray-500 mt-1" dir="ltr">
                  {formatPrice(monthly)} / {t("productDetail.month", "month")}
                </div>
              </div>
              {ipPricingRuleName && (
                <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700">
                  IP 定价已生效：{ipPricingRuleName}
                  {ipPricingNote ? <span className="block text-xs font-normal text-orange-600">{ipPricingNote}</span> : null}
                </div>
              )}

              <button
                type="button"
                onClick={() => setCouponOpen((v) => !v)}
                className="w-full flex items-center justify-between py-3 border-t border-b border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 my-4"
              >
                {t("productDetail.havePromo", "Have a Promo Code or Coupon?")}
                <ChevronDown className={`w-4 h-4 transition-transform ${couponOpen ? "rotate-180" : ""}`} />
              </button>
              {couponOpen && (
                <div className="mb-4 flex gap-2">
                  <input
                    value={promo}
                    onChange={(e) => setPromo(e.target.value.toUpperCase())}
                    placeholder={t("productDetail.promoPlaceholder", "Enter code")}
                    className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    {t("productDetail.apply", "Apply")}
                  </button>
                </div>
              )}

              <button
                onClick={handleJoin}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold py-4 rounded-full shadow-md text-lg transition-all active:scale-95"
              >
                {t("productDetail.joinNow", "JOIN NOW")}
              </button>

              {savings > 0 && (
                <div className="mt-3 text-center text-xs text-green-600 font-semibold" dir="ltr">
                  {t("productDetail.youSave", "You save")} {formatPrice(savings)}
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/60 rounded-full px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
                <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-white">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <span>
                  {`u***${Math.floor(Math.random() * 90 + 10)}`} {t("productDetail.joined", "joined")}{" "}
                  {Math.floor(Math.random() * 5 + 1)} {t("productDetail.hoursAgo", "hours ago")}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
