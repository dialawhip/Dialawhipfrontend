-- Per-line buyer-declared Statement of Use category, captured at add-to-bag
-- on the product page and persisted with each order line.
alter table public.order_items
  add column if not exists statement_category text;
