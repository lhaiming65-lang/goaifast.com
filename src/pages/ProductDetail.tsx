import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, ShieldCheck, Zap, Users, Repeat, KeyRound, MonitorSmartphone, ArrowLeftRight, Star, ThumbsUp, ThumbsDown, Minus, Globe, Lock, Gauge, Sparkles, Headphones } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Footer from "@/components/Footer";
import { useLocale } from "@/i18n/locale";
import { useProductContent, useStoreProducts } from "@/hooks/useProductContent";
import { icon, GRADIENTS } from "@/lib/productIcons";



interface NavState {
  title?: string;
  price?: number;
  originalPrice?: number;
  color?: string;
  initial?: string;
  category?: string;
}

const MONTH_OPTIONS = [1, 3, 6, 12];

export default function ProductDetail() {
  const { t } = useTranslation();
  const { formatPrice, isRTL } = useLocale();
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as NavState) || {};

  const { content } = useProductContent(slug ? decodeURIComponent(slug) : undefined);
  const storeRows = useStoreProducts();
  const storeRow = storeRows.find((r) => r.slug === (slug ? decodeURIComponent(slug) : ""));

  const title = content?.title || storeRow?.title || state.title || decodeURIComponent(slug || "Netflix");
  const monthly = content?.monthly_price || storeRow?.price || state.price || 3.67;
  const originalMonthly = content?.original_price || storeRow?.original_price || state.originalPrice || 15.99;
  const color = state.color || storeRow?.color || "bg-gradient-to-br from-blue-500 to-indigo-600";
  const initial = state.initial || title.charAt(0);
  const monthOptions = content?.month_options?.length ? content.month_options : MONTH_OPTIONS;

  const [months, setMonths] = useState(3);
  const [couponOpen, setCouponOpen] = useState(false);
  const [promo, setPromo] = useState("");
  const [typeIndex, setTypeIndex] = useState(0);
  const [autoRenew, setAutoRenew] = useState(false);

  const subTypes = content?.subscription_types?.length ? content.subscription_types : [];
  const activeType = subTypes[typeIndex];

  const subtotal = useMemo(
    () => monthly * months + (activeType?.price_delta ?? 0),
    [monthly, months, activeType],
  );
  const total = subtotal;

  const savings = Math.max(0, (originalMonthly - monthly) * months);


  const defaultFeatures = [
    { icon: ShieldCheck, label: t("productDetail.featPro", "Pro") },
    { icon: Repeat, label: t("productDetail.featNonRenewal", "Non-renewal") },
    { icon: KeyRound, label: t("productDetail.featPasskey", "Passkey") },
    { icon: MonitorSmartphone, label: t("productDetail.featDevices", "Mobile, Web") },
  ];
  const features = content?.features?.length
    ? content.features.map((label) => ({ icon: Check, label }))
    : defaultFeatures;

  const defaultHighlights = [
    {
      icon: Lock,
      bg: "bg-gradient-to-br from-blue-500 to-indigo-600",
      kicker: t("productDetail.h1k", "An extra layer of protection for daily use"),
      title: t("productDetail.h1t", "Your privacy stays yours"),
      body: t("productDetail.h1b", "Official private accounts with isolated data. Nothing is shared, nothing is tracked — use it with total peace of mind."),
    },
    {
      icon: Globe,
      bg: "bg-gradient-to-br from-indigo-500 to-purple-600",
      kicker: t("productDetail.h2k", "Available wherever you are"),
      title: t("productDetail.h2t", "No more regional limits"),
      body: t("productDetail.h2b", "Works across regions and devices so you can pick up right where you left off, on any platform you use."),
    },
    {
      icon: Gauge,
      bg: "bg-gradient-to-br from-sky-500 to-blue-600",
      kicker: t("productDetail.h3k", "Every session is fast and smooth"),
      title: t("productDetail.h3t", "Built for speed and stability"),
      body: t("productDetail.h3b", "Optimised delivery and premium tiers keep response times low, even during peak hours."),
    },
    {
      icon: Sparkles,
      bg: "bg-gradient-to-br from-violet-500 to-fuchsia-600",
      kicker: t("productDetail.h4k", "Simple, stable and always in your control"),
      title: t("productDetail.h4t", "Get your account and start in minutes"),
      body: t("productDetail.h4b", "After purchase you receive the login details instantly — no registration, no setup, no complicated top-ups."),
    },
  ];
  const highlights = content?.highlights?.length
    ? content.highlights.map((h, i) => ({
        icon: icon(h.icon, defaultHighlights[i % 4].icon),
        bg: h.bg || GRADIENTS[i % GRADIENTS.length],
        kicker: h.kicker,
        title: h.title,
        body: h.body,
      }))
    : defaultHighlights;

  const defaultFeatureGrid = [
    { icon: Globe, title: t("productDetail.fg1t", "Global coverage"), body: t("productDetail.fg1b", "Works reliably across regions so you always get a smooth connection.") },
    { icon: MonitorSmartphone, title: t("productDetail.fg2t", "All platforms"), body: t("productDetail.fg2b", "Windows, macOS, Linux, Android and iOS — stay online anywhere.") },
    { icon: ShieldCheck, title: t("productDetail.fg3t", "No activity tracking"), body: t("productDetail.fg3b", "We never log, monitor or store what you do with your account.") },
    { icon: Headphones, title: t("productDetail.fg4t", "Lifetime support"), body: t("productDetail.fg4b", "Fast replacement and after-sales help for the whole subscription cycle.") },
  ];
  const featureGrid = content?.feature_grid?.length
    ? content.feature_grid.map((f) => ({ icon: icon(f.icon, Sparkles), title: f.title, body: f.body }))
    : defaultFeatureGrid;

  const defaultScores = [
    { label: t("productDetail.s1", "Privacy & security"), score: 4.7, desc: t("productDetail.s1d", "Fully protected, no tracking, private by default.") },
    { label: t("productDetail.s2", "Access & compatibility"), score: 4.6, desc: t("productDetail.s2d", "Unlocks region-limited content and platforms with ease.") },
    { label: t("productDetail.s3", "Speed"), score: 4.5, desc: t("productDetail.s3d", "Smart routing and optimised protocols keep it fast and stable.") },
    { label: t("productDetail.s4", "Support"), score: 4.7, desc: t("productDetail.s4d", "Quick replies with clear, actionable instructions.") },
  ];
  const scores = content?.scores?.length ? content.scores : defaultScores;
  const overallScore = content?.overall_score ?? 4.6;

  const pros = content?.pros?.length
    ? content.pros
    : [
        t("productDetail.pro1", "Strong privacy and security protection"),
        t("productDetail.pro2", "One of the fastest and most stable services on the market"),
        t("productDetail.pro3", "Flexible plans and instant region switching"),
      ];
  const cons = content?.cons?.length
    ? content.cons
    : [
        t("productDetail.con1", "Official renewal pricing is high with limited transparency"),
        t("productDetail.con2", "Some advanced settings take time for beginners to master"),
      ];

  const reviews = content?.reviews?.length
    ? content.reviews
    : [
        { name: "Sofía Delgado", country: "ES", text: t("productDetail.rev1", "I've used this for years and it simply works. Setup was instant and I never had to think about it again.") },
        { name: "Luca Romano", country: "IT", text: t("productDetail.rev2", "Anytime I had a problem support got back to me immediately with a fix that actually worked.") },
        { name: "서연.K", country: "KR", text: t("productDetail.rev3", "Speed, security and reliability have all been great. Almost no interruptions in daily use.") },
      ];

  const howItWorks = content?.how_it_works?.length
    ? content.how_it_works
    : [
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
        subscriptionType: activeType?.label,
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
              {storeRow?.image_url ? (
                <img src={storeRow.image_url} alt={title} className="w-40 h-40 md:w-48 md:h-48 rounded-2xl object-cover shadow-lg shrink-0" />
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
                    {monthOptions.map((m) => (
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

                {subTypes.length > 0 && (
                  <div className="mb-5">
                    <div className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                      {t("productDetail.selectType", "Select Type")}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {subTypes.map((st, i) => (
                        <button
                          key={`${st.label}-${i}`}
                          onClick={() => setTypeIndex(i)}
                          className={`px-5 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                            typeIndex === i
                              ? "border-blue-500 text-blue-600 bg-blue-50/50 dark:bg-blue-950/20"
                              : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                          }`}
                        >
                          {st.label}
                          {st.note && <span className="ms-1 text-gray-500 font-normal">({st.note})</span>}
                          {!!st.price_delta && (
                            <span className="ms-1 text-xs text-gray-500" dir="ltr">
                              {st.price_delta > 0 ? "+" : "-"}
                              {formatPrice(Math.abs(st.price_delta))}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}


                {/* Auto renew */}
                <div className="mb-5 flex items-start justify-between gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                  <div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      {t("productDetail.autoRenew", "Enable auto-renewal")}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {t("productDetail.autoRenewNote", "By selecting this you agree to the GoAifast recurring payment policy")}
                    </p>
                  </div>
                  <button
                    onClick={() => setAutoRenew((v) => !v)}
                    className={`shrink-0 w-12 h-7 rounded-full transition-colors relative ${autoRenew ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}
                    aria-label="auto renew"
                  >
                    <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${autoRenew ? "left-6" : "left-1"}`} />
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

                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                  {content?.description ||
                    t(
                      "productDetail.description",
                      `${title} offers an official, exclusive account subscription that is ready to use instantly upon purchase. It supports the latest models and premium features, integrating seamlessly with its data ecosystem to boost efficiency in daily use. It can be applied across various scenarios, fully covering high-frequency needs.`,
                      { title },
                    )}
                </p>

                {content?.intro_body && (
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                    {content.intro_body}
                  </p>
                )}

              </div>
            </div>

            {/* How it works */}
            <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 md:p-8">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Zap className="w-6 h-6 text-blue-600" />
                {content?.how_it_works_title || t("productDetail.howItWorks", "How it works")}
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

            {/* Usage guide */}
            {!!content?.usage_guide?.length && (
              <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 md:p-8">
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-blue-600" />
                  {content.usage_title || t("productDetail.usageGuide", "使用详情说明")}
                </h2>
                <div className="space-y-3">
                  {content.usage_guide.map((u, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20">
                      <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                        {i + 1}
                      </div>
                      <div>
                        {u.title && <p className="font-bold text-gray-900 dark:text-white mb-1">{u.title}</p>}
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{u.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Big marketing headline like Gamsgo */}
            <section className="text-center py-10">
              <div className="inline-block px-4 py-1 rounded-full text-xs font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/40 mb-4">
                {content?.intro_badge || title}
              </div>
              <h3 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight max-w-3xl mx-auto">
                {content?.big_headline ||
                  t("productDetail.bigHeadline", "Get more done with an official private experience at a lower price")}
              </h3>
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-4 max-w-xl mx-auto">
                {content?.big_sub ||
                  t(
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

        {/* Alternating highlight sections */}
        <div className="mt-16 space-y-16">
          {highlights.map((h, i) => (
            <section key={i} className={`flex flex-col ${i % 2 ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-8 md:gap-14`}>
              <div className={`w-full md:w-1/2 aspect-[4/3] rounded-3xl ${h.bg} flex items-center justify-center shadow-lg`}>
                <h.icon className="w-24 h-24 text-white/90" strokeWidth={1.2} />
              </div>
              <div className="w-full md:w-1/2">
                <h4 className="text-base font-semibold text-blue-600 mb-2">{h.kicker}</h4>
                <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white leading-snug">{h.title}</h3>
                <div className="w-16 h-1.5 rounded-full bg-yellow-400 my-4" />
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{h.body}</p>
              </div>
            </section>
          ))}
        </div>

        {/* Feature grid */}
        <section className="mt-20">
          <div className="text-center mb-10">
            <h4 className="text-base font-semibold text-blue-600 mb-2">
              {t("productDetail.whyKicker", "Why getting it through GoAifast is smarter")}
            </h4>
            <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
              {t("productDetail.whyTitle", "Get the plan that truly fits you")}
            </h3>
            <div className="w-16 h-1.5 rounded-full bg-yellow-400 mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureGrid.map((f) => (
              <div key={f.title} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 text-center shadow-sm">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center mb-4">
                  <f.icon className="w-7 h-7 text-blue-600" />
                </div>
                <div className="font-bold text-gray-900 dark:text-white mb-2">{f.title}</div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Expert assessment */}
        <section className="mt-20">
          <div className="text-center mb-10">
            <h4 className="text-base font-semibold text-blue-600 mb-2">{t("productDetail.insightKicker", "GoAifast expert insight")}</h4>
            <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
              {t("productDetail.insightTitle", "{{title}} product assessment", { title })}
            </h3>
            <div className="w-16 h-1.5 rounded-full bg-yellow-400 mx-auto mt-4" />
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-extrabold shadow-lg">
                {overallScore}
              </div>
              <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-green-600">
                <Star className="w-4 h-4 fill-green-600" /> Great
              </div>
            </div>
            <div className="lg:col-span-2 space-y-5">
              {scores.map((s) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">{s.label}</span>
                    <span className="text-sm font-bold text-blue-600" dir="ltr">{s.score}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" style={{ width: `${(s.score / 5) * 100}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-green-50 dark:bg-green-950/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 font-bold text-green-700 dark:text-green-400 mb-3">
                <ThumbsUp className="w-5 h-5" /> {t("productDetail.pros", "Pros")}
              </div>
              <ul className="space-y-2">
                {pros.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 font-bold text-orange-700 dark:text-orange-400 mb-3">
                <ThumbsDown className="w-5 h-5" /> {t("productDetail.cons", "Cons")}
              </div>
              <ul className="space-y-2">
                {cons.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Minus className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" /> {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="mt-20 mb-8">
          <div className="text-center mb-10">
            <h4 className="text-base font-semibold text-blue-600 mb-2">{t("productDetail.reviewsKicker", "Real feedback")}</h4>
            <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
              {t("productDetail.reviewsTitle", "What our users say")}
            </h3>
            <div className="w-16 h-1.5 rounded-full bg-yellow-400 mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((r) => (
              <div key={r.name} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-5">{r.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{r.name}</div>
                    <div className="text-xs text-gray-500">{r.country}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>

  );
}
