import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const reviews = [
  { name: "Alexandre Dupont", country: "FR", initial: "AD", color: "bg-rose-500", text: "Service impeccable, livraison instantanée du compte Netflix. Je recommande vivement GoAifast à tous mes amis !" },
  { name: "Peter Schmidt", country: "DE", initial: "PS", color: "bg-amber-500", text: "Ich bin mit der Dienstleistung sehr zufrieden. Wenn man ein Problem hat, hilft einem der Support weiter. Vielen Dank!" },
  { name: "Jordi Fernán", country: "ES", initial: "JF", color: "bg-emerald-500", text: "Accidentalmente compré el producto equivocado, el servicio al cliente me ayudó a reembolsarlo. Excelente equipo de soporte." },
  { name: "안현주", country: "KR", initial: "안", color: "bg-indigo-500", text: "5유로로 계정을 구입하고 문제 없이 6개월 동안 잘 사용하였습니다. 재연장 했습니다." },
  { name: "Marco Rossi", country: "IT", initial: "MR", color: "bg-cyan-500", text: "Ottimo rapporto qualità-prezzo, consegna immediata e supporto sempre disponibile. Consiglio a tutti!" },
  { name: "田中 花子", country: "JP", initial: "田", color: "bg-pink-500", text: "とても安くて便利です。すぐにアカウントが届いて、問題なく使えています。ありがとうございます！" },
];

export default function Testimonials() {
  const { t } = useTranslation();
  const [start, setStart] = useState(0);
  const visible = 3;

  const prev = () => setStart((s) => (s - 1 + reviews.length) % reviews.length);
  const next = () => setStart((s) => (s + 1) % reviews.length);

  const items = Array.from({ length: visible }, (_, i) => reviews[(start + i) % reviews.length]);

  return (
    <section className="py-16 px-4 bg-white dark:bg-gray-950">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {t("testimonials.title", "全球用户如何评价我们")}
          </h2>
          <p className="text-muted-foreground">
            {t("testimonials.subtitle", "已服务 50,000+ 用户，98% 好评率")}
          </p>
        </div>

        <div className="relative">
          <button
            onClick={prev}
            aria-label="previous"
            className="absolute -start-2 md:-start-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:scale-105 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            aria-label="next"
            className="absolute -end-2 md:-end-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:scale-105 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {items.map((r, i) => (
              <div
                key={`${r.name}-${i}`}
                className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-full ${r.color} text-white font-bold flex items-center justify-center shadow-sm`}>
                    {r.initial}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">{r.name}</div>
                    <div className="text-xs text-gray-500">{r.country}</div>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
