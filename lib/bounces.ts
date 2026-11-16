import { listSuppressed, sesConfigured } from "@/lib/ses";
import { supabase } from "@/lib/supabase";

// Hard bounces and spam complaints back into the contacts table.
//
// SES puts every hard-bounced or complaining address on the account's
// suppression list and refuses to send to it again; this copies that list onto
// contacts.status ("bounced" / "complained"), so broadcasts, sequences and
// reminders leave them out and the dashboard's numbers stop counting them.
// Only contacts still "subscribed" change: an unsubscribe stays an unsubscribe.
// Run by /api/cron/email twice an hour with a 3-day window (overlap is free:
// the update is idempotent), or with a longer window by hand.

export async function syncSuppressions(sinceDays = 3): Promise<{ bounced: number; complained: number }> {
  if (!sesConfigured()) return { bounced: 0, complained: 0 };
  const list = await listSuppressed(new Date(Date.now() - sinceDays * 86_400_000));
  const db = supabase();
  const out = { bounced: 0, complained: 0 };
  for (const reason of ["BOUNCE", "COMPLAINT"] as const) {
    const emails = list.filter((s) => s.reason === reason).map((s) => s.email);
    const status = reason === "BOUNCE" ? "bounced" : "complained";
    for (let i = 0; i < emails.length; i += 500) {
      const { data, error } = await db
        .from("contacts")
        .update({ status, unsubscribed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .in("email", emails.slice(i, i + 500))
        .eq("status", "subscribed")
        .select("id");
      if (error) throw error;
      out[status] += data?.length ?? 0;
    }
  }
  return out;
}
