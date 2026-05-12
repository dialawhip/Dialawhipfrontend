-- Capture Stripe charge + balance transaction ids on orders so we can
-- reconcile against the Stripe dashboard and surface the txn key in the
-- admin UI without re-querying Stripe on every render.
alter table public.orders
  add column if not exists stripe_charge_id text,
  add column if not exists stripe_balance_transaction_id text;

create index if not exists orders_stripe_charge_idx
  on public.orders(stripe_charge_id);
create index if not exists orders_stripe_balance_txn_idx
  on public.orders(stripe_balance_transaction_id);
