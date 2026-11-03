-- Purchases made before funnnnels (applied to Supabase wsynmzewejgzugljqpky as
-- migration "legacy_purchases"). ClickFunnels' buyers sign in at /account
-- like everyone else and find these next to their funnnnels orders, each a
-- download of a catalog product (dashboard → Products).
-- RLS on, no policies: only the server (service role) reads or writes.

create table public.legacy_purchases (
  email text not null check (email = lower(email)),
  product text not null references public.catalog (slug) on update cascade,
  -- Where it was bought, and its order id there when the export has one.
  source text not null default 'clickfunnels',
  ref text,
  -- Unknown for the first import (contacts tagged owns-midi-drum-kit).
  bought_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (email, product)
);
alter table public.legacy_purchases enable row level security;

-- ClickFunnels' Drum Kit buyers, from the contacts imported on 10-30.
insert into public.legacy_purchases (email, product)
select email, 'midi-drum-kit' from public.contacts
where source = 'clickfunnels' and tags ? 'owns-midi-drum-kit'
on conflict do nothing;

-- 2026-11-03: every paid ClickFunnels order (1,107 orders read from the
-- workspace's Orders list; live, Completed, Paid or Partially-refunded; test,
-- abandoned, refunded and disputed ones left out), one row per buyer and
-- product with the order number in `ref` and its date in `bought_at`
-- (ClickFunnels shows Budapest time). 1,101 rows for 630 buyers, loaded with
-- the service key (a script, not SQL). Each ClickFunnels item maps to the
-- catalog product holding the same zip: every "MIDI Drum Kit …" variant →
-- midi-drum-kit; Expansions (3 Packs), Afrobeat/Lo-Fi expansions →
-- expansions (its zip has all three); "HUSTLE" → hustle; TOP HITS, Famous
-- Beats, Emotional Keys, the Bible as named. Four products funnnnels didn't
-- sell got catalog rows (draft, zips in R2 under clickfunnels/, copied from
-- ClickFunnels' Downloads): midi-drum-kit-pro-max, essential-drum-patterns,
-- mystery-hooks, hitmaker.
