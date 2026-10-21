import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { cookies, headers } from "next/headers";
import { LANG_COOKIE, LANGS, SESSION_COOKIE, isLang, purchaseLang, purchasesOf, readSession, type Lang } from "@/lib/account";
import { COUNTRY_COOKIE } from "@/lib/geo";
import { SUPPORT } from "@/lib/ses";
import { LANG_NAMES, copyFor } from "./copy";
import { LoginForm } from "./LoginForm";
import a from "./account.module.css";

// The customer login, m.thegrind.studio/account (grind-studio-landing-pages
// forwards it here): signed out, the email form; signed in, every purchase
// with its downloads (lib/account.ts).
// Language: the one picked with the switch, else the language of the funnel
// the buyer last bought in, else the browser's / the country's.
export const dynamic = "force-dynamic";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-poppins" });

const FRENCH_COUNTRIES = new Set(["FR", "BE", "LU", "MC", "CH", "CA", "SN", "CI", "MA", "TN", "DZ"]);
const SPANISH_COUNTRIES = new Set(["ES", "MX", "AR", "CO", "CL", "PE", "VE", "EC", "GT", "CU", "BO", "DO", "HN", "PY", "SV", "NI", "CR", "PA", "UY", "PR"]);
const DATES: Record<Lang, string> = { en: "en-US", fr: "fr-FR", es: "es-ES" };

async function guessLang(): Promise<Lang> {
  const h = await headers();
  const jar = await cookies();
  const accept = (h.get("accept-language") ?? "").toLowerCase();
  if (accept.startsWith("fr")) return "fr";
  if (accept.startsWith("es")) return "es";
  if (accept) return "en";
  const country = jar.get(COUNTRY_COOKIE)?.value ?? "";
  return FRENCH_COUNTRIES.has(country) ? "fr" : SPANISH_COUNTRIES.has(country) ? "es" : "en";
}

async function pageState() {
  const jar = await cookies();
  const session = readSession(jar.get(SESSION_COOKIE)?.value);
  const purchases = session ? await purchasesOf(session.e) : [];
  const chosen = jar.get(LANG_COOKIE)?.value;
  const lang: Lang = isLang(chosen) ? chosen : session ? (purchaseLang(purchases) ?? session.l) : await guessLang();
  return { session, purchases, lang };
}

export async function generateMetadata(): Promise<Metadata> {
  const jar = await cookies();
  const chosen = jar.get(LANG_COOKIE)?.value;
  const lang = isLang(chosen) ? chosen : await guessLang();
  return { title: copyFor(lang).meta, robots: { index: false, follow: false } };
}

export default async function Account({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const { expired } = await searchParams;
  const { session, purchases, lang } = await pageState();
  const c = copyFor(lang);
  const date = new Intl.DateTimeFormat(DATES[lang], { day: "numeric", month: "long", year: "numeric" });

  return (
    <main className={`${a.page} ${poppins.variable}`} lang={lang}>
      <header className={a.top}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={a.logo} src="/funnels/midi-drum-kit/logo.webp" alt="GRIND STUDIO" width={360} height={42} />
        <nav className={a.tools} aria-label="Language">
          {LANGS.map((l) => (
            <a key={l} href={`/api/checkout/account/session?lang=${l}`} className={l === lang ? a.langOn : a.lang} aria-current={l === lang ? "true" : undefined} hrefLang={l} lang={l}>
              {l.toUpperCase()}
              <span className={a.hidden}> {LANG_NAMES[l]}</span>
            </a>
          ))}
          {session && (
            <form method="post" action="/api/checkout/account/session">
              <button className={a.signOut} type="submit">
                {c.signOut}
              </button>
            </form>
          )}
        </nav>
      </header>

      {session ? (
        <section className={a.library}>
          <h1 className={a.title}>{c.hello}</h1>
          <p className={a.lead}>{c.sub(session.e)}</p>
          {purchases.length === 0 && <p className={a.none}>{c.none}</p>}
          <ul className={a.items}>
            {purchases.map((p) => (
              <li key={p.order.id} className={a.item}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={a.cover} src={p.cover} alt="" width={120} height={120} loading="lazy" decoding="async" />
                <div className={a.itemBody}>
                  <h2 className={a.name}>{p.name}</h2>
                  <p className={a.date}>{c.bought(date.format(p.date))}</p>
                  <div className={a.files}>
                    {p.files.map((f, i) => (
                      <a key={f.key} className={i === 0 ? a.file : a.fileAlt} href={f.href}>
                        <svg viewBox="0 0 512 512" aria-hidden width="14" height="14">
                          <path
                            fill="currentColor"
                            d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32v242.7l-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7V32zM64 352c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64v-32c0-35.3-28.7-64-64-64H346.5l-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352H64z"
                          />
                        </svg>
                        {c.download} {f.label}
                      </a>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className={a.card}>
          <h1 className={a.title}>{c.title}</h1>
          <p className={a.lead}>{c.lead}</p>
          <ol className={a.steps}>
            {c.steps.map((s, i) => (
              <li key={s} className={a.step}>
                <span className={a.num} aria-hidden>
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
          {expired && (
            <p className={a.notice} role="alert">
              {c.expired}
            </p>
          )}
          <LoginForm
            key={lang}
            lang={lang}
            words={{
              label: c.label,
              placeholder: c.placeholder,
              button: c.button,
              busy: c.busy,
              invalid: c.invalid,
              failed: c.failed,
              wait: c.wait,
              off: c.off,
              sentTitle: c.sentTitle,
              sentLead: c.sentLead("{email}"),
              sentHelp: c.sentHelp,
              again: c.again,
              dev: c.dev,
            }}
          />
        </section>
      )}

      <p className={a.support}>
        {c.support} <a href={`mailto:${SUPPORT}`}>{SUPPORT}</a>
      </p>
    </main>
  );
}
