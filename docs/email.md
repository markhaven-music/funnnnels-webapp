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
| Abandoned checkout | MIDI Drum Kit: 3 emails, 15 min after step 1, then 6 h, then 18 h later (ClickFunnels' words, EN/FR/ES/DE/IT); its link is the saved cart: the order page opens on step 2 with their name and email filled (`?c=`, an encrypted token, `lib/mail.ts` resumeToken → `/api/checkout/resume`). Other funnels: 1 email after 1 h. Stops when they buy | `lib/abandonCopy.ts`, `lib/mailCopy.ts` |
| Free pack download | Right after an opt-in on a free pack's page (Rolls, Bounce): the link to the zip, every time they ask | `app/free/firstEmail.ts` |
| Free pack follow-ups | Backup link 1 h after the opt-in, "checkin' in" 24 h later, the Mystery Hooks gift 24 h later, hooks tips 48 h later: "Free Rolls pack" (tag `lead-rolls`) and "Free Bounce pack" (`bounce-pack-ig`), `db/free-leads.sql` | Dashboard → Automations |
| After a Drum Kit purchase | "How to use" 1 h after, "Fragments" tip 24 h after, "Bonus" folder 48 h later: one sequence per language (`db/email-series-seed.sql`) | Dashboard → Automations |
| Grind Minute (switched off) | 42 production tips, every 3 days: one sequence per language, ready but off since 2026-10-30, so no one gets it; words in `db/grind-minute/*.txt` | Dashboard → Automations |
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

## Writing them

- **One link, two at most** in broadcasts, sequences and launch emails ("if
  they're transactional okay but in general should only be 1, 2 max",
  2026-11-02). Receipts and the backup link carry what they need. The footer
  doesn't count.
- Links in the text are FL Studio / Matrix green, `#00b034`, bold and
  underlined (`LINK` in `lib/mail.ts`); the footer's stay grey.

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
of old price tests (same three emails) and the free-pack lead sequences, which
came over on 2026-11-03 with their pages (below).

On 2026-11-03 the free lead magnets came over (`app/free`): ClickFunnels' opt-in
and download pages at their old paths (Rolls, Bounce, the Mystery Hooks page,
the Free Store and its two product pages), the zips in R2 (`free/`), the
download email sent by `/api/optin`, and the Rolls and Bounce follow-ups word
for word as sequences (`db/free-leads.sql`). ClickFunnels' "[#1] (FREE) Rolls
Sequence" ran the Mystery Hooks workflow after two days; here its two emails
are the sequences' last steps, and they end there (ClickFunnels went on to
Grind Minute, switched off here). Not copied: the SMS step, the 50/50 test's
"yo" email, and the "ESSENTIAL" and "MIDI Drum Kit to Leads" workflows, which
had no trigger in ClickFunnels (nobody entered them).

On 2026-10-30 its 4,718 contacts were imported (dashboard → Contacts: source
`clickfunnels`, its tags kept, `clickfunnels` on all, `buyer` on the 649 who
spent money; unsubscribed and undeliverable (`bounced`) stay so). The import
starts no sequence. ClickFunnels keeps sending its own emails until it ends on
2026-11-16.

On 2026-11-04 every ClickFunnels order (1,130, Nov 2025 to Nov 2026, all
statuses, every export field) was archived in `cf_orders`, with the CSV as
downloaded in `cf_exports` (db/cf-orders-archive.sql): payment ids, amounts,
refunds and disputes after ClickFunnels is gone.

On 2026-11-02 the 15 broadcasts ClickFunnels had scheduled for Nov 16–30 (the
TOP HITS launch and the Drum Kit emails between them) were moved into
Dashboard → Broadcasts, word for word, at the same times (ClickFunnels'
workspace clock is Budapest: 09:00 = 08:00 UTC, 12:00 = 11:00 UTC), and turned
back to drafts in ClickFunnels. Links now go to m.thegrind.studio
(`/top-hits-midi-bundle`, `/en/midi-drum-kit`) with
`utm_source=email&utm_medium=broadcast&utm_campaign=<name>`. ClickFunnels left
out buyers by product; here the TOP HITS emails leave out
`buyer-top-hits-midi-bundle` and the Drum Kit ones `owns-midi-drum-kit` (put
on ClickFunnels' Drum Kit buyers, the `grindstudio-buyer` / `mididrumkit-buyer`
tags, and given to new Drum Kit buyers; no sequence starts on it, unlike
`buyer-midi-drum-kit`). "A Sunday with the classics" (Nov 22) sells the Famous
Beats Bundle alone: a draft here until its funnnnels page went live, scheduled
here since 2026-11-03 with the link on m.thegrind.studio/famous-beats-bundle
(ClickFunnels, closed by then, can't send its copy). The broadcasts of Nov 3–15 stay in
ClickFunnels.

## Testing

Off production every email goes to `EMAIL_TEST_TO` with `[test → <real address>]`
in the subject. `GET /api/cron/email?dryRun=1` with the bearer says what's due
without sending.
