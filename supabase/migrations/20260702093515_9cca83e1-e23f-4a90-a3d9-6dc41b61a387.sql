
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_no TEXT NOT NULL UNIQUE,
  product_title TEXT NOT NULL,
  product_color TEXT,
  product_initial TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_usd NUMERIC(12,4) NOT NULL DEFAULT 0,
  discount_usd NUMERIC(12,4) NOT NULL DEFAULT 0,
  fee_usd NUMERIC(12,4) NOT NULL DEFAULT 0,
  total_usd NUMERIC(12,4) NOT NULL DEFAULT 0,
  payment_method TEXT,
  delivery_email TEXT,
  status TEXT NOT NULL DEFAULT 'paid',
  placed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_orders_user_id_placed_at ON public.orders(user_id, placed_at DESC);

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
