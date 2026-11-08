-- Products, one per zip, and what each funnel sells (applied to Supabase
-- wsynmzewejgzugljqpky as migration "catalog"). RLS on, no policies: only the
-- server (service role) reads or writes. Money is in cents.
--
-- catalog       every product a buyer can download: the shop's (was
--               shop_products, db/shop.sql) and the funnels' zips. `status`
--               live = in the shop, at its own price (null until it's put there).
-- funnel_items  each funnel's main product, add-ons and upsells: which product,
--               the name and price it's sold at there, in order. `key` is the id
--               orders carry (orders.items, Stripe metadata.bump, PayPal custom_id),
--               so it never changes once something sold.
-- paypal_orders every PayPal order this server creates, with its amount and
--               items: the proof an order is ours (one made in the browser with
--               the public client id isn't), whatever the prices are later.

alter table public.shop_products rename to catalog;
alter index public.shop_products_live_idx rename to catalog_shop_idx;

-- Where the zip is: Supabase's private "product-files" bucket (uploads from
-- the dashboard), Cloudflare R2 (lib/r2.ts), or a file shipped with the
-- deployment (private/, the Jazz pack).
alter table public.catalog add column store text not null default 'supabase' check (store in ('supabase', 'r2', 'local'));
-- A picture already in /public, for products without an uploaded one.
alter table public.catalog add column cover text;
-- The shop price: only needed once the product is in the shop.
alter table public.catalog alter column price_eur_cents drop not null;
alter table public.catalog alter column price_usd_cents drop not null;
alter table public.catalog drop constraint shop_products_price_eur_cents_check;
alter table public.catalog drop constraint shop_products_price_usd_cents_check;
alter table public.catalog add constraint catalog_price_eur_check check (price_eur_cents is null or price_eur_cents > 0);
alter table public.catalog add constraint catalog_price_usd_check check (price_usd_cents is null or price_usd_cents > 0);
alter table public.catalog add constraint catalog_shop_priced check (status <> 'live' or (price_eur_cents is not null and price_usd_cents is not null));

-- The code deployed before this migration (up to 490f54f) still says
-- shop_products: a view under the old name, kept so a rollback to it still
-- works. Nothing since d52d4bc reads it; drop it once that rollback isn't
-- wanted any more (drop view public.shop_products).
-- security_invoker: the table's RLS applies, so the public keys get nothing.
create view public.shop_products with (security_invoker = true) as select * from public.catalog;
revoke all on public.shop_products from anon, authenticated;

create table public.funnel_items (
  funnel text not null,
  role text not null check (role in ('main', 'bump', 'upsell')),
  key text not null check (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(key) <= 24),
  product text not null references public.catalog(slug),
  name text not null,
  price_eur_cents integer not null check (price_eur_cents > 0),
  price_usd_cents integer not null check (price_usd_cents > 0),
  position integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (funnel, role, key)
);
create index funnel_items_product_idx on public.funnel_items (product);
alter table public.funnel_items enable row level security;

create table public.paypal_orders (
  id text primary key,
  funnel text not null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null check (currency in ('eur', 'usd')),
  -- What it unlocks: ["pack", "<add-on key>"…], the upsell's key, or the shop's slugs.
  items jsonb not null,
  offer text,
  created_at timestamptz not null default now()
);
alter table public.paypal_orders enable row level security;

-- ─── seed: today's funnels, exactly as their funnel.ts sell them ─────────────

insert into public.catalog (slug, name, store, file, cover, status, position) values
  ('jazz-midi-pack',   'Jazz MIDI Pack',                                    'local', 'private/jazz-midi-pack/Jazz MIDI Pack.zip',                     '/funnels/jazz-midi-pack/box-520.webp',                    'draft', 100),
  ('top-hits',         'TOP HITS MIDI Bundle',                              'r2',    'top-hits-midi-bundle/TOP HITS MIDI Bundle.zip',                 '/funnels/top-hits-midi-bundle/product.webp',              'draft', 101),
  ('midi-drum-kit',    'MIDI Drum Kit',                                     'r2',    'midi-drum-kit/MIDI Drum Kit - Bundle.zip',                      '/funnels/midi-drum-kit/kit-box.webp',                     'draft', 102),
  ('chord-bible',      'The Chord Progressions Bible',                      'r2',    'jazz-midi-pack/The Chord Progressions Bible.zip',               '/funnels/midi-drum-kit/bump-chords.webp',                 'draft', 103),
  ('emotional-keys',   'Emotional Keys MIDI Bundle',                        'r2',    'jazz-midi-pack/Emotional Keys MIDI Bundle.zip',                 '/funnels/top-hits-midi-bundle/bump-emotional-keys.webp',  'draft', 104),
  ('hustle',           'HUSTLE Bundle (31 MIDI Packs)',                     'r2',    'shared/HUSTLE MIDI Bundle.zip',                                 '/funnels/midi-drum-kit/bump-hustle.webp',                 'draft', 105),
  ('famous-beats',     'Famous Beats Bundle (320 MIDI Beats)',              'r2',    'shared/Famous Beats Bundle (320 MIDI Beats).zip',               '/funnels/midi-drum-kit/bonus-famous.webp',                'draft', 106),
  ('expansions',       'MIDI Drum Kit Expansions (House, Lo-Fi, Afrobeat)', 'r2',    'midi-drum-kit/EXPLORER Expansions (House, Lofi, Afrobeat).zip', '/funnels/midi-drum-kit/bump-expansions.webp',             'draft', 107),
  ('jazz-chord-pack',  'Jazz MIDI Chord Pack',                              'local', 'private/jazz-midi-pack/Jazz MIDI Chord Pack.zip',               '/funnels/jazz-midi-pack/bonus-1-360.webp',                'draft', 108),
  ('anime-pack',       'Anime & Video Game MIDI Chord Pack',                'local', 'private/jazz-midi-pack/Anime & Video Game MIDI Chord Pack.zip', '/funnels/jazz-midi-pack/bonus-3-360.webp',                'draft', 109),
  ('drum-loops',       'Drum Loops for Songwriting',                        'r2',    'jazz-midi-pack/Drum Loops for Songwriting.zip',                 '/funnels/jazz-midi-pack/bonus-5-360.webp',                'draft', 110),
  -- 2026-11-08: the Jazz order's €7 add-ons, then Drunk Swing Grooves' own funnel.
  ('jazz-record-samples', 'Jazz Record Samples (122 WAV Loops)',              'r2',    'jazz-midi-pack/Jazz Record Samples.zip',                        '/funnels/jazz-midi-pack/bump-records.webp',               'draft', 111),
  ('drunk-swing-grooves', 'Drunk Swing Grooves (211 MIDI Files)',             'r2',    'jazz-midi-pack/Drunk Swing Grooves.zip',                        '/funnels/drunk-swing-grooves/product-600.webp',           'draft', 112);

insert into public.funnel_items (funnel, role, key, product, name, price_eur_cents, price_usd_cents, position) values
  ('jazz-midi-pack',       'main',   'pack',           'jazz-midi-pack', 'Jazz MIDI Pack',                                 2700, 2700, 0),
  ('top-hits-midi-bundle', 'main',   'pack',           'top-hits',       'TOP HITS MIDI Bundle',                           2700, 2700, 0),
  ('top-hits-midi-bundle', 'bump',   'emotional-keys', 'emotional-keys', 'Emotional Keys MIDI Bundle',                      700,  700, 0),
  ('top-hits-midi-bundle', 'bump',   'hustle',         'hustle',         'HUSTLE Bundle (31 MIDI Packs)',                  2500, 2500, 1),
  ('top-hits-midi-bundle', 'bump',   'famous-beats',   'famous-beats',   'Famous Beats Bundle (320 MIDI Beats)',           2700, 2700, 2),
  ('top-hits-midi-bundle', 'upsell', 'famous-beats',   'famous-beats',   'Famous Beats Bundle (320 MIDI Beats)',           2700, 2700, 0),
  ('midi-drum-kit',        'main',   'pack',           'midi-drum-kit',  'MIDI Drum Kit',                                  2700, 2700, 0),
  ('midi-drum-kit',        'bump',   'expansions',     'expansions',     'MIDI Drum Kit Expansions (House, Lo-Fi, Afrobeat)', 700,  700, 0),
  ('midi-drum-kit',        'bump',   'hustle',         'hustle',         'HUSTLE Bundle (31 MIDI Packs)',                  2500, 2500, 1),
  ('midi-drum-kit',        'bump',   'chords',         'chord-bible',    'Chord Progressions Bundle (750 Songs)',          2500, 2500, 2),
  ('midi-drum-kit',        'upsell', 'famous-beats',   'famous-beats',   'Famous Beats Bundle (320 MIDI Beats)',           2700, 2700, 0),
  ('midi-drum-kit',        'upsell', 'top-hits',       'top-hits',       'TOP HITS MIDI Bundle (1000 Chord Progressions)', 2700, 2700, 1);

-- The Famous Beats Bundle, moved from ClickFunnels on 2026-11-02 (its funnel.ts).
insert into public.funnel_items (funnel, role, key, product, name, price_eur_cents, price_usd_cents, position) values
  ('famous-beats-bundle',  'main',   'pack',           'famous-beats',   'Famous Beats Bundle',                            2700, 2700, 0),
  ('famous-beats-bundle',  'bump',   'emotional-keys', 'emotional-keys', 'Emotional Keys MIDI Bundle',                      700,  700, 0),
  ('famous-beats-bundle',  'bump',   'drum-kit',       'midi-drum-kit',  'MIDI Drum Kit Bundle',                           2500, 2500, 1),
  ('famous-beats-bundle',  'bump',   'hustle',         'hustle',         'HUSTLE Bundle (31 MIDI Packs)',                  2500, 2500, 2),
  ('famous-beats-bundle',  'upsell', 'top-hits',       'top-hits',       'TOP HITS MIDI Bundle (1000 Chord Progressions)', 2700, 2700, 0),
  ('drunk-swing-grooves',  'main',   'pack',           'drunk-swing-grooves', 'Drunk Swing Grooves',                       700,  700, 0),
  ('drunk-swing-grooves',  'bump',   'drum-kit',       'midi-drum-kit',       'MIDI Drum Kit Bundle',                     2700, 2700, 0),
  ('drunk-swing-grooves',  'bump',   'famous-beats',   'famous-beats',        'Famous Beats Bundle (320 MIDI Beats)',     2700, 2700, 1),
  ('drunk-swing-grooves',  'bump',   'jazz-pack',      'jazz-midi-pack',      'Jazz MIDI Pack',                           2700, 2700, 2),
  ('drunk-swing-grooves',  'upsell', 'jazz-pack',      'jazz-midi-pack',      'Jazz MIDI Pack',                           2700, 2700, 0),
  ('drunk-swing-grooves',  'upsell', 'famous-beats',   'famous-beats',        'Famous Beats Bundle (320 MIDI Beats)',     2700, 2700, 1);
