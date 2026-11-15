-- TOP HITS MIDI Bundle launch (2026-11-16 → 2026-11-22): the €27 / $27 launch price ends
-- Sunday 22 Nov at midnight Pacific time (2026-11-23 08:00 UTC) or when 100 copies are sold
-- since the launch email, whichever comes first; then every funnel_items row of the product
-- goes back to 97. Checked every 5 minutes by pg_cron; the job removes itself once done.
-- Applied 2026-11-15 (migration top_hits_launch_close). See top-hits-chords/BRIEF.md.
create or replace function public.top_hits_launch_close() returns void
language plpgsql security definer set search_path = public as $$
declare
  copies int;
begin
  if exists (select 1 from funnel_items where product = 'top-hits' and price_eur_cents = 2700) then
    select count(*) into copies from orders o
     where o.status = 'succeeded'
       and o.created_at >= timestamptz '2026-11-16 08:00:00+00'
       and ((o.funnel in ('top-hits-chords', 'top-hits-midi-bundle') and o.offer is null) or o.items ? 'top-hits');
    if now() < timestamptz '2026-11-23 08:00:00+00' and copies < 100 then
      return;
    end if;
    update funnel_items set price_eur_cents = 9700, price_usd_cents = 9700, updated_at = now()
     where product = 'top-hits' and price_eur_cents = 2700;
  end if;
  begin
    perform cron.unschedule('top-hits-launch-close');
  exception when others then null;
  end;
end $$;

revoke all on function public.top_hits_launch_close() from public, anon, authenticated;

select cron.schedule('top-hits-launch-close', '*/5 * * * *', 'select public.top_hits_launch_close()');
