import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowLeft, Package, ChevronRight, Search, Trash2, ShoppingBag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLocale } from "@/i18n/locale";

interface OrderRow {
  id: string;
  order_no: string;
  product_title: string;
  product_color: string | null;
  product_initial: string | null;
  quantity: number;
  unit_price_usd: number;
  discount_usd: number;
  fee_usd: number;
  total_usd: number;
  payment_method: string | null;
  delivery_email: string | null;
  status: string;
  placed_at: string;
}

const statusStyles: Record<string, string> = {
  paid: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  processing: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  delivered: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  cancelled: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

export default function Orders() {
  const { t } = useTranslation();
  const { formatPrice, formatDateTime, isRTL } = useLocale();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("placed_at", { ascending: false });
      if (error) toast.error(error.message);
      else setOrders((data ?? []) as OrderRow[]);
      setLoading(false);
    })();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm(t("orders.confirmDelete", "确定要删除这个订单记录吗？"))) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      setOrders((o) => o.filter((x) => x.id !== id));
      toast.success(t("orders.deleted", "订单已删除"));
    }
  };

  const filtered = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      o.order_no.toLowerCase().includes(q) ||
      o.product_title.toLowerCase().includes(q) ||
      (o.delivery_email ?? "").toLowerCase().includes(q)
    );
  });

  const filters = [
    { key: "all", label: t("orders.filterAll", "全部") },
    { key: "paid", label: t("order.statusPaid") },
    { key: "processing", label: t("order.statusProcessing", "处理中") },
    { key: "delivered", label: t("order.statusDelivered", "已交付") },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={isRTL ? "rtl" : "ltr"}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4">
        <div className="container mx-auto px-4 flex items-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground me-6">
            <ArrowLeft className="w-4 h-4" />
            {t("auth.backHome")}
          </Link>
          <div className="flex-1" />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">
              {t("orders.title", "我的订单")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("orders.subtitle", "查看历史订单与交付状态")}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("orders.searchPlaceholder", "搜索订单号、商品或邮箱")}
              className="ps-9 h-11 rounded-xl"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 h-11 rounded-xl text-sm font-medium whitespace-nowrap border transition-colors ${
                  filter === f.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:bg-secondary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            {t("orders.loading", "加载中...")}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg mb-1">
              {orders.length === 0
                ? t("orders.empty", "还没有订单")
                : t("orders.noResults", "没有匹配的订单")}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t("orders.emptyDesc", "立即选购您喜欢的数字服务")}
            </p>
            <Button onClick={() => navigate("/")} className="rounded-xl bg-gradient-brand text-white">
              {t("hero.browse")}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => (
              <div
                key={o.id}
                className="group bg-card border border-border rounded-2xl p-4 md:p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 ${o.product_color ?? "bg-blue-600"} rounded-lg flex items-center justify-center text-white text-xl font-bold shrink-0`}>
                    {o.product_initial ?? o.product_title[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold truncate">{o.product_title}</h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          statusStyles[o.status] ?? statusStyles.paid
                        }`}
                      >
                        {t(`order.status${o.status.charAt(0).toUpperCase()}${o.status.slice(1)}`, o.status)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                      <span className="font-mono" dir="ltr">{o.order_no}</span>
                      <span>{formatDateTime(o.placed_at)}</span>
                      <span>× <span dir="ltr">{o.quantity}</span></span>
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <div className="font-extrabold text-lg text-primary" dir="ltr">
                      {formatPrice(Number(o.total_usd))}
                    </div>
                    <div className="text-xs text-muted-foreground">{o.payment_method}</div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(o.id)}
                    className="text-destructive hover:text-destructive gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t("orders.delete", "删除")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/order/${o.order_no}`, { state: mapToDetailState(o) })}
                    className="gap-1"
                  >
                    {t("orders.viewDetail", "查看详情")}
                    <ChevronRight className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function mapToDetailState(o: OrderRow) {
  return {
    orderId: o.order_no,
    email: o.delivery_email ?? "",
    paymentMethod: o.payment_method ?? "",
    productTitle: o.product_title,
    productColor: o.product_color ?? "bg-blue-600",
    productInitial: o.product_initial ?? o.product_title[0],
    quantity: o.quantity,
    unitPriceUSD: Number(o.unit_price_usd),
    discountUSD: Number(o.discount_usd),
    feeUSD: Number(o.fee_usd),
    placedAt: new Date(o.placed_at).getTime(),
    status: o.status,
  };
}
