-- The layout of a code funnel's page as edited in the dashboard (funnel map →
-- Edit, app/funnels/[id]/texts): sections hidden or moved, pictures replaced,
-- the button colour fixed. One row per page and language; no row = the code's
-- layout (lib/pageLayout.ts).
--   page:   landing | famous-beats | top-hits
--   layout: { order?: [section ids], hidden?: [section ids], button?: "green" | "yellow" | "orange",
--             images?: { "/funnels/midi-drum-kit/<name>.webp": { src, w, h } } }

create table if not exists page_layout (
  funnel text not null,
  page text not null,
  lang text not null,
  layout jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (funnel, page, lang)
);

-- Only the server (service key) reads and writes it.
alter table page_layout enable row level security;

-- The pictures uploaded from the editor, served public by the storage CDN
-- (app/api/funnels/[id]/images).
insert into storage.buckets (id, name, public)
values ('pages', 'pages', true)
on conflict (id) do nothing;
