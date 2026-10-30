# Email

Everything goes out through Amazon SES (eu-west-1, `lib/ses.ts`; out of the
sandbox since 2026-10-27, 50,000 a day at 14 a second, `EMAIL_RATE=14` in
Vercel), from one job:
`/api/cron/email` → `lib/outbox.ts`, called every minute by Supabase pg_cron
(`db/email-schedule.sql`). Tables: `db/orders.sql`, `db/email.sql`.

| What | When | Where it's edited |
| --- | --- | --- |
| Receipt with the downloads | 5 min after a paid order, upsells bought right after it in the same email | `lib/mailCopy.ts` (EN/FR/ES/DE/IT) |
| 💾 Backup Link | 10 min after the receipt: the same download links again and the account page, for buyers whose receipt got buried (ClickFunnels did it) | `lib/backupCopy.ts` |
| Abandoned checkout | MIDI Drum Kit: 3 emails, 15 min after step 1, then 6 h, then 18 h later (ClickFunnels' words, EN/FR/ES/DE/IT); other funnels: 1 email after 1 h. Stops when they buy | `lib/abandonCopy.ts`, `lib/mailCopy.ts` |
| After a Drum Kit purchase | "How to use" 1 h after, "Fragments" tip 24 h after, "Bonus" folder 48 h later: one sequence per language (`db/email-series-seed.sql`) | Dashboard → Automations |
| Grind Minute | 42 production tips to every new contact (tag `checkout-started`: anyone who types their email at a checkout, buyers included, as ClickFunnels sent it to buyers, checkout opt-ins and free-pack leads), the first 4 days after (after the abandoned-checkout emails and the Drum Kit's after-purchase ones), then one every 3 days: one sequence per language, words in `db/grind-minute/*.txt` | Dashboard → Automations |
| Sequences | a contact gets the trigger tag → step 1, step 2 N hours later…; a sequence can be for one language | Dashboard → Automations |
| Broadcasts | now or at a time, to a tag or everyone subscribed | Dashboard → Broadcasts |
| Launch emails | their scheduled time | Dashboard → Launches |

Orders are recorded (`lib/sales.ts`) by the Stripe webhook, the PayPal return
and every thank-you page; Stripe/PayPal stay the judge of what's paid.

## What they bring in

Dashboard → Email → Insights (`lib/emailStats.ts`, `lib/emailInsights.ts`,
`db/email-insights.sql`), plus the Clicked / Revenue columns of Broadcasts
and Automations. The links of broadcasts, sequences, launch emails and the
abandoned-checkout reminder go through `m.thegrind.studio/api/checkout/go`
(signed, `lib/mail.ts` clickUrl), which notes the click in `email_clicks` and
sends the reader on; mail scanners and bots aren't counted. An order counts
for an email when its buyer clicked it in the 5 days before paying (the last
email clicked wins); bought after getting one without a click is shown apart.
Addresses @example.com are tests and stay out of every number.

Newsletter-type emails carry an unsubscribe link and one-click
`List-Unsubscribe` headers (`lib/mail.ts`); unsubscribing sets
`contacts.status`. SES's own suppression list stops bounces and complaints.

## Still to switch on

- **Stripe webhook.** Stripe Dashboard → Developers → Webhooks → Add
  destination: `https://funnnnels.com/api/webhooks/stripe`, event
  `payment_intent.succeeded`; put its signing secret in Vercel as
  `STRIPE_WEBHOOK_SECRET` (Production) and redeploy.

## From ClickFunnels

On 2026-10-29 the automations of the ClickFunnels workspace (24 workflows, 98
emails) were read; four came over (the backup link and Grind Minute on 2026-10-30): the Meta Ads funnel's abandoned checkout and
the Drum Kit's after-purchase emails (`db/email-series.sql`,
`db/email-series-seed.sql`). Left in ClickFunnels: the abandoned-checkout copies
of old price tests (same three emails) and the free-pack lead sequences (Rolls, Mystery Hooks, ESSENTIAL), whose opt-in
pages aren't in funnnnels.

On 2026-10-30 its 4,718 contacts were imported (dashboard → Contacts: source
`clickfunnels`, its tags kept, `clickfunnels` on all, `buyer` on the 649 who
spent money; unsubscribed and undeliverable (`bounced`) stay so). The import
starts no sequence. ClickFunnels keeps sending its own emails until it ends on
2026-11-16.

## Testing

Off production every email goes to `EMAIL_TEST_TO` with `[test → <real address>]`
in the subject. `GET /api/cron/email?dryRun=1` with the bearer says what's due
without sending.
