import { useTranslation } from "react-i18next";
import { Tv, Music, Gamepad2, Sparkles, Store, Wallet, Monitor } from "lucide-react";
import { Button } from "./ui/button";

const categories = [
  { id: "svod", icon: Tv, color: "from-red-500 to-pink-500" },
  { id: "ai", icon: Sparkles, color: "from-emerald-500 to-teal-500" },
  { id: "music", icon: Music, color: "from-green-500 to-emerald-500" },
  { id: "marketplace", icon: Store, color: "from-yellow-500 to-orange-500" },
  { id: "topup", icon: Wallet, color: "from-indigo-500 to-blue-500" },
  { id: "software", icon: Monitor, color: "from-orange-500 to-amber-500" },
  { id: "games", icon: Gamepad2, color: "from-blue-500 to-cyan-500" },
];

interface Props {
  onSelectCategory: (id: string) => void;
}

export default function CategorySection({ onSelectCategory }: Props) {
  const { t } = useTranslation();

  const handleClick = (id: string) => {
    onSelectCategory(id);
    setTimeout(() => {
      document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">{t("category.title")}</h2>
          <p className="text-muted-foreground">{t("category.subtitle")}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant="outline"
              onClick={() => handleClick(category.id)}
              className="h-auto flex-col gap-3 p-6 hover:shadow-medium transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <category.icon className="w-6 h-6 text-white" />
              </div>
              <span className="font-medium">{t(`category.${category.id}`)}</span>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
