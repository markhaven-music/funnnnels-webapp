-- Run the email job (/api/cron/email, lib/outbox.ts) every minute from Supabase.
-- Vercel Hobby allows only a daily cron; pg_cron + pg_net are free on Supabase.
-- Applied as migration "email_schedule" once the route was live and CRON_SECRET
-- set in Vercel; the secret sits in Supabase Vault as funnnnels_cron_secret.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- select vault.create_secret('<CRON_SECRET>', 'funnnnels_cron_secret');

select cron.schedule(
  'funnnnels-email',
  '* * * * *',
  $$
  select net.http_get(
    url := 'https://funnnnels.com/api/cron/email',
    headers := jsonb_build_object(
      'authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'funnnnels_cron_secret')
    ),
    timeout_milliseconds := 60000
  );
  $$
);

-- Undo: select cron.unschedule('funnnnels-email');
