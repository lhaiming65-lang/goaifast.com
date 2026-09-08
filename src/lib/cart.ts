import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { commerce } from "@/lib/commerce";

export interface CartLine { product_id: string; quantity: number }
export interface CatalogProduct {
  id: string; slug: string; title: string; price_cents: number; available_stock: number;
  image_url?: string; color?: string; subtitle?: string; detail_description?: string;
  delivery_rules?: string; delivery_method?: string; warranty_days: number;
  auto_replace: boolean; max_replacements: number; original_price?: number;
}
export interface CommerceOrder {
  id: string; order_number: string; status: string; total_cents: number; currency: string;
  payment_method: string; created_at: string; expires_at?: string; delivered_at?: string;
  delivery_email?: string; items?: OrderItem[];
}
export interface OrderItem {
  id: string; product_id: string; title: string; quantity: number; unit_price_cents: number;
  warranty_days: number; auto_replace: boolean; max_replacements: number; replacement_count: number;
}
export interface SupportTicket {
  id: string; order_id: string; item_id?: string; kind: string; status: string; subject: string;
  created_at: string; messages: { id: string; author_id?: string; body: string; created_at: string }[];
}
export interface OrderSnapshot {
  order: CommerceOrder;
  items: OrderItem[];
  deliveries: { id: string; item_id: string; secret: unknown; generation: number; status?: string; created_at: string }[];
  events: { id: string; event_type?: string; type?: string; message?: string; created_at: string }[];
  tickets: SupportTicket[];
  payments: { id: string; status: string; amount_cents: number; created_at: string; provider_session_id?: string; checkout_claimed_at?: string }[];
  refunds: { id: string; status: string; amount_cents: number; reason?: string; created_at: string }[];
}

const CART_KEY = "goaifast-cart-v1";
const CART_EVENT = "goaifast-cart-changed";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Store SKU identifiers and quantities only. Prices and stock always come from the server. */
export function readCart(): CartLine[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(value)) return [];
    const quantities = new Map<string, number>();
    for (const entry of value.slice(0, 100)) {
      if (!entry || typeof entry !== "object") continue;
      const row = entry as Record<string, unknown>;
      if (typeof row.product_id !== "string" || !uuidPattern.test(row.product_id) ||
          typeof row.quantity !== "number" || !Number.isInteger(row.quantity) || row.quantity < 1) continue;
      quantities.set(row.product_id, Math.min(99, (quantities.get(row.product_id) || 0) + row.quantity));
    }
    return Array.from(quantities, ([product_id, quantity]) => ({ product_id, quantity }));
  } catch { return []; }
}

function saveCart(lines: CartLine[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event(CART_EVENT));
}

export function addToCart(productId: string, quantity = 1) {
  if (!uuidPattern.test(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new Error("请选择有效商品和 1–99 件商品数量");
  }
  const lines = readCart();
  const existing = lines.find((line) => line.product_id === productId);
  if (!existing && lines.length >= 50) throw new Error("每单最多购买 50 种商品，请先结算当前购物车");
  if (lines.reduce((sum, line) => sum + line.quantity, 0) + quantity > 100) throw new Error("每单最多购买 100 件商品，请分单结算");
  if ((existing?.quantity || 0) + quantity > 99) throw new Error("单个商品最多购买 99 件");
  if (existing) existing.quantity += quantity;
  else lines.push({ product_id: productId, quantity });
  saveCart(lines);
}

export function updateCartQuantity(productId: string, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) return;
  saveCart(readCart().flatMap((line) => line.product_id === productId
    ? quantity ? [{ ...line, quantity }] : [] : [line]));
}

export function clearCart() { saveCart([]); }

/** Preserve items added in another tab while this checkout was being submitted. */
export function removePurchasedItems(purchased: CartLine[]) {
  saveCart(readCart().flatMap((line) => {
    const quantity = line.quantity - (purchased.find((item) => item.product_id === line.product_id)?.quantity || 0);
    return quantity > 0 ? [{ ...line, quantity }] : [];
  }));
}

export function useCart() {
  const [lines, setLines] = useState(readCart);
  useEffect(() => {
    const refresh = () => setLines(readCart());
    window.addEventListener(CART_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CART_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return lines;
}

export function useCatalog() {
  return useQuery({
    queryKey: ["commerce-catalog"],
    queryFn: () => commerce<{ products: CatalogProduct[] }>("catalog"),
    staleTime: 30_000,
    retry: false,
  });
}

export const commerceDate = (value?: string) => value
  ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "—";
