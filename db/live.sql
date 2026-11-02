-- Live activity (dashboard → Live), applied as migration "live_activity".
-- Who is on a buyer page right now, where they are, which page, and each page
-- they open. The pages ping /api/checkout/here (lib/beacon.ts LIVE_JS):
--   view   a page opened (or the checkout's step 1 filled in)
--   beat   every 20 s while the tab is in front
--   leave  the tab went to the background or closed
-- Bots never get this far (lib/bots.ts). RLS on, no policies: server only.

-- One row per browser: a random id it keeps in localStorage, nothing else
-- about the person. The session restarts after 30 minutes away.
create table public.live_visitors (
  sid text primary key,
  first_seen timestamptz not null default now(),
  session_start timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  left_at timestamptz,
  host text not null default '',
  funnel text not null,
  page text not null,
  lang text not null default 'en',
  path text not null default '',
  country text not null default '',
  region text not null default '',
  city text not null default '',
  lat real,
  lon real,
  device text not null default '',
  source text not null default '',
  campaign text not null default '',
  views integer not null default 0 -- pages opened this session
);
create index live_visitors_seen_idx on public.live_visitors (last_seen desc);
alter table public.live_visitors enable row level security;

-- Each page opened, with where the visitor is and came from.
create table public.live_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  sid text not null,
  host text not null default '',
  funnel text not null,
  page text not null,
  lang text not null default 'en',
  path text not null default '',
  country text not null default '',
  city text not null default '',
  source text not null default '',
  campaign text not null default ''
);
create index live_events_at_idx on public.live_events (at desc);
alter table public.live_events enable row level security;

create function public.live_ping(
  p_kind text, p_sid text, p_host text, p_funnel text, p_page text, p_lang text, p_path text,
  p_country text, p_region text, p_city text, p_lat real, p_lon real,
  p_device text, p_source text, p_campaign text
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_kind = 'leave' then
    -- A leave that lands after the next page's view (two pings racing) is ignored.
    update public.live_visitors set left_at = now()
    where sid = p_sid and last_seen < now() - interval '2 seconds';
    return;
  end if;

  if p_kind = 'beat' then
    update public.live_visitors set
      session_start = case when last_seen < now() - interval '30 minutes' then now() else session_start end,
      views = case when last_seen < now() - interval '30 minutes' then 1 else views end,
      last_seen = now(),
      left_at = null
    where sid = p_sid;
    return;
  end if;

  -- A view. An empty source is a page of the same site: the session keeps the
  -- one it came in with.
  insert into public.live_visitors as v
    (sid, host, funnel, page, lang, path, country, region, city, lat, lon, device, source, campaign, views)
  values
    (p_sid, p_host, p_funnel, p_page, p_lang, p_path, p_country, p_region, p_city, p_lat, p_lon, p_device, p_source, p_campaign, 1)
  on conflict (sid) do update set
    session_start = case when v.last_seen < now() - interval '30 minutes' then now() else v.session_start end,
    views = case when v.last_seen < now() - interval '30 minutes' then 1 else v.views + 1 end,
    last_seen = now(),
    left_at = null,
    host = excluded.host,
    funnel = excluded.funnel,
    page = excluded.page,
    lang = excluded.lang,
    path = excluded.path,
    country = coalesce(nullif(excluded.country, ''), v.country),
    region = case when excluded.city <> '' then excluded.region else v.region end,
    city = coalesce(nullif(excluded.city, ''), v.city),
    lat = coalesce(excluded.lat, v.lat),
    lon = coalesce(excluded.lon, v.lon),
    device = coalesce(nullif(excluded.device, ''), v.device),
    source = case when excluded.source <> '' then excluded.source else v.source end,
    campaign = case when excluded.source <> '' then excluded.campaign else v.campaign end;

  insert into public.live_events (sid, host, funnel, page, lang, path, country, city, source, campaign)
  select sid, host, funnel, page, lang, path, country, city, source, campaign
  from public.live_visitors where sid = p_sid;
end;
$$;

revoke all on function public.live_ping(text, text, text, text, text, text, text, text, text, text, real, real, text, text, text) from public, anon, authenticated;
grant execute on function public.live_ping(text, text, text, text, text, text, text, text, text, text, real, real, text, text, text) to service_role;

-- Kept 30 days: the dashboard only shows the last day.
select cron.schedule(
  'funnnnels-live-prune',
  '23 3 * * *',
  $$
  delete from public.live_events where at < now() - interval '30 days';
  delete from public.live_visitors where last_seen < now() - interval '30 days';
  $$
);

-- Undo: select cron.unschedule('funnnnels-live-prune');
--       drop function public.live_ping; drop table public.live_events, public.live_visitors;
