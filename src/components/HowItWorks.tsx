import { useTranslation } from "react-i18next";
import { Search, ShieldCheck, Send, HeadphonesIcon } from "lucide-react";

const steps = [
  { icon: Search, keyT: "howItWorks.s1", defaultTitle: "选择服务", defaultDesc: "在数十种正版数字订阅中挑选适合你的服务与时长。" },
  { icon: ShieldCheck, keyT: "howItWorks.s2", defaultTitle: "安全支付", defaultDesc: "支持信用卡、PayPal、加密货币等多种全球支付方式。" },
  { icon: Send, keyT: "howItWorks.s3", defaultTitle: "极速交付", defaultDesc: "系统自动发货，几秒内收到账号信息，无需人工等待。" },
  { icon: HeadphonesIcon, keyT: "howItWorks.s4", defaultTitle: "售后保障", defaultDesc: "全周期 7×24 售后服务，问题秒级响应，出问题即补发。" },
];

export default function HowItWorks() {
  const { t } = useTranslation();
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {t("howItWorks.title", "四步开启你的订阅之旅")}
          </h2>
          <p className="text-muted-foreground">
            {t("howItWorks.subtitle", "从下单到使用，全程仅需一分钟")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.defaultTitle}
                className="relative p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                <div className="absolute top-4 end-4 text-5xl font-black text-blue-100 dark:text-blue-950/60 leading-none">
                  0{i + 1}
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center mb-4 shadow-md">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                  {t(`${s.keyT}.title`, s.defaultTitle)}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t(`${s.keyT}.desc`, s.defaultDesc)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
