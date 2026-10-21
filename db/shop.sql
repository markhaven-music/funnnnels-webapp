-- The shop (applied to Supabase wsynmzewejgzugljqpky as migration "shop").
-- Products sold side by side at /shop with a cart, besides the funnels.
-- RLS on, no policies: only the server (service role) reads or writes.
-- Money is in cents. Paid zips live in the private "product-files" bucket under
-- shop/<slug>/, pictures in the public "shop-images" bucket.
-- Orders go in `orders` like every other sale: funnel = 'shop', items = the
-- products' slugs.

create table public.shop_products (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 60),
  name text not null,
  tagline text not null default '',
  -- Plain text: paragraphs split by a blank line, "- " lines become a list.
  description text not null default '',
  price_eur_cents integer not null check (price_eur_cents > 0),
  price_usd_cents integer not null check (price_usd_cents > 0),
  -- The square cover in "shop-images", two sizes: {"sm": "<slug>/<t>-600.webp", "lg": "<slug>/<t>-1200.webp"}
  image jsonb,
  -- The paid zip's path in "product-files" (shop/<slug>/<name>.zip), or null.
  file text,
  -- Drafts are only seen in the dashboard.
  status text not null default 'draft' check (status in ('draft', 'live')),
  -- Order on the shop page, smallest first.
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index shop_products_live_idx on public.shop_products (status, position);
alter table public.shop_products enable row level security;

-- The shop page's heading and intro: one row.
create table public.shop_settings (
  id smallint primary key default 1 check (id = 1),
  title text not null default 'The shop',
  intro text not null default '',
  updated_at timestamptz not null default now()
);
insert into public.shop_settings (id) values (1);
alter table public.shop_settings enable row level security;

-- Product pictures: public (the shop shows them), webp or jpeg, 5 MB at most.
-- The dashboard resizes them in the browser before the upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shop-images', 'shop-images', true, 5242880, array['image/webp', 'image/jpeg']);
