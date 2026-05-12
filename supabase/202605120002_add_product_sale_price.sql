-- Sale price overrides the regular `price_pence` when set. Stored on
-- products (single-price) and product_variants (per-option discount).
alter table public.products
  add column if not exists sale_price_pence integer;

alter table public.product_variants
  add column if not exists sale_price_pence integer;

-- A sale price must be strictly less than the regular price when present.
alter table public.products
  drop constraint if exists products_sale_price_lt_price;
alter table public.products
  add constraint products_sale_price_lt_price
  check (sale_price_pence is null or sale_price_pence < price_pence);

alter table public.product_variants
  drop constraint if exists product_variants_sale_price_lt_price;
alter table public.product_variants
  add constraint product_variants_sale_price_lt_price
  check (sale_price_pence is null or sale_price_pence < price_pence);

create index if not exists products_on_sale_idx
  on public.products(category_id)
  where sale_price_pence is not null and is_active = true and deleted_at is null;
