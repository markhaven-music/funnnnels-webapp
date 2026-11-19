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

-- Every write kept (2026-11-19, after a TOP HITS rewrite of 11-18 was lost): a trigger copies each
-- insert, update and delete into bump_text_history, so any saved version can be put back.
create table if not exists public.bump_text_history (
  id bigserial primary key,
  product text not null,
  lang text not null,
  headline text,
  body text,
  op text not null,
  at timestamptz not null default now()
);
alter table public.bump_text_history enable row level security;
create or replace function public.bump_texts_keep_history() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    insert into bump_text_history (product, lang, headline, body, op) values (old.product, old.lang, old.headline, old.body, 'delete');
    return old;
  end if;
  insert into bump_text_history (product, lang, headline, body, op) values (new.product, new.lang, new.headline, new.body, lower(tg_op));
  return new;
end $$;
drop trigger if exists bump_texts_history on public.bump_texts;
create trigger bump_texts_history after insert or update or delete on public.bump_texts for each row execute function public.bump_texts_keep_history();
