import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { products as baseProducts } from "@/data/products";

export interface HighlightItem {
  icon?: string;
  bg?: string;
  kicker: string;
  title: string;
  body: string;
}

export interface FeatureItem {
  icon?: string;
  title: string;
  body: string;
}

export interface ScoreItem {
  label: string;
  score: number;
  desc: string;
}

export interface ReviewItem {
  name: string;
  country: string;
  text: string;
}

export interface SubscriptionType {
  label: string;
  note?: string;
  price_delta?: number;
}

export interface UsageItem {
  title: string;
  body: string;
}

export interface ProductContent {
  id?: string;
  slug: string;
  title: string;
  monthly_price: number;
  original_price: number;
  month_options: number[];
  subscription_types: SubscriptionType[];
  description: string;
  intro_badge: string;
  intro_body: string;
  how_it_works_title: string;
  usage_title: string;
  usage_guide: UsageItem[];
  big_headline: string;
  big_sub: string;
  features: string[];
  how_it_works: string[];
  highlights: HighlightItem[];
  feature_grid: FeatureItem[];
  overall_score: number;
  scores: ScoreItem[];
  pros: string[];
  cons: string[];
  reviews: ReviewItem[];
}

function normalize(row: Record<string, unknown>): ProductContent {
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: (row.title as string) ?? "",
    monthly_price: Number(row.monthly_price ?? 0),
    original_price: Number(row.original_price ?? 0),
    month_options: arr<number>(row.month_options),
    subscription_types: arr<SubscriptionType>(row.subscription_types),
    description: (row.description as string) ?? "",
    intro_badge: (row.intro_badge as string) ?? "",
    intro_body: (row.intro_body as string) ?? "",
    how_it_works_title: (row.how_it_works_title as string) ?? "",
    usage_title: (row.usage_title as string) ?? "",
    usage_guide: arr<UsageItem>(row.usage_guide),
    big_headline: (row.big_headline as string) ?? "",
    big_sub: (row.big_sub as string) ?? "",
    features: arr<string>(row.features),
    how_it_works: arr<string>(row.how_it_works),
    highlights: arr<HighlightItem>(row.highlights),
    feature_grid: arr<FeatureItem>(row.feature_grid),
    overall_score: Number(row.overall_score ?? 4.6),
    scores: arr<ScoreItem>(row.scores),
    pros: arr<string>(row.pros),
    cons: arr<string>(row.cons),
    reviews: arr<ReviewItem>(row.reviews),
  };
}

/** Live product detail content for a slug, kept in sync via realtime. */
export function useProductContent(slug?: string) {
  const [content, setContent] = useState<ProductContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    let active = true;

    const load = async () => {
      const { data } = await supabase
        .from("product_details")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (!active) return;
      setContent(data ? normalize(data as Record<string, unknown>) : null);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel(`product_details:${slug}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_details", filter: `slug=eq.${slug}` },
        (payload) => {
          if (payload.eventType === "DELETE") setContent(null);
          else setContent(normalize(payload.new as Record<string, unknown>));
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [slug]);

  return { content, loading };
}

/** True when the signed-in user has the admin role. */
export function useIsAdmin(userId?: string) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      setChecking(false);
      return;
    }
    let active = true;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setIsAdmin(!!data);
        setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  return { isAdmin, checking };
}

/** All product overrides, keyed by slug, kept in sync via realtime. */
export function useProductOverrides() {
  const [overrides, setOverrides] = useState<Record<string, ProductContent>>({});

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data } = await supabase.from("product_details").select("*");
      if (!active) return;
      const map: Record<string, ProductContent> = {};
      (data ?? []).forEach((row) => {
        const c = normalize(row as Record<string, unknown>);
        map[c.slug] = c;
      });
      setOverrides(map);
    };
    load();

    const channel = supabase
      .channel("product_details:all")
      .on("postgres_changes", { event: "*", schema: "public", table: "product_details" }, () => load())
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return overrides;
}

export interface StoreProduct {
  titleKey: string;
  price: number;
  originalPrice: number;
  color: string;
  badge?: string;
  category: string;
  imageUrl?: string;
  subtitle?: string;
  stock?: number;
}

export interface StoreProductRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  price: number;
  original_price: number;
  cost: number;
  stock: number;
  badge: string;
  status: string;
  delivery_method: string;
  subtitle: string;
  delivery_rules: string;
  detail_description: string;
  color: string;
  image_url: string;
}

/** SKU rows from the admin-managed store_products table, realtime-synced. */
export function useStoreProducts(): StoreProductRow[] {
  const [rows, setRows] = useState<StoreProductRow[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase.from("store_products").select("*").order("created_at");
      if (active) setRows((data ?? []) as unknown as StoreProductRow[]);
    };
    load();

    const channel = supabase
      .channel("store_products:all")
      .on("postgres_changes", { event: "*", schema: "public", table: "store_products" }, () => load())
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return rows;
}

/** Static catalog merged with live admin overrides and admin-created SKUs. */
export function useLiveProducts(): StoreProduct[] {
  const overrides = useProductOverrides();
  const storeRows = useStoreProducts();
  return useMemo(() => {
    const bySlug = new Map(storeRows.map((r) => [r.slug, r]));
    const merged = baseProducts.map((p) => {
      const r = bySlug.get(p.titleKey);
      const o = overrides[p.titleKey];
      if (!r && !o) return p as StoreProduct;
      return {
        ...p,
        price: r?.price ?? (o && o.monthly_price > 0 ? o.monthly_price : p.price),
        originalPrice: r?.original_price ?? (o && o.original_price > 0 ? o.original_price : p.originalPrice),
        color: r?.color || p.color,
        badge: r ? r.badge || undefined : p.badge,
        category: r?.category || p.category,
        imageUrl: r?.image_url || undefined,
        subtitle: r?.subtitle || undefined,
        stock: r?.stock,
      } as StoreProduct;
    });
    const staticKeys = new Set(baseProducts.map((p) => p.titleKey));
    const extra = storeRows
      .filter((r) => r.status === "active" && !staticKeys.has(r.slug))
      .map(
        (r): StoreProduct => ({
          titleKey: r.slug,
          price: r.price,
          originalPrice: r.original_price,
          color: r.color || "bg-gradient-to-br from-blue-500 to-indigo-600",
          badge: r.badge || undefined,
          category: r.category || "svod",
          imageUrl: r.image_url || undefined,
          subtitle: r.subtitle || undefined,
          stock: r.stock,
        }),
      );
    return [...merged.filter((p) => {
      const r = bySlug.get(p.titleKey);
      return !r || r.status === "active";
    }), ...extra];
  }, [overrides, storeRows]);
}
