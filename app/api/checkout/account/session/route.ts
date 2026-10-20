import { NextResponse } from "next/server";
import { LANG_COOKIE, SESSION_COOKIE, isLang } from "@/lib/account";

export const runtime = "nodejs";

// /account's two small forms: ?lang=fr|en (the language switch, remembered a
// year) and a POST with action=signout.
export async function GET(req: Request) {
  const lang = new URL(req.url).searchParams.get("lang");
  const res = new NextResponse(null, { status: 303, headers: { location: "/account" } });
  if (isLang(lang)) res.cookies.set(LANG_COOKIE, lang, { path: "/", sameSite: "lax", maxAge: 365 * 86_400 });
  return res;
}

export async function POST() {
  const res = new NextResponse(null, { status: 303, headers: { location: "/account" } });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
