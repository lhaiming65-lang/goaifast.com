CREATE TABLE IF NOT EXISTS public.admin_site_store (
  id TEXT PRIMARY KEY DEFAULT 'default',
  admin_payload JSONB NOT NULL,
  public_payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_site_store ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read admin site store" ON public.admin_site_store;
CREATE POLICY "Authenticated users can read admin site store"
ON public.admin_site_store
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can write admin site store" ON public.admin_site_store;
CREATE POLICY "Authenticated users can write admin site store"
ON public.admin_site_store
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE OR REPLACE VIEW public.public_site_store AS
SELECT id, public_payload, updated_at
FROM public.admin_site_store;

GRANT SELECT ON public.public_site_store TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_site_store TO authenticated;
