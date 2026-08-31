CREATE TABLE IF NOT EXISTS public.go_products (
  id TEXT PRIMARY KEY,
  title_key TEXT NOT NULL,
  category TEXT NOT NULL,
  price_usd NUMERIC NOT NULL DEFAULT 0,
  original_price_usd NUMERIC NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT 'bg-gradient-to-br from-orange-500 to-rose-600',
  badge TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  delivery TEXT,
  image_url TEXT,
  subtitle TEXT,
  description TEXT,
  cost_usd NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'enabled',
  delivery_mode TEXT NOT NULL DEFAULT 'mixed',
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.go_inventory_accounts (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  account TEXT NOT NULL,
  password TEXT,
  vehicle_id TEXT,
  created_at_text TEXT,
  assigned_customer TEXT,
  order_id TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  expire_at TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.go_admin_orders (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  amount_usd NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at_text TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.go_tickets (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.go_suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  price_usd NUMERIC NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at_text TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.go_customers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  level TEXT NOT NULL DEFAULT '普通',
  orders_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  balance_usd NUMERIC NOT NULL DEFAULT 0,
  total_spent_usd NUMERIC NOT NULL DEFAULT 0,
  registered_at_text TEXT,
  last_login_at_text TEXT,
  source TEXT,
  risk_tag TEXT NOT NULL DEFAULT 'normal',
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.go_admin_operators (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.go_ip_pricing_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  target_type TEXT NOT NULL,
  target_value TEXT NOT NULL,
  product_id TEXT NOT NULL DEFAULT 'all',
  strategy TEXT NOT NULL DEFAULT 'manual',
  price_mode TEXT NOT NULL DEFAULT 'fixed',
  price_value NUMERIC NOT NULL DEFAULT 0,
  original_price_usd NUMERIC,
  min_price_usd NUMERIC,
  max_price_usd NUMERIC,
  rounding TEXT NOT NULL DEFAULT 'none',
  currency_hint TEXT,
  starts_at_text TEXT,
  ends_at_text TEXT,
  disclosure TEXT,
  risk_level TEXT NOT NULL DEFAULT 'normal',
  note TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.go_analytics_events (
  id TEXT PRIMARY KEY,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  ip TEXT NOT NULL,
  country TEXT,
  device TEXT,
  source TEXT,
  viewed_products TEXT[] NOT NULL DEFAULT '{}',
  home_views INTEGER NOT NULL DEFAULT 0,
  product_views INTEGER NOT NULL DEFAULT 0,
  checkout_adds INTEGER NOT NULL DEFAULT 0,
  paid_orders INTEGER NOT NULL DEFAULT 0,
  total_amount_usd NUMERIC NOT NULL DEFAULT 0,
  last_seen_at_text TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  note TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.go_site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  settings_payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.go_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.go_inventory_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.go_admin_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.go_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.go_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.go_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.go_admin_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.go_ip_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.go_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.go_site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read enabled products" ON public.go_products;
CREATE POLICY "Public can read enabled products" ON public.go_products
FOR SELECT TO anon, authenticated
USING (status = 'enabled' OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public can read enabled ip rules" ON public.go_ip_pricing_rules;
CREATE POLICY "Public can read enabled ip rules" ON public.go_ip_pricing_rules
FOR SELECT TO anon, authenticated
USING (enabled = true OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public can read site settings" ON public.go_site_settings;
CREATE POLICY "Public can read site settings" ON public.go_site_settings
FOR SELECT TO anon, authenticated
USING (true);

CREATE OR REPLACE VIEW public.go_public_products AS
SELECT
  id,
  title_key,
  category,
  price_usd,
  original_price_usd,
  color,
  badge,
  stock,
  delivery,
  image_url,
  subtitle,
  description,
  status,
  delivery_mode,
  sort_order,
  updated_at
FROM public.go_products
WHERE status = 'enabled';

CREATE OR REPLACE VIEW public.go_public_ip_pricing_rules AS
SELECT
  id,
  name,
  enabled,
  priority,
  target_type,
  target_value,
  product_id,
  strategy,
  price_mode,
  price_value,
  original_price_usd,
  min_price_usd,
  max_price_usd,
  rounding,
  currency_hint,
  starts_at_text,
  ends_at_text,
  disclosure,
  risk_level,
  updated_at
FROM public.go_ip_pricing_rules
WHERE enabled = true;

DROP POLICY IF EXISTS "Authenticated manage products" ON public.go_products;
CREATE POLICY "Authenticated manage products" ON public.go_products FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated manage inventory" ON public.go_inventory_accounts;
CREATE POLICY "Authenticated manage inventory" ON public.go_inventory_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated manage admin orders" ON public.go_admin_orders;
CREATE POLICY "Authenticated manage admin orders" ON public.go_admin_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated manage tickets" ON public.go_tickets;
CREATE POLICY "Authenticated manage tickets" ON public.go_tickets FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated manage suppliers" ON public.go_suppliers;
CREATE POLICY "Authenticated manage suppliers" ON public.go_suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated manage customers" ON public.go_customers;
CREATE POLICY "Authenticated manage customers" ON public.go_customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated manage operators" ON public.go_admin_operators;
CREATE POLICY "Authenticated manage operators" ON public.go_admin_operators FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated manage ip rules" ON public.go_ip_pricing_rules;
CREATE POLICY "Authenticated manage ip rules" ON public.go_ip_pricing_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated manage analytics" ON public.go_analytics_events;
CREATE POLICY "Authenticated manage analytics" ON public.go_analytics_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated manage settings" ON public.go_site_settings;
CREATE POLICY "Authenticated manage settings" ON public.go_site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT ON public.go_public_products TO anon, authenticated;
GRANT SELECT ON public.go_public_ip_pricing_rules TO anon, authenticated;
GRANT SELECT ON public.go_products TO authenticated;
GRANT SELECT ON public.go_ip_pricing_rules TO authenticated;
GRANT SELECT ON public.go_site_settings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.go_products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.go_inventory_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.go_admin_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.go_tickets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.go_suppliers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.go_customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.go_admin_operators TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.go_ip_pricing_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.go_analytics_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.go_site_settings TO authenticated;
