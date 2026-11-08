-- 11-08: checkout starts from the owner's or a test device (?preview=1, the
-- opt-out: lib/beacon.ts isPreview) are marked, so Analytics' "Paid after
-- checkout" and the abandoned-checkout reminders leave them out
-- ("ma questi due gialli non dovrebbero essere gli stessi checkout?": the
-- step 2 test counted 5 test checkouts the bonus test didn't).
alter table public.checkout_starts add column if not exists own boolean not null default false;
-- The test addresses used so far.
update public.checkout_starts set own = true
  where split_part(lower(email), '@', 2) in ('example.com', 'test.it', 'tedt.it', 'test.com');
