import { products as defaultProducts, categories, type Product, type ProductBadge } from "@/data/products";

export const ADMIN_STORE_KEY = "goaifast_react_admin_store_v1";
export const PUBLIC_STORE_KEY = "goaifast_public_store_v1";

export type ProductStatus = "enabled" | "disabled";
export type { ProductBadge };
export type OrderStatus = "pending" | "delivered" | "refund";
export type TicketStatus = "open" | "closed";
export type SupplierStatus = "pending" | "approved" | "rejected";
export type IpPriceTargetType = "ip" | "cidr" | "country" | "all";
export type IpPriceMode = "fixed" | "percent";

export interface AdminProduct extends Product {
  id: string;
  cost: number;
  status: ProductStatus;
  deliveryMode: "auto" | "manual" | "mixed";
}

export interface InventoryAccount {
  id: string;
  productId: string;
  account: string;
  status: "available" | "locked" | "used" | "banned";
  expireAt: string;
}

export interface AdminOrder {
  id: string;
  productId: string;
  customer: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
}

export interface Ticket {
  id: string;
  orderId: string;
  customer: string;
  topic: string;
  status: TicketStatus;
}

export interface Supplier {
  id: string;
  name: string;
  productName: string;
  price: number;
  stock: number;
  status: SupplierStatus;
  submittedAt: string;
}

export interface Customer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  level: "普通" | "VIP";
  orders: number;
  status: "active" | "banned";
  balance?: number;
  totalSpent?: number;
  registeredAt?: string;
  lastLoginAt?: string;
  source?: string;
  riskTag?: "normal" | "watch" | "high";
  notes?: string;
}

export interface Operator {
  id: string;
  name: string;
  role: string;
  enabled: boolean;
}

export interface IpPricingRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  targetType: IpPriceTargetType;
  targetValue: string;
  productId: string;
  priceMode: IpPriceMode;
  priceValue: number;
  originalPrice?: number;
  note?: string;
}

export interface AnalyticsEvent {
  id: string;
  customerEmail: string;
  customerName?: string;
  ip: string;
  country: string;
  device: string;
  source: string;
  viewedProducts: string[];
  homeViews: number;
  productViews: number;
  checkoutAdds: number;
  paidOrders: number;
  totalAmount: number;
  lastSeenAt: string;
  status: "active" | "converted" | "risk";
  note?: string;
}

export interface AdminStore {
  products: AdminProduct[];
  inventory: InventoryAccount[];
  orders: AdminOrder[];
  tickets: Ticket[];
  suppliers: Supplier[];
  customers: Customer[];
  operators: Operator[];
  ipPricingRules: IpPricingRule[];
  analyticsEvents: AnalyticsEvent[];
  settings: {
    siteName: string;
    announcement: string;
    autoDelivery: boolean;
    lowStockAlert: number;
  };
  updatedAt: string;
}

const categoryName: Record<string, string> = {
  svod: "流媒体",
  ai: "AI",
  music: "音乐",
  marketplace: "电商会员",
  topup: "充值卡",
  software: "软件",
  games: "游戏",
};

const productId = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const deliveryFor = (category: string) =>
  category === "topup" ? "卡密自动交付" : category === "ai" ? "账号/邀请链接交付" : "共享账号自动交付";

export const categoryOptions = categories.filter((cat) => cat.id !== "all");

export function createSeedStore(): AdminStore {
  const adminProducts = defaultProducts.map((product, index) => ({
    ...product,
    id: productId(product.titleKey),
    stock: 8 + ((index * 3) % 18),
    cost: Math.max(1, Math.round(product.price * 0.58 * 100) / 100),
    status: "enabled" as ProductStatus,
    deliveryMode: product.category === "topup" ? "auto" as const : "mixed" as const,
    delivery: `${categoryName[product.category] ?? "数字商品"} · ${deliveryFor(product.category)}`,
  }));

  return {
    products: adminProducts,
    inventory: adminProducts.slice(0, 10).map((product, index) => ({
      id: `ACC-${String(index + 1).padStart(4, "0")}`,
      productId: product.id,
      account: `${product.id}-${1000 + index}@goaifast.local`,
      status: index % 4 === 0 ? "locked" : "available",
      expireAt: `2026-${String(8 + (index % 4)).padStart(2, "0")}-${String(10 + index).padStart(2, "0")}`,
    })),
    orders: [
      { id: "GO-20260722-1001", productId: "netflix", customer: "mika@example.com", amount: 29.99, status: "pending", createdAt: "2026/7/22 10:00" },
      { id: "GO-20260722-1002", productId: "chatgpt-plus", customer: "chen@example.com", amount: 15.99, status: "delivered", createdAt: "2026/7/22 09:28" },
      { id: "GO-20260721-0918", productId: "spotify-premium", customer: "lee@example.com", amount: 19.99, status: "pending", createdAt: "2026/7/21 18:20" },
    ],
    tickets: [
      { id: "TK-1007", orderId: "GO-20260722-1002", customer: "chen@example.com", topic: "无法登录账号", status: "open" },
      { id: "TK-1006", orderId: "GO-20260721-0918", customer: "lee@example.com", topic: "请求延长售后", status: "closed" },
    ],
    suppliers: [
      { id: "SP-201", name: "广州账号池A", productName: "Netflix", price: 18.8, stock: 30, status: "pending", submittedAt: "2026/7/22 10:00" },
      { id: "SP-202", name: "AI资源供应B", productName: "Claude Pro", price: 9.2, stock: 16, status: "pending", submittedAt: "2026/7/21 18:20" },
    ],
    customers: [
      { id: "U-1001", email: "mika@example.com", name: "Mika", phone: "+1 415 000 1001", level: "VIP", orders: 8, status: "active", balance: 12.5, totalSpent: 268.8, registeredAt: "2026/6/18", lastLoginAt: "2026/7/22 09:40", source: "自然搜索", riskTag: "normal", notes: "高价值用户，优先售后。" },
      { id: "U-1002", email: "chen@example.com", name: "Chen", phone: "+86 138 0000 1002", level: "普通", orders: 2, status: "active", balance: 0, totalSpent: 45.98, registeredAt: "2026/7/2", lastLoginAt: "2026/7/21 21:12", source: "TikTok 广告", riskTag: "normal", notes: "偏好 AI 产品。" },
      { id: "U-1003", email: "risk@example.com", name: "Risk User", phone: "", level: "普通", orders: 1, status: "banned", balance: 0, totalSpent: 8.99, registeredAt: "2026/7/19", lastLoginAt: "2026/7/20 03:18", source: "优惠券", riskTag: "high", notes: "异常退款频繁，已禁用。" },
    ],
    operators: [
      { id: "ADM-1", name: "总管理员", role: "全部权限", enabled: true },
      { id: "ADM-2", name: "客服主管", role: "订单/工单", enabled: true },
    ],
    ipPricingRules: [
      {
        id: "IPR-1001",
        name: "美国访客 ChatGPT 价格",
        enabled: true,
        priority: 20,
        targetType: "country",
        targetValue: "US",
        productId: "chatgpt-plus",
        priceMode: "fixed",
        priceValue: 18.99,
        originalPrice: 29.99,
        note: "示例：美国 IP 访问时 ChatGPT Plus 显示独立价格。",
      },
      {
        id: "IPR-1002",
        name: "指定 IP 测试价",
        enabled: false,
        priority: 50,
        targetType: "ip",
        targetValue: "8.8.8.8",
        productId: "netflix",
        priceMode: "fixed",
        priceValue: 19.99,
        originalPrice: 49.99,
        note: "把 targetValue 改成客户真实 IP 后启用。",
      },
    ],
    analyticsEvents: [
      {
        id: "AN-1001",
        customerEmail: "mika@example.com",
        customerName: "Mika",
        ip: "104.28.12.88",
        country: "US",
        device: "iPhone / Safari",
        source: "自然搜索",
        viewedProducts: ["Netflix", "YouTube Premium", "ChatGPT Plus"],
        homeViews: 18,
        productViews: 12,
        checkoutAdds: 4,
        paidOrders: 3,
        totalAmount: 159.92,
        lastSeenAt: "2026/7/22 10:00",
        status: "converted",
        note: "高价值客户，常看流媒体和 AI 产品。",
      },
      {
        id: "AN-1002",
        customerEmail: "chen@example.com",
        customerName: "Chen",
        ip: "43.129.44.21",
        country: "CN",
        device: "Windows / Chrome",
        source: "TikTok 广告",
        viewedProducts: ["ChatGPT Plus", "Claude Pro"],
        homeViews: 9,
        productViews: 7,
        checkoutAdds: 2,
        paidOrders: 1,
        totalAmount: 39.98,
        lastSeenAt: "2026/7/22 09:28",
        status: "active",
        note: "AI 产品意向明显。",
      },
      {
        id: "AN-1003",
        customerEmail: "risk@example.com",
        customerName: "Risk User",
        ip: "185.220.101.42",
        country: "DE",
        device: "Android / Chrome",
        source: "优惠券",
        viewedProducts: ["Steam Wallet", "PSN Card", "Netflix"],
        homeViews: 32,
        productViews: 19,
        checkoutAdds: 6,
        paidOrders: 1,
        totalAmount: 19.99,
        lastSeenAt: "2026/7/20 03:18",
        status: "risk",
        note: "频繁切换 IP，退款较多。",
      },
    ],
    settings: {
      siteName: "GoAifast",
      announcement: "全站数字商品极速交付，售后问题优先处理。",
      autoDelivery: true,
      lowStockAlert: 5,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function buildPublicStore(store: AdminStore) {
  return {
    products: store.products
      .filter((product) => product.status === "enabled")
      .map(({ titleKey, price, originalPrice, color, badge, category, stock, delivery, imageUrl, subtitle, description }) => ({
        titleKey,
        price,
        originalPrice,
        color,
        badge,
        category,
        stock,
        delivery,
        imageUrl,
        subtitle,
        description,
    })),
    categories,
    ipPricingRules: store.ipPricingRules
      .filter((rule) => rule.enabled)
      .map(({ id, name, priority, targetType, targetValue, productId, priceMode, priceValue, originalPrice, note }) => ({
        id,
        name,
        priority,
        targetType,
        targetValue,
        productId,
        priceMode,
        priceValue,
        originalPrice,
        note,
      })),
    settings: store.settings,
    updatedAt: store.updatedAt,
  };
}

function normalizeStore(candidate: AdminStore): AdminStore {
  return {
    ...candidate,
    products: candidate.products.map((product) => ({
      ...product,
      id: product.id || productId(product.titleKey),
      status: product.status || "enabled",
      deliveryMode: product.deliveryMode || "mixed",
      cost: product.cost ?? Math.round(product.price * 0.58 * 100) / 100,
    })),
    customers: candidate.customers.map((customer) => ({
      ...customer,
      name: customer.name ?? customer.email.split("@")[0],
      phone: customer.phone ?? "",
      balance: customer.balance ?? 0,
      totalSpent: customer.totalSpent ?? customer.orders * 19.99,
      registeredAt: customer.registeredAt ?? "2026/7/1",
      lastLoginAt: customer.lastLoginAt ?? "2026/7/22 10:00",
      source: customer.source ?? "后台导入",
      riskTag: customer.riskTag ?? (customer.status === "banned" ? "high" : "normal"),
      notes: customer.notes ?? "",
    })),
    ipPricingRules: (candidate.ipPricingRules ?? []).map((rule) => ({
      ...rule,
      enabled: rule.enabled ?? true,
      priority: Number(rule.priority) || 0,
      targetType: rule.targetType || "ip",
      targetValue: rule.targetValue || "",
      productId: rule.productId || "all",
      priceMode: rule.priceMode || "fixed",
      priceValue: Number(rule.priceValue) || 0,
      originalPrice: rule.originalPrice ? Number(rule.originalPrice) : undefined,
    })),
    analyticsEvents: (candidate.analyticsEvents ?? []).map((event) => ({
      ...event,
      customerEmail: event.customerEmail || "guest@example.com",
      customerName: event.customerName ?? event.customerEmail?.split("@")[0],
      ip: event.ip || "0.0.0.0",
      country: event.country || "未知",
      device: event.device || "Unknown",
      source: event.source || "未知",
      viewedProducts: Array.isArray(event.viewedProducts) ? event.viewedProducts : [],
      homeViews: Number(event.homeViews) || 0,
      productViews: Number(event.productViews) || 0,
      checkoutAdds: Number(event.checkoutAdds) || 0,
      paidOrders: Number(event.paidOrders) || 0,
      totalAmount: Number(event.totalAmount) || 0,
      lastSeenAt: event.lastSeenAt || new Date().toLocaleString(),
      status: event.status || "active",
      note: event.note ?? "",
    })),
    updatedAt: candidate.updatedAt || new Date().toISOString(),
  };
}

export function saveAdminStore(store: AdminStore): AdminStore {
  const next = { ...store, updatedAt: new Date().toISOString() };
  localStorage.setItem(ADMIN_STORE_KEY, JSON.stringify(next));
  localStorage.setItem(PUBLIC_STORE_KEY, JSON.stringify(buildPublicStore(next)));
  window.dispatchEvent(new CustomEvent("goaifast-store-updated", { detail: next }));
  return next;
}

export function loadAdminStore(): AdminStore {
  if (typeof window === "undefined") return createSeedStore();
  const raw = localStorage.getItem(ADMIN_STORE_KEY);
  if (raw) {
    try {
      const parsed = normalizeStore(JSON.parse(raw));
      localStorage.setItem(PUBLIC_STORE_KEY, JSON.stringify(buildPublicStore(parsed)));
      return parsed;
    } catch {
      // Seed a clean demo store if local demo data was manually corrupted.
    }
  }
  return saveAdminStore(createSeedStore());
}

export function loadPublicProducts(): Product[] {
  if (typeof window === "undefined") return defaultProducts;
  const raw = localStorage.getItem(PUBLIC_STORE_KEY);
  if (!raw) {
    return buildPublicStore(loadAdminStore()).products as Product[];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.products)) return defaultProducts;
    return parsed.products
      .map((product: Product & { name?: string; status?: string }) => {
        const titleKey = product.titleKey || product.name || "Untitled";
        const fallback = defaultProducts.find((item) => item.titleKey === titleKey);
        const price = Number(product.price) || fallback?.price || 0;
        return {
          titleKey,
          price,
          originalPrice: Number(product.originalPrice) || fallback?.originalPrice || Math.max(price, 1),
          color: product.color || fallback?.color || "bg-gradient-to-br from-orange-500 to-rose-600",
          badge: product.badge || fallback?.badge,
          category: product.category || fallback?.category || "ai",
          stock: product.stock ?? fallback?.stock,
          delivery: product.delivery ?? fallback?.delivery,
          imageUrl: product.imageUrl ?? fallback?.imageUrl,
          subtitle: product.subtitle ?? fallback?.subtitle,
          description: product.description ?? fallback?.description,
        };
      })
      .filter((product: Product) => product.titleKey && product.titleKey !== "Untitled");
  } catch {
    return defaultProducts;
  }
}

export function productTitle(store: AdminStore, productIdValue: string) {
  return store.products.find((product) => product.id === productIdValue)?.titleKey ?? productIdValue;
}

export function cycleBadge(badge?: ProductBadge): ProductBadge | undefined {
  if (!badge) return "hot";
  if (badge === "hot") return "new";
  if (badge === "new") return "recommend";
  return undefined;
}
