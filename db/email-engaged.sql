-- Deliverability (2026-11-16): broadcasts and launch emails go to engaged
-- contacts only, unless engaged_only is switched off for one. Mailing every
-- day to people who never open is what moves Gmail and Outlook to spam.
--
-- Engaged = a buyer (tag buyer / buyer-* / owns-*), or opened (a real open,
-- not Apple's prefetch or a scanner) or clicked any email in the last 90
-- days, or joined in the last 30 days (ClickFunnels' real opt-in date for
-- imports).

alter table public.broadcasts add column if not exists engaged_only boolean not null default true;
alter table public.launch_emails add column if not exists engaged_only boolean not null default true;

create or replace function public.contact_engaged(p_email text, p_tags jsonb, p_joined timestamptz)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (select 1 from jsonb_array_elements_text(p_tags) t where t = 'buyer' or t like 'buyer-%' or t like 'owns-%')
    or p_joined > now() - interval '30 days'
    or exists (select 1 from public.email_opens o where o.email = p_email and o.machine is null and o.created_at > now() - interval '90 days')
    or exists (select 1 from public.email_clicks k where k.email = p_email and k.created_at > now() - interval '90 days');
$$;

drop function if exists public.claim_recipients(text, text, text, text, integer);
create function public.claim_recipients(p_kind text, p_ref text, p_tag text, p_exclude text, lim integer, p_engaged boolean default false)
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
      and (not p_engaged or public.contact_engaged(c.email, c.tags, coalesce(c.cf_added_at, c.created_at)))
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

drop function if exists public.audience_size(text, text);
create function public.audience_size(p_tag text, p_exclude text, p_engaged boolean default false)
returns integer
language sql
stable
set search_path = ''
as $$
  select count(*)::integer from public.contacts c
  where c.status = 'subscribed'
    and (p_tag is null or c.tags ? p_tag)
    and (p_exclude is null or not (c.tags ? p_exclude))
    and (not p_engaged or public.contact_engaged(c.email, c.tags, coalesce(c.cf_added_at, c.created_at)));
$$;

revoke execute on function public.contact_engaged(text, jsonb, timestamptz) from public, anon, authenticated;
revoke execute on function public.claim_recipients(text, text, text, text, integer, boolean) from public, anon, authenticated;
revoke execute on function public.audience_size(text, text, boolean) from public, anon, authenticated;
