-- Email opens, and clicks on the receipts (applied to Supabase wsynmzewejgzugljqpky as migration "email_opens").
-- Builds on db/email-insights.sql. RLS on, no policies: only the server reads or writes.

-- ─── email_opens: one row per open of a tracked email ──────────────
-- Every email with a `track` (lib/mail.ts) carries an invisible 1×1 image,
-- /api/checkout/open?t=<signed kind, ref, address>, and the mail app loading
-- it lands here: broadcasts, launch emails, sequence steps, reminders, and
-- the order's receipt and backup email (ref = the main order's id).
-- machine says the open may not be a person:
--   'apple'    Apple Mail Privacy Protection loads every email's images on
--              delivery through Apple's proxy (user agent "Mozilla/5.0" alone),
--              read or not;
--   'scanner'  a link/security scanner or other bot user agent.
-- Gmail and Yahoo load images through their proxies only when the email is
-- opened: those count as real opens. A repeat open within a minute is skipped
-- when it can be (two loads milliseconds apart both land); dashboard → Orders
-- counts loads under a minute apart as one open (lib/orderDetail.ts).
create table public.email_opens (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('broadcast', 'launch', 'sequence', 'reminder', 'receipt', 'backup')),
  ref text not null,
  email text not null,
  machine text check (machine in ('apple', 'scanner')),
  user_agent text,
  created_at timestamptz not null default now()
);
create index email_opens_email_idx on public.email_opens (email, created_at desc);
create index email_opens_ref_idx on public.email_opens (kind, ref);
alter table public.email_opens enable row level security;

-- ─── the receipt's and the backup's download buttons are clicks too ─
alter table public.email_clicks drop constraint email_clicks_kind_check;
alter table public.email_clicks add constraint email_clicks_kind_check
  check (kind in ('broadcast', 'launch', 'sequence', 'reminder', 'receipt', 'backup'));

-- … but a download is not what sold an order: Email → Insights keeps
-- crediting and counting only the emails that sell (email_attribution,
-- email_stats as in db/email-insights.sql, clicks limited to those kinds).
create or replace function public.email_attribution(p_since timestamptz, p_days integer default 5)
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
      and k.kind in ('broadcast', 'launch', 'sequence', 'reminder')
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

create or replace function public.email_stats(p_since timestamptz)
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
      and k.kind in ('broadcast', 'launch', 'sequence', 'reminder')
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
