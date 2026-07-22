import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Edit3,
  Headphones,
  Image as ImageIcon,
  LayoutDashboard,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Save,
  Store,
  Truck,
  Upload,
  Users,
  X,
  XCircle,
} from "lucide-react";
import {
  categoryOptions,
  cycleBadge,
  loadAdminStore,
  productTitle,
  saveAdminStore,
  type AdminProduct,
  type AdminOrder,
  type AdminStore,
  type Customer,
  type InventoryAccount,
  type IpPricingRule,
  type Operator,
  type ProductBadge,
  type Supplier,
  type Ticket,
} from "@/lib/adminStore";

const menu = [
  { id: "dashboard", label: "数据看板", icon: LayoutDashboard },
  { id: "products", label: "商品与定价", icon: Store },
  { id: "ip-pricing", label: "IP 定价", icon: SlidersHorizontal },
  { id: "inventory", label: "库存账号池", icon: PackageCheck },
  { id: "orders", label: "订单管理", icon: ClipboardList },
  { id: "tickets", label: "客服工单", icon: Headphones },
  { id: "suppliers", label: "供应商审核", icon: ShieldCheck },
  { id: "users", label: "用户管理", icon: Users },
  { id: "analytics", label: "数据埋点", icon: BarChart3 },
  { id: "settings", label: "站点设置", icon: Settings },
  { id: "admins", label: "管理员管理", icon: SlidersHorizontal },
];

const statusText: Record<string, string> = {
  enabled: "上架",
  disabled: "下架",
  available: "可交付",
  locked: "锁定",
  used: "已交付",
  banned: "禁用",
  pending: "待处理",
  delivered: "已交付",
  refund: "已退款",
  open: "处理中",
  closed: "已关闭",
  approved: "已通过",
  rejected: "已驳回",
  active: "正常",
};

const statusClass = (status: string) => {
  if (["enabled", "available", "delivered", "closed", "approved", "active"].includes(status)) return "bg-emerald-50 text-emerald-700";
  if (["pending", "locked", "open"].includes(status)) return "bg-amber-50 text-amber-700";
  return "bg-rose-50 text-rose-700";
};

function StatCard({ title, value, sub, icon: Icon }: { title: string; value: string; sub: string; icon: typeof Activity }) {
  return (
    <div className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{sub}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Badge({ status }: { status: string }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(status)}`}>{statusText[status] ?? status}</span>;
}

type ProductFormState = {
  id?: string;
  titleKey: string;
  category: string;
  price: string;
  originalPrice: string;
  cost: string;
  stock: string;
  badge: "" | ProductBadge;
  status: "enabled" | "disabled";
  deliveryMode: AdminProduct["deliveryMode"];
  delivery: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  color: string;
};

type InventoryFormState = InventoryAccount;
type OrderFormState = Omit<AdminOrder, "amount"> & { amount: string };
type TicketFormState = Ticket;
type SupplierFormState = Omit<Supplier, "price" | "stock"> & { price: string; stock: string };
type CustomerFormState = Customer;
type OperatorFormState = Operator;
type IpPricingFormState = Omit<IpPricingRule, "priority" | "priceValue" | "originalPrice"> & {
  priority: string;
  priceValue: string;
  originalPrice: string;
};
type LevelFormState = {
  customerId: string;
  email: string;
  name: string;
  currentLevel: Customer["level"];
  nextLevel: Customer["level"];
  effectiveAt: string;
  reason: string;
  internalNote: string;
};
type ActionKind =
  | "inventory-release"
  | "inventory-ban"
  | "order-deliver"
  | "order-refund"
  | "order-batch-deliver"
  | "ticket-close"
  | "supplier-approve"
  | "supplier-reject"
  | "customer-status"
  | "customer-risk"
  | "settings-auto-delivery"
  | "operator-toggle";
type ActionFormState = {
  kind: ActionKind;
  targetId: string;
  title: string;
  targetName: string;
  currentState: string;
  nextState: string;
  rule: string;
  impact: string;
  operator: string;
  reason: string;
  note: string;
  effectiveAt: string;
};

const gradientOptions = [
  "bg-gradient-to-br from-orange-500 to-rose-600",
  "bg-gradient-to-br from-red-600 to-red-800",
  "bg-gradient-to-br from-blue-500 to-indigo-700",
  "bg-gradient-to-br from-emerald-500 to-teal-700",
  "bg-gradient-to-br from-purple-600 to-fuchsia-700",
  "bg-gradient-to-br from-slate-700 to-slate-950",
];

const makeProductId = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `product-${Date.now()}`;

const levelDetails: Record<Customer["level"], { title: string; discount: string; service: string; limit: string; benefits: string[]; condition: string }> = {
  普通: {
    title: "普通用户",
    discount: "无固定折扣",
    service: "标准客服队列",
    limit: "按商品规则下单",
    benefits: ["可购买全部上架商品", "基础售后保障", "订单与工单记录保留"],
    condition: "注册后默认等级，适合普通零散购买用户。",
  },
  VIP: {
    title: "VIP 用户",
    discount: "可配置专属优惠",
    service: "优先客服处理",
    limit: "支持更高频订单与人工优先交付",
    benefits: ["优先处理订单和售后", "可开放专属商品或优惠券", "异常订单优先复核", "适合高消费或复购客户"],
    condition: "建议累计消费、复购次数或人工审核通过后升级。",
  },
};

const productToForm = (product?: AdminProduct): ProductFormState => ({
  id: product?.id,
  titleKey: product?.titleKey ?? "",
  category: product?.category ?? "ai",
  price: String(product?.price ?? ""),
  originalPrice: String(product?.originalPrice ?? ""),
  cost: String(product?.cost ?? ""),
  stock: String(product?.stock ?? 0),
  badge: product?.badge ?? "",
  status: product?.status ?? "enabled",
  deliveryMode: product?.deliveryMode ?? "mixed",
  delivery: product?.delivery ?? "",
  subtitle: product?.subtitle ?? "",
  description: product?.description ?? "",
  imageUrl: product?.imageUrl ?? "",
  color: product?.color ?? gradientOptions[0],
});

export default function Admin() {
  const [store, setStore] = useState<AdminStore>(() => loadAdminStore());
  const [active, setActive] = useState("dashboard");
  const [query, setQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [userLevelFilter, setUserLevelFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [notice, setNotice] = useState("后台已连接前台数据");
  const [productForm, setProductForm] = useState<ProductFormState | null>(null);
  const [inventoryForm, setInventoryForm] = useState<InventoryFormState | null>(null);
  const [orderForm, setOrderForm] = useState<OrderFormState | null>(null);
  const [ticketForm, setTicketForm] = useState<TicketFormState | null>(null);
  const [supplierForm, setSupplierForm] = useState<SupplierFormState | null>(null);
  const [customerForm, setCustomerForm] = useState<CustomerFormState | null>(null);
  const [operatorForm, setOperatorForm] = useState<OperatorFormState | null>(null);
  const [ipPricingForm, setIpPricingForm] = useState<IpPricingFormState | null>(null);
  const [levelForm, setLevelForm] = useState<LevelFormState | null>(null);
  const [actionForm, setActionForm] = useState<ActionFormState | null>(null);

  const commit = (next: AdminStore, message: string) => {
    setStore(saveAdminStore(next));
    setNotice(message);
  };

  const metrics = useMemo(() => {
    const revenue = store.orders.reduce((sum, order) => order.status !== "refund" ? sum + order.amount : sum, 0);
    const cost = store.products.reduce((sum, product) => sum + product.cost * Math.min(product.stock ?? 0, 3), 0);
    return {
      revenue,
      pendingOrders: store.orders.filter((order) => order.status === "pending").length,
      stock: store.products.reduce((sum, product) => sum + (product.stock ?? 0), 0),
      profit: revenue - cost * 0.08,
    };
  }, [store]);

  const filteredProducts = store.products.filter((product) => product.titleKey.toLowerCase().includes(query.trim().toLowerCase()));
  const filteredCustomers = store.customers.filter((customer) => {
    const q = userQuery.trim().toLowerCase();
    const matchQuery = !q || [customer.email, customer.name, customer.phone, customer.source, customer.notes].some((value) => (value ?? "").toLowerCase().includes(q));
    const matchLevel = userLevelFilter === "all" || customer.level === userLevelFilter;
    const matchStatus = userStatusFilter === "all" || customer.status === userStatusFilter;
    return matchQuery && matchLevel && matchStatus;
  });
  const userStats = {
    total: store.customers.length,
    vip: store.customers.filter((customer) => customer.level === "VIP").length,
    active: store.customers.filter((customer) => customer.status === "active").length,
    risk: store.customers.filter((customer) => customer.riskTag === "high" || customer.status === "banned").length,
    spent: store.customers.reduce((sum, customer) => sum + (customer.totalSpent ?? 0), 0),
  };

  const updateProduct = (id: string, patch: Partial<AdminStore["products"][number]>, message: string) => {
    commit({ ...store, products: store.products.map((product) => product.id === id ? { ...product, ...patch } : product) }, message);
  };

  const openProductModal = (product?: AdminProduct) => setProductForm(productToForm(product));

  const saveProductForm = () => {
    if (!productForm) return;
    const titleKey = productForm.titleKey.trim();
    if (!titleKey) {
      setNotice("请先填写商品名称");
      return;
    }
    const price = Number(productForm.price);
    const originalPrice = Number(productForm.originalPrice);
    const cost = Number(productForm.cost);
    const stock = Number(productForm.stock);
    if (![price, originalPrice, cost, stock].every(Number.isFinite)) {
      setNotice("价格、成本和库存需要填写数字");
      return;
    }
    const id = productForm.id || makeProductId(titleKey);
    const nextProduct: AdminProduct = {
      id,
      titleKey,
      category: productForm.category,
      price,
      originalPrice,
      cost,
      stock,
      badge: productForm.badge || undefined,
      status: productForm.status,
      deliveryMode: productForm.deliveryMode,
      delivery: productForm.delivery.trim(),
      subtitle: productForm.subtitle.trim(),
      description: productForm.description.trim(),
      imageUrl: productForm.imageUrl.trim(),
      color: productForm.color,
    };
    const exists = store.products.some((product) => product.id === id);
    commit({
      ...store,
      products: exists
        ? store.products.map((product) => product.id === id ? nextProduct : product)
        : [nextProduct, ...store.products],
    }, exists ? "商品明细已保存，前台已同步" : "新商品已创建，前台已同步");
    setProductForm(null);
  };

  const handleProductImage = (file?: File) => {
    if (!file || !productForm) return;
    const reader = new FileReader();
    reader.onload = () => setProductForm({ ...productForm, imageUrl: String(reader.result || "") });
    reader.readAsDataURL(file);
  };

  const openInventoryModal = (item?: InventoryAccount) => {
    setInventoryForm(item ?? {
      id: `ACC-${Date.now().toString().slice(-5)}`,
      productId: store.products[0]?.id ?? "",
      account: "",
      status: "available",
      expireAt: "2026-12-31",
    });
  };

  const saveInventoryForm = () => {
    if (!inventoryForm?.productId || !inventoryForm.account.trim()) {
      setNotice("请填写库存账号和对应商品");
      return;
    }
    const exists = store.inventory.some((item) => item.id === inventoryForm.id);
    commit({
      ...store,
      inventory: exists
        ? store.inventory.map((item) => item.id === inventoryForm.id ? inventoryForm : item)
        : [inventoryForm, ...store.inventory],
    }, exists ? "库存账号已保存" : "库存账号已新增");
    setInventoryForm(null);
  };

  const openOrderModal = (order?: AdminOrder) => {
    setOrderForm(order ? { ...order, amount: String(order.amount) } : {
      id: `GO-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString().slice(-4)}`,
      productId: store.products[0]?.id ?? "",
      customer: "",
      amount: "",
      status: "pending",
      createdAt: new Date().toLocaleString(),
    });
  };

  const saveOrderForm = () => {
    if (!orderForm?.productId || !orderForm.customer.trim()) {
      setNotice("请填写订单用户和商品");
      return;
    }
    const amount = Number(orderForm.amount);
    if (!Number.isFinite(amount)) {
      setNotice("订单金额需要填写数字");
      return;
    }
    const nextOrder: AdminOrder = { ...orderForm, amount };
    const exists = store.orders.some((order) => order.id === nextOrder.id);
    commit({
      ...store,
      orders: exists ? store.orders.map((order) => order.id === nextOrder.id ? nextOrder : order) : [nextOrder, ...store.orders],
    }, exists ? "订单明细已保存" : "测试订单已新增");
    setOrderForm(null);
  };

  const openTicketModal = (ticket?: Ticket) => {
    setTicketForm(ticket ?? {
      id: `TK-${Date.now().toString().slice(-5)}`,
      orderId: store.orders[0]?.id ?? "",
      customer: store.orders[0]?.customer ?? "",
      topic: "",
      status: "open",
    });
  };

  const saveTicketForm = () => {
    if (!ticketForm?.topic.trim()) {
      setNotice("请填写工单问题");
      return;
    }
    const exists = store.tickets.some((ticket) => ticket.id === ticketForm.id);
    commit({
      ...store,
      tickets: exists ? store.tickets.map((ticket) => ticket.id === ticketForm.id ? ticketForm : ticket) : [ticketForm, ...store.tickets],
    }, exists ? "工单已保存" : "测试工单已新增");
    setTicketForm(null);
  };

  const openSupplierModal = (supplier?: Supplier) => {
    setSupplierForm(supplier ? { ...supplier, price: String(supplier.price), stock: String(supplier.stock) } : {
      id: `SP-${Date.now().toString().slice(-5)}`,
      name: "",
      productName: store.products[0]?.titleKey ?? "",
      price: "",
      stock: "",
      status: "pending",
      submittedAt: new Date().toLocaleString(),
    });
  };

  const saveSupplierForm = () => {
    if (!supplierForm?.name.trim() || !supplierForm.productName.trim()) {
      setNotice("请填写供应商名称和商品");
      return;
    }
    const price = Number(supplierForm.price);
    const stock = Number(supplierForm.stock);
    if (![price, stock].every(Number.isFinite)) {
      setNotice("供应价和库存需要填写数字");
      return;
    }
    const nextSupplier: Supplier = { ...supplierForm, price, stock };
    const exists = store.suppliers.some((supplier) => supplier.id === nextSupplier.id);
    commit({
      ...store,
      suppliers: exists ? store.suppliers.map((supplier) => supplier.id === nextSupplier.id ? nextSupplier : supplier) : [nextSupplier, ...store.suppliers],
    }, exists ? "供应商信息已保存" : "供应商申请已新增");
    setSupplierForm(null);
  };

  const openCustomerModal = (customer?: Customer) => {
    setCustomerForm(customer ?? {
      id: `U-${Date.now().toString().slice(-5)}`,
      email: "",
      name: "",
      phone: "",
      level: "普通",
      orders: 0,
      status: "active",
      balance: 0,
      totalSpent: 0,
      registeredAt: new Date().toLocaleDateString(),
      lastLoginAt: new Date().toLocaleString(),
      source: "后台新增",
      riskTag: "normal",
      notes: "",
    });
  };

  const saveCustomerForm = () => {
    if (!customerForm?.email.trim()) {
      setNotice("请填写用户邮箱");
      return;
    }
    const exists = store.customers.some((customer) => customer.id === customerForm.id);
    commit({
      ...store,
      customers: exists ? store.customers.map((customer) => customer.id === customerForm.id ? customerForm : customer) : [customerForm, ...store.customers],
    }, exists ? "用户信息已保存" : "测试用户已新增");
    setCustomerForm(null);
  };

  const openLevelModal = (customer: Customer) => {
    setLevelForm({
      customerId: customer.id,
      email: customer.email,
      name: customer.name || customer.email,
      currentLevel: customer.level,
      nextLevel: customer.level === "VIP" ? "普通" : "VIP",
      effectiveAt: new Date().toLocaleString(),
      reason: "",
      internalNote: customer.notes ?? "",
    });
  };

  const saveLevelForm = () => {
    if (!levelForm) return;
    const detail = levelDetails[levelForm.nextLevel];
    const reasonText = levelForm.reason.trim() || "后台手动调整";
    commit({
      ...store,
      customers: store.customers.map((customer) => {
        if (customer.id !== levelForm.customerId) return customer;
        const history = `等级变更：${levelForm.currentLevel} -> ${levelForm.nextLevel}；时间：${levelForm.effectiveAt}；原因：${reasonText}`;
        return {
          ...customer,
          level: levelForm.nextLevel,
          notes: [levelForm.internalNote.trim(), history, `当前等级权益：${detail.title}，${detail.service}，${detail.discount}`].filter(Boolean).join("\n"),
        };
      }),
    }, "用户等级已更新");
    setLevelForm(null);
  };

  const openActionModal = (action: Omit<ActionFormState, "operator" | "reason" | "note" | "effectiveAt">) => {
    setActionForm({
      ...action,
      operator: "当前管理员",
      reason: "",
      note: "",
      effectiveAt: new Date().toLocaleString(),
    });
  };

  const saveActionForm = () => {
    if (!actionForm) return;
    const actionLog = `操作记录：${actionForm.title}；对象：${actionForm.targetName}；${actionForm.currentState} -> ${actionForm.nextState}；时间：${actionForm.effectiveAt}；原因：${actionForm.reason.trim() || "后台确认"}；备注：${actionForm.note.trim() || "无"}`;
    let nextStore: AdminStore = store;
    let message = "操作已保存";

    if (actionForm.kind === "inventory-release" || actionForm.kind === "inventory-ban") {
      nextStore = {
        ...store,
        inventory: store.inventory.map((item) => item.id === actionForm.targetId ? { ...item, status: actionForm.kind === "inventory-release" ? "available" : "banned" } : item),
      };
      message = actionForm.kind === "inventory-release" ? "账号已释放为可交付" : "账号已禁用";
    }
    if (actionForm.kind === "order-deliver" || actionForm.kind === "order-refund") {
      nextStore = {
        ...store,
        orders: store.orders.map((order) => order.id === actionForm.targetId ? { ...order, status: actionForm.kind === "order-deliver" ? "delivered" : "refund" } : order),
        tickets: actionForm.kind === "order-refund"
          ? [{ id: `TK-${Date.now().toString().slice(-5)}`, orderId: actionForm.targetId, customer: store.orders.find((order) => order.id === actionForm.targetId)?.customer ?? "", topic: actionLog, status: "open" }, ...store.tickets]
          : store.tickets,
      };
      message = actionForm.kind === "order-deliver" ? "订单已交付" : "订单已退款，并已生成售后记录";
    }
    if (actionForm.kind === "order-batch-deliver") {
      nextStore = { ...store, orders: store.orders.map((order) => order.status === "pending" ? { ...order, status: "delivered" } : order) };
      message = "待交付订单已批量交付";
    }
    if (actionForm.kind === "ticket-close") {
      nextStore = { ...store, tickets: store.tickets.map((ticket) => ticket.id === actionForm.targetId ? { ...ticket, status: "closed", topic: `${ticket.topic}\n${actionLog}` } : ticket) };
      message = "工单已关闭";
    }
    if (actionForm.kind === "supplier-approve" || actionForm.kind === "supplier-reject") {
      const supplier = store.suppliers.find((item) => item.id === actionForm.targetId);
      const product = store.products.find((item) => item.titleKey === supplier?.productName);
      nextStore = {
        ...store,
        suppliers: store.suppliers.map((item) => item.id === actionForm.targetId ? { ...item, status: actionForm.kind === "supplier-approve" ? "approved" : "rejected" } : item),
        products: actionForm.kind === "supplier-approve" && supplier
          ? store.products.map((item) => item.id === product?.id ? { ...item, stock: (item.stock ?? 0) + supplier.stock, cost: supplier.price } : item)
          : store.products,
      };
      message = actionForm.kind === "supplier-approve" ? "供应商已通过，库存已同步到前台" : "供应商已驳回";
    }
    if (actionForm.kind === "customer-status" || actionForm.kind === "customer-risk") {
      nextStore = {
        ...store,
        customers: store.customers.map((customer) => {
          if (customer.id !== actionForm.targetId) return customer;
          if (actionForm.kind === "customer-status") {
            const nextStatus = customer.status === "banned" ? "active" : "banned";
            return { ...customer, status: nextStatus, riskTag: nextStatus === "banned" ? "high" : "normal", notes: [customer.notes, actionLog].filter(Boolean).join("\n") };
          }
          return { ...customer, riskTag: customer.riskTag === "watch" ? "normal" : "watch", notes: [customer.notes, actionLog].filter(Boolean).join("\n") };
        }),
      };
      message = actionForm.kind === "customer-status" ? "用户状态已更新" : "用户风控标记已更新";
    }
    if (actionForm.kind === "settings-auto-delivery") {
      nextStore = { ...store, settings: { ...store.settings, autoDelivery: !store.settings.autoDelivery } };
      message = "自动交付规则已切换";
    }
    if (actionForm.kind === "operator-toggle") {
      nextStore = { ...store, operators: store.operators.map((operator) => operator.id === actionForm.targetId ? { ...operator, enabled: !operator.enabled } : operator) };
      message = "管理员状态已更新";
    }

    commit(nextStore, message);
    setActionForm(null);
  };

  const openOperatorModal = (operator?: Operator) => {
    setOperatorForm(operator ?? {
      id: `ADM-${Date.now().toString().slice(-4)}`,
      name: "",
      role: "客服权限",
      enabled: true,
    });
  };

  const saveOperatorForm = () => {
    if (!operatorForm?.name.trim()) {
      setNotice("请填写管理员名称");
      return;
    }
    const exists = store.operators.some((operator) => operator.id === operatorForm.id);
    commit({
      ...store,
      operators: exists ? store.operators.map((operator) => operator.id === operatorForm.id ? operatorForm : operator) : [operatorForm, ...store.operators],
    }, exists ? "管理员信息已保存" : "管理员已新增");
    setOperatorForm(null);
  };

  const openIpPricingModal = (rule?: IpPricingRule) => {
    setIpPricingForm(rule ? {
      ...rule,
      priority: String(rule.priority),
      priceValue: String(rule.priceValue),
      originalPrice: rule.originalPrice ? String(rule.originalPrice) : "",
    } : {
      id: `IPR-${Date.now().toString().slice(-5)}`,
      name: "",
      enabled: true,
      priority: "10",
      targetType: "ip",
      targetValue: "",
      productId: store.products[0]?.id ?? "all",
      priceMode: "fixed",
      priceValue: "",
      originalPrice: "",
      note: "",
    });
  };

  const saveIpPricingForm = () => {
    if (!ipPricingForm?.name.trim() || !ipPricingForm.targetValue.trim()) {
      setNotice("请填写规则名称和 IP / 地区条件");
      return;
    }
    const priceValue = Number(ipPricingForm.priceValue);
    const priority = Number(ipPricingForm.priority);
    const originalPrice = ipPricingForm.originalPrice ? Number(ipPricingForm.originalPrice) : undefined;
    if (![priceValue, priority].every(Number.isFinite) || (originalPrice !== undefined && !Number.isFinite(originalPrice))) {
      setNotice("优先级、价格和原价需要填写数字");
      return;
    }
    const nextRule: IpPricingRule = {
      ...ipPricingForm,
      priority,
      priceValue,
      originalPrice,
      targetValue: ipPricingForm.targetValue.trim(),
      name: ipPricingForm.name.trim(),
      note: ipPricingForm.note?.trim(),
    };
    const exists = store.ipPricingRules.some((rule) => rule.id === nextRule.id);
    commit({
      ...store,
      ipPricingRules: exists
        ? store.ipPricingRules.map((rule) => rule.id === nextRule.id ? nextRule : rule)
        : [nextRule, ...store.ipPricingRules],
    }, "IP 定价规则已同步到前台");
    setIpPricingForm(null);
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="今日成交额" value={`$${metrics.revenue.toFixed(2)}`} sub="订单收入实时汇总" icon={CircleDollarSign} />
        <StatCard title="待交付订单" value={String(metrics.pendingOrders)} sub="需要客服或系统处理" icon={Truck} />
        <StatCard title="总库存" value={String(metrics.stock)} sub="前台只展示上架商品" icon={PackageCheck} />
        <StatCard title="预估利润" value={`$${metrics.profit.toFixed(2)}`} sub="演示版按成本估算" icon={Activity} />
      </div>
      <section className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">运营提醒</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg bg-orange-50 p-4 text-sm text-orange-800">低库存商品：{store.products.filter((p) => (p.stock ?? 0) <= store.settings.lowStockAlert).length} 个</div>
          <div className="rounded-lg bg-sky-50 p-4 text-sm text-sky-800">待审核供应商：{store.suppliers.filter((s) => s.status === "pending").length} 个</div>
          <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">自动交付：{store.settings.autoDelivery ? "已开启" : "已关闭"}</div>
        </div>
      </section>
    </div>
  );

  const renderProducts = () => (
    <section className="rounded-lg border border-orange-100 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-orange-100 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">商品与定价</h2>
          <p className="text-sm text-slate-500">这里改价格、上下架、库存，前台会同步变化。</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="h-9 rounded-lg border border-orange-100 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-orange-200" placeholder="搜索商品" />
          </div>
          <button
            onClick={() => openProductModal()}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-orange-600 px-3 text-sm font-bold text-white hover:bg-orange-700"
          >
            <Plus className="h-4 w-4" /> 新增
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-left text-sm">
          <thead className="bg-orange-50 text-slate-600">
            <tr><th className="p-4">商品</th><th>图片</th><th>分类</th><th>售价</th><th>原价</th><th>成本</th><th>库存</th><th>状态</th><th>操作</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td className="p-4 font-bold text-slate-900">{product.titleKey}</td>
                <td>
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.titleKey} className="h-11 w-11 rounded-lg object-cover border border-slate-100" />
                  ) : (
                    <div className={`flex h-11 w-11 items-center justify-center rounded-lg text-sm font-black text-white ${product.color}`}>{product.titleKey.charAt(0)}</div>
                  )}
                </td>
                <td>{categoryOptions.find((cat) => cat.id === product.category)?.labelZh ?? product.category}</td>
                <td>${product.price.toFixed(2)}</td>
                <td>${product.originalPrice.toFixed(2)}</td>
                <td>${product.cost.toFixed(2)}</td>
                <td>{product.stock}</td>
                <td><Badge status={product.status} /></td>
                <td className="space-x-3 font-bold text-orange-700">
                  <button onClick={() => openProductModal(product)}>编辑</button>
                  <button onClick={() => updateProduct(product.id, { status: product.status === "enabled" ? "disabled" : "enabled" }, "商品上下架已同步到前台")}>{product.status === "enabled" ? "下架" : "上架"}</button>
                  <button onClick={() => updateProduct(product.id, { price: Math.round((product.price + 1) * 100) / 100 }, "商品价格已同步到前台")}>改价</button>
                  <button onClick={() => updateProduct(product.id, { badge: cycleBadge(product.badge) }, "商品标签已同步到前台")}>标签</button>
                  <button onClick={() => updateProduct(product.id, { stock: (product.stock ?? 0) + 5 }, "商品库存已同步到前台")}>库存</button>
                  <button onClick={() => commit({ ...store, products: store.products.filter((item) => item.id !== product.id) }, "商品已删除，前台已同步")}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderIpPricing = () => {
    const targetText: Record<IpPricingRule["targetType"], string> = {
      ip: "单个 IP",
      cidr: "IP 段",
      country: "国家/地区",
      all: "全部访客",
    };
    const modeText: Record<IpPricingRule["priceMode"], string> = {
      fixed: "固定价",
      percent: "百分比",
    };
    return (
      <section className="rounded-lg border border-orange-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-orange-100 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">IP 定价</h2>
            <p className="text-sm text-slate-500">按客户 IP、IP 段或国家设置差异价格；优先级越高越先匹配。</p>
          </div>
          <button onClick={() => openIpPricingModal()} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-bold text-white hover:bg-orange-700">
            <Plus className="h-4 w-4" /> 新增规则
          </button>
        </div>
        <div className="grid gap-4 p-5 xl:grid-cols-2">
          {store.ipPricingRules.map((rule) => (
            <div key={rule.id} className="rounded-lg border border-slate-100 p-4 hover:border-orange-200 hover:shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-black text-slate-950">{rule.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{targetText[rule.targetType]}：{rule.targetType === "all" ? "全部" : rule.targetValue}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${rule.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {rule.enabled ? "已启用" : "已停用"}
                </span>
              </div>
              <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
                <div><p className="text-xs text-slate-400">商品</p><p className="font-black">{rule.productId === "all" ? "全部商品" : productTitle(store, rule.productId)}</p></div>
                <div><p className="text-xs text-slate-400">定价方式</p><p className="font-black">{modeText[rule.priceMode]}</p></div>
                <div><p className="text-xs text-slate-400">价格/比例</p><p className="font-black">{rule.priceMode === "fixed" ? `$${rule.priceValue.toFixed(2)}` : `${rule.priceValue}%`}</p></div>
                <div><p className="text-xs text-slate-400">优先级</p><p className="font-black">{rule.priority}</p></div>
              </div>
              {rule.note && <p className="mt-3 rounded-lg bg-orange-50 p-3 text-xs text-orange-800">{rule.note}</p>}
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold text-orange-700">
                <button onClick={() => openIpPricingModal(rule)}>编辑</button>
                <button onClick={() => commit({ ...store, ipPricingRules: store.ipPricingRules.map((item) => item.id === rule.id ? { ...item, enabled: !item.enabled } : item) }, "IP 定价规则状态已同步到前台")}>{rule.enabled ? "停用" : "启用"}</button>
                <button onClick={() => commit({ ...store, ipPricingRules: store.ipPricingRules.filter((item) => item.id !== rule.id) }, "IP 定价规则已删除")}>删除</button>
              </div>
            </div>
          ))}
          {store.ipPricingRules.length === 0 && (
            <div className="rounded-lg border border-dashed border-orange-200 p-10 text-center text-sm text-slate-500 xl:col-span-2">还没有 IP 定价规则</div>
          )}
        </div>
      </section>
    );
  };

  const renderInventory = () => (
    <section className="rounded-lg border border-orange-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-orange-100 p-5">
        <h2 className="text-lg font-black text-slate-950">库存账号池</h2>
        <button onClick={() => openInventoryModal()} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-bold text-white"><Plus className="h-4 w-4" /> 新增账号</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-orange-50 text-slate-600"><tr><th className="p-4">编号</th><th>商品</th><th>账号</th><th>到期</th><th>状态</th><th>操作</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {store.inventory.map((item) => (
              <tr key={item.id}>
                <td className="p-4 font-bold">{item.id}</td><td>{productTitle(store, item.productId)}</td><td>{item.account}</td><td>{item.expireAt}</td><td><Badge status={item.status} /></td>
                <td className="space-x-3 font-bold text-orange-700">
                  <button onClick={() => openInventoryModal(item)}>编辑</button>
                  <button onClick={() => openActionModal({ kind: "inventory-release", targetId: item.id, title: "释放库存账号", targetName: `${item.id} · ${productTitle(store, item.productId)}`, currentState: statusText[item.status] ?? item.status, nextState: "可交付", rule: "释放后该库存可被自动交付系统再次分配。", impact: "会进入可售库存池，前台库存统计可继续使用。" })}>释放</button>
                  <button onClick={() => openActionModal({ kind: "inventory-ban", targetId: item.id, title: "禁用库存账号", targetName: `${item.id} · ${productTitle(store, item.productId)}`, currentState: statusText[item.status] ?? item.status, nextState: "禁用", rule: "禁用后该账号不会再被自动交付。", impact: "适用于账号异常、密码错误、供应商争议等情况。" })}>禁用</button>
                  <button onClick={() => commit({ ...store, inventory: store.inventory.filter((i) => i.id !== item.id) }, "库存账号已删除")}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderOrders = () => (
    <section className="rounded-lg border border-orange-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-orange-100 p-5">
        <h2 className="text-lg font-black text-slate-950">订单管理</h2>
        <div className="flex gap-2">
          <button onClick={() => openOrderModal()} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-bold text-white"><Plus className="h-4 w-4" /> 新增订单</button>
          <button onClick={() => openActionModal({ kind: "order-batch-deliver", targetId: "pending-orders", title: "批量交付订单", targetName: `${store.orders.filter((order) => order.status === "pending").length} 个待交付订单`, currentState: "待处理", nextState: "已交付", rule: "批量交付会把所有待处理订单标记为已交付。", impact: "适合确认库存和交付队列正常后统一处理。" })} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white"><RefreshCw className="h-4 w-4" /> 批量交付</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-orange-50 text-slate-600"><tr><th className="p-4">订单号</th><th>商品</th><th>用户</th><th>金额</th><th>提交时间</th><th>状态</th><th>操作</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {store.orders.map((order) => (
              <tr key={order.id}>
                <td className="p-4 font-bold">{order.id}</td><td>{productTitle(store, order.productId)}</td><td>{order.customer}</td><td>${order.amount.toFixed(2)}</td><td>{order.createdAt}</td><td><Badge status={order.status} /></td>
                <td className="space-x-3 font-bold text-orange-700">
                  <button onClick={() => openOrderModal(order)}>编辑</button>
                  <button onClick={() => openActionModal({ kind: "order-deliver", targetId: order.id, title: "确认订单交付", targetName: `${order.id} · ${productTitle(store, order.productId)}`, currentState: statusText[order.status] ?? order.status, nextState: "已交付", rule: "确认后订单会进入已交付状态，客服可按此状态处理售后。", impact: "建议确认账号/卡密已发出或自动交付成功后再保存。" })}>交付</button>
                  <button onClick={() => openActionModal({ kind: "order-refund", targetId: order.id, title: "确认订单退款", targetName: `${order.id} · ${order.customer}`, currentState: statusText[order.status] ?? order.status, nextState: "已退款", rule: "退款后订单收入不再计入成交额，并会生成一条售后记录。", impact: "适用于无法交付、重复支付、客户取消等场景。" })}>退款</button>
                  <button onClick={() => commit({ ...store, orders: store.orders.filter((o) => o.id !== order.id) }, "订单已删除")}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderTickets = () => (
    <section className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-950">客服工单</h2>
        <button onClick={() => openTicketModal()} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-bold text-white"><Plus className="h-4 w-4" /> 新增工单</button>
      </div>
      <div className="mt-4 grid gap-3">
        {store.tickets.map((ticket) => (
          <div key={ticket.id} className="flex flex-col gap-3 rounded-lg border border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
            <div><p className="font-bold">{ticket.topic}</p><p className="text-sm text-slate-500">{ticket.id} · {ticket.orderId} · {ticket.customer}</p></div>
            <div className="flex items-center gap-3"><Badge status={ticket.status} /><button onClick={() => openTicketModal(ticket)} className="font-bold text-orange-700">编辑</button><button onClick={() => openActionModal({ kind: "ticket-close", targetId: ticket.id, title: "关闭客服工单", targetName: `${ticket.id} · ${ticket.customer}`, currentState: statusText[ticket.status] ?? ticket.status, nextState: "已关闭", rule: "关闭后代表该售后问题已处理完成。", impact: "处理记录会追加到工单内容，方便后续追溯。" })} className="font-bold text-orange-700">处理完成</button><button onClick={() => commit({ ...store, tickets: store.tickets.filter((t) => t.id !== ticket.id) }, "工单已删除")} className="font-bold text-orange-700">删除</button></div>
          </div>
        ))}
      </div>
    </section>
  );

  const renderSuppliers = () => (
    <section className="rounded-lg border border-orange-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-orange-100 p-5"><div><h2 className="text-lg font-black text-slate-950">供应商审核</h2><p className="text-sm text-slate-500">通过后会把库存加到对应商品，前台库存也会变化。</p></div><button onClick={() => openSupplierModal()} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-bold text-white"><Plus className="h-4 w-4" /> 新增供应商</button></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-orange-50 text-slate-600"><tr><th className="p-4">供应商</th><th>商品</th><th>成本</th><th>库存</th><th>提交时间</th><th>状态</th><th>操作</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {store.suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td className="p-4 font-bold">{supplier.name}</td><td>{supplier.productName}</td><td>${supplier.price.toFixed(2)}</td><td>{supplier.stock}</td><td>{supplier.submittedAt}</td><td><Badge status={supplier.status} /></td>
                <td className="space-x-3 font-bold text-orange-700">
                  <button onClick={() => openSupplierModal(supplier)}>编辑</button>
                  <button onClick={() => openActionModal({ kind: "supplier-approve", targetId: supplier.id, title: "通过供应商审核", targetName: `${supplier.name} · ${supplier.productName}`, currentState: statusText[supplier.status] ?? supplier.status, nextState: "已通过", rule: "通过后会把供应商库存加入对应商品库存，并更新商品成本。", impact: `将增加 ${supplier.stock} 个库存，成本价更新为 $${supplier.price.toFixed(2)}。` })}>通过</button>
                  <button onClick={() => openActionModal({ kind: "supplier-reject", targetId: supplier.id, title: "驳回供应商审核", targetName: `${supplier.name} · ${supplier.productName}`, currentState: statusText[supplier.status] ?? supplier.status, nextState: "已驳回", rule: "驳回后不会导入库存，也不会影响前台商品。", impact: "适用于报价异常、库存不稳定、资料不完整等情况。" })}>驳回</button>
                  <button onClick={() => commit({ ...store, suppliers: store.suppliers.filter((s) => s.id !== supplier.id) }, "供应商已删除")}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderUsers = () => (
    <section className="rounded-lg border border-orange-100 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-orange-100 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">用户管理</h2>
            <p className="text-sm text-slate-500">管理客户资料、消费价值、账户状态和风控备注。</p>
          </div>
          <button onClick={() => openCustomerModal()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-bold text-white hover:bg-orange-700"><Plus className="h-4 w-4" /> 新增用户</button>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          <div className="rounded-lg bg-orange-50 p-4"><p className="text-xs font-bold text-orange-700">总用户</p><p className="mt-1 text-2xl font-black">{userStats.total}</p></div>
          <div className="rounded-lg bg-emerald-50 p-4"><p className="text-xs font-bold text-emerald-700">正常用户</p><p className="mt-1 text-2xl font-black">{userStats.active}</p></div>
          <div className="rounded-lg bg-sky-50 p-4"><p className="text-xs font-bold text-sky-700">VIP 用户</p><p className="mt-1 text-2xl font-black">{userStats.vip}</p></div>
          <div className="rounded-lg bg-rose-50 p-4"><p className="text-xs font-bold text-rose-700">风险用户</p><p className="mt-1 text-2xl font-black">{userStats.risk}</p></div>
          <div className="rounded-lg bg-slate-50 p-4"><p className="text-xs font-bold text-slate-600">累计消费</p><p className="mt-1 text-2xl font-black">${userStats.spent.toFixed(2)}</p></div>
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={userQuery} onChange={(event) => setUserQuery(event.target.value)} className="h-9 w-full rounded-lg border border-orange-100 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-orange-200" placeholder="搜索邮箱、姓名、手机、来源、备注" />
          </div>
          <select value={userLevelFilter} onChange={(event) => setUserLevelFilter(event.target.value)} className="h-9 rounded-lg border border-orange-100 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-orange-200">
            <option value="all">全部等级</option>
            <option value="VIP">VIP</option>
            <option value="普通">普通</option>
          </select>
          <select value={userStatusFilter} onChange={(event) => setUserStatusFilter(event.target.value)} className="h-9 rounded-lg border border-orange-100 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-orange-200">
            <option value="all">全部状态</option>
            <option value="active">正常</option>
            <option value="banned">禁用</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 p-5 xl:grid-cols-2">
        {filteredCustomers.map((user) => (
          <div key={user.id} className="rounded-lg border border-slate-100 p-4 hover:border-orange-200 hover:shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-rose-600 text-sm font-black text-white">{(user.name || user.email).charAt(0).toUpperCase()}</div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-black text-slate-950">{user.name || user.email}</p>
                    <p className="truncate text-sm text-slate-500">{user.email}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.level === "VIP" ? "bg-sky-50 text-sky-700" : "bg-slate-100 text-slate-600"}`}>{user.level}</span>
                <Badge status={user.status} />
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.riskTag === "high" ? "bg-rose-50 text-rose-700" : user.riskTag === "watch" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{user.riskTag === "high" ? "高风险" : user.riskTag === "watch" ? "观察" : "低风险"}</span>
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
              <div><p className="text-xs text-slate-400">订单</p><p className="font-black">{user.orders} 单</p></div>
              <div><p className="text-xs text-slate-400">累计消费</p><p className="font-black">${(user.totalSpent ?? 0).toFixed(2)}</p></div>
              <div><p className="text-xs text-slate-400">余额</p><p className="font-black">${(user.balance ?? 0).toFixed(2)}</p></div>
              <div><p className="text-xs text-slate-400">来源</p><p className="font-black">{user.source || "未知"}</p></div>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-2">
              <p>手机：{user.phone || "未填写"}</p>
              <p>注册：{user.registeredAt || "未记录"}</p>
              <p>最近登录：{user.lastLoginAt || "未记录"}</p>
              <p>备注：{user.notes || "无"}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold text-orange-700">
              <button onClick={() => openCustomerModal(user)}>编辑资料</button>
              <button onClick={() => openLevelModal(user)}>改等级</button>
              <button onClick={() => openActionModal({ kind: "customer-status", targetId: user.id, title: user.status === "banned" ? "解禁用户" : "禁用用户", targetName: `${user.name || user.email} · ${user.email}`, currentState: statusText[user.status] ?? user.status, nextState: user.status === "banned" ? "正常" : "禁用", rule: user.status === "banned" ? "解禁后用户可继续登录和下单。" : "禁用后用户将进入高风险状态，后续可接入登录/下单拦截。", impact: "操作记录会写入用户备注。" })}>{user.status === "banned" ? "解禁" : "禁用"}</button>
              <button onClick={() => openActionModal({ kind: "customer-risk", targetId: user.id, title: "调整风控标记", targetName: `${user.name || user.email} · ${user.email}`, currentState: user.riskTag === "watch" ? "观察" : "低风险", nextState: user.riskTag === "watch" ? "低风险" : "观察", rule: "风控标记用于提醒客服关注退款、异常登录或支付行为。", impact: "操作记录会写入用户备注，不会直接禁用账号。" })}>风控标记</button>
              <button onClick={() => commit({ ...store, customers: store.customers.filter((u) => u.id !== user.id) }, "用户已删除")}>删除</button>
            </div>
          </div>
        ))}
        {filteredCustomers.length === 0 && (
          <div className="rounded-lg border border-dashed border-orange-200 p-10 text-center text-sm text-slate-500 xl:col-span-2">没有符合条件的用户</div>
        )}
      </div>
    </section>
  );

  const renderAnalytics = () => {
    const events = store.analyticsEvents ?? [];
    const totals = {
      home: events.reduce((sum, event) => sum + event.homeViews, 0),
      product: events.reduce((sum, event) => sum + event.productViews, 0),
      checkout: events.reduce((sum, event) => sum + event.checkoutAdds, 0),
      paid: events.reduce((sum, event) => sum + event.paidOrders, 0),
      amount: events.reduce((sum, event) => sum + event.totalAmount, 0),
    };
    return (
      <section className="rounded-lg border border-orange-100 bg-white shadow-sm">
        <div className="border-b border-orange-100 p-5">
          <h2 className="text-lg font-black text-slate-950">数据埋点</h2>
          <p className="text-sm text-slate-500">查看每个用户或访客的 IP、来源、浏览商品、转化和支付情况。</p>
          <div className="mt-4 grid gap-4 md:grid-cols-5">
            {[
              ["访问首页", totals.home],
              ["查看商品", totals.product],
              ["加入结算", totals.checkout],
              ["支付完成", totals.paid],
              ["转化金额", `$${totals.amount.toFixed(2)}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-orange-50 p-4"><p className="text-sm text-orange-800">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="bg-orange-50 text-slate-600">
              <tr>
                <th className="p-4">用户</th>
                <th>IP / 国家</th>
                <th>设备</th>
                <th>来源</th>
                <th>浏览商品</th>
                <th>行为</th>
                <th>支付</th>
                <th>最后访问</th>
                <th>状态</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((event) => (
                <tr key={event.id} className="align-top">
                  <td className="p-4">
                    <p className="font-black text-slate-950">{event.customerName || event.customerEmail}</p>
                    <p className="text-xs text-slate-500">{event.customerEmail}</p>
                  </td>
                  <td><p className="font-bold">{event.ip}</p><p className="text-xs text-slate-500">{event.country}</p></td>
                  <td>{event.device}</td>
                  <td>{event.source}</td>
                  <td>
                    <div className="flex max-w-xs flex-wrap gap-1">
                      {event.viewedProducts.map((product) => <span key={product} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{product}</span>)}
                    </div>
                  </td>
                  <td>
                    <p>首页 {event.homeViews}</p>
                    <p>商品 {event.productViews}</p>
                    <p>结算 {event.checkoutAdds}</p>
                  </td>
                  <td><p className="font-black">${event.totalAmount.toFixed(2)}</p><p className="text-xs text-slate-500">{event.paidOrders} 单</p></td>
                  <td>{event.lastSeenAt}</td>
                  <td>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${event.status === "converted" ? "bg-emerald-50 text-emerald-700" : event.status === "risk" ? "bg-rose-50 text-rose-700" : "bg-sky-50 text-sky-700"}`}>
                      {event.status === "converted" ? "已转化" : event.status === "risk" ? "风险" : "活跃"}
                    </span>
                  </td>
                  <td className="max-w-xs text-slate-500">{event.note || "无"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {events.length === 0 && <div className="p-10 text-center text-sm text-slate-500">暂无用户行为明细</div>}
        </div>
      </section>
    );
  };

  const renderSettings = () => (
    <section className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">站点设置</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-bold text-slate-700">站点名称<input value={store.settings.siteName} onChange={(e) => commit({ ...store, settings: { ...store.settings, siteName: e.target.value } }, "站点名称已同步")} className="mt-2 w-full rounded-lg border border-orange-100 p-3 font-normal outline-none focus:ring-2 focus:ring-orange-200" /></label>
        <label className="text-sm font-bold text-slate-700">低库存提醒<input type="number" value={store.settings.lowStockAlert} onChange={(e) => commit({ ...store, settings: { ...store.settings, lowStockAlert: Number(e.target.value) } }, "低库存规则已保存")} className="mt-2 w-full rounded-lg border border-orange-100 p-3 font-normal outline-none focus:ring-2 focus:ring-orange-200" /></label>
        <label className="md:col-span-2 text-sm font-bold text-slate-700">前台公告<textarea value={store.settings.announcement} onChange={(e) => commit({ ...store, settings: { ...store.settings, announcement: e.target.value } }, "前台公告已保存")} className="mt-2 h-24 w-full rounded-lg border border-orange-100 p-3 font-normal outline-none focus:ring-2 focus:ring-orange-200" /></label>
      </div>
      <button onClick={() => openActionModal({ kind: "settings-auto-delivery", targetId: "site-settings", title: store.settings.autoDelivery ? "关闭自动交付" : "开启自动交付", targetName: "站点自动交付规则", currentState: store.settings.autoDelivery ? "已开启" : "已关闭", nextState: store.settings.autoDelivery ? "已关闭" : "已开启", rule: "自动交付开关影响订单是否进入自动处理流程。", impact: store.settings.autoDelivery ? "关闭后新订单需要人工处理或进入待交付队列。" : "开启后符合规则的订单可自动发货。" })} className="mt-4 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white">{store.settings.autoDelivery ? "关闭自动交付" : "开启自动交付"}</button>
    </section>
  );

  const renderAdmins = () => (
    <section className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between"><h2 className="text-lg font-black text-slate-950">管理员管理</h2><button onClick={() => openOperatorModal()} className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-bold text-white">新增管理员</button></div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {store.operators.map((operator) => (
          <div key={operator.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-4">
            <div><p className="font-bold">{operator.name}</p><p className="text-sm text-slate-500">{operator.role}</p></div>
            <div className="flex items-center gap-3 text-sm font-bold text-orange-700">
              <button onClick={() => openOperatorModal(operator)}>编辑</button>
              <button onClick={() => openActionModal({ kind: "operator-toggle", targetId: operator.id, title: operator.enabled ? "停用管理员" : "启用管理员", targetName: `${operator.name} · ${operator.role}`, currentState: operator.enabled ? "启用" : "停用", nextState: operator.enabled ? "停用" : "启用", rule: "管理员停用后应无法继续执行后台操作。", impact: "当前演示版会更新管理员状态，真实运营版需要接入权限系统。" })} className={`rounded-full px-3 py-1 text-sm font-bold ${operator.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{operator.enabled ? "启用" : "停用"}</button>
              <button onClick={() => commit({ ...store, operators: store.operators.filter((o) => o.id !== operator.id) }, "管理员已删除")}>删除</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const modalFrame = (title: string, subtitle: string, onClose: () => void, onSave: () => void, body: ReactNode) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-orange-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-black text-slate-950">{title}</h2>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[calc(92vh-137px)] overflow-y-auto p-6">{body}</div>
        <div className="flex items-center justify-end gap-3 border-t border-orange-100 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">取消</button>
          <button onClick={onSave} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700"><Save className="h-4 w-4" /> 保存</button>
        </div>
      </div>
    </div>
  );

  const fieldClass = "mt-2 w-full rounded-lg border border-orange-100 bg-white p-3 font-normal outline-none focus:ring-2 focus:ring-orange-200";

  const inventoryModal = inventoryForm ? modalFrame("库存账号明细", "新增或编辑可交付账号、卡密、到期时间和状态。", () => setInventoryForm(null), saveInventoryForm, (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm font-bold text-slate-700">商品<select value={inventoryForm.productId} onChange={(event) => setInventoryForm({ ...inventoryForm, productId: event.target.value })} className={fieldClass}>{store.products.map((product) => <option key={product.id} value={product.id}>{product.titleKey}</option>)}</select></label>
      <label className="text-sm font-bold text-slate-700">状态<select value={inventoryForm.status} onChange={(event) => setInventoryForm({ ...inventoryForm, status: event.target.value as InventoryAccount["status"] })} className={fieldClass}><option value="available">可交付</option><option value="locked">锁定</option><option value="used">已交付</option><option value="banned">禁用</option></select></label>
      <label className="md:col-span-2 text-sm font-bold text-slate-700">账号/卡密<textarea value={inventoryForm.account} onChange={(event) => setInventoryForm({ ...inventoryForm, account: event.target.value })} className={`${fieldClass} h-28`} placeholder="账号、密码、卡密或交付备注" /></label>
      <label className="text-sm font-bold text-slate-700">到期时间<input value={inventoryForm.expireAt} onChange={(event) => setInventoryForm({ ...inventoryForm, expireAt: event.target.value })} className={fieldClass} placeholder="2026-12-31" /></label>
      <label className="text-sm font-bold text-slate-700">库存编号<input value={inventoryForm.id} onChange={(event) => setInventoryForm({ ...inventoryForm, id: event.target.value })} className={fieldClass} /></label>
    </div>
  )) : null;

  const orderModal = orderForm ? modalFrame("订单明细", "录入测试订单、调整状态、修改客户与金额。", () => setOrderForm(null), saveOrderForm, (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm font-bold text-slate-700">订单号<input value={orderForm.id} onChange={(event) => setOrderForm({ ...orderForm, id: event.target.value })} className={fieldClass} /></label>
      <label className="text-sm font-bold text-slate-700">商品<select value={orderForm.productId} onChange={(event) => setOrderForm({ ...orderForm, productId: event.target.value })} className={fieldClass}>{store.products.map((product) => <option key={product.id} value={product.id}>{product.titleKey}</option>)}</select></label>
      <label className="text-sm font-bold text-slate-700">用户邮箱<input value={orderForm.customer} onChange={(event) => setOrderForm({ ...orderForm, customer: event.target.value })} className={fieldClass} placeholder="customer@example.com" /></label>
      <label className="text-sm font-bold text-slate-700">金额 USD<input type="number" step="0.01" value={orderForm.amount} onChange={(event) => setOrderForm({ ...orderForm, amount: event.target.value })} className={fieldClass} /></label>
      <label className="text-sm font-bold text-slate-700">状态<select value={orderForm.status} onChange={(event) => setOrderForm({ ...orderForm, status: event.target.value as AdminOrder["status"] })} className={fieldClass}><option value="pending">待处理</option><option value="delivered">已交付</option><option value="refund">已退款</option></select></label>
      <label className="text-sm font-bold text-slate-700">提交时间<input value={orderForm.createdAt} onChange={(event) => setOrderForm({ ...orderForm, createdAt: event.target.value })} className={fieldClass} /></label>
    </div>
  )) : null;

  const ticketModal = ticketForm ? modalFrame("客服工单明细", "记录用户售后问题、关联订单并更新处理状态。", () => setTicketForm(null), saveTicketForm, (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm font-bold text-slate-700">工单编号<input value={ticketForm.id} onChange={(event) => setTicketForm({ ...ticketForm, id: event.target.value })} className={fieldClass} /></label>
      <label className="text-sm font-bold text-slate-700">状态<select value={ticketForm.status} onChange={(event) => setTicketForm({ ...ticketForm, status: event.target.value as Ticket["status"] })} className={fieldClass}><option value="open">处理中</option><option value="closed">已关闭</option></select></label>
      <label className="text-sm font-bold text-slate-700">关联订单<input value={ticketForm.orderId} onChange={(event) => setTicketForm({ ...ticketForm, orderId: event.target.value })} className={fieldClass} /></label>
      <label className="text-sm font-bold text-slate-700">用户邮箱<input value={ticketForm.customer} onChange={(event) => setTicketForm({ ...ticketForm, customer: event.target.value })} className={fieldClass} /></label>
      <label className="md:col-span-2 text-sm font-bold text-slate-700">问题内容<textarea value={ticketForm.topic} onChange={(event) => setTicketForm({ ...ticketForm, topic: event.target.value })} className={`${fieldClass} h-28`} placeholder="例如 无法登录账号，需要补发" /></label>
    </div>
  )) : null;

  const supplierModal = supplierForm ? modalFrame("供应商资料", "录入供应商报价、供货商品、库存和审核状态。", () => setSupplierForm(null), saveSupplierForm, (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm font-bold text-slate-700">供应商名称<input value={supplierForm.name} onChange={(event) => setSupplierForm({ ...supplierForm, name: event.target.value })} className={fieldClass} /></label>
      <label className="text-sm font-bold text-slate-700">商品名称<select value={supplierForm.productName} onChange={(event) => setSupplierForm({ ...supplierForm, productName: event.target.value })} className={fieldClass}>{store.products.map((product) => <option key={product.id} value={product.titleKey}>{product.titleKey}</option>)}</select></label>
      <label className="text-sm font-bold text-slate-700">供应价 USD<input type="number" step="0.01" value={supplierForm.price} onChange={(event) => setSupplierForm({ ...supplierForm, price: event.target.value })} className={fieldClass} /></label>
      <label className="text-sm font-bold text-slate-700">可供库存<input type="number" value={supplierForm.stock} onChange={(event) => setSupplierForm({ ...supplierForm, stock: event.target.value })} className={fieldClass} /></label>
      <label className="text-sm font-bold text-slate-700">审核状态<select value={supplierForm.status} onChange={(event) => setSupplierForm({ ...supplierForm, status: event.target.value as Supplier["status"] })} className={fieldClass}><option value="pending">待审核</option><option value="approved">已通过</option><option value="rejected">已驳回</option></select></label>
      <label className="text-sm font-bold text-slate-700">提交时间<input value={supplierForm.submittedAt} onChange={(event) => setSupplierForm({ ...supplierForm, submittedAt: event.target.value })} className={fieldClass} /></label>
    </div>
  )) : null;

  const customerModal = customerForm ? modalFrame("用户明细", "维护客户资料、余额、消费、来源和风控备注。", () => setCustomerForm(null), saveCustomerForm, (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm font-bold text-slate-700">用户邮箱<input value={customerForm.email} onChange={(event) => setCustomerForm({ ...customerForm, email: event.target.value })} className={fieldClass} placeholder="user@example.com" /></label>
      <label className="text-sm font-bold text-slate-700">姓名/昵称<input value={customerForm.name ?? ""} onChange={(event) => setCustomerForm({ ...customerForm, name: event.target.value })} className={fieldClass} placeholder="客户昵称" /></label>
      <label className="text-sm font-bold text-slate-700">手机号<input value={customerForm.phone ?? ""} onChange={(event) => setCustomerForm({ ...customerForm, phone: event.target.value })} className={fieldClass} placeholder="+86 138..." /></label>
      <label className="text-sm font-bold text-slate-700">用户来源<input value={customerForm.source ?? ""} onChange={(event) => setCustomerForm({ ...customerForm, source: event.target.value })} className={fieldClass} placeholder="广告、自然搜索、后台导入" /></label>
      <label className="text-sm font-bold text-slate-700">用户等级<select value={customerForm.level} onChange={(event) => setCustomerForm({ ...customerForm, level: event.target.value as Customer["level"] })} className={fieldClass}><option value="普通">普通</option><option value="VIP">VIP</option></select></label>
      <label className="text-sm font-bold text-slate-700">账户状态<select value={customerForm.status} onChange={(event) => setCustomerForm({ ...customerForm, status: event.target.value as Customer["status"] })} className={fieldClass}><option value="active">正常</option><option value="banned">禁用</option></select></label>
      <label className="text-sm font-bold text-slate-700">风控等级<select value={customerForm.riskTag ?? "normal"} onChange={(event) => setCustomerForm({ ...customerForm, riskTag: event.target.value as Customer["riskTag"] })} className={fieldClass}><option value="normal">低风险</option><option value="watch">观察</option><option value="high">高风险</option></select></label>
      <label className="text-sm font-bold text-slate-700">订单数<input type="number" min="0" value={customerForm.orders} onChange={(event) => setCustomerForm({ ...customerForm, orders: Number(event.target.value) || 0 })} className={fieldClass} /></label>
      <label className="text-sm font-bold text-slate-700">账户余额 USD<input type="number" min="0" step="0.01" value={customerForm.balance ?? 0} onChange={(event) => setCustomerForm({ ...customerForm, balance: Number(event.target.value) || 0 })} className={fieldClass} /></label>
      <label className="text-sm font-bold text-slate-700">累计消费 USD<input type="number" min="0" step="0.01" value={customerForm.totalSpent ?? 0} onChange={(event) => setCustomerForm({ ...customerForm, totalSpent: Number(event.target.value) || 0 })} className={fieldClass} /></label>
      <label className="text-sm font-bold text-slate-700">注册时间<input value={customerForm.registeredAt ?? ""} onChange={(event) => setCustomerForm({ ...customerForm, registeredAt: event.target.value })} className={fieldClass} placeholder="2026/7/22" /></label>
      <label className="text-sm font-bold text-slate-700">最近登录<input value={customerForm.lastLoginAt ?? ""} onChange={(event) => setCustomerForm({ ...customerForm, lastLoginAt: event.target.value })} className={fieldClass} placeholder="2026/7/22 15:30" /></label>
      <label className="md:col-span-2 text-sm font-bold text-slate-700">运营备注<textarea value={customerForm.notes ?? ""} onChange={(event) => setCustomerForm({ ...customerForm, notes: event.target.value })} className={`${fieldClass} h-28`} placeholder="记录售后偏好、退款风险、重点客户说明" /></label>
    </div>
  )) : null;

  const levelModal = levelForm ? modalFrame("变更用户等级", "选择新等级并确认权益、客服优先级和变更原因。", () => setLevelForm(null), saveLevelForm, (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-4">
        <div className="rounded-lg border border-orange-100 bg-orange-50/50 p-4">
          <p className="text-xs font-bold text-orange-700">当前用户</p>
          <p className="mt-2 text-lg font-black text-slate-950">{levelForm.name}</p>
          <p className="text-sm text-slate-500">{levelForm.email}</p>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600">当前：{levelForm.currentLevel}</span>
            <span className="rounded-full bg-orange-600 px-3 py-1 font-bold text-white">调整为：{levelForm.nextLevel}</span>
          </div>
        </div>
        <label className="text-sm font-bold text-slate-700">
          新等级
          <select
            value={levelForm.nextLevel}
            onChange={(event) => setLevelForm({ ...levelForm, nextLevel: event.target.value as Customer["level"] })}
            className={fieldClass}
          >
            <option value="普通">普通</option>
            <option value="VIP">VIP</option>
          </select>
        </label>
        <label className="text-sm font-bold text-slate-700">
          生效时间
          <input value={levelForm.effectiveAt} onChange={(event) => setLevelForm({ ...levelForm, effectiveAt: event.target.value })} className={fieldClass} />
        </label>
        <label className="text-sm font-bold text-slate-700">
          变更原因
          <textarea
            value={levelForm.reason}
            onChange={(event) => setLevelForm({ ...levelForm, reason: event.target.value })}
            className={`${fieldClass} h-24`}
            placeholder="例如 累计消费达标、人工审核通过、活动赠送 VIP"
          />
        </label>
      </div>

      <div className="rounded-lg border border-orange-100 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-orange-700">等级详情</p>
            <h3 className="mt-1 text-xl font-black text-slate-950">{levelDetails[levelForm.nextLevel].title}</h3>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${levelForm.nextLevel === "VIP" ? "bg-sky-50 text-sky-700" : "bg-slate-100 text-slate-600"}`}>{levelForm.nextLevel}</span>
        </div>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-lg bg-orange-50 p-3"><p className="text-xs text-orange-700">优惠</p><p className="mt-1 font-black">{levelDetails[levelForm.nextLevel].discount}</p></div>
          <div className="rounded-lg bg-emerald-50 p-3"><p className="text-xs text-emerald-700">客服</p><p className="mt-1 font-black">{levelDetails[levelForm.nextLevel].service}</p></div>
          <div className="rounded-lg bg-sky-50 p-3"><p className="text-xs text-sky-700">额度</p><p className="mt-1 font-black">{levelDetails[levelForm.nextLevel].limit}</p></div>
        </div>
        <div className="mt-4">
          <p className="text-sm font-black text-slate-800">权益说明</p>
          <div className="mt-2 space-y-2">
            {levelDetails[levelForm.nextLevel].benefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          {levelDetails[levelForm.nextLevel].condition}
        </div>
        <label className="mt-4 block text-sm font-bold text-slate-700">
          内部备注
          <textarea
            value={levelForm.internalNote}
            onChange={(event) => setLevelForm({ ...levelForm, internalNote: event.target.value })}
            className={`${fieldClass} h-24`}
            placeholder="保存后会写入用户备注"
          />
        </label>
      </div>
    </div>
  )) : null;

  const actionModal = actionForm ? modalFrame(actionForm.title, "确认操作规则、影响范围，并填写原因备注。", () => setActionForm(null), saveActionForm, (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-4">
        <div className="rounded-lg border border-orange-100 bg-orange-50/50 p-4">
          <p className="text-xs font-bold text-orange-700">操作对象</p>
          <p className="mt-2 text-lg font-black text-slate-950">{actionForm.targetName}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600">当前：{actionForm.currentState}</span>
            <span className="rounded-full bg-orange-600 px-3 py-1 font-bold text-white">变更为：{actionForm.nextState}</span>
          </div>
        </div>
        <label className="text-sm font-bold text-slate-700">
          操作人
          <input value={actionForm.operator} onChange={(event) => setActionForm({ ...actionForm, operator: event.target.value })} className={fieldClass} />
        </label>
        <label className="text-sm font-bold text-slate-700">
          生效时间
          <input value={actionForm.effectiveAt} onChange={(event) => setActionForm({ ...actionForm, effectiveAt: event.target.value })} className={fieldClass} />
        </label>
        <label className="text-sm font-bold text-slate-700">
          操作原因
          <textarea value={actionForm.reason} onChange={(event) => setActionForm({ ...actionForm, reason: event.target.value })} className={`${fieldClass} h-24`} placeholder="例如 客户已收到账号、供应商资料通过、账号异常需禁用" />
        </label>
      </div>

      <div className="rounded-lg border border-orange-100 bg-white p-4">
        <p className="text-xs font-bold text-orange-700">规则详情</p>
        <h3 className="mt-1 text-xl font-black text-slate-950">{actionForm.title}</h3>
        <div className="mt-4 space-y-3">
          <div className="rounded-lg bg-sky-50 p-4">
            <p className="text-xs font-bold text-sky-700">执行规则</p>
            <p className="mt-1 text-sm text-slate-700">{actionForm.rule}</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-4">
            <p className="text-xs font-bold text-amber-700">影响范围</p>
            <p className="mt-1 text-sm text-slate-700">{actionForm.impact}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-4">
            <p className="text-xs font-bold text-emerald-700">保存结果</p>
            <p className="mt-1 text-sm text-slate-700">保存后会更新对应模块状态；涉及用户、工单或退款的操作会保留备注记录，方便追溯。</p>
          </div>
        </div>
        <label className="mt-4 block text-sm font-bold text-slate-700">
          内部备注
          <textarea value={actionForm.note} onChange={(event) => setActionForm({ ...actionForm, note: event.target.value })} className={`${fieldClass} h-28`} placeholder="记录更多内部说明，供运营和客服查看" />
        </label>
      </div>
    </div>
  )) : null;

  const operatorModal = operatorForm ? modalFrame("管理员明细", "配置后台成员名称、权限角色和启用状态。", () => setOperatorForm(null), saveOperatorForm, (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm font-bold text-slate-700">管理员名称<input value={operatorForm.name} onChange={(event) => setOperatorForm({ ...operatorForm, name: event.target.value })} className={fieldClass} placeholder="例如 客服小组 A" /></label>
      <label className="text-sm font-bold text-slate-700">权限角色<select value={operatorForm.role} onChange={(event) => setOperatorForm({ ...operatorForm, role: event.target.value })} className={fieldClass}><option value="全部权限">全部权限</option><option value="商品/库存">商品/库存</option><option value="订单/工单">订单/工单</option><option value="财务只读">财务只读</option></select></label>
      <label className="md:col-span-2 flex items-center gap-3 rounded-lg border border-orange-100 p-4 text-sm font-bold text-slate-700"><input type="checkbox" checked={operatorForm.enabled} onChange={(event) => setOperatorForm({ ...operatorForm, enabled: event.target.checked })} className="h-4 w-4 accent-orange-600" /> 启用该管理员</label>
    </div>
  )) : null;

  const ipPricingModal = ipPricingForm ? modalFrame("IP 定价规则", "设置客户 IP、IP 段或国家命中后的商品价格。", () => setIpPricingForm(null), saveIpPricingForm, (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm font-bold text-slate-700">规则名称<input value={ipPricingForm.name} onChange={(event) => setIpPricingForm({ ...ipPricingForm, name: event.target.value })} className={fieldClass} placeholder="例如 美国访客 ChatGPT 价格" /></label>
      <label className="text-sm font-bold text-slate-700">匹配类型<select value={ipPricingForm.targetType} onChange={(event) => setIpPricingForm({ ...ipPricingForm, targetType: event.target.value as IpPricingRule["targetType"] })} className={fieldClass}><option value="ip">单个 IP</option><option value="cidr">IP 段 CIDR</option><option value="country">国家/地区代码</option><option value="all">全部访客</option></select></label>
      <label className="text-sm font-bold text-slate-700">匹配值<input value={ipPricingForm.targetValue} onChange={(event) => setIpPricingForm({ ...ipPricingForm, targetValue: event.target.value })} className={fieldClass} placeholder="8.8.8.8 / 8.8.8.0/24 / US" /></label>
      <label className="text-sm font-bold text-slate-700">适用商品<select value={ipPricingForm.productId} onChange={(event) => setIpPricingForm({ ...ipPricingForm, productId: event.target.value })} className={fieldClass}><option value="all">全部商品</option>{store.products.map((product) => <option key={product.id} value={product.id}>{product.titleKey}</option>)}</select></label>
      <label className="text-sm font-bold text-slate-700">定价方式<select value={ipPricingForm.priceMode} onChange={(event) => setIpPricingForm({ ...ipPricingForm, priceMode: event.target.value as IpPricingRule["priceMode"] })} className={fieldClass}><option value="fixed">固定价 USD</option><option value="percent">按基础价增减百分比</option></select></label>
      <label className="text-sm font-bold text-slate-700">{ipPricingForm.priceMode === "fixed" ? "新价格 USD" : "增减百分比"}<input type="number" step="0.01" value={ipPricingForm.priceValue} onChange={(event) => setIpPricingForm({ ...ipPricingForm, priceValue: event.target.value })} className={fieldClass} placeholder={ipPricingForm.priceMode === "fixed" ? "19.99" : "-10"} /></label>
      <label className="text-sm font-bold text-slate-700">展示原价 USD<input type="number" step="0.01" value={ipPricingForm.originalPrice} onChange={(event) => setIpPricingForm({ ...ipPricingForm, originalPrice: event.target.value })} className={fieldClass} placeholder="可不填" /></label>
      <label className="text-sm font-bold text-slate-700">优先级<input type="number" value={ipPricingForm.priority} onChange={(event) => setIpPricingForm({ ...ipPricingForm, priority: event.target.value })} className={fieldClass} placeholder="数字越大越优先" /></label>
      <label className="md:col-span-2 flex items-center gap-3 rounded-lg border border-orange-100 p-4 text-sm font-bold text-slate-700"><input type="checkbox" checked={ipPricingForm.enabled} onChange={(event) => setIpPricingForm({ ...ipPricingForm, enabled: event.target.checked })} className="h-4 w-4 accent-orange-600" /> 启用该规则</label>
      <label className="md:col-span-2 text-sm font-bold text-slate-700">内部备注<textarea value={ipPricingForm.note ?? ""} onChange={(event) => setIpPricingForm({ ...ipPricingForm, note: event.target.value })} className={`${fieldClass} h-24`} placeholder="记录规则目的、适用市场或客户说明" /></label>
    </div>
  )) : null;

  const productModal = productForm ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-orange-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">{productForm.id ? "编辑商品明细" : "新增商品"}</h2>
              <p className="text-sm text-slate-500">保存后会立即同步到前台商品列表和详情页。</p>
            </div>
          </div>
          <button onClick={() => setProductForm(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid max-h-[calc(92vh-137px)] gap-6 overflow-y-auto p-6 lg:grid-cols-[300px_1fr]">
          <div className="space-y-4">
            <div className="rounded-lg border border-orange-100 bg-orange-50/50 p-4">
              <p className="mb-3 text-sm font-black text-slate-800">商品图片</p>
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-dashed border-orange-200 bg-white">
                {productForm.imageUrl ? (
                  <img src={productForm.imageUrl} alt="商品预览" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center text-slate-400">
                    <ImageIcon className="mx-auto h-10 w-10" />
                    <p className="mt-2 text-sm">上传或粘贴图片</p>
                  </div>
                )}
              </div>
              <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700">
                <Upload className="h-4 w-4" />
                上传图片
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleProductImage(event.target.files?.[0])}
                />
              </label>
              <input
                value={productForm.imageUrl}
                onChange={(event) => setProductForm({ ...productForm, imageUrl: event.target.value })}
                className="mt-3 w-full rounded-lg border border-orange-100 p-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
                placeholder="或粘贴图片 URL"
              />
            </div>

            <div className="rounded-lg border border-orange-100 bg-white p-4">
              <p className="mb-3 text-sm font-black text-slate-800">卡片颜色</p>
              <div className="grid grid-cols-3 gap-2">
                {gradientOptions.map((color) => (
                  <button
                    key={color}
                    onClick={() => setProductForm({ ...productForm, color })}
                    className={`h-12 rounded-lg border-2 ${productForm.color === color ? "border-slate-950" : "border-transparent"} ${color}`}
                    aria-label="选择颜色"
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-bold text-slate-700">
              商品名称
              <input
                value={productForm.titleKey}
                onChange={(event) => setProductForm({ ...productForm, titleKey: event.target.value })}
                className="mt-2 w-full rounded-lg border border-orange-100 p-3 font-normal outline-none focus:ring-2 focus:ring-orange-200"
                placeholder="例如 YouTube Premium"
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              商品分类
              <select
                value={productForm.category}
                onChange={(event) => setProductForm({ ...productForm, category: event.target.value })}
                className="mt-2 w-full rounded-lg border border-orange-100 bg-white p-3 font-normal outline-none focus:ring-2 focus:ring-orange-200"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.labelZh} / {cat.label}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold text-slate-700">
              售价 USD
              <input
                type="number"
                min="0"
                step="0.01"
                value={productForm.price}
                onChange={(event) => setProductForm({ ...productForm, price: event.target.value })}
                className="mt-2 w-full rounded-lg border border-orange-100 p-3 font-normal outline-none focus:ring-2 focus:ring-orange-200"
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              原价 USD
              <input
                type="number"
                min="0"
                step="0.01"
                value={productForm.originalPrice}
                onChange={(event) => setProductForm({ ...productForm, originalPrice: event.target.value })}
                className="mt-2 w-full rounded-lg border border-orange-100 p-3 font-normal outline-none focus:ring-2 focus:ring-orange-200"
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              成本 USD
              <input
                type="number"
                min="0"
                step="0.01"
                value={productForm.cost}
                onChange={(event) => setProductForm({ ...productForm, cost: event.target.value })}
                className="mt-2 w-full rounded-lg border border-orange-100 p-3 font-normal outline-none focus:ring-2 focus:ring-orange-200"
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              库存数量
              <input
                type="number"
                min="0"
                step="1"
                value={productForm.stock}
                onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })}
                className="mt-2 w-full rounded-lg border border-orange-100 p-3 font-normal outline-none focus:ring-2 focus:ring-orange-200"
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              标签
              <select
                value={productForm.badge}
                onChange={(event) => setProductForm({ ...productForm, badge: event.target.value as ProductFormState["badge"] })}
                className="mt-2 w-full rounded-lg border border-orange-100 bg-white p-3 font-normal outline-none focus:ring-2 focus:ring-orange-200"
              >
                <option value="">无标签</option>
                <option value="hot">热销</option>
                <option value="new">新品</option>
                <option value="recommend">推荐</option>
              </select>
            </label>
            <label className="text-sm font-bold text-slate-700">
              上架状态
              <select
                value={productForm.status}
                onChange={(event) => setProductForm({ ...productForm, status: event.target.value as ProductFormState["status"] })}
                className="mt-2 w-full rounded-lg border border-orange-100 bg-white p-3 font-normal outline-none focus:ring-2 focus:ring-orange-200"
              >
                <option value="enabled">上架，前台展示</option>
                <option value="disabled">下架，前台隐藏</option>
              </select>
            </label>
            <label className="text-sm font-bold text-slate-700">
              交付方式
              <select
                value={productForm.deliveryMode}
                onChange={(event) => setProductForm({ ...productForm, deliveryMode: event.target.value as AdminProduct["deliveryMode"] })}
                className="mt-2 w-full rounded-lg border border-orange-100 bg-white p-3 font-normal outline-none focus:ring-2 focus:ring-orange-200"
              >
                <option value="auto">自动交付</option>
                <option value="manual">人工交付</option>
                <option value="mixed">自动+人工</option>
              </select>
            </label>
            <label className="text-sm font-bold text-slate-700">
              前台副标题
              <input
                value={productForm.subtitle}
                onChange={(event) => setProductForm({ ...productForm, subtitle: event.target.value })}
                className="mt-2 w-full rounded-lg border border-orange-100 p-3 font-normal outline-none focus:ring-2 focus:ring-orange-200"
                placeholder="例如 独享账号 · 极速交付"
              />
            </label>
            <label className="md:col-span-2 text-sm font-bold text-slate-700">
              交付/售后规则
              <textarea
                value={productForm.delivery}
                onChange={(event) => setProductForm({ ...productForm, delivery: event.target.value })}
                className="mt-2 h-24 w-full rounded-lg border border-orange-100 p-3 font-normal outline-none focus:ring-2 focus:ring-orange-200"
                placeholder="例如 付款后自动发账号；不可改密；异常 24 小时内补发。"
              />
            </label>
            <label className="md:col-span-2 text-sm font-bold text-slate-700">
              商品详情说明
              <textarea
                value={productForm.description}
                onChange={(event) => setProductForm({ ...productForm, description: event.target.value })}
                className="mt-2 h-28 w-full rounded-lg border border-orange-100 p-3 font-normal outline-none focus:ring-2 focus:ring-orange-200"
                placeholder="填写前台详情页介绍、使用说明、注意事项。"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-orange-100 px-6 py-4">
          <button onClick={() => setProductForm(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">取消</button>
          <button onClick={saveProductForm} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700">
            <Save className="h-4 w-4" />
            保存商品
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const content = {
    dashboard: renderDashboard,
    products: renderProducts,
    "ip-pricing": renderIpPricing,
    inventory: renderInventory,
    orders: renderOrders,
    tickets: renderTickets,
    suppliers: renderSuppliers,
    users: renderUsers,
    analytics: renderAnalytics,
    settings: renderSettings,
    admins: renderAdmins,
  }[active] ?? renderDashboard;

  return (
    <div className="min-h-screen bg-[#fff7ed] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-orange-100 bg-white p-5 lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-rose-600 text-xl font-black text-white">G</div>
            <div><p className="text-lg font-black">GoAifast Admin</p><p className="text-xs text-slate-400">运营交付后台</p></div>
          </div>
          <nav className="mt-8 space-y-1">
            {menu.map((item) => {
              const Icon = item.icon;
              const selected = active === item.id;
              return (
                <button key={item.id} onClick={() => setActive(item.id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${selected ? "bg-orange-600 text-white shadow-sm" : "text-slate-600 hover:bg-orange-50 hover:text-orange-700"}`}>
                  <Icon className="h-4 w-4" /> {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-orange-100 bg-white/90 px-4 py-4 backdrop-blur md:px-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div><h1 className="text-2xl font-black">{menu.find((item) => item.id === active)?.label}</h1><p className="text-sm text-slate-500">前后台联动演示 · 最后更新 {new Date(store.updatedAt).toLocaleString()}</p></div>
              <div className="flex items-center gap-2">
                <a href={import.meta.env.BASE_URL || "/"} className="rounded-lg border border-orange-200 px-3 py-2 text-sm font-bold text-orange-700 hover:bg-orange-50">打开前台</a>
                <button onClick={() => commit(loadAdminStore(), "数据已刷新")} className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white">刷新后台</button>
              </div>
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
              {menu.map((item) => <button key={item.id} onClick={() => setActive(item.id)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${active === item.id ? "bg-orange-600 text-white" : "bg-orange-50 text-orange-700"}`}>{item.label}</button>)}
            </div>
          </header>

          <div className="p-4 md:p-8">
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-orange-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              {notice.includes("驳回") || notice.includes("禁用") ? <XCircle className="h-4 w-4 text-rose-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              {notice}
            </div>
            {content()}
          </div>
        </main>
      </div>
      {productModal}
      {inventoryModal}
      {orderModal}
      {ticketModal}
      {supplierModal}
      {customerModal}
      {levelModal}
      {actionModal}
      {operatorModal}
      {ipPricingModal}
    </div>
  );
}
