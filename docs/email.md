# Email

Everything goes out through Amazon SES (eu-west-1, `lib/ses.ts`), from one job:
`/api/cron/email` → `lib/outbox.ts`, called every minute by Supabase pg_cron
(`db/email-schedule.sql`). Tables: `db/orders.sql`, `db/email.sql`.

| What | When | Where it's edited |
| --- | --- | --- |
| Receipt with the downloads | 5 min after a paid order, upsells bought right after it in the same email | `lib/mailCopy.ts` (EN/FR/ES/DE) |
| Abandoned checkout | 1 h after step 1 of a checkout, once, never to a buyer | `lib/mailCopy.ts` |
| Sequences | a contact gets the trigger tag → step 1, step 2 N hours later… | Dashboard → Automations |
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

- **SES production access.** Until then SES only delivers to verified
  addresses: receipts are retried 5 times then left, broadcasts go back to
  draft with a note. Appeal text: `docs/ses-appeal.md`. Once approved, set
  `EMAIL_RATE=14` (or the rate AWS grants) in Vercel and redeploy.
- **Stripe webhook.** Stripe Dashboard → Developers → Webhooks → Add
  destination: `https://funnnnels.com/api/webhooks/stripe`, event
  `payment_intent.succeeded`; put its signing secret in Vercel as
  `STRIPE_WEBHOOK_SECRET` (Production) and redeploy.

## Testing

Off production every email goes to `EMAIL_TEST_TO` with `[test → <real address>]`
in the subject. `GET /api/cron/email?dryRun=1` with the bearer says what's due
without sending.
