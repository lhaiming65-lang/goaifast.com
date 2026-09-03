ALTER TABLE public.product_details
  ADD COLUMN IF NOT EXISTS intro_badge text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS how_it_works_title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS intro_body text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS usage_title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS usage_guide jsonb NOT NULL DEFAULT '[]'::jsonb;