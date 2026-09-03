import { useTranslation } from "react-i18next";
import ProductCard from "./ProductCard";
import { Tv, Music, Gamepad2, Sparkles, Store, Wallet, Monitor, Grid3x3 } from "lucide-react";
import { useLiveProducts } from "@/hooks/useProductContent";

const categories = [
  { id: "all", icon: Grid3x3 },
  { id: "svod", icon: Tv },
  { id: "ai", icon: Sparkles },
  { id: "music", icon: Music },
  { id: "marketplace", icon: Store },
  { id: "topup", icon: Wallet },
  { id: "software", icon: Monitor },
  { id: "games", icon: Gamepad2 },
];

interface Props {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  searchQuery?: string;
}

export default function FeaturedProducts({ selectedCategory, onSelectCategory, searchQuery = "" }: Props) {
  const { t } = useTranslation();
  const products = useLiveProducts();
  const q = searchQuery.trim().toLowerCase();
  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchQuery = !q || p.titleKey.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    return matchCategory && matchQuery;
  });

  const badgeMap: Record<string, string> = {
    hot: t("products.badgeHot"),
    new: t("products.badgeNew"),
    recommend: t("products.badgeRecommend"),
  };

  return (
<section id="products" className="py-8 px-4 bg-secondary/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center space-y-4 mb-6">
          <h2 className="text-3xl md:text-4xl font-bold">{t("products.sectionTitle")}</h2>
          <p className="text-muted-foreground text-base md:text-lg">{t("products.sectionSubtitle")}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all border ${
                  active
                    ? "bg-gradient-brand text-white border-transparent shadow-medium scale-105"
                    : "bg-card text-foreground border-border hover:border-primary/50 hover:shadow-soft"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t(`category.${cat.id}`)}
              </button>
            );
          })}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            {t("products.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.titleKey}
                title={product.titleKey}
                price={product.price}
                originalPrice={product.originalPrice}
                color={product.color}
                badge={product.badge ? badgeMap[product.badge] ?? product.badge : undefined}
                imageUrl={product.imageUrl}
                subtitle={product.subtitle}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
