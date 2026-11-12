-- The blog's visitors (applied to Supabase wsynmzewejgzugljqpky as migration "blog_stats", 2026-11-12).
-- For dashboard → Blog (lib/blogStats.ts). One row per day, post, kind and
-- where the visitor came from; the browser sends one "view" per post per day
-- and one "click" (a link to the pack) per post per day
-- (app/api/checkout/blog). No visitor id is stored. Days are UTC days, like page_views.
-- RLS on, no policies: only the server (service role) reads or writes.
create table public.blog_stats (
  day date not null,
  slug text not null,
  kind text not null check (kind in ('view', 'click')),
  source text not null default '',
  views integer not null default 0,
  primary key (day, slug, kind, source)
);
alter table public.blog_stats enable row level security;

create function public.count_blog_stat(p_slug text, p_kind text, p_source text)
returns void
language sql
set search_path = ''
as $$
  insert into public.blog_stats (day, slug, kind, source, views)
  values ((now() at time zone 'utc')::date, p_slug, p_kind, p_source, 1)
  on conflict (day, slug, kind, source)
  do update set views = public.blog_stats.views + 1;
$$;
revoke all on function public.count_blog_stat(text, text, text) from public, anon, authenticated;
grant execute on function public.count_blog_stat(text, text, text) to service_role;
