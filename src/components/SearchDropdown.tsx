import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, X, Clock } from "lucide-react";
import { categories } from "@/data/products";
import { useLiveProducts } from "@/hooks/useProductContent";

interface SearchDropdownProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: (value: string) => void;
  onClose: () => void;
}

const STORAGE_KEY = "recent_searches";

export default function SearchDropdown({ query, onQueryChange, onSearch, onClose }: SearchDropdownProps) {
  const { t, i18n } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");

  const isZh = i18n.language.startsWith("zh");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch {
      // ignore
    }
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const saveSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const next = [trimmed, ...prev.filter((s) => s !== trimmed)].slice(0, 8);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const clearRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSearch(query);
    onSearch(query);
    onClose();
  };

  const handleSelect = (title: string) => {
    saveSearch(title);
    onSearch(title);
    onClose();
  };

  const products = useLiveProducts();
  const filteredProducts = products.filter((p) => {
    const matchCategory = activeCategory === "all" || p.category === activeCategory;
    const matchQuery = !query.trim() || p.titleKey.toLowerCase().includes(query.trim().toLowerCase());
    return matchCategory && matchQuery;
  });

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50"
    >
      {/* Search input inside dropdown */}
      <form onSubmit={handleSubmit} className="p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t("nav.searchPlaceholder", "Search products...")}
            className="w-full pl-12 pr-10 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>

      <div className="max-h-[70vh] overflow-y-auto">
        {/* Recently searched */}
        {recentSearches.length > 0 && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>{t("search.recentlySearched", "Recently searched")}</span>
                {isZh && <span className="text-gray-400 font-normal">最近搜索过</span>}
              </div>
              <button
                onClick={clearRecent}
                className="text-xs text-red-500 hover:text-red-600 font-medium"
              >
                {t("search.clearAll", "Clear all")}
                {isZh && <span className="ml-1">清除所有内容</span>}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => handleSelect(term)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <span>{term}</span>
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category tabs */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors ${
                    active ? "text-gray-900 dark:text-white" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  }`}
                >
                  <span>{cat.label}</span>
                  {isZh && <span className={active ? "text-gray-500" : "text-gray-300"}>{cat.labelZh}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product list */}
        <div className="p-4 pt-0">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              {t("search.noResults", "No products found")}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredProducts.map((product, index) => (
                <Link
                  key={product.titleKey}
                  to={`/product/${encodeURIComponent(product.titleKey)}`}
                  onClick={() => handleSelect(product.titleKey)}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <span className="w-6 text-center text-sm font-bold text-gray-400 group-hover:text-primary transition-colors">
                    {index + 1}
                  </span>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm ${product.color}`}>
                    {product.titleKey.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {product.titleKey}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-500 text-white">
                    GoAifast
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
