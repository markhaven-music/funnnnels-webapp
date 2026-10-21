-- Orders and checkout starts (applied to Supabase wsynmzewejgzugljqpky as migration "orders").
-- RLS on, no policies: only the server (service role) reads or writes.
-- Money is in cents.

-- One row per paid order: the Stripe PaymentIntent id (pi_…) or the PayPal
-- order id is the primary key, so the webhook, the PayPal return and the
-- thank-you page can all record the same order without duplicating it.
create table public.orders (
  id text primary key,
  provider text not null check (provider in ('stripe', 'paypal')),
  funnel text not null,
  -- File keys the order unlocks: ["pack"] or ["pack", "<bump id>"]
  items jsonb not null default '["pack"]'::jsonb,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null check (currency in ('eur', 'usd')),
  email text,
  name text,
  country text,
  status text not null default 'succeeded',
  -- The buyer ticked "start the download now, I lose the 14-day withdrawal right" (EU).
  withdrawal_waiver boolean not null default false,
  -- Set when the order email went out; claimed atomically so it's sent once.
  email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_buyer_idx on public.orders (funnel, lower(email));
alter table public.orders enable row level security;

-- Step 1 of the checkout (name + email), per product: what the abandoned-checkout
-- reminder works from. One row per product and email; started_at moves with
-- every new attempt, reminder_sent_at is set once and never cleared.
create table public.checkout_starts (
  funnel text not null,
  email text not null check (email = lower(email)),
  name text,
  started_at timestamptz not null default now(),
  reminder_sent_at timestamptz,
  primary key (funnel, email)
);
create index checkout_starts_due_idx on public.checkout_starts (started_at) where reminder_sent_at is null;
alter table public.checkout_starts enable row level security;
