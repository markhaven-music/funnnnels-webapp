-- One set of order-bump words per product (dashboard → Products → Order bump words),
-- said on every order form that sells it as a tick-box add-on (lib/bumpText.ts).
-- body: paragraphs split by a blank line; marks **bold**, _italic_, __underline__;
-- {price} = what that checkout charges, {full} = the struck full price (lib/bumpFull.ts).
create table if not exists public.bump_texts (
  product text not null references public.catalog(slug) on update cascade on delete cascade,
  lang text not null,
  headline text not null default '',
  body text not null default '',
  updated_at timestamptz not null default now(),
  primary key (product, lang)
);
alter table public.bump_texts enable row level security;
