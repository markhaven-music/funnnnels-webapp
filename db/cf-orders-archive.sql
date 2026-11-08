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

-- ─── final export, 2026-11-08 (migration "cf_final_export") ───────────
-- No ClickFunnels order was paid after #2137 (2026-10-31); later rows in its
-- Payments list are declined cards. That list (1,226 transactions with the
-- decline codes, 13 refunds) is the cf_exports row
-- "clickfunnels-payments-2026-11-08.json" (data = {head, rows} as on screen).
-- The contacts list (4,728 addresses: status, tags, LTV, date added) is
-- "clickfunnels-contacts-2026-11-08.json"; its date added is contacts.cf_added_at
-- (contacts.created_at of a ClickFunnels import is the import day).
-- cf_broadcasts: every broadcast ClickFunnels sent (128, 2025-11-28 to
-- 2026-11-08) plus the paused and scheduled ones, with the email's HTML and
-- the stats line of its report (delivered, opened, clicked, unsubscribed).
alter table public.cf_exports alter column csv drop not null;
alter table public.cf_exports add column if not exists data jsonb;
alter table public.contacts add column if not exists cf_added_at timestamptz;
create table if not exists public.cf_broadcasts (
  id text primary key,           -- ClickFunnels' broadcast id
  name text not null,            -- name + preview line as listed
  status text,                   -- Complete / Paused / Scheduled
  send_at text,                  -- as ClickFunnels shows it (Budapest clock)
  sent_at timestamptz,
  stats text,
  html text,
  created_at timestamptz not null default now()
);
alter table public.cf_broadcasts enable row level security;
