-- Funnel analytics (applied to Supabase wsynmzewejgzugljqpky as migration "funnel_analytics").
-- First-party page views and PayPal sales, for dashboard → Analytics.
-- RLS on, no policies: only the server (service role) reads or writes.

-- Unique visitors per day: the browser sends one beacon per page per day
-- (app/api/checkout/view), and the row for that day and those dimensions
-- counts it. No visitor id is stored.
create table public.page_views (
  day date not null,
  funnel text not null,
  page text not null check (page in ('landing', 'order', 'checkout', 'thank-you')),
  lang text not null default 'en',
  variant text not null default '',
  country text not null default '',
  views integer not null default 0,
  primary key (day, funnel, page, lang, variant, country)
);
alter table public.page_views enable row level security;

create function public.count_page_view(p_funnel text, p_page text, p_lang text, p_variant text, p_country text)
returns void
language sql
set search_path = ''
as $$
  insert into public.page_views (day, funnel, page, lang, variant, country, views)
  values ((now() at time zone 'utc')::date, p_funnel, p_page, p_lang, p_variant, p_country, 1)
  on conflict (day, funnel, page, lang, variant, country)
  do update set views = public.page_views.views + 1;
$$;

-- Totals since a day (null = all time), small enough to return in one go.
create function public.page_view_totals(p_since date)
returns table (funnel text, page text, lang text, variant text, views bigint)
language sql
stable
set search_path = ''
as $$
  select funnel, page, lang, variant, sum(views)::bigint
  from public.page_views
  where p_since is null or day >= p_since
  group by funnel, page, lang, variant;
$$;

-- PayPal has no search API for orders, so each captured order is noted here
-- when the buyer comes back from PayPal (app/api/checkout/paypal/return).
-- Stripe orders are read from Stripe itself (metadata.funnel).
create table public.paypal_sales (
  order_id text primary key,
  funnel text not null,
  lang text not null default 'en',
  variant text not null default '',
  country text not null default '',
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null check (currency in ('eur', 'usd')),
  created_at timestamptz not null default now()
);
create index paypal_sales_created_idx on public.paypal_sales (created_at desc);
alter table public.paypal_sales enable row level security;

revoke all on function public.count_page_view(text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.page_view_totals(date) from public, anon, authenticated;
grant execute on function public.count_page_view(text, text, text, text, text) to service_role;
grant execute on function public.page_view_totals(date) to service_role;

-- One-click upsells (migration "funnel_analytics_upsells", 2026-10-20): their
-- pages are counted, and PayPal sales say which upsell they were.
alter table public.page_views drop constraint page_views_page_check;
alter table public.page_views add constraint page_views_page_check
  check (page in ('landing', 'order', 'checkout', 'upsell-1', 'upsell-2', 'thank-you'));
alter table public.paypal_sales add column offer text not null default '';
alter table public.paypal_sales add column parent text;

-- Third upsell (migration "funnel_analytics_upsell_3", 2026-11-11): the Drum
-- Kit's upsell-3 step (added 11-08) was refused by the check above, so its
-- views were never counted.
alter table public.page_views drop constraint page_views_page_check;
alter table public.page_views add constraint page_views_page_check
  check (page in ('landing', 'order', 'checkout', 'upsell-1', 'upsell-2', 'upsell-3', 'thank-you'));

-- Bots (migration "funnel_analytics_bots", 2026-10-21): beacons that
-- lib/bots.ts turned away (Meta's ad reviewers, crawlers, headless browsers)
-- are not counted in page_views; this only notes how many, and why.
create table public.bot_views (
  day date not null,
  funnel text not null,
  page text not null,
  reason text not null,
  views integer not null default 0,
  primary key (day, funnel, page, reason)
);
alter table public.bot_views enable row level security;

create function public.count_bot_view(p_funnel text, p_page text, p_reason text)
returns void
language sql
set search_path = ''
as $$
  insert into public.bot_views (day, funnel, page, reason, views)
  values ((now() at time zone 'utc')::date, p_funnel, p_page, p_reason, 1)
  on conflict (day, funnel, page, reason)
  do update set views = public.bot_views.views + 1;
$$;
revoke all on function public.count_bot_view(text, text, text) from public, anon, authenticated;
grant execute on function public.count_bot_view(text, text, text) to service_role;

-- Visitors per day and funnel step, for the dashboard home's charts
-- (applied as migrations "page_view_days" and "page_view_days_grants").
create function public.page_view_days(p_since date)
returns table (day date, funnel text, page text, views bigint)
language sql
stable
set search_path = ''
as $$
  select day, funnel, page, sum(views)::bigint
  from public.page_views
  where p_since is null or day >= p_since
  group by day, funnel, page;
$$;
revoke all on function public.page_view_days(date) from public, anon, authenticated;
grant execute on function public.page_view_days(date) to service_role;

-- Processor fees (migration "paypal_sales_fees", 2026-11-03), for the net
-- revenue: PayPal's fee on each capture, in the sale's currency, read from the
-- capture's seller_receivable_breakdown. Null until known; lib/analytics.ts
-- fills the missing ones from PayPal. Stripe's fees are read from Stripe.
alter table public.paypal_sales add column fee_cents integer check (fee_cents >= 0);
