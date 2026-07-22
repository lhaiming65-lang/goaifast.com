import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { Search, TrendingUp, Shield, Zap, X, CheckCircle2, CreditCard, Headphones, Rocket } from "lucide-react";

export default function Hero() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const scrollToProducts = () => {
    const el = document.getElementById("products");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const highlights = [
    { icon: Rocket, title: t("hero.moreH1", "极速自动交付"), desc: t("hero.moreD1", "下单后系统即时发货，秒收账号，无需等待人工。") },
    { icon: Shield, title: t("hero.moreH2", "官方正版账号"), desc: t("hero.moreD2", "全部为官方渠道账号，独享私人空间，数据隔离更安全。") },
    { icon: CreditCard, title: t("hero.moreH3", "多种支付方式"), desc: t("hero.moreD3", "支持信用卡、PayPal、加密货币等多种全球支付方式。") },
    { icon: Headphones, title: t("hero.moreH4", "7×24 售后保障"), desc: t("hero.moreD4", "全周期售后，遇到任何问题秒级响应，可申请补发或退款。") },
  ];

  return (
    <section className="relative py-20 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero -z-10" />

      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
            <Zap className="w-4 h-4" />
            {t("hero.badge")}
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            {t("hero.title1")}
            <br />
            <span className="bg-gradient-brand bg-clip-text text-transparent">
              {t("hero.title2")}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("hero.desc1")}
            <br />
            {t("hero.desc2")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={scrollToProducts}
              className="rounded-full gap-2 bg-gradient-brand hover:opacity-90 transition-opacity shadow-medium text-base px-8"
            >
              <Search className="w-5 h-5" />
              {t("hero.browse")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setOpen(true)}
              className="rounded-full text-base px-8"
            >
              {t("hero.learnMore")}
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span>{t("hero.securePay")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <span>{t("hero.instantDelivery")}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span>{t("hero.bestPrice")}</span>
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative bg-white dark:bg-gray-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-brand p-8 text-white">
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 end-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                aria-label="close"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-2xl md:text-3xl font-extrabold mb-2">
                {t("hero.moreTitle", "关于 GoAifast")}
              </h3>
              <p className="text-white/90 text-sm md:text-base">
                {t("hero.moreSub", "一站式数字订阅服务平台，官方正版 · 独享账号 · 极速交付")}
              </p>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
              {highlights.map((h) => {
                const Icon = h.icon;
                return (
                  <div key={h.title} className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
                    <div className="w-10 h-10 rounded-xl bg-gradient-brand text-white flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white mb-1">{h.title}</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{h.desc}</p>
                  </div>
                );
              })}
              <div className="sm:col-span-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{t("hero.moreFoot", "已服务 50,000+ 用户，98% 好评率")}</span>
              </div>
            </div>

            <div className="p-6 pt-2 flex flex-col sm:flex-row gap-3 border-t border-gray-100 dark:border-gray-800">
              <Button
                onClick={() => {
                  setOpen(false);
                  setTimeout(scrollToProducts, 100);
                }}
                className="flex-1 rounded-full bg-gradient-brand hover:opacity-90 gap-2"
              >
                <Search className="w-4 h-4" />
                {t("hero.browse")}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full flex-1">
                {t("hero.close", "关闭")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

