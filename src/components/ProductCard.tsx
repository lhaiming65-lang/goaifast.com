import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, ChevronUp, ChevronDown } from "lucide-react";
import { useLocale } from "@/i18n/locale";
import { useCatalog } from "@/lib/cart";

interface ProductProps {
  title: string;
  price: number;
  originalPrice: number;
  color: string;
  badge?: string;
  features?: string[];
  imageUrl?: string;
  subtitle?: string;
}

export default function ProductCard({ title, price, originalPrice, color, badge, features, imageUrl, subtitle }: ProductProps) {
  const { t } = useTranslation();
  const { formatPrice } = useLocale();
  const catalog = useCatalog();
  const product = catalog.data?.products.find((row) => row.slug === title || row.title === title);
  const displayTitle = product?.title || title;
  const currentPrice = product ? product.price_cents / 100 : null;
  const comparePrice = product?.original_price ?? originalPrice;
  const discount = currentPrice !== null && comparePrice > currentPrice ? Math.round(((comparePrice - currentPrice) / comparePrice) * 100) : 0;
  const productPath = `/product/${encodeURIComponent(product?.slug || title)}`;
  const [expanded, setExpanded] = useState(false);

  const defaultFeatures = [
    "订单内安全领取数字商品",
    "支持 Stripe 和钱包付款",
    product ? `${product.warranty_days} 天售后保障` : "商品规格与保障以详情为准",
    "订单内申请退款、换货和投诉",
  ];
  const list = features && features.length > 0 ? features : defaultFeatures;
  const collapsible = list.length > 3;
  const visible = expanded || !collapsible ? list : list.slice(0, 3);

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-500/50 dark:hover:border-blue-400/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
      {badge && (
        <div className="absolute top-0 end-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-be-xl z-10">
          {badge}
        </div>
      )}

      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-4">
          {imageUrl ? (
            <img src={imageUrl} alt={displayTitle} className="w-14 h-14 rounded-xl object-cover shadow-lg" loading="lazy" />
          ) : (
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg ${color}`}>
              {displayTitle.charAt(0)}
            </div>
          )}
          <div className="flex flex-col items-end">
            <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${product && product.available_stock > 0 ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${product && product.available_stock > 0 ? "bg-green-500" : "bg-gray-400"}`}></span>
              {catalog.isLoading ? "核对库存" : product ? product.available_stock > 0 ? `库存 ${product.available_stock}` : "暂时缺货" : "暂不可购买"}
            </span>
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{displayTitle}</h3>
        <p className="text-gray-500 text-xs mb-4">{subtitle || t("products.features")}</p>

        <div className="flex items-baseline gap-2 mb-4 flex-wrap">
          <span className="text-3xl font-extrabold text-gray-900 dark:text-white" dir="ltr">{currentPrice === null ? "—" : formatPrice(currentPrice)}</span>
          <span className="text-sm text-gray-500 font-medium">/ 件</span>
          {discount > 0 && <span className="text-xs text-gray-400 line-through ms-auto" dir="ltr">{t("products.original")} {formatPrice(comparePrice)}</span>}
        </div>

        <div className="space-y-2 mb-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 p-3">
          {visible.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              <span>{f}</span>
            </div>
          ))}
          {collapsible && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 w-full flex items-center justify-center text-blue-600 hover:text-blue-700"
              aria-label="toggle features"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      <div className="p-4 pt-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
        <Link
          to={productPath}
          state={{ title, price, originalPrice, color, initial: title.charAt(0) }}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {product && product.available_stock > 0 ? "选择商品" : "查看商品"} {discount > 0 && <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">{t("products.save")} {discount}%</span>}
        </Link>
        <Link
          to={productPath}
          state={{ title, price, originalPrice, color, initial: title.charAt(0) }}
          className="mt-2 block text-center text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 underline underline-offset-4 decoration-gray-300 hover:decoration-blue-500"
        >
          {t("products.viewMore", "View more details")}
        </Link>
      </div>
    </div>
  );
}
