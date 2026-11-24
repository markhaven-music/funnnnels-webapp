-- Black Friday 2026 (lib/blackFriday.ts): every front-end's main product at €9.99 / $9.99,
-- back to its price at Friday 28 November 23:59 Italy (22:59 UTC) by pg_cron.
-- To extend to Cyber Monday: cron.alter_job / reschedule 'black-friday-close' and move BF_ENDS.
update funnel_items set price_eur_cents = 999, price_usd_cents = 999, updated_at = now()
 where role = 'main' and funnel in ('midi-drum-kit','jazz-midi-pack','famous-beats-bundle','top-hits-midi-bundle','top-hits-chords');

select cron.schedule('black-friday-close', '59 22 28 11 *', $$
  update funnel_items set price_eur_cents = 2700, price_usd_cents = 2700, updated_at = now()
   where role = 'main' and funnel in ('midi-drum-kit','jazz-midi-pack','famous-beats-bundle');
  update funnel_items set price_eur_cents = 9700, price_usd_cents = 9700, updated_at = now()
   where role = 'main' and funnel in ('top-hits-midi-bundle','top-hits-chords');
  select cron.unschedule('black-friday-close');
$$);
