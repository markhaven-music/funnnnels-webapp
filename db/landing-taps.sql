-- Taps on a landing's buttons and the answers to its pop-up, applied as migration "landing_taps"
-- (2026-11-17, "com'è possibile che nessuno sta andando all'order page midi drum kit": between the
-- button and the order page there is a pop-up, and nothing said who tapped and who left there).
-- The landings send them to /api/checkout/here as "tap" pings (lib/beacon.ts __fvTap):
--   cta    a button to the order page was tapped (n: which one on the page, 1 = the first)
--   yes    the pop-up's Yes
--   no     the pop-up's No
--   close  the pop-up closed with no answer (tap outside, ×, Escape)
-- sid is the browser's random id of the live tracking (live_events.sid); variant the landing test's
-- letter when the funnel has one. Owner devices, previews and bots never get here. RLS on, no
-- policies: server only. Read by dashboard → Analytics → "Button taps" (lib/analytics.ts tapStats).

create table public.landing_taps (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  sid text not null,
  host text not null default '',
  funnel text not null,
  lang text not null default 'en',
  step text not null,
  n smallint not null default 0,
  variant text not null default ''
);
create index landing_taps_funnel_at_idx on public.landing_taps (funnel, at);
alter table public.landing_taps enable row level security;

-- Kept 30 days, as live_events.
select cron.schedule(
  'funnnnels-taps-prune',
  '29 3 * * *',
  $$ delete from public.landing_taps where at < now() - interval '30 days'; $$
);

-- Undo: select cron.unschedule('funnnnels-taps-prune'); drop table public.landing_taps;
