create extension if not exists "pgcrypto";

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'app_role') then
    create type public.app_role as enum ('admin', 'user');
  end if;
end
$$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
revoke execute on function public.has_role(uuid, public.app_role) from anon, public;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;
alter table public.user_roles enable row level security;

drop policy if exists "Users can view their own roles" on public.user_roles;
create policy "Users can view their own roles"
on public.user_roles for select to authenticated
using (auth.uid() = user_id);

create table if not exists public.product_details (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  monthly_price numeric not null default 0,
  original_price numeric not null default 0,
  month_options jsonb not null default '[1,3,6,12]'::jsonb,
  description text not null default '',
  big_headline text not null default '',
  big_sub text not null default '',
  features jsonb not null default '[]'::jsonb,
  how_it_works jsonb not null default '[]'::jsonb,
  highlights jsonb not null default '[]'::jsonb,
  feature_grid jsonb not null default '[]'::jsonb,
  overall_score numeric not null default 4.6,
  scores jsonb not null default '[]'::jsonb,
  pros jsonb not null default '[]'::jsonb,
  cons jsonb not null default '[]'::jsonb,
  reviews jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_details
  add column if not exists subscription_types jsonb not null default '[]'::jsonb,
  add column if not exists intro_badge text not null default '',
  add column if not exists how_it_works_title text not null default '',
  add column if not exists intro_body text not null default '',
  add column if not exists usage_title text not null default '',
  add column if not exists usage_guide jsonb not null default '[]'::jsonb;

grant select on public.product_details to anon;
grant select, insert, update, delete on public.product_details to authenticated;
grant all on public.product_details to service_role;
alter table public.product_details enable row level security;

drop policy if exists "Anyone can view product details" on public.product_details;
create policy "Anyone can view product details"
on public.product_details for select
using (true);

drop policy if exists "Admins can insert product details" on public.product_details;
create policy "Admins can insert product details"
on public.product_details for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can update product details" on public.product_details;
create policy "Admins can update product details"
on public.product_details for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can delete product details" on public.product_details;
create policy "Admins can delete product details"
on public.product_details for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop trigger if exists update_product_details_updated_at on public.product_details;
create trigger update_product_details_updated_at
before update on public.product_details
for each row execute function public.update_updated_at_column();

create table if not exists public.subscription_type_templates (
  id uuid not null default gen_random_uuid() primary key,
  name text not null,
  types jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.subscription_type_templates to authenticated;
grant all on public.subscription_type_templates to service_role;
alter table public.subscription_type_templates enable row level security;

drop policy if exists "Admins can view subscription templates" on public.subscription_type_templates;
create policy "Admins can view subscription templates"
on public.subscription_type_templates for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can insert subscription templates" on public.subscription_type_templates;
create policy "Admins can insert subscription templates"
on public.subscription_type_templates for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can update subscription templates" on public.subscription_type_templates;
create policy "Admins can update subscription templates"
on public.subscription_type_templates for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can delete subscription templates" on public.subscription_type_templates;
create policy "Admins can delete subscription templates"
on public.subscription_type_templates for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop trigger if exists update_subscription_type_templates_updated_at on public.subscription_type_templates;
create trigger update_subscription_type_templates_updated_at
before update on public.subscription_type_templates
for each row execute function public.update_updated_at_column();

create table if not exists public.affiliate_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  country text,
  channel_type text not null,
  channel_url text,
  audience_size text,
  promotion_plan text,
  payout_method text,
  contact text,
  note text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

grant select, insert on public.affiliate_applications to authenticated;
grant all on public.affiliate_applications to service_role;
alter table public.affiliate_applications enable row level security;

drop policy if exists "Users can submit their own application" on public.affiliate_applications;
create policy "Users can submit their own application"
on public.affiliate_applications for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can view their own applications" on public.affiliate_applications;
create policy "Users can view their own applications"
on public.affiliate_applications for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can view all applications" on public.affiliate_applications;
create policy "Admins can view all applications"
on public.affiliate_applications for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can update applications" on public.affiliate_applications;
create policy "Admins can update applications"
on public.affiliate_applications for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create table if not exists public.store_products (
  id uuid not null default gen_random_uuid() primary key,
  slug text not null unique,
  title text not null,
  category text not null default 'svod',
  price numeric not null default 0,
  original_price numeric not null default 0,
  cost numeric not null default 0,
  stock integer not null default 0,
  badge text not null default '',
  status text not null default 'active',
  delivery_method text not null default 'auto_manual',
  subtitle text not null default '',
  delivery_rules text not null default '',
  detail_description text not null default '',
  color text not null default 'bg-gradient-to-br from-blue-500 to-indigo-600',
  image_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.store_products to anon;
grant select on public.store_products to authenticated;
grant all on public.store_products to service_role;
grant insert, update, delete on public.store_products to authenticated;
alter table public.store_products enable row level security;

drop policy if exists "Anyone can view active store products" on public.store_products;
create policy "Anyone can view active store products"
on public.store_products for select to anon, authenticated
using (status = 'active');

drop policy if exists "Admins can view all store products" on public.store_products;
create policy "Admins can view all store products"
on public.store_products for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can insert store products" on public.store_products;
create policy "Admins can insert store products"
on public.store_products for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can update store products" on public.store_products;
create policy "Admins can update store products"
on public.store_products for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can delete store products" on public.store_products;
create policy "Admins can delete store products"
on public.store_products for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop trigger if exists update_store_products_updated_at on public.store_products;
create trigger update_store_products_updated_at
before update on public.store_products
for each row execute function public.update_updated_at_column();

do $$
begin
  begin
    alter publication supabase_realtime add table public.product_details;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.subscription_type_templates;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.store_products;
  exception when duplicate_object then null;
  end;
end
$$;
