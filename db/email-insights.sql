-- Email insights (applied to Supabase wsynmzewejgzugljqpky as migration "email_insights").
-- What the emails bring in, for dashboard → Email → Insights (lib/emailStats.ts):
-- clicks on their links, and which orders followed them. Builds on
-- db/email.sql and db/orders.sql.
-- RLS on, no policies: only the server (service role) reads or writes.
-- Addresses @example.com are tests (they can't receive mail): left out of
-- every number (migration "email_insights_skip_tests").

-- ─── the abandoned-checkout reminder is a send too ─────────────────
-- One per product and person ever (checkout_starts), so ref = the product's
-- slug fits email_sends' key. lib/outbox.ts notes it once SES took it.
alter table public.email_sends drop constraint email_sends_kind_check;
alter table public.email_sends add constraint email_sends_kind_check
  check (kind in ('broadcast', 'launch', 'sequence', 'reminder'));
-- The last email someone got before an order or an unsubscribe.
create index email_sends_sent_idx on public.email_sends (email, created_at desc) where status = 'sent';

-- ─── email_clicks: one row per click on a link in an email ─────────
-- The links of broadcasts, sequences, launch emails and the reminder go
-- through /api/checkout/go (lib/mail.ts clickUrl), which notes the click here
-- and sends the reader on. Link scanners and bots (lib/bots.ts) go on without
-- a row.
create table public.email_clicks (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('broadcast', 'launch', 'sequence', 'reminder')),
  ref text not null,
  email text not null,
  url text not null,
  created_at timestamptz not null default now()
);
create index email_clicks_email_idx on public.email_clicks (email, created_at desc);
create index email_clicks_ref_idx on public.email_clicks (kind, ref);
alter table public.email_clicks enable row level security;

-- ─── which email an order came from ────────────────────────────────
-- Every paid order since p_since (null = all), and the email it's credited to:
--   'click'     the buyer clicked a link in it in the p_days before paying
--               (the last email clicked wins);
--   'received'  no click, but it reached them in those days (the last one);
--   null        neither.
-- A one-click upsell is judged at the time of the order it followed, so an
-- email that landed in between never takes the credit.
create function public.email_attribution(p_since timestamptz, p_days integer default 5)
returns table (order_id text, amount_cents integer, currency text, offer text, created_at timestamptz, kind text, ref text, how text)
language sql
stable
set search_path = ''
as $$
  with o as (
    select o.id, o.amount_cents, o.currency, o.offer, o.created_at, o.email,
           least(o.created_at, coalesce(p.created_at, o.created_at)) as at
    from public.orders o
    left join public.orders p on p.id = o.parent
    where o.status = 'succeeded'
      and o.email is not null
      and o.email not like '%@example.com'
      and (p_since is null or o.created_at >= p_since)
  )
  select o.id, o.amount_cents, o.currency, o.offer, o.created_at,
         coalesce(c.kind, s.kind), coalesce(c.ref, s.ref),
         case when c.kind is not null then 'click' when s.kind is not null then 'received' end
  from o
  left join lateral (
    select k.kind, k.ref from public.email_clicks k
    where k.email = o.email and k.created_at <= o.at and k.created_at > o.at - make_interval(days => p_days)
    order by k.created_at desc
    limit 1
  ) c on true
  left join lateral (
    select e.kind, e.ref from public.email_sends e
    where c.kind is null
      and e.email = o.email and e.status = 'sent'
      and e.created_at <= o.at and e.created_at > o.at - make_interval(days => p_days)
    order by e.created_at desc
    limit 1
  ) s on true;
$$;

-- ─── per email: sent, clicked, left ────────────────────────────────
-- Since p_since (null = all), for each broadcast, launch email, sequence step
-- and reminder (kind, ref): emails sent and failed, people who clicked,
-- clicks, and the unsubscribes it caused (the last email someone got in the
-- 7 days before leaving).
create function public.email_stats(p_since timestamptz)
returns table (kind text, ref text, sent bigint, failed bigint, clickers bigint, clicks bigint, unsubscribed bigint)
language sql
stable
set search_path = ''
as $$
  with sends as (
    select s.kind, s.ref,
           count(*) filter (where s.status = 'sent') as sent,
           count(*) filter (where s.status = 'failed') as failed
    from public.email_sends s
    where (p_since is null or s.created_at >= p_since)
      and s.email not like '%@example.com'
    group by 1, 2
  ),
  clicks as (
    select k.kind, k.ref, count(distinct k.email) as clickers, count(*) as clicks
    from public.email_clicks k
    where (p_since is null or k.created_at >= p_since)
      and k.email not like '%@example.com'
    group by 1, 2
  ),
  lefts as (
    select l.kind, l.ref, count(*) as unsubscribed
    from public.contacts c
    cross join lateral (
      select e.kind, e.ref from public.email_sends e
      where e.email = c.email and e.status = 'sent'
        and e.created_at <= c.unsubscribed_at and e.created_at > c.unsubscribed_at - interval '7 days'
      order by e.created_at desc
      limit 1
    ) l
    where c.status = 'unsubscribed'
      and c.unsubscribed_at is not null
      and c.email not like '%@example.com'
      and (p_since is null or c.unsubscribed_at >= p_since)
    group by 1, 2
  ),
  sc as (
    select coalesce(s.kind, k.kind) as kind, coalesce(s.ref, k.ref) as ref,
           coalesce(s.sent, 0) as sent, coalesce(s.failed, 0) as failed,
           coalesce(k.clickers, 0) as clickers, coalesce(k.clicks, 0) as clicks
    from sends s
    full join clicks k on k.kind = s.kind and k.ref = s.ref
  )
  select coalesce(sc.kind, l.kind), coalesce(sc.ref, l.ref),
         coalesce(sc.sent, 0), coalesce(sc.failed, 0), coalesce(sc.clickers, 0), coalesce(sc.clicks, 0),
         coalesce(l.unsubscribed, 0)
  from sc
  full join lefts l on l.kind = sc.kind and l.ref = sc.ref;
$$;

revoke execute on function public.email_attribution(timestamptz, integer) from public, anon, authenticated;
revoke execute on function public.email_stats(timestamptz) from public, anon, authenticated;
