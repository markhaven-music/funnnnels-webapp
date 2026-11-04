-- Every opt-in, one row each time someone opts in (applied to Supabase
-- wsynmzewejgzugljqpky as migration "optins"). contacts keeps one row per
-- email with its first source; this keeps when and from which ad each opt-in
-- came, for dashboard → Free packs (lib/freePacks.ts): leads per pack and per
-- ad, and how many start a checkout and buy within 1, 7 and 30 days.
--
-- visitor_id is neo's ft_vid (its clicks have the ad of every visit); the
-- utm_* and ad_id are the opt-in page's own URL, as the ad's URL parameters
-- set them. RLS on, no policies: only the server reads or writes.

create table public.optins (
  id bigint generated always as identity primary key,
  email text not null check (email = lower(email)),
  optin text not null,                 -- app/free/packs.ts OPTINS key, or a funnel slug
  visitor_id text,
  page text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  ad_id text,
  created_at timestamptz not null default now()
);
create index optins_created on public.optins (created_at desc);
create index optins_email on public.optins (email);
alter table public.optins enable row level security;
