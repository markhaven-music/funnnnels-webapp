-- ClickFunnels' orders, kept untouched after ClickFunnels ends (2026-11-16)
-- (applied to Supabase wsynmzewejgzugljqpky as migration "cf_orders_archive").
--
-- 2026-11-04: Orders → select all (no status filter) → Bulk actions → Export,
-- every field ticked: 1,130 orders, 2025-11-26 to 2026-11-02, 49 columns
-- (paid 822, abandoned 269, past-due 12, refunded 11, pending 10, disputed 4,
-- partially-refunded 2; all EUR). Payment ids are Stripe/PayPal's, for
-- disputes and refunds after ClickFunnels is gone.
--
-- cf_exports holds the file as downloaded (byte for byte, with its sha256);
-- cf_orders one row per order: a few columns to query by, and `raw` with
-- every column of the file as ClickFunnels wrote it. Nothing reads these in
-- the app; they're an archive. Holds names, emails and addresses:
-- RLS on, no policies, so only the service role reads them.

create table public.cf_exports (
  name text primary key,
  exported_at timestamptz not null,
  rows int not null,
  sha256 text not null,
  csv text not null,
  created_at timestamptz not null default now()
);
alter table public.cf_exports enable row level security;

create table public.cf_orders (
  id text primary key,                 -- ClickFunnels' order id
  order_number int not null,
  created_at timestamptz not null,
  email text,
  billing_status text,
  total_collected numeric,
  currency text,
  funnel_name text,
  raw jsonb not null
);
create index cf_orders_email on public.cf_orders (lower(email));
alter table public.cf_orders enable row level security;
