CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE TABLE public.product_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  monthly_price numeric NOT NULL DEFAULT 0,
  original_price numeric NOT NULL DEFAULT 0,
  month_options jsonb NOT NULL DEFAULT '[1,3,6,12]'::jsonb,
  description text NOT NULL DEFAULT '',
  big_headline text NOT NULL DEFAULT '',
  big_sub text NOT NULL DEFAULT '',
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  how_it_works jsonb NOT NULL DEFAULT '[]'::jsonb,
  highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  feature_grid jsonb NOT NULL DEFAULT '[]'::jsonb,
  overall_score numeric NOT NULL DEFAULT 4.6,
  scores jsonb NOT NULL DEFAULT '[]'::jsonb,
  pros jsonb NOT NULL DEFAULT '[]'::jsonb,
  cons jsonb NOT NULL DEFAULT '[]'::jsonb,
  reviews jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_details TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_details TO authenticated;
GRANT ALL ON public.product_details TO service_role;

ALTER TABLE public.product_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product details"
ON public.product_details FOR SELECT
USING (true);

CREATE POLICY "Admins can insert product details"
ON public.product_details FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product details"
ON public.product_details FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product details"
ON public.product_details FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_product_details_updated_at
BEFORE UPDATE ON public.product_details
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.product_details;