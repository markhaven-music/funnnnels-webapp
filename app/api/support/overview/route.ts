import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { generateOverview, getOverview, overviewConfigured } from "@/lib/supportOverview";

export const runtime = "nodejs";
export const maxDuration = 120;

// Dashboard → Support → AI Overview (lib/supportOverview.ts). GET: the saved
// one and whether the inbox changed since; POST: a new one ({ force: true }
// asks again even if nothing changed).
export async function GET() {
  return NextResponse.json({ configured: overviewConfigured(), ...(await getOverview()) });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { force?: boolean } | null;
  try {
    return NextResponse.json(await generateOverview(Boolean(body?.force)));
  } catch (err) {
    console.error("support overview failed", err);
    // The API's own sentence, not its JSON.
    const apiMessage = err instanceof Anthropic.APIError ? ((err.error as { error?: { message?: string } } | undefined)?.error?.message ?? err.message) : "";
    const message = /credit balance/i.test(apiMessage)
      ? "The Anthropic account has no credit left: add some at console.anthropic.com → Plans & Billing, then press Refresh."
      : err instanceof Anthropic.AuthenticationError
        ? "The Anthropic API key was rejected."
        : err instanceof Anthropic.RateLimitError
          ? "Rate limited by Anthropic, try again in a minute."
          : err instanceof Anthropic.APIError
            ? `Anthropic API error ${err.status}: ${apiMessage}`
            : err instanceof Error
              ? err.message
              : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
