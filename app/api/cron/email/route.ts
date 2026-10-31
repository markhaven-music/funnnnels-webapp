import { runOutbox } from "@/lib/outbox";
import { sweepStripe } from "@/lib/stripeSales";

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
  const recovered = dryRun
    ? 0
    : await sweepStripe().catch((err) => {
        console.error("stripe sweep failed", err);
        return 0;
      });
  if (recovered) console.log(`stripe sweep: ${recovered} order(s) recorded`);
  const report = await runOutbox({ budgetMs: 40_000, dryRun });
  const total = report.receipts + report.backups + report.reminders + report.sequence + report.broadcast + report.launch;
  if (total || report.failed || report.stopped) console.log(`email job${dryRun ? " (dry run)" : ""}`, JSON.stringify(report));
  return Response.json({ dryRun, recovered, ...report });
}
