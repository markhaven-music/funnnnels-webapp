import type { Metadata } from "next";
import { readUnsubscribeToken } from "@/lib/mail";
import { SUPPORT } from "@/lib/ses";

// The page behind every newsletter's unsubscribe link. Leaving takes a tap
// (a link checker opening the URL must not unsubscribe anyone); the form
// posts to /api/email/unsubscribe and comes back here with done=1.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Unsubscribe · Grind Studio", robots: { index: false, follow: false } };

export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ t?: string; done?: string }> }) {
  const { t, done } = await searchParams;
  const email = readUnsubscribeToken(t);
  return (
    <main style={{ minHeight: "100vh", background: "#0b0b0b", color: "#fff", display: "grid", placeItems: "center", padding: "48px 16px", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div style={{ maxWidth: 460, width: "100%", background: "#161616", border: "1px solid #2a2a2a", borderRadius: 20, padding: "44px 32px", textAlign: "center" }}>
        <p style={{ margin: 0, fontWeight: 700, letterSpacing: ".2em", fontSize: 14 }}>GRIND ◆ STUDIO</p>
        {!email ? (
          <>
            <h1 style={{ fontSize: 26, margin: "32px 0 12px" }}>This link doesn&rsquo;t work</h1>
            <p style={{ color: "#bbb", lineHeight: 1.6 }}>
              Write to <a href={`mailto:${SUPPORT}?subject=unsubscribe`} style={{ color: "#fff" }}>{SUPPORT}</a> and we take you off the list.
            </p>
          </>
        ) : done ? (
          <>
            <h1 style={{ fontSize: 26, margin: "32px 0 12px" }}>You&rsquo;re unsubscribed</h1>
            <p style={{ color: "#bbb", lineHeight: 1.6 }}>{email} won&rsquo;t get our newsletter any more. Receipts for things you buy still arrive.</p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 26, margin: "32px 0 12px" }}>Unsubscribe?</h1>
            <p style={{ color: "#bbb", lineHeight: 1.6 }}>{email} will stop getting our newsletter.</p>
            <form method="post" action="/api/email/unsubscribe" style={{ marginTop: 28 }}>
              <input type="hidden" name="t" value={t} />
              <input type="hidden" name="from" value="page" />
              <button type="submit" style={{ background: "#22c55e", color: "#04140a", border: 0, borderRadius: 12, padding: "16px 28px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                Unsubscribe me
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
