-- 1:1 coaching applications (app/coaching, /api/coaching/apply), applied to
-- Supabase wsynmzewejgzugljqpky as migration "coaching_applications".
-- One row per application; the owner reads them and books the call.
-- RLS on, no policies: only the server reads or writes.

create table public.coaching_applications (
  id bigint generated always as identity primary key,
  email text not null check (email = lower(email)),
  name text,
  instagram text,
  daw text,
  years text,
  where_stuck text,
  goal text,
  ready text,                -- their answer to "€2,000 a month: ready?"
  links text,                -- beats they want heard
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  page text,
  status text not null default 'new', -- new | called | client | no
  created_at timestamptz not null default now()
);
create index coaching_applications_created on public.coaching_applications (created_at desc);
alter table public.coaching_applications enable row level security;
