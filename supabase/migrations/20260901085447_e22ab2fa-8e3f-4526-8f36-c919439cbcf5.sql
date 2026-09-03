create table public.affiliate_applications (
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
create policy "Users can submit their own application"
  on public.affiliate_applications for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Users can view their own applications"
  on public.affiliate_applications for select to authenticated
  using (auth.uid() = user_id);
create policy "Admins can view all applications"
  on public.affiliate_applications for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update applications"
  on public.affiliate_applications for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));