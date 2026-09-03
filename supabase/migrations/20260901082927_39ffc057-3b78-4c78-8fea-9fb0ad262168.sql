CREATE TABLE public.subscription_type_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  types JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_type_templates TO authenticated;
GRANT ALL ON public.subscription_type_templates TO service_role;

ALTER TABLE public.subscription_type_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view subscription templates"
  ON public.subscription_type_templates FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert subscription templates"
  ON public.subscription_type_templates FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update subscription templates"
  ON public.subscription_type_templates FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete subscription templates"
  ON public.subscription_type_templates FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_subscription_type_templates_updated_at
  BEFORE UPDATE ON public.subscription_type_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.subscription_type_templates;