import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_DAYS, readLink, sessionToken } from "@/lib/account";

export const runtime = "nodejs";

// The link in the sign-in email: a valid one signs the browser in for 30 days
// and opens the purchases; an expired one goes back to the form, saying so.
// Relative redirects, so the buyer stays on the domain the link was for.
export async function GET(req: Request) {
  const claims = readLink(new URL(req.url).searchParams.get("t"));
  if (!claims) return new NextResponse(null, { status: 303, headers: { location: "/account?expired=1" } });
  const res = new NextResponse(null, { status: 303, headers: { location: "/account" } });
  res.cookies.set(SESSION_COOKIE, sessionToken(claims.e, claims.l), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
  return res;
}
