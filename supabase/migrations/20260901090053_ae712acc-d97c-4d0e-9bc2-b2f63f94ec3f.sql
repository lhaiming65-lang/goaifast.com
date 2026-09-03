CREATE TABLE public.store_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'svod',
  price numeric NOT NULL DEFAULT 0,
  original_price numeric NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  badge text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  delivery_method text NOT NULL DEFAULT 'auto_manual',
  subtitle text NOT NULL DEFAULT '',
  delivery_rules text NOT NULL DEFAULT '',
  detail_description text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT 'bg-gradient-to-br from-blue-500 to-indigo-600',
  image_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.store_products TO anon;
GRANT SELECT ON public.store_products TO authenticated;
GRANT ALL ON public.store_products TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.store_products TO authenticated;

ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active store products" ON public.store_products
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

CREATE POLICY "Admins can view all store products" ON public.store_products
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert store products" ON public.store_products
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update store products" ON public.store_products
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete store products" ON public.store_products
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_store_products_updated_at BEFORE UPDATE ON public.store_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.store_products;
