-- Customer login (m.thegrind.studio/account, lib/account.ts), applied as the
-- migration "customer_login" on 2026-10-21. A buyer signs in with the email
-- they bought with and sees every purchase. Stripe orders are found in Stripe
-- (metadata.email); PayPal orders here, so their emails are kept too.
alter table public.paypal_sales add column email text;        -- typed at the checkout, lower-case
alter table public.paypal_sales add column payer_email text;  -- the PayPal account's, lower-case
create index paypal_sales_email_idx on public.paypal_sales (email);
create index paypal_sales_payer_email_idx on public.paypal_sales (payer_email);

-- One sign-in email per address per minute, so the form can't flood an inbox.
create table public.account_logins (
  email text primary key,
  sent_at timestamptz not null default now()
);
alter table public.account_logins enable row level security;
