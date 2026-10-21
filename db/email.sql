-- Email (applied to Supabase wsynmzewejgzugljqpky as migration "email").
-- (and "email_import_merge_duplicates" for import_contacts as it is here).
-- Builds on db/orders.sql (orders, checkout_starts), which was applied earlier.
-- Everything goes out through Amazon SES from one job, /api/cron/email
-- (lib/outbox.ts), which pg_cron calls every minute (db/email-schedule.sql).
-- RLS on, no policies: only the server (service role) reads or writes.

-- ─── contacts: who may get the newsletter ──────────────────────────
-- status: subscribed (default), unsubscribed (the link or the header),
-- bounced / complained (set by hand or by a sync from SES's suppression list).
alter table public.contacts
  add column status text not null default 'subscribed'
    check (status in ('subscribed', 'unsubscribed', 'bounced', 'complained')),
  add column unsubscribed_at timestamptz,
  add column lang text,
  add column updated_at timestamptz not null default now();
create unique index contacts_email_key on public.contacts (email);
create index contacts_tags_idx on public.contacts using gin (tags);

-- ─── orders: what the receipt needs ────────────────────────────────
alter table public.orders
  add column lang text not null default 'en',
  add column offer text,   -- a one-click upsell: its id
  add column parent text,  -- … and the order it followed
  add column email_error text,
  add column email_attempts integer not null default 0;
create index orders_email_due_idx on public.orders (created_at) where email_sent_at is null;
create index orders_parent_idx on public.orders (parent) where parent is not null;

alter table public.checkout_starts add column lang text not null default 'en';

-- ─── broadcasts: one email to a tag (or everyone), now or at a time ─
create table public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  subject text not null default '',
  preheader text not null default '',
  body text not null default '',
  -- null = every subscribed contact
  audience_tag text,
  exclude_tag text,
  send_at timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index broadcasts_due_idx on public.broadcasts (status, send_at);
alter table public.broadcasts enable row level security;

-- ─── sequences: "tagged X → email 1 now, email 2 two days later…" ──
create table public.sequences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- A contact gets this tag (a form, a checkout, a purchase) → it starts.
  trigger_tag text not null,
  -- A contact who has this tag stops getting it (e.g. "buyer").
  exit_tag text,
  active boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.sequences enable row level security;

create table public.sequence_steps (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null references public.sequences(id) on delete cascade,
  position integer not null,
  -- After the previous step (the first: after the start).
  delay_hours integer not null default 0 check (delay_hours >= 0),
  subject text not null default '',
  body text not null default '',
  unique (sequence_id, position)
);
alter table public.sequence_steps enable row level security;

create table public.sequence_runs (
  sequence_id uuid not null references public.sequences(id) on delete cascade,
  email text not null,
  next_position integer not null default 0,
  next_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active', 'done', 'exited')),
  started_at timestamptz not null default now(),
  primary key (sequence_id, email)
);
create index sequence_runs_due_idx on public.sequence_runs (next_at) where status = 'active';
alter table public.sequence_runs enable row level security;

-- ─── email_sends: one row per email to one person ──────────────────
-- kind/ref: broadcast/<id>, launch/<launch email id>, sequence/<step id>.
-- Inserted before sending (status 'sending') so two runs never send twice.
create table public.email_sends (
  kind text not null check (kind in ('broadcast', 'launch', 'sequence')),
  ref text not null,
  email text not null,
  status text not null default 'sending' check (status in ('sending', 'sent', 'failed')),
  message_id text,
  error text,
  created_at timestamptz not null default now(),
  primary key (kind, ref, email)
);
create index email_sends_email_idx on public.email_sends (email);
alter table public.email_sends enable row level security;

-- ─── starting sequences when a tag arrives ─────────────────────────
-- Any way a tag lands (checkout, opt-in, purchase, the dashboard) starts the
-- sequences it triggers. A contact import sets funnnnels.no_sequences so
-- 4,000 old contacts don't all start the welcome sequence at once.
create function public.start_sequences() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(current_setting('funnnnels.no_sequences', true), '') = 'on' then return new; end if;
  if new.status <> 'subscribed' then return new; end if;
  insert into public.sequence_runs (sequence_id, email)
  select s.id, new.email
  from public.sequences s
  where s.active
    and new.tags ? s.trigger_tag
    and (tg_op = 'INSERT' or not (coalesce(old.tags, '[]'::jsonb) ? s.trigger_tag))
    and not (s.exit_tag is not null and new.tags ? s.exit_tag)
  on conflict do nothing;
  return new;
end;
$$;
create trigger contacts_start_sequences
after insert or update of tags on public.contacts
for each row execute function public.start_sequences();

-- ─── contact import (dashboard → Contacts → Import CSV) ────────────
-- rows: [{ "email", "name", "tags": [...], "status" }]. Adds new contacts,
-- merges tags into existing ones, never re-subscribes someone who left.
-- Returns how many were new.
create function public.import_contacts(rows jsonb, source text)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  added integer;
begin
  perform set_config('funnnnels.no_sequences', 'on', true);
  with raw as (
    select lower(trim(r->>'email')) as email, nullif(trim(r->>'name'), '') as name,
           case when jsonb_typeof(r->'tags') = 'array' then r->'tags' else '[]'::jsonb end as tags,
           r->>'status' as status
    from jsonb_array_elements(rows) r
    where coalesce(r->>'email', '') ~ '^\s*[^\s@]+@[^\s@]+\.[^\s@]{2,}\s*$'
  ),
  -- The same email twice in a file: one contact, the tags of both.
  input as (
    select email,
      (array_agg(name) filter (where name is not null))[1] as name,
      (select coalesce(jsonb_agg(distinct t), '[]'::jsonb) from raw r2, jsonb_array_elements(r2.tags) t where r2.email = raw.email) as tags,
      case when bool_or(status in ('unsubscribed', 'bounced', 'complained'))
           then (array_agg(status) filter (where status in ('unsubscribed', 'bounced', 'complained')))[1]
           else 'subscribed' end as status
    from raw
    group by email
  ),
  upserted as (
    insert into public.contacts (id, email, name, source, tags, status, unsubscribed_at)
    select substr(md5(random()::text || i.email), 1, 8), i.email, i.name, source, i.tags, i.status,
           case when i.status = 'subscribed' then null else now() end
    from input i
    on conflict (email) do update set
      name = coalesce(public.contacts.name, excluded.name),
      tags = (select coalesce(jsonb_agg(distinct t), '[]'::jsonb) from jsonb_array_elements(public.contacts.tags || excluded.tags) t),
      status = case when public.contacts.status = 'subscribed' then excluded.status else public.contacts.status end,
      unsubscribed_at = coalesce(public.contacts.unsubscribed_at, excluded.unsubscribed_at),
      updated_at = now()
    returning (xmax = 0) as inserted
  )
  select count(*) filter (where inserted) into added from upserted;
  return added;
end;
$$;

-- ─── who gets a send next ──────────────────────────────────────────
-- Claims up to `lim` subscribed contacts with the tag (any when null), without
-- the exclude tag, not yet sent this email; their rows say 'sending'.
create function public.claim_recipients(p_kind text, p_ref text, p_tag text, p_exclude text, lim integer)
returns table (email text, name text, lang text)
language plpgsql
set search_path = ''
as $$
begin
  return query
  with picked as (
    select c.email, c.name, c.lang
    from public.contacts c
    where c.status = 'subscribed'
      and (p_tag is null or c.tags ? p_tag)
      and (p_exclude is null or not (c.tags ? p_exclude))
      and not exists (select 1 from public.email_sends s where s.kind = p_kind and s.ref = p_ref and s.email = c.email)
    order by c.created_at
    limit lim
  ),
  claimed as (
    insert into public.email_sends (kind, ref, email)
    select p_kind, p_ref, p.email from picked p
    on conflict do nothing
    returning email_sends.email
  )
  select p.email, p.name, p.lang from picked p join claimed c on c.email = p.email;
end;
$$;

-- How many a send would reach right now (the dashboard's audience count).
create function public.audience_size(p_tag text, p_exclude text)
returns integer
language sql
stable
set search_path = ''
as $$
  select count(*)::integer from public.contacts c
  where c.status = 'subscribed'
    and (p_tag is null or c.tags ? p_tag)
    and (p_exclude is null or not (c.tags ? p_exclude));
$$;

-- Every tag in use, with its count (the dashboard's tag pickers).
create function public.contact_tags()
returns table (tag text, contacts bigint)
language sql
stable
set search_path = ''
as $$
  select t, count(*) from public.contacts c, jsonb_array_elements_text(c.tags) t group by t order by count(*) desc, t;
$$;

revoke execute on function public.import_contacts(jsonb, text) from public, anon, authenticated;
revoke execute on function public.claim_recipients(text, text, text, text, integer) from public, anon, authenticated;
revoke execute on function public.audience_size(text, text) from public, anon, authenticated;
revoke execute on function public.contact_tags() from public, anon, authenticated;
revoke execute on function public.start_sequences() from public, anon, authenticated;
