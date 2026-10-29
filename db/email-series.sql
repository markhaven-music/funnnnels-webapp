-- The automations copied from ClickFunnels (2026-10-29), run after orders.sql
-- and email.sql.

-- ─── the abandoned checkout is a series ───────────────────────────
-- reminders: how many of the funnel's reminders went out (lib/outbox.ts:
-- MIDI Drum Kit 3, 15 min / 6 h / 18 h apart; the others 1, after an hour);
-- reminder_sent_at: when the last one did. currency: the price the visitor
-- saw at checkout (lib/geo.ts), for the price the emails state.
alter table public.checkout_starts add column if not exists reminders smallint not null default 0;
alter table public.checkout_starts add column if not exists currency text check (currency in ('eur', 'usd'));
-- The single reminder sent before this: that start is done.
update public.checkout_starts set reminders = 3 where reminder_sent_at is not null and reminders = 0;
drop index if exists public.checkout_starts_due_idx;
create index if not exists checkout_starts_due_idx on public.checkout_starts (started_at) where reminders < 3;

-- ─── a sequence can be for one language ───────────────────────────
-- null: everyone; 'fr': only contacts whose language is French (no language
-- counts as English), so one product has its follow-up in each language.
alter table public.sequences add column if not exists lang text;

create or replace function public.start_sequences() returns trigger
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
    and (s.lang is null or s.lang = coalesce(new.lang, 'en'))
  on conflict do nothing;
  return new;
end;
$$;
revoke execute on function public.start_sequences() from public, anon, authenticated;
