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
