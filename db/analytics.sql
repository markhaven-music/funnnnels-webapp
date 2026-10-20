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
