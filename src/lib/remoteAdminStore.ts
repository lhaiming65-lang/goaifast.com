import { supabase } from "@/integrations/supabase/client";
import {
  buildPublicStore,
  createSeedStore,
  saveAdminStore,
  PUBLIC_STORE_KEY,
  type AdminOrder,
  type AdminProduct,
  type AdminStore,
  type AnalyticsEvent,
  type Customer,
  type InventoryAccount,
  type IpPricingRule,
  type Operator,
  type Supplier,
  type Ticket,
} from "@/lib/adminStore";

const db = supabase as any;

export type RemoteSyncResult =
  | { ok: true; store?: AdminStore }
  | { ok: false; error: string };

function errorMessage(error: unknown) {
  if (!error) return "未知错误";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && "message" in error) return String((error as { message?: unknown }).message);
  return "未知错误";
}

function cachePublicStore(publicStore: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PUBLIC_STORE_KEY, JSON.stringify(publicStore));
  window.dispatchEvent(new CustomEvent("goaifast-store-updated", { detail: publicStore }));
}

const productFromRow = (row: any): AdminProduct => ({
  id: row.id,
  titleKey: row.title_key,
  category: row.category,
  price: Number(row.price_usd ?? 0),
  originalPrice: Number(row.original_price_usd ?? row.price_usd ?? 0),
  color: row.color,
  badge: row.badge || undefined,
  stock: Number(row.stock ?? 0),
  delivery: row.delivery || "",
  imageUrl: row.image_url || "",
  subtitle: row.subtitle || "",
  description: row.description || "",
  cost: Number(row.cost_usd ?? 0),
  status: row.status || "enabled",
  deliveryMode: row.delivery_mode || "mixed",
});

const productToRow = (product: AdminProduct, index: number) => ({
  id: product.id,
  title_key: product.titleKey,
  category: product.category,
  price_usd: product.price,
  original_price_usd: product.originalPrice,
  color: product.color,
  badge: product.badge ?? null,
  stock: product.stock ?? 0,
  delivery: product.delivery ?? "",
  image_url: product.imageUrl ?? "",
  subtitle: product.subtitle ?? "",
  description: product.description ?? "",
  cost_usd: product.cost,
  status: product.status,
  delivery_mode: product.deliveryMode,
  sort_order: index,
  updated_at: new Date().toISOString(),
});

const inventoryFromRow = (row: any): InventoryAccount => ({
  id: row.id,
  productId: row.product_id,
  account: row.account,
  password: row.password || "",
  vehicleId: row.vehicle_id || "",
  createdAt: row.created_at_text || "",
  assignedCustomer: row.assigned_customer || "",
  orderId: row.order_id || "",
  status: row.status || "available",
  expireAt: row.expire_at || "",
});

const inventoryToRow = (item: InventoryAccount) => ({
  id: item.id,
  product_id: item.productId,
  account: item.account,
  password: item.password ?? "",
  vehicle_id: item.vehicleId ?? "",
  created_at_text: item.createdAt ?? "",
  assigned_customer: item.assignedCustomer ?? "",
  order_id: item.orderId ?? "",
  status: item.status,
  expire_at: item.expireAt,
  updated_at: new Date().toISOString(),
});

const orderFromRow = (row: any): AdminOrder => ({
  id: row.id,
  productId: row.product_id,
  customer: row.customer_email,
  amount: Number(row.amount_usd ?? 0),
  status: row.status || "pending",
  createdAt: row.created_at_text || "",
});

const orderToRow = (order: AdminOrder) => ({
  id: order.id,
  product_id: order.productId,
  customer_email: order.customer,
  amount_usd: order.amount,
  status: order.status,
  created_at_text: order.createdAt,
  updated_at: new Date().toISOString(),
});

const ticketFromRow = (row: any): Ticket => ({
  id: row.id,
  orderId: row.order_id,
  customer: row.customer_email,
  topic: row.topic,
  status: row.status || "open",
});

const ticketToRow = (ticket: Ticket) => ({
  id: ticket.id,
  order_id: ticket.orderId,
  customer_email: ticket.customer,
  topic: ticket.topic,
  status: ticket.status,
  updated_at: new Date().toISOString(),
});

const supplierFromRow = (row: any): Supplier => ({
  id: row.id,
  name: row.name,
  productName: row.product_name,
  price: Number(row.price_usd ?? 0),
  stock: Number(row.stock ?? 0),
  status: row.status || "pending",
  submittedAt: row.submitted_at_text || "",
});

const supplierToRow = (supplier: Supplier) => ({
  id: supplier.id,
  name: supplier.name,
  product_name: supplier.productName,
  price_usd: supplier.price,
  stock: supplier.stock,
  status: supplier.status,
  submitted_at_text: supplier.submittedAt,
  updated_at: new Date().toISOString(),
});

const customerFromRow = (row: any): Customer => ({
  id: row.id,
  email: row.email,
  name: row.name || "",
  phone: row.phone || "",
  level: row.level || "普通",
  orders: Number(row.orders_count ?? 0),
  status: row.status || "active",
  balance: Number(row.balance_usd ?? 0),
  totalSpent: Number(row.total_spent_usd ?? 0),
  registeredAt: row.registered_at_text || "",
  lastLoginAt: row.last_login_at_text || "",
  source: row.source || "",
  riskTag: row.risk_tag || "normal",
  notes: row.notes || "",
});

const customerToRow = (customer: Customer) => ({
  id: customer.id,
  email: customer.email,
  name: customer.name ?? "",
  phone: customer.phone ?? "",
  level: customer.level,
  orders_count: customer.orders,
  status: customer.status,
  balance_usd: customer.balance ?? 0,
  total_spent_usd: customer.totalSpent ?? 0,
  registered_at_text: customer.registeredAt ?? "",
  last_login_at_text: customer.lastLoginAt ?? "",
  source: customer.source ?? "",
  risk_tag: customer.riskTag ?? "normal",
  notes: customer.notes ?? "",
  updated_at: new Date().toISOString(),
});

const operatorFromRow = (row: any): Operator => ({
  id: row.id,
  name: row.name,
  role: row.role,
  enabled: Boolean(row.enabled),
});

const operatorToRow = (operator: Operator) => ({
  id: operator.id,
  name: operator.name,
  role: operator.role,
  enabled: operator.enabled,
  updated_at: new Date().toISOString(),
});

const ipRuleFromRow = (row: any): IpPricingRule => ({
  id: row.id,
  name: row.name,
  enabled: Boolean(row.enabled),
  priority: Number(row.priority ?? 0),
  targetType: row.target_type,
  targetValue: row.target_value,
  productId: row.product_id,
  strategy: row.strategy,
  priceMode: row.price_mode,
  priceValue: Number(row.price_value ?? 0),
  originalPrice: row.original_price_usd === null ? undefined : Number(row.original_price_usd),
  minPrice: row.min_price_usd === null ? undefined : Number(row.min_price_usd),
  maxPrice: row.max_price_usd === null ? undefined : Number(row.max_price_usd),
  rounding: row.rounding || "none",
  currencyHint: row.currency_hint || "",
  startsAt: row.starts_at_text || "",
  endsAt: row.ends_at_text || "",
  disclosure: row.disclosure || "",
  riskLevel: row.risk_level || "normal",
  note: row.note || "",
});

const ipRuleToRow = (rule: IpPricingRule) => ({
  id: rule.id,
  name: rule.name,
  enabled: rule.enabled,
  priority: rule.priority,
  target_type: rule.targetType,
  target_value: rule.targetValue,
  product_id: rule.productId,
  strategy: rule.strategy,
  price_mode: rule.priceMode,
  price_value: rule.priceValue,
  original_price_usd: rule.originalPrice ?? null,
  min_price_usd: rule.minPrice ?? null,
  max_price_usd: rule.maxPrice ?? null,
  rounding: rule.rounding ?? "none",
  currency_hint: rule.currencyHint ?? "",
  starts_at_text: rule.startsAt ?? "",
  ends_at_text: rule.endsAt ?? "",
  disclosure: rule.disclosure ?? "",
  risk_level: rule.riskLevel ?? "normal",
  note: rule.note ?? "",
  updated_at: new Date().toISOString(),
});

const analyticsFromRow = (row: any): AnalyticsEvent => ({
  id: row.id,
  customerEmail: row.customer_email,
  customerName: row.customer_name || "",
  ip: row.ip,
  country: row.country,
  device: row.device,
  source: row.source,
  viewedProducts: Array.isArray(row.viewed_products) ? row.viewed_products : [],
  homeViews: Number(row.home_views ?? 0),
  productViews: Number(row.product_views ?? 0),
  checkoutAdds: Number(row.checkout_adds ?? 0),
  paidOrders: Number(row.paid_orders ?? 0),
  totalAmount: Number(row.total_amount_usd ?? 0),
  lastSeenAt: row.last_seen_at_text || "",
  status: row.status || "active",
  note: row.note || "",
});

const analyticsToRow = (event: AnalyticsEvent) => ({
  id: event.id,
  customer_email: event.customerEmail,
  customer_name: event.customerName ?? "",
  ip: event.ip,
  country: event.country,
  device: event.device,
  source: event.source,
  viewed_products: event.viewedProducts,
  home_views: event.homeViews,
  product_views: event.productViews,
  checkout_adds: event.checkoutAdds,
  paid_orders: event.paidOrders,
  total_amount_usd: event.totalAmount,
  last_seen_at_text: event.lastSeenAt,
  status: event.status,
  note: event.note ?? "",
  updated_at: new Date().toISOString(),
});

async function selectTable(table: string, order = "id") {
  const { data, error } = await db.from(table).select("*").order(order, { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function replaceTable(table: string, rows: unknown[]) {
  const { error: deleteError } = await db.from(table).delete().neq("id", "__never__");
  if (deleteError) throw deleteError;
  if (!rows.length) return;
  const { error: insertError } = await db.from(table).insert(rows);
  if (insertError) throw insertError;
}

function cacheStore(store: AdminStore) {
  saveAdminStore(store);
  cachePublicStore(buildPublicStore(store));
}

export async function loadRemotePublicStore() {
  try {
    const [productRows, ruleRows, settingsRows] = await Promise.all([
      selectTable("go_public_products", "sort_order"),
      selectTable("go_public_ip_pricing_rules", "priority"),
      selectTable("go_site_settings"),
    ]);
    const seed = createSeedStore();
    const store: AdminStore = {
      ...seed,
      products: productRows.map(productFromRow).filter((product: AdminProduct) => product.status === "enabled"),
      ipPricingRules: ruleRows.map(ipRuleFromRow).filter((rule: IpPricingRule) => rule.enabled),
      settings: settingsRows[0]?.settings_payload ?? seed.settings,
      updatedAt: settingsRows[0]?.updated_at ?? new Date().toISOString(),
    };
    const publicStore = buildPublicStore(store);
    cachePublicStore(publicStore);
    return { ok: true as const, publicStore };
  } catch (error) {
    return { ok: false as const, error: errorMessage(error) };
  }
}

export async function loadRemoteAdminStore(): Promise<RemoteSyncResult> {
  try {
    const [
      productRows,
      inventoryRows,
      orderRows,
      ticketRows,
      supplierRows,
      customerRows,
      operatorRows,
      ruleRows,
      analyticsRows,
      settingsRows,
    ] = await Promise.all([
      selectTable("go_products", "sort_order"),
      selectTable("go_inventory_accounts"),
      selectTable("go_admin_orders"),
      selectTable("go_tickets"),
      selectTable("go_suppliers"),
      selectTable("go_customers"),
      selectTable("go_admin_operators"),
      selectTable("go_ip_pricing_rules", "priority"),
      selectTable("go_analytics_events"),
      selectTable("go_site_settings"),
    ]);

    if (!productRows.length) return { ok: false, error: "数据库里还没有商品数据" };

    const seed = createSeedStore();
    const store: AdminStore = {
      products: productRows.map(productFromRow),
      inventory: inventoryRows.map(inventoryFromRow),
      orders: orderRows.map(orderFromRow),
      tickets: ticketRows.map(ticketFromRow),
      suppliers: supplierRows.map(supplierFromRow),
      customers: customerRows.map(customerFromRow),
      operators: operatorRows.map(operatorFromRow),
      ipPricingRules: ruleRows.map(ipRuleFromRow),
      analyticsEvents: analyticsRows.map(analyticsFromRow),
      settings: settingsRows[0]?.settings_payload ?? seed.settings,
      updatedAt: settingsRows[0]?.updated_at ?? new Date().toISOString(),
    };
    cacheStore(store);
    return { ok: true, store };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function saveRemoteAdminStore(store: AdminStore): Promise<RemoteSyncResult> {
  try {
    await replaceTable("go_products", store.products.map(productToRow));
    await replaceTable("go_inventory_accounts", store.inventory.map(inventoryToRow));
    await replaceTable("go_admin_orders", store.orders.map(orderToRow));
    await replaceTable("go_tickets", store.tickets.map(ticketToRow));
    await replaceTable("go_suppliers", store.suppliers.map(supplierToRow));
    await replaceTable("go_customers", store.customers.map(customerToRow));
    await replaceTable("go_admin_operators", store.operators.map(operatorToRow));
    await replaceTable("go_ip_pricing_rules", store.ipPricingRules.map(ipRuleToRow));
    await replaceTable("go_analytics_events", store.analyticsEvents.map(analyticsToRow));
    const { error } = await db.from("go_site_settings").upsert({
      id: "default",
      settings_payload: store.settings,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    cachePublicStore(buildPublicStore(store));
    return { ok: true, store };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}
