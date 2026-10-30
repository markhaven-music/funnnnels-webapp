import { runOutbox } from "@/lib/outbox";

export const runtime = "nodejs";
export const maxDuration = 60;

// The email job (lib/outbox.ts), called every minute by Supabase pg_cron
// (db/email-schedule.sql) with `Authorization: Bearer $CRON_SECRET`.
// ?dryRun=1 says what it would send, without sending or marking anything.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1";
  const report = await runOutbox({ budgetMs: 45_000, dryRun });
  const total = report.receipts + report.backups + report.reminders + report.sequence + report.broadcast + report.launch;
  if (total || report.failed || report.stopped) console.log(`email job${dryRun ? " (dry run)" : ""}`, JSON.stringify(report));
  return Response.json({ dryRun, ...report });
}
