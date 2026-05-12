-- Dialawhip schema. Idempotent: safe to re-run.
-- Auth users live in auth.users (managed by Supabase). public.profiles extends them.

create extension if not exists "pgcrypto";

-- ============================================================================
-- Enums
-- ============================================================================
do $$ begin
  create type user_role as enum ('customer','staff','admin','driver');
exception when duplicate_object then null; end $$;

do $$ begin
  create type verification_status as enum ('unverified','pending','verified','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('pending','confirmed','in_prep','out_for_delivery','delivered','failed','cancelled','refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type delivery_tier as enum ('standard','priority','super');
exception when duplicate_object then null; end $$;

do $$ begin
  create type doc_type as enum ('passport','driving_licence','residency_card','citizen_card','military_id');
exception when duplicate_object then null; end $$;

do $$ begin
  create type id_verification_status as enum ('pending','approved','rejected','expired');
exception when duplicate_object then null; end $$;
do $$ begin
  alter type id_verification_status add value if not exists 'expired';
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_channel as enum ('email','sms');
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_direction as enum ('outbound','inbound');
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_status as enum ('queued','sent','delivered','failed');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- profiles (extends auth.users)
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  phone text,
  role user_role not null default 'customer',
  verification_status verification_status not null default 'unverified',
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_verification_status_idx on public.profiles(verification_status);

-- Auto-create a profile when an auth user is created.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- addresses
-- ============================================================================
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  line1 text not null,
  line2 text,
  city text not null,
  postcode text not null check (char_length(postcode) <= 16),
  latitude numeric(10,7),
  longitude numeric(10,7),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists addresses_user_default_idx on public.addresses(user_id, is_default);

-- ============================================================================
-- categories
-- ============================================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists categories_active_sort_idx on public.categories(is_active, sort_order);

-- ============================================================================
-- products
-- ============================================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  brand text,
  slug text not null unique,
  description text,
  price_pence integer not null,
  image_url text,
  gallery_urls jsonb,
  options_json jsonb,
  short_spec jsonb,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_age_restricted boolean not null default false,
  available_from time,
  available_until time,
  stock_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists products_category_active_idx on public.products(category_id, is_active);
create index if not exists products_brand_active_idx on public.products(brand, is_active);
create index if not exists products_age_active_idx on public.products(is_age_restricted, is_active);
create index if not exists products_featured_active_idx on public.products(is_featured, is_active) where deleted_at is null;
create unique index if not exists products_one_featured_idx on public.products((is_featured)) where is_featured = true and deleted_at is null;

-- ============================================================================
-- product_variants
-- ============================================================================
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null,
  price_pence integer not null,
  qty_multiplier integer not null default 1,
  stock_count integer,
  sku text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, label)
);
create index if not exists product_variants_product_idx on public.product_variants(product_id, is_active, sort_order);

-- ============================================================================
-- orders
-- ============================================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  address_id uuid references public.addresses(id) on delete set null,
  assigned_driver_id uuid references public.profiles(id) on delete set null,
  status order_status not null default 'pending',
  delivery_tier delivery_tier not null default 'standard',
  subtotal_pence integer not null,
  delivery_fee_pence integer not null default 0,
  vat_pence integer not null default 0,
  total_pence integer not null,
  statement_of_use_accepted boolean not null default false,
  n2o_agreement_accepted boolean not null default false,
  scheduled_for timestamptz,
  customer_notes text,
  driver_notes text,
  stripe_session_id text,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  stripe_balance_transaction_id text,
  paid_at timestamptz,
  amount_paid_pence integer,
  payment_currency text,
  card_brand text,
  card_last4 text,
  payment_method_type text,
  receipt_url text,
  refund_id text,
  refunded_at timestamptz,
  amount_refunded_pence integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_customer_idx on public.orders(customer_id, created_at desc);
create index if not exists orders_status_idx on public.orders(status, created_at desc);
create index if not exists orders_driver_idx on public.orders(assigned_driver_id, status);
create index if not exists orders_stripe_session_idx on public.orders(stripe_session_id);
create index if not exists orders_stripe_charge_idx on public.orders(stripe_charge_id);
create index if not exists orders_stripe_balance_txn_idx on public.orders(stripe_balance_transaction_id);
create index if not exists orders_tier_status_idx on public.orders(delivery_tier, status);

-- ============================================================================
-- order_items
-- ============================================================================
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_variant_id uuid references public.product_variants(id) on delete set null,
  variant_label text,
  product_snapshot_json jsonb not null,
  quantity integer not null,
  unit_price_pence integer not null,
  line_total_pence integer not null,
  options_json jsonb,
  statement_category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists order_items_variant_idx on public.order_items(product_variant_id);

-- ============================================================================
-- order_events
-- ============================================================================
create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists order_events_order_idx on public.order_events(order_id, created_at);

-- ============================================================================
-- messages
-- ============================================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  channel message_channel not null,
  direction message_direction not null,
  template_key text,
  content text not null,
  provider_id text,
  status message_status not null default 'queued',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists messages_customer_idx on public.messages(customer_id, created_at);
create index if not exists messages_order_idx on public.messages(order_id, created_at);
create index if not exists messages_provider_idx on public.messages(provider_id);

-- ============================================================================
-- service_areas
-- ============================================================================
create table if not exists public.service_areas (
  id uuid primary key default gen_random_uuid(),
  postcode_prefix text not null unique check (char_length(postcode_prefix) <= 8),
  delivery_fee_pence integer not null,
  eta_standard_minutes integer not null default 25,
  eta_priority_minutes integer not null default 12,
  priority_fee_pence integer not null default 500,
  super_fee_pence integer not null default 1500,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists service_areas_active_prefix_idx on public.service_areas(is_active, postcode_prefix);

-- ============================================================================
-- id_verifications
-- ============================================================================
create table if not exists public.id_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  doc_type doc_type not null,
  file_path text not null,
  mime_type text not null,
  size_bytes bigint not null,
  status id_verification_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  expires_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists id_verifications_user_status_idx on public.id_verifications(user_id, status);
create index if not exists id_verifications_status_idx on public.id_verifications(status, created_at);

-- ============================================================================
-- settings
-- ============================================================================
create table if not exists public.settings (
  key text primary key,
  value jsonb,
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- idempotency_keys
-- ============================================================================
create table if not exists public.idempotency_keys (
  key text primary key,
  user_id uuid references public.profiles(id) on delete set null,
  response_hash text not null,
  response_status integer not null,
  response_body jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idempotency_keys_created_idx on public.idempotency_keys(created_at);

-- ============================================================================
-- stripe_events
-- ============================================================================
create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists stripe_events_type_idx on public.stripe_events(type);

-- ============================================================================
-- order_reference_seq: monotonic counter per year for order references
-- ============================================================================
create table if not exists public.order_reference_counters (
  year integer primary key,
  next_value integer not null default 1
);

create or replace function public.next_order_reference(prefix text default 'CAT')
returns text language plpgsql set search_path = public as $$
declare
  yr integer := extract(year from now())::int;
  v integer;
begin
  insert into public.order_reference_counters(year, next_value) values (yr, 1)
  on conflict (year) do update set next_value = public.order_reference_counters.next_value + 1
  returning next_value into v;
  return prefix || '-' || yr::text || '-' || lpad(v::text, 4, '0');
end $$;

-- ============================================================================
-- updated_at triggers
-- ============================================================================
create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

do $$ declare t text; begin
  for t in select unnest(array[
    'profiles','addresses','categories','products','product_variants',
    'orders','order_items','service_areas','id_verifications'
  ]) loop
    execute format('drop trigger if exists touch_%1$s_updated_at on public.%1$s;', t);
    execute format('create trigger touch_%1$s_updated_at before update on public.%1$s for each row execute function public.touch_updated_at();', t);
  end loop;
end $$;

-- ============================================================================
-- RLS: enable on all tables. The Next.js backend uses the service role key
-- and bypasses RLS - these policies provide defence in depth for any direct
-- Supabase access (e.g. anon key from the browser).
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.messages enable row level security;
alter table public.service_areas enable row level security;
alter table public.id_verifications enable row level security;
alter table public.settings enable row level security;
alter table public.idempotency_keys enable row level security;
alter table public.stripe_events enable row level security;
alter table public.order_reference_counters enable row level security;

-- Public read of catalogue + service areas + public settings (anon can browse).
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories for select using (is_active = true);

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products for select using (is_active = true and deleted_at is null);

drop policy if exists product_variants_public_read on public.product_variants;
create policy product_variants_public_read on public.product_variants for select using (is_active = true);

drop policy if exists service_areas_public_read on public.service_areas;
create policy service_areas_public_read on public.service_areas for select using (is_active = true);

-- Self-read of own profile / addresses / orders.
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles for select using (auth.uid() = id);

drop policy if exists addresses_self on public.addresses;
create policy addresses_self on public.addresses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists orders_self_read on public.orders;
create policy orders_self_read on public.orders for select using (auth.uid() = customer_id);

drop policy if exists order_items_self_read on public.order_items;
create policy order_items_self_read on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid())
);

drop policy if exists id_verifications_self_read on public.id_verifications;
create policy id_verifications_self_read on public.id_verifications for select using (auth.uid() = user_id);

-- ============================================================================
-- Storage buckets (run once)
-- ============================================================================
insert into storage.buckets (id, name, public)
  values ('product-images','product-images', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('settings-assets','settings-assets', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('id-verifications','id-verifications', false)
  on conflict (id) do nothing;
