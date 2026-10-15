-- Launch kit (applied to Supabase wsynmzewejgzugljqpky as migration "launch_kit").
-- Products sold from the template, their launches and the launch emails.
-- RLS on, no policies: only the server (service role) reads or writes.
-- Money is in cents. Paid zips live in the private "product-files" bucket.

create table public.products (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 60),
  name text not null,
  tagline text not null default '',
  price_eur_cents integer not null check (price_eur_cents > 0),
  price_usd_cents integer not null check (price_usd_cents > 0),
  -- The checkout add-on, or null: {"id","name","pitch","eur_cents","usd_cents"}
  bump jsonb,
  -- File key → path in the "product-files" bucket: {"pack": "<slug>/x.zip", "<bump id>": "..."}
  files jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;

create table public.launches (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null references public.products(slug) on delete cascade,
  waitlist_at timestamptz not null,
  cart_open_at timestamptz not null,
  early_bird_end_at timestamptz not null,
  early_eur_cents integer not null check (early_eur_cents > 0),
  early_usd_cents integer not null check (early_usd_cents > 0),
  waitlist_tag text not null,
  created_at timestamptz not null default now(),
  check (waitlist_at <= cart_open_at and cart_open_at < early_bird_end_at)
);
create index launches_product_idx on public.launches (product_slug, cart_open_at desc);
alter table public.launches enable row level security;

create table public.launch_emails (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches(id) on delete cascade,
  step text not null,
  subject text not null,
  body text not null,
  audience_tag text not null,
  exclude_tag text,
  send_at timestamptz not null,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'sending', 'sent', 'failed', 'skipped')),
  sent_at timestamptz,
  sent_count integer,
  error text,
  created_at timestamptz not null default now()
);
create index launch_emails_launch_idx on public.launch_emails (launch_id, send_at);
create index launch_emails_due_idx on public.launch_emails (status, send_at);
alter table public.launch_emails enable row level security;

-- Private bucket for paid downloads, zips only. No size limit of its own: it
-- follows the project's upload cap (50 MB on Supabase Free, up to 500 GB on Pro).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-files', 'product-files', false, null,
        array['application/zip', 'application/x-zip-compressed', 'application/octet-stream']);
