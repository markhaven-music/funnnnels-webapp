-- The words of a code funnel's pages as edited in the dashboard (funnel map →
-- Edit, app/funnels/[id]/texts). A row replaces the text the code has for
-- that key; deleting it brings the code's text back (lib/pageTexts.ts).
--   page: landing | order | famous-beats | top-hits | thank-you
--   key:  tNNN (a text of ClickFunnels' markup) or a path in copy/<lang>.ts ("order.bullets.3")

create table if not exists page_texts (
  funnel text not null,
  page text not null,
  lang text not null,
  key text not null,
  value text not null,
  updated_at timestamptz not null default now(),
  primary key (funnel, page, lang, key)
);

-- Only the server (service key) reads and writes it.
alter table page_texts enable row level security;
