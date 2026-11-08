import { runOutbox } from "@/lib/outbox";
import { sweepStripe } from "@/lib/stripeSales";
import { syncSupport } from "@/lib/support";

export const runtime = "nodejs";
export const maxDuration = 60;

// The email job (lib/outbox.ts), called every minute by Supabase pg_cron
// (db/email-schedule.sql) with `Authorization: Bearer $CRON_SECRET`.
// ?dryRun=1 says what it would send, without sending or marking anything.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1";
  // First the card orders nobody told us about (a tab closed before any of our
  // pages), so their receipts go out in this same run.
  // The Stripe sweep and the support mailbox run every 5th minute only: each
  // run costs Vercel CPU time (free plan: 4 h a month), and both are safety
  // nets, not the main path (webhooks record orders; support isn't urgent).
  const slow = new Date().getUTCMinutes() % 5 === 0;
  const recovered = dryRun || !slow
    ? 0
    : await sweepStripe().catch((err) => {
        console.error("stripe sweep failed", err);
        return 0;
      });
  if (recovered) console.log(`stripe sweep: ${recovered} order(s) recorded`);
  // The support mailbox (dashboard → Support), copied alongside the emails.
  const support = dryRun || !slow
    ? null
    : syncSupport().catch((err) => {
        console.error("support sync failed", err);
        return { error: String(err) };
      });
  const report = await runOutbox({ budgetMs: 40_000, dryRun });
  const supportReport = await support;
  if (supportReport && ("error" in supportReport || ("inbox" in supportReport && supportReport.inbox + supportReport.sent > 0))) console.log("support sync", JSON.stringify(supportReport));
  const total = report.receipts + report.backups + report.reminders + report.sequence + report.broadcast + report.launch;
  if (total || report.failed || report.stopped) console.log(`email job${dryRun ? " (dry run)" : ""}`, JSON.stringify(report));
  return Response.json({ dryRun, recovered, support: supportReport, ...report });
}
